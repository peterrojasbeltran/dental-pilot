import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dental Pilot",
  description: "AI Revenue OS para clínicas dentales",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" }
};

const sidebarPreferenceScript = `
try {
  var collapsed = window.localStorage.getItem('dental-pilot-sidebar-collapsed') === 'true';
  document.documentElement.dataset.dpSidebarCollapsed = String(collapsed);
} catch (error) {
  document.documentElement.dataset.dpSidebarCollapsed = 'false';
}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: sidebarPreferenceScript }} />
      </head>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
