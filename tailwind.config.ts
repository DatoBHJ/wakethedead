import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    './ai_user_components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './ai_hooks/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', ...fontFamily.sans],
        mono: ['var(--font-geist-mono)', ...fontFamily.mono],
        handwriting: ['Kalam'], // fallback fonts 포함
        helvetica: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'], // fallback fonts 포함
      },
      fontSize: {
        'xxs': '0.625rem', // 10px
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        textlight: '#000000',
        textdark: '#DEE4EB',
        bluelight: '#000000',
        bluedark: '#edece5',
        secondarylight: '#838383',
        boxlight: '#C1C1C1',
        boxdark: '#222329',
        secondarydark: '#596072',
        userguidedarktext: '#34353C',
        green: {
          '50': '#f0fdf6',
          '100': '#dbfdec',
          '200': '#baf8d9',
          '300': '#68eeac',
          '400': '#47e195',
          '500': '#1fc876',
          '600': '#13a65e',
          '700': '#13824c',
          '800': '#146740',
          '900': '#135436',
          '950': '#042f1c',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        backgroundsecond: 'hsl(var(--backgroundsecond))',
        groupcolor: 'hsl(var(--groupcolor))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        skeleton: {
          DEFAULT: 'hsl(var(--skeleton))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
    },
  },
  plugins: [    
    require('tailwind-scrollbar-hide'), require('tailwindcss-animate')],
};
export default config;
