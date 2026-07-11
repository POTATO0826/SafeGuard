import TextPath from "@/components/originkit/TextPath";

/** OriginKit TextPath — extra description flowing along a wave between sections. */
export default function WaveBand() {
  return (
    <div className="border-y border-hairline bg-blue-faint">
      <TextPath
        text="CHECK THE WALLET BEFORE THE WALLET CHECKS OUT"
        separator="  ✳  "
        gap={2}
        speed={14}
        reversed={false}
        waveFrequency={2}
        waveHeight={56}
        textColor="#3347e0"
        textFont={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontStyle: "italic",
          fontSize: 30,
          letterSpacing: 1.5,
        }}
        height={130}
      />
    </div>
  );
}
