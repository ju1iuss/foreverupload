import type { Metadata } from 'next';
import './globals.css';
import NextTopLoader from 'nextjs-toploader';

export const metadata: Metadata = {
  title: 'ForeverUpload - Pinterest Scheduling Made Easy',
  description: 'Plan and schedule your Pinterest content with ForeverUpload',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#191919', color: '#d2ccc6' }}>
        <NextTopLoader
          color="#4A90E2"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #4A90E2,0 0 5px #4A90E2"
        />
        {children}
      </body>
    </html>
  );
}

