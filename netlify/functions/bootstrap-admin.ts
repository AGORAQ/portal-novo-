import type { Handler } from '@netlify/functions';
import { getAdminClient, getBody, json } from './_shared';

interface Payload {
  email: string;
  password: string;
  full_name: string;
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return json(405, { error: 'Método não permitido' });

    const supabase = getAdminClient();
    const { email, password, full_name } = getBody<Payload>(event);

    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    if ((count ?? 0) > 0) return json(400, { error: 'Admin inicial já existe' });

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: 'admin',
        commission_group: 'master'
      }
    });

    if (authError) throw authError;

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authData.user.id,
      email,
      full_name,
      role: 'admin',
      commission_group: 'master',
      is_active: true
    });

    if (profileError) throw profileError;

    return json(200, { success: true });
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : 'Erro interno' });
  }
};
