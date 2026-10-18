# 配置 Cloudflare Pages

Cloudflare Pages 负责托管前端——也就是用户实际看到的那些静态 HTML、CSS 和 JavaScript。
它免费、快，而且可以直接连接你 Fork 的 GitHub 仓库。

## 第一步 —— 打开 Cloudflare 控制台

访问 **[dash.cloudflare.com](https://dash.cloudflare.com)** 并登录。

左侧边栏点击 **Workers & Pages**。

## 第二步 —— 创建 Pages 项目

点击 **Create application** → **Pages** → **Connect to Git**。

Cloudflare 会请求访问你的 GitHub 账号。**只授权它访问你 Fork 的 `Signet` 仓库**，
不要选 "All repositories"。

## 第三步 —— 选择仓库

从列表里选中你 Fork 的 `Signet` 仓库。

然后配置构建：

| 字段 | 值 |
|:---|:---|
| **Project name** | `signet-frontend`（或你喜欢的名字） |
| **Production branch** | `main` |
| **Framework preset** | None |
| **Build command** | **留空** |
| **Build output directory** | `frontend` |

## 第四步 —— 部署

点击 **Save and Deploy**。

Cloudflare 大约 30 秒完成构建和部署。完成后你会看到一个类似这样的地址：

```

https://signet-frontend.pages.dev

```

这就是你的线上站点。但它现在还打不通——因为前端还不知道后端在哪。
等 Worker 部署完再回来配这个。

## 第五步 —— 记下这个 URL

把 Pages 的地址存起来——配置 Worker 的 `ALLOWED_ORIGIN` 变量时要用。

## 关于配置文件的说明

`frontend/_headers` 文件控制页面的缓存行为：

- JS 和 CSS 设置为 `max-age=0, must-revalidate` —— 浏览器每次都会问服务器
  有没有新版本。开发阶段这正是你想要的。等站点稳定之后，可以把这几个改成
  长时间的 `max-age` 来提速。

- HTML 文件永不缓存，用户永远拿到最新版本。

刚上手不用改 `_headers`，它默认就能跑。

## 下一步

现在前端已经上线（但还没接上后端）。接下来部署后端。

→ **[配置 Cloudflare Workers](./worker)**
