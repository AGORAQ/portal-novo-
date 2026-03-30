import { FormEvent, useEffect, useState } from 'react';
import { createUser, listProfiles, updateProfile } from '../services/users';
import type { CommissionGroup, Profile, UserRole } from '../types/domain';

export function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const data = await listProfiles();
    setUsers(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMessage('');

    try {
      await createUser({
        email: String(formData.get('email')),
        password: String(formData.get('password')),
        full_name: String(formData.get('full_name')),
        role: String(formData.get('role')) as UserRole,
        commission_group: String(formData.get('commission_group')) as CommissionGroup
      });
      event.currentTarget.reset();
      await load();
      setMessage('Usuário criado com sucesso.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao criar usuário');
    }
  }

  async function toggleStatus(user: Profile) {
    await updateProfile(user.id, { is_active: !user.is_active });
    await load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Usuários</h1>
        <p>Cadastro centralizado via Supabase Auth + profiles.</p>
      </div>

      <div className="two-columns">
        <div className="card">
          <h2>Novo usuário</h2>
          <form className="grid-form" onSubmit={handleCreate}>
            <label>Nome completo<input name="full_name" required /></label>
            <label>E-mail<input name="email" type="email" required /></label>
            <label>Senha<input name="password" type="password" minLength={6} required /></label>
            <label>Perfil
              <select name="role" defaultValue="vendedor">
                <option value="admin">admin</option>
                <option value="supervisor">supervisor</option>
                <option value="vendedor">vendedor</option>
              </select>
            </label>
            <label>Grupo de comissão
              <select name="commission_group" defaultValue="ouro">
                <option value="master">master</option>
                <option value="ouro">ouro</option>
                <option value="prata">prata</option>
                <option value="plus">plus</option>
              </select>
            </label>
            <button className="button">Criar usuário</button>
          </form>
          {message && <div className="alert">{message}</div>}
        </div>

        <div className="card">
          <h2>Usuários cadastrados</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Grupo</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.full_name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.commission_group}</td>
                  <td>{user.is_active ? 'Ativo' : 'Inativo'}</td>
                  <td>
                    <button className="button button-secondary" onClick={() => toggleStatus(user)}>
                      {user.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
