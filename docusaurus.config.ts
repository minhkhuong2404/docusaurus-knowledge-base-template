
import type { Config } from '@docusaurus/types'
import prismTheme from './src/theme/prismTheme'

const config: Config = {
  title: 'Engineering Knowledge Base',
  tagline: 'Internal technical documentation',
  url: 'https://example.com',
  baseUrl: '/',

  organizationName: 'company',
  projectName: 'engineering-kb',

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts'
        }
      }
    ]
  ],

  themeConfig: {
    prism: {
      theme: prismTheme
    }
  }
}

export default config
