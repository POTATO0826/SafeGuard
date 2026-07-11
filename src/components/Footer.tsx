import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="border-t border-hairline bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-4 py-10 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2.5">
          <Logo size={22} />
          <span className="text-[13.5px] font-semibold text-blue-ink">
            SafeSend <span className="font-serif italic text-blue">AI</span>
          </span>
          <span className="ml-2 hidden font-mono text-[11px] text-blue-mid sm:inline">
            — built for Web3 security
          </span>
        </div>

        <nav className="flex items-center gap-6 font-mono text-[11.5px] text-blue-mid">
          <a href="#" className="transition-colors hover:text-blue">Privacy</a>
          <a href="#" className="transition-colors hover:text-blue">Disclaimer</a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="transition-colors hover:text-blue">
            GitHub ↗
          </a>
        </nav>

        <span className="flex items-center gap-2 border border-blue/25 bg-blue-faint px-3 py-1.5 font-mono text-[10.5px] text-blue">
          <span className="h-1.5 w-1.5 animate-pulse bg-blue" />
          Sepolia Testnet
        </span>
      </div>
    </footer>
  );
}
