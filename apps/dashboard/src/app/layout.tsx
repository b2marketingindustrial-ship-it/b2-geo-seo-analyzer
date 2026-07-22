import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "B2 GEO/SEO Analyzer",
  description: "Auditoria de visibilidade digital para SEO e mecanismos generativos de IA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f5f7fa", color: "#1a1a2e" }}>
        <header style={{ background: "#1a1a2e", color: "white", padding: "16px 24px" }}>
          <h1 style={{ margin: 0, fontSize: "1.25rem" }}>🔍 B2 GEO/SEO Analyzer</h1>
        </header>
        <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}