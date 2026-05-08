export const NIM_MODELS = {
  FAST: 'meta/llama-3.1-8b-instruct',
  BALANCED: 'meta/llama-3.3-70b-instruct',
  CODING: 'qwen/qwen2.5-coder-32b-instruct',
  REASONING: 'deepseek-ai/deepseek-v4-pro',
} as const;

export type ModelKey = keyof typeof NIM_MODELS;