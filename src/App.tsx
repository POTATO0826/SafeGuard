import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WaveBand from "@/components/WaveBand";
import HowItWorks from "@/components/HowItWorks";
import Sources from "@/components/Sources";
import Threats from "@/components/Threats";
import Footer from "@/components/Footer";
import ConnectModal from "@/components/ConnectModal";

export default function App() {
  const [connected, setConnected] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  return (
    <main className="relative min-h-screen">
      <Navbar connected={connected} onConnect={() => setConnectOpen(true)} />
      <Hero connected={connected} onNeedConnect={() => setConnectOpen(true)} />
      <div className="h-16" />
      <WaveBand />
      <HowItWorks />
      <Sources />
      <Threats />
      <Footer />
      <ConnectModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        onConnected={() => setConnected(true)}
      />
    </main>
  );
}
