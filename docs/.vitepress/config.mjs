import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Signet',
  description: '面向独立开发者的 SaaS 授权平台模板',
  base: '/',
  lang: 'zh-CN',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#3b82f6' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Signet' }],
    ['meta', { property: 'og:description', content: 'SaaS authorization platform template for indie developers.' }],
    ['meta', { property: 'og:image', content: '/logo.svg' }]
  ],

  // ------------------------------------------------------------
  // 多语言配置
  // root = 简体中文（默认进入），en = English（挂在 /en/ 下）
  // 中文文档实际文件位于 docs/zh/，URL 通过 rewrite 映射到根路径。
  // ------------------------------------------------------------
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      title: 'Signet',
      description: '面向独立开发者的 SaaS 授权平台模板',
      link: '/'
    },
    en: {
      label: 'English',
      lang: 'en-US',
      title: 'Signet',
      description: 'SaaS authorization platform template for indie developers',
      link: '/en/'
    }
  },

  // ------------------------------------------------------------
  // 把 docs/zh/ 里的文件映射到根路径
  // 这样用户访问 / 时看到中文，访问 /en/ 时看到英文
  // 文件仍然放在 docs/zh/ 里，结构不乱
  // ------------------------------------------------------------
  rewrites: {
    'zh/:rest*': ':rest*'
  },

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Signet',

    socialLinks: [
      { icon: 'github', link: 'https://github.com/CrCLARE/Signet' }
    ],

    lastUpdated: true,

    editLink: {
      pattern: 'https://github.com/CrCLARE/Signet/edit/main/docs/zh/:path',
      text: '在 GitHub 上编辑此页'
    },

    footer: {
      message: 'Apache License 2.0 · 开源无黑盒',
      copyright: `Copyright © ${new Date().getFullYear()} CrCLARE Studio · Made by CLARE-XHL`
    },

    // ============================================================
    // 中文（root）—— URL 根路径，文件在 docs/zh/
    // ============================================================
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

    outline: { label: '本页目录', level: [2, 3] },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdatedText: '最后更新',
    returnToTopLabel: '回到顶部',
    darkModeSwitchLabel: '主题',
    sidebarMenuLabel: '菜单',

    // ============================================================
    // English（挂在 /en/ 下）
    // ============================================================
    locales: {
      en: {
        label: 'English',
        lang: 'en-US',
        link: '/en/',
        themeConfig: {
          nav: [
            { text: 'Guide', link: '/en/getting-started' },
            { text: 'Deploy', link: '/en/worker' },
            { text: 'Advanced', link: '/en/advanced' },
            { text: 'FAQ', link: '/en/faq' },
            {
              text: 'Links',
              items: [
                { text: 'GitHub', link: 'https://github.com/CrCLARE/Signet' },
                { text: 'Gitee Mirror', link: 'https://gitee.com/CLARE-XHL/Signet' },
                { text: 'Live demo', link: 'https://chronos.crclare.top' },
                { text: 'Sponsor', link: 'https://crclare.top/reward' }
              ]
            }
          ],

          sidebar: {
            '/en/': [
              {
                text: 'Getting Started',
                items: [
                  { text: 'What is Signet?', link: '/en/' },
                  { text: 'Getting started', link: '/en/getting-started' },
                  { text: 'Fork the repository', link: '/en/fork' }
                ]
              },
              {
                text: 'Deploy',
                items: [
                  { text: 'Cloudflare Pages', link: '/en/pages' },
                  { text: 'Cloudflare Workers', link: '/en/worker' },
                  { text: 'D1 database', link: '/en/d1' },
                  { text: 'Afdian adapter', link: '/en/afdian' },
                  { text: 'Finishing touches', link: '/en/finalize' }
                ]
              },
              {
                text: 'Reference',
                items: [
                  { text: 'Advanced: extending Signet', link: '/en/advanced' },
                  { text: 'FAQ', link: '/en/faq' }
                ]
              },
              {
                text: 'About',
                items: [
                  { text: 'About Signet', link: '/en/about' },
                  { text: 'Contributors', link: '/en/contributors' },
                  { text: 'Sponsors', link: '/en/sponsors' }
                ]
              }
            ]
          },

          editLink: {
            pattern: 'https://github.com/CrCLARE/Signet/edit/main/docs/en/:path',
            text: 'Edit this page on GitHub'
          },

          outline: { label: 'On this page', level: [2, 3] },
          docFooter: { prev: 'Previous', next: 'Next' },
          lastUpdatedText: 'Last updated',
          returnToTopLabel: 'Back to top',
          darkModeSwitchLabel: 'Theme',
          sidebarMenuLabel: 'Menu'
        }
      }
    }
  }
})
