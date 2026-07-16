import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "react-hot-toast";
import LayoutShell from "@/components/layout/LayoutShell";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Lost & Found Tunisia",
  description: "Plateforme de déclaration d'objets perdus et trouvés en Tunisie",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>
        <Providers>
          <LayoutShell>{children}</LayoutShell>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "14px",
                fontWeight: "500",
                borderRadius: "10px",
                background: "#1a1e28",
                color: "#f0f2f8",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "0 8px 28px rgba(0,0,0,0.50)",
                padding: "12px 16px",
              },
              success: {
                iconTheme: { primary: "#34d399", secondary: "#052e16" },
              },
              error: {
                iconTheme: { primary: "#f87171", secondary: "#1c0202" },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
