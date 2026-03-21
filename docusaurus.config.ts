
import type { Config } from '@docusaurus/types'
import prismTheme from './src/theme/prismTheme'

const config: Config = {
	title: 'Engineering Knowledge Base',
	tagline: 'Internal technical documentation',
	url: 'https://luminhkhuong.dev',
	baseUrl: '/',

	organizationName: 'minhkhuong2404',
	projectName: 'docusaurus-knowledge-base-template',
	future: {
		v4: true,
		experimental_faster: {
			swcJsLoader: true,
			swcJsMinimizer: true,
			swcHtmlMinimizer: true,
			lightningCssMinimizer: true,
			mdxCrossCompilerCache: true,
			rspackBundler: true, // required flag
			rspackPersistentCache: true, // new flag
		},
	},

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
				highlightSearchTermsOnTargetPage: false,
				explicitSearchResultPath: false,
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
					title: 'LinkedIn',
					items: [
						{
							label: 'luminhkhuong',
							href: 'https://www.linkedin.com/in/luminhkhuong/',
						},
					],
				},
				{
					title: 'GitHub',
					items: [
						{
							label: 'minhkhuong2404',
							href: 'https://github.com/minhkhuong2404'
						},
					]
				},
				{
					title: 'Facebook',
					items: [
						{
							label: 'luminhkhuong',
							href: 'https://www.facebook.com/luminhkhuong/'
						}
					]
				},
				{
					title: 'Leetcode',
					items: [
						{
							label: 'luminhkhuong',
							href: 'https://leetcode.com/u/luminhkhuong/'
						}
					]
				}
			],
			copyright: `Copyright © ${new Date().getFullYear()} by Khuong Lu,  Dev. Built with Docusaurus and Github Page. ❤️`
		},
	},
}

export default config
