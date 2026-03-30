export type UserRole = 'admin' | 'supervisor' | 'vendedor';
export type CommissionGroup = 'master' | 'ouro' | 'prata' | 'plus';
export type SaleStatus = 'Pendente' | 'Pago' | 'Cancelado';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  commission_group: CommissionGroup;
  is_active: boolean;
  created_at: string;
}

export interface CommissionTable {
  id: string;
  banco: string;
  produto: string;
  operacao: string;
  codigo_tabela: string;
  nome_tabela: string;
  parcelas: number | null;
  comissao_total_empresa: number;
  grupo_master: number;
  grupo_ouro: number;
  grupo_prata: number;
  grupo_plus: number;
  created_at: string;
}

export interface Sale {
  id: string;
  vendedor_id: string;
  vendedor_nome: string;
  cliente: string;
  cpf: string | null;
  phone: string | null;
  proposal: string | null;
  banco: string;
  produto: string;
  tabela_id: string | null;
  tabela_nome: string;
  parcelas: number | null;
  valor_venda: number;
  percentual_empresa: number;
  grupo_vendedor: CommissionGroup;
  percentual_vendedor: number;
  valor_comissao_empresa: number;
  valor_comissao_vendedor: number;
  status: SaleStatus;
  data_venda: string;
  created_at: string;
}

export interface FinanceEntry {
  id: string;
  sale_id: string;
  vendedor_id: string;
  tipo: 'credito' | 'debito';
  descricao: string;
  valor: number;
  status: 'aberto' | 'pago' | 'cancelado';
  referencia_data: string;
  created_at: string;
}

export interface BalanceSummary {
  vendedor_id: string;
  full_name: string;
  total_creditos: number;
  total_debitos: number;
  saldo_disponivel: number;
}
