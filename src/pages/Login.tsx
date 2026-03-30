import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../services/auth';
import { bootstrapAdmin, checkFirstRun } from '../services/users';

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'bootstrap'>('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkFirstRun()
      .then((data) => setMode(data.isFirstRun ? 'bootstrap' : 'login'))
      .catch((error) => setMessage(error.message));
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setLoading(true);
    setMessage('');

    try {
      await signIn(String(formData.get('email')), String(formData.get('password')));
      navigate('/');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha no login');
    } finally {
      setLoading(false);
    }
  }

  async function handleBootstrap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setLoading(true);
    setMessage('');

    try {
      await bootstrapAdmin({
        email: String(formData.get('email')),
        password: String(formData.get('password')),
        full_name: String(formData.get('full_name'))
      });
      setMode('login');
      setMessage('Admin inicial criado. Faça login com as credenciais cadastradas.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao criar admin inicial');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page auth-page">
      <div className="card auth-card">
        <h1>AgoraQ Portal</h1>
        <p>{mode === 'bootstrap' ? 'Primeiro acesso: crie o admin inicial.' : 'Entre para acessar o sistema.'}</p>

        {mode === 'bootstrap' ? (
          <form onSubmit={handleBootstrap} className="grid-form">
            <label>
              Nome completo
              <input name="full_name" required />
            </label>
            <label>
              E-mail
              <input name="email" type="email" required />
            </label>
            <label>
              Senha
              <input name="password" type="password" minLength={6} required />
            </label>
            <button className="button" disabled={loading}>{loading ? 'Criando...' : 'Criar admin inicial'}</button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="grid-form">
            <label>
              E-mail
              <input name="email" type="email" required />
            </label>
            <label>
              Senha
              <input name="password" type="password" required />
            </label>
            <button className="button" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
          </form>
        )}

        {message && <div className="alert">{message}</div>}
      </div>
    </div>
  );
}
