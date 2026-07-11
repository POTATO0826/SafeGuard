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

await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await sleep(2200);

await page.evaluate(() => {
  const els = [...document.querySelectorAll("h3")];
  els.find((h) => h.textContent?.includes("which coin"))?.scrollIntoView({ block: "center" });
});
await sleep(2500);
await page.screenshot({ path: "y1-spiral-logos.png" });

await page.evaluate(() => document.getElementById("threats")?.scrollIntoView());
await sleep(3500);
await page.screenshot({ path: "y2-threats-stars.png" });

console.log("console errors:", errors.length ? errors : "none");
await browser.close();
