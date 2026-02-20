import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AiBuilder — Turn thoughts into websites instantly',
  description:
    'Create, customize and publish websites faster than ever with our AI Site Builder. Powered by DeepSeek and Groq.',
  keywords: 'AI website builder, AI web design, website generator, no-code',
  openGraph: {
    title: 'AiBuilder — AI-Powered Website Builder',
    description: 'Turn any idea into a stunning website in seconds.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-background text-white antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
