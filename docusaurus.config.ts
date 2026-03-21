
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
	themes: [
		[
			require.resolve("@easyops-cn/docusaurus-search-local"),
			/** @type {import("@easyops-cn/docusaurus-search-local").PluginOptions} */
			({
				indexDocs: true,
				indexBlog: false,
				indexPages: false,
				docsRouteBasePath: '/',
				language: ['en'],
				highlightSearchTermsOnTargetPage: true,
				explicitSearchResultPath: true,
				searchResultLimits: 8,
				searchBarShortcut: true,
				searchBarShortcutHint: true,
				hashed: true,
			}),
		],
	],
	themeConfig: {
		docs: {
			sidebar: {
				hideable: false,
				autoCollapseCategories: false,
			},
		},
		navbar: {
			title: 'Engineering Knowledge Base',
			items: [{ type: 'search', position: 'right' }],
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
		footer: {
			style: 'dark',
			links: [
				{
					title: 'Linkedin',
					items: [
						{
							label: 'Linkedin',
							href: 'https://www.linkedin.com/in/luminhkhuong/',
						},
					],
				},
				// ... other links
			],
			copyright: `Copyright © ${new Date().getFullYear()} Khuong, Lu.`, // You can also put own HTML here
		},
	},
}

export default config
