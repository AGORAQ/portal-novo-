import { FormEvent, useEffect, useMemo, useState } from 'react';
import { listCommissionTables } from '../services/commissionTables';
import { listSales, createSale, updateSaleStatus } from '../services/sales';
import { listProfiles } from '../services/users';
import { formatCurrency, getSellerRate, parseNumber, todayIsoDate } from '../lib/utils';
import type { CommissionTable, Profile, Sale } from '../types/domain';
import { useAuth } from '../context/AuthContext';

export function SalesPage() {
  const { profile } = useAuth();
  const [tables, setTables] = useState<CommissionTable[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [message, setMessage] = useState('');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [selectedSellerId, setSelectedSellerId] = useState('');
  const [saleValueText, setSaleValueText] = useState('');

  async function load() {
    const [tablesData, usersData, salesData] = await Promise.all([
      listCommissionTables(),
      listProfiles(),
      listSales()
    ]);

    setTables(tablesData);
    setUsers(usersData.filter((item) => item.role === 'vendedor' || item.role === 'supervisor'));
    setSales(salesData);
  }

  useEffect(() => {
    load();
  }, []);

  const selectedTable = useMemo(
    () => tables.find((item) => item.id === selectedTableId) ?? null,
    [tables, selectedTableId]
  );

  const selectedSeller = useMemo(
    () => users.find((item) => item.id === selectedSellerId) ?? null,
    [users, selectedSellerId]
  );

  const preview = useMemo(() => {
    const saleValue = parseNumber(saleValueText);
    if (!selectedTable || !selectedSeller || !saleValue) return null;

    const companyRate = Number(selectedTable.comissao_total_empresa || 0) / 100;
    const sellerRate = getSellerRate(selectedSeller.commission_group, selectedTable) / 100;
    const companyCommission = saleValue * companyRate;
    const sellerCommission = companyCommission * sellerRate;

    return {
      saleValue,
      companyRate: companyRate * 100,
      sellerRate: sellerRate * 100,
      companyCommission,
      sellerCommission
    };
  }, [saleValueText, selectedSeller, selectedTable]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMessage('');

    if (!selectedTable || !selectedSeller || !preview) {
      setMessage('Selecione vendedor, tabela e valor da venda.');
      return;
    }

    try {
      await createSale({
        vendedor_id: selectedSeller.id,
        vendedor_nome: selectedSeller.full_name,
        cliente: String(formData.get('cliente')),
        cpf: String(formData.get('cpf') || '') || null,
        phone: String(formData.get('phone') || '') || null,
        proposal: String(formData.get('proposal') || '') || null,
        banco: selectedTable.banco,
        produto: selectedTable.produto,
        tabela_id: selectedTable.id,
        tabela_nome: selectedTable.nome_tabela,
        parcelas: selectedTable.parcelas,
        valor_venda: preview.saleValue,
        percentual_empresa: preview.companyRate,
        grupo_vendedor: selectedSeller.commission_group,
        percentual_vendedor: preview.sellerRate,
        valor_comissao_empresa: preview.companyCommission,
        valor_comissao_vendedor: preview.sellerCommission,
        status: 'Pendente',
        data_venda: String(formData.get('data_venda') || todayIsoDate())
      });

      event.currentTarget.reset();
      setSelectedTableId('');
      setSelectedSellerId(profile?.role === 'vendedor' ? profile.id : '');
      setSaleValueText('');
      await load();
      setMessage('Venda lançada com sucesso.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao lançar venda');
    }
  }

  useEffect(() => {
    if (profile?.role === 'vendedor') setSelectedSellerId(profile.id);
  }, [profile]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Vendas</h1>
        <p>Venda gera financeiro automaticamente no banco via trigger.</p>
      </div>

      <div className="two-columns">
        <div className="card">
          <h2>Nova venda</h2>
          <form className="grid-form" onSubmit={handleSubmit}>
            {(profile?.role === 'admin' || profile?.role === 'supervisor') ? (
              <label>Vendedor
                <select value={selectedSellerId} onChange={(e) => setSelectedSellerId(e.target.value)} required>
                  <option value="">Selecione</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.full_name} - {user.commission_group}</option>
                  ))}
                </select>
              </label>
            ) : (
              <label>Vendedor<input value={profile?.full_name ?? ''} disabled /></label>
            )}

            <label>Tabela de comissão
              <select value={selectedTableId} onChange={(e) => setSelectedTableId(e.target.value)} required>
                <option value="">Selecione</option>
                {tables.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.banco} | {item.produto} | {item.nome_tabela}
                  </option>
                ))}
              </select>
            </label>

            <label>Cliente<input name="cliente" required /></label>
            <label>CPF<input name="cpf" /></label>
            <label>Telefone<input name="phone" /></label>
            <label>Proposta<input name="proposal" /></label>
            <label>Data da venda<input type="date" name="data_venda" defaultValue={todayIsoDate()} required /></label>
            <label>Valor da venda<input value={saleValueText} onChange={(e) => setSaleValueText(e.target.value)} required /></label>

            {preview && (
              <div className="preview-box">
                <div>Comissão empresa: {formatCurrency(preview.companyCommission)} ({preview.companyRate.toFixed(2)}%)</div>
                <div>Comissão vendedor: {formatCurrency(preview.sellerCommission)} ({preview.sellerRate.toFixed(2)}%)</div>
              </div>
            )}

            <button className="button">Salvar venda</button>
          </form>
          {message && <div className="alert">{message}</div>}
        </div>

        <div className="card">
          <h2>Últimas vendas</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Vendedor</th>
                <th>Valor</th>
                <th>Comissão</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sales.map((item) => (
                <tr key={item.id}>
                  <td>{item.cliente}</td>
                  <td>{item.vendedor_nome}</td>
                  <td>{formatCurrency(item.valor_venda)}</td>
                  <td>{formatCurrency(item.valor_comissao_vendedor)}</td>
                  <td>{item.status}</td>
                  <td>
                    {item.status !== 'Pago' && (
                      <button className="button button-secondary" onClick={() => updateSaleStatus(item.id, 'Pago').then(load)}>
                        Marcar pago
                      </button>
                    )}
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
