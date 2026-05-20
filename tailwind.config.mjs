/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Soya warm palette. Names match DESIGN.soya.md tokens.
        soya: {
          paper: "#FBFAF5", // Soy Milk White — page background
          ink: "#2B2419", // Soy Sauce Black — primary text
          accent: "#E0A52C", // Soybean Gold — call-to-action / brand
          cream: "#F3EDDC", // assistant bubble background
          line: "#E6DFCC", // subtle borders
          muted: "#7A6F5B", // secondary text
        },
      },
      borderRadius: {
        card: "20px",
        btn: "14px",
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
