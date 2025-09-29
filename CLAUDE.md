# Claude Code Mailer Project - 多语言项目管理规则

## 项目语言支持
本项目支持三种语言，所有修改必须同步到所有语言版本：

- **zh-CN** - 简体中文
- **zh-HK** - 繁体中文（香港）  
- **en** - English

## 文档同步规则

### README 文件
- `README.md` - 英文文档
- `README.zh.md` - 中文文档
- 两个文件内容必须保持同步，只是语言不同

### 模板文件同步
- `config/templates.zh-CN.yaml` - 简体中文邮件模板
- `config/templates.zh-HK.yaml` - 繁体中文邮件模板
- `config/templates.en.yaml` - 英文邮件模板
- 所有模板文件结构必须保持一致（相同的 events 和 variables）

### 配置文件同步
- `.env.template` - 注释需要同时支持中英文理解
- 确保所有语言版本的配置项一致

## 修改检查清单

在进行任何修改时，请按以下清单检查：

### 📋 文档修改
- [ ] 更新 README.md (英文)
- [ ] 更新 README.zh.md (中文)
- [ ] 确保两个文档内容一致
- [ ] 更新项目结构说明（如有新增文件）

### 📋 模板修改
- [ ] 修改 templates.zh-CN.yaml
- [ ] 修改 templates.zh-HK.yaml
- [ ] 修改 templates.en.yaml
- [ ] 确保所有模板结构一致
- [ ] 测试模板渲染功能

### 📋 配置修改
- [ ] 更新 .env.template
- [ ] 更新 README 中的配置说明
- [ ] 确保注释清晰易懂

### 📋 代码修改
- [ ] 如需支持新语言，更新 mailer.js 中的语言检测逻辑
- [ ] 更新相关文档中的语言列表
- [ ] 测试新语言功能

## 新语言添加流程

如需添加新语言支持：

1. 创建新的模板文件 `config/templates.[语言代码].yaml`
2. 复制现有模板结构并翻译内容
3. 更新 `src/mailer.js` 中的语言支持
4. 更新 `.env.template` 中的语言选项说明
5. 更新 `README.md` 和 `README.zh.md`
6. 更新所有相关文档中的语言列表

## 文件结构参考

```
config/
├── templates.zh-CN.yaml  # 简体中文模板
├── templates.zh-HK.yaml  # 繁体中文模板
├── templates.en.yaml      # 英文模板

README.md                # 英文文档
README.zh.md             # 中文文档
.env.template            # 多语言配置模板
```

## 自动化提醒

- 每次修改模板时，检查所有语言版本
- 每次更新文档时，确保中英文版本同步
- 每次添加新功能时，考虑所有语言的支持
- 使用 `node bin/cli.js test` 测试所有语言模板

## 常见错误避免

1. ❌ 只更新英文文档，忘记更新中文文档
2. ❌ 只修改简体中文模板，忘记繁体中文和英文模板
3. ❌ 添加新功能时，没有更新所有语言版本
4. ❌ 修改配置说明时，没有同步到所有文档

## 质量检查

提交代码前，请运行：
```bash
# 测试所有功能
node bin/cli.js test

# 检查模板是否能正常加载
node bin/cli.js config

# 验证所有语言的模板文件
ls config/templates.*.yaml
```

## 版本管理和提交规范

### 版本发布流程

本项目使用 `tag-release.sh` 脚本进行版本发布，发布流程完全自动化：

#### 发布方法
```bash
# 发布补丁版本 (1.0.0 -> 1.0.1)
./scripts/tag-release.sh patch

# 发布次版本 (1.0.0 -> 1.1.0)  
./scripts/tag-release.sh minor

# 发布主版本 (1.0.0 -> 2.0.0)
./scripts/tag-release.sh major
```

#### 发布流程
1. **版本管理** - 自动更新 package.json 版本号
2. **Git 操作** - 自动提交更改并创建 Git tag
3. **推送远程** - 推送代码和 tag 到远程仓库
4. **自动发布** - GitHub Actions 自动发布到 npm
5. **Release 创建** - GitHub Actions 自动创建 GitHub Release

