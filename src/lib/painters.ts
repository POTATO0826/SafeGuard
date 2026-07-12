import type { Painter } from "@/components/DitherArt";

/** Rotating shaded sphere — the dithered "globe" motif. */
export const orbPainter: Painter = (ctx, w, h, t) => {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.42;
  const lightX = cx + Math.cos(t * 0.4) * r * 0.55;
  const lightY = cy - r * 0.45 + Math.sin(t * 0.3) * r * 0.15;
  const g = ctx.createRadialGradient(lightX, lightY, r * 0.08, cx, cy, r * 1.15);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.45, "#999999");
  g.addColorStop(1, "#0a0a0a");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
};

/** Concentric expanding ripple rings. */
export const ringsPainter: Painter = (ctx, w, h, t) => {
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.min(w, h) * 0.48;
  for (let i = 0; i < 7; i++) {
    const phase = (t * 0.25 + i / 7) % 1;
    const r = phase * maxR;
    const alpha = (1 - phase) * 0.9;
    ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
    ctx.lineWidth = Math.max(1.5, maxR * 0.06 * (1 - phase));
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.beginPath();
  ctx.arc(cx, cy, maxR * 0.08, 0, Math.PI * 2);
  ctx.fill();
};

/** Shield with a breathing glow. */
export const shieldPainter: Painter = (ctx, w, h, t) => {
  const cx = w / 2;
  const cy = h / 2;
  const s = Math.min(w, h) * 0.38;
  const pulse = 0.85 + Math.sin(t * 1.4) * 0.15;
  const g = ctx.createRadialGradient(cx, cy - s * 0.2, s * 0.1, cx, cy, s * 1.5);
  g.addColorStop(0, `rgba(0,0,0,${0.95 * pulse})`);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + s * 0.85, cy - s * 0.6);
  ctx.lineTo(cx + s * 0.85, cy + s * 0.15);
  ctx.quadraticCurveTo(cx + s * 0.8, cy + s * 0.8, cx, cy + s);
  ctx.quadraticCurveTo(cx - s * 0.8, cy + s * 0.8, cx - s * 0.85, cy + s * 0.15);
  ctx.lineTo(cx - s * 0.85, cy - s * 0.6);
  ctx.closePath();
  ctx.fill();

  // check mark carved in white
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(2, s * 0.16);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.35, cy);
  ctx.lineTo(cx - s * 0.05, cy + s * 0.3);
  ctx.lineTo(cx + s * 0.42, cy - s * 0.32);
  ctx.stroke();
};

/** Wireframe network of drifting linked nodes. */
export const networkPainter: Painter = (ctx, w, h, t) => {
  const nodes: [number, number][] = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + t * 0.15;
    const rr = Math.min(w, h) * (0.18 + 0.22 * ((i * 37) % 10) / 10);
    nodes.push([
      w / 2 + Math.cos(a * (1 + (i % 3) * 0.2)) * rr,
      h / 2 + Math.sin(a * (1 + (i % 2) * 0.3)) * rr,
    ]);
  }
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = nodes[i]![0] - nodes[j]![0];
      const dy = nodes[i]![1] - nodes[j]![1];
      if (Math.hypot(dx, dy) < Math.min(w, h) * 0.34) {
        ctx.beginPath();
        ctx.moveTo(nodes[i]![0], nodes[i]![1]);
        ctx.lineTo(nodes[j]![0], nodes[j]![1]);
        ctx.stroke();
      }
    }
  }
  ctx.fillStyle = "#000000";
  for (const [x, y] of nodes) {
    ctx.beginPath();
    ctx.arc(x, y, Math.min(w, h) * 0.028, 0, Math.PI * 2);
    ctx.fill();
  }
};

/** Wallet with a pulsing connection signal — the read-only connect step. */
export const walletPainter: Painter = (ctx, w, h, t) => {
  const s = Math.min(w, h);
  const x = w * 0.14;
  const y = h * 0.31;
  const ww = w * 0.66;
  const wh = h * 0.45;
  const radius = s * 0.07;

  // A soft tonal field gives the wallet a deliberate dithered body.
  const body = ctx.createLinearGradient(x, y, x + ww, y + wh);
  body.addColorStop(0, "#202020");
  body.addColorStop(0.58, "#777777");
  body.addColorStop(1, "#151515");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(x, y, ww, wh, radius);
  ctx.fill();

  // Top fold makes the silhouette read immediately as a wallet.
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = Math.max(1.5, s * 0.035);
  ctx.beginPath();
  ctx.moveTo(x + radius, y + wh * 0.17);
  ctx.lineTo(x + ww * 0.76, y + wh * 0.17);
  ctx.stroke();

  // Clasp and status light.
  ctx.fillStyle = "#050505";
  ctx.beginPath();
  ctx.roundRect(x + ww * 0.61, y + wh * 0.38, ww * 0.32, wh * 0.34, radius * 0.5);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x + ww * 0.72, y + wh * 0.55, s * 0.025, 0, Math.PI * 2);
  ctx.fill();

  // Connection arcs travel outward without obscuring the wallet.
  const pulse = (t * 0.55) % 1;
  const sx = x + ww * 0.7;
  const sy = y * 0.83;
  ctx.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    const phase = (pulse + i / 3) % 1;
    ctx.strokeStyle = `rgba(0,0,0,${0.95 - phase * 0.55})`;
    ctx.lineWidth = Math.max(1.2, s * 0.025);
    ctx.beginPath();
    ctx.arc(sx, sy, s * (0.08 + phase * 0.23), Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }
};

