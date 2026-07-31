import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Suadence Revenue OS — One call in. 20 revenue assets out.",
  description:
    "Turn customer conversations into structured revenue intelligence, digital-twin buyers, coaching, content, product signals, and executive action.",
  openGraph: {
    title: "Suadence Revenue OS",
    description: "One call in. 20 revenue assets out.",
    type: "website",
    images: [{ url: "/og-revenue-os.png", width: 1536, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Suadence Revenue OS",
    description: "One call in. 20 revenue assets out.",
    images: ["/og-revenue-os.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
