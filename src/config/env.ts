import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Hedera
  hedera: {
    accountId: process.env.HEDERA_ACCOUNT_ID!,
    privateKey: process.env.HEDERA_PRIVATE_KEY!,
    network: process.env.HEDERA_NETWORK || 'testnet',
  },

  // LLM
  llm: {
    provider: 'google',
    model: 'gemini-2.5-flash',
    apiKey: process.env.GEMINI_API_KEY!,
  },

  // Vincent
  vincent: {
    appId: parseInt(process.env.VINCENT_APP_ID!),
    redirectUri: process.env.VINCENT_REDIRECT_URI || 'http://localhost:8080/callback',
  },

  // NPM Registry (for published abilities)
  npm: {
    registry: process.env.NPM_REGISTRY || 'https://registry.npmjs.org',
    scope: '@saucerhedgevault',
  },

  // CORS
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:8080').split(','),
  },
};

// Validate required env vars
const required = [
  'HEDERA_ACCOUNT_ID',
  'HEDERA_PRIVATE_KEY',
  'GEMINI_API_KEY',
  'VINCENT_APP_ID',
];

for (const envVar of required) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
