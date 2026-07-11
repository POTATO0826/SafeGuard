import { motion } from "framer-motion";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { CONNECTED_WALLET, shortAddress } from "@/lib/analysis";

interface Props {
  connected: boolean;
  onConnect: () => void;
}

const LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Security Sources", href: "#sources" },
  { label: "About", href: "#threats" },
];

export default function Navbar({ connected, onConnect }: Props) {
  return (
    <motion.header
      initial={{ y: -56, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 border-b border-hairline bg-paper/90 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-[15.5px] font-semibold tracking-tight text-blue-ink">
            SafeSend <span className="font-serif italic text-blue">AI</span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-[13px] font-medium text-blue-ink/70 transition-colors hover:text-blue"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 border border-blue/25 bg-blue-faint px-3 py-1.5 font-mono text-[11px] text-blue sm:flex">
            <motion.span
              animate={{ opacity: [1, 0.25, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-1.5 w-1.5 bg-blue"
            />
            Sepolia Testnet
          </span>
          {connected ? (
            <span className="border border-blue bg-blue-wash px-3.5 py-2 font-mono text-[12px] font-medium text-blue">
              {shortAddress(CONNECTED_WALLET)}
            </span>
          ) : (
            <Button size="sm" onClick={onConnect} className="h-9 px-4">
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
