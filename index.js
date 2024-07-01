#!/usr/bin/env node

const { setupBrowser, delay } = require("./lib/puppeteerSetup");
const openai = require("./lib/openaiClient");
const { truncateResponse } = require("./lib/utils");
const { program } = require("commander");
const fs = require("fs");
const csv = require("csv-parser");
const readline = require("readline");

// Load the appropriate driver based on platform
const drivers = {
  instagram: require("./drivers/instagramDriver"),
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

program
  .option("-u, --username <username>", "Social media username")
  .option("-p, --password <password>", "Social media password")
  .option("-s, --openai_secret <openai_secret>", "OpenAI API Secret Key")
  .option("-l, --headless", "Run Puppeteer in headless mode", false)
  .option("-f, --file <file>", "CSV file containing profiles")
  .option("-P, --profiles <profiles>", "Comma-separated list of profiles")
  .option(
    "-d, --driver <driver>",
    "Driver to use (instagram, twitter, linkedin)"
  )
  .parse(process.argv);

const options = program.opts();

if (!options.driver || !drivers[options.driver]) {
  console.error(
    "Invalid or missing driver. Use -d to specify the driver (instagram, twitter, linkedin)."
  );
  process.exit(1);
}

const driver = drivers[options.driver];
const username = options.username || process.env.INSTAGRAM_USERNAME;
const password = options.password || process.env.INSTAGRAM_PASSWORD;
const openaiApiKey = options.openai_secret || process.env.OPENAI_SECRET;

if (!username || !password || !openaiApiKey) {
  console.error(
    "Missing required credentials. Ensure username, password, and OpenAI API key are provided."
  );
  process.exit(1);
}

let profiles = [];

if (options.file) {
  try {
    const fileStream = fs.createReadStream(options.file);
    fileStream
      .pipe(csv())
      .on("data", (row) => {
        if (row.profile_url) {
          profiles.push(row.profile_url);
        }
      })
      .on("end", () => {
        console.log(`Profiles loaded from CSV file ${options.file}:`, profiles);
        askPrompts();
      });
  } catch (error) {
    console.error(`Error reading CSV file ${options.file}:`, error);
    process.exit(1);
  }
} else if (options.profiles) {
  profiles = options.profiles.split(",");
  console.log(`Profiles loaded from command line argument:`, profiles);
  askPrompts();
} else {
  console.error(
    "No profiles specified. Use -f to provide a CSV file or -P to provide profiles directly."
  );
  process.exit(1);
}

let lastPostUrls = {};

async function checkContent(postContent, persona) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      max_tokens: 70,
      temperature: 0.5,
      top_p: 1,
      messages: [
        { role: "system", content: persona },
        { role: "user", content: `Analyze post: ${postContent}` },
      ],
    });

    return response.choices[0].message.content.trim().toLowerCase() === "true";
  } catch (error) {
    console.error("Error checking content with OpenAI:", error);
    return false;
  }
}

async function interact(postContent, prompt, persona) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      max_tokens: 200,
      temperature: 0.5,
      top_p: 1,
      messages: [
        { role: "system", content: persona },
        { role: "user", content: `${prompt}: ${postContent}` },
      ],
    });

    return truncateResponse(response.choices[0].message.content, 240);
  } catch (error) {
    console.error("Error generating response with OpenAI:", error);
    return null;
  }
}

async function socialMediaSearchAndComment(
  page,
  profile,
  checkPrompt,
  interactPrompt,
  persona
) {
  try {
    await driver.goToProfilePage(page, profile);

    const latestPostUrl = await driver.getLatestPostUrl(page);

    if (latestPostUrl && latestPostUrl !== lastPostUrls[profile]) {
      console.log(`[${profile}] New post detected: ${latestPostUrl}`);
      lastPostUrls[profile] = latestPostUrl;

      const postContent = await driver.getPostContent(page, latestPostUrl);

      if (!postContent) {
        console.log("Could not retrieve post content.");
        return;
      }

      const isRelevant = await checkContent(postContent, persona);
      const comment = await interact(postContent, interactPrompt, persona);

      if (comment) {
        await driver.commentOnPost(page, comment);
        console.log(`[${profile}] Comment sent:`, comment);
      } else {
        console.log(`[${profile}] No valid comment generated for this post.`);
      }
    } else {
      console.log(`[${profile}] No new post found.`);
    }
  } catch (error) {
    console.error(`Error processing ${profile}:`, error);
    await delay(5 * 60 * 1000); // Wait 5 minutes before retrying
  }
}

async function askPrompts() {
  const defaultPrompts = {
    check: "Does this post talk about sneakers?",
    interact: "Write a short, friendly comment about this post.",
    persona: "You are a sneaker enthusiast.",
  };

  const prompts = {
    check: "",
    interact: "",
    persona: "",
  };

  const personaPromptQuestion = new Promise((resolve) => {
    rl.question(
      `Enter the persona (system prompt) for the commenter [${defaultPrompts.persona}]: `,
      (answer) => {
        prompts.persona = answer.trim() || defaultPrompts.persona;
        resolve();
      }
    );
  });

  await personaPromptQuestion;

  const checkPromptQuestion = new Promise((resolve) => {
    rl.question(
      `Enter a prompt for content checking (or press Enter to skip) [${defaultPrompts.check}]: `,
      (answer) => {
        prompts.check = answer.trim() || defaultPrompts.check;
        resolve();
      }
    );
  });

  await checkPromptQuestion;

  const interactPromptQuestion = new Promise((resolve) => {
    rl.question(
      `Enter a prompt for interaction (or press Enter to skip) [${defaultPrompts.interact}]: `,
      (answer) => {
        prompts.interact = answer.trim() || defaultPrompts.interact;
        resolve();
      }
    );
  });

  await interactPromptQuestion;

  run(prompts.check, prompts.interact, prompts.persona);
}

async function run(
  checkPrompt = defaultPrompts.check,
  interactPrompt = defaultPrompts.interact,
  persona = defaultPrompts.persona
) {
  const [browser, page] = await setupBrowser(options.headless);

  try {
    await driver.login(page, username, password);

    let profileIndex = 0;

    while (true) {
      const profile = profiles[profileIndex];
      profileIndex = (profileIndex + 1) % profiles.length; // Alterna para o próximo perfil
      console.log(profiles[profileIndex]);
      try {
        await socialMediaSearchAndComment(
          page,
          profile,
          checkPrompt,
          interactPrompt,
          persona
        );
      } catch (error) {
        console.error(`Error during processing profile ${profile}:`, error);
        await delay(1 * 60 * 1000); // Wait 5 minutes before retrying
      }

      await delay(1 * 60 * 1000); // Wait 5 minutes before checking again
    }
  } catch (error) {
    console.error("Error during script execution:", error);
  } finally {
    await browser.close();
    rl.close();
  }
}

askPrompts();
