
import type { Config } from '@docusaurus/types'
import prismTheme from './src/theme/prismTheme'

const config: Config = {
	title: 'Engineering Knowledge Base',
	tagline: 'Internal technical documentation',
	url: 'https://luminhkhuong.dev',
	baseUrl: '/',

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
				blog: false,
				theme: {
					customCss: './src/css/custom.css',
				},
			}
		]
	],

	themeConfig: {
		prism: {
			theme: prismTheme,
			additionalLanguages: [
				'java',
				'bash',
				'json',
				'yaml',
				'properties',
				'docker',
				'groovy',
				'sql',
			],
		},
		colorMode: {
			defaultMode: 'dark',
			respectPrefersColorScheme: true,
		},
	},
}

export default config
