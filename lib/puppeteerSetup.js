const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const setupBrowser = async (headless = true) => {
  const viewPortHeight = 1024;
  const viewPortWidth = 1080;

  const browser = await puppeteer.launch({ headless });
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  await page.setViewport({ width: viewPortWidth, height: viewPortHeight });

  return [browser, page];
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  setupBrowser,
  delay,
};
