import React, { useState } from 'react';

export default function DataEntry() {
  const [form, setForm] = useState({
    date: '',
    systemGroup: 'Pumps & Filtration',
    value: '',
    unit: 'kWh',
  });
  const [status, setStatus] = useState(null); // null | 'submitting' | 'success' | 'error'

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.date || !form.value) {
      setStatus('error');
      return;
    }

    setStatus('submitting');

    // TODO: replace with real endpoint once Aryan/Akash confirm one exists
    // (likely something like POST /api/manual-entry)
    await new Promise((resolve) => setTimeout(resolve, 800)); // simulated delay
    console.log('Mock submit:', form);
    setStatus('success');
    setForm({ date: '', systemGroup: 'Pumps & Filtration', value: '', unit: 'kWh' });
  };

  return (
    <div>
      <h1 style={{ fontSize: '26px', marginBottom: '4px' }}>Manual Data Entry</h1>
      <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px' }}>
        Add a reading manually when sensor data is missing
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '24px',
          maxWidth: '480px',
        }}
      >
        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          Date
        </label>
        <input
          type="date"
          value={form.date}
          onChange={handleChange('date')}
          required
          style={{ width: '100%', padding: '8px 10px', marginBottom: '16px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px' }}
        />

        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          System group
        </label>
        <select
          value={form.systemGroup}
          onChange={handleChange('systemGroup')}
          style={{ width: '100%', padding: '8px 10px', marginBottom: '16px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px' }}
        >
          <option>Pumps & Filtration</option>
          <option>Lighting</option>
          <option>Heating</option>
          <option>Grow Systems</option>
          <option>Solar Collector 1</option>
          <option>Solar Collector 2</option>
        </select>

        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          Value
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <input
            type="number"
            step="0.01"
            value={form.value}
            onChange={handleChange('value')}
            required
            placeholder="0.00"
            style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px' }}
          />
          <select
            value={form.unit}
            onChange={handleChange('unit')}
            style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px' }}
          >
            <option>kWh</option>
            <option>kW</option>
            <option>°C</option>
            <option>%</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={status === 'submitting'}
          style={{
            backgroundColor: 'var(--accent-blue)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: status === 'submitting' ? 'default' : 'pointer',
            opacity: status === 'submitting' ? 0.7 : 1,
          }}
        >
          {status === 'submitting' ? 'Submitting…' : 'Submit Reading'}
        </button>

        {status === 'success' && (
          <p style={{ color: 'var(--status-green-text)', fontSize: '13px', marginTop: '12px' }}>
            ✓ Saved (mock — not yet connected to a real database endpoint)
          </p>
        )}
        {status === 'error' && (
          <p style={{ color: 'var(--status-red-text)', fontSize: '13px', marginTop: '12px' }}>
            Please fill in date and value.
          </p>
        )}
      </form>
    </div>
  );
}