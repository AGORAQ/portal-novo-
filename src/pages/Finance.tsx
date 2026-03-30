import { useEffect, useState } from 'react';
import { listBalances, listFinanceEntries } from '../services/finance';
import { formatCurrency } from '../lib/utils';
import type { BalanceSummary, FinanceEntry } from '../types/domain';

export function FinancePage() {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [balances, setBalances] = useState<BalanceSummary[]>([]);

  useEffect(() => {
    Promise.all([listFinanceEntries(), listBalances()]).then(([entriesData, balancesData]) => {
      setEntries(entriesData);
      setBalances(balancesData);
    });
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Financeiro</h1>
        <p>Dados correlacionados automaticamente com as vendas.</p>
      </div>

      <div className="card">
        <h2>Saldos</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Vendedor</th>
              <th>Créditos</th>
              <th>Débitos</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {balances.map((item) => (
              <tr key={item.vendedor_id}>
                <td>{item.full_name}</td>
                <td>{formatCurrency(item.total_creditos)}</td>
                <td>{formatCurrency(item.total_debitos)}</td>
                <td>{formatCurrency(item.saldo_disponivel)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Lançamentos financeiros</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.tipo}</td>
                <td>{entry.descricao}</td>
                <td>{formatCurrency(entry.valor)}</td>
                <td>{entry.status}</td>
                <td>{entry.referencia_data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
