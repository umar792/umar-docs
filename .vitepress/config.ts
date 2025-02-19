import { defineConfig } from 'vitepress'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'

export default defineConfig({
  lang: 'en-US',
  title: 'JavaScript Guide',
  description: 'Complete JavaScript documentation with examples',
  markdown: {
    config(md) {
      md.use(tabsMarkdownPlugin)
    }
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/javascript.svg' }]
  ],
  themeConfig: {
    logo: '/javascript.svg',
    search: {
      provider: 'local',
      options: {
        detailedView: true,
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: {
              title: 2,
              text: 1
            }
          }
        }
      }
    },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Playground', link: '/playground' }
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/introduction' }
        ]
      },
      {
        text: 'NextJS',
        collapsed: true,
        items: [
          { text: 'Next Auth', 
            collapsed : true,
            items : [
                {
                    text : "Getting Started",
                    link : "/nextjs/next-auth/getting-started"
                },
                {
                    text : "Auth Options",
                    link : "/nextjs/next-auth/auth-options"
                },
                {
                    text : "Providers",
                    link : "/nextjs/next-auth/providers"
                },
                {
                    text : "Callbacks",
                    link : "/nextjs/next-auth/callbacks"
                },
                {
                    text : "JWT Strategy",
                    link : "/nextjs/next-auth/jwt-strategy"
                }

            ]

           },
        ]
      },
    //   {
    //     text: 'Functions & Objects',
    //     collapsed: false,
    //     items: [
    //       { text: 'Functions', link: '/core/functions' },
    //       { text: 'Objects', link: '/core/objects' },
    //       { text: 'Arrays', link: '/core/arrays' },
    //       { text: 'Scope & Closures', link: '/core/scope-closures' }
    //     ]
    //   },
    //   {
    //     text: 'Advanced',
    //     collapsed: true,
    //     items: [
    //       { text: 'Async Programming', link: '/advanced/async' },
    //       { text: 'Error Handling', link: '/advanced/errors' },
    //       { text: 'Modules', link: '/advanced/modules' },
    //       { text: 'Prototypes', link: '/advanced/prototypes' }
    //     ]
    //   },
    //   {
    //     text: 'Browser APIs',
    //     collapsed: true,
    //     items: [
    //       { text: 'DOM Manipulation', link: '/browser/dom' },
    //       { text: 'Events', link: '/browser/events' },
    //       { text: 'Web Storage', link: '/browser/storage' },
    //       { text: 'Fetch API', link: '/browser/fetch' }
    //     ]
    //   },
    //   {
    //     text: 'Components',
    //     collapsed: true,
    //     items: [
    //       {
    //         text: 'UI Components',
    //         collapsed: true,
    //         items: [
    //           { text: 'Buttons', link: '/components/buttons' },
    //           { text: 'Forms', link: '/components/forms' },
    //           { text: 'Modals', link: '/components/modals' },
    //           { text: 'Dropdowns', link: '/components/dropdowns' },
    //           { text: 'Tabs', link: '/components/tabs' },
    //           { text: 'Accordions', link: '/components/accordions' },
    //           { text: 'Cards', link: '/components/cards' },
    //           { text: 'Navigation', link: '/components/navigation' }
    //         ]
    //       },
    //       {
    //         text: 'Data Components',
    //         collapsed: true,
    //         items: [
    //           { text: 'Tables', link: '/components/tables' },
    //           { text: 'Lists', link: '/components/lists' },
    //           { text: 'Pagination', link: '/components/pagination' },
    //           { text: 'Data Grid', link: '/components/data-grid' }
    //         ]
    //       },
    //       {
    //         text: 'Form Components',
    //         collapsed: true,
    //         items: [
    //           { text: 'Input Fields', link: '/components/inputs' },
    //           { text: 'Select Menus', link: '/components/select' },
    //           { text: 'Checkboxes', link: '/components/checkboxes' },
    //           { text: 'Radio Buttons', link: '/components/radio' },
    //           { text: 'Date Pickers', link: '/components/date-pickers' }
    //         ]
    //       },
    //       {
    //         text: 'Feedback Components',
    //         collapsed: true,
    //         items: [
    //           { text: 'Alerts', link: '/components/alerts' },
    //           { text: 'Tooltips', link: '/components/tooltips' },
    //           { text: 'Progress Bars', link: '/components/progress' },
    //           { text: 'Spinners', link: '/components/spinners' }
    //         ]
    //       }
    //     ]
    //   },
    //   {
    //     text: 'Best Practices',
    //     collapsed: true,
    //     items: [
    //       { text: 'Code Style', link: '/best-practices/code-style' },
    //       { text: 'Performance', link: '/best-practices/performance' },
    //       { text: 'Security', link: '/best-practices/security' },
    //       { text: 'Testing', link: '/best-practices/testing' }
    //     ]
    //   }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/topics/javascript' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present'
    }
  }
})