import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shipment Supplier Portal | Royal Horizon",
  description: "Supplier registration, profile management, and schedule approvals for the shipment supplier workflow.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
