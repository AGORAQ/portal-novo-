# AgoraQ Portal Rebuild

Projeto refeito do zero com arquitetura única:

- **Frontend:** React + Vite + TypeScript
- **Banco e Auth:** Supabase
- **Funções administrativas:** Netlify Functions
- **Deploy:** Netlify

## O que esta base resolve

1. **Usuários** ficam em um único fluxo: `auth.users` + `profiles`.
2. **Tabelas de comissão** são importadas com cabeçalhos consistentes.
3. **Vendas** calculam comissão da empresa e do vendedor corretamente.
4. **Financeiro** é gerado por trigger no banco, então fica sempre correlacionado com a venda.
5. **Saldos** são calculados por view (`v_balances`), sem depender de campo acumulado quebrado.

## Estrutura

- `src/` frontend
- `netlify/functions/` funções administrativas
- `supabase/schema.sql` schema completo
- `.env.example` variáveis necessárias

## Como subir

### 1. Instale dependências

```bash
npm install
```

### 2. Configure as variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

No Netlify, configure as mesmas variáveis em **Site configuration > Environment variables**.

### 3. Aplique o SQL no Supabase

Abra o SQL Editor e execute `supabase/schema.sql`.

### 4. Rode localmente

```bash
npm run dev
```

### 5. Fluxo de uso

1. Primeiro acesso: cria o admin inicial.
2. Login com o admin.
3. Cadastra usuários.
4. Importa planilha de comissão.
5. Lança vendas.
6. Financeiro é criado automaticamente.

## Observações importantes

- O frontend **não** usa SQLite.
- O frontend **não** mistura `/api` antigo com banco local.
- O sistema usa apenas **Supabase** como fonte de verdade.
- O cálculo do vendedor é:

```text
comissão vendedor = (valor da venda × % empresa) × % grupo do vendedor
```

## IA Studio / Gemini

Se você quiser continuar evoluindo esse projeto no AI Studio, use esta base como origem e peça alterações pontuais. Não peça para a IA “misturar backend local, Supabase e Netlify” no mesmo fluxo.
