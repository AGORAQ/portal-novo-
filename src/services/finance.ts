import { supabase } from '../lib/supabase';
import type { BalanceSummary, FinanceEntry } from '../types/domain';

export async function listFinanceEntries(): Promise<FinanceEntry[]> {
  const { data, error } = await supabase
    .from('finance_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function listBalances(): Promise<BalanceSummary[]> {
  const { data, error } = await supabase
    .from('v_balances')
    .select('*')
    .order('full_name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as BalanceSummary[];
}
