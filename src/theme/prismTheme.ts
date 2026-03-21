
import type { PrismTheme } from 'prism-react-renderer'

const theme: PrismTheme = {
	plain: {
		backgroundColor: '#161923',
		color: '#e8eaf3',
	},
	styles: [
		{
			types: ['comment', 'prolog', 'doctype', 'cdata'],
			style: { color: '#8d93ab', fontStyle: 'italic' },
		},
		{
			types: ['punctuation'],
			style: { color: '#cfd4e8' },
		},
		{
			types: ['namespace'],
			style: { opacity: 0.7 },
		},
		{
			types: ['string', 'char', 'template-string', 'attr-value'],
			style: { color: '#8ef7b2' },
		},
		{
			types: ['number', 'boolean'],
			style: { color: '#ffb86c', fontWeight: '500' },
		},
		{
			types: ['keyword', 'important', 'atrule'],
			style: { color: '#ff7ac6', fontWeight: '600' },
		},
		{
			types: ['function', 'class-name'],
			style: { color: '#7dd3fc', fontWeight: '600' },
		},
		{
			types: ['builtin'],
			style: { color: '#ff8fab' },
		},
		{
			types: ['tag', 'selector'],
			style: { color: '#ff8fab' },
		},
		{
			types: ['attr-name'],
			style: { color: '#ffe08a' },
		},
		{
			types: ['variable', 'constant', 'symbol'],
			style: { color: '#ed84f9' },
		},
		{
			types: ['operator', 'entity', 'url'],
			style: { color: '#8be9fd' },
		},
		{
			types: ['regex'],
			style: { color: '#6df6b2' },
		},
		{
			types: ['property'],
			style: { color: '#8be9fd' },
		},
		{
			types: ['deleted'],
			style: { color: '#ff8fab', textDecoration: 'line-through' },
		},
		{
			types: ['inserted'],
			style: { color: '#8ef7b2', textDecoration: 'underline' },
		},
		{
			types: ['changed'],
			style: { color: '#ffe08a', fontWeight: '600' },
		},
	],
}

export default theme