/** Coin disc with a currency glyph. */
export function coinPainter(glyph: string): Painter {
  return (ctx, w, h, t) => {
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.44;
    // slow wobble like a spinning coin
    const squeeze = 0.82 + Math.abs(Math.sin(t * 0.8)) * 0.18;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(squeeze, 1);
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r * 1.2);
    g.addColorStop(0, "#666666");
    g.addColorStop(1, "#000000");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(1.5, r * 0.06);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${r * 1.05}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, 0, r * 0.06);
    ctx.restore();
  };
}

/** Fish hook — phishing. */
export const hookPainter: Painter = (ctx, w, h, t) => {
  const cx = w / 2;
  const cy = h / 2;
  const s = Math.min(w, h) * 0.36;
  const sway = Math.sin(t * 0.9) * s * 0.08;
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = Math.max(2.5, s * 0.14);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx + sway, cy - s);
  ctx.lineTo(cx + sway, cy + s * 0.25);
  ctx.arc(cx + sway - s * 0.35, cy + s * 0.25, s * 0.35, 0, Math.PI * 0.95);
  ctx.stroke();
  // barb
  ctx.beginPath();
  ctx.moveTo(cx + sway - s * 0.7, cy + s * 0.28);
  ctx.lineTo(cx + sway - s * 0.55, cy - s * 0.02);
  ctx.stroke();
  // "@" bait circle
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.font = `bold ${s * 0.55}px "JetBrains Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("@", cx + sway, cy - s * 1.0 - Math.abs(sway));
};

/** Two near-identical address blocks — address poisoning. */
export const twinPainter: Painter = (ctx, w, h, t) => {
  const bw = w * 0.62;
  const bh = h * 0.16;
  const x = w * 0.19;
  const blink = (Math.sin(t * 2.2) + 1) / 2;
  const rows = [
    { y: h * 0.22, a: 0.9 },
    { y: h * 0.5, a: 0.35 + blink * 0.55 },
    { y: h * 0.78, a: 0.9 },
  ];
  for (const r of rows) {
    ctx.fillStyle = `rgba(0,0,0,${r.a})`;
    ctx.fillRect(x, r.y - bh / 2, bw, bh);
    // dash pattern inside
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(x + bw * (0.08 + i * 0.18), r.y - bh * 0.12, bw * 0.1, bh * 0.24);
    }
  }
  // alert dot on the poisoned middle row
  ctx.fillStyle = `rgba(0,0,0,${0.4 + blink * 0.6})`;
  ctx.beginPath();
  ctx.arc(x + bw + w * 0.09, h * 0.5, w * 0.045, 0, Math.PI * 2);
  ctx.fill();
};

/** Funnel draining coins — wallet drainers. */
export const drainPainter: Painter = (ctx, w, h, t) => {
  const cx = w / 2;
  ctx.fillStyle = "rgba(0,0,0,0.9)";
  ctx.beginPath();
  ctx.moveTo(w * 0.18, h * 0.14);
  ctx.lineTo(w * 0.82, h * 0.14);
  ctx.lineTo(cx + w * 0.05, h * 0.52);
  ctx.lineTo(cx + w * 0.05, h * 0.62);
  ctx.lineTo(cx - w * 0.05, h * 0.62);
  ctx.lineTo(cx - w * 0.05, h * 0.52);
  ctx.closePath();
  ctx.fill();
  // falling coins
  for (let i = 0; i < 3; i++) {
    const phase = (t * 0.7 + i * 0.33) % 1;
    const y = h * 0.62 + phase * h * 0.3;
    const alpha = 1 - phase;
    ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, y, w * 0.05, 0, Math.PI * 2);
    ctx.stroke();
  }
};

/** Masked social-engineer face. */
export const maskPainter: Painter = (ctx, w, h, t) => {
  const cx = w / 2;
  const cy = h / 2;
  const s = Math.min(w, h) * 0.34;
  const tilt = Math.sin(t * 0.6) * 0.08;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);
  const g = ctx.createLinearGradient(-s, -s, s, s);
  g.addColorStop(0, "#333333");
  g.addColorStop(1, "#000000");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.85, s * 1.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(-s * 0.32, -s * 0.15, s * 0.2, s * 0.13, 0.2, 0, Math.PI * 2);
  ctx.ellipse(s * 0.32, -s * 0.15, s * 0.2, s * 0.13, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(2, s * 0.09);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-s * 0.3, s * 0.45);
  ctx.quadraticCurveTo(0, s * 0.62, s * 0.3, s * 0.45);
  ctx.stroke();
  ctx.restore();
};

/** Cracked key — compromised keys / RPC. */
export const keyPainter: Painter = (ctx, w, h, t) => {
  const cx = w / 2;
  const cy = h / 2;
  const s = Math.min(w, h) * 0.32;
  const shake = Math.sin(t * 5) * (Math.sin(t * 0.7) > 0.7 ? s * 0.03 : 0);
  ctx.save();
  ctx.translate(cx + shake, cy);
  ctx.rotate(-Math.PI / 5);
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = Math.max(3, s * 0.22);
  ctx.lineCap = "round";
  // ring
  ctx.beginPath();
  ctx.arc(-s * 0.55, 0, s * 0.42, 0, Math.PI * 2);
  ctx.stroke();
  // shaft + teeth
  ctx.beginPath();
  ctx.moveTo(-s * 0.13, 0);
  ctx.lineTo(s * 0.95, 0);
  ctx.moveTo(s * 0.55, 0);
  ctx.lineTo(s * 0.55, s * 0.32);
  ctx.moveTo(s * 0.9, 0);
  ctx.lineTo(s * 0.9, s * 0.42);
  ctx.stroke();
  // crack
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(1.5, s * 0.09);
  ctx.beginPath();
  ctx.moveTo(s * 0.2, -s * 0.14);
  ctx.lineTo(s * 0.32, 0);
  ctx.lineTo(s * 0.2, s * 0.14);
  ctx.stroke();
  ctx.restore();
};
