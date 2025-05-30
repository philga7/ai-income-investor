import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { HighlightInit } from '@highlight-run/next/client';
import { AuthProvider } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Income Investor',
  description: 'AI-powered income investing platform',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <HighlightInit
            projectId={process.env.NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID || ''}
            serviceName="ai-income-investor"
            tracingOrigins
            networkRecording={{
              enabled: true,
              recordHeadersAndBody: true,
              urlBlocklist: [],
            }}
          />
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <div className="flex min-h-screen flex-col">
              <Header />
              <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 overflow-x-hidden p-4 md:p-6">
                  {children}
                </main>
              </div>
            </div>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}