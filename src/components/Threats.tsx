import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { useEffect, useRef } from "react";
import GlitterWrap from "@/components/originkit/GlitterWrap";
import DitherArt from "@/components/DitherArt";
import { keyPainter, maskPainter, twinPainter, drainPainter, hookPainter } from "@/lib/painters";

const EASE = [0.22, 1, 0.36, 1] as const;

function CountUp({ to, prefix = "", suffix = "", decimals = 0 }: { to: number; prefix?: string; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => `${prefix}${v.toFixed(decimals)}${suffix}`);
  useEffect(() => {
    if (inView) {
      const controls = animate(mv, to, { duration: 2, ease: [0.22, 1, 0.36, 1] });
      return controls.stop;
    }
  }, [inView, to, mv]);
  return <motion.span ref={ref}>{text}</motion.span>;
}

const STATS = [
  { value: 1.31, prefix: "$", suffix: "B", decimals: 2, label: "lost to Web3 attacks in H1 2026", source: "CertiK Hack3D" },
  { value: 344, suffix: "", decimals: 0, label: "security incidents in six months", source: "CertiK Hack3D" },
  { value: 65.4, suffix: "M", decimals: 1, label: "address-poisoning attempts since Jan 2025", source: "Blockaid" },
  { value: 200, prefix: "1 in ", suffix: "", decimals: 0, label: "poisoning attempts succeeds", source: "Blockaid" },
];

const THREATS = [
  {
    painter: keyPainter,
    title: "Wallet compromise",
    stat: "$444.5M across 33 incidents",
    body: "The costliest vector of H1 2026 — averaging $13.4M per event. The Kelp DAO RPC compromise and Drift Protocol breach alone took $576M.",
  },
  {
    painter: maskPainter,
    title: "Targeted social engineering",
    stat: "85% of phishing losses, 4 attacks",
    body: "Broad spam campaigns are dying; personalised cons on wealthy wallets aren't. One January victim lost $284.7M across multiple chains.",
  },
  {
    painter: twinPainter,
    title: "Address poisoning",
    stat: "3.4M attempts in January 2026 alone",
    body: "Attackers plant look-alike addresses in your history so you copy the wrong one. Cheap fees post-Fusaka made mass poisoning 6× cheaper.",
  },
  {
    painter: drainPainter,
    title: "Drainer-as-a-Service",
    stat: "27 drainer events in H1 2026",
    body: "Turn-key kits let anyone run a wallet drainer. One approval signature on a malicious site can empty everything the wallet holds.",
  },
  {
    painter: hookPainter,
    title: "Fake support & recovery scams",
    stat: "The second hit after the first theft",
    body: "Fraudulent 'recovery services' target victims who already lost funds — charging up-front fees to recover coins that never come back.",
  },
];

export default function Threats() {
  return (
    <section id="threats" className="relative scroll-mt-20 overflow-hidden bg-blue-ink">
      {/* OriginKit GlitterWrap starfield backdrop */}
      <div className="absolute inset-0">
        <GlitterWrap
          particleCount={650}
          color1="#ffffff"
          color2="#dbe0fb"
          color3="#aeb7f4"
          speed={3}
          starSize={16}
          glitterIntensity={6}
          trailAmount={45}
          brightness={100}
          background="transparent"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-ink/40 via-transparent to-blue-ink/40" />

      <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mb-12 text-center"
        >
          <p className="mb-3 font-mono text-[11px] tracking-[0.25em] text-blue-soft uppercase">
            The threat landscape · 2026
          </p>
          <h2 className="font-serif text-4xl tracking-tight text-white sm:text-5xl">
            Why checking first <span className="italic text-blue-soft">matters now</span>.
          </h2>
        </motion.div>

        {/* stat strip */}
        <div className="mb-14 grid grid-cols-2 divide-x divide-white/10 border border-white/15 bg-white/[0.03] backdrop-blur-sm lg:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.1, duration: 0.7, ease: EASE }}
              className="border-white/10 p-5 text-center max-lg:nth-[-n+2]:border-b"
            >
              <p className="font-serif text-3xl text-white tabular-nums sm:text-4xl">
                <CountUp to={s.value} prefix={s.prefix ?? ""} suffix={s.suffix} decimals={s.decimals} />
              </p>
              <p className="mt-1.5 text-[12px] leading-snug text-blue-soft">{s.label}</p>
              <p className="mt-1 font-mono text-[9.5px] tracking-[0.15em] text-white/35 uppercase">
                {s.source}
              </p>
            </motion.div>
          ))}
        </div>

        {/* threat rows */}
        <div className="divide-y divide-white/10 border border-white/15 bg-blue-ink/40 backdrop-blur-[2px]">
          {THREATS.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.7, ease: EASE }}
              className="group grid grid-cols-[72px_1fr] items-center gap-5 p-5 transition-colors hover:bg-white/[0.04] sm:grid-cols-[88px_240px_1fr] sm:gap-7"
            >
              <div className="relative h-[72px] w-[72px] transition-transform duration-300 group-hover:scale-110 sm:h-[88px] sm:w-[88px]">
                <DitherArt painter={t.painter} pixelSize={2} whiteInk timeScale={0.8} />
              </div>
              <div>
                <h3 className="text-[15.5px] font-semibold text-white">{t.title}</h3>
                <p className="mt-1 font-mono text-[11px] text-blue-soft">{t.stat}</p>
              </div>
              <p className="col-span-2 text-[13.5px] leading-relaxed text-white/65 sm:col-span-1">
                {t.body}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.8, ease: EASE }}
          className="mt-12 text-center"
        >
          <p className="mx-auto max-w-md font-serif text-2xl text-white italic">
            Every one of these starts the same way: someone hit send without checking.
          </p>
          <a
            href="#check"
            className="mt-6 inline-block border border-white bg-white px-7 py-3.5 text-[14.5px] font-semibold text-blue-ink shadow-[3px_3px_0_0_rgba(255,255,255,0.3)] transition-all hover:bg-blue-wash hover:shadow-[1px_1px_0_0_rgba(255,255,255,0.3)] active:translate-y-px"
          >
            Check an address now
          </a>
        </motion.div>
      </div>
    </section>
  );
}
