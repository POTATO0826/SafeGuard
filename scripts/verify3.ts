import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--window-size=1440,960", "--hide-scrollbars"],
  defaultViewport: { width: 1440, height: 960 },
});
const page = await browser.newPage();
const errors: string[] = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(String(e)));

const clickByText = async (text: string) => {
  await page.evaluate((t) => {
    const els = [...document.querySelectorAll<HTMLElement>("button")];
    els.find((b) => b.textContent?.trim().includes(t))?.click();
  }, text);
};

await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await sleep(2200);
await clickByText("Connect Wallet to Start");
await sleep(500);
await clickByText("MetaMask");
await sleep(2800);
await clickByText("Analyse Recipient");
await sleep(5600);
await clickByText("Review Evidence");
await sleep(1500);
await page.evaluate(() => document.getElementById("check")?.scrollIntoView({ block: "end" }));
await sleep(1000);
await page.screenshot({ path: "x1-flow.png" });

await page.evaluate(() => {
  const els = [...document.querySelectorAll("h3")];
  els.find((h) => h.textContent?.includes("which coin"))?.scrollIntoView({ block: "center" });
});
await sleep(2200);
await page.screenshot({ path: "x2-spiral.png" });

console.log("console errors:", errors.length ? errors : "none");
await browser.close();
