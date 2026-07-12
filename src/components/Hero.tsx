import { motion } from "framer-motion";
import Globe from "@/components/originkit/Globe";
import TxCheck from "@/components/TxCheck";

const EASE = [0.22, 1, 0.36, 1] as const;

function RevealWord({ children, delay }: { children: string; delay: number }) {
  return (
    <span className="inline-block overflow-hidden pb-1 align-bottom">
      <motion.span
        initial={{ y: "115%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.85, delay, ease: EASE }}
        className="mr-[0.26em] inline-block"
      >
        {children}
      </motion.span>
    </span>
  );
}

export default function Hero({
  connected,
  onNeedConnect,
}: {
  connected: boolean;
  onNeedConnect: () => void;
}) {
  const line1 = ["Send", "crypto", "with"];
  return (
    <section className="mx-auto max-w-6xl px-4 pt-28 sm:px-6 lg:pt-32">
      <div className="grid gap-10 border border-hairline lg:grid-cols-[1.05fr_1fr]">
        {/* left: headline + globe */}
        <div className="relative flex flex-col justify-start overflow-hidden border-b border-hairline p-6 sm:p-10 lg:border-r lg:border-b-0">
          <div className="relative z-10">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="mb-5 font-mono text-[11px] tracking-[0.25em] text-blue uppercase"
            >
              ● Pre-transaction crypto safety
            </motion.p>
            <h1 className="font-serif text-[clamp(2.6rem,5.6vw,4.4rem)] leading-[1.04] tracking-tight text-blue-ink">
              {line1.map((w, i) => (
                <RevealWord key={w} delay={0.25 + i * 0.09}>
                  {w}
                </RevealWord>
              ))}
              <br />
              <span className="inline-block overflow-hidden pb-2 align-bottom">
                <motion.span
                  initial={{ y: "115%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, delay: 0.55, ease: EASE }}
                  className="inline-block italic text-blue"
                >
                  confidence.
                </motion.span>
              </span>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.7, ease: EASE }}
              className="mt-5 max-w-md text-[15px] leading-relaxed text-blue-ink/75"
            >
              SafeSend AI checks the receiving wallet for scam reports, suspicious activity and
              related security incidents before you approve a transaction.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.7 }}
              className="mt-4 inline-block border border-hairline bg-blue-faint px-3 py-1.5 font-mono text-[11.5px] text-blue"
            >
              We explain the risk. You make the final decision.
            </motion.p>
          </div>

          {/* globe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 1.2, ease: EASE }}
            className="relative z-10 mx-auto mt-6 w-full max-w-[340px]"
          >
            <div className="h-[260px] cursor-grab overflow-hidden active:cursor-grabbing sm:h-[300px]">
            <Globe
              speed={2}
              scale={8}
              dots={{ color: "#3347e0", size: 4, density: 8, allDots: false }}
              markerConfig={{
                markers: [
                  { lat: 37.7, lng: -122.4 },
                  { lat: 51.5, lng: -0.1 },
                  { lat: 1.35, lng: 103.8 },
                  { lat: 35.6, lng: 139.7 },
                ],
                color: "#101c66",
                size: 32,
              }}
              oceanColor="rgba(51,71,224,0.06)"
              outlineColor="rgba(51,71,224,0.55)"
              graticuleColor="rgba(51,71,224,0.12)"
              showGrid
              showOutline
            />
            </div>
            <p className="pointer-events-none mt-4 text-center font-mono text-[10px] tracking-[0.2em] text-blue-mid uppercase">
              scam reports tracked worldwide — drag me
            </p>
          </motion.div>
        </div>

        {/* right: the transaction check interface */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: EASE }}
          className="p-6 sm:p-8 lg:p-10"
        >
          <TxCheck connected={connected} onNeedConnect={onNeedConnect} />
        </motion.div>
      </div>
    </section>
  );
}
