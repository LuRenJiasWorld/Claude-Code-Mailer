#!/bin/bash

# 本地开发安装脚本
# 用于开发时快速安装和测试

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

log_info "开始本地开发安装..."

# 创建包文件
log_info "创建 npm 包..."
npm pack

# 全局安装
log_info "全局安装包..."
npm install -g ./claude-code-mailer-*.tgz

# 清理
log_info "清理临时文件..."
rm -f claude-code-mailer-*.tgz

# 验证安装
log_info "验证安装..."
if claude-code-mailer --version > /dev/null 2>&1; then
    log_success "本地开发安装完成！"
    echo ""
    echo "现在可以使用以下命令："
    echo "  claude-code-mailer test    # 发送测试邮件"
    echo "  claude-code-mailer install  # 安装 Claude Code hooks"
    echo "  claude-code-mailer --help   # 查看帮助"
else
    echo "❌ 安装失败"
    exit 1
fi