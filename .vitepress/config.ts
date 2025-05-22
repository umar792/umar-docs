import { defineConfig } from "vitepress";
import { tabsMarkdownPlugin } from "vitepress-plugin-tabs";

export default defineConfig({
  lang: "en-US",
  title: "JavaScript Guide",
  description: "Complete JavaScript documentation with examples",
  markdown: {
    config(md) {
      md.use(tabsMarkdownPlugin);
    },
  },
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/javascript.svg" }],
  ],
  themeConfig: {
    logo: "/javascript.svg",
    search: {
      provider: "local",
      options: {
        detailedView: true,
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: {
              title: 2,
              text: 1,
            },
          },
        },
      },
    },
    nav: [
      { text: "Home", link: "/" },
      { text: "Playground", link: "/playground" },
    ],
    sidebar: [
      {
        text: "Getting Started",
        items: [
          {
            text: "JavaScript",
            collapsed: false,
            items: [
              { text: "Introduction", link: "/javascript/introduction" },
              {text : "Variables" , link : "/javascript/variables" },
            ],
          },
        ],
      },
      {
        text: "NextJS",
        collapsed: true,
        items: [
          {
            text: "Next Auth",
            collapsed: true,
            items: [
              {
                text: "Getting Started",
                link: "/nextjs/next-auth/getting-started",
              },
              {
                text: "Auth Options",
                link: "/nextjs/next-auth/auth-options",
              },
              {
                text: "Providers",
                link: "/nextjs/next-auth/providers",
              },
              {
                text: "Callbacks",
                link: "/nextjs/next-auth/callbacks",
              },
              {
                text: "JWT Strategy",
                link: "/nextjs/next-auth/jwt-strategy",
              },
            ],
          },
        ],
      },
      {
        text : "Docker",
       link : "/docker"
      },
      {
        text : "OAuth",
        collapsed : true,
        items : [
          {text : "Google OAuth" , link : "/oauth/google-oauth"},
          {text : "Meta OAuth(facebook oauth)" , link : "/oauth/meta-oauth"},
          {text : "Shopify OAuth" , link : "/oauth/shopify-oauth"},
          {text : "Tiktok OAuth" , link : "/oauth/tiktok-oauth"},

        ]
      },
      {
        text : "Payment Integrations",
        collapsed : true,
        items : [
          {text : "Authorized.net", link : "/payments/Authorized"}
        ]
      }
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/topics/javascript" },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2024-present",
    },
  },
});
