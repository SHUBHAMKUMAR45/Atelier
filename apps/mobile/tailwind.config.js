/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: '#F5F5F3',
        surface: '#FFFFFF',
        primary: '#111111',
        secondary: '#6B7280',
        border: '#E5E7EB',
        accent: '#4C6EF5',
        muted: '#EBEBEA',
      },
      fontFamily: {
        playfair: ["PlayfairDisplay_700Bold"],
        dmsans: ["DMSans_400Regular"],
        "dmsans-medium": ["DMSans_500Medium"],
        "dmsans-bold": ["DMSans_700Bold"],
      },
      borderRadius: {
        card: "16px",
        image: "20px",
      },
    },
  },
  plugins: [],
};
