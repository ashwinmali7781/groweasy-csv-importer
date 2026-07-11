import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAFAF7',
        ink: '#181A1E',
        muted: '#6B6F76',
        line: '#E4E3DD',
        panel: '#F1F0EA',
        grow: {
          50: '#EEF7F3',
          100: '#D6EDE2',
          400: '#3F9E7E',
          500: '#0F7B5F',
          600: '#0C6249',
          900: '#0A2E23',
        },
        amber: {
          100: '#FBF0DA',
          500: '#B8791C',
          700: '#8A5A12',
        },
        rust: {
          100: '#FBE7E2',
          500: '#B94A32',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        sm: '3px',
        DEFAULT: '5px',
      },
    },
  },
  plugins: [],
};

export default config;
