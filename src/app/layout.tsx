import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Root layout owns <html>/<body>. The [locale] layout renders only providers +
// chrome (no nested <html>). Non-locale routes (e.g. /admin) render here directly.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${plusJakarta.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-snow text-slate-text font-body">
        {children}
      </body>
    </html>
  );
}
