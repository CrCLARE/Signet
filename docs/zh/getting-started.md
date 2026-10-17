## Signet 是什么

Signet 是一套**自托管的授权平台模板**。它为你提供了运营一个软件授权服务所需的全部能力：

- 用户账号系统（注册、登录、重置密码）
- 订单绑定流程（把支付与用户账号关联）
- 产品管理界面（每个用户管理自己的产品）
- 离线授权签发引擎（Ed25519 签名文件）
- 管理后台（查询、封禁、开通、审计）
- 公开授权查询页面

它构建在 **Cloudflare Workers**、**Cloudflare D1** 和 **Cloudflare Pages** 之上。
在典型的独立开发者流量规模下，整套系统完全跑在 Cloudflare 的免费套餐内。

## Signet 不是什么

Signet 不是支付网关。它不碰你的钱。它不发邮件。它不提供分析。
它是**你的客户和你的产品之间的那一层**——不多不少。

## 许可协议

Signet 采用 **Apache License 2.0** 发布。

这意味着你可以：

- 在商业或非商业项目中使用 Signet
- 修改、分发、再授权源代码
- 用它为自己的客户运营服务

你必须：

- 保留原始的 `NOTICE` 文件
- 在任何再分发中包含本许可证的副本
- 明确声明你做出的修改

你不能：

- 未经许可使用 "Signet" 或 "CrCLARE" 商标

完整条款见
[LICENSE](https://github.com/CrCLARE/Signet/blob/main/LICENSE) 文件。
简要说明见 [choosealicense.com/licenses/apache-2.0](https://choosealicense.com/licenses/apache-2.0/)。

## 架构一图流

```

浏览器
│
▼
Cloudflare Pages（前端）           ← 静态 HTML + Tailwind
│
│ fetch → API
▼
Cloudflare Workers（后端）         ← JS 运行时，无服务器
│
│ bind
▼
Cloudflare D1（数据库）            ← SQLite，分布式

```

所有东西都跑在边缘。没有源站要维护，没有容器要保温，没有每月虚拟机账单。

## 前置条件

要部署你自己的 Signet，你需要：

- 一个 **Cloudflare 账号** —— [免费注册](https://dash.cloudflare.com/sign-up)
- 一个 **GitHub 账号** —— 用于 Fork 仓库
- 本地安装 **Node.js 18+** —— [nodejs.org](https://nodejs.org)
- 一个**支付渠道账号** —— [爱发电](https://afdian.com) 已内置支持

如果你暂时没有支付渠道，也可以先部署 Signet，然后用管理后台手动开通权限。

## 下一步

准备好拿到你自己的副本了？ → **[Fork 仓库](./fork)**
