import { createClient } from '@supabase/supabase-js';
import type { HandlerEvent } from '@netlify/functions';

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável ausente: ${name}`);
  return value;
}

export function getAdminClient() {
  return createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

export function getBody<T>(event: HandlerEvent): T {
  return event.body ? JSON.parse(event.body) : ({} as T);
}
