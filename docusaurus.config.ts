
import type { Config } from '@docusaurus/types'
import prismTheme from './src/theme/prismTheme'

const config: Config = {
	title: 'Engineering Knowledge Base',
	tagline: 'Internal technical documentation',
	url: 'https://minhkhuong2404.github.io',
	baseUrl: '/docusaurus-knowledge-base-template/',

	organizationName: 'minhkhuong2404',
	projectName: 'docusaurus-knowledge-base-template',

	presets: [
		[
			'classic',
			{
				docs: {
					sidebarPath: './sidebars.ts',
					routeBasePath: '/'
				},
				blog: false
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
