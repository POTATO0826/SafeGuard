import puppeteer from "puppeteer-core";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--hide-scrollbars"],
    defaultViewport: { width: 1440, height: 960 },
  });
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("http://localhost:5173", { waitUntil: "networkidle2" });
  await sleep(2000);

  // connect wallet
  const clickByText = async (text: string) => {
    const found = await page.evaluate((t) => {
      const els = Array.from(document.querySelectorAll("button, a"));
      const el = els.find((e) => e.textContent?.trim().toLowerCase().includes(t.toLowerCase()));
      if (el) {
        (el as HTMLElement).click();
        return true;
      }
      return false;
    }, text);
    if (!found) throw new Error(`button not found: ${text}`);
  };

  await clickByText("Connect Wallet");
  await sleep(600);
  await clickByText("MetaMask");
  await sleep(2500);

  // fill high-risk address and analyse
  await page.evaluate(() => {
    const input = document.querySelector<HTMLInputElement>('input[placeholder^="0x"]');
    if (!input) throw new Error("no recipient input");
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input, "0x8F23aB4c99D01e5F6a7B8c9D0e1F2A3b4C5dE91B");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await sleep(300);
  await clickByText("Analyse Recipient");
  await sleep(9000); // scan sequence

  // hero after result — globe should stay near the top-left text
  await page.screenshot({ path: "scripts/shots/em-1-result.png" });

  await clickByText("Review Evidence");
  await sleep(1500);
  await page.screenshot({ path: "scripts/shots/em-2-modal.png" });

  // scroll inside modal
  await page.evaluate(() => {
    const scroller = document.querySelector(".overflow-y-auto");
    scroller?.scrollTo({ top: 9999 });
  });
  await sleep(800);
  await page.screenshot({ path: "scripts/shots/em-3-modal-scrolled.png" });

  // close via [x]
  await clickByText("[x]");
  await sleep(900);
  await page.screenshot({ path: "scripts/shots/em-4-closed.png" });

  // mobile
  await page.setViewport({ width: 390, height: 844 });
  await sleep(800);
  await clickByText("Review Evidence");
  await sleep(1500);
  await page.screenshot({ path: "scripts/shots/em-5-mobile-modal.png" });

  console.log("errors:", errors.length ? errors : "none");
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
