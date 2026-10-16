 # 常见问题

## 部署

### 我需要自定义域名吗？

不需要。Signet 在 `*.pages.dev` 和 `*.workers.dev` 上照样能跑。如果给真实用户用，
推荐配自定义域名，但这是可选的。

### 能不用 Cloudflare 部署吗？

比较难。Signet 的后端是专门为 Cloudflare Workers 写的（用了 D1 和 Workers 运行时）。
移植到其他平台意味着重写整个后端。

### 免费套餐够用吗？

够。典型的独立开发者流量（几百个用户、每天几单），完全在免费额度内。
Cloudflare Workers 免费每天 10 万次请求；D1 免费每天 500 万行读取。

### 超出免费额度会怎样？

Cloudflare 会按标准价格开始收费（Workers 付费套餐 $5/月起）。
你可以在 Cloudflare 控制台设置消费上限，避免意外账单。

### 以后能升级到新版本吗？

能。把上游加为一个 git remote：

```bash
git remote add upstream https://github.com/CrCLARE/Signet.git
git fetch upstream
git merge upstream/main
```

合并前先审阅改动，尤其是你自定义过代码的话。

---

支付

支持哪些支付平台？

目前内置只有爱发电。但适配器机制让添加其他平台很容易——见适配器章节。

能用 Stripe / Paddle / Gumroad 吗？

开箱即用的话不行。你需要写一个适配器。模式有完整文档，每个平台大约五十行。

退款怎么处理？

Signet 不处理退款。用户要退款的话，你在支付平台后台操作。
你可能还想通过管理后台撤销他的授权。

用户能付美元吗？

取决于你的支付平台。Signet 存储的是平台传来的金额字符串
（比如 "19.90" 或 "$19.90"），所以任何货币都能用。

---

授权

授权文件长什么样？

一个签名后的 JSON：

```json
{
  "v": 1,
  "product_uid": "A1B2C3D4E5F6G7H8",
  "product_name": "My Product",
  "user_id": "257b6a93-...",
  "fingerprint": "257b6a93-...",
  "issued_at": 1791198240,
  "signature": "d0654793aa6f..."
}
```

signature 是对前六个字段的 Ed25519 签名。你的客户端应用用构建时内置的
公钥验证它。

授权会过期吗？

不会。授权文件没有过期字段。一旦签发，永久有效，哪怕 Signet 部署下线了也不影响。

能撤销授权吗？

能。登录管理后台，搜索授权，点 Ban。被封禁的授权会：

· 在公开查询页显示为 "Revoked"
· 用户重新下载时返回 403
· 在你的客户端应用里依然验证通过，除非客户端会检查在线状态

重要： 撤销授权不会从用户磁盘上抹掉它。如果你的客户端应用离线验证签名，
它会继续接受一个被撤销的授权。要真正拦住被撤销的授权，客户端需要查一个
撤销列表——Signet 不提供这个。

删除用户账号后授权会怎样？

授权继续留在数据库里，user_id 指向一个不存在的用户。
它们依然显示在公开查询页上，但无法再重新签发（用户没有账号可登录）。

如果你想干净删除，先删授权，或者归档它们。

---

安全

密码存在哪里？

在 users 表里，以 PBKDF2-SHA256 哈希 + 每用户独立的盐存储。10 万次迭代。
明文密码从不存储。

签名密钥存在哪里？

作为 Cloudflare Workers secrets。静态存储时加密，但任何能访问你 Cloudflare 账号
的人都能读到。请像对待 SSH 私钥一样对待它们。

能用自己的签名密钥对吗？

能。用 npm run gen:keys 生成密钥对，作为 LICENSE_SIGN_PRIVATE_KEY 和
LICENSE_SIGN_PUBLIC_KEY 推送。用什么密钥，对应的公钥就要内置到客户端应用里。

有速率限制吗？

默认没有。Cloudflare 边缘提供基础的 DDoS 防护，但 Signet 本身不限制登录尝试
或 API 调用。需要的话，在 backend/src/index.js 里加。

收到安全报告怎么办？

见仓库里的
SECURITY.md。

---

HTTP 状态码

Signet 使用标准 HTTP 状态码，加上 { "error": "..." } 形式的 JSON 响应体。
没有自定义的数字错误码。

状态码 含义 常见原因
200 成功 请求正常完成
400 请求错误 字段缺失、格式无效、人机验证失败
401 未授权 JWT 缺失或无效、密码错误
403 禁止访问 不是管理员、没有有效授权、已被封禁
404 未找到 产品不存在、订单不存在
405 方法不允许 HTTP 方法不对
409 冲突 邮箱已注册、订单已被绑定
500 服务端错误 Worker 里未捕获的异常
503 服务不可用 支付适配器未配置

常见错误消息

消息 路由 含义
Invalid email format 注册 邮箱不匹配正则
Password must be at least 8 characters 注册 密码太短
Email already registered 注册 邮箱重复
Invalid email or password 登录 凭证错误
Order is already bound to another account 绑定 订单已被占用
You already have an order bound to this account 绑定 一用户一订单
No active license found 创建产品 先绑定订单
You already have a product with this name 创建产品 产品名重复
This license has been revoked 签发授权 已被封禁
Unauthorized 管理路由 管理员 token 缺失或无效
Invalid credentials 管理员登录 管理员密码错误

排查错误

打开终端运行：

```bash
cd backend
npx wrangler tail
```

这会实时输出 Worker 日志。Unhandled error: 前缀后面总是跟着真正的错误和
调用栈。

---

自定义

能把 "Signet" 改成别的名字吗？

能。编辑每个 HTML 里的 window.SIGNET_CONFIG.brandName。
见换牌章节。

能用自己的 logo 吗？

能。替换每个 HTML 顶部导航栏里的内联 SVG，或者把标记抽成一个共享片段。

能改授权签名算法吗？

技术上能，但你得同时更新 Worker（签发端）和客户端应用（验证端）。
当前的 Ed25519 方案是个好默认——签名短、验证快、无已知弱点。

能卖 Signet 本身吗？

能。Apache License 2.0 允许你以任何形式再分发 Signet，包括商业化。
但未经许可不能使用 "Signet" 或 "CrCLARE" 商标。

---

商业使用

能用于我的商业产品吗？

能。这是主要用例。

需要付授权费吗？

不需要。Apache License 2.0 免版税。

需要开源我的修改吗？

不一定。你必须保留原始 NOTICE 文件并声明你修改过 Signet，
但你的修改可以保持闭源。

需要在产品里显示 "Powered by Signet" 吗？

不需要。模板里的页脚链接是礼节性的，不是强制要求。你可以删掉。

能完全删掉页脚吗？

能。

---

支持

在哪里报告 Bug？

在 github.com/CrCLARE/Signet/issues
开一个 Issue。

在哪里提问？

在 github.com/CrCLARE/Signet/discussions
开一个讨论。

有商业支持吗？

目前没有。Signet 由 CrCLARE Studio 作为开源项目维护。
商业支持请联系 hi@crclare.top。
