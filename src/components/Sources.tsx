import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

const SOURCES = [
  {
    title: "Malicious-address databases",
    body: "Curated blocklists maintained by wallet-security vendors, refreshed continuously.",
    tag: "db",
  },
  {
    title: "Community scam reports",
    body: "Public registries where victims document addresses used in fraud.",
    tag: "community",
  },
  {
    title: "On-chain wallet activity",
    body: "Behavioural heuristics: fund fan-out speed, wallet age, counterparty patterns.",
    tag: "on-chain",
  },
  {
    title: "Trusted news sources",
    body: "Security publications surfacing scams related to the pattern we detect.",
    tag: "news",
  },
];

export default function Sources() {
  return (
    <section id="sources" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: EASE }}
        className="mb-10"
      >
        <p className="mb-3 font-mono text-[11px] tracking-[0.25em] text-blue uppercase">
          Security sources
        </p>
        <h2 className="font-serif text-4xl tracking-tight text-blue-ink sm:text-5xl">
          Every verdict is <span className="italic text-blue">sourced</span>, not guessed.
        </h2>
      </motion.div>

      <div className="divide-y divide-[var(--color-hairline)] border border-hairline">
        {SOURCES.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.08, duration: 0.6, ease: EASE }}
            className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-4 bg-white px-5 py-5 transition-colors hover:bg-blue-faint sm:grid-cols-[90px_240px_1fr_auto] sm:gap-6"
          >
            <span className="font-mono text-[11px] text-blue-mid">0{i + 1}</span>
            <h3 className="text-[15px] font-semibold text-blue-ink">{s.title}</h3>
            <p className="col-span-3 text-[13.5px] leading-relaxed text-blue-ink/70 sm:col-span-1">
              {s.body}
            </p>
            <span className="hidden border border-hairline px-2 py-0.5 font-mono text-[10.5px] text-blue sm:inline-block">
              {s.tag}
            </span>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="mt-5 border border-dashed border-blue/30 bg-blue-faint px-4 py-3 text-center font-mono text-[11.5px] leading-relaxed text-blue-mid"
      >
        SafeSend AI provides risk information and does not guarantee whether a wallet is safe or
        fraudulent.
      </motion.p>
    </section>
  );
}
