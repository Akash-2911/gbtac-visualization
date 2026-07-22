import React from 'react';

export default function ReportCard({ children }) {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        overflow: 'hidden',
        width: '100%',
        // FIX: flex:1 + display:flex so PowerBIReport's own flex:1 (now that it's
        // no longer a hardcoded 750px) can actually reach up and fill whatever
        // vertical space this card is given. Needs PageContainer (or whatever
        // wraps ReportCard on each page) to also be flex:1 down the chain.
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '4px',
        boxShadow: '0 0 0 1px var(--border)',
      }}
    >
      {children}
    </div>
  );
}