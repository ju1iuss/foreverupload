import type { Metadata } from 'next';
import './globals.css';
import NextTopLoader from 'nextjs-toploader';

export const metadata: Metadata = {
  title: 'Pinterest Scheduler',
  description: 'Schedule and auto-post Pinterest pins',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#191919', color: '#fff' }}>
        <NextTopLoader
          color="#FF006F"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #FF006F,0 0 5px #FF006F"
        />
        {children}
      </body>
    </html>
  );
}

