# 关于 Signet

## 它是什么

Signet 是一套 **SaaS 授权平台模板**——一个完整的、自托管的软件授权管理系统。
它面向那些想销售或授权自己产品、但不想从零搭建账号系统、订单绑定流程和
授权服务器的独立开发者。

## 名字来源

**印章戒指（Signet Ring）** 是欧洲中世纪君主佩戴的一种刻有私人印章的小戒指。
把它压进热蜡里，就能给一份文件盖章——证明这封信确实来自持戒之人。

Signet 这套软件为数字产品提供同样的功能：它证明一份软件是被真实买家
合法授权的。

## 谁做的

Signet 由 **[CrCLARE Studio](https://crclare.top)** 开发，这是一个由
[CLARE (CLARE-XHL)](https://github.com/CLARE-XHL) 运营的小型独立工作室。

工作室的主线是游戏开发和面向独立创作者的工具。Signet 最初是他们自己某款产品的
内部授权系统，后来被抽取出来变成一个通用模板。

## 设计哲学

### 零信任

平台绝不接触属于你产品的加密材料。它不会用你无法控制的密钥来签发授权。
签名密钥对是你的——Signet 只是提供了安全使用它的基础设施。

### 离线优先

授权一旦签发，永久有效。它是一个签名文件，用内置在你应用里的公钥即可验证。
不需要向服务器回连。哪怕你的 Signet 部署明天就下线，已签发的授权依然可用。

### 无黑盒

Signet 完全开源。每一段涉及用户数据、密码或签名密钥的逻辑都可见、可审计。
没有混淆模块，没有偷偷回传的分析，没有隐藏的 API 调用。

### 适配器，而非硬编码

支付渠道、人机验证、邮件服务全部可插拔。核心永远不写死某个具体厂商。

### 极简部署

没有服务器要维护。没有容器要保温。没有每月虚拟机账单。
在典型的独立开发者流量下，整套系统跑在 Cloudflare 免费套餐内。

## 版本历史

### V1.0 —— 2026 年 10 月

首个公开发布。包含：

- 用户账号，PBKDF2-SHA256 密码哈希
- 爱发电支付适配器
- Ed25519 离线授权签发
- 管理后台，支持封禁/开通/审计
- 公开授权查询
- Apache 2.0 许可

## 许可

Signet 采用 **Apache License 2.0** 发布。完整条款见
[LICENSE](https://github.com/CrCLARE/Signet/blob/main/LICENSE)。

一句话版本：想怎么用就怎么用，包括商业化。保留署名。
未经许可不要使用 Signet 商标。

## 致谢

**主创** CLARE（[CLARE-XHL](https://github.com/CLARE-XHL)）

**设计** 大米粥（Climser）、老北（Bro eagle）、蝶衣（Dieyi my）、
云（Xiaoyun）、rain（Marquis）

## 源码

- 仓库：[github.com/CrCLARE/Signet](https://github.com/CrCLARE/Signet)
- Issue：[github.com/CrCLARE/Signet/issues](https://github.com/CrCLARE/Signet/issues)
- 讨论：[github.com/CrCLARE/Signet/discussions](https://github.com/CrCLARE/Signet/discussions)
