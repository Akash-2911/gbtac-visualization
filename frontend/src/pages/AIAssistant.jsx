import React from 'react';
import PageContainer from '../components/PageContainer';

export default function AIAssistant() {
  return (
    <PageContainer title="AI Assistant" subtitle="Ask questions about greenhouse, solar, weather and emissions data in plain English">
      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '60px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>✨</div>
        <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Coming soon</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '360px', margin: '0 auto' }}>
          The AI Assistant will let you ask natural-language questions about your energy data.
        </p>
      </div>
    </PageContainer>
  );
}