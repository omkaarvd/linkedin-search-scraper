import * as cheerio from "cheerio";
import { Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { userAgents } from "./utils/user-agents";

puppeteer.use(StealthPlugin());

// Function to implement random delays to mimic human-like behavior
function randomDelay() {
  return new Promise((resolve) => {
    const delayTime = Math.random() * 5000 + 1000; // Random delay between 1 to 6 seconds
    setTimeout(resolve, delayTime);
  });
}

// Function to extract data while scrolling until the target number of posts are reached
export async function extractDataWhileScrolling(
  page: Page,
  targetPosts: number
) {
  // let postArr: { index: number; author: string }[] = [];
  let totalPosts = 0;
  let previousHeight: number;

  while (totalPosts < targetPosts) {
    const content = await page.content();
    const $ = cheerio.load(content);

    const posts = $(".fie-impression-container");

    posts.each((index, element) => {
      const container = $(element);

      const name = container
        .find('.update-components-actor__title span[aria-hidden="true"]')
        .text()
        .trim();
      const description = container
        .find(".update-components-actor__description")
        .text()
        .trim();
      const profileLink = container
        .find(".update-components-actor__meta-link")
        .attr("href");
      const postTime = container
        .find(".update-components-actor__sub-description")
        .text()
        .trim();
      const imageSrc = container
        .find(".ivm-view-attr__img-wrapper img")
        .attr("src");
      const postContent = container
        .find(".update-components-text span.break-words")
        .text()
        .trim();
      const postLink = container
        .find(".update-components-article__meta")
        .attr("href");
      const likes =
        container
          .find(".social-details-social-counts__reactions-count")
          .text()
          .trim() || "0";
      const comments =
        container
          .find(".social-details-social-counts__comments")
          .text()
          .trim() || "0";

      console.log({
        index: totalPosts + 1,
        name,
        description,
        profileLink,
        postTime,
        imageSrc,
        postContent,
        postLink,
        likes,
        comments,
      });

      totalPosts += 1;

      // Stop extraction if the target number of posts are reached
      if (totalPosts >= targetPosts) {
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

  // return postArr;
}

export async function startScraping(keyword: string, targetPosts: number) {
  const randomUserAgent =
    userAgents[Math.floor(Math.random() * userAgents.length)];

  const browser = await puppeteer.connect({
    browserURL: "http://localhost:9222", // Ensure this matches the port used above
  });

  try {
    const pages = await browser.pages();
    const page = pages.length ? pages[0] : await browser.newPage(); // Use an existing page or create a new one

    await page.setViewport({
      isLandscape: true,
      width: 1366,
      height: 768,
    });

    await page.setDefaultNavigationTimeout(2 * 60 * 1000);
    await page.setUserAgent(randomUserAgent);

    // Visit the LinkedIn search page
    await page.goto(
      `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(
        keyword
      )}`
    );

    // Random delay before starting scraping to mimic human behavior
    await randomDelay();

    await extractDataWhileScrolling(page, targetPosts);
  } catch (error) {
    console.error("ERROR: ", error.message);
  } finally {
    await browser.close();
  }
}

/* 


//*[@id="ember801"]/div/div/div
//*[@id="ember873"]/div/div/div
//*[@id="ember828"]/div/div/div


document.querySelector("#ember1023 > div > div > div")
document.querySelector("#ember1051 > div > div > div")


*/
