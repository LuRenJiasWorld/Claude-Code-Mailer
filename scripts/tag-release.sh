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
    echo "💡 提示: 使用以下命令提交更改"
    echo "   git add ."
    echo "   git commit -m 'your commit message'"
    echo ""
    echo "📋 当前修改的文件:"
    git status --short
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

# 更新 CHANGELOG.md
echo "📝 更新 CHANGELOG.md..."

# 获取从上一个版本以来的 commit 信息
PREVIOUS_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [[ -n "$PREVIOUS_TAG" ]]; then
    COMMITS_SINCE_TAG=$(git log "$PREVIOUS_TAG..HEAD" --oneline --no-merges)
else
    COMMITS_SINCE_TAG=$(git log --oneline -10 --no-merges)
fi

echo "🔍 分析最近的 commit 信息..."
echo "$COMMITS_SINCE_TAG"

# 提取 commit messages 并分类
FEAT_COMMITS=$(echo "$COMMITS_SINCE_TAG" | grep "^feat:" || echo "")
FIX_COMMITS=$(echo "$COMMITS_SINCE_TAG" | grep "^fix:" || echo "")
DOCS_COMMITS=$(echo "$COMMITS_SINCE_TAG" | grep "^docs:" || echo "")
CHORE_COMMITS=$(echo "$COMMITS_SINCE_TAG" | grep "^chore:" || echo "")
OTHER_COMMITS=$(echo "$COMMITS_SINCE_TAG" | grep -v "^\(feat\|fix\|docs\|chore\):" || echo "")

# 创建 changelog 条目
CHANGELOG_ENTRY="## [$NEW_VERSION] - $(date +%Y-%m-%d)"
CHANGELOG_ENTRY+="

"

if [[ -n "$FEAT_COMMITS" ]]; then
    CHANGELOG_ENTRY+="### Added
"
    while IFS= read -r commit; do
        if [[ -n "$commit" ]]; then
            # 提取 commit message（去除 feat: 前缀）
            msg=$(echo "$commit" | sed 's/^feat: //')
            CHANGELOG_ENTRY+="- $msg
"
        fi
    done <<< "$FEAT_COMMITS"
    CHANGELOG_ENTRY+="
"
fi

if [[ -n "$FIX_COMMITS" ]]; then
    CHANGELOG_ENTRY+="### Fixed
"
    while IFS= read -r commit; do
        if [[ -n "$commit" ]]; then
            # 提取 commit message（去除 fix: 前缀）
            msg=$(echo "$commit" | sed 's/^fix: //')
            CHANGELOG_ENTRY+="- $msg
"
        fi
    done <<< "$FIX_COMMITS"
    CHANGELOG_ENTRY+="
"
fi

if [[ -n "$DOCS_COMMITS" ]]; then
    CHANGELOG_ENTRY+="### Changed
"
    while IFS= read -r commit; do
        if [[ -n "$commit" ]]; then
            # 提取 commit message（去除 docs: 前缀）
            msg=$(echo "$commit" | sed 's/^docs: //')
            CHANGELOG_ENTRY+="- $msg
"
        fi
    done <<< "$DOCS_COMMITS"
    CHANGELOG_ENTRY+="
"
fi

if [[ -n "$OTHER_COMMITS" ]]; then
    CHANGELOG_ENTRY+="### Changed
"
    while IFS= read -r commit; do
        if [[ -n "$commit" ]]; then
            # 直接使用 commit message
            CHANGELOG_ENTRY+="- $commit
"
        fi
    done <<< "$OTHER_COMMITS"
    CHANGELOG_ENTRY+="
"
fi

# 更新 CHANGELOG.md 文件
if [[ -f "CHANGELOG.md" ]]; then
    # 在第一个版本条目前插入新条目
    awk -v entry="$CHANGELOG_ENTRY" '
    /^## \[/ && !inserted {
        print entry
        inserted=1
    }
    { print }
    ' CHANGELOG.md > CHANGELOG.md.tmp && mv CHANGELOG.md.tmp CHANGELOG.md
    
    git add CHANGELOG.md
    echo "✅ 已更新 CHANGELOG.md"
else
    echo "⚠️  CHANGELOG.md 文件不存在，跳过更新"
fi

# 更新 package.json 版本
pnpm version "$NEW_VERSION" --no-git-tag-version

# 提交版本更新和 changelog
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