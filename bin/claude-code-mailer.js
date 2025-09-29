#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Import existing functionality
const ClaudeMailer = require('../src/index');

// Get the installation directory of this package
function getPackageDir() {
  // __dirname always points to the directory containing the current script
  // The package root is always one level up from the bin/ directory
  return path.join(__dirname, '..');
}

// Claude Code hooks configuration
const CLAUDE_MAILER_HOOKS = {
  Notification: {
    hooks: [
      {
        type: "command",
        command: ""
      }
    ]
  },
  Stop: {
    hooks: [
      {
        type: "command",
        command: ""
      }
    ]
  },
  SubagentStop: {
    hooks: [
      {
        type: "command",
        command: ""
      }
    ]
  }
};

// Get Claude config directory
function getClaudeConfigDir() {
  return path.join(os.homedir(), '.claude');
}

// Get Claude settings file path
function getClaudeSettingsPath() {
  return path.join(getClaudeConfigDir(), 'settings.json');
}

// Read existing Claude settings
function readClaudeSettings() {
  const settingsPath = getClaudeSettingsPath();
  
  if (!fs.existsSync(settingsPath)) {
    const defaultSettings = {
      env: {},
      hooks: {}
    };
    
    const claudeDir = getClaudeConfigDir();
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }
    
    fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
    return defaultSettings;
  }
  
  try {
    const settingsData = fs.readFileSync(settingsPath, 'utf8');
    return JSON.parse(settingsData);
  } catch (error) {
    console.error('❌ Error reading Claude settings:', error.message);
    process.exit(1);
  }
}

// Write Claude settings
function writeClaudeSettings(settings) {
  const settingsPath = getClaudeSettingsPath();
  
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('❌ Error writing Claude settings:', error.message);
    process.exit(1);
  }
}

