import type { Metadata } from "next";
import "./globals.css";
import { PlayerProvider } from "@/components/PlayerProvider";

export const metadata: Metadata = {
  title: "Can You Remember?",
  description: "A memory mini-game collection — repeat the sequence and climb the leaderboard.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Share+Tech+Mono&family=Source+Code+Pro:wght@400;500;700&family=VT323&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <PlayerProvider>{children}</PlayerProvider>
      </body>
    </html>
  );
}