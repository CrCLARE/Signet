 ---
layout: home

hero:
  name: Signet
  text: SaaS 授权平台模板
  tagline: 面向独立开发者的自托管授权系统，跑在 Cloudflare 免费套餐上
  image:
    src: /logo.svg
    alt: Signet
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/CrCLARE/Signet

features:
  - icon: 👤
    title: 用户账号
    details: 注册、登录、管理员重置密码。PBKDF2-SHA256 哈希，每个用户独立加盐。
  - icon: 🔗
    title: 订单绑定
    details: 把支付渠道的订单与用户账号关联。适配器可插拔——爱发电开箱即用。
  - icon: 🛡️
    title: 离线授权签发
    details: 用 Ed25519 签名授权文件。签发后本地即可验证，内置公钥，无需回连服务器。
  - icon: ⚙️
    title: 管理后台
    details: 查询授权、封禁与解封（带理由）、给任意用户开通权限、审计每一次操作。独立管理员凭证。
  - icon: 🔍
    title: 公开授权查询
    details: 任何人无需登录即可验证授权。不暴露邮箱、订单号、或任何个人信息。
  - icon: 🔐
    title: 零信任设计
    details: 开源无黑盒。所有逻辑与密钥都由你自己掌握——平台从不接触你的秘密。
---

## 线上演示（Chronos Seal.官网）

本模板的完整实例正在生产环境中运行：
**[chronos.crclare.top](https://chronos.crclare.top)**。

## 许可

Signet 采用 **Apache License 2.0** 发布。

你可以商业化使用、修改、再分发。但必须保留 `NOTICE` 文件，并声明你做出的修改。
未经许可不得使用 "Signet" 或 "CrCLARE" 商标。

完整条款见
[LICENSE](https://github.com/CrCLARE/Signet/blob/main/LICENSE)。
