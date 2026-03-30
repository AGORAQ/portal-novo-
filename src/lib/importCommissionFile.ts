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
  prazo: 'parcelas',
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

function toImportedCommissionRow(row: Record<string, unknown>): ImportedCommissionRow {
  const output: ImportedCommissionRow = {
    banco: '',
    produto: '',
    operacao: '',
    codigo_tabela: '',
    nome_tabela: '',
    parcelas: null,
    comissao_total_empresa: 0,
    grupo_master: 0,
    grupo_ouro: 0,
    grupo_prata: 0,
    grupo_plus: 0
  };

  for (const [rawKey, rawValue] of Object.entries(row)) {
    const mappedKey = aliasMap[normalizeHeader(rawKey)];
    if (!mappedKey) continue;

    switch (mappedKey) {
      case 'parcelas': {
        const n = Number(rawValue);
        output.parcelas = Number.isFinite(n) ? n : null;
        break;
      }
      case 'comissao_total_empresa':
      case 'grupo_master':
      case 'grupo_ouro':
      case 'grupo_prata':
      case 'grupo_plus': {
        output[mappedKey] = parseNumber(rawValue);
        break;
      }
      default: {
        output[mappedKey] = String(rawValue ?? '').trim();
      }
    }
  }

  return output;
}

export async function importCommissionFile(file: File): Promise<ImportedCommissionRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const parsedRows = rawRows.map(toImportedCommissionRow);

  const validRows = parsedRows.filter((row) => {
    return Boolean(row.banco && row.produto && row.nome_tabela);
  });

  if (!validRows.length) {
    throw new Error('Nenhuma linha válida encontrada. Confira os cabeçalhos da planilha.');
  }

  return validRows;
}
