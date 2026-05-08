import { OpenAI } from "openai";
import { env } from "../env";

export const nvidia = new OpenAI({
  apiKey: env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});