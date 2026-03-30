import { useEffect, useState } from 'react';
import { listBalances } from '../services/finance';
import { listSales } from '../services/sales';
import { formatCurrency } from '../lib/utils';
import type { BalanceSummary, Sale } from '../types/domain';

export function DashboardPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [balances, setBalances] = useState<BalanceSummary[]>([]);

  useEffect(() => {
    Promise.all([listSales(), listBalances()]).then(([salesData, balanceData]) => {
      setSales(salesData);
      setBalances(balanceData);
    });
  }, []);

  const totalVendas = sales.reduce((sum, item) => sum + Number(item.valor_venda || 0), 0);
  const totalComissaoEmpresa = sales.reduce((sum, item) => sum + Number(item.valor_comissao_empresa || 0), 0);
  const totalComissaoVendedores = sales.reduce((sum, item) => sum + Number(item.valor_comissao_vendedor || 0), 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Visão consolidada das vendas e saldos.</p>
      </div>

      <div className="stats-grid">
        <div className="card stat-card"><span>Total vendido</span><strong>{formatCurrency(totalVendas)}</strong></div>
        <div className="card stat-card"><span>Comissão empresa</span><strong>{formatCurrency(totalComissaoEmpresa)}</strong></div>
        <div className="card stat-card"><span>Comissão vendedores</span><strong>{formatCurrency(totalComissaoVendedores)}</strong></div>
      </div>

      <div className="card">
        <h2>Saldos por vendedor</h2>
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
    </div>
  );
}
