import { supabase } from '../lib/supabase';
import type { Profile } from '../types/domain';

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateProfile(profileId: string, payload: Partial<Profile>) {
  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', profileId);

  if (error) throw error;
}

export interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  role: Profile['role'];
  commission_group: Profile['commission_group'];
}

export async function createUser(input: CreateUserInput) {
  const response = await fetch('/api/admin-create-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Falha ao criar usuário');
  return data;
}

export async function checkFirstRun() {
  const response = await fetch('/api/check-first-run');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Falha ao verificar primeiro acesso');
  return data as { isFirstRun: boolean };
}

export async function bootstrapAdmin(input: { email: string; password: string; full_name: string }) {
  const response = await fetch('/api/bootstrap-admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Falha ao criar admin inicial');
  return data;
}
