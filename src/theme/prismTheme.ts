
import type { PrismTheme } from 'prism-react-renderer'

const theme: PrismTheme = {
	plain: {
		backgroundColor: '#1e1e2e',
		color: '#cdd6f4',
	},
	styles: [
		{
			types: ['comment', 'prolog', 'doctype', 'cdata'],
			style: { color: '#6c7086', fontStyle: 'italic' },
		},
		{
			types: ['punctuation'],
			style: { color: '#bac2de' },
		},
		{
			types: ['namespace'],
			style: { opacity: 0.7 },
		},
		{
			types: ['string', 'char', 'template-string', 'attr-value'],
			style: { color: '#a6e3a1' },
		},
		{
			types: ['number', 'boolean'],
			style: { color: '#fab387' },
		},
		{
			types: ['keyword', 'important', 'atrule'],
			style: { color: '#cba6f7' },
		},
		{
			types: ['function', 'class-name'],
			style: { color: '#89b4fa' },
		},
		{
			types: ['builtin'],
			style: { color: '#f38ba8' },
		},
		{
			types: ['tag', 'selector'],
			style: { color: '#f38ba8' },
		},
		{
			types: ['attr-name'],
			style: { color: '#f9e2af' },
		},
		{
			types: ['variable', 'constant', 'symbol'],
			style: { color: '#f5c2e7' },
		},
		{
			types: ['operator', 'entity', 'url'],
			style: { color: '#89dceb' },
		},
		{
			types: ['regex'],
			style: { color: '#a6e3a1' },
		},
		{
			types: ['property'],
			style: { color: '#89dceb' },
		},
		{
			types: ['deleted'],
			style: { color: '#f38ba8' },
		},
		{
			types: ['inserted'],
			style: { color: '#a6e3a1' },
		},
		{
			types: ['changed'],
			style: { color: '#f9e2af' },
		},
	],
}

export default theme
