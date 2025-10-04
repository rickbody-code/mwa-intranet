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
          <main className="mwa-container">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
