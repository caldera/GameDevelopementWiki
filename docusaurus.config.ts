import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Caldera Game Dev Wiki',
  tagline: '游戏开发笔记 · UE5 踩坑 · 世界观 · 项目管理 · MMO 开发',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://your-docusaurus-site.example.com',
  baseUrl: '/',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          editUrl: undefined,
        },
        blog: {
          showReadingTime: true,
          blogTitle: '开发日志',
          blogDescription: 'Caldera 的游戏开发日志与随想',
          postsPerPage: 10,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
      defaultMode: 'dark',
    },
    navbar: {
      title: 'Caldera Dev Wiki',
      logo: {
        alt: 'Caldera Wiki',
        src: 'img/logo.svg',
      },
      items: [
        {to: '/', label: '首页', position: 'left'},
        {to: '/dev-notes/', label: '开发笔记', position: 'left'},
        {to: '/ue5-caveats/', label: 'UE5 踩坑', position: 'left'},
        {to: '/world-building/', label: '世界观', position: 'left'},
        {to: '/project-mgmt/', label: '项目管理', position: 'left'},
        {to: '/mmo-dev/', label: 'MMO 开发', position: 'left'},
        {to: '/blog', label: '开发日志', position: 'left'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '知识库',
          items: [
            {label: '程序开发笔记', to: '/dev-notes/'},
            {label: 'UE5 踩坑记录', to: '/ue5-caveats/'},
            {label: '游戏世界观', to: '/world-building/'},
            {label: '项目管理', to: '/project-mgmt/'},
            {label: '大型网游开发', to: '/mmo-dev/'},
          ],
        },
        {
          title: '更多',
          items: [
            {label: '开发日志', to: '/blog'},
            {label: 'GitHub', href: 'https://github.com/caldera_wan'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Caldera. Built with Docusaurus 🐉.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['cpp', 'csharp', 'powershell', 'bash', 'json', 'yaml', 'lua'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
