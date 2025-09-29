#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

// Claude Code Mailer hooks configuration
// Valid Claude Code hook types: Notification, Stop, SubagentStop, PreToolUse, PostToolUse, UserPromptSubmit, SessionStart, SessionEnd, PreCompact
const CLAUDE_MAILER_HOOKS = {
  Notification: {
    hooks: [
      {
        type: "command",
        command: "node /data/dev/claude-code-mailer/bin/cli.js send --stdin"
      }
    ]
  },
  Stop: {
    hooks: [
      {
        type: "command",
        command: "node /data/dev/claude-code-mailer/bin/cli.js send --stdin"
      }
    ]
  },
  SubagentStop: {
    hooks: [
      {
        type: "command",
        command: "node /data/dev/claude-code-mailer/bin/cli.js send --stdin"
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
    // Create default settings if file doesn't exist
    const defaultSettings = {
      env: {},
      hooks: {}
    };
    
    // Create .claude directory if it doesn't exist
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
    console.log('✅ Claude settings updated successfully');
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
  
  // Check if any of the hooks contain the Claude Code Mailer command
  for (const hookGroup of hooks) {
    if (hookGroup.hooks && Array.isArray(hookGroup.hooks)) {
      for (const hook of hookGroup.hooks) {
        if (hook.type === 'command' && 
            hook.command && 
            hook.command.includes('claude-code-mailer/bin/cli.js send --stdin')) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Install Claude Code Mailer hooks
function installClaudeMailerHooks(settings) {
  const events = Object.keys(CLAUDE_MAILER_HOOKS);
  let installedCount = 0;
  let skippedCount = 0;
  
  console.log('\n🔧 Installing Claude Code Mailer hooks...\n');
  
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

// Detect Claude Code Mailer installation directory
function detectClaudeMailerDirectory() {
  // Default path (current script location relative to claude-code-mailer directory)
  const scriptDir = path.dirname(__filename);
  const possiblePaths = [
    '/data/dev/claude-code-mailer',
    path.join(scriptDir, '..'),
    process.cwd()
  ];
  
  for (const dirPath of possiblePaths) {
    const cliPath = path.join(dirPath, 'bin', 'cli.js');
    if (fs.existsSync(cliPath)) {
      return dirPath;
    }
  }
  
  return null;
}

// Update command paths in hooks
function updateCommandPaths(settings, claudeMailerDir) {
  if (!settings.hooks) return;
  
  const events = Object.keys(settings.hooks);
  
  for (const eventType of events) {
    const hooks = settings.hooks[eventType];
    
    for (const hookGroup of hooks) {
      if (hookGroup.hooks && Array.isArray(hookGroup.hooks)) {
        for (const hook of hookGroup.hooks) {
          if (hook.type === 'command' && hook.command) {
            // Update the command path to use detected directory
            const newCommand = `node ${claudeMailerDir}/bin/cli.js send --stdin`;
            hook.command = newCommand;
          }
        }
      }
    }
  }
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

// Main installation function
function install() {
  console.log('🚀 Claude Code Mailer Hooks Installation Script\n');
  
  // Detect Claude Code Mailer directory
  const claudeMailerDir = detectClaudeMailerDirectory();
  if (!claudeMailerDir) {
    console.error('❌ Could not detect Claude Code Mailer installation directory');
    console.log('Please ensure Claude Code Mailer is installed in one of these locations:');
    console.log('  - /data/dev/claude-code-mailer');
    console.log('  - Current working directory');
    console.log('  - Same directory as this script');
    process.exit(1);
  }
  
  console.log(`📂 Detected Claude Code Mailer at: ${claudeMailerDir}`);
  
  // Read existing settings
  const settings = readClaudeSettings();
  
  // Show current configuration
  showCurrentConfig(settings);
  
  // Install hooks
  const { installedCount, skippedCount } = installClaudeMailerHooks(settings);
  
  // Update command paths
  updateCommandPaths(settings, claudeMailerDir);
  
  // Save settings
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
    console.log('   Run this script again with --uninstall flag');
    
  } else {
    console.log('\n✅ All Claude Code Mailer hooks are already installed!');
  }
}

// Uninstall function
function uninstall() {
  console.log('🗑️  Claude Code Mailer Hooks Uninstallation Script\n');
  
  const settings = readClaudeSettings();
  
  if (!settings.hooks) {
    console.log('ℹ️  No hooks found in Claude settings');
    return;
  }
  
  const events = Object.keys(settings.hooks);
  let removedCount = 0;
  
  console.log('🔍 Removing Claude Code Mailer hooks...\n');
  
  for (const eventType of events) {
    const originalLength = settings.hooks[eventType].length;
    
    // Filter out Claude Code Mailer hooks
    settings.hooks[eventType] = settings.hooks[eventType].filter(hookGroup => {
      if (hookGroup.hooks && Array.isArray(hookGroup.hooks)) {
        return !hookGroup.hooks.some(hook => 
          hook.type === 'command' && 
          hook.command && 
          hook.command.includes('claude-code-mailer/bin/cli.js send --stdin')
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
  
  if (removedCount > 0) {
    writeClaudeSettings(settings);
    console.log('\n🎉 Uninstallation completed successfully!');
    console.log(`\n📊 Summary: Removed ${removedCount} hooks`);
  } else {
    console.log('\nℹ️  No Claude Code Mailer hooks found to remove');
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('Claude Code Mailer Hooks Installation Script\n');
  console.log('Usage:');
  console.log('  node bin/install-claude.js          Install Claude Code Mailer hooks');
  console.log('  node bin/install-claude.js --uninstall  Remove Claude Code Mailer hooks');
  console.log('  node bin/install-claude.js --help     Show this help message\n');
  console.log('This script automatically:');
  console.log('  • Detects Claude Code Mailer installation directory');
  console.log('  • Adds Claude Code Mailer hooks to ~/.claude/settings.json');
  console.log('  • Preserves existing configuration');
  console.log('  • Prevents duplicate installations');
  process.exit(0);
}

if (args.includes('--uninstall')) {
  uninstall();
} else {
  install();
}