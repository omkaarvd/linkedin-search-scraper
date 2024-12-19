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

// Function to simulate slower human-like scrolling with random delays
async function autoScroll(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = Math.random() * 100 + 50; // Randomize scroll distance (50 - 150px)
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, Math.random() * 800 + 400); // Slower random interval (400 - 1200ms)
    });
  });
}

// Function to implement random delays to mimic human-like behavior
function randomDelay() {
  return new Promise((resolve) => {
    const delayTime = Math.random() * 3000 + 1000; // Random delay between 1 to 4 seconds
    setTimeout(resolve, delayTime);
  });
}

// Function to implement exponential backoff in case of failure
async function exponentialBackoff(fn: Function, maxRetries = 5) {
  let attempt = 0;
  let success = false;

  while (attempt < maxRetries && !success) {
    try {
      await fn();
      success = true;
    } catch (error) {
      attempt++;
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff (1, 2, 4, 8 seconds)
      console.log(
        `Attempt ${attempt} failed. Retrying in ${delay / 1000} seconds...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  if (!success) {
    console.log("Max retries reached. Exiting...");
  }
}

// Function to extract data while scrolling simultaneously
async function extractDataWhileScrolling(page: Page) {
  let isScrolling = true;
  const impressionsArr: { impression: number; data: string }[] = [];

  while (isScrolling) {
    // Extract data during the scroll
    const content = await page.content();
    const $ = cheerio.load(content);

    const impressions = $(".fie-impression-container");
    impressions.each((index, element) => {
      const $title = $(element).find(
        ".update-components-actor__title > .update-components-actor__single-line-truncate"
      );
      const $selected = $title.find("[aria-hidden=true]").text().trim();

      impressionsArr.push({
        impression: index + 1,
        data: $selected,
      });

      console.log({
        impression: index + 1,
        data: $selected,
      });
    });

    // If we've reached the end of the page, stop scrolling
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    const currentPosition = await page.evaluate(() => window.scrollY);

    if (currentPosition + 100 >= scrollHeight) {
      isScrolling = false;
    }

    // Scroll down slowly and randomly
    await autoScroll(page);

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

    // Start extracting data while scrolling
    const impressionsArr = await extractDataWhileScrolling(page);

    console.log(impressionsArr);
  } catch (error) {
    console.error("ERROR: ", error.message);
  } finally {
    await browser.close();
  }
})();
