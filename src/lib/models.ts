export interface AIModel {
  id: string;
  name: string;
  provider: string;
}
export const MODELS: AIModel[] = [
  { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 (8B)', provider: 'Meta' },
  { id: 'deepseek-ai/deepseek-v3.1', name: 'DeepSeek V3.1', provider: 'DeepSeek' },
  { id: 'google/gemma-2-9b-it', name: 'Gemma 2 (9B)', provider: 'Google' },
  { id: 'snowflake/arctic', name: 'Snowflake Arctic', provider: 'Snowflake' },
];
export const DEFAULT_MODEL = MODELS[0].id;