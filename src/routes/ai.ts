import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { nvidia } from '../lib/nvidia';
import { NIM_MODELS, type ModelKey } from '../config/models';

const ai = new Hono();

ai.post('/generate', async (c) => {
  const { prompt, modelChoice } = await c.req.json<{ prompt: string, modelChoice?: ModelKey }>();

  // Fallback to 'BALANCED' if the user doesn't provide a choice
  const selectedModel = NIM_MODELS[modelChoice || 'BALANCED'];

  const response = await nvidia.chat.completions.create({
    model: selectedModel,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  return streamSSE(c, async (stream) => {
    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        await stream.writeSSE({ data: content });
      }
    }
  });
});

export default ai;