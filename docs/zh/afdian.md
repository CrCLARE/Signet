 # 配置爱发电

爱发电是一个面向创作者的中国支付平台。Signet 内置了它的适配器。

如果你不用爱发电，可以跳过这一页——你仍然可以部署 Signet，用管理后台手动开通权限。

## 这一步要做什么

- 拿到爱发电的 `user_id` 和 API Token
- 把它们推送为 Cloudflare Secrets
- 配置 Webhook URL
- 端到端测试整个流程

## 第一步 —— 打开开发者后台

访问 **[ifdian.net/dashboard/dev](https://ifdian.net/dashboard/dev)** 并登录。

你会看到两个需要的值：

- **user_id** —— 标识你账号的十六进制字符串
- **API Token** —— 用于签名对外请求的密钥

## 第二步 —— 生成 API Token

如果还没生成，点 API Token 字段旁边的 **生成** 按钮。

**立刻把 Token 复制下来。** 爱发电只显示一次。丢了就得重新生成（会作废旧的那个）。

## 第三步 —— 推送密钥到 Cloudflare

在终端：

```bash
npx wrangler secret put AFDIAN_USER_ID
npx wrangler secret put AFDIAN_TOKEN
```

按提示粘贴对应的值。

第四步 —— 配置 Webhook URL

在爱发电开发者后台，找到 Webhook URL 字段，填入：

```
https://signet-backend.<你的账号>.workers.dev/api/webhook/afdian
```

把 <你的账号> 替换成你实际的 Cloudflare Workers 子域名。

点 发送测试。后台应该提示成功。

第五步 —— 验证测试

打开另一个终端运行：

```bash
npx wrangler tail
```

这会流式输出 Worker 的实时日志。然后回到爱发电后台再点一次 发送测试。

你应该能看到类似这样的日志：

```
[afdian] missing sign, treated as test: 202106232138371083454010626
```

这是预期行为——爱发电的测试 webhook 不带有效签名，所以 Signet 正确识别为测试数据并忽略。

如果看到 500 错误，说明两个密钥里有配错的。

第六步 —— 在爱发电创建方案

在用户能买东西之前，你需要在爱发电创建一个方案：

1. 在爱发电后台进入 我的方案
2. 新建一个方案
3. 定价（比如 ¥19.90）
4. 记下 plan_id —— 它会出现在订单 webhook 里

Signet 默认模板里，Pro 方案定价 ¥19.90。如果你改价，记得同步修改
backend/src/adapters/afdian.js 里的金额校验。

第七步 —— 测试真实购买

验证一切正常的最好方式，就是真的买一次自己的商品：

1. 退出爱发电登录，或者用无痕窗口
2. 访问你自己的商品页面
3. 完成支付
4. 记下成功页面上显示的订单号
5. 回到你的 Signet 前端
6. 访问 /bind.html，粘贴订单号
7. 应该能绑定成功并解锁产品创建

如果绑定失败，检查：

· Worker 日志（npx wrangler tail）里有没有 webhook 错误
· D1 里的 orders 表——webhook 有没有插入记录？

```bash
npx wrangler d1 execute signet-db \
  --command="SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;" \
  --remote
```

适配器如何工作

爱发电适配器干两件事：

1. 接收 webhook

用户付款后，爱发电会向 /api/webhook/afdian 发送 POST 请求，携带订单详情。

适配器会：

· 用爱发电官方 RSA 公钥验证签名
· 拒绝来自爱发电官方文档的示例订单号
· 拒绝没有有效签名的订单
· 把订单插入 orders 表（如果尚不存在）

2. 按需查询订单

如果 webhook 丢失（网络故障等），适配器可以直接查询订单：

· 用户在 /bind.html 提交订单号
· 如果本地数据库里没有，Worker 调用 https://ifdian.net/api/open/query-order
· 验证响应并插入

这意味着即使 webhook 不可靠，绑定流程也能正常工作。

签名验证

爱发电使用 RSA-SHA256 作为 webhook 签名算法。公钥已内置在适配器里
（AFDIAN_PUBLIC_KEY）。验证签名时，适配器会：

1. 拼接 out_trade_no + user_id + plan_id + total_amount
2. 用这个字符串验证 base64 解码后的签名

验证失败时，webhook 会被记录并忽略。无论如何都返回 HTTP 200——
爱发电在非 200 响应时会重试，而无效签名你不希望它重试。

常见问题

Webhook 从来不触发
确认爱发电后台里的 URL 完全正确，包括结尾的 /afdian。爱发电不会报 URL 错误。

订单绑定了但没签发授权
检查用户是否真的有一个有效订单。运行：

```bash
npx wrangler d1 execute signet-db \
  --command="SELECT * FROM orders WHERE bound_user_id IS NOT NULL;" \
  --remote
```

日志里出现 amount mismatch
订单金额和预期的 19.90 不符。如果你改了定价，更新
backend/src/adapters/afdian.js 里的 PRO_PRICE 常量。

下一步

核心流程已经部署好并能跑通。现在用自定义域名美化一下。

→ 收尾工作
