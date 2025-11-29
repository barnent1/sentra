/**
 * Quetrex Runner
 *
 * A job execution agent that runs on user infrastructure.
 * Polls the Quetrex API for jobs and executes them using Claude Code CLI.
 */

import express from 'express';
import { spawn, execFile } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';
import winston from 'winston';

// Configuration
interface RunnerConfig {
  runner_id: string;
  user_id: string;
  quetrex: {
    api_url: string;
    api_key: string;
  };
  runner: {
    max_concurrent_jobs: number;
    workspace_path: string;
    log_level: string;
  };
  github?: {
    token: string;
  };
  anthropic?: {
    session_token: string;
  };
}

interface Job {
  id: string;
  repo: string;
  issue_number: number;
  branch?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
}

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

// Global state
let config: RunnerConfig;
let currentJobs: Map<string, Job> = new Map();
let jobQueue: Job[] = [];

// Load configuration
function loadConfig(): RunnerConfig {
  const configPath = process.env.CONFIG_PATH || '/app/config.yml';

  if (!existsSync(configPath)) {
    // Fall back to environment variables
    return {
      runner_id: process.env.QUETREX_RUNNER_ID || 'unknown',
      user_id: process.env.QUETREX_USER_ID || 'unknown',
      quetrex: {
        api_url: process.env.QUETREX_API_URL || 'https://quetrex.com/api',
        api_key: process.env.QUETREX_API_KEY || '',
      },
      runner: {
        max_concurrent_jobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '1', 10),
        workspace_path: process.env.WORKSPACE_PATH || '/workspace',
        log_level: process.env.LOG_LEVEL || 'info',
      },
    };
  }

  const configContent = readFileSync(configPath, 'utf-8');
  return parse(configContent) as RunnerConfig;
}

// Health check handler
function getHealthStatus() {
  return {
    status: 'healthy',
    runner_id: config.runner_id,
    current_jobs: Array.from(currentJobs.keys()),
    queue_length: jobQueue.length,
    max_concurrent_jobs: config.runner.max_concurrent_jobs,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
}

// Report status to Quetrex API
async function reportStatus(status: string, jobId?: string): Promise<void> {
  try {
    await fetch(`${config.quetrex.api_url}/runners/${config.runner_id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.quetrex.api_key}`,
      },
      body: JSON.stringify({
        status,
        job_id: jobId,
        current_jobs: Array.from(currentJobs.keys()),
        queue_length: jobQueue.length,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    logger.error(`Failed to report status: ${error}`);
  }
}

// Poll for new jobs
async function pollForJobs(): Promise<void> {
  try {
    const response = await fetch(`${config.quetrex.api_url}/runners/${config.runner_id}/jobs`, {
      headers: {
        'Authorization': `Bearer ${config.quetrex.api_key}`,
      },
    });

    if (!response.ok) {
      logger.warn(`Failed to poll for jobs: ${response.status}`);
      return;
    }

    const data = await response.json() as { jobs: Job[] };

    for (const job of data.jobs) {
      if (!currentJobs.has(job.id) && !jobQueue.find(j => j.id === job.id)) {
        logger.info(`Received new job: ${job.id} for ${job.repo}#${job.issue_number}`);
        jobQueue.push(job);
      }
    }
  } catch (error) {
    logger.error(`Error polling for jobs: ${error}`);
  }
}

// Execute a job using Claude Code CLI
async function executeJob(job: Job): Promise<void> {
  const workDir = `${config.runner.workspace_path}/${job.repo.replace('/', '_')}`;

  logger.info(`Starting job ${job.id}: ${job.repo}#${job.issue_number}`);
  currentJobs.set(job.id, { ...job, status: 'running' });
  await reportStatus('running', job.id);

  try {
    // Clone or update repository
    const [owner, repo] = job.repo.split('/');

    if (!existsSync(workDir)) {
      // Clone the repository
      await execCommand('git', [
        'clone',
        `https://github.com/${job.repo}.git`,
        workDir,
      ]);

      // Install Quetrex skills, agents, and hooks using create-quetrex
      logger.info(`Installing Quetrex configuration for ${job.repo}`);
      await execCommand('npx', ['create-quetrex', '--yes'], { cwd: workDir });
      logger.info('Quetrex configuration installed successfully');
    } else {
      // Pull latest changes
      await execCommand('git', ['-C', workDir, 'fetch', '--all']);
      await execCommand('git', ['-C', workDir, 'checkout', 'main']);
      await execCommand('git', ['-C', workDir, 'pull']);

      // Update Quetrex configuration if needed
      await execCommand('npx', ['create-quetrex', '--update', '--yes'], { cwd: workDir });
    }

    // Create a branch for this issue
    const branchName = job.branch || `issue-${job.issue_number}`;
    await execCommand('git', ['-C', workDir, 'checkout', '-B', branchName]);

    // Run Claude Code to process the issue
    const claudePrompt = `Process GitHub issue #${job.issue_number} from repository ${job.repo}.
Read the issue, understand the requirements, and implement the necessary changes.
Create appropriate tests for your changes.
Commit your changes with a descriptive message referencing the issue.`;

    logger.info(`Executing Claude Code for job ${job.id}`);

    // Execute Claude Code CLI
    const result = await execCommand('claude', [
      '--print',
      '--yes',
      claudePrompt,
    ], { cwd: workDir });

    logger.info(`Claude Code completed for job ${job.id}`);

    // Push changes and create PR
    await execCommand('git', ['-C', workDir, 'push', '-u', 'origin', branchName]);

    // Create PR using GitHub CLI
    const prResult = await execCommand('gh', [
      'pr', 'create',
      '--repo', job.repo,
      '--title', `[AI] Fixes #${job.issue_number}`,
      '--body', `This PR was automatically generated by Quetrex AI Runner.\n\nCloses #${job.issue_number}`,
      '--head', branchName,
    ], { cwd: workDir });

    logger.info(`Created PR for job ${job.id}`);

    // Report success
    currentJobs.delete(job.id);
    await reportJobComplete(job.id, 'completed', prResult);

  } catch (error) {
    logger.error(`Job ${job.id} failed: ${error}`);
    currentJobs.delete(job.id);
    await reportJobComplete(job.id, 'failed', String(error));
  }
}

// Report job completion to Quetrex API
async function reportJobComplete(jobId: string, status: 'completed' | 'failed', result: string): Promise<void> {
  try {
    await fetch(`${config.quetrex.api_url}/runners/${config.runner_id}/jobs/${jobId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.quetrex.api_key}`,
      },
      body: JSON.stringify({
        status,
        result,
        completed_at: new Date().toISOString(),
      }),
    });
  } catch (error) {
    logger.error(`Failed to report job completion: ${error}`);
  }
}

// Execute a command safely
function execCommand(command: string, args: string[], options?: { cwd?: string }): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd: options?.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });

    proc.on('error', (error) => {
      reject(error);
    });
  });
}

