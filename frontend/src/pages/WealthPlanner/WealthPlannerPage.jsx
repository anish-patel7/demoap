import { useState, useEffect } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { apiPut } from '../../api/client';
import { formatINR, formatINRCompact } from '../../utils/formatCurrency';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getChartColors } from '../../utils/chartColors';
import { loadLocalPlan, saveLocalPlan, localProjection, localScenarios } from '../../utils/localWealthPlan';

// Parameter field definitions (direct-type entry)
const FIELDS = [
  { key: 'my_age', label: 'Current Age', suffix: 'yrs', group: 'ages' },
  { key: 'projection_end_age', label: 'Projection End Age', suffix: 'yrs', group: 'ages' },
  { key: 'starting_lumpsum', label: 'Starting Lumpsum', money: true, group: 'money' },
  { key: 'monthly_sip', label: 'Monthly SIP', money: true, group: 'money' },
  { key: 'monthly_home_expense_today', label: 'Monthly Home Expense', money: true, group: 'money' },
  { key: 'expected_return_pct', label: 'Expected Return', suffix: '%', group: 'rates' },
  { key: 'inflation_pct', label: 'Inflation', suffix: '%', group: 'rates' },
  { key: 'withdrawal_start_year', label: 'Withdrawal Start Year', group: 'rates' },
];

