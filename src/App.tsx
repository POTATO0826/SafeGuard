import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WaveBand from "@/components/WaveBand";
import HowItWorks from "@/components/HowItWorks";
import Sources from "@/components/Sources";
import Threats from "@/components/Threats";
import Insights from "@/components/Insights";
import Footer from "@/components/Footer";
import ConnectModal from "@/components/ConnectModal";

type Page = "home" | "insights";

function pageFromHash(): Page {
  return window.location.hash.startsWith("#/insights") ? "insights" : "home";
}

export default function App() {
  const [connected, setConnected] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [page, setPage] = useState<Page>(pageFromHash);

  useEffect(() => {
    const onHashChange = () => {
      const next = pageFromHash();
      setPage(next);
      if (next === "insights") {
        window.scrollTo({ top: 0 });
      } else {
        // Coming back from another page: the anchor target didn't exist yet,
        // so scroll to it once the home sections have rendered.
        const id = window.location.hash.slice(1);
        if (id && !id.startsWith("/")) {
          requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
        }
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <main className="relative min-h-screen">
      <Navbar connected={connected} onConnect={() => setConnectOpen(true)} currentPage={page} />
      {page === "insights" ? (
        <Insights />
      ) : (
        <>
          <Hero connected={connected} onNeedConnect={() => setConnectOpen(true)} />
          <div className="h-16" />
          <WaveBand />
          <HowItWorks />
          <Sources />
          <Threats />
        </>
      )}
      <Footer />
      <ConnectModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        onConnected={() => setConnected(true)}
      />
    </main>
  );
}
