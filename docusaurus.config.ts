
import type { Config } from '@docusaurus/types'
import prismTheme from './src/theme/prismTheme.js'
import prismLightTheme from './src/theme/prismLightTheme.js'
import remarkMath from 'remark-math';

const config: Config = {
	title: 'Engineering Knowledge Base',
	tagline: 'Internal technical documentation',
	url: 'https://luminhkhuong.dev',
	baseUrl: '/',

	organizationName: 'minhkhuong2404',
	projectName: 'docusaurus-knowledge-base-template',
	onBrokenLinks: 'warn',
	future: {
		v4: true,
		faster: {
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
					routeBasePath: '/',
					showLastUpdateTime: true,
					showLastUpdateAuthor: true,
					remarkPlugins: [remarkMath],
				},
				blog: false,
				theme: {
					customCss: './src/css/custom.css',
				},
			}
		]
	],
	plugins: [
		[
			require.resolve('@docusaurus/plugin-google-gtag'),
			{
				trackingID: 'G-79SQQZQMCX',
				anonymizeIP: true,
			},
		],
	],
	markdown: {
		mermaid: true,
	},
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
				searchBarShortcut: false,
				searchBarShortcutHint: false,
				hashed: true,
			}),
		],
		'@docusaurus/theme-mermaid'
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
		],
		headTags: [
			{
				tagName: 'script',
				innerHTML: `
					if (typeof window !== 'undefined' && !window.gtag) {
						window.dataLayer = window.dataLayer || [];
						window.gtag = function() { window.dataLayer.push(arguments); };
					}
				`,
			},
			{
				tagName: 'link',
				attributes: {
					rel: 'dns-prefetch',
					href: 'https://fonts.googleapis.com',
				},
			},
			{
				tagName: 'link',
				attributes: {
					rel: 'dns-prefetch',
					href: 'https://fonts.gstatic.com',
				},
			},
			{
				tagName: 'link',
				attributes: {
					rel: 'preconnect',
					href: 'https://fonts.googleapis.com',
				},
			},
			{
				tagName: 'link',
				attributes: {
					rel: 'preconnect',
					href: 'https://fonts.gstatic.com',
					crossorigin: 'anonymous',
				},
			},
			{
				tagName: 'link',
				attributes: {
					rel: 'preload',
					as: 'style',
					href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
				},
			},
			{
				tagName: 'link',
				attributes: {
					rel: 'stylesheet',
					href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
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
			logo: {
				alt: 'Engineering Knowledge Base Logo',
				src: '/logo.svg',
				srcDark: '/logo-dark.svg',
			},
			items: [
				// { to: '/login', label: '💎 VIP Login', position: 'right', className: 'premium-nav-button' },
				{ type: 'search', position: 'right' }
			],
		},
		prism: {
			theme: prismTheme,
			darkTheme: prismTheme,
			additionalLanguages: [
				'bash',
				'json',
				'yaml',
				'java'
			],
		},
		colorMode: {
			defaultMode: 'dark',
			respectPrefersColorScheme: true,
		},
	},
}

export default config
