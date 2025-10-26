import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/env';
import { MessageHistory, ChatResponseData } from '../types';
import { generateToolsFromAbilities, mapToolNameToAbility } from './tools/tools';
import { abilityExecutor } from './tools/abilityExecutor';
import { SYSTEM_PROMPT } from './prompts/systemPrompt';
import { responseFormatter } from '../services/responseFormatter';

const anthropic = new Anthropic({
  apiKey: config.llm.apiKey,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

export class AgentMessenger {
  async processMessage(
    userMessage: string,
    history: MessageHistory[]
  ): Promise<ChatResponseData> {
    try {
      const tools = generateToolsFromAbilities();
      
      // Build messages array
      const messages = [
        ...history.map(h => ({
          role: h.role as 'user' | 'assistant',
          content: h.content,
        })),
        { role: 'user' as const, content: userMessage },
      ];

      console.log(`\n🤖 Agent Processing: "${userMessage}"`);
      console.log(`📚 History length: ${history.length}`);
      console.log(`🛠️  Available tools: ${tools.length}`);

      // Call Claude/Gemini with tools
      const response = await anthropic.messages.create({
        model: config.llm.model,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        tools: tools.map(t => ({
          name: t.name,
          description: t.description,
          input_schema: t.inputSchema,
        })) as any,
        messages: messages as any,
      });

      console.log(`✅ LLM Response received, stop_reason: ${response.stop_reason}`);

      // Process response
      let assistantMessage = '';
      let toolUseBlock: any = null;
      let toolName: string = '';

      for (const block of response.content) {
        if (block.type === 'text') {
          assistantMessage += block.text;
        } else if (block.type === 'tool_use') {
          toolUseBlock = block;
          toolName = block.name;
        }
      }

      // If tool was used, execute the ability
      if (toolUseBlock) {
        console.log(`\n🎯 Tool Selected: ${toolName}`);
        console.log(`📥 Tool Input:`, toolUseBlock.input);

        try {
          // Map tool name to actual ability name
          const abilityName = mapToolNameToAbility(toolName);
          
          // Execute the ability
          const executionResult = await abilityExecutor.executeAbility(
            abilityName,
            toolUseBlock.input
          );

          if (executionResult.success) {
            console.log(`✅ Ability executed successfully`);
            
            // Format the response
            const formattedResponse = await responseFormatter.formatAbilityResponse(
              abilityName,
              executionResult,
              assistantMessage
            );

            return {
              id: Date.now().toString(),
              role: 'assistant',
              content: formattedResponse,
              timestamp: new Date(),
              txHash: executionResult.transactionHash,
              abilities: [toolName],
              toolUsed: toolName,
            };
          } else {
            throw new Error(executionResult.error || 'Ability execution failed');
          }
        } catch (error: any) {
          console.error(`❌ Tool execution failed:`, error.message);
          
          const errorMessage = `I attempted to execute ${toolName}, but encountered an error: ${error.message}. Please try again or rephrase your request.`;
          
          return {
            id: Date.now().toString(),
            role: 'assistant',
            content: errorMessage,
            timestamp: new Date(),
          };
        }
      }

      // If no tool was used, return assistant's text response
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: assistantMessage || 'I understand. How can I help you with your hedging strategy?',
        timestamp: new Date(),
      };
    } catch (error: any) {
      console.error(`❌ Message processing failed:`, error);
      
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I encountered an error processing your request: ${error.message}. Please try again.`,
        timestamp: new Date(),
      };
    }
  }
}

export const agentMessenger = new AgentMessenger();
