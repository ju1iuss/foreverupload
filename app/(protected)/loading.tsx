export default function Loading() {
  return (
    <div style={{ width: '100%', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ height: '2.5rem', width: '200px', background: '#252525', borderRadius: '8px', marginBottom: '0.5rem', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: '1.25rem', width: '300px', background: '#252525', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ height: '100px', background: '#252525', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

