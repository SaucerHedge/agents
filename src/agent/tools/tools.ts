import { ToolDefinition, AbilityMetadata } from '../../types';
import { getAllCachedAbilities } from './abilityLoader';

export function generateToolsFromAbilities(): ToolDefinition[] {
  const abilities = getAllCachedAbilities();
  const tools: ToolDefinition[] = [];

  for (const ability of abilities) {
    const toolName = ability.name.split('/')[1].replace(/-ability$/, '');

    tools.push({
      name: toolName,
      description: ability.description,
      inputSchema: ability.inputs,
    });
  }

  return tools;
}

export function getToolByName(toolName: string): ToolDefinition | null {
  const tools = generateToolsFromAbilities();
  return tools.find(t => t.name === toolName) || null;
}

export function mapToolNameToAbility(toolName: string): string {
  const abilities = getAllCachedAbilities();
  
  for (const ability of abilities) {
    const abilityToolName = ability.name.split('/')[1].replace(/-ability$/, '');
    if (abilityToolName === toolName) {
      return ability.name;
    }
  }

  throw new Error(`Unknown tool: ${toolName}`);
}
