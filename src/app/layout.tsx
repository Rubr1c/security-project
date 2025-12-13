import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers/QueryProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';



export const metadata: Metadata = {
  title: 'HealthCare',
  description: 'Secure healthcare management',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-dvh">

        <Providers>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
