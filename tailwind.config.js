import plugin from "tailwindcss/plugin";

const heroUiSurface = plugin(function () {
  // Placeholder plugin so styles can be extended later or replaced by official HeroUI plugin.
});

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [heroUiSurface],
}
