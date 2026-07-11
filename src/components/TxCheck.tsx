import { AnimatePresence, motion, animate, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  SCAN_STEPS,
  CONNECTED_WALLET,
  HIGH_RISK_ADDRESS,
  analyzeAddress,
  isValidAddress,
  shortAddress,
  speakWarning,
  stopWarning,
  type RiskReport,
} from "@/lib/analysis";

const EASE = [0.22, 1, 0.36, 1] as const;

type Phase = "form" | "scanning" | "result" | "success" | "cancelled";

/* ------------------------------- pixel meter ------------------------------ */

function PixelMeter({ score }: { score: number }) {
  const blocks = 25;
  const filled = Math.round((score / 100) * blocks);
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: blocks }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ delay: 0.4 + i * 0.035, duration: 0.2 }}
          className="h-4 w-2"
          style={{
            background:
              i < filled
                ? "var(--color-blue)"
                : "transparent",
            border: "1px solid var(--color-hairline)",
          }}
        />
      ))}
    </div>
  );
}

function ScoreCounter({ score }: { score: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));
  useEffect(() => {
    const controls = animate(mv, score, { duration: 1.6, ease: [0.22, 1, 0.36, 1] });
    return controls.stop;
  }, [score, mv]);
  return <motion.span>{rounded}</motion.span>;
}

/* ------------------------------ voice warning ----------------------------- */

function VoiceWarning({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false);
  const startedRef = useRef(false);

  const play = () => {
    setPlaying(true);
    const ok = speakWarning(text, () => setPlaying(false));
    if (!ok) setTimeout(() => setPlaying(false), 6000);
  };

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      const t = setTimeout(play, 1200);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => stopWarning(), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.5, ease: EASE }}
      className="flex items-center gap-4 border border-blue/30 bg-blue-faint px-4 py-3"
    >
      <button
        onClick={playing ? () => { stopWarning(); setPlaying(false); } : play}
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center bg-blue text-white transition-colors hover:bg-blue-deep"
        aria-label={playing ? "Stop voice warning" : "Play voice warning"}
      >
        {playing ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="1" y="1" width="4" height="10" />
            <rect x="7" y="1" width="4" height="10" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05A4.5 4.5 0 0 0 16.5 12Z" />
          </svg>
        )}
      </button>
      <div className="flex h-8 flex-1 items-center gap-[3px] overflow-hidden">
        {Array.from({ length: 32 }).map((_, i) => (
          <motion.span
            key={i}
            className="w-[3px] bg-blue"
            animate={
              playing
                ? { height: ["20%", `${25 + ((i * 53) % 65)}%`, "20%"] }
                : { height: "18%" }
            }
            transition={
              playing
                ? { duration: 0.5 + ((i * 13) % 5) * 0.09, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.3 }
            }
          />
        ))}
      </div>
      <span className="shrink-0 font-mono text-[10.5px] tracking-[0.14em] text-blue uppercase">
        {playing ? "Voice warning playing" : "Voice warning"}
      </span>
    </motion.div>
  );
}

/* ------------------------------- flow visual ------------------------------ */

