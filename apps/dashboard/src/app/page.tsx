"use client";

import { useState } from "react";

interface AnalysisResult {
  id: string;
  url: string;
  status: string;
  scores: {
    seo: { score: number; coverage: number; confidence: number } | null;
    geo: { score: number; coverage: number; confidence: number } | null;
  } | null;
  findings?: Array<{
    ruleKey: string;
    status: string;
    category: string;
    scoreType?: string;
    severity: string;
    title: string;
    priority: string;
    estimatedScoreGain: number;
    explanation?: string;
    remediation?: string;
    source?: string;
    evidences?: Array<{ type: string; source: string; excerpt: string }>;
  }>;
  actionItems?: Array<{ title: string; priority: string; effort: string; estimatedScoreGain: number }>;
}

// ── Helpers ──

function scoreColor(s: number) { return s >= 80 ? "#0a0" : s >= 50 ? "#f90" : "#e00"; }
function statusBadge(status: string) {
  const map: Record<string, string> = { PASS: "#0a0", FAIL: "#e00", WARN: "#f90", NOT_APPLICABLE: "#999", NOT_TESTED: "#666" };
  return map[status] || "#999";
}
function severityBadge(severity: string) {
  if (severity === "critical") return { bg: "#fee", color: "#c00", label: "CRÍTICO" };
  if (severity === "high") return { bg: "#fec", color: "#960", label: "ALTO" };
  if (severity === "medium") return { bg: "#eef", color: "#339", label: "MÉDIO" };
  return { bg: "#eee", color: "#666", label: "BAIXO" };
}

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!url) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3001/v1/analysis-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: "demo-project",
          type: "page",
          url,
          source: "dashboard",
        }),
      });
      const data = await res.json();

      // Aguardar processamento (MVP: síncrono)
      const detailRes = await fetch(`http://localhost:3001/v1/analysis-runs/${data.id}`);
      const detail = await detailRes.json();

      // Buscar findings
      const findingsRes = await fetch(`http://localhost:3001/v1/analysis-runs/${data.id}/findings`);
      const findings = await findingsRes.json();

      setResult({ ...detail, findings });
    } catch (err) {
      setError("Erro ao conectar com a API. Verifique se o backend está rodando na porta 3001.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: 8 }}>Analisar Página</h2>
        <p style={{ color: "#666", marginBottom: 16 }}>
          Insira uma URL para obter o diagnóstico completo de SEO e GEO.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="url"
            placeholder="https://exemplo.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 16px",
              fontSize: "1rem",
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              padding: "10px 24px",
              background: loading ? "#888" : "#1a1a2e",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {loading ? "Analisando..." : "Analisar"}
          </button>
        </div>
        {error && <p style={{ color: "#e00", marginTop: 12 }}>{error}</p>}
      </section>

      {result && (
        <section>
          <h2 style={{ fontSize: "1.25rem", marginBottom: 16 }}>Resultado da Análise</h2>

          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1, background: "white", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: (result.scores?.seo?.score ?? 0) >= 80 ? "#0a0" : (result.scores?.seo?.score ?? 0) >= 50 ? "#f90" : "#e00" }}>
                {result.scores?.seo?.score ?? "—"}
              </div>
              <div style={{ color: "#666", fontSize: "0.9rem" }}>SEO Score</div>
              {result.scores?.seo && (
                <div style={{ fontSize: "0.8rem", color: "#999", marginTop: 4 }}>
                  Cobertura: {(result.scores.seo.coverage * 100).toFixed(0)}% | Confiança: {result.scores.seo.confidence}%
                </div>
              )}
            </div>
            <div style={{ flex: 1, background: "white", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: (result.scores?.geo?.score ?? 0) >= 80 ? "#0a0" : (result.scores?.geo?.score ?? 0) >= 50 ? "#f90" : "#e00" }}>
                {result.scores?.geo?.score ?? "—"}
              </div>
              <div style={{ color: "#666", fontSize: "0.9rem" }}>GEO Readiness</div>
              {result.scores?.geo && (
                <div style={{ fontSize: "0.8rem", color: "#999", marginTop: 4 }}>
                  Cobertura: {(result.scores.geo.coverage * 100).toFixed(0)}% | Confiança: {result.scores.geo.confidence}%
                </div>
              )}
            </div>
          </div>

          {result.findings && result.findings.length > 0 && (
            <div>
              <h3 style={{ fontSize: "1.1rem", marginBottom: 12 }}>
                Findings ({result.findings.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {result.findings.map((f: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      background: "white",
                      padding: "12px 16px",
                      borderRadius: 8,
                      borderLeft: `4px solid ${
                        f.status === "PASS" ? "#0a0" : f.status === "FAIL" ? "#e00" : f.status === "WARN" ? "#f90" : "#999"
                      }`,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "0.95rem" }}>{f.title}</strong>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: "0.75rem",
                        background: f.severity === "critical" ? "#fee" : f.severity === "high" ? "#fec" : "#eee",
                        color: f.severity === "critical" ? "#c00" : f.severity === "high" ? "#960" : "#666",
                        fontWeight: 600,
                      }}>
                        {f.severity} | {f.priority} | {(f.estimatedScoreGain ?? 0) > 0 ? `+${f.estimatedScoreGain} pts` : ""}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#666", marginTop: 4 }}>
                      Status: <strong>{f.status}</strong> — Categoria: {f.category}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 24, fontSize: "0.8rem", color: "#999", fontStyle: "italic" }}>
            As pontuações GEO e AI Visibility são indicadores proprietários de preparação e visibilidade observada. Não representam notas oficiais do Google, ChatGPT, Claude, Gemini ou de qualquer outro mecanismo, nem garantem indexação, citação, ranking ou recomendação.
          </div>
        </section>
      )}
    </div>
  );
}