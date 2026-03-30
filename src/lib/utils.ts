import type { CommissionGroup } from '../types/domain';

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));
}

export function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function getSellerRate(group: CommissionGroup, row: {
  grupo_master: number;
  grupo_ouro: number;
  grupo_prata: number;
  grupo_plus: number;
}) {
  switch (group) {
    case 'master':
      return Number(row.grupo_master || 0);
    case 'ouro':
      return Number(row.grupo_ouro || 0);
    case 'prata':
      return Number(row.grupo_prata || 0);
    case 'plus':
      return Number(row.grupo_plus || 0);
    default:
      return 0;
  }
}

export function requiredEnv(value: string | undefined, name: string) {
  if (!value) throw new Error(`Variável ausente: ${name}`);
  return value;
}
