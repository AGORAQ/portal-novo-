import { supabase } from '../lib/supabase';
import type { Sale } from '../types/domain';

export type CreateSaleInput = Omit<Sale, 'id' | 'created_at' | 'valor_comissao_empresa' | 'valor_comissao_vendedor'> & {
  valor_comissao_empresa?: number;
  valor_comissao_vendedor?: number;
};

export async function listSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createSale(input: CreateSaleInput) {
  const { error } = await supabase.from('sales').insert({
    ...input,
    valor_comissao_empresa: input.valor_comissao_empresa ?? 0,
    valor_comissao_vendedor: input.valor_comissao_vendedor ?? 0
  });

  if (error) throw error;
}

export async function updateSaleStatus(saleId: string, status: Sale['status']) {
  const { error } = await supabase
    .from('sales')
    .update({ status })
    .eq('id', saleId);

  if (error) throw error;
}
