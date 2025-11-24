const { delay } = require("../lib/utils");

async function login(page, username, password) {
  try {
    console.log("🔐 Abrindo página de login do Twitter...");
    await page.goto("https://twitter.com/i/flow/login", {
      waitUntil: "networkidle2",
    });

    // Espera e preenche username
    console.log("📝 Preenchendo username...");
    await page.waitForSelector('input[name="text"]', { timeout: 15000 });
    await delay(1000);
    await page.type('input[name="text"]', username, { delay: 100 });
    await delay(500);

    // Clica no botão "Next" / "Avançar"
    console.log("🔘 Clicando em Next/Avançar...");
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));

      // Procura por botão com texto "Next" ou "Avançar"
      let nextBtn = buttons.find(btn => {
        const text = btn.textContent.trim().toLowerCase();
        return text === 'next' || text === 'avançar' || text.includes('next') || text.includes('avançar');
      });

      if (nextBtn) {
        nextBtn.click();
        return true;
      }

      // Fallback: procura botão escuro (background rgb(15, 20, 25)) que geralmente é o principal
      nextBtn = buttons.find(btn => {
        const style = window.getComputedStyle(btn);
        const bgColor = style.backgroundColor;
        return bgColor === 'rgb(15, 20, 25)';
      });

      if (nextBtn) {
        nextBtn.click();
        return true;
      }

      return false;
    });

    if (!clicked) {
      console.log("⚠️  Não encontrou botão Next/Avançar, tentando Enter...");
      await page.keyboard.press("Enter");
    }
    await delay(3000);

    // Verifica se pediu verificação adicional (telefone/email)
    const hasUnusualActivity = await page
      .evaluate(() => {
        const text = document.body.innerText.toLowerCase();
        return (
          text.includes("unusual") ||
          text.includes("suspicious") ||
          text.includes("verify") ||
          text.includes("phone") ||
          text.includes("email") ||
          text.includes("verificar") ||
          text.includes("telefone") ||
          text.includes("incomum") ||
          text.includes("confirmar sua identidade") ||
          text.includes("confirm your identity")
        );
      })
      .catch(() => false);

    if (hasUnusualActivity) {
      console.log(
        "⚠️  Twitter detectou atividade incomum. Pode precisar de verificação manual."
      );
      console.log("    Aguardando 10 segundos para verificação manual...");
      await delay(10000);
    }

    // Tenta preencher senha
    console.log("🔑 Preenchendo senha...");
    try {
      await page.waitForSelector('input[name="password"]', {
        timeout: 10000,
      });
      await delay(1000);
      await page.type('input[name="password"]', password, {
        delay: 100,
      });
      await delay(500);

      // Clica no botão "Log in"
      console.log("🔘 Procurando botão de login...");
      await delay(1000);

      // Tenta várias estratégias para encontrar o botão
      const clicked = await page.evaluate(() => {
        // Estratégia 1: data-testid
        let loginBtn = document.querySelector('[data-testid="LoginForm_Login_Button"]');
        if (loginBtn) {
          loginBtn.click();
          return true;
        }

        // Estratégia 2: Procura por texto em todos os botões
        const buttons = Array.from(document.querySelectorAll('button'));
        loginBtn = buttons.find(btn => {
          const text = btn.textContent.trim().toLowerCase();
          return text === 'log in' || text === 'sign in' || text === 'entrar' ||
                 text === 'login' || text === 'fazer login' || text === 'iniciar sessão';
        });

        if (loginBtn) {
          loginBtn.click();
          return true;
        }

        // Estratégia 3: Procura o último botão grande (geralmente é o de login)
        const bigButtons = buttons.filter(btn => {
          const rect = btn.getBoundingClientRect();
          return rect.width > 200 && rect.height > 30;
        });

        if (bigButtons.length > 0) {
          bigButtons[bigButtons.length - 1].click();
          return true;
        }

        return false;
      });

      if (!clicked) {
        console.log("⚠️  Não encontrou botão, tentando Enter...");
        await page.keyboard.press("Enter");
      } else {
        console.log("✅ Botão de login clicado!");
      }

      await delay(5000);
    } catch (error) {
      console.error("❌ Erro ao preencher senha:", error.message);
      throw new Error("Não encontrou campo de senha");
    }

    // Verifica se logou com sucesso
    await delay(3000);
    const currentUrl = page.url();

    if (currentUrl.includes("/home") || currentUrl.includes("/compose")) {
      console.log("✅ Login realizado com sucesso!");
      return;
    }

    // Verifica se tem algum erro na página
    const hasError = await page
      .evaluate(() => {
        const text = document.body.innerText.toLowerCase();
        return (
          text.includes("wrong password") ||
          text.includes("senha incorreta") ||
          text.includes("try again") ||
          text.includes("tente novamente")
        );
      })
      .catch(() => false);

    if (hasError) {
      throw new Error("Credenciais inválidas");
    }

    // Se chegou aqui, aguarda mais um pouco
    console.log("⏳ Aguardando confirmação de login...");
    await delay(5000);

    const finalUrl = page.url();
    if (!finalUrl.includes("/home") && !finalUrl.includes("/compose")) {
      console.log("⚠️  URL atual:", finalUrl);
      throw new Error(
        "Login pode não ter sido bem sucedido. Verifique as credenciais."
      );
    }

    console.log("✅ Login confirmado!");
  } catch (error) {
    console.error("❌ Erro no login do Twitter:", error.message);

    // Tira screenshot para debug
    try {
      const screenshotPath = `./twitter-login-error-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Screenshot salvo em: ${screenshotPath}`);
    } catch (screenshotError) {
      console.error("Não foi possível tirar screenshot");
    }

    throw error;
  }
}

