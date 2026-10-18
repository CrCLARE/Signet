# 配置 Cloudflare Workers

Worker 是 Signet 的后端。它负责用户账号、订单绑定、授权签发和管理后台 API。
和传统服务器不同，它跑在边缘——没有虚拟机，没有容器，没有月租。

## 这一步要做什么

- 安装 Worker 的依赖
- 创建 D1 数据库
- 设置各种密钥（JWT 密钥、管理员密码、签名密钥对）
- 部署 Worker

这是部署过程中最长的一步，但全程都是机械操作。

## 第一步 —— 安装依赖

在终端执行：

```bash
cd backend
npm install
```

这会拉取 wrangler（Cloudflare 的 CLI）和 @noble/ed25519（用于签名）。
没有其他依赖。

## 第二步 —— 登录 Cloudflare

```bash
npx wrangler login
```

这会打开浏览器标签页。授权 wrangler 访问你的 Cloudflare 账号。
完成后终端会提示成功。

## 第三步 —— 创建 D1 数据库

```bash
npx wrangler d1 create signet-db
```

wrangler 会输出类似：

```
✅ Successfully created DB 'signet-db'

[[d1_databases]]
binding = "DB"
database_name = "signet-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

把 database_id 复制下来，下一步要用。

## 第四步 —— 编辑 wrangler.toml

打开 backend/wrangler.toml，找到这一段：

```toml
[[d1_databases]]
binding = "DB"
database_name = "signet-db"
database_id = "<YOUR_D1_DATABASE_ID>"
```

把 <YOUR_D1_DATABASE_ID> 换成刚才复制的 ID。

再往下找到：

```toml
[vars]
ALLOWED_ORIGIN = "https://example.com"
```

把 https://example.com 改成上一步拿到的 Pages 地址
（例如 https://signet-frontend.pages.dev）。这会把 API 调用限制在你自己的前端。

多个来源： 这里可以填多个用逗号分隔的地址：
"https://signet-frontend.pages.dev,https://你的域名.com"。过渡期很有用。

## 第五步 —— 初始化数据库表结构

```bash
npx wrangler d1 execute signet-db --file=./schema.sql --remote
```

这会创建五张表：

· users —— 账号数据

· orders —— 支付订单

· products —— 用户创建的产品

· licenses —— 签发记录

· audit_log —— 管理员操作历史

验证：

```bash
npx wrangler d1 execute signet-db \
  --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" \
  --remote
```

应该能看到这五张表以及 _cf_KV。

## 第六步 —— 生成密钥

在 backend/ 下依次执行这三条：

```bash
# 1. 管理员密码
npm run gen:admin-pwd "你的强密码"

# 2. Ed25519 签名密钥对
npm run gen:keys

# 3. JWT 密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

每条命令都会输出值。在继续之前，把所有值保存到密码管理器或离线笔记里。

## 第七步 —— 推送密钥到 Cloudflare

逐条执行，每条会提示你粘贴值：

```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put ADMIN_USERNAME
npx wrangler secret put ADMIN_PASSWORD_HASH
npx wrangler secret put ADMIN_PASSWORD_SALT
npx wrangler secret put ADMIN_JWT_SECRET
npx wrangler secret put LICENSE_SIGN_PRIVATE_KEY
npx wrangler secret put LICENSE_SIGN_PUBLIC_KEY
```

对应关系：

密钥 来源

JWT_SECRET 上面 node -e ... 生成的十六进制字符串

ADMIN_USERNAME 你想要的登录名

ADMIN_PASSWORD_HASH gen:admin-pwd 的输出

ADMIN_PASSWORD_SALT gen:admin-pwd 的输出

ADMIN_JWT_SECRET 另一个不同的十六进制字符串 —— 重新生成一次

LICENSE_SIGN_PRIVATE_KEY gen:keys 的输出

LICENSE_SIGN_PUBLIC_KEY gen:keys 的输出

关于密钥： Cloudflare 会在静态存储时加密密钥，但任何能访问你账号的人都能读取。
请像对待 SSH 私钥一样对待它们。

## 第八步 —— 部署

```bash
npx wrangler deploy
```

你会看到类似输出：

```
Uploaded signet-backend (1.42 sec)
Deployed signet-backend triggers (0.13 sec)
  https://signet-backend.<你的账号>.workers.dev
```

把 .workers.dev 地址复制下来，马上要用。

## 第九步 —— 测试 Worker

```bash
curl https://signet-backend.<你的账号>.workers.dev/
```

预期返回：

```json
{"ok":true,"service":"signet","version":"1.0.0"}
```

看到这个就说明 Worker 已上线，D1 绑定正常。

## 第十步 —— 让前端指向后端

现在编辑前端文件，指向 Worker 地址。所有带下面这段配置的 HTML 都要改：

```html
<script>
  window.SIGNET_CONFIG = {
    apiBase: 'https://api.example.com',
    ...
  };
</script>
```

把 apiBase 改成你的 Worker 地址。

需要修改的文件：

· frontend/index.html

· frontend/login.html

· frontend/register.html

· frontend/dashboard.html

· frontend/bind.html

· frontend/verify.html

· frontend/admin.html

· frontend/buy.html

· frontend/terms.html

· frontend/privacy.html

· frontend/404.html

提交并推送。Cloudflare Pages 会自动重新部署，通常 30 秒内完成。

## 常见问题排查

Cannot find module 'wrangler'
你漏了在 backend/ 里执行 npm install。补上。

wrangler login 之后报 Authentication error
浏览器和终端可能登录了不同的账号。执行 npx wrangler logout，再 npx wrangler login。

database_id 无效
ID 必须逐字复制。不能有空格、引号，注意结尾换行符。

Worker 每个请求都返回 500
在另一个终端执行 wrangler tail 看实时日志。缺 secret 会在这里暴露出来。

## 下一步

数据库部署好了，但还是空的。是时候初始化它的结构了。

→ 初始化 D1 数据库
