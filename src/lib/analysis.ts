export type Verdict = "high" | "low";

export interface EvidenceItem {
  title: string;
  detail: string;
  source: string;
  weight: "critical" | "notable" | "info";
}

export interface NewsItem {
  publisher: string;
  title: string;
  date: string;
  summary: string;
  url: string;
}

export interface RiskReport {
  verdict: Verdict;
  score: number;
  headline: string;
  summary: string;
  evidence: EvidenceItem[];
  news: NewsItem[];
  voiceLine: string;
  flowNote: string;
}

export const SCAN_STEPS = [
  "Checking known malicious-address databases",
  "Searching community scam reports",
  "Reviewing recent wallet activity",
  "Finding related security news",
  "Preparing risk explanation",
];

export const CONNECTED_WALLET = "0x71C4f2A9d38B6E015bC77Fa3e21D84906cA09A32";
export const HIGH_RISK_ADDRESS = "0x8F23bD41c6A97F30e5D218a4B77c30F19a2AE91B";

export function shortAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
}

const HIGH_RISK_REPORT: RiskReport = {
  verdict: "high",
  score: 82,
  headline: "High Risk",
  summary:
    "This wallet may be associated with reported scam activity. Review the evidence before continuing.",
  voiceLine:
    "Warning. This destination wallet may be associated with scam activity. Please review the available evidence before continuing.",
  flowNote: "Most received funds were transferred to other wallets within a short period.",
  evidence: [
    {
      title: "4 community scam reports found",
      detail:
        "Four independent reports on ChainAbuse describe this address in fake-support and giveaway scams during the last 60 days.",
      source: "ChainAbuse community registry",
      weight: "critical",
    },
    {
      title: "Wallet flagged by a security database",
      detail:
        "The address appears on a maintained malicious-address list used by wallet providers for pre-transaction screening.",
      source: "ScamSniffer address blocklist",
      weight: "critical",
    },
    {
      title: "Recently received and moved funds rapidly",
      detail:
        "In the last 14 days, 91% of incoming value left the wallet within 20 minutes of arrival, fanned out across 7 fresh addresses.",
      source: "On-chain activity — Sepolia + mainnet heuristics",
      weight: "notable",
    },
    {
      title: "2 related phishing reports discovered",
      detail:
        "Two phishing pages submitted to PhishTank list this address as the payout destination in their drainer configuration.",
      source: "PhishTank submissions",
      weight: "notable",
    },
  ],
  news: [
    {
      publisher: "CertiK Hack3D",
      title: "Web3 lost $1.31B in H1 2026 as wallet attacks intensify",
      date: "Jul 2026",
      summary:
        "Wallet compromise became the costliest attack vector of the half at $444M across 33 incidents.",
      url: "https://www.certik.com/skynet-report/certik-hack3d-h1-2026-report",
    },
    {
      publisher: "Blockaid",
      title: "Address poisoning: the growing threat draining millions",
      date: "Jun 2026",
      summary:
        "Over 65.4 million poisoning transactions flagged since January 2025 — about 1 in 200 attempts succeeds.",
      url: "https://www.blockaid.io/blog/address-poisoning-the-growing-threat-draining-millions-from-crypto-users",
    },
    {
      publisher: "MetaMask Security",
      title: "Fake support scams continue to prey on theft victims",
      date: "Jun 2026",
      summary:
        "Fraudulent 'recovery services' target users who already lost funds, extracting a second payment.",
      url: "https://metamask.io/news/crypto-security-report-june-2026",
    },
  ],
};

const LOW_RISK_REPORT: RiskReport = {
  verdict: "low",
  score: 8,
  headline: "No Known Risk Detected",
  summary:
    "No scam reports or known malicious flags were found. This does not guarantee that the wallet is safe. Always verify the recipient address.",
  voiceLine: "",
  flowNote: "Activity looks consistent with a personal wallet: funds are held, not fanned out.",
  evidence: [
    {
      title: "No entries in malicious-address databases",
      detail: "The address is absent from the blocklists SafeSend queries.",
      source: "ScamSniffer + ChainAbuse",
      weight: "info",
    },
    {
      title: "No community scam reports",
      detail: "Zero matching reports across community registries in the last 12 months.",
      source: "ChainAbuse community registry",
      weight: "info",
    },
    {
      title: "Normal holding pattern",
      detail: "Funds typically remain in the wallet for weeks; no rapid fan-out detected.",
      source: "On-chain activity heuristics",
      weight: "info",
    },
  ],
  news: [],
};

export function analyzeAddress(addr: string): RiskReport {
  const normalized = addr.trim().toLowerCase();
  // The demo flags the sample recipient (and a recognizable poison pattern) as risky.
  if (
    normalized === HIGH_RISK_ADDRESS.toLowerCase() ||
    normalized.endsWith("e91b") ||
    normalized.includes("dead") ||
    normalized.includes("bad")
  ) {
    return HIGH_RISK_REPORT;
  }
  return LOW_RISK_REPORT;
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speakWarning(text: string, onEnd?: () => void): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  u.pitch = 0.9;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((v) => v.lang.startsWith("en") && v.name.includes("Google"));
  if (preferred) u.voice = preferred;
  if (onEnd) u.onend = onEnd;
  currentUtterance = u;
  window.speechSynthesis.speak(u);
  return true;
}

export function stopWarning(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}
