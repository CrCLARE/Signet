export default {
  title: "Signet",
  description: "面向独立开发者的 SaaS 授权平台模板",
  base: "/",
  cleanUrls: true,
  head: [
    ['meta', { name: 'theme-color', content: '#3b82f6' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Signet' }],
    ['meta', { property: 'og:description', content: 'SaaS authorization platform template for indie developers.' }],
  ],
  markdown: {
    html: false, // 防止 <NAME> 标签报错
  },
  themeConfig: {
    siteTitle: "Signet",
    search: { provider: "local" },
    socialLinks: [
      { icon: "github", link: "https://github.com/CrCLARE/Signet" }
    ],
    lastUpdated: true,
  }
}
