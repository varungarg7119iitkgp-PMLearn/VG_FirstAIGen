import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        zomatoRed: "#E23744",
        gourmetGold: "#FFC107"
      },
      backgroundImage: {
        "gourmet-dark": "linear-gradient(to bottom, #0f0f0f, #1a1a1a)"
      },
      boxShadow: {
        "soft-red": "0 10px 30px rgba(226, 55, 68, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;

