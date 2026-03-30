import type { Handler } from '@netlify/functions';
import { getAdminClient, json } from './_shared';

export const handler: Handler = async () => {
  try {
    const supabase = getAdminClient();
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (error) throw error;
    return json(200, { isFirstRun: (count ?? 0) === 0 });
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : 'Erro interno' });
  }
};
