require("dotenv").config();

module.exports = {
  instagramUsername: process.env.INSTAGRAM_USERNAME,
  instagramPassword: process.env.INSTAGRAM_PASSWORD,
  openaiApiKey: process.env.OPENAI_SECRET,
  headless: process.env.HEADLESS || false,
};
