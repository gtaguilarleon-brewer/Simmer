export const t = {
  bg: "#1a1814",
  surface: "#242019",
  surfaceHover: "#2c271f",
  border: "#3d3528",
  accent: "#d4935a",
  accentDim: "rgba(212,147,90,0.12)",
  accentText: "#1a1814",
  text: "#f0e6d6",
  muted: "#c4b89a",
  subtle: "#8a8070",
  dim: "#5c5548",
  danger: "#c0564b",
  dangerDim: "rgba(192,86,75,0.12)",
  green: "#81c784",
  greenDim: "rgba(129,199,132,0.12)",
  blue: "#64b5f6",
  blueDim: "rgba(100,181,246,0.12)",
  purple: "#b39ddb",
  purpleDim: "rgba(179,157,219,0.12)",
  serif: "'DM Serif Display', Georgia, serif",
  sans: "Inter, -apple-system, sans-serif",
  radius: 10,
};

export const inputBase = {
  padding: "9px 12px",
  border: `1px solid ${t.border}`,
  borderRadius: 8,
  fontSize: 14,
  background: t.bg,
  color: t.text,
  outline: "none",
  fontFamily: t.sans,
  width: "100%",
  boxSizing: "border-box",
};

export const labelBase = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: t.subtle,
  marginBottom: 5,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  fontFamily: t.sans,
};

export const btnPrimary = {
  padding: "10px 18px",
  background: t.accent,
  color: t.accentText,
  border: "none",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: t.sans,
};

export const btnSecondary = {
  padding: "10px 18px",
  background: "transparent",
  color: t.muted,
  border: `1px solid ${t.border}`,
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: t.sans,
};

export const btnDanger = {
  padding: "8px 14px",
  background: t.dangerDim,
  color: t.danger,
  border: `1px solid rgba(192,86,75,0.2)`,
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: t.sans,
};

export const btnSmall = {
  padding: "6px 12px",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: t.sans,
  border: "none",
};

export const selectBase = {
  padding: "7px 12px",
  border: `1px solid ${t.border}`,
  borderRadius: 8,
  fontSize: 13,
  background: t.surface,
  color: t.muted,
  cursor: "pointer",
  fontFamily: t.sans,
  outline: "none",
  width: "100%",
};
