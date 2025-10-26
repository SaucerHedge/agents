// Ability execution result
export interface AbilityExecutionResult {
  success: boolean;
  abilityName: string;
  transactionHash?: string;
  message: string;
  data?: any;
  error?: string;
}

// Tool definition
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

// Message history
export interface MessageHistory {
  role: 'user' | 'assistant';
  content: string;
}

// Chat response
export interface ChatResponseData {
  id: string;
  role: 'assistant';
  content: string;
  timestamp: Date;
  txHash?: string;
  abilities?: string[];
  toolUsed?: string;
}

// Ability metadata
export interface AbilityMetadata {
  name: string;
  version: string;
  description: string;
  ipfsCid: string;
  supportedPolicies: string[];
  inputs: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

// Vincent delegation scope
export interface VincentDelegationScope {
  maxTransaction: string;
  expirationTime: Date;
  allowedAbilities: string[];
}
