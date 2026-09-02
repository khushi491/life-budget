import type { ReactElement } from "react";

export function lifeBudgetIconElement(
  size: number,
  maskable = false,
): ReactElement {
  const pad = maskable ? size * 0.2 : size * 0.14;
  const inner = Math.round(size - pad * 2);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: maskable ? "#F6EFBE" : "#111111",
      }}
    >
      <div
        style={{
          width: inner,
          height: inner,
          borderRadius: inner,
          background: maskable ? "#111111" : "#C5E88A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: maskable ? "#C5E88A" : "#111111",
          fontSize: Math.round(inner * 0.38),
          fontWeight: 800,
          letterSpacing: "-0.04em",
        }}
      >
        LB
      </div>
    </div>
  );
}
