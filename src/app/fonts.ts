import localFont from "next/font/local";

// Bitter: a sturdy slab drawn for reading on screens. It has the feel of a printed
// school textbook and keeps its shape on low-resolution phones.
export const latin = localFont({
  src: [
    { path: "./fonts/bitter-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/bitter-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-latin",
  display: "swap",
});

// Noto Sans Ethiopic for Amharic (Ge'ez script). Latin glyphs use Bitter first.
export const ethiopic = localFont({
  src: [
    { path: "./fonts/noto-sans-ethiopic-ethiopic-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/noto-sans-ethiopic-ethiopic-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-ethiopic",
  display: "swap",
  preload: false,
});
