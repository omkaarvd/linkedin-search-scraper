import * as cheerio from "cheerio";
import { Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { cleanURL } from "./utils/clean-url";
import { userAgents } from "./utils/user-agents";

puppeteer.use(StealthPlugin());

// Function to implement random delays to mimic human-like behavior
function randomDelay(min = 5000, max = 15000) {
  return new Promise((resolve) => {
    const delayTime = Math.random() * (max - min) + min; // Random delay between 5 to 15 seconds
    setTimeout(resolve, delayTime);
  });
}

// Function to extract data while scrolling until the target number of posts are reached
export async function extractDataWhileScrolling(
  page: Page,
  targetPosts: number
) {
  let totalPosts = 0;
  let previousHeight: number;

  while (totalPosts < targetPosts) {
    const content = await page.content();
    const $ = cheerio.load(content);

    const posts = $(".fie-impression-container");

    for (let index = 0; index < posts.length; index++) {
      const element = posts[index];
      const container = $(element);

      // Post Details
      const postContent = container
        .find(".update-components-text span.break-words")
        .text()
        .trim();

      // Handle post URL
      let postURL = container
        .find(".update-components-article__meta")
        .attr("href");

      if (!postURL) {
        // Simulate a click to reveal the post URL
        const clickableSelector = ".update-components-article__meta";
        const clickableElement = await page.$(clickableSelector);

        if (clickableElement) {
          await clickableElement.click();

          // Random delay to wait for the URL to be revealed
          randomDelay(1000, 2000);

          const updatedContent = await page.content();
          const updated$ = cheerio.load(updatedContent);

          postURL = updated$(element)
            .find(".update-components-article__meta")
            .attr("href");
        }
      }

      const cleanedPostURL = cleanURL(postURL);

      const postTimestamp = container
        .find(".update-components-actor__sub-description")
        .text()
        .trim();

      const likesCount =
        container
          .find(".social-details-social-counts__reactions-count")
          .text()
          .trim() || "0";

      const commentsCount =
        container
          .find(".social-details-social-counts__comments")
          .text()
          .trim() || "0";

      // Extract hashtags
      const hashtags: string[] = [];
      container
        .find('.update-components-text a[href*="/feed/hashtag"]')
        .each((_, hashtag) => {
          hashtags.push($(hashtag).text().trim());
        });

      // Extract mentions
      const mentions: string[] = [];
      container
        .find('.update-components-text a[href*="/in/"]')
        .each((_, mention) => {
          mentions.push($(mention).text().trim());
        });

      // Author Details
      const authorName = container
        .find('.update-components-actor__title span[aria-hidden="true"]')
        .text()
        .trim();

      const authorURL = container
        .find(".update-components-actor__meta-link")
        .attr("href");

      const cleanedAuthorURL = cleanURL(authorURL);

      const profilePictureURL = container
        .find(".ivm-view-attr__img-wrapper img")
        .attr("src");

      const authorHeadline = container
        .find(".update-components-actor__description")
        .text()
        .trim();

      console.log({
        postDetails: {
          postContent,
          postURL: cleanedPostURL,
          postTimestamp,
          likesCount,
          commentsCount,
          hashtags,
          mentions,
        },
        authorDetails: {
          authorName,
          authorURL: cleanedAuthorURL,
          profilePictureURL,
          authorHeadline,
        },
      });

      totalPosts += 1;

      // Stop extraction if the target number of posts are reached
      if (totalPosts >= targetPosts) {
        break;
      }
    }

    // Wait for the page to load more content and scroll down with human-like behavior
    previousHeight = Number(await page.evaluate("document.body.scrollHeight"));

    // Randomly scroll up and down to mimic human behavior before scrolling down again
    await page.evaluate(() => window.scrollBy(0, -100));
    await randomDelay(2000, 5000); // Short pause before scrolling down again

    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await page.waitForFunction(
      `document.body.scrollHeight > ${previousHeight}`
    );

    // Random delay to simulate human-like scrolling pauses
    await randomDelay();
  }
}

export async function startScraping(keyword: string, targetPosts: number) {
  const randomUserAgent =
    userAgents[Math.floor(Math.random() * userAgents.length)];

  const browser = await puppeteer.connect({
    browserURL: "http://localhost:9222", // Ensure this matches the port used in the Chrome Remote Debugging setup
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
