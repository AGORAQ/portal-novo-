import { ChangeEvent, useEffect, useState } from 'react';
import { importCommissionFile } from '../lib/importCommissionFile';
import { formatCurrency } from '../lib/utils';
import { listCommissionTables, upsertCommissionRows } from '../services/commissionTables';
import type { CommissionTable } from '../types/domain';

export function CommissionTablesPage() {
  const [rows, setRows] = useState<CommissionTable[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    const data = await listCommissionTables();
    setRows(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setMessage('');

    try {
      const parsed = await importCommissionFile(file);
      await upsertCommissionRows(parsed);
      await load();
      setMessage(`Importação concluída: ${parsed.length} linhas processadas.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha na importação');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Tabelas de comissão</h1>
        <p>Upload único, com mapeamento consistente de colunas.</p>
      </div>

      <div className="card">
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} />
        {loading && <p>Importando...</p>}
        {message && <div className="alert">{message}</div>}
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Banco</th>
              <th>Produto</th>
              <th>Operação</th>
              <th>Tabela</th>
              <th>Empresa</th>
              <th>Ouro</th>
              <th>Master</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.banco}</td>
                <td>{row.produto}</td>
                <td>{row.operacao}</td>
                <td>{row.nome_tabela}</td>
                <td>{row.comissao_total_empresa}%</td>
                <td>{row.grupo_ouro}%</td>
                <td>{row.grupo_master}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted">Percentuais configurados na tabela. O valor em dinheiro é calculado apenas na venda.</p>
      </div>
    </div>
  );
}