export default function WealthPlannerPage() {
  const colors = getChartColors();
  const { data: plan, error: planError, refetch: refetchPlan } = useFetch('/wealth-plan', []);
  const { data: projData, refetch: refetchProj } = useFetch('/wealth-plan/projection-actual', []);
  const { data: scenarios, refetch: refetchScenarios } = useFetch('/wealth-plan/scenarios/all', []);

  const [form, setForm] = useState(null);
  const [locked, setLocked] = useState(true);
  const [saving, setSaving] = useState(false);
  // Offline mode: the server can't be reached, so the plan lives in this
  // browser and projections are computed locally (see utils/localWealthPlan).
  const [offline, setOffline] = useState(false);
  const [localPlan, setLocalPlan] = useState(null);

  useEffect(() => {
    if (plan && (!form || offline)) {
      setForm({ ...plan });
      setOffline(false);
      setLocked(true);
    }
  }, [plan]);

  useEffect(() => {
    if (planError && !plan && !form) {
      const saved = loadLocalPlan();
      setLocalPlan(saved);
      setForm({ ...saved });
      setOffline(true);
    }
  }, [planError]);

  const retryConnection = () => {
    refetchPlan();
    refetchProj();
    refetchScenarios();
  };

  if (!form) {
    return <div className="flex items-center justify-center h-96 text-on-surface-variant">Loading wealth plan...</div>;
  }

  const rows = (offline ? localProjection(localPlan) : projData)?.rows || [];
  const scenarioData = offline ? localScenarios(localPlan) : scenarios;
  const finalRow = rows[rows.length - 1];
  const withdrawalRows = rows.filter((r) => r.phase === 'withdrawal');
  const firstWithdrawal = withdrawalRows[0];

  const handleChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSaveLock = async () => {
    setSaving(true);
    try {
      const payload = {};
      FIELDS.forEach((f) => { payload[f.key] = Number(form[f.key]); });
      if (offline) {
        setLocalPlan(saveLocalPlan(payload));
        setLocked(true);
        return;
      }
      await apiPut('/wealth-plan', payload);
      setLocked(true);
      refetchProj();
      refetchScenarios(); // scenario cards are derived from the saved plan too
    } catch (err) {
      alert('Error saving: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const scenarioStats = (key) => {
    const s = scenarioData?.[key];
    if (!s || !s.length) return { peak: 0, depletesYear: null };
    const peak = Math.max(...s.map((r) => r.nominalCorpus));
    const depleted = s.find((r) => r.phase === 'withdrawal' && r.nominalCorpus <= 0);
    return { peak, depletesYear: depleted ? depleted.year : null };
  };

  return (
    <div className="p-4 md:p-8 space-y-gutter">
      {offline && (
        <div className="alert-warning flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">cloud_off</span>
              Offline mode — server not reachable
            </p>
            <p className="text-body-sm mt-1">
              Projections are calculated in your browser and saved on this device only.
              Actual/live capital needs the server.
            </p>
          </div>
          <button onClick={retryConnection} className="btn-outline text-sm whitespace-nowrap">Retry connection</button>
        </div>
      )}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Left: Parameter inputs */}
        <div className="col-span-12 lg:col-span-4 space-y-gutter min-w-0">
          <div className="glass-card p-6 rounded-xl flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-headline-md text-headline-md text-on-surface">Projection Params</h3>
              <button
                onClick={() => (locked ? setLocked(false) : handleSaveLock())}
                disabled={saving}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm font-semibold transition-all ${
                  locked
                    ? 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant'
                    : 'bg-primary text-on-primary hover:brightness-110'
                }`}
                title={locked ? 'Unlock to edit' : 'Save & lock'}
              >
                <span className="material-symbols-outlined text-[18px]">{locked ? 'lock' : 'lock_open'}</span>
                {locked ? 'Locked' : saving ? 'Saving…' : 'Save & Lock'}
              </button>
            </div>

            <div className="space-y-4">
              {FIELDS.map((f) => (
                <ParamField
                  key={f.key}
                  field={f}
                  value={form[f.key]}
                  locked={locked}
                  onChange={(v) => handleChange(f.key, v)}
                />
              ))}
            </div>

            {locked && (
              <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">info</span>
                Parameters are locked. Click <b>Locked</b> to edit.
              </p>
            )}
          </div>

          {/* Goal status */}
          <div className="glass-card p-6 rounded-xl border-l-4 border-l-primary relative overflow-hidden">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary fill-icon">check_circle</span>
              <h4 className="font-mono-label uppercase text-on-surface-variant">Corpus at Age {form.projection_end_age}</h4>
            </div>
            <p className="font-display text-headline-lg sm:text-display text-primary leading-tight break-words">{formatINRCompact(finalRow?.nominalCorpus)}</p>
            <p className="text-body-sm text-on-surface-variant mt-2">
              Real (inflation-adjusted): <span className="text-on-surface font-bold">{formatINRCompact(finalRow?.realCorpus)}</span>
            </p>
            {firstWithdrawal && (
              <p className="text-body-sm text-on-surface-variant mt-1">
                Withdrawals begin {firstWithdrawal.year} (your age {firstWithdrawal.myAge})
              </p>
            )}
          </div>
        </div>

        {/* Right: chart + scenarios */}
        <div className="col-span-12 lg:col-span-8 space-y-gutter min-w-0">
          {/* Projected vs Actual chart */}
          <div className="glass-card rounded-xl overflow-hidden flex flex-col h-[460px]">
            <div className="p-4 sm:p-6 border-b border-outline-variant flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest/50">
              <div>
                <h3 className="font-headline-md text-headline-md">Wealth Projection — Plan vs Actual</h3>
                <p className="text-body-sm text-on-surface-variant">
                  Projected corpus (plan) overlaid with your real/live curve
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <LegendDot color="#4edea3" label="Projected" />
                <LegendDot color="#adc6ff" label="Actual/Live" dashed />
                <LegendDot color="#ffb2b7" label="Real (infl-adj)" dashed />
              </div>
            </div>
            <div className="flex-1 min-h-0 min-w-0 p-4 sm:p-6">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={rows} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="wpProjected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4edea3" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#4edea3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke={colors.gridLine} vertical={false} opacity={0.3} />
                  <XAxis dataKey="year" tick={{ fill: colors.textSecondary, fontSize: 10, fontFamily: 'JetBrains Mono' }} stroke={colors.gridLine} />
                  <YAxis tickFormatter={(v) => formatINRCompact(v)} tick={{ fill: colors.textSecondary, fontSize: 10, fontFamily: 'JetBrains Mono' }} stroke={colors.gridLine} width={64} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#171f33', border: `1px solid ${colors.gridLine}`, borderRadius: '4px' }}
                    labelStyle={{ color: colors.text }}
                    formatter={(v, name) => [v == null ? '—' : formatINRCompact(v), name]}
                  />
                  <Area type="monotone" dataKey="nominalCorpus" name="Projected" stroke="#4edea3" strokeWidth={2.5} fill="url(#wpProjected)" isAnimationActive={false} />
                  <Line type="monotone" dataKey="realCorpus" name="Real (infl-adj)" stroke="#ffb2b7" strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="actualCorpus" name="Actual/Live" stroke="#adc6ff" strokeWidth={2.5} dot={{ r: 3, fill: '#adc6ff' }} connectNulls isAnimationActive={false} />
                  <Legend wrapperStyle={{ display: 'none' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scenario cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter">
            {(() => {
              const cons = scenarioStats('conservative');
              const base = scenarioStats('base');
              const aggr = scenarioStats('aggressive');
              return (
                <>
                  <ScenarioCard tone="conservative" label="Conservative" rate="12%" stats={cons} basePeak={base.peak} />
                  <ScenarioCard tone="base" label="Base" rate="15%" stats={base} recommended />
                  <ScenarioCard tone="aggressive" label="Aggressive" rate="18%" stats={aggr} basePeak={base.peak} />
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Withdrawal plan table */}
      {withdrawalRows.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-headline-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">payments</span>
              Withdrawal Plan
            </h3>
            <span className="text-body-sm text-on-surface-variant">
              Annual withdrawal = 2× monthly home expense, growing at {form.inflation_pct}% inflation
            </span>
          </div>
          <div className="overflow-x-auto custom-scrollbar max-h-96">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th className="text-right">Your Age</th>
                  <th className="text-right">Withdrawal</th>
                  <th className="text-right">Return Earned</th>
                  <th className="text-right">Capital (Nominal)</th>
                  <th className="text-right">Capital (Real)</th>
                </tr>
              </thead>
              <tbody>
                {withdrawalRows.map((r) => (
                  <tr key={r.year}>
                    <td className="font-mono font-semibold text-on-surface">{r.year}</td>
                    <td className="text-right font-mono text-on-surface">{r.myAge}</td>
                    <td className="text-right font-mono text-secondary font-bold">{formatINR(r.withdrawal)}</td>
                    <td className="text-right font-mono text-primary">{formatINR(r.returnEarned)}</td>
                    <td className="text-right font-mono text-on-surface font-bold">{formatINR(r.nominalCorpus)}</td>
                    <td className="text-right font-mono text-tertiary">{formatINR(r.realCorpus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full projection (accumulation + withdrawal) with plan vs actual */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-headline-md text-on-surface">Year-by-Year Projection</h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar max-h-96">
          <table className="data-table">
            <thead>
              <tr>
                <th>Year</th>
                <th className="text-right">Age</th>
                <th className="text-center">Phase</th>
                <th className="text-right">Added / Withdrawn</th>
                <th className="text-right">Return</th>
                <th className="text-right">Projected Capital</th>
                <th className="text-right">Actual/Live</th>
                <th className="text-right">% Diff</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.year}>
                  <td className="font-mono font-semibold text-on-surface">{r.year}</td>
                  <td className="text-right font-mono text-on-surface">{r.myAge}</td>
                  <td className="text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.phase === 'withdrawal' ? 'bg-secondary-container/20 text-secondary' : 'bg-primary-container/20 text-primary'}`}>
                      {r.phase === 'withdrawal' ? 'WITHDRAW' : 'ACCUMULATE'}
                    </span>
                  </td>
                  <td className={`text-right font-mono ${r.phase === 'withdrawal' ? 'text-secondary' : 'text-on-surface-variant'}`}>
                    {r.phase === 'withdrawal' ? `-${formatINRCompact(r.withdrawal)}` : `+${formatINRCompact(r.addedFund)}`}
                  </td>
                  <td className="text-right font-mono text-primary">{formatINRCompact(r.returnEarned)}</td>
                  <td className="text-right font-mono text-on-surface font-bold">{formatINR(r.nominalCorpus)}</td>
                  <td className="text-right font-mono text-tertiary">{r.actualCorpus != null ? formatINR(r.actualCorpus) : '—'}</td>
                  <td className={`text-right font-mono font-bold ${r.pctDiff == null ? 'text-on-surface-variant' : r.pctDiff >= 100 ? 'text-primary' : 'text-secondary'}`}>
                    {r.pctDiff != null ? `${r.pctDiff.toFixed(0)}%` : '—'}
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

function ParamField({ field, value, locked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wide min-w-0">{field.label}</label>
      <div className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 min-w-[140px] justify-end ${
        locked ? 'bg-surface-container-lowest border-outline-variant/50' : 'bg-surface-container border-outline-variant focus-within:border-primary'
      }`}>
        {field.money && <span className="text-[11px] text-on-surface-variant">₹</span>}
        <input
          type="number"
          value={value ?? ''}
          disabled={locked}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent text-right font-bold text-on-surface w-full focus:outline-none disabled:text-on-surface disabled:cursor-not-allowed"
        />
        {field.suffix && <span className="text-[10px] text-on-surface-variant">{field.suffix}</span>}
      </div>
    </div>
  );
}

function LegendDot({ color, label, dashed }) {
  return (
    <div className="flex items-center gap-2">
      {dashed ? (
        <div className="w-4 border-t-2 border-dashed" style={{ borderColor: color }} />
      ) : (
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }} />
      )}
      <span className="font-mono-label text-[10px] text-on-surface">{label}</span>
    </div>
  );
}

function ScenarioCard({ tone, label, rate, stats, basePeak, recommended }) {
  const { peak, depletesYear } = stats;
  const tones = {
    conservative: { border: 'border-t-outline-variant', text: 'text-outline', badge: 'bg-surface-container-high text-outline' },
    base: { border: 'border-t-primary', text: 'text-primary', badge: 'bg-primary-container/20 text-primary', bg: 'bg-primary/5' },
    aggressive: { border: 'border-t-tertiary-container', text: 'text-tertiary', badge: 'bg-tertiary-container/20 text-tertiary' },
  }[tone];

  return (
    <div className={`glass-card p-5 rounded-xl border-t-2 ${tones.border} ${tones.bg || ''} transition-all`}>
      <div className="flex justify-between items-start mb-4">
        <span className={`font-mono-label text-[10px] uppercase tracking-wider ${tones.text}`}>{label}</span>
        <div className={`px-2 py-1 rounded font-mono-label text-[10px] ${tones.badge}`}>{rate}</div>
      </div>
      <h4 className={`font-display text-headline-lg mb-1 truncate ${tone === 'base' ? 'text-primary' : ''}`}>{formatINRCompact(peak)}</h4>
      <p className="text-body-sm text-on-surface-variant">Peak corpus</p>
      <div className={`mt-4 flex items-center gap-1 ${depletesYear ? 'text-error' : 'text-primary'}`}>
        <span className="material-symbols-outlined text-[16px]">{depletesYear ? 'warning' : recommended ? 'stars' : 'check_circle'}</span>
        <span className="text-[10px] font-bold">{depletesYear ? `Depletes ${depletesYear}` : 'Sustained ✓'}</span>
      </div>
    </div>
  );
}
