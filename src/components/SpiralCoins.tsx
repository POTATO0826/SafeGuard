import { motion } from "framer-motion";
import Logo from "@/components/Logo";
import btc from "cryptocurrency-icons/svg/color/btc.svg";
import eth from "cryptocurrency-icons/svg/color/eth.svg";
import usdt from "cryptocurrency-icons/svg/color/usdt.svg";
import sol from "cryptocurrency-icons/svg/color/sol.svg";
import usdc from "cryptocurrency-icons/svg/color/usdc.svg";
import ltc from "cryptocurrency-icons/svg/color/ltc.svg";
import doge from "cryptocurrency-icons/svg/color/doge.svg";
import xrp from "cryptocurrency-icons/svg/color/xrp.svg";
import bnb from "cryptocurrency-icons/svg/color/bnb.svg";
import ada from "cryptocurrency-icons/svg/color/ada.svg";
import dot from "cryptocurrency-icons/svg/color/dot.svg";
import link from "cryptocurrency-icons/svg/color/link.svg";

interface Coin {
  src: string;
  name: string;
}

// crypto logos on concentric orbits, each ring spinning at its own pace
const RINGS: { radius: number; duration: number; reverse?: boolean; size: number; coins: Coin[] }[] = [
  {
    radius: 20,
    duration: 55,
    size: 44,
    coins: [
      { src: btc, name: "Bitcoin" },
      { src: eth, name: "Ethereum" },
      { src: usdt, name: "Tether" },
    ],
  },
  {
    radius: 33,
    duration: 80,
    reverse: true,
    size: 40,
    coins: [
      { src: sol, name: "Solana" },
      { src: usdc, name: "USD Coin" },
      { src: xrp, name: "XRP" },
      { src: bnb, name: "BNB" },
    ],
  },
  {
    radius: 46,
    duration: 110,
    size: 36,
    coins: [
      { src: ada, name: "Cardano" },
      { src: doge, name: "Dogecoin" },
      { src: dot, name: "Polkadot" },
      { src: link, name: "Chainlink" },
      { src: ltc, name: "Litecoin" },
    ],
  },
];

export default function SpiralCoins() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]">
      {/* orbit guides */}
      {RINGS.map((ring) => (
        <div
          key={`guide-${ring.radius}`}
          className="absolute rounded-full border border-dashed border-blue/15"
          style={{
            left: `${50 - ring.radius}%`,
            top: `${50 - ring.radius}%`,
            width: `${ring.radius * 2}%`,
            height: `${ring.radius * 2}%`,
          }}
        />
      ))}

      {/* center mark */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
        className="absolute top-1/2 left-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-hairline bg-white shadow-[3px_3px_0_0_var(--color-blue-wash)]"
      >
        <Logo size={30} />
      </motion.div>

      {/* rings */}
      {RINGS.map((ring, ri) => (
        <motion.div
          key={`ring-${ring.radius}`}
          className="absolute inset-0"
          animate={{ rotate: ring.reverse ? -360 : 360 }}
          transition={{ duration: ring.duration, repeat: Infinity, ease: "linear" }}
        >
          {ring.coins.map((c, i) => {
            const angle = (i / ring.coins.length) * Math.PI * 2 - Math.PI / 2;
            const x = 50 + Math.cos(angle) * ring.radius;
            const y = 50 + Math.sin(angle) * ring.radius;
            return (
              <div
                key={c.name}
                className="absolute"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: ring.size,
                  height: ring.size,
                  marginLeft: -ring.size / 2,
                  marginTop: -ring.size / 2,
                }}
              >
                {/* counter-rotate so logos stay upright */}
                <motion.div
                  className="h-full w-full"
                  animate={{ rotate: ring.reverse ? 360 : -360 }}
                  transition={{ duration: ring.duration, repeat: Infinity, ease: "linear" }}
                >
                  <motion.div
                    className="flex h-full w-full items-center justify-center rounded-full border border-hairline bg-white p-[12%] shadow-[2px_2px_0_0_var(--color-blue-wash)]"
                    title={c.name}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{
                      delay: 0.15 + ri * 0.2 + i * 0.08,
                      type: "spring",
                      stiffness: 220,
                      damping: 15,
                    }}
                    whileHover={{ scale: 1.2 }}
                  >
                    <img src={c.src} alt={c.name} className="h-full w-full" draggable={false} />
                  </motion.div>
                </motion.div>
              </div>
            );
          })}
        </motion.div>
      ))}
    </div>
  );
}
