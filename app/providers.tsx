"use client";

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';
import { DadosProvider } from '@/lib/store';
import { ToastProvider } from '@/lib/toast';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DadosProvider>
        <ToastProvider>{children}</ToastProvider>
      </DadosProvider>
    </AuthProvider>
  );
}
