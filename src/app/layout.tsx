import type { Metadata } from "next";
import "./globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";

export const metadata: Metadata = {
  title: "AUTO BOURN | Luxury Pre-Owned Vehicles",
  description: "India's premier luxury pre-owned automotive platform. Curated collection of certified Mercedes-Benz, BMW, Audi, Jaguar, Land Rover and more.",
  keywords: "luxury cars, pre-owned, certified vehicles, Mercedes-Benz, BMW, Audi, premium cars India",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
      </body>
    </html>
  );
}