#### 脚本功能
- 自动检测当前分支（必须在 main 分支）
- 检查工作目录状态（必须干净）
- 自动生成 Git tag message
- 推送后自动触发 GitHub Actions 发布流程

#### 替代方案（手动发布）
如果需要手动发布，可以使用以下命令：
```bash
# 更新版本
pnpm version patch/minor/major

# 推送代码和 tag
git push origin main
git push origin v1.x.x
```
每次发布新版本时，必须：

1. **更新 CHANGELOG.md**
   - 在对应版本号下添加详细的修改内容
   - 使用标准的格式：Added, Changed, Fixed, Deprecated, Removed, Security
   - 包含具体的修改内容和影响范围

2. **版本号管理**
   - 遵循 Semantic Versioning (semver) 规范
   - 主版本号：不兼容的 API 修改
   - 次版本号：向下兼容的功能性新增
   - 修订版本号：向下兼容的问题修正

### Commit Message 规范

**必须使用英文编写 commit message**

#### 格式要求
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

#### Type 类型
- **feat**: 新功能
- **fix**: 修复问题
- **docs**: 文档更新
- **style**: 代码格式修改（不影响功能）
- **refactor**: 代码重构
- **test**: 测试相关修改
- **chore**: 构建或辅助工具的变动

#### Scope 范围（可选）
- 指明影响范围，如：config, templates, cli, docs, readme
- 示例：`feat(config): add global configuration support`

#### Description 描述
- 简短描述，使用现在时态
- 首字母小写，不加句号
- 示例：`add global configuration file auto-creation`

#### 示例
```
feat(config): add global configuration file auto-creation
- Add automatic config file creation at ~/.claude-code-mailer/.env
- Implement smart project detection for project-level configs
- Update configuration priority system

fix(cli): resolve hook detection issue
- Fix uninstall logic to detect both old and new hook formats
- Update detection regex to include claude-code-mailer commands
- Add backward compatibility for existing installations

docs(readme): update quick start guide
- Add npm installation instructions
- Update configuration examples
- Improve getting started section
```

### CHANGELOG.md 维护
- 使用 Keep a Changelog 格式
- 每个版本按类型分组修改内容
- 包含链接到对应的版本号
- 新版本发布时必须更新

## 日期标准

### 文档日期规范
项目中的所有日期必须遵循以下标准：

### 日期格式要求
- **使用 ISO 8601 格式**: `YYYY-MM-DD`
- **参考来源**: 以当前日期和 Git 提交记录中的日期为准
- **时区**: 使用 UTC+8 (北京时间) 作为项目标准时区

### 具体应用场景

#### CHANGELOG.md
- 版本发布日期使用 Git 提交的日期
- 格式: `## [1.2.1] - 2025-09-29`
- 日期来源: `git log --oneline --format="%ad" --date=short`

#### 文档更新
- README.md 和 README.zh.md 中的更新日期使用当前日期
- 许可证年份使用当前年份
- 示例: `Copyright (c) 2025 Claude Code Mailer`

#### Commit Message 日期
- Git 自动管理提交日期
- 格式: `Mon Sep 29 20:57:42 2025 +0800`
- 不需要手动在 commit message 中包含日期

### 日期检查清单
- [ ] CHANGELOG.md 中的版本日期与 Git 提交日期一致
- [ ] LICENSE 文件中的版权年份为当前年份
- [ ] 文档更新日期使用正确的 ISO 格式
- [ ] 所有日期引用使用项目标准时区 (UTC+8)

### 自动化日期管理
项目鼓励使用脚本自动化日期管理：
```bash
# 获取当前日期 (ISO 8601 格式)
date +%Y-%m-%d

# 获取 Git 提交日期
git log --oneline --format="%ad" --date=short | head -1

# 获取当前年份
date +%Y
```

### 日期一致性验证
在发布新版本前，验证所有日期的一致性：
- CHANGELOG.md 版本日期与 Git 历史匹配
- 版权年份为当前年份
- 文档更新日期合理且一致