const { NodeSSH } = require('node-ssh');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const inquirer = require('inquirer');

class SentraDeployer {
  constructor(config, options = {}) {
    this.config = config;
    this.options = options;
    this.ssh = new NodeSSH();
    this.deploymentId = new Date().toISOString().replace(/[:.]/g, '-');
  }

  log(message, type = 'info') {
    if (this.options.verbose || type !== 'debug') {
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
  }

  async connectSSH(serverName = 'one') {
    const server = this.config.servers[serverName];
    if (!server) {
      throw new Error(`Server "${serverName}" not found in config`);
    }

    this.log(`Connecting to ${server.host}...`);
    
    const sshConfig = {
      host: server.host,
      username: server.username,
      port: server.port || 22
    };

    if (server.pem) {
      const pemPath = server.pem.replace('~', require('os').homedir());
      try {
        sshConfig.privateKey = fs.readFileSync(pemPath, 'utf8');
      } catch (error) {
        throw new Error(`Failed to read SSH key at ${pemPath}: ${error.message}`);
      }
    } else if (server.password) {
      sshConfig.password = server.password;
    }

    await this.ssh.connect(sshConfig);
    this.log(`Connected to ${server.host}`, 'success');
  }

  async executeCommand(command, options = {}) {
    this.log(`Executing: ${command}`, 'debug');
    const result = await this.ssh.execCommand(command, options);
    
    if (result.code !== 0) {
      this.log(`Command failed: ${command}`, 'error');
      this.log(`STDOUT: ${result.stdout}`, 'error');
      this.log(`STDERR: ${result.stderr}`, 'error');
      throw new Error(`Command failed with code ${result.code}: ${result.stderr}`);
    }
    
    if (this.options.verbose && result.stdout) {
      this.log(`STDOUT: ${result.stdout}`, 'debug');
    }
    
    return result;
  }

  async setup() {
    await this.connectSSH();

    this.log('Installing Docker and dependencies...');
    
    // Update system
    await this.executeCommand('sudo apt update && sudo apt upgrade -y');
    
    // Install Docker
    await this.executeCommand(`
      curl -fsSL https://get.docker.com -o get-docker.sh &&
      sudo sh get-docker.sh &&
      sudo usermod -aG docker $USER &&
      rm get-docker.sh
    `);

    // Install Docker Compose
    await this.executeCommand('sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose');
    await this.executeCommand('sudo chmod +x /usr/local/bin/docker-compose');

    // Create sentra user
    await this.executeCommand('sudo useradd -m -s /bin/bash -G docker sentra || true');
    
    // Create directories
    await this.executeCommand('sudo mkdir -p /opt/sentra/deployments /opt/sentra/current');
    await this.executeCommand('sudo chown -R sentra:sentra /opt/sentra');

    // Setup firewall
    await this.executeCommand(`
      sudo ufw --force reset &&
      sudo ufw default deny incoming &&
      sudo ufw default allow outgoing &&
      sudo ufw allow ssh &&
      sudo ufw allow 80/tcp &&
      sudo ufw allow 443/tcp &&
      sudo ufw --force enable
    `);

    // Install system monitoring
    await this.executeCommand('sudo apt install -y htop curl wget git');

    // Create deployment scripts
    await this.createDeploymentScripts();
    
    // Create systemd service for auto-restart
    await this.createSystemdService();

    this.log('Server setup completed successfully!', 'success');
    await this.ssh.dispose();
  }

  async createDeploymentScripts() {
    const deployScript = `#!/bin/bash
set -e

DEPLOYMENT_DIR="/opt/sentra/deployments/$1"
CURRENT_DIR="/opt/sentra/current"

echo "Deploying Sentra version $1..."

# Extract deployment
cd "$DEPLOYMENT_DIR"
tar -xzf bundle.tar.gz

# Backup current if exists
if [ -L "$CURRENT_DIR" ]; then
  BACKUP_DIR="/opt/sentra/backup/$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$(dirname "$BACKUP_DIR")"
  cp -r "$(readlink -f "$CURRENT_DIR")" "$BACKUP_DIR"
  echo "Backed up current deployment to $BACKUP_DIR"
fi

# Update symlink atomically
ln -sfn "$DEPLOYMENT_DIR" "$CURRENT_DIR.tmp"
mv "$CURRENT_DIR.tmp" "$CURRENT_DIR"

# Start services
cd "$CURRENT_DIR"
/usr/local/bin/docker-compose pull
/usr/local/bin/docker-compose up -d --build

echo "Deployment complete!"
`;

    const rollbackScript = `#!/bin/bash
set -e

BACKUP_DIR="\${1:-$(ls -1t /opt/sentra/backup/ | head -n1)}"
CURRENT_DIR="/opt/sentra/current"

if [ ! -d "/opt/sentra/backup/$BACKUP_DIR" ]; then
  echo "Backup $BACKUP_DIR not found!"
  exit 1
fi

echo "Rolling back to $BACKUP_DIR..."

# Stop current services
cd "$CURRENT_DIR" && /usr/local/bin/docker-compose down || true

# Restore backup
ln -sfn "/opt/sentra/backup/$BACKUP_DIR" "$CURRENT_DIR.tmp"
mv "$CURRENT_DIR.tmp" "$CURRENT_DIR"

# Start services
cd "$CURRENT_DIR"
/usr/local/bin/docker-compose up -d

echo "Rollback complete!"
`;

    // Write scripts locally then upload
    const fs = require('fs');
    const tmpDeployScript = '/tmp/deploy-script.sh';
    const tmpRollbackScript = '/tmp/rollback-script.sh';
    
    fs.writeFileSync(tmpDeployScript, deployScript);
    fs.writeFileSync(tmpRollbackScript, rollbackScript);
    
    await this.ssh.putFile(tmpDeployScript, '/tmp/deploy.sh');
    await this.ssh.putFile(tmpRollbackScript, '/tmp/rollback.sh');
    
    // Cleanup local temp files
    fs.unlinkSync(tmpDeployScript);
    fs.unlinkSync(tmpRollbackScript);

    await this.executeCommand('sudo mv /tmp/deploy.sh /opt/sentra/deploy.sh');
    await this.executeCommand('sudo mv /tmp/rollback.sh /opt/sentra/rollback.sh');
    await this.executeCommand('sudo chmod +x /opt/sentra/*.sh');
    await this.executeCommand('sudo chown sentra:sentra /opt/sentra/*.sh');
  }

  async createSystemdService() {
    this.log('Creating systemd service for auto-restart...');
    
    const systemdService = `[Unit]
Description=Sentra Application
After=docker.service
Requires=docker.service
StartLimitIntervalSec=0

[Service]
Type=oneshot
RemainAfterExit=true
User=sentra
Group=sentra
WorkingDirectory=/opt/sentra/current
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=300
Restart=on-failure
RestartSec=30

[Install]
WantedBy=multi-user.target
`;

    // Upload systemd service file
    const fs = require('fs');
    const tmpServiceFile = '/tmp/sentra-service.tmp';
    fs.writeFileSync(tmpServiceFile, systemdService);
    await this.ssh.putFile(tmpServiceFile, '/tmp/sentra.service');
    fs.unlinkSync(tmpServiceFile);
    await this.executeCommand('sudo mv /tmp/sentra.service /etc/systemd/system/sentra.service');
    
    // Enable service
    await this.executeCommand('sudo systemctl daemon-reload');
    await this.executeCommand('sudo systemctl enable sentra.service');
    
    this.log('✅ Systemd service created and enabled for auto-restart', 'success');
  }

  async buildBundle() {
    this.log('Building deployment bundle...');
    
    const bundlePath = path.join(__dirname, '../../bundle.tar.gz');
    const output = fs.createWriteStream(bundlePath);
    const archive = archiver('tar', { gzip: true });

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        this.log(`Bundle created: ${(archive.pointer() / 1024 / 1024).toFixed(2)}MB`, 'success');
        resolve(bundlePath);
      });

