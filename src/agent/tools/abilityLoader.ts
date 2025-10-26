import axios from 'axios';
import { config } from '../../config/env';
import { AbilityMetadata } from '../../types';

const abilities = [
  '@saucerhedgevault/open-hedged-position-ability',
  '@saucerhedgevault/close-hedged-position-ability',
  '@saucerhedgevault/open-vault-hedged-position-ability',
  '@saucerhedgevault/close-vault-hedged-position-ability',
  '@saucerhedgevault/get-position-status-ability',
  '@saucerhedgevault/deposit-to-vault-ability',
];

const abilityCache = new Map<string, AbilityMetadata>();

export async function loadAbilityMetadata(abilityName: string): Promise<AbilityMetadata> {
  if (abilityCache.has(abilityName)) {
    return abilityCache.get(abilityName)!;
  }

  try {
    // Fetch from NPM registry
    const response = await axios.get(
      `${config.npm.registry}/${abilityName}/latest`,
      {
        timeout: 10000,
      }
    );

    const pkgJson = response.data;
    
    // Fetch metadata file from dist
    const metadataUrl = `${config.npm.registry}/${abilityName}/latest/dist/src/generated/vincent-ability-metadata.json`;
    const metadataResponse = await axios.get(metadataUrl);
    const metadata = metadataResponse.data;

    const abilityMetadata: AbilityMetadata = {
      name: abilityName,
      version: pkgJson.version,
      description: pkgJson.description,
      ipfsCid: metadata.ipfsCid,
      supportedPolicies: metadata.supportedPolicies || [],
      inputs: metadata.inputs || {
        type: 'object',
        properties: {},
        required: [],
      },
    };

    abilityCache.set(abilityName, abilityMetadata);
    console.log(`✅ Loaded ability: ${abilityName}`);
    return abilityMetadata;
  } catch (error) {
    console.error(`❌ Failed to load ability ${abilityName}:`, error);
    throw new Error(`Failed to load ability: ${abilityName}`);
  }
}

export async function loadAllAbilities(): Promise<AbilityMetadata[]> {
  const loadedAbilities: AbilityMetadata[] = [];

  for (const ability of abilities) {
    try {
      const metadata = await loadAbilityMetadata(ability);
      loadedAbilities.push(metadata);
    } catch (error) {
      console.warn(`⚠️ Skipping ability ${ability}:`, error);
    }
  }

  console.log(`✅ Loaded ${loadedAbilities.length} abilities`);
  return loadedAbilities;
}

export function getAbilityByName(abilityName: string): AbilityMetadata | null {
  return abilityCache.get(abilityName) || null;
}

export function getAllCachedAbilities(): AbilityMetadata[] {
  return Array.from(abilityCache.values());
}
