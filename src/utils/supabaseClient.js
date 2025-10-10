import { createClient } from "@supabase/supabase-js";
// Prefer Expo public env vars when available. For local development you can
// populate `src/utils/localSupabaseConfig.js` (gitignored) with your keys.
// If set there, we'll copy them into process.env so tooling that expects env
// variables works the same.
try {
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  const local = require("./localSupabaseConfig");
  if (local && typeof local === "object") {
    if (local.SUPABASE_URL && !process.env.EXPO_PUBLIC_SUPABASE_URL) {
      // eslint-disable-next-line no-console
      console.warn('Loaded SUPABASE_URL from src/utils/localSupabaseConfig.js (development only). Do not commit secrets.');
      process.env.EXPO_PUBLIC_SUPABASE_URL = local.SUPABASE_URL;
    }
    if (local.SUPABASE_ANON_KEY && !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
      // eslint-disable-next-line no-console
      console.warn('Loaded SUPABASE_ANON_KEY from src/utils/localSupabaseConfig.js (development only). Do not commit secrets.');
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = local.SUPABASE_ANON_KEY;
    }
  }
} catch {
  // ignore if the file does not exist
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://bogodpelgnffykaiudsy.supabase.co";

let SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// If someone accidentally wrapped the key in quotes in env files, trim them.
if (/^["'].*["']$/.test(SUPABASE_ANON_KEY)) {
  // eslint-disable-next-line no-console
  console.warn('EXPO_PUBLIC_SUPABASE_ANON_KEY appears to be wrapped in quotes — trimming surrounding quotes.');
  SUPABASE_ANON_KEY = SUPABASE_ANON_KEY.slice(1, -1);
}

if (!SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn('EXPO_PUBLIC_SUPABASE_ANON_KEY is not set. Realtime and authenticated requests will likely fail.');
}

// If the anon key is missing, calling createClient will throw during import/time.
// To avoid crashing the app routes at module-eval time, provide a minimal
// no-op supabase-like client that surfaces friendly errors when used.
function createNoopClient() {
  const noop = () => ({ data: null, error: { message: 'Supabase client not configured. Set EXPO_PUBLIC_SUPABASE_ANON_KEY.' } });

  const chainable = () => ({ select: () => chainable(), eq: () => chainable(), single: async () => noop(), limit: () => chainable(), order: () => chainable() });

  return {
    from: () => chainable(),
    rpc: async () => noop(),
    auth: {
      signIn: async () => noop(),
      signOut: async () => noop(),
      getUser: async () => ({ data: null, error: { message: 'Supabase auth not configured' } }),
    },
    storage: {
      from: () => ({ upload: async () => ({ data: null, error: { message: 'Storage not configured' } }) }),
    },
  };
}

export const supabase = SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : createNoopClient();

export default supabase;
