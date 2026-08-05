// Groups the 13 raw energy columns (see backend greenhouse.js ENERGY_COLUMNS)
// into 5 human-readable systems — matches the app's 5-color categorical
// palette (accent-blue, accent-purple, status-green/orange/red-text) so
// breakdown charts never need to cycle or invent a 6th hue.
export const ENERGY_GROUPS = [
  { key: 'chiller', name: 'Chiller', columns: ['chiller_pa_kwh', 'chiller_pb_kwh'], color: 'var(--accent-blue)' },
  {
    key: 'lighting',
    name: 'Lighting',
    columns: ['lighting_pa_kwh', 'lighting_pb_kwh', 'lighting_pc_kwh'],
    color: 'var(--accent-purple)',
  },
  { key: 'heating', name: 'Heating', columns: ['heater_big_kwh', 'heater_small_kwh'], color: 'var(--status-green-text)' },
  {
    key: 'waterFiltration',
    name: 'Water & Filtration',
    columns: ['rinnai_hw_kwh', 'sand_filter_kwh'],
    color: 'var(--status-orange-text)',
  },
  {
    key: 'pumpsGrow',
    name: 'Pumps & Grow Systems',
    columns: ['superpump_kwh', 'sump_pb_kwh', 'tables_csp_pb_kwh', 'vertical_grow_bags_pb_kwh'],
    color: 'var(--status-red-text)',
  },
];

export function groupBreakdown(breakdown) {
  const out = {};
  for (const group of ENERGY_GROUPS) {
    out[group.key] = group.columns.reduce((sum, col) => sum + (breakdown[col] || 0), 0);
  }
  return out;
}
