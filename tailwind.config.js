/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        body: ["Inter", "sans-serif"],
        display: ["Orbitron", "sans-serif"]
      },
      colors: {
        srkr: {
          night: "#080b14",
          slate: "#0a0f1a",
          deep: "#0f2027",
          teal: "#14b8a6",
          cyan: "#06b6d4",
          steel: "#1d2a38",
          mist: "#203a43"
        }
      }
    }
  },
  plugins: []
};
