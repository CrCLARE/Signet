export default {
  label: "English",
  lang: "en-US",
  title: "Signet",
  description: "SaaS authorization platform template for indie developers",
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
    footer: {
      message: 'Apache License 2.0 · Open source, no black box',
      copyright: `Copyright © ${new Date().getFullYear()} CrCLARE Studio · Made by CLARE-XHL`
    },
    outline: { label: 'On this page', level: [2, 3] },
    docFooter: { prev: 'Previous', next: 'Next' },
    lastUpdatedText: 'Last updated',
    returnToTopLabel: 'Back to top',
    darkModeSwitchLabel: 'Theme',
    sidebarMenuLabel: 'Menu'
  }
}
