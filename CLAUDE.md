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