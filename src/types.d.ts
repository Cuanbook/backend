import { Context as HonoContext } from 'hono';

declare module 'hono' {
  interface ContextVariableMap {
    user: {
      userId: string;
    };
  }
}

interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
}

type Context = HonoContext<{ Bindings: Env }>;

export type { Context, Env }; 