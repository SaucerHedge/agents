import {
  Client,
  TransactionReceipt,
  TransactionResponse,
  TransactionId,
  AccountId,
  ContractExecuteTransaction,
  ContractId,
  Hbar,
  Status,
  ContractFunctionParameters,
} from '@hashgraph/sdk';
import { getHederaClient } from '../config/hedera';
import { config } from '../config/env';

/**
 * TransactionService - Handles all Hedera network transactions
 * Provides transaction building, execution, and monitoring
 */
export class TransactionService {
  private client: Client;
  private transactionHistory: Map<string, TransactionInfo> = new Map();

  constructor() {
    this.client = getHederaClient();
    console.log(`✅ TransactionService initialized`);
  }

  /**
   * Execute a contract function call
   */
  async executeContractFunction(
    contractId: string,
    functionName: string,
    parameters: ContractFunctionParameters,
    gasLimit: number = 1000000,
    payableAmount?: Hbar
  ): Promise<TransactionExecutionResult> {
    try {
      console.log(`\n🔨 Executing contract function: ${functionName}`);
      console.log(`📝 Contract ID: ${contractId}`);
      console.log(`⛽ Gas limit: ${gasLimit}`);

      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(contractId))
        .setGas(gasLimit)
        .setFunction(functionName, parameters);

      if (payableAmount) {
        transaction.setPayableAmount(payableAmount);
        console.log(`💰 Payable amount: ${payableAmount.toString()}`);
      }

      // Execute transaction
      const txResponse = await transaction.execute(this.client);
      console.log(`✅ Transaction submitted: ${txResponse.transactionId.toString()}`);

      // Get receipt
      const receipt = await txResponse.getReceipt(this.client);
      console.log(`📥 Receipt status: ${receipt.status.toString()}`);

      const result: TransactionExecutionResult = {
        transactionId: txResponse.transactionId.toString(),
        status: receipt.status,
        contractId,
        functionName,
        receipt,
        timestamp: new Date(),
      };

      // Store in history
      this.transactionHistory.set(result.transactionId, {
        transactionId: result.transactionId,
        type: 'contract_execute',
        status: receipt.status.toString(),
        timestamp: new Date(),
        details: { contractId, functionName, gasLimit },
      });

      return result;
    } catch (error: any) {
      console.error(`❌ Contract execution failed:`, error);
      throw new Error(`Failed to execute contract function: ${error.message}`);
    }
  }

  /**
   * Query transaction status
   */
  async getTransactionStatus(transactionId: string): Promise<TransactionStatusInfo> {
    try {
      console.log(`🔍 Querying transaction status: ${transactionId}`);

      // Check local history first
      const localInfo = this.transactionHistory.get(transactionId);
      if (localInfo) {
        console.log(`📚 Found in local history`);
        return {
          transactionId,
          status: localInfo.status,
          timestamp: localInfo.timestamp,
          details: localInfo.details,
        };
      }

      // If not in local history, query network
      const txId = TransactionId.fromString(transactionId);
      const receipt = await this.client.getReceiptQuery()
        .setTransactionId(txId)
        .execute(this.client);

      console.log(`✅ Status: ${receipt.status.toString()}`);

      return {
        transactionId,
        status: receipt.status.toString(),
        timestamp: new Date(),
        details: { receipt },
      };
    } catch (error: any) {
      console.error(`❌ Failed to get transaction status:`, error);
      throw new Error(`Failed to query transaction: ${error.message}`);
    }
  }

  /**
   * Build parameters for opening hedged position
   */
  buildOpenPositionParams(
    usdcAmount: number,
    hbarAmount: number,
    userAddress: string
  ): ContractFunctionParameters {
    console.log(`🏗️ Building open position parameters`);
    console.log(`  - USDC: ${usdcAmount}`);
    console.log(`  - HBAR: ${hbarAmount}`);
    console.log(`  - User: ${userAddress}`);

    const params = new ContractFunctionParameters()
      .addUint256(BigInt(Math.floor(usdcAmount * 1e6))) // USDC has 6 decimals
      .addUint256(BigInt(Math.floor(hbarAmount * 1e8))) // HBAR has 8 decimals
      .addAddress(userAddress);

    return params;
  }

  /**
   * Build parameters for closing position
   */
  buildClosePositionParams(positionId: string): ContractFunctionParameters {
    console.log(`🏗️ Building close position parameters`);
    console.log(`  - Position ID: ${positionId}`);

    const params = new ContractFunctionParameters()
      .addUint256(BigInt(positionId));

    return params;
  }

  /**
   * Build parameters for vault deposit
   */
  buildDepositParams(
    tokenAddress: string,
    amount: number,
    userAddress: string
  ): ContractFunctionParameters {
    console.log(`🏗️ Building deposit parameters`);
    console.log(`  - Token: ${tokenAddress}`);
    console.log(`  - Amount: ${amount}`);
    console.log(`  - User: ${userAddress}`);

    const params = new ContractFunctionParameters()
      .addAddress(tokenAddress)
      .addUint256(BigInt(Math.floor(amount * 1e6)))
      .addAddress(userAddress);

    return params;
  }

  /**
   * Build parameters for getting position status
   */
  buildPositionStatusParams(positionId: string): ContractFunctionParameters {
    console.log(`🏗️ Building position status parameters`);
    console.log(`  - Position ID: ${positionId}`);

    const params = new ContractFunctionParameters()
      .addUint256(BigInt(positionId));

    return params;
  }

  /**
   * Monitor transaction until confirmed
   */
  async waitForConfirmation(
    transactionId: string,
    maxRetries: number = 10,
    retryDelay: number = 2000
  ): Promise<boolean> {
    console.log(`⏳ Waiting for transaction confirmation: ${transactionId}`);

    for (let i = 0; i < maxRetries; i++) {
      try {
        const status = await this.getTransactionStatus(transactionId);
        
        if (status.status === 'SUCCESS') {
          console.log(`✅ Transaction confirmed!`);
          return true;
        }

        if (status.status === 'FAILED') {
          console.log(`❌ Transaction failed`);
          return false;
        }

        console.log(`⏳ Attempt ${i + 1}/${maxRetries}: Waiting...`);
        await this.sleep(retryDelay);
      } catch (error) {
        console.log(`⚠️ Retry ${i + 1}/${maxRetries} failed, continuing...`);
      }
    }

    console.log(`⏱️ Timeout waiting for confirmation`);
    return false;
  }

  /**
   * Get transaction history
   */
  getTransactionHistory(limit: number = 20): TransactionInfo[] {
    const history = Array.from(this.transactionHistory.values());
    return history.slice(-limit);
  }

  /**
   * Clear transaction history
   */
  clearTransactionHistory(): void {
    this.transactionHistory.clear();
    console.log(`🧹 Transaction history cleared`);
  }

  /**
   * Get service stats
   */
  getStats(): {
    totalTransactions: number;
    successRate: string;
    averageGasUsed: string;
  } {
    const transactions = Array.from(this.transactionHistory.values());
    const successful = transactions.filter(tx => tx.status === 'SUCCESS').length;

    return {
      totalTransactions: transactions.length,
      successRate: transactions.length > 0
        ? `${((successful / transactions.length) * 100).toFixed(2)}%`
        : '0%',
      averageGasUsed: 'N/A', // Would calculate from actual transactions
    };
  }

  /**
   * Helper: Sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Estimate gas for contract call
   */
  estimateGas(functionName: string, dataSize: number): number {
    const baseGas = 100000;
    const dataGas = dataSize * 1000;
    
    // Function-specific estimates
    const functionGas: Record<string, number> = {
      openPosition: 500000,
      closePosition: 400000,
      deposit: 300000,
      withdraw: 300000,
      getStatus: 100000,
    };

    const estimated = (functionGas[functionName] || baseGas) + dataGas;
    console.log(`⛽ Estimated gas for ${functionName}: ${estimated}`);
    return estimated;
  }

  /**
   * Format transaction ID for HashScan
   */
  getHashScanUrl(transactionId: string): string {
    const network = config.hedera.network;
    const baseUrl = network === 'mainnet'
      ? 'https://hashscan.io'
      : `https://hashscan.io/${network}`;
    
    return `${baseUrl}/transaction/${transactionId}`;
  }

  /**
   * Parse transaction ID components
   */
  parseTransactionId(transactionId: string): {
    accountId: string;
    validStartSeconds: string;
    validStartNanos: string;
  } {
    const parts = transactionId.split('@');
    const accountId = parts[0];
    const [validStartSeconds, validStartNanos] = parts[1].split('.');

    return {
      accountId,
      validStartSeconds,
      validStartNanos,
    };
  }
}

/**
 * Types
 */
export interface TransactionExecutionResult {
  transactionId: string;
  status: Status;
  contractId: string;
  functionName: string;
  receipt: TransactionReceipt;
  timestamp: Date;
}

export interface TransactionStatusInfo {
  transactionId: string;
  status: string;
  timestamp: Date;
  details?: any;
}

export interface TransactionInfo {
  transactionId: string;
  type: string;
  status: string;
  timestamp: Date;
  details?: any;
}

/**
 * Singleton instance
 */
let transactionServiceInstance: TransactionService | null = null;

export function initializeTransactionService(): TransactionService {
  if (!transactionServiceInstance) {
    transactionServiceInstance = new TransactionService();
    console.log(`✅ TransactionService singleton initialized`);
  }
  return transactionServiceInstance;
}

export function getTransactionService(): TransactionService {
  if (!transactionServiceInstance) {
    return initializeTransactionService();
  }
  return transactionServiceInstance;
}

export default TransactionService;
