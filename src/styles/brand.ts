export const brand = {
  name: "MyLab",

  assets: {
    logo: {
      src: "/brand/mylab-logo.png",
      alt: "MyLab",
      aspectRatio: 1,
      sizes: {
        sm: 40,
        md: 64,
        lg: 96,
        xl: 128,
      },
    },
  },

  colors: {
    primary: {
      50: "#f0f7ff",
      100: "#d3eefc",
      200: "#a5dbfa",
      300: "#028efc",
      400: "#0171fb",
      500: "#0052ef",
      600: "#003bd2",
      700: "#002eb3",
      800: "#001b91",
      900: "#00146b",
    },

    neutral: {
      0: "#ffffff",
      50: "#f8fafb",
      100: "#f1f4f5",
      200: "#e3e8ea",
      300: "#cbd4d7",
      400: "#9ba8ad",
      500: "#6b797e",
      600: "#4f5d62",
      700: "#39464b",
      800: "#273237",
      900: "#182126",
      950: "#0d1418",
    },

    success: {
      50: "#edf9f2",
      500: "#24945a",
      700: "#176b40",
    },

    warning: {
      50: "#fff8e8",
      500: "#c98a16",
      700: "#8f620d",
    },

    danger: {
      50: "#fff1f1",
      500: "#c94a4a",
      700: "#963636",
    },

    info: {
      50: "#eef6ff",
      500: "#367fc4",
      700: "#285f92",
    },
  },

  typography: {
    fontFamily: {
      sans: "var(--font-geist-sans)",
      mono: "var(--font-geist-mono)",
    },

    scale: {
      xs: "0.75rem",
      sm: "0.875rem",
      md: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
    },
  },

  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    "2xl": "2rem",
    "3xl": "3rem",
    "4xl": "4rem",
    "5xl": "6rem",
  },

  radius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.25rem",
    full: "9999px",
  },

  shadows: {
    sm: "0 1px 2px rgb(0 0 0 / 0.05)",
    md: "0 4px 12px rgb(0 0 0 / 0.08)",
    lg: "0 12px 32px rgb(0 0 0 / 0.12)",
  },

  breakpoints: {
    mobile: "0px",
    tablet: "768px",
    desktop: "1024px",
    wide: "1280px",
  },
} as const;

export type Brand = typeof brand;
