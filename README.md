
# Social Media Comment Bot

Este projeto é um bot de comentários para redes sociais que utiliza Puppeteer e OpenAI para interagir com postagens em plataformas como Instagram. O bot navega até o perfil de um usuário, verifica o conteúdo da última postagem, analisa se a postagem é relevante para um tema específico e faz um comentário apropriado.

## Pré-requisitos

- Node.js (versão 12 ou superior)
- NPM ou Yarn para gerenciar pacotes

## Instalação

1. Clone este repositório:
   ```bash
   git clone https://github.com/seu_usuario/social-media-comment-bot.git
   cd social-media-comment-bot
   ```

2. Instale as dependências:
   ```bash
   npm install
   # ou
   yarn install
   ```

3. Crie um arquivo `.env` na raiz do projeto e adicione as seguintes variáveis de ambiente:
   ```env
   INSTAGRAM_USERNAME=seu_usuario_instagram
   INSTAGRAM_PASSWORD=sua_senha_instagram
   OPENAI_SECRET=sua_chave_api_openai
   HEADLESS=true # ou false se quiser ver o navegador em ação
   ```

## Uso

Você pode executar o bot utilizando perfis fornecidos diretamente via argumentos de linha de comando ou a partir de um arquivo CSV.

### Executar com perfis fornecidos via linha de comando

```bash
node index.js -u seu_usuario_instagram -p sua_senha_instagram -s sua_chave_api_openai -P perfil1,perfil2 -d instagram -t tema
```

### Executar com perfis a partir de um arquivo CSV

O arquivo CSV deve ter uma coluna `profile_url` com os URLs dos perfis.

```bash
node index.js -u seu_usuario_instagram -p sua_senha_instagram -s sua_chave_api_openai -f caminho/para/arquivo.csv -d instagram -t tema
```

### Parâmetros

- `-u, --username <username>`: Nome de usuário da rede social (Instagram).
- `-p, --password <password>`: Senha da rede social (Instagram).
- `-s, --openai_secret <openai_secret>`: Chave de API do OpenAI.
- `-l, --headless`: Executa o Puppeteer no modo headless (sem interface gráfica). Padrão é `false`.
- `-f, --file <file>`: Arquivo CSV contendo os perfis.
- `-P, --profiles <profiles>`: Lista de perfis separados por vírgula.
- `-d, --driver <driver>`: Driver a ser usado (instagram, twitter, linkedin).
- `-t, --theme <theme>`: Tema a ser verificado nas postagens antes de comentar.

### Exemplo

```bash
node index.js -u seu_usuario_instagram -p sua_senha_instagram -s sua_chave_api_openai -P lucianfialho,outroperfil -d instagram -t sneakers
```

## Estrutura do Projeto

```plaintext
.
├── drivers
│   └── instagramDriver.js
├── lib
│   ├── openaiClient.js
│   ├── puppeteerSetup.js
│   └── utils.js
├── data
│   └── profiles.csv
├── .env
├── index.js
└── README.md
```

## Contribuição

1. Faça um fork do projeto.
2. Crie uma nova branch: `git checkout -b minha-nova-funcionalidade`.
3. Faça suas alterações e commit: `git commit -m 'Adiciona nova funcionalidade'`.
4. Envie para o repositório remoto: `git push origin minha-nova-funcionalidade`.
5. Envie um Pull Request.

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
