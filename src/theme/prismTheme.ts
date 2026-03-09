
import { PrismTheme } from 'prism-react-renderer'

const theme: PrismTheme = {
  plain: {
    backgroundColor: '#282c34',
    color: '#abb2bf'
  },
  styles: [
    {
      types: ['comment'],
      style: { color: '#5c6370', fontStyle: 'italic' }
    },
    {
      types: ['string'],
      style: { color: '#98c379' }
    },
    {
      types: ['keyword'],
      style: { color: '#c678dd' }
    },
    {
      types: ['function'],
      style: { color: '#61afef' }
    }
  ]
}

export default theme