      archive.on('error', reject);
      archive.pipe(output);

      // Add project files (excluding node_modules, .git, etc.)
      const projectRoot = path.resolve(__dirname, '../..');
      
      archive.glob('**/*', {
        cwd: projectRoot,
        ignore: [
          'node_modules/**',
          '.git/**',
          'deploy/**',
          '*.log',
          '.env',
          'bundle.tar.gz',
          '.DS_Store'
        ]
      });

      archive.finalize();
    });
  }

  async deploy() {
    // Build bundle
    const bundlePath = await this.buildBundle();

    // Connect to server
    await this.connectSSH();

    // Create deployment directory
    const deploymentDir = `/opt/sentra/deployments/${this.deploymentId}`;
    await this.executeCommand(`sudo mkdir -p ${deploymentDir}`);
    await this.executeCommand(`sudo chown sentra:sentra ${deploymentDir}`);

    // Upload bundle
    this.log('Uploading bundle to server...');
    await this.ssh.putFile(bundlePath, '/tmp/bundle.tar.gz');
    await this.executeCommand(`sudo mv /tmp/bundle.tar.gz ${deploymentDir}/bundle.tar.gz`);

    // Upload environment file if it exists
    const envPath = path.resolve(__dirname, '../../.env.production');
    if (fs.existsSync(envPath)) {
      this.log('Uploading production environment...');
      await this.ssh.putFile(envPath, '/tmp/.env');
      await this.executeCommand(`sudo mv /tmp/.env ${deploymentDir}/.env`);
    } else {
      // Create basic environment file
      const envContent = this.generateEnvFile();
      const tmpEnvFile = '/tmp/sentra-env.tmp';
      fs.writeFileSync(tmpEnvFile, envContent);
      await this.ssh.putFile(tmpEnvFile, '/tmp/.env');
      await this.executeCommand(`sudo mv /tmp/.env ${deploymentDir}/.env`);
      fs.unlinkSync(tmpEnvFile);
    }
    
    // Fix ownership
    await this.executeCommand(`sudo chown -R sentra:sentra ${deploymentDir}`);

    // Run deployment script
    this.log('Running deployment on server...');
    await this.executeCommand(`sudo -u sentra /opt/sentra/deploy.sh ${this.deploymentId}`);

    // Verify deployment
    await this.verifyDeployment();

    // Cleanup old deployments (keep last 5)
    await this.executeCommand(`
      cd /opt/sentra/deployments &&
      ls -1t | tail -n +6 | xargs rm -rf
    `);

    // Cleanup local bundle
    fs.unlinkSync(bundlePath);

    this.log(`Deployment ${this.deploymentId} completed successfully!`, 'success');
    await this.ssh.dispose();
  }

  generateEnvFile() {
    const env = this.config.app.env || {};
    let envContent = '# Generated environment file\n';
    
    for (const [key, value] of Object.entries(env)) {
      envContent += `${key}=${value}\n`;
    }

    // Add database URL if postgres is configured
    if (this.config.postgres) {
      const dbName = this.config.postgres.env?.POSTGRES_DB || 'sentra';
      const dbUser = this.config.postgres.env?.POSTGRES_USER || 'sentra';
      envContent += `DATABASE_URL=postgresql://${dbUser}:password@postgres:5432/${dbName}\n`;
    }

    return envContent;
  }

  async verifyDeployment() {
    this.log('Verifying deployment...');
    
    // Wait for services to be ready
    await new Promise(resolve => setTimeout(resolve, 10000));

    try {
      // Check if containers are running
      const result = await this.executeCommand('cd /opt/sentra/current && docker-compose ps --services --filter status=running');
      const runningServices = result.stdout.trim().split('\n').filter(Boolean);
      
      if (runningServices.length === 0) {
        throw new Error('No services are running');
      }

      this.log(`Services running: ${runningServices.join(', ')}`, 'success');

      // Check health endpoint
      const healthCheck = await this.executeCommand('curl -f http://localhost:8000/health', { cwd: '/opt/sentra/current' });
      this.log('Health check passed', 'success');

    } catch (error) {
      this.log('Deployment verification failed', 'error');
      throw error;
    }
  }

  async rollback(version = null) {
    await this.connectSSH();

    if (!version) {
      // Get list of available backups
      const result = await this.executeCommand('ls -1t /opt/sentra/backup/ 2>/dev/null || echo ""');
      const backups = result.stdout.trim().split('\n').filter(Boolean);
      
      if (backups.length === 0) {
        throw new Error('No backups available for rollback');
      }

      const { selectedBackup } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedBackup',
          message: 'Select backup to rollback to:',
          choices: backups.map(backup => ({
            name: `${backup} (${this.formatDate(backup)})`,
            value: backup
          }))
        }
      ]);

      version = selectedBackup;
    }

    this.log(`Rolling back to ${version}...`);
    await this.executeCommand(`sudo -u sentra /opt/sentra/rollback.sh ${version}`);
    
    await this.verifyDeployment();
    await this.ssh.dispose();
  }

  async logs(options = {}) {
    await this.connectSSH();
    
    const follow = options.follow ? '-f' : '';
    const tail = options.tail ? `--tail ${options.tail}` : '';
    
    this.log('Fetching logs...');
    
    if (options.follow) {
      // For follow mode, stream logs
      const result = await this.ssh.exec('docker-compose', ['logs', follow, tail].filter(Boolean), {
        cwd: '/opt/sentra/current',
        stream: 'both'
      });
      
      result.stdout.on('data', (data) => {
        process.stdout.write(data.toString());
      });
      
      result.stderr.on('data', (data) => {
        process.stderr.write(data.toString());
      });
      
    } else {
      const result = await this.executeCommand(`docker-compose logs ${tail}`, {
        cwd: '/opt/sentra/current'
      });
      console.log(result.stdout);
    }
    
    await this.ssh.dispose();
  }

  async restart() {
    await this.connectSSH();
    
    this.log('Restarting services...');
    await this.executeCommand('docker-compose restart', { cwd: '/opt/sentra/current' });
    
    await this.verifyDeployment();
    await this.ssh.dispose();
  }

  async reconfig() {
    await this.connectSSH();
    
    // Upload new environment
    const envContent = this.generateEnvFile();
    await this.ssh.putFile(Buffer.from(envContent), '/opt/sentra/current/.env');
    
    // Restart services to pick up new config
    await this.restart();
    await this.ssh.dispose();
  }

  async status() {
    await this.connectSSH();
    
    this.log('=== Sentra Deployment Status ===');
    
    // Current deployment
    const currentResult = await this.executeCommand('readlink -f /opt/sentra/current 2>/dev/null || echo "No deployment"');
    const currentDeployment = path.basename(currentResult.stdout.trim());
    this.log(`Current deployment: ${currentDeployment}`);
    
    // Services status
    const servicesResult = await this.executeCommand('docker-compose ps', { cwd: '/opt/sentra/current' });
    this.log('Services:');
    console.log(servicesResult.stdout);
    
    // Available backups
    const backupsResult = await this.executeCommand('ls -1t /opt/sentra/backup/ 2>/dev/null | head -5 || echo "No backups"');
    this.log('Recent backups:');
    console.log(backupsResult.stdout);
    
    await this.ssh.dispose();
  }

  formatDate(timestamp) {
    if (timestamp.match(/^\d{8}-\d{6}$/)) {
      const year = timestamp.substr(0, 4);
      const month = timestamp.substr(4, 2);
      const day = timestamp.substr(6, 2);
      const hour = timestamp.substr(9, 2);
      const minute = timestamp.substr(11, 2);
      return `${year}-${month}-${day} ${hour}:${minute}`;
    }
    return timestamp;
  }
}

module.exports = SentraDeployer;