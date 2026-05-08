import {z} from 'zod';

const envSchema = z.object({
    NVIDIA_API_KEY: z.string().startsWith('nvapi-'),
    PORT : z.string().default('3000'),
    DATABASE_URL: z.string(),
    NODE_ENV : z.enum(['development','production']).default('development'),
    BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
    BETTER_AUTH_URL: z.string().default('http://localhost:3000'),
});
export const env = envSchema.parse(process.env);