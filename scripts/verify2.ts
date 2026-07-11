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
await sleep(2500);

// spiral section
await page.evaluate(() => {
  const els = [...document.querySelectorAll("p")];
  const el = els.find((p) => p.textContent?.includes("Asset coverage"));
  el?.scrollIntoView({ block: "start" });
});
await sleep(2500);
await page.screenshot({ path: "w1-spiral.png" });

// wave band
await page.evaluate(() => window.scrollTo(0, 900));
await sleep(1200);
await page.screenshot({ path: "w2-wave.png" });

// mobile viewport
const mobile = await browser.newPage();
mobile.on("pageerror", (e) => errors.push("mobile: " + String(e)));
await mobile.setViewport({ width: 390, height: 844 });
await mobile.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await sleep(2500);
await mobile.screenshot({ path: "w3-mobile-hero.png" });
await mobile.evaluate(() => window.scrollBy(0, 900));
await sleep(900);
await mobile.screenshot({ path: "w4-mobile-form.png" });
await mobile.evaluate(() => document.getElementById("threats")?.scrollIntoView());
await sleep(1800);
await mobile.screenshot({ path: "w5-mobile-threats.png" });

console.log("console errors:", errors.length ? errors : "none");
await browser.close();
