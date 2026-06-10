/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        game: {
          night: "#0a1628",
          nightLight: "#142238",
          streetLight: "#ffcc4d",
          neon: "#00ffcc",
          rain: "#4a6fa5",
          danger: "#ff4757",
          success: "#2ed573",
          road: "#2d3436",
          roadLine: "#636e72",
          building: "#3d3d5c",
          buildingLight: "#5c5c8a",
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'cursive'],
        retro: ['"VT323"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'rain-fall': 'rain 0.5s linear infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #00ffcc, 0 0 10px #00ffcc' },
          '100%': { boxShadow: '0 0 10px #00ffcc, 0 0 20px #00ffcc, 0 0 30px #00ffcc' },
        },
        rain: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
      boxShadow: {
        'pixel': '4px 4px 0px rgba(0,0,0,0.5)',
        'pixel-sm': '2px 2px 0px rgba(0,0,0,0.5)',
        'neon': '0 0 10px #00ffcc, 0 0 20px #00ffcc',
        'street': '0 0 30px rgba(255, 204, 77, 0.4)',
      },
    },
  },
  plugins: [],
};
