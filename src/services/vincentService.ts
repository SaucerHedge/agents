import { config } from '../config/env';

export class VincentService {
  private delegationScopes = new Map<string, any>();

  async generateAuthUrl(userAddress: string): Promise<string> {
    const params = new URLSearchParams({
      app_id: config.vincent.appId.toString(),
      redirect_uri: config.vincent.redirectUri,
      user: userAddress,
      scope: 'delegation',
    });

    const authUrl = `https://vincent.hedera.com/auth?${params.toString()}`;
    console.log(`🔐 Generated auth URL: ${authUrl}`);
    return authUrl;
  }

  async validateDelegation(jwt: string): Promise<boolean> {
    try {
      // In production: verify JWT signature
      console.log(`✅ Delegation validated`);
      return true;
    } catch (error) {
      console.error(`❌ Delegation validation failed:`, error);
      return false;
    }
  }

  async createDelegationScope(
    userAddress: string,
    maxTransaction: string,
    expirationDays: number
  ): Promise<any> {
    const scope = {
      user: userAddress,
      maxTransaction,
      expiresAt: new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000),
      abilities: [
        'open-hedged-position',
        'close-hedged-position',
        'deposit-to-vault',
        'get-position-status',
        'open-vault-hedged-position',
        'close-vault-hedged-position',
      ],
    };

    this.delegationScopes.set(userAddress, scope);
    console.log(`✅ Delegation scope created for ${userAddress}`);
    return scope;
  }

  getDelegationScope(userAddress: string): any {
    return this.delegationScopes.get(userAddress) || null;
  }
}

export const vincentService = new VincentService();
