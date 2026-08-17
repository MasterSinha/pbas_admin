export default function Toggle({ val, onChange }) {
  return (
    <div
      className="toggle-bg"
      onClick={() => onChange(!val)}
      style={{ width: 48, height: 25, borderRadius: 13, padding: 3, background: val ? "linear-gradient(135deg,#3b82f6,#818cf8)" : "var(--c-soft-bg)", border: `1px solid ${val ? "rgba(59,130,246,.4)" : "var(--c-input-border)"}`, position: "relative", cursor: "pointer", flexShrink: 0 }}
    >
      <div
        className="toggle-dot"
        style={{ position: "absolute", top: 3, left: val ? 24 : 3, width: 19, height: 19, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,.4)" }}
      />
    </div>
  );
}
