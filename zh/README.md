# Signet

**面向独立开发者的 SaaS 授权平台模板**

---

[English](/README.md) | [简体中文](/zh/README.md)

---

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](../LICENSE)
[![Platform](https://img.shields.io/badge/platform-Cloudflare%20Workers-orange)](https://workers.cloudflare.com/)
[![Status](https://img.shields.io/badge/status-pre--release-yellow)](https://github.com/CrCLARE/Signet)

---

Signet 是由 [CrCLARE Studio](https://crclare.top) 开发的 SaaS 授权平台模板。它为需要给自己产品做授权管理的独立开发者提供了一套完整方案——用户账号、订单绑定、授权签发、管理后台、审计日志，开箱即用。

名字来源于中世纪的 **印章戒指（Signet Ring）**——君主用来在官方文书上盖印以示权威。印章用来证明文书的真伪，Signet 用来证明建立在它之上的产品的真伪。

## 能做什么

Signet 处理的是运营一个授权产品时最琐碎、最容易出错的部分：

- **用户账号** — 注册、登录、管理员重置密码
- **订单绑定** — 把支付订单与用户账号绑定
- **产品管理** — 用户在自己账号下创建产品
- **授权签发** — 使用 Ed25519 签发离线授权文件
- **管理后台** — 封禁/解封授权、手动开通 Pro、重置密码、审计日志
- **公开查询** — 任何人都可以验证某产品是否持有有效授权

## 线上演示（Chronos Seal 官网）

**https://chronos.crclare.top**

本模板的完整实例，正在生产环境中运行。

## 技术栈

| 层级 | 技术 |
| :--- | :--- |
| **后端** | Cloudflare Workers |
| **数据库** | Cloudflare D1（SQLite） |
| **前端** | 静态 HTML + Tailwind CSS |
| **加密** | Ed25519（通过 `@noble/ed25519`） |
| **认证** | JWT（用户 / 管理员双体系） |

不需要维护服务器。没有月租账单。在典型的独立开发者使用场景下，完全跑在 Cloudflare 的免费额度内。

## 设计原则

- **零信任** — 开源无黑盒，所有逻辑与密钥你自己掌握
- **离线优先** — 授权一旦签发即永久有效，即使平台下线也不影响使用。
- **适配器，而非硬编码** — 支付渠道以适配器方式实现，不写死在核心里。
- **双 JWT** — 用户与管理员使用独立的密钥和存储键。用户 token 泄露无法访问管理接口。

## 仓库结构

Signet/
├── backend/          Cloudflare Workers 后端
│   ├── src/          源码
│   ├── schema.sql    D1 数据库表结构
│   └── wrangler.toml Worker 配置
├── frontend/         静态前端（Tailwind CSS）
│   └── assets/       共享 JavaScript
├── docs/             文档（见 dev.crclare.top）
├── LICENSE           Apache License 2.0
└── NOTICE            署名

## 文档

完整文档、部署指南、架构说明见：

**https://dev.crclare.top**

## 许可

Signet 采用 **Apache License 2.0** 许可。完整条款见 [LICENSE](../LICENSE)。

你可以：
- 将 Signet 用于商业或非商业项目
- 修改、分发、再授权
- 用它运营自己的授权服务

你必须：
- 保留原始 NOTICE 文件（见 [NOTICE](../NOTICE)）
- 声明你做出的修改

你不能：
- 未经授权使用 "Signet" 或 "CrCLARE" 商标

## 致谢

**主创** CLARE（[CLARE-XHL](https://github.com/CLARE-XHL)）

**设计** 大米粥（Climser）、老北（Bro eagle）、蝶衣（Dieyi my）、云（Xiaoyun）、rain（Marquis）

## 链接

- **CrCLARE Studio** — https://crclare.top
- **文档** — https://dev.crclare.top
- **演示** — https://chronos.crclare.top
- **GitHub** — https://github.com/CrCLARE/Signet
