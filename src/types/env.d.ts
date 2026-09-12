/**
 * Declares the environment variables the site reads so `process.env.X` is typed (Next.js
 * inlines NEXT_PUBLIC_* only for dot-access member expressions). Keep in sync with
 * `.env.example` and `src/lib/env.ts`.
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SITE_URL?: string;
      NEXT_PUBLIC_APP_URL?: string;
      NEXT_PUBLIC_WHATSAPP?: string;
      APP_VERSION?: string;
    }
  }
}

export {};
