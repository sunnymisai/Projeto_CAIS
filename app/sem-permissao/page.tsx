"use client";

import Link from 'next/link';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import CaisLogo from '@/components/CaisLogo';

export default function SemPermissao() {
  const { sair } = useAuth();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-fundo px-6 text-center">
      <CaisLogo size={30} className="mb-10" />
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-aviso/12 text-aviso"><ShieldOff className="h-7 w-7" /></div>
      <h1 className="font-space text-2xl font-semibold text-tinta">Você não tem permissão para esta área</h1>
      <p className="mt-2 max-w-md text-sm text-tinta-suave">Esta parte do CAIS é exclusiva do perfil Administrador. Se precisa de acesso, fale com a coordenação do programa.</p>
      <Link href="/" onClick={sair} className="mt-6 inline-flex h-10 items-center rounded-xl bg-botao px-4 text-sm font-semibold text-white hover:bg-botao-hover">Entrar com outra conta</Link>
    </main>
  );
}
