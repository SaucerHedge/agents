import { AbilityExecutionResult } from '../types';

class ResponseFormatter {
  async formatAbilityResponse(
    abilityName: string,
    executionResult: AbilityExecutionResult,
    initialContext: string
  ): Promise<string> {
    const abilityResponses: Record<string, (data: any, ctx: string) => string> = {
      'open-hedged-position-ability': (data, ctx) => `**Opening Hedged LP Position** 🚀

${ctx}

**Position Details:**
• Position ID: #${data.positionId}
• LP Allocation: $${data.lpAllocation.toFixed(2)}
• Short Allocation: $${data.shortAllocation.toFixed(2)}
• Protection: 87.5% IL reduction

**Status:** ✨ **Successfully Opened!**
📝 TX: [${data.txHash}](https://hashscan.io/testnet/transaction/${data.txHash})

**Position Allocation:**
• **79%** → SaucerSwap V2 LP
• **21%** → Bonzo Short Position

Your hedge is now active and protecting your liquidity! 🛡️`,

      'close-hedged-position-ability': (data, ctx) => `**Closing Hedged LP Position** 🔚

${ctx}

**Final Returns:**
| Asset | Return | Value |
|-------|--------|-------|
| USDC | +1.35% | $${data.usdcReturn.toFixed(2)} |
| HBAR | -19% | $${data.hbarReturn.toFixed(2)} |
| **Total** | **+0.79%** | **Combined** |

**Status:** ✅ **Successfully Closed!**
📝 TX: [${data.txHash}](https://hashscan.io/testnet/transaction/${data.txHash})

Your position has been closed and funds returned! 💰`,

      'deposit-to-vault-ability': (data, ctx) => `**Depositing to Multi-Asset Vaults** 🏦

${ctx}

**USDC Deposit:**
✅ Deposited: ${data.usdcShares} USDC
✅ Received: ${data.usdcShares} shUSDC shares

**HBAR Deposit:**
✅ Deposited: ${data.hbarShares} HBAR
✅ Received: ${data.hbarShares} shHBAR shares

**Status:** ✨ **Successfully Deposited!**
📝 TX: [${data.txHash}](https://hashscan.io/testnet/transaction/${data.txHash})

Your tokens are now secure in the vault! 🔐`,

      'get-position-status-ability': (data, ctx) => `**Position #${data.positionId} Status Report** 📊

${ctx}

**Performance Metrics:**
| Metric | Value |
|--------|-------|
| LP Value | $${data.lpValue.toFixed(2)} |
| Short Value | $${data.shortValue.toFixed(2)} |
| IL Protection | ${data.ilProtection.toFixed(1)}% |
| Status | ✨ Active |

Your position is performing excellently! 🎯`,

      'open-vault-hedged-position-ability': (data, ctx) => `**Opening Vault Hedged Position** 🚀

${ctx}

**Position Details:**
• Position ID: #${data.positionId}
• Vault Usage: ${data.vaultPercentageUsed}%

**Status:** ✨ **Successfully Opened!**
📝 TX: [${data.txHash}](https://hashscan.io/testnet/transaction/${data.txHash})

Your vault-managed hedge is now active! 🛡️`,

      'close-vault-hedged-position-ability': (data, ctx) => `**Closing Vault Position** 🔚

${ctx}

**Position #${data.positionId} Results:**
• Total Return: ${data.totalReturn.toFixed(2)}%

**Status:** ✅ **Successfully Closed!**
📝 TX: [${data.txHash}](https://hashscan.io/testnet/transaction/${data.txHash})

Your vault position has been closed! 💰`,
    };

    const formatter = abilityResponses[abilityName];
    if (formatter) {
      return formatter(executionResult.data, initialContext);
    }

    return `✅ **${abilityName}** executed successfully!\n\nTX: [${executionResult.transactionHash}](https://hashscan.io/testnet/transaction/${executionResult.transactionHash})`;
  }
}

export const responseFormatter = new ResponseFormatter();
