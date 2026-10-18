# Fork 仓库

在部署任何东西之前，你需要先拿到属于你自己的 Signet 源码副本。

## 第一步 —— 在 GitHub 上 Fork

访问 **[github.com/CrCLARE/Signet](https://github.com/CrCLARE/Signet)**。

点击页面右上角的 **Fork** 按钮。GitHub 会在你自己的账号下创建一个仓库副本。

> **提示：** 如果你要部署到某个 GitHub 组织下，直接 Fork 到该组织，而不是你的个人账号。
> 这样以后做权限管理会方便很多。

## 第二步 —— 本地克隆

打开终端，执行：

```bash
git clone https://github.com/<你的用户名>/Signet.git
cd Signet
```

把 <你的用户名> 替换成你实际的 GitHub 用户名。

## 第三步 —— 看一下目录结构

你应该能看到：

```
Signet/
├── backend/          Cloudflare Workers 后端
│   ├── src/          源码
│   ├── scripts/      安装辅助脚本
│   ├── schema.sql    D1 数据库表结构
│   ├── package.json
│   └── wrangler.toml Worker 配置
├── frontend/         静态前端
│   ├── assets/       共享 JavaScript
│   └── *.html        所有页面
├── docs/             文档（就是本站）
├── LICENSE           Apache License 2.0
├── NOTICE            署名
└── README.md
```

你最常打交道的两个目录是 backend/ 和 frontend/。

## 第四步 —— 确认 Node.js

确认你装的是 Node.js 18 或更高版本：

```bash
node --version
```

如果输出 v18.x.x 或更高，就没问题。如果低于 18，去 nodejs.org
装一个新版本。

# 下一步

现在你有了自己的副本，是时候部署前端了。

→ 配置 Cloudflare Pages

## 关于保持同步

如果你想后续拉取上游仓库的更新（比如安全补丁），可以把上游加为一个 remote：

```bash
git remote add upstream https://github.com/CrCLARE/Signet.git
```

以后要拉更新：

```bash
git fetch upstream
git merge upstream/main
```

但第一次部署不需要这个。先把自己的副本跑起来才是正事。
