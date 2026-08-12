/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        jm: {
          base:      '#0A1628',
          card:      '#0F1E35',
          cardHover: '#162848',
          navy:      '#0D3147',
          pink:      '#E8196A',   // vlakken en knoppen, met witte tekst erop
          pinkLight: '#FF4D8D',
          pinkText:  '#FF4D8D',   // roze als letterkleur — zie index.css
          muted:     '#A8BEDC',
          subtle:    '#1E3A5F',
          border:    'rgba(255,255,255,0.07)',
        },
        bronze:   '#CD7F32',
        silver:   '#94A3B8',
        gold:     '#F59E0B',
        platinum: '#CBD5E1',
      }
    }
  },
  plugins: []
};
