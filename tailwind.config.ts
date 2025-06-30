import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ClashDisplay-Variable', 'ClashDisplay-Regular', 'sans-serif'],
        display: ['ClashDisplay-Variable', 'ClashDisplay-Bold', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config; 