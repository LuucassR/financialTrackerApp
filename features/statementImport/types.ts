// A piece of text as pdf.js reports it: its string and the x/y of its baseline origin (PDF points, y grows upward).
export interface PdfTextItem {
  str: string;
  x: number;
  y: number;
}

export interface PdfTextContent {
  /** PDF Info dictionary CreationDate, e.g. "D:20261111140439+00'00'" */
  creationDate: string | null;
  pages: PdfTextItem[][];
}

export type MovementKind =
  | 'transfer_out'
  | 'transfer_in'
  | 'qr_payment'
  | 'service_payment'
  | 'interest'
  | 'refund'
  | 'other';

export interface StatementMovement {
  /** Bank operation number; synthetic id for rows the app groups (daily interest). */
  operationId: string;
  /** yyyy-MM-dd */
  date: string;
  type: 'income' | 'expense';
  amount: number;
  /** Description exactly as printed on the statement (continuation lines joined). */
  description: string;
  /** The other party when the bank names one (transfer recipient/sender, service name). */
  counterpart: string | null;
  kind: MovementKind;
  /** How many statement rows were merged into this one (daily interest). */
  groupedCount?: number;
}

export interface ParsedStatement {
  bank: 'naranjax';
  holderName: string | null;
  /** yyyy-MM */
  yearMonth: string;
  openingBalance: number | null;
  closingBalance: number | null;
  /** True when opening + incomes − expenses equals the closing balance printed on the statement. */
  balanceCheckOk: boolean;
  movements: StatementMovement[];
}
