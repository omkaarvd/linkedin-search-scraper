import puppeteer from "puppeteer";
import { proxies } from "./proxies";

const scraper = async () => {
  const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];

  // launch a browser instance with the
  // --proxy-server flag enabled
  const browser = await puppeteer.launch({
    args: [`--proxy-server=${randomProxy}`],
  });

  // open a new page in the current browser context
  const page = await browser.newPage();

  // visit the target page
  await page.goto("https://httpbin.org/ip");

  // extract the IP the request comes from
  // and print it
  const body = await page.waitForSelector("body");
  const ip = await body!.getProperty("textContent");
  console.log(await ip.jsonValue());

  await browser.close();
};

scraper();
