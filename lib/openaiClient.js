const { OpenAI } = require("openai");
const { openaiApiKey } = require("../config/config");

const openai = new OpenAI({ apiKey: openaiApiKey });

module.exports = openai;
