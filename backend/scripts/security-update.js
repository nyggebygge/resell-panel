#!/usr/bin/env node

/**
 * Security Update Script for Resell Panel Backend
 * This script addresses security vulnerabilities in dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Starting security update process...\n');

// Security fixes
const securityFixes = [
  {
    name: 'Update Sequelize to latest secure version',
    command: 'npm install sequelize@^6.37.7 --save',
    description: 'Fixes SQL injection vulnerabilities in mysql dependency'
  },
  {
    name: 'Update MySQL2 to latest version',
    command: 'npm install mysql2@^3.6.5 --save',
    description: 'Updates to latest MySQL2 driver with security patches'
  },
  {
    name: 'Update Express Rate Limit',
    command: 'npm install express-rate-limit@^7.1.5 --save',
    description: 'Updates rate limiting middleware'
  },
  {
    name: 'Update Helmet',
    command: 'npm install helmet@^7.1.0 --save',
    description: 'Updates security headers middleware'
  },
  {
    name: 'Add explicit validator dependency',
    command: 'npm install validator@^13.11.0 --save',
    description: 'Fixes URL validation bypass vulnerability'
  },
  {
    name: 'Update UUID',
    command: 'npm install uuid@^9.0.1 --save',
    description: 'Updates UUID generation library'
  }
];

// Run security fixes
async function runSecurityFixes() {
  for (const fix of securityFixes) {
    try {
      console.log(`🔧 ${fix.name}...`);
      console.log(`   ${fix.description}`);
      
      execSync(fix.command, { stdio: 'inherit' });
      console.log(`   ✅ Completed\n`);
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}\n`);
    }
  }
}

// Create .npmrc for security
function createNpmrc() {
  const npmrcContent = `# Security configuration
audit-level=moderate
fund=false
save-exact=true
`;

  const npmrcPath = path.join(__dirname, '..', '.npmrc');
  fs.writeFileSync(npmrcPath, npmrcContent);
  console.log('📝 Created .npmrc with security settings');
}

// Run audit fix
function runAuditFix() {
  try {
    console.log('🔍 Running npm audit fix...');
    execSync('npm audit fix --force', { stdio: 'inherit' });
    console.log('✅ Audit fix completed');
  } catch (error) {
    console.log('⚠️  Some issues may require manual review');
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Resell Panel Backend Security Update');
    console.log('=====================================\n');
    
    // Create security configuration
    createNpmrc();
    
    // Run security fixes
    await runSecurityFixes();
    
    // Run audit fix
    runAuditFix();
    
    console.log('\n🎉 Security update completed!');
    console.log('\nNext steps:');
    console.log('1. Run: npm install');
    console.log('2. Run: npm audit');
    console.log('3. Test your application');
    console.log('4. Deploy with updated dependencies');
    
  } catch (error) {
    console.error('❌ Security update failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { runSecurityFixes, createNpmrc, runAuditFix };
