import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // SubConnects brand
        bg: {
          DEFAULT: "#0A1530",
          card: "#162542",
          hi: "#1F3056",
        },
        border: {
          DEFAULT: "#2A3B66",
        },
        brand: {
          yellow: "#F8BC01",
          "yellow-dim": "#C49600",
        },
        text: {
          muted: "#8B96AE",
          secondary: "#C5CCDD",
        },
        status: {
          red: "#F87171",
          green: "#4ADE80",
        },
      },
      fontFamily: {
        head: ['Montserrat', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        container: "1180px",
      },
    },
  },
  plugins: [],
};

export default config;
