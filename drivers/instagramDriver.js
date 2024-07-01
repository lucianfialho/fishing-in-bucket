const { delay } = require("../lib/utils");

async function login(page, username, password) {
  await page.goto("https://www.instagram.com/accounts/login/");

  await page.waitForSelector('[name="username"]');
  await page.type('[name="username"]', username);
  await delay(1000);

  await page.waitForSelector('[name="password"]');
  await page.type('[name="password"]', password);
  await delay(1000);

  await page.click('[type="submit"]');
  await delay(4000);
}

async function getLatestPostUrl(page) {
  await page.waitForSelector(
    "main > div > div:last-child > div > div:nth-child(2) a",
    { timeout: 10000 }
  );

  const latestPostUrl = await page.$eval(
    "main > div > div:last-child > div > div:nth-child(2) a",
    (el) => el.href
  );

  return latestPostUrl;
}

async function commentOnPost(page, comment) {
  const textareaSelector =
    "textarea[aria-label='Adicione um comentário...'], textarea[aria-label='Add a comment…']";

  await page.waitForSelector(textareaSelector);
  await page.type(textareaSelector, comment);
  await page.click(
    "section > main > div > div:first-child > div > div:nth-child(2) form > div > div:last-child"
  );
}

async function goToProfilePage(page, profile) {
  if (!page) {
    throw new Error("Page is not defined");
  }

  const profileUrl = `https://www.instagram.com/${profile}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(profileUrl);
      await page.waitForSelector(
        "main > div > div:last-child > div > div:nth-child(2) a",
        { timeout: 10000 }
      );

      console.log(`Navigated to profile: ${profile}`);
      return;
    } catch (error) {
      console.error(
        `Attempt ${attempt} - Failed to navigate to profile: ${profile}. Error: ${error.message}`
      );
      if (attempt === 3) {
        throw new Error(
          `Failed to navigate to profile: ${profile} after 3 attempts`
        );
      }
      await page.reload({ waitUntil: "networkidle2" });
      await delay(5000); // Wait 5 seconds before retrying
    }
  }
}

async function getPostContent(page, postUrl) {
  await page.goto(postUrl);
  await page.waitForSelector(
    "section > main > div > div:first-child > div > div:nth-child(2) > div > div:nth-child(3) span",
    { timeout: 10000 }
  );

  const postContent = await page.$eval(
    "section > main > div > div:first-child > div > div:nth-child(2) > div > div:nth-child(3) span",
    (el) => el.innerText
  );

  console.log(postContent);
  return postContent;
}

module.exports = {
  login,
  getLatestPostUrl,
  commentOnPost,
  getPostContent,
  goToProfilePage,
};
