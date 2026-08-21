import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { Transaction, BudgetCategory } from '../types';

export async function exportTransactionsCSV(
  transactions: Transaction[],
  categories: BudgetCategory[] = []
): Promise<void> {
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));

  const header = 'Fecha,Descripción,Categoría,Monto,Tipo\n';
  const rows = transactions
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(t => {
      const cat = t.category_id ? (catMap[t.category_id] ?? '') : '';
      return `${t.date},"${t.description.replace(/"/g, '""')}","${cat}",${t.amount},${t.type}`;
    })
    .join('\n');

  const csv = header + rows;
  const monthLabel = format(new Date(), 'yyyy-MM');
  const fileName = `gastos_${monthLabel}.csv`;
  const path = FileSystem.documentDirectory + fileName;

  await FileSystem.writeAsStringAsync(path, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(path, {
      mimeType: 'text/csv',
      dialogTitle: 'Exportar gastos',
      UTI: 'public.comma-separated-values-text',
    });
  }
}
