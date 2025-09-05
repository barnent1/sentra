#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const MupBundleDeployer = require('../lib/mup-bundle-deployer');

const config = require('../sup.json');

program
  .name('sup')
  .description('Sentra deployment tool - Meteor Up style for Sentra')
  .version('1.0.0');

program
  .command('setup')
  .description('Setup server(s) and install Docker, dependencies')
  .action(async () => {
    console.log(chalk.blue('🚀 Setting up Sentra servers...'));
    const deployer = new MupBundleDeployer(config);
    try {
      await deployer.setup();
      console.log(chalk.green('✅ Server setup complete!'));
    } catch (error) {
      console.error(chalk.red('❌ Setup failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('deploy')
  .description('Build and deploy Sentra to server(s)')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (options) => {
    console.log(chalk.blue('🚢 Deploying Sentra...'));
    const deployer = new MupBundleDeployer(config, { verbose: options.verbose });
    try {
      await deployer.fullDeploy();
      console.log(chalk.green('✅ Deployment complete!'));
    } catch (error) {
      console.error(chalk.red('❌ Deployment failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('logs')
  .description('Show application logs from server(s)')
  .option('-f, --follow', 'Follow log output')
  .option('-t, --tail <lines>', 'Number of lines to show', '100')
  .action(async (options) => {
    const deployer = new MupBundleDeployer(config);
    try {
      await deployer.logs(options);
    } catch (error) {
      console.error(chalk.red('❌ Failed to get logs:'), error.message);
      process.exit(1);
    }
  });

program
  .command('restart')
  .description('Restart Sentra services on server(s)')
  .action(async () => {
    console.log(chalk.blue('🔄 Restarting Sentra services...'));
    const deployer = new MupBundleDeployer(config);
    try {
      await deployer.restart();
      console.log(chalk.green('✅ Services restarted!'));
    } catch (error) {
      console.error(chalk.red('❌ Restart failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('rollback')
  .description('Rollback to previous deployment')
  .option('-v, --version <version>', 'Specific version to rollback to')
  .action(async (options) => {
    console.log(chalk.yellow('⏪ Rolling back deployment...'));
    const deployer = new MupBundleDeployer(config);
    try {
      await deployer.rollback(options.version);
      console.log(chalk.green('✅ Rollback complete!'));
    } catch (error) {
      console.error(chalk.red('❌ Rollback failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('reconfig')
  .description('Update configuration on server(s)')
  .action(async () => {
    console.log(chalk.blue('⚙️ Updating configuration...'));
    const deployer = new MupBundleDeployer(config);
    try {
      await deployer.reconfig();
      console.log(chalk.green('✅ Configuration updated!'));
    } catch (error) {
      console.error(chalk.red('❌ Reconfig failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show deployment status')
  .action(async () => {
    const deployer = new MupBundleDeployer(config);
    try {
      await deployer.status();
    } catch (error) {
      console.error(chalk.red('❌ Failed to get status:'), error.message);
      process.exit(1);
    }
  });

program.parse();