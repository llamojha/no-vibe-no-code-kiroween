import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Rajdhani", "sans-serif"],
      },
      colors: {
        black: "#0a0a0a",
        primary: "#0d0d2b",
        secondary: "#f000ff",
        accent: "#00f0ff",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out forwards",
        "slide-in-up": "slideInUp 0.5s ease-in-out forwards",
        "neon-glow": "neonGlow 1.5s ease-in-out infinite alternate",
        glitch: "glitch 1s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        neonGlow: {
          from: {
            textShadow:
              "0 0 5px #fff, 0 0 10px #fff, 0 0 15px #00f0ff, 0 0 20px #00f0ff, 0 0 25px #00f0ff, 0 0 30px #00f0ff, 0 0 35px #00f0ff",
          },
          to: {
            textShadow:
              "0 0 10px #fff, 0 0 20px #fff, 0 0 30px #00f0ff, 0 0 40px #00f0ff, 0 0 50px #00f0ff, 0 0 60px #00f0ff, 0 0 70px #00f0ff",
          },
        },
        glitch: {
          "2%, 64%": { transform: "translate(2px, 0) skew(0deg)" },
          "4%, 60%": { transform: "translate(-2px, 0) skew(0deg)" },
          "62%": { transform: "translate(0, 0) skew(5deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