async function goToProfilePage(page, profile) {
  if (!page) {
    throw new Error("Page is not defined");
  }

  const profileUrl = `https://twitter.com/${profile}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(profileUrl, { waitUntil: "networkidle2" });
      await page.waitForSelector('[data-testid="tweet"]', { timeout: 10000 });

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
      await delay(5000);
    }
  }
}

async function getLatestPostUrl(page) {
  await page.waitForSelector('[data-testid="tweet"]', { timeout: 10000 });

  // Pega o link do primeiro tweet no perfil
  const latestPostUrl = await page.$$eval(
    '[data-testid="tweet"] a[href*="/status/"]',
    (links) => {
      if (links.length > 0) {
        return links[0].href;
      }
      return null;
    }
  );

  return latestPostUrl;
}

async function getPostContent(page, postUrl) {
  await page.goto(postUrl, { waitUntil: "networkidle2" });
  await page.waitForSelector('[data-testid="tweetText"]', { timeout: 10000 });

  const postContent = await page.$eval(
    '[data-testid="tweetText"]',
    (el) => el.textContent
  );

  console.log(postContent);
  return postContent;
}

async function commentOnPost(page, comment) {
  try {
    // Clica no botão de reply
    await page.waitForSelector('[data-testid="reply"]', { timeout: 10000 });
    await page.click('[data-testid="reply"]');

    // Espera a textarea aparecer
    await page.waitForSelector('[data-testid="tweetTextarea_0"]', {
      timeout: 10000,
    });

    // Digita o comentário
    await page.type('[data-testid="tweetTextarea_0"]', comment);
    await delay(1000);

    // Clica no botão de enviar
    await page.waitForSelector('[data-testid="tweetButton"]', {
      timeout: 10000,
    });
    await page.click('[data-testid="tweetButton"]');
    await delay(2000);

    console.log("Comment posted successfully on Twitter");
  } catch (error) {
    console.error("Error posting comment on Twitter:", error);
    throw error;
  }
}

module.exports = {
  login,
  getLatestPostUrl,
  commentOnPost,
  getPostContent,
  goToProfilePage,
};
