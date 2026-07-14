import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

type Category = "phishing" | "poisoning" | "drainers" | "reports" | "guides";

interface Article {
  publisher: string;
  title: string;
  date: string;
  summary: string;
  category: Category;
  url: string;
}

interface NewsApiResponse {
  articles?: unknown;
  refreshing?: boolean;
}

type FeedState = "refreshing" | "live" | "fallback";

const CATEGORY_LABELS: Record<Category, string> = {
  phishing: "Phishing",
  poisoning: "Address poisoning",
  drainers: "Drainers",
  reports: "Industry reports",
  guides: "Safety guides",
};

function isArticle(value: unknown): value is Article {
  if (!value || typeof value !== "object") return false;
  const article = value as Record<string, unknown>;
  return (
    typeof article.publisher === "string" &&
    typeof article.title === "string" &&
    typeof article.date === "string" &&
    typeof article.summary === "string" &&
    typeof article.url === "string" &&
    typeof article.category === "string" &&
    article.category in CATEGORY_LABELS
  );
}

const FEATURED: Article = {
  publisher: "CertiK Hack3D",
  title: "Web3 lost $1.31B in H1 2026 as wallet attacks intensify",
  date: "Jul 2026",
  summary:
    "Wallet compromise became the costliest attack vector of the half at $444.5M across 33 incidents — averaging $13.4M per event. The report breaks down where the money went, which chains were hit hardest, and why individual wallets are now the primary target instead of protocols.",
  category: "reports",
  url: "https://www.certik.com/skynet-report/certik-hack3d-h1-2026-report",
};

const ARTICLES: Article[] = [
  {
    publisher: "Blockaid",
    title: "Address poisoning: the growing threat draining millions",
    date: "Jun 2026",
    summary:
      "Over 65.4 million poisoning transactions flagged since January 2025 — about 1 in 200 attempts succeeds. Cheap post-Fusaka fees made mass poisoning 6× cheaper to run.",
    category: "poisoning",
    url: "https://www.blockaid.io/blog/address-poisoning-the-growing-threat-draining-millions-from-crypto-users",
  },
  {
    publisher: "MetaMask Security",
    title: "Fake support scams continue to prey on theft victims",
    date: "Jun 2026",
    summary:
      "Fraudulent 'recovery services' target users who already lost funds, charging up-front fees to recover coins that never come back. How to spot the second hit before it lands.",
    category: "phishing",
    url: "https://metamask.io/news/crypto-security-report-june-2026",
  },
  {
    publisher: "ScamSniffer",
    title: "Drainer-as-a-Service kits hit a new low barrier to entry",
    date: "May 2026",
    summary:
      "Turn-key drainer kits now rent for a revenue share instead of an up-front fee. One approval signature on a malicious site can empty everything a wallet holds.",
    category: "drainers",
    url: "https://drops.scamsniffer.io/",
  },
  {
    publisher: "Chainalysis",
    title: "Targeted social engineering now drives 85% of phishing losses",
    date: "May 2026",
    summary:
      "Broad spam campaigns are dying; personalised cons on wealthy wallets aren't. One January victim lost $284.7M across multiple chains to a single sustained operation.",
    category: "reports",
    url: "https://www.chainalysis.com/blog/",
  },
  {
    publisher: "SafeSend AI",
    title: "The 60-second pre-send checklist every wallet needs",
    date: "Apr 2026",
    summary:
      "Verify the full address, not just the first and last four characters. Check the destination against scam databases. Never trust an address copied from your own history.",
    category: "guides",
    url: "#",
  },
  {
    publisher: "Blockaid",
    title: "How look-alike addresses end up in your transaction history",
    date: "Apr 2026",
    summary:
      "Attackers send dust from vanity addresses that mimic your real counterparties, betting you'll copy the wrong one. The mechanics of the con, step by step.",
    category: "poisoning",
    url: "https://www.blockaid.io/blog",
  },
  {
    publisher: "SafeSend AI",
    title: "Reading approval signatures before you sign them",
    date: "Mar 2026",
    summary:
      "A signature request is a contract. What setApprovalForAll actually grants, why unlimited token approvals persist after you leave a site, and how to revoke them.",
    category: "guides",
    url: "#",
  },
  {
    publisher: "PhishTank",
    title: "Fake airdrop pages remain the top drainer delivery vehicle",
    date: "Mar 2026",
    summary:
      "Seasonal airdrop hype keeps feeding drainer operators fresh victims. The domains rotate daily, but the payout wallets behind them change far less often.",
    category: "drainers",
    url: "https://phishtank.org/",
  },
  {
    publisher: "CoinDesk",
    title: "Wallet providers move toward mandatory pre-send screening",
    date: "Feb 2026",
    summary:
      "After a year of record losses, major wallets are integrating blocklist checks directly into the send flow — the pattern SafeSend has championed from day one.",
    category: "reports",
    url: "https://www.coindesk.com/",
  },
];

