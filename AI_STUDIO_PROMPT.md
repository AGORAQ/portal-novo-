Refatore este projeto SEM alterar a arquitetura base abaixo:

- Frontend em React + Vite + TypeScript
- Banco e autenticação somente no Supabase
- Funções administrativas somente em Netlify Functions
- Não criar SQLite
- Não criar Express server separado
- Não duplicar fontes de dados
- Não salvar valores agregados redundantes se puderem ser obtidos por view/trigger

Regras obrigatórias:
1. Toda autenticação deve usar Supabase Auth.
2. Todo perfil deve estar em `profiles` com FK para `auth.users.id`.
3. Toda venda deve salvar apenas na tabela `sales`.
4. Toda correlação com financeiro deve ocorrer por trigger SQL, nunca por lógica duplicada em várias telas.
5. Não misturar nomes de campos para o mesmo conceito.
6. Manter estes nomes canônicos:
   - commission_tables.nome_tabela
   - sales.tabela_nome
   - sales.valor_venda
   - sales.valor_comissao_empresa
   - sales.valor_comissao_vendedor
   - profiles.commission_group
7. Qualquer alteração de schema deve incluir SQL de migração.
8. Qualquer tela nova deve consumir apenas services centralizados.
9. Todo upload de tabela deve respeitar os aliases definidos em `src/lib/importCommissionFile.ts`.
10. Nenhum campo pode ser salvo com nome diferente do schema oficial.

Ao propor mudanças, entregue:
- arquivo alterado completo
- motivo técnico da alteração
- impacto nas tabelas e nas policies
