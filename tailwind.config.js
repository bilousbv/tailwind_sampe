module.exports = {
  content: ["./src/**/*.{html,js}"],
  darkMode: "class",
  theme: {
    fontFamily: {
      sans: ['"Roboto"', "sans-serif"],
    },
    colors: {
      transparent: "transparent",
      dark: "#020420",
      white: "#ffffff",
      black: "#000000",
      blue: "#4974FA",
      orange: "#FFA000",
      disabled: "#868686",
      tile: "rgba(15, 23, 42, .5)",
      "text-light": "#94A3B8",
      "text-dark": "#191919",
      input: "#CBD6E2",
      "shadow-light": "rgba(255, 255, 255, 0.2)",
      "highlight-light": "rgba(255, 255, 255, 0.1)",
      "highlight-dark": "rgba(2, 4, 32, 0.1)",
    },
    extend: {
      backgroundImage: {
        "gradient-radial":
          "radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), var(--tw-gradient-from), transparent 80%)",
      },
    },
  },
  plugins: [require("tailwindcss-animated")],
};
