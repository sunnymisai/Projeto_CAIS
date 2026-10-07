import Link from 'next/link';
import { Compass } from 'lucide-react';
import CaisLogo from '@/components/CaisLogo';

export default function NaoEncontrado() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-fundo px-6 text-center">
      <CaisLogo size={30} className="mb-10" />
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primaria-suave text-primaria"><Compass className="h-7 w-7" /></div>
      <h1 className="font-space text-2xl font-semibold text-tinta">Página não encontrada</h1>
      <p className="mt-2 max-w-md text-sm text-tinta-suave">O endereço pode ter mudado ou o item foi removido. Volte ao painel e continue de lá.</p>
      <Link href="/painel" className="mt-6 inline-flex h-10 items-center rounded-xl bg-botao px-4 text-sm font-semibold text-white hover:bg-botao-hover">Ir para o painel</Link>
    </main>
  );
}
