export default function ImprintPage() {
  return (
    <div style={{ minHeight: '100vh', padding: '2rem', maxWidth: '800px', margin: '0 auto', background: '#191919', color: '#fff' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>
          Imprint
        </h1>
        <p style={{ color: '#999', fontSize: '1.125rem' }}>
          Tasy AI GmbH – Created to make an impact!
        </p>
      </header>

      <div style={{
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '2rem',
        lineHeight: '1.8',
        color: '#e0e0e0',
      }}>
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#FF006F' }}>
            Information pursuant to § 5 TMG
          </h2>
          <p style={{ marginBottom: '1.5rem' }}>
            <strong>Responsible for this website:</strong>
          </p>
          <p style={{ marginBottom: '0.5rem' }}>Tasy AI GmbH</p>
          <p>Represented by the Managing Director: Julius Kopp</p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#FF006F' }}>
            Address
          </h2>
          <p style={{ marginBottom: '0.5rem' }}>Karlsplatz 5</p>
          <p style={{ marginBottom: '0.5rem' }}>80335 Munich</p>
          <p>Germany</p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#FF006F' }}>
            Contact
          </h2>
          <p style={{ marginBottom: '0.5rem' }}>Email: help@tasy.ai</p>
          <p>Phone: +49 151 23402487</p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#FF006F' }}>
            Disclaimer
          </h2>
          <p style={{ marginBottom: '1rem' }}>
            We strive to keep the information on this website current, complete, and accurate. If you notice any errors, please inform us so we can correct them promptly.
          </p>
          <p>
            Despite careful content control, we accept no liability for the content of external links. The operators of linked pages are solely responsible for their content.
          </p>
        </section>
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <a
          href="/"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: '#FF006F',
            borderRadius: '8px',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}

