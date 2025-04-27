import "./globals.css";
import { Toaster } from "sonner";
import localFont from 'next/font/local'

// Use a local font instead of Google Fonts
const inter = localFont({
  src: '../public/fonts/inter.woff2',
  display: 'swap',
})

export const metadata = {
  title: "Weight Tracker",
  description: "Track your weight progress",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}