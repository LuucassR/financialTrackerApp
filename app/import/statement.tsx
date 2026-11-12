import { View, Text, TouchableOpacity, FlatList, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFinancialStore } from '../../store/useFinancialStore';
import PdfTextExtractor, { PdfTextExtractorHandle } from '../../components/PdfTextExtractor';
import { parseNaranjaXStatement, groupDailyInterest } from '../../features/statementImport/naranjaX';
import { buildReview, AUTO_MATCH_SCORE, MatchSource, ReviewItem } from '../../features/statementImport/matching';
import type { ParsedStatement } from '../../features/statementImport/types';
import { getLinkedTransactionIds, getProcessedOperationIds, ImportDecision } from '../../database/queries/statementImports';
import { formatCurrency } from '../../utils/currency';
import { BudgetCategory } from '../../types';

const BANK = 'naranjax';

type Decision = 'import' | 'match' | 'ignore' | 'pending';
type Filter = 'all' | 'pending' | 'import' | 'match' | 'ignore';

const SOURCE_LABEL: Record<MatchSource, string> = {
  transaction: 'Movimiento cargado',
  recurring_income: 'Ingreso recurrente',
  fixed_expense: 'Gasto fijo',
  installment: 'Cuota',
};

function initialDecision(item: ReviewItem): Decision {
  if (item.match) return item.match.score >= AUTO_MATCH_SCORE ? 'match' : 'pending';
  if (item.isOwnTransfer) return 'ignore';
  return 'import';
}

