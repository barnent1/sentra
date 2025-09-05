const nodemiral = require('@zodern/nodemiral');
const fs = require('fs-extra');
const path = require('path');
const tar = require('tar');
const chalk = require('chalk');

class MupBundleDeployer {
  constructor(config, options = {}) {
    this.config = config;
    this.options = options;
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

  async createBundle() {
    this.log('Creating deployment bundle...');
    
    const projectRoot = path.resolve(__dirname, '../..');
    const bundlePath = path.join(__dirname, `../bundle-${this.deploymentId}.tar.gz`);
    
    // Create bundle using tar (like MUP does)
    await tar.c(
      {
        gzip: true,
        file: bundlePath,
        cwd: projectRoot,
        filter: (path, stat) => {
          // Exclude certain directories and files (like MUP does)
          const excludePatterns = [
            /^node_modules\//,
            /^\.git\//,
            /^deploy\//,  
            /\.log$/,
            /^\.env$/,
            /\.tar\.gz$/,
            /\.DS_Store$/,
            /^tmp\//,
            /^\.bmad-core\//,
            /^\.claude\//
          ];
          
          // But always include certain critical files from deploy
          if (path === 'deploy/docker-compose.yml') {
            return false;  // Exclude the deploy docker-compose.yml to use root one
          }
          
          return !excludePatterns.some(pattern => pattern.test(path));
        }
      },
      ['.'] // Bundle everything from project root
    );
    
    const stats = fs.statSync(bundlePath);
    this.log(`Bundle created: ${(stats.size / 1024 / 1024).toFixed(2)}MB`, 'success');
    
    return bundlePath;
  }

  async setup() {
    this.log('Setting up Sentra servers...');
    
    const sessions = this.createSessions();
    const taskList = nodemiral.taskList('Setup');

    // Install Docker and dependencies  
    taskList.executeScript('Installing Docker', {
      script: path.resolve(__dirname, '../scripts/setup-docker.sh'),
      vars: {
        SETUP_DOCKER: true,
        SETUP_FIREWALL: true
      }
    });

    // Create directories and setup
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

  async push() {
    this.log('Pushing Sentra bundle to servers...');
    
    // Create bundle (like MUP does)
    const bundlePath = await this.createBundle();
    
    // Upload using reliable SCP approach
    await this.executeOnAllServers('Uploading bundle', async (serverName) => {
      await this.scpUpload(serverName, bundlePath, `/tmp/sentra-bundle-${this.deploymentId}.tar.gz`);
    });

    // Copy environment file if it exists
    const envPath = path.resolve(__dirname, '../../.env.production');
    if (fs.existsSync(envPath)) {
      await this.executeOnAllServers('Uploading environment', async (serverName) => {
        await this.scpUpload(serverName, envPath, `/tmp/sentra-env-${this.deploymentId}`);
      });
    }
    
    // Clean up local bundle
    fs.unlinkSync(bundlePath);
    
    this.log('Bundle uploaded successfully!', 'success');
  }

  async scpUpload(serverName, localPath, remotePath) {
    const server = this.config.servers[serverName];
    const pemPath = server.pem.replace('~', require('os').homedir());
    
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const scpArgs = [
        '-i', pemPath,
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null',
        localPath,
        `${server.username}@${server.host}:${remotePath}`
      ];

      this.log(`    Copying ${path.basename(localPath)}...`);
      const scp = spawn('scp', scpArgs, { stdio: 'pipe' });
      
      scp.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`File copy failed with exit code ${code}`));
        }
      });

      scp.on('error', reject);
    });
  }

  async executeOnAllServers(taskName, taskFn) {
    this.log(`${taskName}...`);
    
    const serverNames = Object.keys(this.config.servers);
    for (const serverName of serverNames) {
      this.log(`  → ${serverName}`);
      await taskFn(serverName);
    }
    
    this.log(`${taskName} completed!`, 'success');
  }

  async deploy() {
    this.log('Deploying Sentra...');
    
    await this.executeOnAllServers('Deploying Sentra', async (serverName) => {
      await this.executeScript(serverName, path.resolve(__dirname, '../scripts/mup-deploy.sh'), {
        DEPLOYMENT_ID: this.deploymentId,
        APP_NAME: this.config.app.name,
        ENV_VARS: JSON.stringify(this.config.app.env || {}),
        HAS_ENV_FILE: fs.existsSync(path.resolve(__dirname, '../../.env.production')).toString()
      });
    });
    
    this.log('Deployment completed successfully!', 'success');
  }

  async executeScript(serverName, scriptPath, vars = {}) {
    const server = this.config.servers[serverName];
    const pemPath = server.pem.replace('~', require('os').homedir());
    
    // Read and process script template
    let scriptContent = fs.readFileSync(scriptPath, 'utf8');
    
    // Replace template variables
    Object.keys(vars).forEach(key => {
      const regex = new RegExp(`<%=\\s*${key}\\s*%>`, 'g');
      scriptContent = scriptContent.replace(regex, vars[key]);
    });

    // Create temporary script file
    const tempScriptPath = `/tmp/deploy-script-${Date.now()}.sh`;
    
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      
      // Write script content to temporary local file
      const localTempScript = `/tmp/local-script-${Date.now()}.sh`;
      fs.writeFileSync(localTempScript, scriptContent);
      
      // Copy script to server
      const scpArgs = [
        '-i', pemPath,
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null',
        localTempScript,
        `${server.username}@${server.host}:${tempScriptPath}`
      ];
      
      const scp = spawn('scp', scpArgs, { stdio: 'pipe' });
      
      scp.on('close', (code) => {
        if (code !== 0) {
          fs.unlinkSync(localTempScript);
          return reject(new Error(`SCP failed with exit code ${code}`));
        }

        // Execute script on server
        const sshArgs = [
          '-i', pemPath,
          '-o', 'StrictHostKeyChecking=no',
          '-o', 'UserKnownHostsFile=/dev/null',
          `${server.username}@${server.host}`,
          `chmod +x ${tempScriptPath} && ${tempScriptPath} && rm ${tempScriptPath}`
        ];

        const ssh = spawn('ssh', sshArgs, { stdio: 'inherit' });
        
        ssh.on('close', (exitCode) => {
          fs.unlinkSync(localTempScript);
          if (exitCode === 0) {
            resolve();
          } else {
            reject(new Error(`Script execution failed with exit code ${exitCode}`));
          }
        });

        ssh.on('error', (err) => {
          fs.unlinkSync(localTempScript);
          reject(err);
        });
      });

      scp.on('error', (err) => {
        fs.unlinkSync(localTempScript);
        reject(err);
      });
    });
  }

  async fullDeploy() {
    // Complete MUP-style deployment: push + deploy
    await this.push();
    await this.deploy();
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

module.exports = MupBundleDeployer;