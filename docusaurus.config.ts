
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
		metadata: [
			{ name: 'keywords', content: 'development, blog, software, programming, engineering' },
			{ name: 'description', content: 'A knowledge base for software engineers to share and document technical information.' },
			{ name: 'author', content: 'Khuong Lu' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
			{ name: 'robots', content: 'index, follow' },
			{ name: 'theme-color', content: '#000000' },
			{ name: 'apple-mobile-web-app-capable', content: 'yes' },
			{ name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
			{ name: 'format-detection', content: 'telephone=no' },
			{ name: 'msapplication-TileColor', content: '#000000' },
			{ name: 'msapplication-config', content: '/browserconfig.xml' },
			{ name: 'theme-color', content: '#000000' },
		],
		headTags: [
			{
				tagName: 'link',
				attributes: {
					rel: 'preconnect',
					href: 'https://fonts.googleapis.com',
				},
			},
		],
		docs: {
			sidebar: {
				hideable: true,
				autoCollapseCategories: true,
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
