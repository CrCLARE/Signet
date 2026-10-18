所有东西都部署完了。最后一步是接上你自己的域名，让整个部署看起来更专业。

## 可选，但强烈推荐

Signet 在 `*.pages.dev` 和 `*.workers.dev` 上照样能跑。但如果你要给真实用户用，
花 10 分钟配个自定义域名是值得的。

## 第一步 —— 买一个域名

任何注册商都行。常见的几个：

- **Cloudflare Registrar** —— 成本价销售，直接和 Cloudflare 集成
- **Namecheap** —— 便宜、可靠
- **阿里云** —— 如果你的用户主要在中国大陆，推荐这家

选哪家都一样，之后你要么把 nameserver 指向 Cloudflare，要么加 CNAME 记录。
下面几步假设你用的是 Cloudflare Registrar，或者把 DNS 托管在 Cloudflare。

## 第二步 —— 把站点加到 Cloudflare

如果你的域名还不在 Cloudflare 上：

1. 登录 **[dash.cloudflare.com](https://dash.cloudflare.com)**
2. 点 **Add a site**
3. 输入你的域名
4. 选 **Free** 套餐
5. Cloudflare 会要求你去注册商那边改 nameserver —— 照做

DNS 生效需要几分钟。

## 第三步 —— 把前端指向你的域名

在 Cloudflare 控制台：

1. 进入 **Workers & Pages** → 你的 Pages 项目
2. 点 **Custom domains** → **Set up a custom domain**
3. 输入你的域名（例如 `your-domain.com`）
4. 按提示操作

完成后 `https://your-domain.com` 就能访问你的前端了。

可以再加个 `www` 子域——Cloudflare 会自动处理跳转。

## 第四步 —— 把后端指向一个子域

Worker 也一样：

1. 进入 **Workers & Pages** → 你的 Worker
2. 点 **Settings** → **Domains & Routes** → **Add custom domain**
3. 输入 `api.your-domain.com`
4. 按提示操作

完成后 `https://api.your-domain.com` 就能访问你的后端。

## 第五步 —— 更新 ALLOWED_ORIGIN

打开 `backend/wrangler.toml`，修改：

```toml
[vars]
ALLOWED_ORIGIN = "https://your-domain.com"
```

如果你想保留 Pages 地址（方便测试），可以填逗号分隔的列表：

```toml
[vars]
ALLOWED_ORIGIN = "https://your-domain.com,https://signet-frontend.pages.dev"
```

重新部署：

```bash
cd backend
npx wrangler deploy
```

## 第六步 —— 更新前端的 apiBase

在前端 HTML 文件里，把 apiBase 改掉：

```javascript
window.SIGNET_CONFIG = {
  apiBase: 'https://api.your-domain.com',
  ...
};
```

提交并推送。Pages 会自动重新部署。

## 第七步 —— 更新爱发电的 Webhook URL

如果你配了爱发电，去爱发电后台更新 webhook URL：

```
https://api.your-domain.com/api/webhook/afdian
```

## 第八步 —— 启用 HSTS（可选，推荐）

HSTS 会强制所有后续连接走 HTTPS。一旦启用，浏览器会在 max-age 时间内记住这一点
——所以启用前先确认你的域名已经能正常走 HTTPS。

在 Cloudflare 里：

1. 进入 SSL/TLS → Edge Certificates
2. 找到 HTTP Strict Transport Security (HSTS)
3. 点 Enable HSTS
4. max-age 先设小一点（比如 86400 = 1 天）
5. 确认没问题后，再调大到一年（31536000）

## 第九步 —— 换牌

Signet 默认用自己名字和 logo。要变成你自己的，编辑每个 HTML 文件里的
window.SIGNET_CONFIG：

```javascript
window.SIGNET_CONFIG = {
  apiBase: 'https://api.your-domain.com',
  brandName: '你的产品名',
  brandTagline: '你的副标题',
  repoUrl: 'https://github.com/你/你的仓库',
  docsUrl: 'https://docs.your-domain.com',
  supportEmail: 'hi@your-domain.com',
  operatorName: '你的公司名',
  termsEffectiveDate: '2027年1月1日',
  jurisdiction: '你的管辖地',
  pricing: [ /* 你的方案 */ ]
};
```

包含这段配置的完整 HTML 文件清单：

· index.html
· login.html
· register.html
· dashboard.html
· bind.html
· verify.html
· admin.html
· buy.html
· terms.html
· privacy.html
· 404.html

偷懒方案： 如果不想改 11 个文件，把配置块抽到
frontend/assets/config.js 里，每个页面引入它。这是个不错的重构，
但不是首次部署必须的。

## 第十步 —— 更新法务页面

上线前，务必编辑这两个文件：

terms.html —— 找到配置块，更新：

· operatorName —— 你的公司名或个人名
· termsEffectiveDate —— 今天的日期
· jurisdiction —— 你的国家或地区
· supportEmail —— 你真实的客服邮箱

privacy.html —— 更新：

· operatorName
· privacyEffectiveDate
· supportEmail
· analyticsProvider —— 不用分析就设 ''，用了就填服务名

别跳过这一步。 用户会看这些页面。法务主体写 "Example Company" 会严重
侵蚀信任。

## 第十一步 —— 测试生产域名

访问你的自定义域名，完整走一遍流程：

1. 注册一个新账号
2. 如果配了爱发电，买一个真实订单并绑定
3. 否则用管理后台手动开通权限
4. 创建一个产品
5. 下载授权文件
6. 在 /verify.html 上查询这个产品

所有步骤通过，就完工了。

## 日常维护

### 看日志

```bash
cd backend
npx wrangler tail
```

实时输出日志。排查生产问题时很有用。

### 更新密钥

任何密钥都可以之后用 `npx wrangler secret put <NAME>` 更新。

### 拉上游更新

```bash
git fetch upstream
git merge upstream/main
```

只有在审阅过改动之后才合并。Signet 不严格遵循语义化版本号——
次版本可能包含行为变化。

### 定期备份

```bash
npx wrangler d1 export signet-db --output=backup-$(date +%Y%m%d).sql --remote
```

可以考虑用 GitHub Action 或 cron 定时跑。

## 完成

Signet 已经完整部署、换好牌、跑在你自己的域名上了。
恭喜。

遇到问题，看 常见问题，或者到
GitHub 开一个讨论。
