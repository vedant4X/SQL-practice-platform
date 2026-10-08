import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "SQL//STRIKE | High-Octane Dual-Dialect SQL Playground",
  description: "Electric, high-octane SQL practice platform powered by real PostgreSQL 16 & MySQL 8.4 engines.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('sqljudge_theme');
                  var theme = saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
                  document.documentElement.classList.remove('dark', 'light');
                  document.documentElement.classList.add(theme);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background antialiased flex flex-col selection:bg-cyber-magenta selection:text-white">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
