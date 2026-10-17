export default {
  title: "Signet",
  description: "面向独立开发者的 SaaS 授权平台模板",
  base: "/",
  cleanUrls: true,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#3b82f6' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Signet' }],
    ['meta', { property: 'og:description', content: 'SaaS authorization platform template for indie developers.' }],
    ['meta', { property: 'og:image', content: '/logo.svg' }]
  ],
  markdown: {
    html: false, // 防止 <NAME> 标签报错
  },
  themeConfig: {
    logo: "/logo.svg",
    siteTitle: "Signet",
    search: { provider: "local" },
    socialLinks: [
      { icon: "github", link: "https://github.com/CrCLARE/Signet" }
    ],
    lastUpdated: true,
  }
}
