const nodemiral = require('@zodern/nodemiral');
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const chalk = require('chalk');
const { v4: uuidv4 } = require('uuid');

class MupStyleDeployer {
  constructor(config, options = {}) {
    this.config = config;
    this.options = options;
    this.sessionMap = new Map();
    this.deploymentId = new Date().toISOString().replace(/[:.]/g, '-');
  }

  log(message, type = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      error: chalk.red,
      warn: chalk.yellow,
      debug: chalk.gray
    };
    const colorFn = colors[type] || chalk.white;
    console.log(colorFn(message));
  }

  createSessions() {
    const sessions = {};
    Object.keys(this.config.servers).forEach(serverName => {
      const server = this.config.servers[serverName];
      const host = server.host;
      const auth = {};

      if (server.pem) {
        const pemPath = server.pem.replace('~', require('os').homedir());
        auth.pem = pemPath;
      } else if (server.password) {
        auth.password = server.password;
      }

      sessions[serverName] = nodemiral.session(host, {
        username: server.username,
        port: server.port || 22,
        ...auth
      }, {
        ssh: {
          'StrictHostKeyChecking': 'no',
          'UserKnownHostsFile': '/dev/null'
        }
      });
    });

    return sessions;
  }

  async executeTask(taskList, sessionMap) {
    return new Promise((resolve, reject) => {
      taskList.run(sessionMap, (summaryMap) => {
        Object.keys(summaryMap).forEach(serverName => {
          const summary = summaryMap[serverName];
          if (summary.error) {
            this.log(`Error on ${serverName}:`, 'error');
            console.error(summary.error);
            return reject(summary.error);
          }
        });
        resolve(summaryMap);
      });
    });
  }

  async setup() {
    this.log('Setting up Sentra servers...');
    
    const sessions = this.createSessions();
    const taskList = nodemiral.taskList('Setup');

    // Update system and install dependencies  
    taskList.executeScript('Installing Docker', {
      script: path.resolve(__dirname, '../scripts/setup-docker.sh'),
      vars: {
        SETUP_DOCKER: true,
        SETUP_FIREWALL: true
      }
    });

    // Create directories and users
    taskList.executeScript('Setting up Sentra directories', {
      script: path.resolve(__dirname, '../scripts/setup-sentra.sh'),
      vars: {
        APP_NAME: this.config.app.name,
        SETUP_SERVICE: true
      }
    });

    await this.executeTask(taskList, sessions);
    this.log('Server setup completed successfully!', 'success');
  }

  async buildBundle() {
    this.log('Building deployment bundle...');
    
    const projectRoot = path.resolve(__dirname, '../..');
    const bundlePath = path.join(__dirname, `../sentra-${this.deploymentId}.tar.gz`);
    
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(bundlePath);
      const archive = archiver('tar', { gzip: true });

      output.on('close', () => {
        this.log(`Bundle created: ${(archive.pointer() / 1024 / 1024).toFixed(2)}MB`, 'success');
        resolve(bundlePath);
      });

      archive.on('error', reject);
      archive.pipe(output);

      // Add all project files except excluded ones
      archive.glob('**/*', {
        cwd: projectRoot,
        ignore: [
          'node_modules/**',
          '.git/**',
          'deploy/**',
          '*.log',
          '.env',
          '*.tar.gz',
          '.DS_Store',
          'tmp/**'
        ]
      });

      archive.finalize();
    });
  }

  async deploy() {
    this.log('Starting Sentra deployment...');
    
    // Build bundle
    const bundlePath = await this.buildBundle();
    
    const sessions = this.createSessions();
    const taskList = nodemiral.taskList('Deploy');

    // Copy bundle to server
    taskList.copy('Uploading bundle', {
      src: bundlePath,
      dest: `/tmp/sentra-${this.deploymentId}.tar.gz`,
      progressBar: true
    });

    // Copy environment file if it exists
    const envPath = path.resolve(__dirname, '../../.env.production');
    if (fs.existsSync(envPath)) {
      taskList.copy('Uploading environment', {
        src: envPath,
        dest: `/tmp/sentra-${this.deploymentId}.env`
      });
    }

    // Execute deployment
    taskList.executeScript('Deploying Sentra', {
      script: path.resolve(__dirname, '../scripts/deploy.sh'),
      vars: {
        DEPLOYMENT_ID: this.deploymentId,
        APP_NAME: this.config.app.name,
        ENV_VARS: JSON.stringify(this.config.app.env || {}),
        HAS_ENV_FILE: fs.existsSync(envPath)
      }
    });

    // Verify deployment
    taskList.executeScript('Verifying deployment', {
      script: path.resolve(__dirname, '../scripts/verify.sh'),
      vars: {
        APP_NAME: this.config.app.name,
        HEALTH_CHECK_URL: 'http://localhost:8000/health',
        WAIT_TIME: this.config.app.deployCheckWaitTime || 60
      }
    });

    await this.executeTask(taskList, sessions);
    
    // Cleanup local bundle
    fs.unlinkSync(bundlePath);
    
    this.log(`Deployment ${this.deploymentId} completed successfully!`, 'success');
  }

  async logs(options = {}) {
    const sessions = this.createSessions();
    const taskList = nodemiral.taskList('Logs');

    const follow = options.follow ? '-f' : '';
    const tail = options.tail ? `--tail ${options.tail}` : '--tail 100';

    taskList.execute('Fetching logs', {
      command: `cd /opt/${this.config.app.name}/current && /usr/local/bin/docker-compose logs ${follow} ${tail}`
    });

    await this.executeTask(taskList, sessions);
  }

  async restart() {
    const sessions = this.createSessions();
    const taskList = nodemiral.taskList('Restart');

    taskList.execute('Restarting services', {
      command: `cd /opt/${this.config.app.name}/current && /usr/local/bin/docker-compose restart`
    });

    await this.executeTask(taskList, sessions);
    this.log('Services restarted successfully!', 'success');
  }

  async rollback(version) {
    const sessions = this.createSessions();
    const taskList = nodemiral.taskList('Rollback');

    taskList.executeScript('Rolling back deployment', {
      script: path.resolve(__dirname, '../scripts/rollback.sh'),
      vars: {
        APP_NAME: this.config.app.name,
        ROLLBACK_VERSION: version || ''
      }
    });

    await this.executeTask(taskList, sessions);
    this.log('Rollback completed successfully!', 'success');
  }

  async status() {
    const sessions = this.createSessions();
    const taskList = nodemiral.taskList('Status');

    taskList.executeScript('Getting status', {
      script: path.resolve(__dirname, '../scripts/status.sh'),
      vars: {
        APP_NAME: this.config.app.name
      }
    });

    await this.executeTask(taskList, sessions);
  }
}

module.exports = MupStyleDeployer;