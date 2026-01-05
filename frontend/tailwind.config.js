/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        base: "5px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Neobrutalism color palette with oklch
        background: "var(--background)",
        "secondary-background": "var(--secondary-background)",
        foreground: "var(--foreground)",
        "main-foreground": "var(--main-foreground)",
        main: "var(--main)",
        border: "var(--border)",
        ring: "var(--ring)",
        overlay: "var(--overlay)",
        
        // Compatibility colors
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        input: "var(--input)",
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
      },
      // Neobrutalism-specific utilities
      boxShadow: {
        shadow: "var(--shadow)",
        brutal: "4px 4px 0px 0px rgba(0, 0, 0, 1)",
        "brutal-sm": "2px 2px 0px 0px rgba(0, 0, 0, 1)",
        "brutal-lg": "6px 6px 0px 0px rgba(0, 0, 0, 1)",
        "brutal-xl": "8px 8px 0px 0px rgba(0, 0, 0, 1)",
      },
      fontWeight: {
        base: "500",
        heading: "700",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
