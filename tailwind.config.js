// Fonte global do sistema — trocar só aqui para testar/aplicar uma fonte nova em tudo.
// Lembrar de atualizar também o <link> do Google Fonts em index.html se a fonte mudar.
const FONT_FAMILY = 'Inter'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#fdf4f5',
        surface: {
          DEFAULT: '#ffffff',
          2: '#faf0f1',
          3: '#f4e4e6',
        },
        ink: {
          DEFAULT: '#2a1e18',
          2: '#5b463c',
          3: '#8d7b6f',
          4: '#b4a598',
        },
        line: {
          DEFAULT: '#ecd5d8',
          2: '#f3e4e6',
          3: '#dfc4c8',
        },
        brand: {
          DEFAULT: '#8b4a2b',
          ink: '#ffffff',
          soft: '#f1e3d6',
          'soft-ink': '#7a3f23',
        },
        gold: {
          DEFAULT: '#c9a57b',
          soft: '#f4e9d6',
        },
        success: {
          DEFAULT: '#4a6b3e',
          soft: '#e3ebd9',
        },
        warning: {
          DEFAULT: '#9a6b1f',
          soft: '#f6ead1',
        },
        danger: {
          DEFAULT: '#8b3a32',
          soft: '#f3dcd8',
        },
      },
      fontFamily: {
        display: [FONT_FAMILY, 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: [FONT_FAMILY, 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: [FONT_FAMILY, 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
        serif: [FONT_FAMILY, 'Georgia', 'serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '28px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(42,30,24,0.04)',
        sm: '0 2px 6px rgba(42,30,24,0.06), 0 1px 2px rgba(42,30,24,0.04)',
        md: '0 8px 24px rgba(42,30,24,0.08), 0 2px 6px rgba(42,30,24,0.04)',
      },
      fontSize: {
        xs: '11px',
        sm: '12.5px',
        md: '14px',
        lg: '16px',
        xl: '20px',
        '2xl': '28px',
        '3xl': '40px',
      },
    },
  },
  plugins: [],
}
