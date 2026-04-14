import type { PrismTheme } from 'prism-react-renderer'

const theme: PrismTheme = {
	plain: {
		backgroundColor: '#eff1f5',
		color: '#24324f',
	},
	styles: [
		{
			types: ['comment', 'prolog', 'doctype', 'cdata'],
			style: { color: '#74839c', fontStyle: 'italic' },
		},
		{
			types: ['punctuation'],
			style: { color: '#1f2a44' },
		},
		{
			types: ['namespace'],
			style: { opacity: 0.72 },
		},
		{
			types: ['string', 'char', 'template-string', 'attr-value'],
			style: { color: '#0f9d58' },
		},
		{
			types: ['number', 'boolean'],
			style: { color: '#f59e0b', fontWeight: '500' },
		},
		{
			types: ['keyword', 'important', 'atrule'],
			style: { color: '#2f9e44', fontWeight: '600' },
		},
		{
			types: ['function', 'class-name'],
			style: { color: '#39ff14', fontWeight: '600' },
		},
		{
			types: ['builtin'],
			style: { color: '#51cf66' },
		},
		{
			types: ['tag', 'selector'],
			style: { color: '#51cf66' },
		},
		{
			types: ['attr-name'],
			style: { color: '#2f9e44' },
		},
		{
			types: ['variable', 'constant', 'symbol'],
			style: { color: '#1f7a33' },
		},
		{
			types: ['operator', 'entity', 'url'],
			style: { color: '#39ff14' },
		},
		{
			types: ['regex'],
			style: { color: '#1f9d00' },
		},
		{
			types: ['property'],
			style: { color: '#39ff14' },
		},
		{
			types: ['deleted'],
			style: { color: '#51cf66', textDecorationLine: 'line-through' },
		},
		{
			types: ['inserted'],
			style: { color: '#1f9d00', textDecorationLine: 'underline' },
		},
		{
			types: ['changed'],
			style: { color: '#f59e0b', fontWeight: '600' },
		},
	],
}

export default theme