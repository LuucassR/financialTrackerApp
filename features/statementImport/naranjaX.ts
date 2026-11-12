import type { MovementKind, ParsedStatement, PdfTextContent, PdfTextItem, StatementMovement } from './types';

// Maps the layout of a Naranja X "Resumen Cuenta" PDF (already turned into positioned text by pdf.js)
// onto movements. Each movement row is: DD/MMM · operation number · description · amount · balance,
// with long descriptions wrapping onto the following line(s).

const MONTHS_FULL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MONTHS_ABBR: Record<string, number> = {
  ENE: 0, FEB: 1, MAR: 2, ABR: 3, MAY: 4, JUN: 5, JUL: 6, AGO: 7, SEP: 8, SET: 8, OCT: 9, NOV: 10, DIC: 11,
};

const DATE_RE = /^(\d{2})\/([A-Z]{3})$/;
const OPERATION_RE = /^\d{6,}$/;
const PESOS_AMOUNT_RE = /^-?\$\s*[\d.]+,\d{2}$/;
const LINE_Y_TOLERANCE = 2;

type Line = PdfTextItem[];

export class StatementFormatError extends Error {}

export function looksLikeNaranjaXStatement(content: PdfTextContent): boolean {
  const firstPage = content.pages[0]?.map(i => i.str).join(' ') ?? '';
  return /Resumen del mes de/i.test(firstPage) && /Movimientos del mes/i.test(firstPage);
}

export function parseNaranjaXStatement(content: PdfTextContent, fileName?: string): ParsedStatement {
  if (!looksLikeNaranjaXStatement(content)) {
    throw new StatementFormatError('El PDF no parece un resumen de cuenta de Naranja X');
  }

  const lines = content.pages.flatMap(groupIntoLines);
  const holderName = lines[0]?.[0]?.str.trim() || null;

  const monthLine = lines.map(lineText).find(t => /Resumen del mes de/i.test(t));
  const monthName = monthLine?.match(/Resumen del mes de\s+(\p{L}+)/iu)?.[1]?.toLowerCase();
  const statementMonth = monthName ? MONTHS_FULL.indexOf(monthName) : -1;
  if (statementMonth < 0) throw new StatementFormatError('No se encontró el mes del resumen');
  const statementYear = inferYear(statementMonth, fileName, content.creationDate);

  let inPesosSection = false;
  let incomeColumnX: number | null = null;
  let expenseColumnX: number | null = null;
  let openingBalance: number | null = null;
  let closingBalance: number | null = null;
  let runningBalance: number | null = null;
  let current: { movement: StatementMovement; descriptionX: number } | null = null;
  const movements: StatementMovement[] = [];

  for (const line of lines) {
    const text = lineText(line);
    const first = line[0].str.trim();

    if (/^Datos cuenta en/i.test(text)) {
      inPesosSection = /pesos/i.test(text);
      current = null;
      continue;
    }
    if (!inPesosSection) continue;

    if (/\bIngreso\b/.test(text) && /\bEgreso\b/.test(text)) {
      incomeColumnX = line.find(i => i.str.trim() === 'Ingreso')?.x ?? null;
      expenseColumnX = line.find(i => i.str.trim() === 'Egreso')?.x ?? null;
      continue;
    }

    const amounts = line.filter(i => PESOS_AMOUNT_RE.test(i.str.trim()));

    if (first === 'Dinero inicial' && amounts.length > 0) {
      openingBalance = parseAmount(amounts[amounts.length - 1].str);
      runningBalance = openingBalance;
      continue;
    }
    if (first === 'Dinero final' && amounts.length > 0) {
      closingBalance = parseAmount(amounts[amounts.length - 1].str);
      current = null;
      inPesosSection = false; // the pesos movements table ends here
      continue;
    }

    const dateMatch = first.match(DATE_RE);
    if (dateMatch && line[1] && OPERATION_RE.test(line[1].str.trim()) && amounts.length >= 1) {
      const operationId = line[1].str.trim();
      const descriptionItems = line.slice(2).filter(i => !PESOS_AMOUNT_RE.test(i.str.trim()));
      const amountItem = amounts[0];
      const amount = parseAmount(amountItem.str);
      const balance = amounts.length >= 2 ? parseAmount(amounts[amounts.length - 1].str) : null;
      const type = resolveDirection(amount, amountItem.x, runningBalance, balance, incomeColumnX, expenseColumnX);
      if (balance !== null) runningBalance = balance;

      const movement: StatementMovement = {
        operationId,
        date: toIsoDate(statementYear, statementMonth, Number(dateMatch[1]), dateMatch[2]),
        type,
        amount,
        description: descriptionItems.map(i => i.str.trim()).join(' '),
        counterpart: null,
        kind: 'other',
      };
      movements.push(movement);
      current = { movement, descriptionX: descriptionItems[0]?.x ?? line[1].x + 1 };
      continue;
    }

    // Wrapped description: a text-only line starting in the description column of the previous row.
    if (current && amounts.length === 0 && Math.abs(line[0].x - current.descriptionX) < 5) {
      current.movement.description = `${current.movement.description} ${text}`.trim();
      continue;
    }

    current = null;
  }

  if (movements.length === 0) {
    throw new StatementFormatError('No se encontraron movimientos en pesos en el resumen');
  }

  for (const m of movements) {
    m.description = m.description.replace(/\s+/g, ' ').trim();
    const { kind, counterpart } = classify(m.description);
    m.kind = kind;
    m.counterpart = counterpart;
  }

  const net = movements.reduce((sum, m) => sum + (m.type === 'income' ? m.amount : -m.amount), 0);
  const balanceCheckOk =
    openingBalance !== null && closingBalance !== null && Math.abs(openingBalance + net - closingBalance) < 0.01;

  return {
    bank: 'naranjax',
    holderName,
    yearMonth: `${statementYear}-${String(statementMonth + 1).padStart(2, '0')}`,
    openingBalance,
    closingBalance,
    balanceCheckOk,
    movements,
  };
}

