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

// Specify the number of impressions you want to scrape
const TARGET_IMPRESSIONS = 20;

// Function to implement random delays to mimic human-like behavior
function randomDelay() {
  return new Promise((resolve) => {
    const delayTime = Math.random() * 5000 + 1000; // Random delay between 1 to 6 seconds
    setTimeout(resolve, delayTime);
  });
}

// Function to extract data while scrolling until the target number of impressions is reached
async function extractDataWhileScrolling(
  page: Page,
  targetImpressions: number
) {
  let impressionsArr: { impression: number; author: string }[] = [];
  let totalImpressions = 0;
  let previousHeight: number;

  while (totalImpressions < targetImpressions) {
    const content = await page.content();
    const $ = cheerio.load(content);

    const impressions = $(".fie-impression-container");

    impressions.each((index, element) => {
      const $title = $(element).find(
        ".update-components-actor__title > .update-components-actor__single-line-truncate"
      );
      const $selected = $title.find("[aria-hidden=true]").text().trim();

      impressionsArr.push({
        impression: totalImpressions + 1,
        author: $selected,
      });

      console.log({
        impression: totalImpressions + 1,
        author: $selected,
      });

      totalImpressions += 1;

      // Stop extraction if the target number of impressions is reached
      if (totalImpressions >= targetImpressions) {
        return false;
      }
    });

    // Wait for the page to load more content
    previousHeight = Number(await page.evaluate("document.body.scrollHeight"));
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await page.waitForFunction(
      `document.body.scrollHeight > ${previousHeight}`
    );

    // Random delay to simulate human-like scrolling pauses
    await randomDelay();
  }

  return impressionsArr;
}

(async () => {
  const randomUserAgent =
    userAgents[Math.floor(Math.random() * userAgents.length)];

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setUserAgent(randomUserAgent);
  // await page.setViewport({ width: 1366, height: 768 });

  try {
    // Visit the LinkedIn search page
    await page.goto(LINKEDIN_URL, { waitUntil: "networkidle2" });

    // Login
    await page.waitForSelector("#username");
    await page.type("#username", USERNAME, { delay: 300 });

    await page.waitForSelector("#password");
    await page.type("#password", PASSWORD, { delay: 300 });

    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    // Random delay before starting scraping to mimic human behavior
    await randomDelay();

    // Start extracting data while scrolling until the target number of impressions is reached
    // const impressionsArr =
    await extractDataWhileScrolling(page, TARGET_IMPRESSIONS);
    // console.log(impressionsArr);
  } catch (error) {
    console.error("ERROR: ", error.message);
  } finally {
    await browser.close();
  }
})();
