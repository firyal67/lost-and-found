import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "react-hot-toast";
import LayoutShell from "@/components/layout/LayoutShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Lost & Found Tunisia",
  description: "Plateforme de déclaration d'objets perdus et trouvés en Tunisie",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>
          <LayoutShell>{children}</LayoutShell>
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </Providers>
      </body>
    </html>
  );
}
