import "./globals.css";
import { Toaster } from "sonner";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Weight Tracker - Monitor Your Progress",
  description: "A simple and beautiful application to track your weight over time and monitor progress towards your goals",
  keywords: ["weight tracker", "fitness", "health", "weight loss", "weight gain", "progress tracking"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="antialiased">
          {children}
        </main>
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: "#313338",
              color: "#e3e5e8",
              border: "1px solid #1e1f22",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
            },
            success: {
              icon: "✅",
            },
            error: {
              icon: "❌",
            }
          }}
        />
      </body>
    </html>
  );
} 