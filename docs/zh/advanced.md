# 高级 —— 二次开发

> **本章属于高级章节。** 假设你已经熟悉 JavaScript、Cloudflare Workers 和 Signet
> 的整体结构。如果你只是想部署 Signet，这一页不需要看。

Signet 跑起来之后，你可能会想扩展它。本页覆盖四种最常见的扩展方式。

## 添加一个新的支付适配器

Signet 内置一个适配器（爱发电）。加一个新的大约五十行代码。

### 1. 创建适配器文件

新建 `backend/src/adapters/<名称>.js`。适配器必须导出三样东西：

```javascript
export default {
  name: 'stripe',
  label: 'Stripe',

  // 所有必需的环境变量都存在时返回 true
  isConfigured(env) {
    return !!(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
  },

  // 处理进来的 webhook。必须返回 Response
  async handleWebhook(request, env, ctx) {
    // 验证签名、解析载荷、写入 orders 表
    return json({ ok: true });
  },

  // 按订单号查询订单。返回规范化订单或 null
  async queryOrder(orderNo, env) {
    // ... 从支付平台 API 拉取
    return {
      order_no: '...',
      amount: '19.90',
      status: 'paid',
      buyer_id: '...',
      paid_at: Date.now(),
      raw: { /* 原始载荷 */ }
    };
  }
};
```

### 2. 注册它

编辑 backend/src/adapters/index.js：

```javascript
import afdian from './afdian.js';
import stripe from './stripe.js';   // ← 新增

const registry = {
  afdian,
  stripe                              // ← 新增
};
```

### 3. 配置密钥

```bash
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

### 4. 部署

```bash
npx wrangler deploy
```

前端会自动在绑定页显示 Stripe 选项——它从 GET /api/adapters 读列表。

适配器的几条规则

· 绝不抛异常。 失败时返回 null 或 false。核心代码会优雅处理缺失数据；
  抛异常会中断请求。
· handleWebhook 必须返回 Response。 不同平台期望不同的确认格式，
  由适配器决定。
· queryOrder 返回值必须规范化。 不要把平台特有的字段名泄漏进核心代码。
· 签名验证是必须的。 参考 afdian.js 里的 verifyWebhookSignature。

---

## 自定义授权文件格式

默认授权文件是一个 JSON 对象：

```json
{
  "v": 1,
  "product_uid": "A1B2C3D4E5F6G7H8",
  "product_name": "My Product",
  "user_id": "257b...",
  "fingerprint": "257b...",
  "issued_at": 1791198240,
  "signature": "d0654793aa6f..."
}
```

签名覆盖前六个字段，用 | 拼接：

```
1|A1B2C3D4E5F6G7H8|My Product|257b...|257b...|1791198240
```

要改格式，编辑 backend/src/licenses.js。两边都要改——Worker 里的签发逻辑
和你客户端应用里的验证逻辑必须对同一个格式达成一致。

向后兼容： 改格式时记得升级 v 字段。只要客户端同时支持新旧两个版本，
旧授权就能继续验证通过。

---

## 接入人机验证（captcha）

Signet 默认不带 captcha，但加进去很简单。推荐 Cloudflare Turnstile——
免费、隐私友好、不需要追踪。

### 后端

加一个验证辅助函数：

```javascript
async function verifyTurnstile(token, env) {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token
    })
  });
  const data = await res.json();
  return data.success === true;
}
```

在 register() 开头调用：

```javascript
export async function register(request, env) {
  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const ok = await verifyTurnstile(body.captchaToken, env);
  if (!ok) return json({ error: 'Captcha verification failed' }, 400);

  // ... register 其余逻辑
}
```

### 前端

在 register.html 里加 Turnstile 的脚本和小组件：

```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

<form id="registerForm">
  <!-- ... 现有字段 ... -->
  <div class="cf-turnstile" data-sitekey="你的 SITE_KEY"></div>
  <button type="submit">Create account</button>
</form>
```

提交时把 token 传进去：

```javascript
const captchaToken = document.querySelector('[name="cf-turnstile-response"]').value;
await AuthAPI.register({ email, nickname, password, captchaToken });
```

### 其他方案

· Google reCAPTCHA v3 —— 同样的模式，换个 endpoint
· 极验 —— 在中国大陆表现好，真实流量下需要付费

如果你打算支持多个方案，建议把 captcha 抽象成适配器（就像支付那样）。

---

## 换牌

要把 Signet 改成你自己的产品名，编辑每个 HTML 里的 window.SIGNET_CONFIG。
完整字段清单见 收尾工作。

把配置抽成一个文件

如果改 11 个 HTML 文件太烦，把配置抽出来：

### 1. 新建 frontend/assets/config.js：

```javascript
window.SIGNET_CONFIG = {
  apiBase: 'https://api.your-domain.com',
  brandName: '你的产品',
  // ...
};
```

### 2. 把每个 HTML 里的内联配置块换成：

```html
<script src="/assets/config.js"></script>
```

### 3. 放在 auth.js 之前加载。

以后换牌就只需要改一个文件。

---

## 接入邮件（密码重置）

Signet 有意不带邮件支持。如果你想要用户自助重置密码，需要自己接一个服务商。

推荐：Resend（API 简洁、免费额度慷慨）。

### 1. 加一条路由：

```javascript
if (method === 'POST' && path === '/api/auth/forgot-password') {
  return wrap(await forgotPassword(request, env));
}
```

### 2. 在 auth.js 里实现：

```javascript
export async function forgotPassword(request, env) {
  const { email } = await readJson(request);
  if (!email) return json({ error: 'Email required' }, 400);

  const user = await env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email.toLowerCase()).first();

  // 无论如何都返回成功——不要暴露账号是否存在
  if (user) {
    const token = uuid();
    await env.KV.put(`pwd-reset:${token}`, user.id, { expirationTtl: 1800 });
    await sendResetEmail(email, token, env);
  }
  return json({ ok: true });
}
```

### 3. 用 Resend 的 API 实现 sendResetEmail。

你还需要在 wrangler.toml 里加一个 KV 绑定。

安全提醒： 无论邮箱是否存在都返回成功。否则攻击者可以枚举已注册账号。

---

## XSS 加固

Signet 对所有动态内容都用了 escapeHtml() 和 escapeAttr()。
如果你要扩展前端，遵守这几条规则。

### 规则 1 —— 优先用 textContent 而不是 innerHTML

```javascript
// ✅ 安全
element.textContent = user.nickname;

// ❌ 没转义的话很危险
element.innerHTML = user.nickname;
```

### 规则 2 —— 绝不用字符串拼接构建事件处理器

```html
<!-- ❌ 危险 -->
<button onclick="doThing('${userInput}')">Click</button>

<!-- ✅ 安全 —— 用 data 属性 + 事件委托 -->
<button data-action="do-thing" data-value="${escapeAttr(userInput)}">Click</button>
```

```javascript
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action="do-thing"]');
  if (!btn) return;
  doThing(btn.dataset.value);
});
```

### 规则 3 —— 注入 href 前先验证 URL

```javascript
function safeUrl(url) {
  if (!/^https?:\/\//i.test(url)) return '#';
  return url;
}
```

这会拦住 javascript: 和 data: 之类的 URL。

### 规则 4 —— 加 CSP 响应头

在 frontend/_headers 里：

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://api.your-domain.com
```

把 connect-src 调整成包含你的 Worker 地址。可选，但生产环境推荐加上。
 'self' 'unsafe-inline' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://api.your-domain.com
```

Adjust the connect-src to include your Worker URL. This is optional but
recommended for production.