function FlowVisual({ note, risky }: { note: string; risky: boolean }) {
  const outs = risky
    ? [
        { y: 20, sus: true },
        { y: 45, sus: true },
        { y: 70, sus: false },
        { y: 95, sus: true },
      ]
    : [{ y: 57, sus: false }];

  return (
    <div>
      <div className="border border-hairline bg-white p-4">
        <svg viewBox="0 0 320 115" className="w-full">
          {/* incoming edge */}
          <line x1="30" y1="57" x2="140" y2="57" stroke="var(--color-blue-soft)" strokeWidth="1.5" strokeDasharray="3 3" />
          {/* outgoing edges */}
          {outs.map((o, i) => (
            <line
              key={i}
              x1="160"
              y1="57"
              x2="285"
              y2={o.y}
              stroke={o.sus ? "var(--color-blue)" : "var(--color-blue-soft)"}
              strokeWidth={o.sus ? 2 : 1.5}
              strokeDasharray={o.sus ? "none" : "3 3"}
            />
          ))}
          {/* travelling funds */}
          <motion.circle
            r="3.5"
            fill="var(--color-blue)"
            initial={{ cx: 30, cy: 57, opacity: 0 }}
            animate={{ cx: [30, 140], cy: [57, 57], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "linear", times: [0, 0.15, 0.85, 1] }}
          />
          {outs.map((o, i) => (
            <motion.circle
              key={`p-${i}`}
              r="3"
              fill={o.sus ? "var(--color-blue)" : "var(--color-blue-soft)"}
              initial={{ cx: 160, cy: 57, opacity: 0 }}
              animate={{ cx: [160, 285], cy: [57, o.y], opacity: [0, 1, 1, 0] }}
              transition={{
                duration: risky ? 1.1 : 2.4,
                repeat: Infinity,
                delay: 0.5 + i * 0.18,
                ease: "linear",
                times: [0, 0.15, 0.85, 1],
              }}
            />
          ))}
          {/* source node */}
          <circle cx="22" cy="57" r="8" fill="white" stroke="var(--color-blue-mid)" strokeWidth="1.5" />
          <text x="22" y="80" textAnchor="middle" fontSize="7.5" fontFamily="JetBrains Mono, monospace" fill="var(--color-blue-mid)">
            sender
          </text>
          {/* recipient node */}
          <motion.circle
            cx="150"
            cy="57"
            fill={risky ? "var(--color-blue)" : "white"}
            stroke="var(--color-blue)"
            strokeWidth="2"
            initial={{ r: 12 }}
            animate={risky ? { r: [12, 14, 12] } : { r: 12 }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          {risky && (
            <motion.circle
              cx="150"
              cy="57"
              fill="none"
              stroke="var(--color-blue)"
              strokeWidth="1"
              initial={{ r: 12, opacity: 0.7 }}
              animate={{ r: [12, 26], opacity: [0.7, 0] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
          )}
          <text x="150" y="87" textAnchor="middle" fontSize="7.5" fontFamily="JetBrains Mono, monospace" fill="var(--color-blue)">
            recipient
          </text>
          {/* out nodes */}
          {outs.map((o, i) => (
            <g key={`n-${i}`}>
              <circle
                cx="293"
                cy={o.y}
                r="7"
                fill={o.sus ? "var(--color-blue)" : "white"}
                stroke={o.sus ? "var(--color-blue)" : "var(--color-blue-soft)"}
                strokeWidth="1.5"
              />
              {o.sus && (
                <text x="293" y={o.y + 2.6} textAnchor="middle" fontSize="8" fill="white" fontFamily="JetBrains Mono, monospace">
                  !
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
      <p className="mt-2.5 text-[12.5px] leading-relaxed text-blue-mid">
        {note}{" "}
        {risky && (
          <span className="text-blue">
            Solid nodes are flagged as suspicious; dotted ones look normal.
          </span>
        )}
      </p>
    </div>
  );
}

/* -------------------------------- evidence -------------------------------- */

function EvidenceSection({ report }: { report: RiskReport }) {
  return (
    <div>
      <div className="space-y-6">
        <div>
          <p className="mb-3 font-mono text-[10.5px] tracking-[0.2em] text-blue uppercase">
            Direct wallet evidence
          </p>
          <div className="divide-y divide-[var(--color-hairline)] border border-hairline">
            {report.evidence.map((e, i) => (
              <motion.details
                key={e.title}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.45, ease: EASE }}
                className="group bg-white"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-blue-faint [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <span
                      className={`h-2 w-2 shrink-0 ${
                        e.weight === "critical"
                          ? "bg-blue"
                          : e.weight === "notable"
                            ? "border border-blue bg-blue-soft"
                            : "border border-blue/40 bg-white"
                      }`}
                    />
                    <span className="text-[13.5px] font-medium text-blue-ink">{e.title}</span>
                  </span>
                  <span className="font-mono text-[11px] text-blue-mid transition-transform group-open:rotate-90">
                    →
                  </span>
                </summary>
                <div className="px-4 pb-4 pl-9">
                  <p className="text-[13px] leading-relaxed text-blue-ink/80">{e.detail}</p>
                  <p className="mt-2 font-mono text-[11px] text-blue-mid">
                    source: {e.source} · last checked 2 min ago
                  </p>
                </div>
              </motion.details>
            ))}
          </div>
        </div>

        <FlowVisual note={report.flowNote} risky={report.verdict === "high"} />

        {report.news.length > 0 && (
          <div>
            <p className="mb-1.5 font-mono text-[10.5px] tracking-[0.2em] text-blue uppercase">
              Related news and awareness
            </p>
            <p className="mb-3 border-l-2 border-blue/30 pl-3 text-[12px] italic text-blue-mid">
              Related awareness — this does not prove that the exact wallet is involved.
            </p>
            <div className="divide-y divide-[var(--color-hairline)] border border-hairline">
              {report.news.map((n, i) => (
                <motion.div
                  key={n.title}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.45, ease: EASE }}
                  className="bg-white px-4 py-3.5"
                >
                  <div className="mb-1 flex items-center justify-between font-mono text-[10.5px] text-blue-mid uppercase">
                    <span>{n.publisher}</span>
                    <span>{n.date}</span>
                  </div>
                  <p className="text-[13.5px] font-medium text-blue-ink">{n.title}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-blue-ink/70">{n.summary}</p>
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-block font-mono text-[11.5px] text-blue underline decoration-dotted underline-offset-4 hover:text-blue-deep"
                  >
                    Read Source ↗
                  </a>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Evidence in a pixel-card overlay so the page layout (and the globe) never shifts. */
function EvidenceModal({
  report,
  open,
  onClose,
}: {
  report: RiskReport;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-blue-ink/30 p-4 backdrop-blur-[3px]"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 28, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 14, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-xl flex-col border-2 border-blue bg-white shadow-[8px_8px_0_0_var(--color-blue-soft)]"
          >
            <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
              <span className="font-mono text-[11px] tracking-[0.2em] text-blue uppercase">
                Evidence · {report.verdict === "high" ? "high risk" : "no known risk"} ·{" "}
                {report.score}/100
              </span>
              <button
                onClick={onClose}
                className="cursor-pointer font-mono text-[13px] text-blue-mid hover:text-blue"
                aria-label="Close evidence"
              >
                [x]
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              <EvidenceSection report={report} />
            </div>
            <div className="border-t border-hairline px-5 py-3.5 text-right">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------ scan sequence ----------------------------- */

function ScanSequence({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= SCAN_STEPS.length) {
      const t = setTimeout(onDone, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 750);
    return () => clearTimeout(t);
  }, [step, onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative overflow-hidden px-6 py-10 sm:px-8"
    >
      {/* scanning line */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 h-16"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(51,71,224,0.10) 48%, rgba(51,71,224,0.35) 50%, rgba(51,71,224,0.10) 52%, transparent)",
        }}
        animate={{ top: ["-15%", "105%"] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
      />
      <p className="mb-6 font-mono text-[11px] tracking-[0.2em] text-blue uppercase">
        Analysing recipient<span className="animate-blink">_</span>
      </p>
      <ul className="space-y-3.5">
        {SCAN_STEPS.map((s, i) => {
          const state = i < step ? "done" : i === step ? "active" : "todo";
          return (
            <motion.li
              key={s}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: state === "todo" ? 0.35 : 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4, ease: EASE }}
              className="flex items-center gap-3 font-mono text-[13px] text-blue-ink"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-blue/40 bg-white">
                {state === "done" && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-blue)"
                    strokeWidth="3.5"
                  >
                    <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="square" />
                  </motion.svg>
                )}
                {state === "active" && (
                  <motion.span
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 0.7, repeat: Infinity }}
                    className="h-2 w-2 bg-blue"
                  />
                )}
              </span>
              {s}
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
}

/* --------------------------------- modals --------------------------------- */

function ConfirmContinueModal({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-blue-ink/30 p-4 backdrop-blur-[3px]"
          onClick={onCancel}
        >
          <motion.div
            initial={{ y: 20, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 10, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md border-2 border-blue bg-white p-6 shadow-[6px_6px_0_0_var(--color-blue-soft)]"
          >
            <p className="font-mono text-[11px] tracking-[0.2em] text-blue uppercase">
              Final confirmation
            </p>
            <h3 className="mt-2 font-serif text-2xl text-blue-ink">
              You are overriding a <span className="italic text-blue">high-risk</span> warning.
            </h3>
            <p className="mt-3 text-[13.5px] leading-relaxed text-blue-ink/75">
              SafeSend found scam reports linked to this wallet. If this transfer is a scam, it
              cannot be reversed. Type <span className="font-mono font-semibold text-blue">SEND</span> to
              confirm you accept the risk.
            </p>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type SEND"
              className="mt-4 w-full border border-blue/30 bg-blue-faint px-3 py-2.5 font-mono text-[14px] tracking-[0.2em] text-blue-ink uppercase outline-none placeholder:text-blue-soft focus:border-blue"
            />
            <div className="mt-5 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onCancel}>
                Go back
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                disabled={typed.trim().toUpperCase() !== "SEND"}
                onClick={onConfirm}
              >
                Continue to MetaMask
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------ terminal states ---------------------------- */

function TerminalState({
  kind,
  onReset,
}: {
  kind: "success" | "cancelled";
  onReset: () => void;
}) {
  const success = kind === "success";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex flex-col items-center gap-5 px-6 py-14 text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: success ? -20 : 20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 15, delay: 0.1 }}
        className={`flex h-16 w-16 items-center justify-center ${success ? "bg-blue text-white" : "border-2 border-blue bg-white text-blue"}`}
      >
        {success ? (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <motion.path
              d="m5 12.5 4.5 4.5L19 7.5"
              strokeLinecap="square"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.45, delay: 0.35 }}
            />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <motion.path
              d="M6 6l12 12M18 6L6 18"
              strokeLinecap="square"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.45, delay: 0.35 }}
            />
          </svg>
        )}
      </motion.div>
      <div>
        <h3 className="font-serif text-3xl text-blue-ink">
          {success ? "Transaction submitted" : "Transaction cancelled"}
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-blue-mid">
          {success
            ? "MetaMask has been opened with your reviewed transfer. SafeSend recorded nothing about your wallet."
            : "Nothing left your wallet. The flagged address was not paid — that is exactly what SafeSend is for."}
        </p>
      </div>
      <Button variant="outline" onClick={onReset}>
        Check Another Address
      </Button>
    </motion.div>
  );
}

/* ================================ main card ================================ */

export default function TxCheck({ connected, onNeedConnect }: { connected: boolean; onNeedConnect: () => void }) {
  const [phase, setPhase] = useState<Phase>("form");
  const [recipient, setRecipient] = useState(HIGH_RISK_ADDRESS);
  const [amount, setAmount] = useState("0.15");
  const [asset, setAsset] = useState("ETH");
  const [report, setReport] = useState<RiskReport | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const addressValid = isValidAddress(recipient);
  const amountValid = parseFloat(amount) > 0;

  const startScan = () => {
    if (!connected) {
      onNeedConnect();
      return;
    }
    if (!addressValid || !amountValid) return;
    setShowEvidence(false);
    setPhase("scanning");
  };

  const finishScan = useMemo(
    () => () => {
      setReport(analyzeAddress(recipient));
      setPhase("result");
    },
    [recipient],
  );

  const reset = () => {
    stopWarning();
    setPhase("form");
    setReport(null);
    setShowEvidence(false);
  };

  const cancelTx = () => {
    stopWarning();
    setPhase("cancelled");
  };

  const continueTx = () => {
    stopWarning();
    setConfirmOpen(false);
    setPhase("success");
  };

  return (
    <div id="check" className="relative border border-blue/25 bg-white shadow-[8px_8px_0_0_var(--color-blue-wash)]">
      {/* header strip */}
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
        <span className="font-mono text-[11px] tracking-[0.18em] text-blue uppercase">
          Pre-transaction check
        </span>
        <span className="flex items-center gap-2 font-mono text-[11px] text-blue-mid">
          <motion.span
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-1.5 w-1.5 bg-blue"
          />
          Sepolia
        </span>
      </div>

      <AnimatePresence mode="wait">
        {phase === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="p-5 sm:p-6"
          >
            {/* connected wallet */}
            <div className="mb-5 flex items-center justify-between border border-hairline bg-blue-faint px-4 py-3">
              <div>
                <p className="font-mono text-[10px] tracking-[0.18em] text-blue-mid uppercase">
                  Connected wallet
                </p>
                <p className="mt-0.5 font-mono text-[13.5px] font-medium text-blue-ink">
                  {connected ? shortAddress(CONNECTED_WALLET) : "Not connected"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] tracking-[0.18em] text-blue-mid uppercase">
                  Balance
                </p>
                <p className="mt-0.5 font-mono text-[13.5px] font-medium text-blue-ink">
                  {connected ? "2.4821 ETH" : "—"}
                </p>
              </div>
            </div>

            {/* recipient */}
            <label className="block">
              <span className="font-mono text-[10.5px] tracking-[0.18em] text-blue-mid uppercase">
                Recipient wallet address
              </span>
              <div className="relative mt-1.5">
                <input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  spellCheck={false}
                  placeholder="0x…"
                  className={`w-full border bg-white px-3.5 py-3 pr-20 font-mono text-[13px] text-blue-ink outline-none transition-colors placeholder:text-blue-soft ${
                    recipient && !addressValid
                      ? "border-blue border-dashed"
                      : "border-blue/30 focus:border-blue"
                  }`}
                />
                <span className="absolute top-1/2 right-3 -translate-y-1/2 font-mono text-[10.5px] text-blue-mid">
                  {recipient ? (addressValid ? "valid ✓" : "invalid") : ""}
                </span>
              </div>
              {recipient && !addressValid && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1.5 font-mono text-[11px] text-blue"
                >
                  An address is 0x + 40 hex characters. Check for look-alike characters.
                </motion.p>
              )}
            </label>

            {/* asset + amount */}
            <div className="mt-4 grid grid-cols-[110px_1fr] gap-3">
              <label className="block">
                <span className="font-mono text-[10.5px] tracking-[0.18em] text-blue-mid uppercase">
                  Asset
                </span>
                <select
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  className="mt-1.5 w-full cursor-pointer border border-blue/30 bg-white px-3 py-3 font-mono text-[13px] text-blue-ink outline-none focus:border-blue"
                >
                  <option>ETH</option>
                  <option>USDC</option>
                  <option>DAI</option>
                </select>
              </label>
              <label className="block">
                <span className="font-mono text-[10.5px] tracking-[0.18em] text-blue-mid uppercase">
                  Amount
                </span>
                <div className="relative mt-1.5">
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    className="w-full border border-blue/30 bg-white px-3.5 py-3 pr-16 font-mono text-[13px] text-blue-ink outline-none focus:border-blue"
                  />
                  <button
                    onClick={() => setAmount("2.4821")}
                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer font-mono text-[10.5px] text-blue underline decoration-dotted underline-offset-2"
                  >
                    max
                  </button>
                </div>
              </label>
            </div>

            <Button
              size="lg"
              className="mt-6 w-full"
              onClick={startScan}
              disabled={connected && (!addressValid || !amountValid)}
            >
              {connected ? "Analyse Recipient" : "Connect Wallet to Start"}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </Button>

            <p className="mt-3.5 text-center font-mono text-[11px] leading-relaxed text-blue-mid">
              SafeSend will check the destination before opening the wallet confirmation.
            </p>
          </motion.div>
        )}

        {phase === "scanning" && <ScanSequence key="scan" onDone={finishScan} />}

        {phase === "result" && report && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="p-5 sm:p-6"
          >
            {/* verdict header */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-mono text-[10.5px] tracking-[0.2em] text-blue-mid uppercase"
                >
                  {shortAddress(recipient)} · {amount} {asset}
                </motion.p>
                <h3 className="mt-1 font-serif text-4xl tracking-tight text-blue-ink sm:text-5xl">
                  {report.verdict === "high" ? (
                    <>
                      <span className="italic text-blue">High</span> Risk
                    </>
                  ) : (
                    <>
                      No Known Risk <span className="italic text-blue">Detected</span>
                    </>
                  )}
                </h3>
              </div>
              <div className="text-right">
                <p className="font-serif text-5xl text-blue tabular-nums">
                  <ScoreCounter score={report.score} />
                  <span className="text-xl text-blue-mid"> / 100</span>
                </p>
              </div>
            </div>

            <div className="mt-4">
              <PixelMeter score={report.score} />
            </div>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-4 border-l-2 border-blue pl-3.5 text-[14px] leading-relaxed text-blue-ink/85"
            >
              {report.summary}
            </motion.p>

            {report.verdict === "high" && (
              <>
                <div className="mt-5">
                  <VoiceWarning text={report.voiceLine} />
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                  className="mt-2.5 font-mono text-[11px] leading-relaxed text-blue-mid italic"
                >
                  “{report.voiceLine}”
                </motion.p>
              </>
            )}

            {/* evidence quick list */}
            <ul className="mt-5 space-y-1.5">
              {report.evidence.slice(0, 4).map((e, i) => (
                <motion.li
                  key={e.title}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.12, duration: 0.4, ease: EASE }}
                  className="flex items-center gap-2.5 font-mono text-[12px] text-blue-ink/80"
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 ${e.weight === "critical" ? "bg-blue" : "border border-blue bg-white"}`}
                  />
                  {e.title}
                </motion.li>
              ))}
            </ul>

            {/* actions */}
            <div className="mt-6 space-y-2.5">
              {report.verdict === "high" ? (
                <>
                  <Button size="lg" className="w-full" onClick={cancelTx}>
                    Cancel Transaction
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => setShowEvidence(true)}
                  >
                    Review Evidence
                  </Button>
                  <div className="pt-1 text-center">
                    <button
                      onClick={() => setConfirmOpen(true)}
                      className="cursor-pointer font-mono text-[11.5px] text-blue-mid underline decoration-dotted underline-offset-4 transition-colors hover:text-blue"
                    >
                      Continue anyway
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Button size="lg" className="w-full" onClick={continueTx}>
                    Continue to MetaMask →
                  </Button>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button variant="outline" onClick={() => setShowEvidence(true)}>
                      View Details
                    </Button>
                    <Button variant="outline" onClick={reset}>
                      Check Another Address
                    </Button>
                  </div>
                </>
              )}
            </div>

          </motion.div>
        )}

        {phase === "success" && <TerminalState key="success" kind="success" onReset={reset} />}
        {phase === "cancelled" && <TerminalState key="cancelled" kind="cancelled" onReset={reset} />}
      </AnimatePresence>

      <ConfirmContinueModal
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={continueTx}
      />

      {report && (
        <EvidenceModal
          report={report}
          open={showEvidence}
          onClose={() => setShowEvidence(false)}
        />
      )}
    </div>
  );
}