const FILTERS: { label: string; value: Category | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Phishing", value: "phishing" },
  { label: "Address poisoning", value: "poisoning" },
  { label: "Drainers", value: "drainers" },
  { label: "Industry reports", value: "reports" },
  { label: "Safety guides", value: "guides" },
];

const CHECKLIST = [
  "Verify the entire address character by character — not just the ends.",
  "Never copy a recipient address from your own transaction history.",
  "Screen every new destination against scam databases before sending.",
  "Treat every signature request as a contract you are agreeing to.",
];

export default function Insights() {
  const [filter, setFilter] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [liveArticles, setLiveArticles] = useState<Article[]>([]);
  const [feedState, setFeedState] = useState<FeedState>("refreshing");

  useEffect(() => {
    const controller = new AbortController();
    let timer: number | undefined;

    const loadNews = async () => {
      try {
        const response = await fetch("/api/news", { signal: controller.signal });
        if (!response.ok) throw new Error(`News service returned ${response.status}`);
        const payload = (await response.json()) as NewsApiResponse;
        const articles = Array.isArray(payload.articles) ? payload.articles.filter(isArticle) : [];

        if (articles.length > 0) {
          setLiveArticles(articles);
          setFeedState("live");
          return;
        }

        if (payload.refreshing) {
          setFeedState("refreshing");
          timer = window.setTimeout(() => void loadNews(), 5000);
          return;
        }

        setFeedState("fallback");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setFeedState("fallback");
      }
    };

    void loadNews();
    return () => {
      controller.abort();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  const featured = liveArticles[0] ?? FEATURED;
  const articles = liveArticles.length > 0 ? liveArticles.slice(1) : ARTICLES;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const searchableArticles = normalizedQuery ? [featured, ...articles] : articles;
  const visible = searchableArticles.filter((article) => {
    const matchesCategory = filter === "all" || article.category === filter;
    const searchableText = [
      article.title,
      article.publisher,
      article.summary,
      CATEGORY_LABELS[article.category],
    ]
      .join(" ")
      .toLocaleLowerCase();
    return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
  });

  return (
    <div className="pt-16">
      {/* page header */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <p className="mb-3 font-mono text-[11px] tracking-[0.25em] text-blue uppercase">
            News &amp; Insights
          </p>
          <h1 className="max-w-2xl font-serif text-4xl tracking-tight text-blue-ink sm:text-6xl">
            Stay ahead of <span className="italic text-blue">wallet threats</span>.
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-blue-ink/70">
            Curated reporting and practical guidance on the scams targeting crypto wallets right
            now — the same sources SafeSend AI checks before every transaction.
          </p>
          <p className="mt-3 font-mono text-[10.5px] tracking-wide text-blue-mid uppercase">
            {feedState === "live"
              ? "Live feed · extracted with newspaper4k"
              : feedState === "refreshing"
                ? "Refreshing trusted publications…"
                : "Showing curated articles · live service unavailable"}
          </p>
        </motion.div>
      </section>

      {/* featured article */}
      <section
        className={`mx-auto max-w-6xl px-4 pb-14 sm:px-6 ${normalizedQuery ? "hidden" : ""}`}
      >
        <motion.a
          href={featured.url}
          target="_blank"
          rel="noreferrer"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.8, ease: EASE }}
          className="group grid border border-hairline bg-white transition-colors hover:bg-blue-faint md:grid-cols-[1fr_260px]"
        >
          <div className="p-6 sm:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="border border-blue bg-blue px-2 py-0.5 font-mono text-[10.5px] text-white">
                featured
              </span>
              <span className="border border-hairline px-2 py-0.5 font-mono text-[10.5px] text-blue">
                {CATEGORY_LABELS[featured.category]}
              </span>
            </div>
            <h2 className="max-w-xl font-serif text-2xl leading-snug tracking-tight text-blue-ink transition-colors group-hover:text-blue sm:text-4xl">
              {featured.title}
            </h2>
            <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-blue-ink/70">
              {featured.summary}
            </p>
          </div>
          <div className="flex flex-row items-center justify-between gap-2 border-t border-hairline p-6 font-mono text-[11.5px] text-blue-mid md:flex-col md:items-end md:justify-center md:gap-3 md:border-t-0 md:border-l md:p-8 md:text-right">
            <span className="text-blue-ink">{featured.publisher}</span>
            <span>{featured.date}</span>
            <span className="text-blue transition-transform group-hover:translate-x-0.5">
              Read article ↗
            </span>
          </div>
        </motion.a>
      </section>

      {/* filters + article grid */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: EASE }}
          className="mb-4"
        >
          <label htmlFor="news-search" className="mb-2 block font-mono text-[10.5px] tracking-[0.18em] text-blue-mid uppercase">
            Search news
          </label>
          <div className="flex border border-hairline bg-white focus-within:border-blue/60 focus-within:ring-2 focus-within:ring-blue/10">
            <span className="flex items-center border-r border-hairline px-3 font-mono text-[12px] text-blue" aria-hidden="true">
              /
            </span>
            <input
              id="news-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search phishing, wallet safety, publishers…"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[13.5px] text-blue-ink outline-none placeholder:text-blue-mid/60"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="border-l border-hairline px-4 font-mono text-[10.5px] tracking-wide text-blue-mid uppercase transition-colors hover:bg-blue-faint hover:text-blue"
              >
                Clear
              </button>
            )}
          </div>
          {normalizedQuery && (
            <p className="mt-2 font-mono text-[10.5px] text-blue-mid">
              {visible.length} {visible.length === 1 ? "result" : "results"} for “{query.trim()}”
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: EASE }}
          className="mb-6 flex flex-wrap gap-2"
        >
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`border px-3 py-1.5 font-mono text-[11px] tracking-wide uppercase transition-colors ${
                filter === f.value
                  ? "border-blue bg-blue text-white"
                  : "border-hairline bg-white text-blue-mid hover:border-blue/40 hover:text-blue"
              }`}
            >
              {f.label}
            </button>
          ))}
        </motion.div>

        <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((a) => (
              <motion.a
                key={a.title}
                layout
                href={a.url}
                target={a.url.startsWith("http") ? "_blank" : undefined}
                rel={a.url.startsWith("http") ? "noreferrer" : undefined}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="group flex flex-col border border-hairline bg-white p-5 transition-colors hover:bg-blue-faint"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="font-mono text-[10.5px] tracking-[0.15em] text-blue-mid uppercase">
                    {a.publisher}
                  </span>
                  <span className="border border-hairline px-2 py-0.5 font-mono text-[10px] text-blue">
                    {CATEGORY_LABELS[a.category]}
                  </span>
                </div>
                <h3 className="font-serif text-[19px] leading-snug tracking-tight text-blue-ink transition-colors group-hover:text-blue">
                  {a.title}
                </h3>
                <p className="mt-3 flex-1 text-[13px] leading-relaxed text-blue-ink/65">
                  {a.summary}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-hairline pt-3 font-mono text-[10.5px] text-blue-mid">
                  <span>
                    {a.date}
                  </span>
                  <span className="text-blue transition-transform group-hover:translate-x-0.5">
                    Read ↗
                  </span>
                </div>
              </motion.a>
            ))}
          </AnimatePresence>
        </motion.div>
        {visible.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-dashed border-blue/30 bg-blue-faint px-5 py-10 text-center"
          >
            <p className="font-serif text-xl text-blue-ink">No matching news found.</p>
            <p className="mt-2 text-[13px] text-blue-mid">
              Try a broader search or choose a different category.
            </p>
          </motion.div>
        )}
      </section>

      {/* wallet safety checklist band */}
      <section className="bg-blue-ink">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: EASE }}
            className="mb-8"
          >
            <p className="mb-3 font-mono text-[11px] tracking-[0.25em] text-blue-soft uppercase">
              Before every send
            </p>
            <h2 className="font-serif text-3xl tracking-tight text-white sm:text-4xl">
              The wallet safety <span className="italic text-blue-soft">checklist</span>.
            </h2>
          </motion.div>

          <div className="grid divide-y divide-white/10 border border-white/15 bg-white/[0.03] sm:grid-cols-2 sm:divide-y-0">
            {CHECKLIST.map((tip, i) => (
              <motion.div
                key={tip}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.08, duration: 0.6, ease: EASE }}
                className="flex items-start gap-4 border-white/10 p-5 sm:[&:nth-child(-n+2)]:border-b sm:[&:nth-child(odd)]:border-r"
              >
                <span className="font-mono text-[11px] text-blue-soft">0{i + 1}</span>
                <p className="text-[13.5px] leading-relaxed text-white/80">{tip}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.7, ease: EASE }}
            className="mt-10 text-center"
          >
            <a
              href="#check"
              className="inline-block border border-white bg-white px-7 py-3.5 text-[14.5px] font-semibold text-blue-ink shadow-[3px_3px_0_0_rgba(255,255,255,0.3)] transition-all hover:bg-blue-wash hover:shadow-[1px_1px_0_0_rgba(255,255,255,0.3)] active:translate-y-px"
            >
              Check an address now
            </a>
          </motion.div>
        </div>
      </section>

      {/* disclaimer */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="border border-dashed border-blue/30 bg-blue-faint px-4 py-3 text-center font-mono text-[11.5px] leading-relaxed text-blue-mid">
          Articles link to external publications. SafeSend AI curates them for awareness and does
          not endorse or verify third-party content.
        </p>
      </section>
    </div>
  );
}
