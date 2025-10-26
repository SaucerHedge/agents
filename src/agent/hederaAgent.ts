import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/env';
import { MessageHistory, ChatResponseData, ToolDefinition } from '../types';
import { generateToolsFromAbilities, mapToolNameToAbility } from './tools/tools';
import { abilityExecutor } from './tools/abilityExecutor';
import { SYSTEM_PROMPT } from './prompts/systemPrompt';
import { responseFormatter } from '../services/responseFormatter';

/**
 * HederaAgent - Main AI agent for SaucerHedge
 * Uses Anthropic Gemini 2.5 Flash with dynamic tool selection
 * Executes SaucerHedge abilities based on user intent
 */
export class HederaAgent {
  private client: Anthropic;
  private model: string = config.llm.model;
  private conversationHistory: Map<string, MessageHistory[]> = new Map();
  private executionLog: Array<{
    timestamp: Date;
    userId: string;
    userMessage: string;
    toolUsed?: string;
    result: any;
  }> = [];

  constructor() {
    this.client = new Anthropic({
      apiKey: config.llm.apiKey,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    });

    console.log(`🤖 HederaAgent initialized with model: ${this.model}`);
  }

  /**
   * Process user message and determine which ability to execute
   */
  async processMessage(
    userMessage: string,
    userId: string,
    history: MessageHistory[] = []
  ): Promise<ChatResponseData> {
    try {
      const startTime = Date.now();
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🤖 Agent Processing for User: ${userId}`);
      console.log(`📨 Message: "${userMessage}"`);
      console.log(`📚 History: ${history.length} messages`);

      // Get available tools
      const tools = generateToolsFromAbilities();
      console.log(`🛠️  Available tools: ${tools.length}`);

      // Build messages for Claude
      const messages = [
        ...history.map(h => ({
          role: h.role as 'user' | 'assistant',
          content: h.content,
        })),
        { role: 'user' as const, content: userMessage },
      ];

      console.log(`\n🔄 Calling Gemini 2.5 Flash LLM...`);

      // Call Claude/Gemini with tools
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        tools: tools.map(t => ({
          name: t.name,
          description: t.description,
          input_schema: t.inputSchema,
        })) as Anthropic.Tool[],
        messages: messages as Anthropic.MessageParam[],
      });

      console.log(`✅ LLM Response received`);
      console.log(`🔍 Stop reason: ${response.stop_reason}`);

      // Process response blocks
      let assistantMessage = '';
      let toolUseBlock: Anthropic.ToolUseBlock | null = null;
      let toolName: string = '';

      for (const block of response.content) {
        if (block.type === 'text') {
          assistantMessage += block.text;
          console.log(`📝 Text: ${block.text.substring(0, 50)}...`);
        } else if (block.type === 'tool_use') {
          toolUseBlock = block as Anthropic.ToolUseBlock;
          toolName = block.name;
          console.log(`🎯 Tool Selected: ${toolName}`);
          console.log(`📥 Tool Input:`, JSON.stringify(block.input, null, 2));
        }
      }

      // If tool was used, execute the ability
      if (toolUseBlock) {
        return await this.executeAbilityWithTool(
          toolName,
          toolUseBlock.input,
          assistantMessage,
          userId,
          startTime
        );
      }

      // If no tool was used, return assistant's text response
      const responseData = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: assistantMessage || 'I understand. How can I help you with your hedging strategy?',
        timestamp: new Date(),
      };

      this.logExecution({
        userId,
        userMessage,
        result: responseData,
        executionTime: Date.now() - startTime,
      });

      console.log(`⏱️  Execution time: ${Date.now() - startTime}ms`);
      console.log(`${'='.repeat(60)}\n`);

      return responseData;
    } catch (error: any) {
      console.error(`❌ Message processing failed:`, error);
      this.logExecution({
        userId,
        userMessage,
        result: { error: error.message },
        executionTime: Date.now(),
      });

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I encountered an error processing your request: ${error.message}. Please try again.`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Execute ability based on tool selection
   */
  private async executeAbilityWithTool(
    toolName: string,
    toolInput: any,
    initialContext: string,
    userId: string,
    startTime: number
  ): Promise<ChatResponseData> {
    try {
      console.log(`\n🚀 Executing ability: ${toolName}`);

      // Map tool name to actual ability name
      const abilityName = mapToolNameToAbility(toolName);
      console.log(`📦 Full ability name: ${abilityName}`);

      // Execute the ability
      const executionResult = await abilityExecutor.executeAbility(
        abilityName,
        toolInput
      );

      console.log(`✅ Ability execution result:`, executionResult.success ? 'SUCCESS' : 'FAILED');

      if (executionResult.success) {
        // Format the response
        const formattedResponse = await responseFormatter.formatAbilityResponse(
          abilityName,
          executionResult,
          initialContext
        );

        const responseData = {
          id: Date.now().toString(),
          role: 'assistant' as const,
          content: formattedResponse,
          timestamp: new Date(),
          txHash: executionResult.transactionHash,
          abilities: [toolName],
          toolUsed: toolName,
        };

        this.logExecution({
          userId,
          userMessage: toolName,
          toolUsed: toolName,
          result: responseData,
          executionTime: Date.now() - startTime,
        });

        console.log(`✨ Response formatted successfully`);
        console.log(`⏱️  Total execution time: ${Date.now() - startTime}ms`);
        console.log(`${'='.repeat(60)}\n`);

        return responseData;
      } else {
        throw new Error(executionResult.error || 'Ability execution failed');
      }
    } catch (error: any) {
      console.error(`❌ Tool execution failed:`, error.message);

      const errorMessage = `I attempted to execute ${toolName}, but encountered an error: ${error.message}. Please try again or rephrase your request.`;

      const responseData = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: errorMessage,
        timestamp: new Date(),
      };

      this.logExecution({
        userId,
        userMessage: toolName,
        toolUsed: toolName,
        result: { error: error.message },
        executionTime: Date.now() - startTime,
      });

      console.log(`⏱️  Error execution time: ${Date.now() - startTime}ms`);
      console.log(`${'='.repeat(60)}\n`);

      return responseData;
    }
  }

  /**
   * Get conversation history for user
   */
  getConversationHistory(userId: string): MessageHistory[] {
    return this.conversationHistory.get(userId) || [];
  }

  /**
   * Update conversation history
   */
  updateConversationHistory(userId: string, message: MessageHistory): void {
    const history = this.conversationHistory.get(userId) || [];
    history.push(message);

    // Keep only last 50 messages in memory
    if (history.length > 50) {
      history.shift();
    }

    this.conversationHistory.set(userId, history);
    console.log(`📝 Updated history for ${userId}: ${history.length} messages`);
  }

  /**
   * Log execution for monitoring
   */
  private logExecution(log: {
    userId: string;
    userMessage: string;
    toolUsed?: string;
    result: any;
    executionTime: number;
  }): void {
    this.executionLog.push({
      timestamp: new Date(),
      userId: log.userId,
      userMessage: log.userMessage,
      toolUsed: log.toolUsed,
      result: log.result,
    });

    // Keep only last 1000 logs in memory
    if (this.executionLog.length > 1000) {
      this.executionLog.shift();
    }
  }

  /**
   * Get execution logs (for debugging/analytics)
   */
  getExecutionLogs(
    userId?: string,
    limit: number = 10
  ): Array<{
    timestamp: Date;
    userId: string;
    userMessage: string;
    toolUsed?: string;
    result: any;
  }> {
    let logs = this.executionLog;

    if (userId) {
      logs = logs.filter(l => l.userId === userId);
    }

    return logs.slice(-limit);
  }

  /**
   * Clear conversation history for user
   */
  clearConversationHistory(userId: string): void {
    this.conversationHistory.delete(userId);
    console.log(`🧹 Cleared history for ${userId}`);
  }

  /**
   * Get agent stats
   */
  getStats(): {
    totalExecutions: number;
    conversationsActive: number;
    memoryUsage: string;
  } {
    return {
      totalExecutions: this.executionLog.length,
      conversationsActive: this.conversationHistory.size,
      memoryUsage: `${(
        (this.executionLog.length * 1024 +
          this.conversationHistory.size * 512) /
        1024 /
        1024
      ).toFixed(2)} MB`,
    };
  }
}

/**
 * Singleton instance of HederaAgent
 */
let agentInstance: HederaAgent | null = null;

export function initializeHederaAgent(): HederaAgent {
  if (!agentInstance) {
    agentInstance = new HederaAgent();
    console.log(`✅ HederaAgent singleton initialized`);
  }
  return agentInstance;
}

export function getHederaAgent(): HederaAgent {
  if (!agentInstance) {
    return initializeHederaAgent();
  }
  return agentInstance;
}

export default HederaAgent;
