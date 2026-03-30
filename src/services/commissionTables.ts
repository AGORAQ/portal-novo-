import { supabase } from '../lib/supabase';
import type { CommissionTable } from '../types/domain';
import type { ImportedCommissionRow } from '../lib/importCommissionFile';

export async function listCommissionTables(): Promise<CommissionTable[]> {
  const { data, error } = await supabase
    .from('commission_tables')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function upsertCommissionRows(rows: ImportedCommissionRow[]) {
  const { error } = await supabase.from('commission_tables').upsert(rows, {
    onConflict: 'banco,produto,codigo_tabela,nome_tabela'
  });

  if (error) throw error;
}
