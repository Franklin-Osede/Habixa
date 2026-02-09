/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "primary": "#0df259",
        "background-light": "#f5f8f6",
        "background-dark": "#0a1a0f",
        "forest": "#15241a", // Deep Forest Green from design
        "forest-dark": "#0d2215",
        "forest-card": "#142d1d",
        "forest-accent": "#1a3a25",
        "surface-border": "#316843",
      },
      fontFamily: {
        "display": ["Space Grotesk", "sans-serif"]
      },
    },
  },
  plugins: [],
  // Disable Tailwind base styles that might interfere
  corePlugins: {
    preflight: false, // Disable Tailwind's base reset for React Native
  },
}
