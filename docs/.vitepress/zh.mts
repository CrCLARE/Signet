export default {
  label: "简体中文",
  lang: "zh-CN",
  title: "Signet",
  description: "面向独立开发者的 SaaS 授权平台模板",
  themeConfig: {
    nav: [
      { text: '指南', link: '/getting-started' },
      { text: '部署', link: '/worker' },
      { text: '高级', link: '/advanced' },
      { text: '常见问题', link: '/faq' },
      {
        text: '相关链接',
        items: [
          { text: 'GitHub 仓库', link: 'https://github.com/CrCLARE/Signet' },
          { text: 'Gitee 镜像', link: 'https://gitee.com/CLARE-XHL/Signet' },
          { text: '在线演示', link: 'https://chronos.crclare.top' },
          { text: '赞助支持', link: 'https://crclare.top/reward' }
        ]
      }
    ],
    sidebar: {
      '/': [
        {
          text: '开始使用',
          items: [
            { text: 'Signet 是什么？', link: '/' },
            { text: '快速开始', link: '/getting-started' },
            { text: 'Fork 仓库', link: '/fork' }
          ]
        },
        {
          text: '部署',
          items: [
            { text: 'Cloudflare Pages', link: '/pages' },
            { text: 'Cloudflare Workers', link: '/worker' },
            { text: 'D1 数据库', link: '/d1' },
            { text: '爱发电适配器', link: '/afdian' },
            { text: '收尾工作', link: '/finalize' }
          ]
        },
        {
          text: '参考',
          items: [
            { text: '高级：二次开发', link: '/advanced' },
            { text: '常见问题', link: '/faq' }
          ]
        },
        {
          text: '关于',
          items: [
            { text: '关于 Signet', link: '/about' },
            { text: '贡献者名单', link: '/contributors' },
            { text: '赞助者名单', link: '/sponsors' }
          ]
        }
      ]
    },
    editLink: {
      pattern: 'https://github.com/CrCLARE/Signet/edit/main/docs/zh/:path',
      text: '在 GitHub 上编辑此页'
    },
    footer: {
      message: 'Apache License 2.0 · 开源无黑盒',
      copyright: `Copyright © ${new Date().getFullYear()} CrCLARE Studio · Made by CLARE-XHL`
    },
    outline: { label: '本页目录', level: [2, 3] },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdatedText: '最后更新',
    returnToTopLabel: '回到顶部',
    darkModeSwitchLabel: '主题',
    sidebarMenuLabel: '菜单'
  }
}
