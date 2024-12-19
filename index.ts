import * as cheerio from "cheerio";
import { Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { userAgents } from "./utils/user-agents";

puppeteer.use(StealthPlugin());

const LINKEDIN_URL =
  "https://www.linkedin.com/search/results/content/?keywords=artificial+intelligence";
const USERNAME = process.env.LINKEDIN_USERNAME as string;
const PASSWORD = process.env.LINKEDIN_PASSWORD as string;

async function autoScroll(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

(async () => {
  const randomUserAgent =
    userAgents[Math.floor(Math.random() * userAgents.length)];

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setUserAgent(randomUserAgent);

  try {
    await page.goto(LINKEDIN_URL, { waitUntil: "networkidle2" });

    // Login
    await page.waitForSelector("#username");
    await page.type("#username", USERNAME, { delay: 300 });

    await page.waitForSelector("#password");
    await page.type("#password", PASSWORD, { delay: 300 });

    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: "networkidle2" });

    await autoScroll(page);

    const content = await page.content();
    const $ = cheerio.load(content);

    const impressions = $(".fie-impression-container");
    const impressionsArr: { impression: number; data: string }[] = [];

    impressions.each((index, element) => {
      const $title = $(element).find(
        ".update-components-actor__title > .update-components-actor__single-line-truncate"
      );
      const $selected = $title.find("[aria-hidden=true]").text().trim();

      impressionsArr.push({
        impression: index + 1,
        data: $selected,
      });
    });

    console.log(impressionsArr);
  } catch (error) {
    console.error("ERROR: ", error.message);
  } finally {
    await browser.close();
  }
})();
