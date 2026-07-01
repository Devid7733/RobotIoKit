/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#2251f5",
          dark: "#101a33",
          orange: "#ff7a1a",
          ink: "#3f4a5f",
          mist: "#eef3ff"
        }
      },
      fontFamily: {
        sans: ["var(--font-noto-sans)", "var(--font-inter)", "Noto Sans", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "var(--font-noto-sans)", "Inter", "Noto Sans", "sans-serif"]
      },
      boxShadow: {
        card: "0 18px 45px rgba(16, 26, 51, 0.08)"
      }
    }
  },
  plugins: []
};
