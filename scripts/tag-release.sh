#!/bin/bash

# Claude Code Mailer 发布脚本
# 使用方法: ./scripts/tag-release.sh [patch|minor|major]

set -e

# 获取当前目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# 默认版本类型
RELEASE_TYPE=${1:-patch}

# 验证输入
if [[ ! "$RELEASE_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo "❌ 错误: 发布类型必须是 patch, minor, 或 major"
    echo "用法: $0 [patch|minor|major]"
    exit 1
fi

# 检查是否在正确的分支上
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
    echo "❌ 错误: 当前分支是 $CURRENT_BRANCH，请切换到 main 分支"
    exit 1
fi

# 检查工作目录是否干净
if [[ -n "$(git status --porcelain)" ]]; then
    echo "❌ 错误: 工作目录不干净，请先提交所有更改"
    exit 1
fi

# 获取当前版本
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📋 当前版本: $CURRENT_VERSION"

# 计算新版本
IFS='.' read -ra VERSION <<< "$CURRENT_VERSION"
case "$RELEASE_TYPE" in
    major)
        NEW_VERSION="$((VERSION[0]+1)).0.0"
        ;;
    minor)
        NEW_VERSION="${VERSION[0]}.$((VERSION[1]+1)).0"
        ;;
    patch)
        NEW_VERSION="${VERSION[0]}.${VERSION[1]}.$((VERSION[2]+1))"
        ;;
esac

echo "📋 新版本: $NEW_VERSION"

# 更新 package.json 版本
pnpm version "$NEW_VERSION" --no-git-tag-version

# 提交版本更新
git add package.json
git commit -m "chore(version): bump version to $NEW_VERSION"

# 创建并推送 tag
TAG_NAME="v$NEW_VERSION"
git tag -a "$TAG_NAME" -m "Release version $NEW_VERSION"

echo "📤 推送更改到远程仓库..."
git push origin main
git push origin "$TAG_NAME"

echo "✅ 成功创建并推送 tag: $TAG_NAME"
echo ""
echo "🚀 GitHub Actions 将自动处理以下任务:"
echo "   📦 发布到 npm"
echo "   🏷️  创建 GitHub Release"
echo "   📋 生成发布说明"
echo ""
echo "🔗 你可以在这里查看发布进度:"
echo "   https://github.com/LuRenJiasWorld/Claude-Code-Mailer/actions"
echo ""
echo "🎉 版本 $NEW_VERSION 发布流程已启动！"