// Check if Claude Code Mailer hook already exists
function hasClaudeMailerHook(settings, eventType) {
  if (!settings.hooks || !settings.hooks[eventType]) {
    return false;
  }
  
  const hooks = settings.hooks[eventType];
  
  for (const hookGroup of hooks) {
    if (hookGroup.hooks && Array.isArray(hookGroup.hooks)) {
      for (const hook of hookGroup.hooks) {
        if (hook.type === 'command' && 
            hook.command && 
            hook.command.includes('claude-code-mailer')) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Install Claude Code Mailer hooks
function installClaudeMailerHooks(settings, packageDir) {
  const events = Object.keys(CLAUDE_MAILER_HOOKS);
  let installedCount = 0;
  let skippedCount = 0;
  
  // Update command paths in hooks
  const commandPath = `node ${packageDir}/bin/claude-code-mailer.js send --stdin`;
  for (const eventType of events) {
    CLAUDE_MAILER_HOOKS[eventType].hooks[0].command = commandPath;
  }
  
  console.log('\n🔧 Installing Claude Code hooks...\n');
  
  // Ensure hooks object exists
  if (!settings.hooks) {
    settings.hooks = {};
  }
  
  for (const eventType of events) {
    if (hasClaudeMailerHook(settings, eventType)) {
      console.log(`⏭️  ${eventType} hook already exists, skipping`);
      skippedCount++;
      continue;
    }
    
    if (!settings.hooks[eventType]) {
      settings.hooks[eventType] = [];
    }
    
    settings.hooks[eventType].push(CLAUDE_MAILER_HOOKS[eventType]);
    console.log(`✅ ${eventType} hook installed`);
    installedCount++;
  }
  
  return { installedCount, skippedCount };
}

// Uninstall Claude Code Mailer hooks
function uninstallClaudeMailerHooks(settings) {
  if (!settings.hooks) {
    console.log('ℹ️  No hooks found in Claude settings');
    return 0;
  }
  
  const events = Object.keys(settings.hooks);
  let removedCount = 0;
  
  console.log('🔍 Removing Claude Code hooks...\n');
  
  for (const eventType of events) {
    const originalLength = settings.hooks[eventType].length;
    
    // Filter out Claude Code Mailer hooks
    settings.hooks[eventType] = settings.hooks[eventType].filter(hookGroup => {
      if (hookGroup.hooks && Array.isArray(hookGroup.hooks)) {
        return !hookGroup.hooks.some(hook => 
          hook.type === 'command' && 
          hook.command && 
          (hook.command.includes('claude-code-mailer send --stdin') ||
           hook.command.includes('claude-code-mailer') && hook.command.includes('send --stdin'))
        );
      }
      return true;
    });
    
    if (settings.hooks[eventType].length < originalLength) {
      console.log(`✅ Removed ${eventType} hook`);
      removedCount++;
    }
    
    // Remove empty hook arrays
    if (settings.hooks[eventType].length === 0) {
      delete settings.hooks[eventType];
      console.log(`🧹 Cleaned up empty ${eventType} hook array`);
    }
  }
  
  return removedCount;
}

// Show current configuration
function showCurrentConfig(settings) {
  console.log('\n📋 Current Claude Code Mailer Configuration:\n');
  
  const events = ['Notification', 'Stop', 'SubagentStop'];
  let hasAnyHooks = false;
  
  for (const eventType of events) {
    if (hasClaudeMailerHook(settings, eventType)) {
      hasAnyHooks = true;
      console.log(`✅ ${eventType}: Hook installed`);
    } else {
      console.log(`❌ ${eventType}: No hook found`);
    }
  }
  
  if (!hasAnyHooks) {
    console.log('ℹ️  No Claude Code Mailer hooks found in Claude settings');
  }
}

// Create the program
// Read version from package.json
function getVersion() {
  try {
    const packageDir = getPackageDir();
    const packagePath = path.join(packageDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    return '1.0.0'; // fallback version
  }
}

const program = new Command();

program
  .name('claude-code-mailer')
  .description('Smart email notifications for Claude Code')
  .version(getVersion());

// Send command (default)
program
  .command('send', { isDefault: true })
  .description('Send email notification')
  .option('-e, --event <type>', 'Event type (Notification|Stop|SubagentStop)', 'Notification')
  .option('-s, --session <id>', 'Session ID', 'unknown')
  .option('-t, --to <email>', 'Recipient email')
  .option('-f, --from <email>', 'Sender email')
  .option('--subject <text>', 'Email subject')
  .option('--message <text>', 'Email message')
  .option('--details <text>', 'Additional details')
  .option('--json', 'JSON format input')
  .option('--stdin', 'Read JSON data from stdin')
  .action(async (options) => {
    try {
      const packageDir = getPackageDir();
      process.chdir(packageDir); // Change to package directory for relative paths
      
      const ClaudeMailerCLI = require('./cli.js');
      const cli = new ClaudeMailerCLI();
      
      // If this is a direct call (not through the send command), pass through
      if (process.argv.includes('--stdin') || process.argv.includes('--json') || 
          process.stdin.isTTY === false) {
        // Forward to original CLI logic
        await cli.handleSendCommand(options);
      } else {
        // Default behavior for simple 'claude-code-mailer' calls
        await cli.handleSendCommand({
          event: options.event,
          session: options.session,
          ...options
        });
      }
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      process.exit(1);
    }
  });

// Install command
program
  .command('install')
  .description('Install Claude Code hooks automatically')
  .action(() => {
    try {
      const packageDir = getPackageDir();
      console.log('🚀 Claude Code Mailer Installation\n');
      console.log(`📂 Package location: ${packageDir}\n`);
      
      const settings = readClaudeSettings();
      showCurrentConfig(settings);
      
      const { installedCount, skippedCount } = installClaudeMailerHooks(settings, packageDir);
      
      if (installedCount > 0) {
        writeClaudeSettings(settings);
        
        console.log('\n🎉 Installation completed successfully!');
        console.log(`\n📊 Summary:`);
        console.log(`   ✅ Installed: ${installedCount} hooks`);
        console.log(`   ⏭️  Skipped: ${skippedCount} hooks (already installed)`);
        
        console.log('\n📝 Next steps:');
        console.log('   1. Ensure Claude Code Mailer is properly configured');
        console.log('   2. Test the hooks by triggering Claude Code events');
        console.log('   3. Check your email for notifications');
        
        console.log('\n🔧 To uninstall Claude Code Mailer hooks:');
        console.log('   Run: claude-code-mailer uninstall');
        
      } else {
        console.log('\n✅ All Claude Code Mailer hooks are already installed!');
      }
    } catch (error) {
      console.error(`\n❌ Installation failed: ${error.message}`);
      process.exit(1);
    }
  });

// Uninstall command
program
  .command('uninstall')
  .description('Uninstall Claude Code hooks')
  .action(() => {
    try {
      console.log('🗑️  Claude Code Mailer Uninstallation\n');
      
      const settings = readClaudeSettings();
      
      if (!settings.hooks) {
        console.log('ℹ️  No hooks found in Claude settings');
        return;
      }
      
      const removedCount = uninstallClaudeMailerHooks(settings);
      
      if (removedCount > 0) {
        writeClaudeSettings(settings);
        console.log('\n🎉 Uninstallation completed successfully!');
        console.log(`\n📊 Summary: Removed ${removedCount} hooks`);
      } else {
        console.log('\nℹ️  No Claude Code Mailer hooks found to remove');
      }
    } catch (error) {
      console.error(`❌ Uninstallation failed: ${error.message}`);
      process.exit(1);
    }
  });

// Test command
program
  .command('test')
  .description('Send test email')
  .option('-t, --to <email>', 'Test recipient email')
  .action(async (options) => {
    try {
      const packageDir = getPackageDir();
      process.chdir(packageDir);
      
      const ClaudeMailerCLI = require('./cli.js');
      const cli = new ClaudeMailerCLI();
      
      await cli.handleTestCommand(options);
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  });

// Verify command
program
  .command('verify')
  .description('Verify SMTP connection')
  .action(async () => {
    try {
      const packageDir = getPackageDir();
      process.chdir(packageDir);
      
      const ClaudeMailerCLI = require('./cli.js');
      const cli = new ClaudeMailerCLI();
      
      await cli.handleVerifyCommand();
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Show current configuration')
  .action(() => {
    try {
      const packageDir = getPackageDir();
      process.chdir(packageDir);
      
      const ClaudeMailerCLI = require('./cli.js');
      const cli = new ClaudeMailerCLI();
      
      cli.handleConfigCommand();
    } catch (error) {
      console.error('❌ Failed to show configuration:', error.message);
      process.exit(1);
    }
  });

// Custom command
program
  .command('custom')
  .description('Send custom email')
  .option('-t, --to <email>', 'Recipient email')
  .option('-f, --from <email>', 'Sender email')
  .option('-s, --subject <text>', 'Email subject')
  .option('-m, --message <text>', 'Email message')
  .option('-h, --html <content>', 'HTML content')
  .option('--stdin', 'Read JSON data from stdin')
  .action(async (options) => {
    try {
      const packageDir = getPackageDir();
      process.chdir(packageDir);
      
      const ClaudeMailerCLI = require('./cli.js');
      const cli = new ClaudeMailerCLI();
      
      await cli.handleCustomCommand(options);
    } catch (error) {
      console.error('❌ Failed to send custom email:', error.message);
      process.exit(1);
    }
  });

// Help command
program
  .command('help')
  .description('Show help information')
  .action(() => {
    program.help();
  });

// If no arguments provided, show help
if (process.argv.length === 2) {
  program.help();
}

// Parse arguments
program.parse();
