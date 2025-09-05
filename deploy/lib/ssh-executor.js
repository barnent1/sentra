const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

class SSHExecutor {
  constructor(config) {
    this.config = config;
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

  async executeCommand(serverName, command) {
    const server = this.config.servers[serverName];
    const pemPath = server.pem.replace('~', require('os').homedir());
    
    return new Promise((resolve, reject) => {
      const sshArgs = [
        '-i', pemPath,
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null',
        `${server.username}@${server.host}`,
        command
      ];

      const ssh = spawn('ssh', sshArgs, { stdio: 'inherit' });
      
      ssh.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      ssh.on('error', reject);
    });
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
      // Upload script
      const scpArgs = [
        '-i', pemPath,
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null'
      ];

      // Write script content to temporary local file
      const localTempScript = `/tmp/local-script-${Date.now()}.sh`;
      fs.writeFileSync(localTempScript, scriptContent);
      
      // Copy script to server
      const scp = spawn('scp', [...scpArgs, localTempScript, `${server.username}@${server.host}:${tempScriptPath}`], { stdio: 'inherit' });
      
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

  async copyFile(serverName, localPath, remotePath, showProgress = false) {
    const server = this.config.servers[serverName];
    const pemPath = server.pem.replace('~', require('os').homedir());
    
    return new Promise((resolve, reject) => {
      const scpArgs = [
        '-i', pemPath,
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null',
        localPath,
        `${server.username}@${server.host}:${remotePath}`
      ];

      if (showProgress) {
        this.log(`Copying ${path.basename(localPath)}...`);
      }

      const scp = spawn('scp', scpArgs, { stdio: showProgress ? 'inherit' : 'pipe' });
      
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
}

module.exports = SSHExecutor;