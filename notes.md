You can also follow the tips below to boost your chances of bypassing TLS fingerprinting:
Don't make the requests at the same time every day. Instead, send them at random times.
Change IPs often.
Use different request headers, including other User-Agents.
Configure your headless browser to use different screen sizes, resolutions, and fonts.
Use different headless browsers.

<!--  -->

Randomizing your request intervals helps you mimic human user behavior, reducing your chances of getting blocked.
It involves implementing a random delay using methods like Python's time.sleep or JavaScript's setTimeout.
Another request randomization technique to mimic human behavior is exponential backoffs/delays.
This technique involves pausing your scraping task for a specific period after a failed request.
If the request fails again, the previous wait time increases exponentially and accumulates for subsequent failures.

<!--  -->

Clicking the same elements, using the same scroll height, and following a similar navigation pattern for every request put you at risk of getting blocked.
The recommended approach is diversifying your crawling pattern to resemble a human interaction.
To do that, you can perform random mouse hovering, click elements randomly, and scroll the page back and forth at various heights before scraping.
This technique can keep anti-bots and underground challenges monitoring user behavior in check, forcing them to treat your scraper as a human.
