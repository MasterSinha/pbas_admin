import { C } from '../constants/colors';

export default function Av({ init, color = C.accent, size = 34 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg,${color}28,${color}14)`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * .32, fontWeight: 700, color, fontFamily: "'JetBrains Mono',monospace" }}>
      {init}
    </div>
  );
}
