import { Toaster } from "sonner";
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
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
    </>
  );
}

export default MyApp; 