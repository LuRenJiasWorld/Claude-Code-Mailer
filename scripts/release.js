#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ReleaseManager {
    constructor() {
        this.packagePath = path.join(__dirname, '../package.json');
        this.changelogPath = path.join(__dirname, '../CHANGELOG.md');
        this.package = this.readPackage();
        this.version = this.package.version;
    }

    readPackage() {
        const packageData = fs.readFileSync(this.packagePath, 'utf8');
        return JSON.parse(packageData);
    }

    writePackage(packageData) {
        fs.writeFileSync(this.packagePath, JSON.stringify(packageData, null, 2));
    }

    getCurrentBranch() {
        try {
            return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        } catch (error) {
            throw new Error('无法获取当前分支名称');
        }
    }

    isWorkingTreeClean() {
        try {
            execSync('git diff-index --quiet HEAD --');
            return true;
        } catch (error) {
            return false;
        }
    }

    bumpVersion(type) {
        const versionParts = this.version.split('.').map(Number);
        
        switch (type) {
            case 'major':
                versionParts[0]++;
                versionParts[1] = 0;
                versionParts[2] = 0;
                break;
            case 'minor':
                versionParts[1]++;
                versionParts[2] = 0;
                break;
            case 'patch':
                versionParts[2]++;
                break;
            default:
                throw new Error(`无效的版本类型: ${type}`);
        }
        
        return versionParts.join('.');
    }

    updateChangelog(newVersion) {
        const changelog = fs.readFileSync(this.changelogPath, 'utf8');
        const today = new Date().toISOString().split('T')[0];
        
        // 检查是否已经有该版本的changelog条目
        const versionPattern = new RegExp(`## \\[${newVersion}\\] - \\d{4}-\\d{2}-\\d{2}`);
        if (versionPattern.test(changelog)) {
            console.log(`✅ 版本 ${newVersion} 的 changelog 条目已存在`);
            return;
        }
        
        // 添加新的changelog条目
        const newEntry = `## [${newVersion}] - ${today}\n\n### Added\n- \n\n### Changed\n- \n\n### Fixed\n- \n`;
        const insertPosition = changelog.indexOf('## [' + this.version);
        
        if (insertPosition === -1) {
            throw new Error('无法在changelog中找到插入位置');
        }
        
        const updatedChangelog = changelog.slice(0, insertPosition) + newEntry + changelog.slice(insertPosition);
        fs.writeFileSync(this.changelogPath, updatedChangelog);
        console.log(`✅ 已在 CHANGELOG.md 中添加版本 ${newVersion} 条目`);
    }

    createGitTag(newVersion) {
        const tagName = `v${newVersion}`;
        
        try {
            // 检查tag是否已存在
            execSync(`git rev-parse ${tagName}`, { stdio: 'pipe' });
            console.log(`⚠️  Tag ${tagName} 已存在，跳过创建`);
        } catch (error) {
            // Tag不存在，创建它
            execSync(`git tag -a ${tagName} -m "Release version ${newVersion}"`);
            console.log(`✅ 已创建 Git tag: ${tagName}`);
        }
    }

    createGitHubRelease(newVersion) {
        const tagName = `v${newVersion}`;
        const changelog = this.extractChangelogForVersion(newVersion);
        
        try {
            // 检查是否安装了GitHub CLI
            execSync('gh --version', { stdio: 'pipe' });
            
            const releaseCommand = `gh release create ${tagName} --title "Version ${newVersion}" --notes "${changelog}"`;
            execSync(releaseCommand, { stdio: 'inherit' });
            console.log(`✅ 已创建 GitHub Release: ${tagName}`);
        } catch (error) {
            console.warn('⚠️  GitHub CLI 未安装或未配置，跳过 GitHub Release 创建');
            console.log('   要创建 GitHub Release，请运行:');
            console.log(`   gh release create ${tagName} --title "Version ${newVersion}" --notes "Release notes for version ${newVersion}"`);
        }
    }

    extractChangelogForVersion(version) {
        const changelog = fs.readFileSync(this.changelogPath, 'utf8');
        const versionPattern = new RegExp(`## \\[${version}\\] - \\d{4}-\\d{2}-\\d{2}`);
        const nextVersionPattern = new RegExp(`## \\[\\d+\\.\\d+\\.\\d+\\] - \\d{4}-\\d{2}-\\d{2}`);
        
        const startIndex = changelog.search(versionPattern);
        if (startIndex === -1) {
            return `Release version ${version}`;
        }
        
        const endIndex = changelog.indexOf('## [', startIndex + 1);
        const changelogText = endIndex === -1 ? changelog.slice(startIndex) : changelog.slice(startIndex, endIndex);
        
        return changelogText.trim();
    }

    async performRelease(type) {
        console.log(`🚀 开始 ${type} 版本发布流程...\n`);
        
        // 检查前置条件
        if (!this.isWorkingTreeClean()) {
            throw new Error('工作目录不干净，请先提交所有更改');
        }
        
        const currentBranch = this.getCurrentBranch();
        if (currentBranch !== 'main') {
            throw new Error(`当前分支是 ${currentBranch}，请在 main 分支上进行发布`);
        }
        
        // 获取新版本号
        const newVersion = this.bumpVersion(type);
        console.log(`📋 当前版本: ${this.version}`);
        console.log(`📋 新版本: ${newVersion}\n`);
        
        // 更新package.json版本
        this.package.version = newVersion;
        this.writePackage(this.package);
        console.log('✅ 已更新 package.json 版本');
        
        // 更新changelog
        this.updateChangelog(newVersion);
        
        // 提交更改
        execSync('git add .', { stdio: 'inherit' });
        execSync(`git commit -m "chore(version): bump version to ${newVersion}"`, { stdio: 'inherit' });
        console.log('✅ 已提交版本更改');
        
        // 创建git tag
        this.createGitTag(newVersion);
        
        // 推送更改和tag
        console.log('\n📤 推送更改到远程仓库...');
        execSync('git push origin main', { stdio: 'inherit' });
        execSync(`git push origin ${newVersion.replace(/^/, 'v')}`, { stdio: 'inherit' });
        
        // 发布到npm
        console.log('\n📦 发布到 npm...');
        execSync('npm publish', { stdio: 'inherit' });
        
        // 创建GitHub Release
        console.log('\n🎯 创建 GitHub Release...');
        this.createGitHubRelease(newVersion);
        
        console.log(`\n🎉 版本 ${newVersion} 发布完成！`);
        console.log(`\n📊 发布摘要:`);
        console.log(`   📦 npm: 已发布 claude-code-mailer@${newVersion}`);
        console.log(`   🏷️  Git Tag: v${newVersion}`);
        console.log(`   🐙 GitHub: 已推送 main 分支和 tag`);
        console.log(`   📝 Release: ${this.extractChangelogForVersion(newVersion).split('\n')[0]}`);
    }
}

// 主函数
async function main() {
    const releaseType = process.argv[2];
    
    if (!releaseType || !['major', 'minor', 'patch'].includes(releaseType)) {
        console.error('用法: npm run release [major|minor|patch]');
        console.error('或者使用:');
        console.error('  npm run release:patch');
        console.error('  npm run release:minor');
        console.error('  npm run release:major');
        process.exit(1);
    }
    
    const releaseManager = new ReleaseManager();
    
    try {
        await releaseManager.performRelease(releaseType);
    } catch (error) {
        console.error(`❌ 发布失败: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = ReleaseManager;