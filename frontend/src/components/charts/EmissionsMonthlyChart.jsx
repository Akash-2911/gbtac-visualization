import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartCardStyle, chartTitleStyle } from './chartUtils';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// The Emissions page was 3 area charts + 1 scatter — no magnitude/bar chart
// at all. Bucketing by month gives a real "compare magnitude across months"
// job (distinct from the daily trend above it), computed client-side from
// the same dailyRecords already fetched — no backend change needed.
export default function EmissionsMonthlyChart({ dailyRecords }) {
  const data = useMemo(() => {
    const byMonth = new Map();
    for (const r of dailyRecords) {
      const key = r.date.slice(0, 7); // "YYYY-MM"
      byMonth.set(key, (byMonth.get(key) || 0) + (r.kgCo2e || 0));
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, value]) => {
        const [year, month] = key.split('-');
        return { month: `${MONTH_LABELS[Number(month) - 1]} ${year.slice(2)}`, value };
      });
  }, [dailyRecords]);

  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>CO2 Emissions by Month</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={50} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}
            formatter={(value) => [`${value.toFixed(1)} kg`, 'CO2e']}
          />
          <Bar dataKey="value" fill="var(--status-red-text)" radius={[4, 4, 0, 0]} name="CO2e" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
