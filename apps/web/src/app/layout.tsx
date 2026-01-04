import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ProgressionProvider } from '@/lib/progression-context';

export const metadata: Metadata = {
  title: 'CodingCrazy - Learn to Code by Playing',
  description: 'Master programming through fun, interactive coding challenges. Write code to control characters, solve puzzles, and level up your skills!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ProgressionProvider>
            {children}
          </ProgressionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
