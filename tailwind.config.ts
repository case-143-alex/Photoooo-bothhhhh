import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#2563eb",
          "blue-light": "#3b82f6",
          yellow: "#fbbf24",
          bg: "#0a1628",
          surface: "#111d35",
        },
      },
    },
  },
  plugins: [],
};

export default config;
