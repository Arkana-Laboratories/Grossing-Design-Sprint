/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        arkana: {
          red: '#FF1919',
          'red-dark': '#E60E0E',
          'red-light': '#FFDDDD',
          black: '#121314',
          ink: '#1E1E23',
          'gray-50': '#F2F3F3',
          'gray-200': '#D6D7D7',
          'gray-500': '#828282',
          blue: '#0C49FF',
          'blue-light': '#DBE4FF',
          green: '#0FA835',
          'green-light': '#D3F2E1',
        },
      },
    },
  },
  plugins: [],
};
