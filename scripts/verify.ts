import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const URL = "http://localhost:5173/";
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

const clickByText = async (selector: string, text: string) => {
  const ok = await page.evaluate(
    (sel, t) => {
      const els = [...document.querySelectorAll<HTMLElement>(sel)];
      const el = els.find((b) => b.textContent?.trim().includes(t));
      if (el) el.click();
      return Boolean(el);
    },
    selector,
    text,
  );
  if (!ok) throw new Error(`element not found: ${selector} "${text}"`);
};

await page.goto(URL, { waitUntil: "networkidle0" });
await sleep(3200);
await page.screenshot({ path: "v1-hero.png" });

// connect wallet
await clickByText("button", "Connect Wallet to Start");
await sleep(700);
await page.screenshot({ path: "v2-connect-modal.png" });
await clickByText("button", "MetaMask");
await sleep(2800);

// analyse high-risk recipient
await clickByText("button", "Analyse Recipient");
await sleep(1800);
await page.screenshot({ path: "v3-scanning.png" });
await sleep(3800);
await page.screenshot({ path: "v4-high-risk.png" });

// review evidence
await clickByText("button", "Review Evidence");
await sleep(1300);
await page.evaluate(() => {
  document.querySelector("details")?.setAttribute("open", "");
});
await sleep(500);
await page.screenshot({ path: "v5-evidence.png", fullPage: false });
await page.evaluate(() => {
  document.getElementById("check")?.scrollIntoView({ block: "end" });
});
await sleep(800);
await page.screenshot({ path: "v6-evidence-flow.png" });

// continue anyway → confirmation modal
await clickByText("button", "Continue anyway");
await sleep(700);
await page.screenshot({ path: "v7-confirm-modal.png" });
await page.type("input[placeholder='Type SEND']", "SEND");
await sleep(300);
await clickByText("button", "Continue to MetaMask");
await sleep(1200);
await page.evaluate(() => document.getElementById("check")?.scrollIntoView({ block: "center" }));
await sleep(400);
await page.screenshot({ path: "v8-success.png" });

// low-risk pass
await clickByText("button", "Check Another Address");
await sleep(600);
await page.evaluate(() => {
  const input = document.querySelector<HTMLInputElement>("input[placeholder='0x…']");
  if (!input) throw new Error("no recipient input");
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  setter.call(input, "0x71C4f2A9d38B6E015bC77Fa3e21D84906cA07777");
  input.dispatchEvent(new Event("input", { bubbles: true }));
});
await sleep(400);
await clickByText("button", "Analyse Recipient");
await sleep(5600);
await page.evaluate(() => document.getElementById("check")?.scrollIntoView({ block: "center" }));
await sleep(400);
await page.screenshot({ path: "v9-low-risk.png" });

// sections
await page.evaluate(() => document.getElementById("how-it-works")?.scrollIntoView());
await sleep(1600);
await page.screenshot({ path: "v10-how.png" });
await page.evaluate(() => window.scrollBy(0, 800));
await sleep(1200);
await page.screenshot({ path: "v11-spiral.png" });
await page.evaluate(() => document.getElementById("threats")?.scrollIntoView());
await sleep(2200);
await page.screenshot({ path: "v12-threats.png" });

console.log("console errors:", errors.length ? errors : "none");
await browser.close();
