import { Client, AccountId, PrivateKey } from '@hashgraph/sdk';
import { config } from './env';

let client: Client | null = null;

export function initializeHederaClient(): Client {
  if (client) return client;

  const accountId = AccountId.fromString(config.hedera.accountId);
  const privateKey = PrivateKey.fromStringDer(config.hedera.privateKey);

  client = Client.forName(config.hedera.network);
  client.setOperator(accountId, privateKey);

  console.log(`✅ Hedera Client initialized for ${config.hedera.network}`);
  console.log(`📡 Account: ${config.hedera.accountId}`);

  return client;
}

export function getHederaClient(): Client {
  if (!client) {
    return initializeHederaClient();
  }
  return client;
}
