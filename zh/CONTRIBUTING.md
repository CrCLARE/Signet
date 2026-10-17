# 参与 Signet 贡献

[English](../CONTRIBUTING.md) | **[简体中文](./zh/CONTRIBUTING.md)**

---

首先，感谢你考虑为 Signet 做出贡献！正是像你这样的人，才让开源社区变得如此美好。

## 行为准则

参与本项目即表示你同意遵守我们的 [行为准则](../CODE_OF_CONDUCT.md)。在贡献之前，请先阅读它。

## 我能如何贡献？

### 报告 Bug

在创建 Bug 报告之前，请先检查现有的 Issue，看看该问题是否已经被报告过。如果已经存在，请在现有 Issue 下添加评论，而不是创建一个新的。

当你创建 Bug 报告时，请尽量填写完整的模板并包含详细信息。解释问题并附带额外细节，以帮助维护者重现该问题。

### 提出改进建议

如果你有关于新功能或改进的想法，请先开一个 Issue。描述你的想法并解释它为什么有用。这有助于我们在编写任何代码之前就设计达成一致。

### 提交 Pull Request

1. **Fork 仓库**，并从 `main` 分支创建你的分支。
2. **安装依赖**：如果你要修改 `backend/` 或 `docs/`，请分别进入对应目录运行 `npm install`。
3. **进行修改**。确保你的代码符合现有的风格。
4. 如果你添加了新功能或改变了行为，**请更新文档**。
5. **提交 Pull Request**。填写 PR 模板并关联相关的 Issue。

## 本地开发环境

### 前置要求

- Node.js 18+
- npm
- 一个 Cloudflare 账号（用于测试 Worker/D1 的改动）
- `wrangler` CLI（通过本地 `npm install` 安装）

### 后端 (Cloudflare Workers)

```bash
cd backend
npm install
npm run dev
```
### 文档站 (VitePress)

```bash
cd docs
npm install
npm run dev
```

## 代码风格指南
### Git 提交信息
我们遵循 [约定式提交](https://www.conventionalcommits.org/zh-hans) 规范：

feat: 新功能

fix: 修复 Bug

docs: 仅文档修改

style: 不影响代码含义的修改（空格、格式、缺失分号等）

refactor: 既不是新增功能也不是修复 Bug 的代码重构

chore: 构建过程或辅助工具的变动

示例：feat: 接入 Stripe 支付适配器

### JavaScript 风格
使用标准的 ECMAScript 模块 (ESM)。

使用 2 个空格进行缩进。

尽量使用 const 而不是 let。

语句末尾使用分号。

保持函数短小且专注。

## 安全
由于 Signet 处理敏感数据（密码、授权签名密钥），安全至关重要。

绝对不要提交机密信息（API 密钥、私钥、.env 文件）。

确保所有用户输入都经过验证和清理。

在支付适配器中始终验证 Webhook 签名。

如果你发现了安全漏洞，不要公开提 Issue。请按照 [SECURITY.md](./zh/SECURITY.md) 中的说明私下报告。

## 许可
向 Signet 贡献代码即表示你同意你的贡献将按照 [Apache License 2.0](license/) 协议进行授权。
