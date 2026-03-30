import type { Handler } from '@netlify/functions';
import { getAdminClient, getBody, json } from './_shared';

interface Payload {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'supervisor' | 'vendedor';
  commission_group: 'master' | 'ouro' | 'prata' | 'plus';
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return json(405, { error: 'Método não permitido' });

    const supabase = getAdminClient();
    const payload = getBody<Payload>(event);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        full_name: payload.full_name,
        role: payload.role,
        commission_group: payload.commission_group
      }
    });

    if (authError) throw authError;

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authData.user.id,
      email: payload.email,
      full_name: payload.full_name,
      role: payload.role,
      commission_group: payload.commission_group,
      is_active: true
    });

    if (profileError) throw profileError;

    return json(200, { success: true, userId: authData.user.id });
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : 'Erro interno' });
  }
};
