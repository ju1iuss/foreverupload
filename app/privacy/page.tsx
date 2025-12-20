export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem', color: '#d2ccc6' }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#999', fontSize: '0.875rem' }}>
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#4A90E2' }}>
            1. Information We Collect
          </h2>
          <p style={{ marginBottom: '1rem' }}>
            ForeverUpload collects and processes the following information:
          </p>
          <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>Account information (email, authentication credentials via Supabase)</li>
            <li style={{ marginBottom: '0.5rem' }}>Pinterest account access tokens (stored securely server-side)</li>
            <li style={{ marginBottom: '0.5rem' }}>Images and content you upload for scheduling</li>
            <li style={{ marginBottom: '0.5rem' }}>Pinterest board information and metadata</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#4A90E2' }}>
            2. How We Use Your Information
          </h2>
          <p style={{ marginBottom: '1rem' }}>
            We use your information solely to:
          </p>
          <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>Provide content scheduling and posting services to Pinterest on your behalf</li>
            <li style={{ marginBottom: '0.5rem' }}>Display your Pinterest boards and account information within the app</li>
            <li style={{ marginBottom: '0.5rem' }}>Store your scheduled content until it is posted</li>
          </ul>
          <p style={{ fontWeight: 600, color: '#d2ccc6' }}>
            We DO NOT:
          </p>
          <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>Store Pinterest data (boards, user profiles) permanently - we fetch fresh data on each request</li>
            <li style={{ marginBottom: '0.5rem' }}>Share, sell, or transfer your data to third parties</li>
            <li style={{ marginBottom: '0.5rem' }}>Use your data for advertising or marketing purposes</li>
            <li style={{ marginBottom: '0.5rem' }}>Combine your data with data from other users or services</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#4A90E2' }}>
            3. Data Storage and Security
          </h2>
          <p style={{ marginBottom: '1rem' }}>
            Your data is stored securely using Supabase infrastructure with industry-standard encryption. Pinterest access tokens are stored server-side only and are never exposed to the client.
          </p>
          <p style={{ marginBottom: '1rem' }}>
            Images you upload are stored in Supabase Storage with private access controls, accessible only to your account.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#4A90E2' }}>
            4. Pinterest Integration
          </h2>
          <p style={{ marginBottom: '1rem' }}>
            ForeverUpload integrates with Pinterest via their official API. When you connect your Pinterest account:
          </p>
          <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>We request only the permissions necessary to post content on your behalf</li>
            <li style={{ marginBottom: '0.5rem' }}>Your Pinterest access token is stored securely and used only to fulfill your scheduling requests</li>
            <li style={{ marginBottom: '0.5rem' }}>We fetch board information and analytics from Pinterest only when you actively use the app</li>
            <li style={{ marginBottom: '0.5rem' }}>You can disconnect your Pinterest account at any time from the Settings page</li>
          </ul>
          <p>
            All posted content includes proper attribution and links back to Pinterest, in compliance with Pinterest's Developer Guidelines.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#4A90E2' }}>
            5. Your Rights
          </h2>
          <p style={{ marginBottom: '1rem' }}>
            You have the right to:
          </p>
          <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>Access your personal data</li>
            <li style={{ marginBottom: '0.5rem' }}>Request deletion of your account and all associated data</li>
            <li style={{ marginBottom: '0.5rem' }}>Revoke Pinterest access at any time</li>
            <li style={{ marginBottom: '0.5rem' }}>Export your scheduled content</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#4A90E2' }}>
            6. Age Requirement
          </h2>
          <p>
            ForeverUpload is intended for users aged 13 and older. By using this service, you confirm that you meet this age requirement. We do not knowingly collect information from children under 13.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#4A90E2' }}>
            7. Changes to This Policy
          </h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any significant changes by updating the "Last updated" date at the top of this page.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#4A90E2' }}>
            8. Contact Us
          </h2>
          <p>
            If you have any questions about this privacy policy or your data, please contact us through the app's settings page.
          </p>
        </section>
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <a
          href="/dashboard"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: '#4A90E2',
            borderRadius: '8px',
            color: '#d2ccc6',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}

