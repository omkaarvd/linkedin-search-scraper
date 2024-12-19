import axios from "axios";
import * as cheerio from "cheerio";

axios
  .get("https://en.wikipedia.org/wiki/Web_scraping")
  .then((response) => {
    const $ = cheerio.load(response.data);
    console.log($("title").text());
  })
  .catch((error) => {
    console.error("Error fetching the page: ", error);
  });
