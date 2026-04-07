/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Background layers
        'background': '#0e0e0e',
        'surface': '#0e0e0e',
        'surface-container-lowest': '#000000',
        'surface-container-low': '#131313',
        'surface-container': '#191a1a',
        'surface-container-high': '#1f2020',
        'surface-container-highest': '#262626',

        // Primary (blue)
        'primary': '#79b0ff',
        'primary-dim': '#569fff',
        'primary-container': '#5ca2ff',

        // Secondary (amber)
        'secondary': '#fddc9a',
        'secondary-dim': '#eece8d',
        'secondary-container': '#594410',

        // Tertiary (red)
        'tertiary': '#ff716b',
        'tertiary-container': '#fe4e4d',

        // Error
        'error': '#ff716c',
        'error-container': '#9f0519',

        // Text
        'on-surface': '#ffffff',
        'on-surface-variant': '#adabaa',

        // Border
        'outline': '#767575',
        'outline-variant': '#484848',
      },
      fontFamily: {
        'headline': ['Inter', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
        'label': ['Space Grotesk', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'DEFAULT': '0.125rem',
        'lg': '0.25rem',
        'xl': '0.5rem',
        'full': '0.75rem',
      },
    },
  },
  plugins: [],
}