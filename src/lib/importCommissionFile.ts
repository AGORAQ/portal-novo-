import * as XLSX from 'xlsx';
import { parseNumber } from './utils';

export interface ImportedCommissionRow {
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
}

const aliasMap: Record<string, keyof ImportedCommissionRow> = {
  banco: 'banco',
  produto: 'produto',
  operacao: 'operacao',
  operação: 'operacao',
  codigo: 'codigo_tabela',
  'codigo tabela': 'codigo_tabela',
  'código tabela': 'codigo_tabela',
  tabela: 'nome_tabela',
  'nome tabela': 'nome_tabela',
  'nome da tabela': 'nome_tabela',
  parcelas: 'parcelas',
  'prazo': 'parcelas',
  'comissao total empresa': 'comissao_total_empresa',
  'comissão total empresa': 'comissao_total_empresa',
  'grupo master': 'grupo_master',
  master: 'grupo_master',
  'grupo ouro': 'grupo_ouro',
  ouro: 'grupo_ouro',
  'grupo prata': 'grupo_prata',
  prata: 'grupo_prata',
  'grupo plus': 'grupo_plus',
  plus: 'grupo_plus'
};

function normalizeHeader(header: string): string {
  return header
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export async function importCommissionFile(file: File): Promise<ImportedCommissionRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const parsedRows = rawRows.map((row) => {
    const output: Partial<ImportedCommissionRow> = {};

    for (const [rawKey, rawValue] of Object.entries(row)) {
      const mappedKey = aliasMap[normalizeHeader(rawKey)];
      if (!mappedKey) continue;

      if (mappedKey === 'parcelas') {
        const n = Number(rawValue);
        output[mappedKey] = Number.isFinite(n) ? n : null;
      } else if (['comissao_total_empresa', 'grupo_master', 'grupo_ouro', 'grupo_prata', 'grupo_plus'].includes(mappedKey)) {
        output[mappedKey] = parseNumber(rawValue);
      } else {
        output[mappedKey] = String(rawValue ?? '').trim();
      }
    }

    return {
      banco: output.banco || '',
      produto: output.produto || '',
      operacao: output.operacao || '',
      codigo_tabela: output.codigo_tabela || '',
      nome_tabela: output.nome_tabela || '',
      parcelas: output.parcelas ?? null,
      comissao_total_empresa: output.comissao_total_empresa || 0,
      grupo_master: output.grupo_master || 0,
      grupo_ouro: output.grupo_ouro || 0,
      grupo_prata: output.grupo_prata || 0,
      grupo_plus: output.grupo_plus || 0
    } satisfies ImportedCommissionRow;
  });

  const validRows = parsedRows.filter((row) => {
    return Boolean(row.banco && row.produto && row.nome_tabela);
  });

  if (!validRows.length) {
    throw new Error('Nenhuma linha válida encontrada. Confira os cabeçalhos da planilha.');
  }

  return validRows;
}