/**
 * Naranja X credits interest every day ("Rendimiento diario"). Thirty tiny rows are noise in a
 * personal budget, so they are merged into a single income for the month.
 */
export function groupDailyInterest(statement: ParsedStatement): StatementMovement[] {
  const interest = statement.movements.filter(m => m.kind === 'interest');
  const rest = statement.movements.filter(m => m.kind !== 'interest');
  if (interest.length <= 1) return statement.movements;

  const total = Math.round(interest.reduce((sum, m) => sum + m.amount, 0) * 100) / 100;
  const grouped: StatementMovement = {
    operationId: `rendimientos-${statement.yearMonth}`,
    date: interest[interest.length - 1].date,
    type: 'income',
    amount: total,
    description: 'Rendimientos cuenta remunerada',
    counterpart: null,
    kind: 'interest',
    groupedCount: interest.length,
  };
  return [...rest, grouped].sort((a, b) => a.date.localeCompare(b.date));
}

function groupIntoLines(items: PdfTextItem[]): Line[] {
  const sorted = items
    .filter(i => i.str.trim().length > 0)
    .sort((a, b) => (Math.abs(b.y - a.y) < LINE_Y_TOLERANCE ? a.x - b.x : b.y - a.y));
  const lines: Line[] = [];
  for (const item of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last[0].y - item.y) < LINE_Y_TOLERANCE) {
      last.push(item);
    } else {
      lines.push([item]);
    }
  }
  return lines.map(l => l.sort((a, b) => a.x - b.x));
}

function lineText(line: Line): string {
  return line.map(i => i.str.trim()).join(' ').trim();
}

function parseAmount(raw: string): number {
  const negative = raw.trim().startsWith('-');
  const value = Number(raw.replace(/[^\d,]/g, '').replace(',', '.'));
  return negative ? -value : value;
}

function resolveDirection(
  amount: number,
  amountX: number,
  previousBalance: number | null,
  balance: number | null,
  incomeColumnX: number | null,
  expenseColumnX: number | null
): 'income' | 'expense' {
  // The running balance is the most reliable signal: it either went up or down by the amount.
  if (previousBalance !== null && balance !== null) {
    if (Math.abs(previousBalance + amount - balance) < 0.01) return 'income';
    if (Math.abs(previousBalance - amount - balance) < 0.01) return 'expense';
  }
  // Fall back to which column the amount was printed in.
  if (incomeColumnX !== null && expenseColumnX !== null) {
    return amountX < (incomeColumnX + expenseColumnX) / 2 ? 'income' : 'expense';
  }
  return 'expense';
}

function inferYear(statementMonth: number, fileName: string | undefined, creationDate: string | null): number {
  // Naranja X names the download "Resumen YYYYMM.pdf".
  const fromName = fileName?.match(/(20\d{2})(0[1-9]|1[0-2])/);
  if (fromName && Number(fromName[2]) - 1 === statementMonth) return Number(fromName[1]);

  // Otherwise: the statement was generated on/after the month it describes.
  const created = creationDate?.match(/D:(\d{4})(\d{2})/);
  if (created) {
    const year = Number(created[1]);
    const month = Number(created[2]) - 1;
    return statementMonth > month ? year - 1 : year;
  }
  const today = new Date();
  return statementMonth > today.getMonth() ? today.getFullYear() - 1 : today.getFullYear();
}

function toIsoDate(statementYear: number, statementMonth: number, day: number, monthAbbr: string): string {
  const month = MONTHS_ABBR[monthAbbr] ?? statementMonth;
  // A January statement can include late-December rows.
  const year = month - statementMonth > 6 ? statementYear - 1 : statementYear;
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const PREFIXES: Array<[RegExp, MovementKind, boolean]> = [
  [/^Transferencia enviada\s*/i, 'transfer_out', true],
  [/^Transferencia recibida\s*/i, 'transfer_in', true],
  [/^Pago de servicio\s*/i, 'service_payment', true],
  [/^Pago con QR\s*/i, 'qr_payment', true],
  [/^Rendimiento/i, 'interest', false],
  [/^Reintegro/i, 'refund', false],
];

/**
 * Removes the generic bank wording ("Transferencia enviada", "Pago de servicio", ...) so that only
 * the identifying part is compared. Imported transactions keep the bank description, so this also
 * applies to descriptions already stored in the app.
 */
export function stripBankPrefix(description: string): string {
  for (const [re] of PREFIXES) {
    if (re.test(description)) return description.replace(re, '').trim();
  }
  return description;
}

function classify(description: string): { kind: MovementKind; counterpart: string | null } {
  for (const [re, kind, hasCounterpart] of PREFIXES) {
    if (re.test(description)) {
      const rest = description.replace(re, '').trim();
      return { kind, counterpart: hasCounterpart && rest ? rest : null };
    }
  }
  return { kind: 'other', counterpart: null };
}