// Process job queue
async function processQueue(): Promise<void> {
  while (currentJobs.size < config.runner.max_concurrent_jobs && jobQueue.length > 0) {
    const job = jobQueue.shift();
    if (job) {
      // Don't await - run in background
      executeJob(job).catch((error) => {
        logger.error(`Error executing job: ${error}`);
      });
    }
  }
}

// Main loop
async function mainLoop(): Promise<void> {
  logger.info('Starting main loop');

  // Report initial status
  await reportStatus('online');

  // Poll for jobs every 10 seconds
  setInterval(async () => {
    await pollForJobs();
    await processQueue();
  }, 10000);

  // Report heartbeat every 30 seconds
  setInterval(async () => {
    await reportStatus('heartbeat');
  }, 30000);
}

// Start server
async function startServer(): Promise<void> {
  const app = express();
  const port = parseInt(process.env.PORT || '8080', 10);

  app.use(express.json());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json(getHealthStatus());
  });

  // Manual job submission (for testing)
  app.post('/job', (req, res) => {
    const { repo, issue_number } = req.body;

    if (!repo || !issue_number) {
      return res.status(400).json({ error: 'Missing repo or issue_number' });
    }

    const job: Job = {
      id: `manual-${Date.now()}`,
      repo,
      issue_number,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    jobQueue.push(job);
    logger.info(`Added manual job: ${job.id}`);

    res.json({ status: 'queued', job_id: job.id });
  });

  // Cancel current job (for emergency)
  app.post('/job/cancel', (req, res) => {
    // In a real implementation, this would kill the running process
    logger.warn('Job cancellation requested');
    res.json({ status: 'cancellation_requested' });
  });

  // Update runner (pull latest image)
  app.post('/update', (req, res) => {
    logger.info('Update requested - this would trigger docker pull in production');
    res.json({ status: 'update_scheduled' });
  });

  app.listen(port, '0.0.0.0', () => {
    logger.info(`Runner server listening on port ${port}`);
  });
}

// Main entry point
async function main(): Promise<void> {
  logger.info('Quetrex Runner starting...');

  // Load configuration
  config = loadConfig();
  logger.info(`Runner ID: ${config.runner_id}`);
  logger.info(`User ID: ${config.user_id}`);
  logger.info(`Max concurrent jobs: ${config.runner.max_concurrent_jobs}`);

  // Start HTTP server
  await startServer();

  // Start main processing loop
  await mainLoop();
}

main().catch((error) => {
  logger.error(`Fatal error: ${error}`);
  process.exit(1);
});
