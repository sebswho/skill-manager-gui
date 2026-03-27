/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './src-ui/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        heading: ['Fredoka', 'sans-serif'],
        body: ['Nunito', 'sans-serif'],
        sans: ['Nunito', 'sans-serif'], // Default body font
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Claymorphism-inspired vibrant colors
        vibrant: {
          rose: '#E11D48',
          pink: '#FB7185',
          blue: '#2563EB',
          green: '#10B981',
          amber: '#F59E0B',
          purple: '#A78BFA',
          cyan: '#00FFFF',
          neon: '#39FF14',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Claymorphism-inspired large radii
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem', // 40px for outer containers
      },
      boxShadow: {
        // Claymorphism-inspired multi-layer shadows
        'clay': '0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.1), inset 0 -2px 4px rgba(0, 0, 0, 0.05)',
        'clay-lg': '0 8px 12px rgba(0, 0, 0, 0.08), 0 20px 40px rgba(0, 0, 0, 0.12), inset 0 -2px 6px rgba(0, 0, 0, 0.06)',
        'clay-inner': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
        'glow': '0 0 20px rgba(225, 29, 72, 0.3)',
        'glow-blue': '0 0 20px rgba(37, 99, 235, 0.3)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        // Playful animations for Duolingo-style interactions
        "bounce-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "bounce-out": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(0.9)", opacity: "0" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(225, 29, 72, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(225, 29, 72, 0.6)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "bounce-in": "bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "bounce-out": "bounce-out 0.3s ease-in",
        "wiggle": "wiggle 0.5s ease-in-out",
        "float": "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
      },
      // Custom spacing for Claymorphism
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
