import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { CONNECTED_WALLET, shortAddress } from "@/lib/analysis";
import metamaskLogo from "@/assets/metamask.svg";
import walletconnectLogo from "@/assets/walletconnect.svg";

interface Props {
  open: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export default function ConnectModal({ open, onClose, onConnected }: Props) {
  const [stage, setStage] = useState<"pick" | "connecting" | "done">("pick");

  const connect = () => {
    setStage("connecting");
    setTimeout(() => {
      setStage("done");
      setTimeout(() => {
        onConnected();
        onClose();
        setStage("pick");
      }, 900);
    }, 1400);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-blue-ink/30 backdrop-blur-[3px] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm border border-blue/30 bg-white p-6 shadow-[6px_6px_0_0_var(--color-blue-soft)]"
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-[0.2em] text-blue uppercase">
                Connect wallet
              </span>
              <button
                onClick={onClose}
                className="font-mono text-[13px] text-blue-mid hover:text-blue cursor-pointer"
                aria-label="Close"
              >
                [x]
              </button>
            </div>

            {stage === "pick" && (
              <div className="space-y-2.5">
                <button
                  onClick={connect}
                  className="flex w-full cursor-pointer items-center justify-between border border-blue/25 bg-blue-faint px-4 py-3.5 transition-colors hover:border-blue hover:bg-blue-wash"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center border border-blue/30 bg-white p-1">
                      <img src={metamaskLogo} alt="MetaMask" className="h-full w-full" draggable={false} />
                    </span>
                    <span className="text-[14px] font-semibold text-blue-ink">MetaMask</span>
                  </span>
                  <span className="font-mono text-[11px] text-blue-mid">popular</span>
                </button>
                <button
                  disabled
                  className="flex w-full items-center justify-between border border-blue/15 px-4 py-3.5 opacity-45"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center border border-blue/30 bg-white p-1.5">
                      <img src={walletconnectLogo} alt="WalletConnect" className="h-full w-full" draggable={false} />
                    </span>
                    <span className="text-[14px] font-semibold text-blue-ink">WalletConnect</span>
                  </span>
                  <span className="font-mono text-[11px] text-blue-mid">soon</span>
                </button>
                <p className="pt-2 text-[12px] leading-relaxed text-blue-mid">
                  SafeSend never holds your keys. Connecting only reads your address and balance on
                  Sepolia Testnet.
                </p>
              </div>
            )}

            {stage === "connecting" && (
              <div className="flex flex-col items-center gap-4 py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-8 w-8 border-2 border-blue border-t-transparent"
                />
                <p className="font-mono text-[12px] text-blue-mid">
                  Waiting for MetaMask<span className="animate-blink">_</span>
                </p>
              </div>
            )}

            {stage === "done" && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-3 py-8"
              >
                <div className="flex h-10 w-10 items-center justify-center bg-blue text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="square" />
                  </svg>
                </div>
                <p className="font-mono text-[12px] text-blue">
                  {shortAddress(CONNECTED_WALLET)} connected
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
