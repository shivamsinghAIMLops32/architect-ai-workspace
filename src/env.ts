import {z} from 'zod';

const envSchema = z.object({
    NVIDIA_API_KEY: z.string().startsWith('nvapi-'),
    PORT : z.string().default('3000'),
    NODE_ENV : z.enum(['development','production']).default('development'),
});
export const env = envSchema.parse(process.env);