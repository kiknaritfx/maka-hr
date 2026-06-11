import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        coral:  "#FF6B6B",
        teal:   "#00B4A9",
        yellow: "#FFD93D",
        cloud:  "#F4F6F8",
        ink:    "#1C2833",
      },
      fontFamily: { prompt: ["Prompt","Kanit","sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
