import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Signet',
  description: '面向独立开发者的 SaaS 授权平台模板',
  // base: '/zh', // ← 删掉：根域部署，中文走 /zh/、英文走 /en/，base 再设子路径会变成 /zh/zh/...
  lang: 'zh-CN',

  markdown: {
    // 防止 md 里的占位符（如 <username>、<TOKEN>）被 Vue 编译器当成组件标签导致 build 失败
    html: false
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#3b82f6' }]
  ],

  // 直接分 zh 和 en，不要 root，从根源上斩断路径混乱
  locales: {
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      title: 'Signet',
      description: '面向独立开发者的 SaaS 授权平台模板'
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      title: 'Signet',
      description: 'SaaS authorization platform template for indie developers'
    }
  },

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Signet',

    // 本地搜索，locale 会自动继承
    search: {
      provider: 'local'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/CrCLARE/Signet' }
    ],

    lastUpdated: true,

    // ================== 中文配置 ==================
    locales: {
      zh: {
        label: '简体中文',
        lang: 'zh-CN',
        link: '/zh/',
        themeConfig: {
          nav: [
            { text: '指南', link: '/zh/getting-started' },
            { text: '部署', link: '/zh/worker' },
            { text: '高级', link: '/zh/advanced' },
            { text: '常见问题', link: '/zh/faq' }
          ],
          // 前缀精准匹配 /zh/，这样上一页/下一页才能算出来
          sidebar: {
            '/zh/': [
              {
                text: '开始使用',
                items: [
                  { text: '介绍', link: '/zh/' },
                  { text: '快速开始', link: '/zh/getting-started' },
                  { text: 'Fork 仓库', link: '/zh/fork' }
                ]
              },
              {
                text: '部署',
                items: [
                  { text: 'Cloudflare Pages', link: '/zh/pages' },
                  { text: 'Cloudflare Workers', link: '/zh/worker' },
                  { text: 'D1 数据库', link: '/zh/d1' },
                  { text: '爱发电适配器', link: '/zh/afdian' },
                  { text: '收尾工作', link: '/zh/finalize' }
                ]
              },
              {
                text: '参考',
                items: [
                  { text: '高级：二次开发', link: '/zh/advanced' },
                  { text: '常见问题', link: '/zh/faq' },
                  { text: '关于 Signet', link: '/zh/about' },
                  { text: '贡献者名单', link: '/zh/contributors' },
                  { text: '赞助者名单', link: '/zh/sponsors' }
                ]
              }
            ]
          },
          // 下面这些必须塞进 zh 的 themeConfig 里，否则直接隐身
          docFooter: { prev: '上一篇', next: '下一篇' },
          outline: { label: '本页目录', level: [2, 3] },
          editLink: {
            // :path 已包含 zh/ 这一段，前面不要再拼 locale 目录
            pattern: 'https://github.com/CrCLARE/Signet/edit/main/docs/:path',
            text: '在 GitHub 上编辑此页'
          },
          footer: {
            message: 'Apache License 2.0',
            copyright: `Copyright © ${new Date().getFullYear()} CrCLARE Studio`
          }
        }
      },

      // ================== 英文配置 ==================
      en: {
        label: 'English',
        lang: 'en-US',
        link: '/en/',
        themeConfig: {
          nav: [
            { text: 'Guide', link: '/en/getting-started' },
            { text: 'Deploy', link: '/en/worker' },
            { text: 'Advanced', link: '/en/advanced' },
            { text: 'FAQ', link: '/en/faq' }
          ],
          sidebar: {
            '/en/': [
              {
                text: 'Getting Started',
                items: [
                  { text: 'Introduction', link: '/en/' },
                  { text: 'Getting started', link: '/en/getting-started' },
                  { text: 'Fork', link: '/en/fork' }
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
                  { text: 'Advanced', link: '/en/advanced' },
                  { text: 'FAQ', link: '/en/faq' },
                  { text: 'About Signet', link: '/en/about' },
                  { text: 'Contributors', link: '/en/contributors' },
                  { text: 'Sponsors', link: '/en/sponsors' }
                ]
              }
            ]
          },
          docFooter: { prev: 'Previous', next: 'Next' },
          outline: { label: 'On this page', level: [2, 3] },
          editLink: {
            pattern: 'https://github.com/CrCLARE/Signet/edit/main/docs/:path',
            text: 'Edit this page on GitHub'
          },
          footer: {
            message: 'Apache License 2.0',
            copyright: `Copyright © ${new Date().getFullYear()} CrCLARE Studio`
          }
        }
      }
    }
  }
})
