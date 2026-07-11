import { motion } from "framer-motion";
import DitherArt from "@/components/DitherArt";
import { ringsPainter, shieldPainter, networkPainter, twinPainter } from "@/lib/painters";
import SpiralCoins from "@/components/SpiralCoins";

const EASE = [0.22, 1, 0.36, 1] as const;

const STEPS = [
  {
    n: "01",
    title: "Connect your wallet",
    body: "Read-only. SafeSend sees your address and balance — never your keys.",
    painter: networkPainter,
  },
  {
    n: "02",
    title: "Enter the recipient address",
    body: "Paste the destination. We validate the format and check for look-alikes.",
    painter: twinPainter,
  },
  {
    n: "03",
    title: "Review the security analysis",
    body: "Databases, scam reports, on-chain behaviour and related news in one view.",
    painter: ringsPainter,
  },
  {
    n: "04",
    title: "Decide whether to continue",
    body: "Cancel, review evidence, or proceed to MetaMask — the choice stays yours.",
    painter: shieldPainter,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: EASE }}
        className="mb-10 flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <p className="mb-3 font-mono text-[11px] tracking-[0.25em] text-blue uppercase">
            How it works
          </p>
          <h2 className="font-serif text-4xl tracking-tight text-blue-ink sm:text-5xl">
            Four steps between you <br className="hidden sm:block" /> and a{" "}
            <span className="italic text-blue">bad transfer</span>.
          </h2>
        </div>
      </motion.div>

      <div className="grid border border-hairline sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.12, duration: 0.7, ease: EASE }}
            className="group relative border-hairline p-6 not-last:border-b sm:not-last:border-b-0 sm:odd:border-r lg:not-last:border-r"
          >
            {/* connecting arrow */}
            {i < STEPS.length - 1 && (
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="absolute top-1/2 -right-[9px] z-10 hidden h-[18px] w-[18px] items-center justify-center border border-hairline bg-white font-mono text-[10px] text-blue lg:flex"
              >
                →
              </motion.span>
            )}
            <div className="relative mb-5 h-28 w-28 transition-transform duration-300 group-hover:scale-105">
              <DitherArt painter={s.painter} pixelSize={2} timeScale={0.7} />
            </div>
            <p className="font-mono text-[11px] text-blue">{s.n}</p>
            <h3 className="mt-1.5 text-[15.5px] font-semibold text-blue-ink">{s.title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-blue-ink/70">{s.body}</p>
          </motion.div>
        ))}
      </div>

      {/* spiral of supported assets */}
      <div className="mt-16 grid items-center gap-8 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <p className="mb-3 font-mono text-[11px] tracking-[0.25em] text-blue uppercase">
            Asset coverage
          </p>
          <h3 className="font-serif text-3xl tracking-tight text-blue-ink sm:text-4xl">
            The scam doesn't care <span className="italic text-blue">which coin</span> you hold.
          </h3>
          <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-blue-ink/75">
            Address screening works the same whether you're moving ETH, stablecoins or anything
            else on the network. One habit — check before you send — protects all of it.
          </p>
        </motion.div>
        <SpiralCoins />
      </div>
    </section>
  );
}
