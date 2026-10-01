import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { apiGet, apiPut } from '../../../api/client';
import { formatINR, formatINRCompact } from '../../../utils/formatCurrency';
import { getChartColors } from '../../../utils/chartColors';

const GREEN = '#4edea3';
const AMBER = '#f5c451';
const RED = '#ffb2b7';

function barColor(pct) {
  if (pct == null) return '#3c4a42';
  if (pct >= 100) return GREEN;
  if (pct >= 75) return AMBER;
  return RED;
}

export default function GoalProgressCard() {
  const [goal, setGoal] = useState(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    try {
      setGoal(await apiGet('/goal'));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!goal) return null;

  const c = goal.current;
  const pct = c.progressPct || 0;
  const barPct = Math.min(pct, 100);
  const achieved = c.achieved;

  const chartData = goal.years.map((y) => ({
    year: String(y.year),
    pct: y.achievedPct != null ? Number(y.achievedPct.toFixed(1)) : null,
    hasData: y.actual != null,
  }));

  return (
    <div className="bento-card rounded-lg p-5 mb-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-outline-variant pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="material-symbols-outlined text-primary">flag</span>
          <h3 className="font-headline-md text-headline-md text-on-surface">
            {c.year} Growth Goal
          </h3>
          <span className="text-[10px] font-mono-label uppercase text-on-surface-variant">
            +{goal.returnPct}% + SIP
          </span>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1 text-[11px] font-mono-label uppercase text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">tune</span>
          Set Goal
        </button>
      </div>

      {!goal.configured && (
        <div className="mb-4 text-[12px] text-amber-500 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] flex-shrink-0">info</span>
          <span>
            Using current capital as the opening balance. Click <b>Set Goal</b> to
            enter your December-end capital.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: current-year progress */}
        <div className="flex flex-col justify-center">
          {achieved && (
            <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary">
              <span className="material-symbols-outlined">celebration</span>
              <span className="font-bold text-body-sm">
                Congratulations! {c.year} goal achieved 🎉
              </span>
            </div>
          )}

          <div className="flex items-end justify-between gap-3 mb-1">
            <div className="min-w-0">
              <p className="text-[10px] font-mono-label uppercase text-on-surface-variant">
                Current Capital
              </p>
              <p className="font-headline-lg text-headline-lg text-on-surface">
                {formatINR(c.actual)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono-label uppercase text-on-surface-variant">
                Target
              </p>
              <p className="font-headline-md text-headline-md text-on-surface">
                {formatINR(c.target)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-4 w-full bg-surface-container rounded-full overflow-hidden mt-2">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${barPct}%`,
                backgroundColor: achieved ? GREEN : pct >= 75 ? AMBER : '#71a1ff',
              }}
            />
          </div>
          <div className="flex justify-between gap-2 mt-1.5 text-[11px] font-mono-label">
            <span className="text-on-surface font-bold">{pct.toFixed(1)}% achieved</span>
            <span className="text-on-surface-variant">
              {c.remaining > 0 ? `${formatINRCompact(c.remaining)} to go` : 'Target met'}
            </span>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <Stat label="Opening (Jan)" value={formatINRCompact(c.opening)} />
            <Stat label={`Target +${goal.returnPct}%`} value={formatINRCompact(c.targetReturn)} />
            <Stat label="SIP this year" value={formatINRCompact(c.sip)} />
          </div>
        </div>

        {/* Right: per-year achievement chart */}
        <div className="flex flex-col">
          <p className="text-[10px] font-mono-label uppercase text-on-surface-variant mb-1">
            Goal Achieved % — Year by Year
          </p>
          <div className="relative flex-1 min-h-[180px]">
            {/* Absolute fill gives ResponsiveContainer a definite height on every breakpoint. */}
            <div className="absolute inset-0">
              <YearlyChart data={chartData} />
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <GoalModal goal={goal} onClose={() => setEditing(false)} onSaved={setGoal} />
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-surface-container-low rounded-lg p-2">
      <p className="text-[9px] font-mono-label uppercase text-on-surface-variant leading-tight">
        {label}
      </p>
      <p className="text-body-sm font-bold text-on-surface">{value}</p>
    </div>
  );
}

function YearlyChart({ data }) {
  const colors = getChartColors();
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-on-surface-variant text-body-sm">
        No goal data yet
      </div>
    );
  }
  // Give headroom above 100% so achieved bars aren't clipped.
  const maxPct = Math.max(120, ...data.map((d) => d.pct || 0));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="4 4" stroke={colors.gridLine} vertical={false} opacity={0.5} />
        <XAxis dataKey="year" tick={{ fill: colors.textSecondary, fontSize: 11, fontFamily: 'JetBrains Mono' }} stroke={colors.gridLine} />
        <YAxis domain={[0, maxPct]} tick={{ fill: colors.textSecondary, fontSize: 10, fontFamily: 'JetBrains Mono' }} stroke={colors.gridLine} unit="%" />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          contentStyle={{ backgroundColor: colors.surface, border: `1px solid ${colors.gridLine}`, borderRadius: '6px', padding: '8px 12px' }}
          labelStyle={{ color: colors.text }}
          formatter={(v) => [v == null ? 'No data' : `${v}%`, 'Achieved']}
        />
        <ReferenceLine y={100} stroke={GREEN} strokeDasharray="4 3" strokeOpacity={0.7} />
        <Bar dataKey="pct" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {data.map((entry, i) => (
            <Cell key={i} fill={barColor(entry.pct)} fillOpacity={0.9} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function GoalModal({ goal, onClose, onSaved }) {
  const [opening, setOpening] = useState(goal.current.opening ?? '');
  const [startYear, setStartYear] = useState(goal.startYear);
  const [returnPct, setReturnPct] = useState(goal.returnPct);
  const [sip, setSip] = useState(goal.monthlySip);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await apiPut('/goal', {
        goal_opening_capital: Number(opening),
        goal_year: Number(startYear),
        expected_return_pct: Number(returnPct),
        monthly_sip: Number(sip),
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save goal.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar bg-surface-container-high border border-outline-variant rounded-xl shadow-2xl p-6"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="font-headline-md text-headline-md font-bold text-on-surface mb-1">
          Set Growth Goal
        </h2>
        <p className="text-[12px] text-on-surface-variant mb-4">
          Target = Opening + {returnPct || 0}% of Opening + yearly SIP. Enter the
          capital you had at the starting year's December-end.
        </p>

        <form onSubmit={save} className="space-y-3">
          <Field label="Opening capital (start-year Jan / prev Dec-end)">
            <input type="number" value={opening} onChange={(e) => setOpening(e.target.value)}
              className="form-input w-full" min="0" step="1000" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start year">
              <input type="number" value={startYear} onChange={(e) => setStartYear(e.target.value)}
                className="form-input w-full" min="2000" max="2100" required />
            </Field>
            <Field label="Target return %">
              <input type="number" value={returnPct} onChange={(e) => setReturnPct(e.target.value)}
                className="form-input w-full" min="0" max="100" step="0.5" required />
            </Field>
          </div>
          <Field label="Monthly SIP (₹)">
            <input type="number" value={sip} onChange={(e) => setSip(e.target.value)}
              className="form-input w-full" min="0" step="500" required />
          </Field>

          {error && <p className="text-body-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-on-surface-variant hover:bg-surface-variant/50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold hover:brightness-110 transition disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-body-sm text-on-surface-variant mb-1">{label}</span>
      {children}
    </label>
  );
}