export default function ImportStatementScreen() {
  const {
    transactions, recurringIncomes, fixedExpenses, installments, budgetCategories, importStatement,
  } = useFinancialStore();
  const extractor = useRef<PdfTextExtractorHandle>(null);

  const [phase, setPhase] = useState<'idle' | 'reading' | 'review'>('idle');
  const [statement, setStatement] = useState<ParsedStatement | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [alreadyProcessed, setAlreadyProcessed] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [categories, setCategories] = useState<Record<string, string | null>>({});
  const [filter, setFilter] = useState<Filter>('all');

  const expenseCategories = budgetCategories.filter(c => c.type === 'expense');

  async function handlePick() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      // Android: read the picker's content:// URI directly. The cached copy lands outside Expo Go's
      // per-project sandbox and expo-file-system refuses to read it there. iOS needs the copy, since the
      // original lives outside the app sandbox.
      copyToCacheDirectory: Platform.OS !== 'android',
    });
    if (result.canceled) return;
    const asset = result.assets[0];

    setPhase('reading');
    try {
      const base64 = await new File(asset.uri).base64();
      const content = await extractor.current!.extract(base64);
      const parsed = parseNaranjaXStatement(content, asset.name);

      const processed = getProcessedOperationIds(BANK);
      const all = groupDailyInterest(parsed);
      const fresh = all.filter(m => !processed.has(m.operationId));
      const review = buildReview(fresh, {
        yearMonth: parsed.yearMonth,
        holderName: parsed.holderName,
        transactions,
        linkedTransactionIds: getLinkedTransactionIds(),
        recurringIncomes,
        fixedExpenses,
        installments,
      });

      setStatement(parsed);
      setItems(review);
      setAlreadyProcessed(all.length - fresh.length);
      setDecisions(Object.fromEntries(review.map(i => [i.movement.operationId, initialDecision(i)])));
      setCategories(Object.fromEntries(review.map(i => [i.movement.operationId, i.suggestedCategoryId])));
      setFilter(review.some(i => initialDecision(i) === 'pending') ? 'pending' : 'all');
      setPhase('review');
    } catch (e) {
      setPhase('idle');
      Alert.alert('No se pudo leer el resumen', e instanceof Error ? e.message : String(e));
    }
  }

  const counts = useMemo(() => {
    const c = { import: 0, match: 0, ignore: 0, pending: 0 };
    Object.values(decisions).forEach(d => { c[d]++; });
    return c;
  }, [decisions]);

  const visible = filter === 'all' ? items : items.filter(i => decisions[i.movement.operationId] === filter);

  function setDecision(operationId: string, decision: Decision) {
    const next = { ...decisions, [operationId]: decision };
    setDecisions(next);
    // Once the last match is confirmed, leave the now-empty "Por confirmar" list.
    if (filter === 'pending' && !Object.values(next).includes('pending')) setFilter('all');
  }

  function handleConfirm() {
    if (!statement) return;
    const payload: ImportDecision[] = items.map(item => {
      const id = item.movement.operationId;
      const d = decisions[id];
      if (d === 'match' && item.match) {
        return { action: 'match', movement: item.movement, source: item.match.source, matchId: item.match.id };
      }
      if (d === 'import') return { action: 'import', movement: item.movement, categoryId: categories[id] ?? null };
      return { action: 'ignore', movement: item.movement };
    });
    importStatement(BANK, statement.yearMonth, payload);
    Alert.alert(
      'Resumen importado',
      `${counts.import} movimientos nuevos · ${counts.match} vinculados a lo que ya tenías · ${counts.ignore} ignorados`
    );
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <PdfTextExtractor ref={extractor} />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 8 }}>
        <Text style={{ color: '#e2e8f0', fontSize: 20, fontWeight: '700' }}>Importar resumen</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={24} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {phase === 'idle' && (
        <View style={{ padding: 16 }}>
          <Text style={{ color: '#94a3b8', fontSize: 14, lineHeight: 20, marginBottom: 20 }}>
            Subí el PDF del resumen mensual de tu cuenta Naranja X. Vamos a comparar cada movimiento con lo que
            ya cargaste y te mostramos qué tan parecido es, para que confirmes si es el mismo o uno nuevo.
          </Text>
          <TouchableOpacity
            onPress={handlePick}
            style={{
              backgroundColor: '#22c55e', borderRadius: 14, padding: 18,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            <Feather name="upload" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Elegir PDF</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'reading' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color="#22c55e" size="large" />
          <Text style={{ color: '#94a3b8', fontSize: 14 }}>Leyendo el resumen…</Text>
        </View>
      )}

      {phase === 'review' && statement && (
        <>
          <FlatList
            data={visible}
            keyExtractor={i => i.movement.operationId}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            ListHeaderComponent={
              <ReviewHeader
                statement={statement}
                alreadyProcessed={alreadyProcessed}
                total={items.length}
                counts={counts}
                filter={filter}
                onFilter={setFilter}
              />
            }
            ListEmptyComponent={
              <Text style={{ color: '#475569', fontSize: 14, textAlign: 'center', marginTop: 24 }}>
                {items.length === 0 ? 'Todos los movimientos de este resumen ya fueron importados' : 'Nada en este filtro'}
              </Text>
            }
            renderItem={({ item }) => (
              <ReviewRow
                item={item}
                decision={decisions[item.movement.operationId]}
                categoryId={categories[item.movement.operationId] ?? null}
                categories={expenseCategories}
                onDecision={d => setDecision(item.movement.operationId, d)}
                onCategory={c => setCategories(prev => ({ ...prev, [item.movement.operationId]: c }))}
              />
            )}
          />

          {items.length > 0 && (
            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#1e293b' }}>
              <TouchableOpacity
                onPress={handleConfirm}
                disabled={counts.pending > 0}
                style={{
                  backgroundColor: counts.pending > 0 ? '#334155' : '#22c55e',
                  borderRadius: 14, padding: 16, alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                  {counts.pending > 0
                    ? `Confirmá ${counts.pending} ${counts.pending === 1 ? 'coincidencia' : 'coincidencias'}`
                    : `Importar ${counts.import} ${counts.import === 1 ? 'movimiento' : 'movimientos'}`}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

function ReviewHeader({ statement, alreadyProcessed, total, counts, filter, onFilter }: {
  statement: ParsedStatement;
  alreadyProcessed: number;
  total: number;
  counts: Record<Decision, number>;
  filter: Filter;
  onFilter: (f: Filter) => void;
}) {
  const [y, m] = statement.yearMonth.split('-').map(Number);
  const monthLabel = format(new Date(y, m - 1, 1), 'MMMM yyyy', { locale: es });

  const filters: Array<{ key: Filter; label: string; count: number }> = [
    { key: 'all', label: 'Todos', count: total },
    { key: 'pending', label: 'Por confirmar', count: counts.pending },
    { key: 'import', label: 'Nuevos', count: counts.import },
    { key: 'match', label: 'Ya los tengo', count: counts.match },
    { key: 'ignore', label: 'Ignorados', count: counts.ignore },
  ];

  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <Text style={{ color: '#e2e8f0', fontSize: 16, fontWeight: '700', textTransform: 'capitalize' }}>
          Naranja X · {monthLabel}
        </Text>
        {statement.holderName && (
          <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{statement.holderName}</Text>
        )}
        {statement.openingBalance !== null && statement.closingBalance !== null && (
          <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 8 }}>
            Saldo {formatCurrency(statement.openingBalance)} → {formatCurrency(statement.closingBalance)}
          </Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <Feather
            name={statement.balanceCheckOk ? 'check-circle' : 'alert-triangle'}
            size={14}
            color={statement.balanceCheckOk ? '#22c55e' : '#f59e0b'}
          />
          <Text style={{ color: statement.balanceCheckOk ? '#22c55e' : '#f59e0b', fontSize: 12, flex: 1 }}>
            {statement.balanceCheckOk
              ? 'Los movimientos leídos cuadran con el saldo final'
              : 'Los movimientos leídos no cuadran con el saldo final, revisalos antes de importar'}
          </Text>
        </View>
        {alreadyProcessed > 0 && (
          <Text style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>
            {alreadyProcessed} movimientos ya se habían importado antes y se omiten
          </Text>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0 }} contentContainerStyle={{ gap: 8 }}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => onFilter(f.key)}
            style={{
              paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
              backgroundColor: filter === f.key ? (f.key === 'pending' ? '#f59e0b' : '#22c55e') : '#1e293b',
              borderWidth: 1, borderColor: filter === f.key ? 'transparent' : '#334155',
            }}
          >
            <Text style={{ color: filter === f.key ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: '600' }}>
              {f.label} · {f.count}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function ReviewRow({ item, decision, categoryId, categories, onDecision, onCategory }: {
  item: ReviewItem;
  decision: Decision;
  categoryId: string | null;
  categories: BudgetCategory[];
  onDecision: (d: Decision) => void;
  onCategory: (id: string | null) => void;
}) {
  const [showCategories, setShowCategories] = useState(false);
  const { movement, match } = item;
  const isIncome = movement.type === 'income';
  const category = categories.find(c => c.id === categoryId);

  return (
    <View style={{
      backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginTop: 10,
      borderWidth: 1, borderColor: decision === 'pending' ? '#f59e0b' : '#1e293b',
      opacity: decision === 'ignore' ? 0.6 : 1,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '600', width: 38, marginTop: 2 }}>
          {format(parseISO(movement.date), 'dd/MM')}
        </Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: '500' }} numberOfLines={2}>
            {movement.description}
          </Text>
          {(item.isOwnTransfer || movement.groupedCount) && (
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
              {item.isOwnTransfer ? 'Transferencia entre tus cuentas' : `${movement.groupedCount} acreditaciones diarias agrupadas`}
            </Text>
          )}
        </View>
        <Text style={{ color: isIncome ? '#22c55e' : '#f87171', fontSize: 15, fontWeight: '700' }}>
          {isIncome ? '+' : '-'}{formatCurrency(movement.amount)}
        </Text>
      </View>

      {match && (
        <View style={{ backgroundColor: '#0f172a', borderRadius: 10, padding: 10, marginTop: 10 }}>
          <Text style={{ color: '#e2e8f0', fontSize: 13 }}>
            <Text style={{ color: scoreColor(match.score), fontWeight: '700' }}>{match.score}% similar</Text>
            {` a ${SOURCE_LABEL[match.source].toLowerCase()}: “${match.label}”`}
          </Text>
          <Text style={{ color: '#64748b', fontSize: 12, marginTop: 3 }}>
            {formatCurrency(match.amount)} · {format(parseISO(match.date), 'dd/MM')}
            {`  ·  monto ${match.amountScore}% · fecha ${match.dateScore}%`}
            {match.textScore !== null ? ` · texto ${match.textScore}%` : ''}
          </Text>
          {decision === 'pending' && (
            <>
              <Text style={{ color: '#f59e0b', fontSize: 13, fontWeight: '600', marginTop: 10 }}>¿Es este movimiento?</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <ActionButton label="Sí, es este" icon="check" color="#22c55e" onPress={() => onDecision('match')} />
                <ActionButton label="No, es otro" icon="x" color="#f87171" onPress={() => onDecision('import')} />
              </View>
            </>
          )}
        </View>
      )}

      {decision !== 'pending' && (
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
          <Segment label="Nuevo" active={decision === 'import'} onPress={() => onDecision('import')} />
          {match && <Segment label="Ya lo tengo" active={decision === 'match'} onPress={() => onDecision('match')} />}
          <Segment label="Ignorar" active={decision === 'ignore'} onPress={() => onDecision('ignore')} />
        </View>
      )}

      {decision === 'import' && !isIncome && categories.length > 0 && (
        <View style={{ marginTop: 10 }}>
          <TouchableOpacity onPress={() => setShowCategories(s => !s)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>
              Categoría: <Text style={{ color: '#e2e8f0', fontWeight: '600' }}>{category?.name ?? 'Sin categoría'}</Text>
            </Text>
            <Feather name={showCategories ? 'chevron-up' : 'chevron-down'} size={14} color="#94a3b8" />
          </TouchableOpacity>
          {showCategories && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {[{ id: null, name: 'Sin categoría' } as const, ...categories].map(c => (
                <TouchableOpacity
                  key={c.id ?? 'none'}
                  onPress={() => { onCategory(c.id); setShowCategories(false); }}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
                    backgroundColor: categoryId === c.id ? '#3b82f6' : '#0f172a',
                    borderWidth: 1, borderColor: categoryId === c.id ? '#3b82f6' : '#334155',
                  }}
                >
                  <Text style={{ color: categoryId === c.id ? '#fff' : '#94a3b8', fontSize: 12, fontWeight: '500' }}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function scoreColor(score: number): string {
  if (score >= AUTO_MATCH_SCORE) return '#22c55e';
  if (score >= 70) return '#f59e0b';
  return '#f87171';
}

function ActionButton({ label, icon, color, onPress }: {
  label: string; icon: 'check' | 'x'; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: color,
      }}
    >
      <Feather name={icon} size={15} color={color} />
      <Text style={{ color, fontSize: 13, fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
        backgroundColor: active ? '#334155' : 'transparent',
        borderWidth: 1, borderColor: active ? '#475569' : '#334155',
      }}
    >
      <Text style={{ color: active ? '#e2e8f0' : '#64748b', fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}
