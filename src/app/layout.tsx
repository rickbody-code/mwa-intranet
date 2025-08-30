import "./../styles/globals.css";
import React from "react";
import { Nav } from "@/components/Nav";
import Providers from "@/components/Providers";

export const metadata = {
  title: "MWA Intranet",
  description: "Internal staff intranet starter",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Nav />
          <main className="container mt-6 mb-24">{children}</main>
          <footer className="border-t py-8 mt-10">
            <div className="container text-sm text-gray-500 flex flex-wrap items-center gap-2">
              <span>© {new Date().getFullYear()} Marsden Wealth Advisers · Internal</span>
              <span className="badge">Starter</span>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
