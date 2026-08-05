// Groups the 13 raw energy columns (see backend greenhouse.js ENERGY_COLUMNS)
// into 5 human-readable systems. All 5 are shades of the app's "Energy"
// domain color (purple) rather than unrelated hues — they're sub-parts of
// one category, not 5 separate categories, and a distinct hue per system
// would collide with Solar's blue / Emissions' red on pages where those
// charts sit side by side (e.g. Compare's breakdown tab).
export const ENERGY_GROUPS = [
  { key: 'chiller', name: 'Chiller', columns: ['chiller_pa_kwh', 'chiller_pb_kwh'], color: 'var(--energy-tint-1)' },
  {
    key: 'lighting',
    name: 'Lighting',
    columns: ['lighting_pa_kwh', 'lighting_pb_kwh', 'lighting_pc_kwh'],
    color: 'var(--energy-tint-2)',
  },
  { key: 'heating', name: 'Heating', columns: ['heater_big_kwh', 'heater_small_kwh'], color: 'var(--energy-tint-3)' },
  {
    key: 'waterFiltration',
    name: 'Water & Filtration',
    columns: ['rinnai_hw_kwh', 'sand_filter_kwh'],
    color: 'var(--energy-tint-4)',
  },
  {
    key: 'pumpsGrow',
    name: 'Pumps & Grow Systems',
    columns: ['superpump_kwh', 'sump_pb_kwh', 'tables_csp_pb_kwh', 'vertical_grow_bags_pb_kwh'],
    color: 'var(--energy-tint-5)',
  },
];

export function groupBreakdown(breakdown) {
  const out = {};
  for (const group of ENERGY_GROUPS) {
    out[group.key] = group.columns.reduce((sum, col) => sum + (breakdown[col] || 0), 0);
  }
  return out;
}
