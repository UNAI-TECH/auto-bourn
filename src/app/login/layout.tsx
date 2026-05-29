import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | Auto Bourn Management',
  description: 'Sign in to the Auto Bourn Management Console',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
