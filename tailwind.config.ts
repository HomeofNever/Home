import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,svelte,ts,js}'],
  theme: {
    extend: {
      colors: {
        'site-header': '#006080',
        'site-copyright': '#004d1a',
        'site-hosting': '#00802b',
        'tile-bg': '#eeeeee',
        'tile-title': '#333333',
        'tile-content': '#555555',
        'caption-light': '#eeeeee',
        'caption-dark': '#333333'
      },
      fontFamily: {
        sans: [
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'PingFangTC-Light',
          '"Microsoft YaHei"',
          '微软雅黑',
          '"STHeiti Light"',
          'STXihei',
          '"华文细黑"',
          'Heiti',
          '黑体',
          'sans-serif'
        ]
      },
      boxShadow: {
        tile: '0 0 0.15em 0.15em rgba(0, 0, 0, 0.1)',
        section: '0 0 0.15em 0.15em rgba(0, 0, 0, 0.125)'
      },
      borderRadius: {
        section: '2em'
      }
    }
  },
  plugins: []
} satisfies Config;
