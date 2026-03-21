
import type { Config } from '@docusaurus/types'
import prismTheme from './src/theme/prismTheme'

const docSearchAppId = process.env.DOCSEARCH_APP_ID ?? 'YOUR_APP_ID'
const docSearchApiKey = process.env.DOCSEARCH_API_KEY ?? 'YOUR_SEARCH_API_KEY'
const docSearchIndexName = process.env.DOCSEARCH_INDEX_NAME ?? 'YOUR_INDEX_NAME'

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
		navbar: {
			title: 'Engineering Knowledge Base',
			items: [{ type: 'search', position: 'right' }],
		},
		algolia: {
			appId: docSearchAppId,
			apiKey: docSearchApiKey,
			indexName: docSearchIndexName,
			contextualSearch: true,
			searchPagePath: 'search',
		},
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
