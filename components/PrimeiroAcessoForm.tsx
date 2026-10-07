/* ============================================================================
   PRIMEIROACESSOFORM.TSX — PRIMEIRO ACESSO POR CONVITE
   O que é: o cartão da tela /primeiro-acesso. Mostra nome e e-mail do convidado (somente leitura), pede nova senha com confirmação e o aceite dos termos e da LGPD; ao salvar, ativa a pessoa e abre a sessão.
   Onde é usado: app/primeiro-acesso/page.tsx (dentro de <Suspense>, porque lê ?convite= com useSearchParams).
   Depende de: lib/store (useDados), lib/auth (definirSenha, useAuth.iniciarSessao), lib/senha (senhaValida), lib/useFormulario, components/ui/RegrasSenha, components/ui/basicos (Aviso, Esqueleto), components/CartaoAcesso, components/input, components/button, components/checkbox e next/navigation.
   Contexto: §11 (convite por e-mail leva ao primeiro acesso), §12 fluxo 1 (convite → define senha → trilha obrigatória), §15 item 1 e docs/notas-next16.md §2 (useSearchParams + Suspense).
   ============================================================================ */
"use client";

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, User, TriangleAlert } from 'lucide-react';
import { useDados } from '@/lib/store';
import { definirSenha, useAuth } from '@/lib/auth';
import { senhaValida } from '@/lib/senha';
import { useFormulario } from '@/lib/useFormulario';
import { Aviso, Esqueleto } from '@/components/ui/basicos';
import RegrasSenha from '@/components/ui/RegrasSenha';
import { Cartao, VoltarAoLogin } from './CartaoAcesso';
import Input from './input';
import Button from './button';
import Checkbox from './checkbox';

/** Valores do formulário: a senha, a confirmação e o aceite dos termos. */
type Valores = { senha: string; confirmacao: string; aceite: boolean };

/**
 * Estado de erro: o convite não pode ser usado.
 * @param props.titulo - título curto do problema.
 * @param props.texto - explicação em português e o que fazer.
 * @returns o cartão de erro com o botão para o login.
 */
function ConviteIndisponivel({ titulo, texto }: { titulo: string; texto: string }) {
  const router = useRouter();
  return (
    <Cartao titulo={titulo} subtitulo="Não foi possível abrir este convite.">
      <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-erro/30 bg-erro/10 px-3.5 py-3 text-sm text-erro">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>{texto}</span>
      </div>
      {/* NAVEGA: leva ao login. */}
      <Button tamanho="lg" larguraTotal onClick={() => router.push('/login')}>Ir para o login</Button>
      <VoltarAoLogin />
    </Cartao>
  );
}

/**
 * Tela de primeiro acesso. Os quatro estados:
 * carregando (esqueleto até a store ler os dados), erro (convite inexistente, já usado ou inativo),
 * formulário (convite válido) e salvando (botão carregando).
 * @returns o cartão do estado atual.
 */
export default function PrimeiroAcessoForm() {
  const d = useDados();
  const { iniciarSessao } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const conviteId = params.get('convite');
  const [salvando, setSalvando] = useState(false);
  // Erro geral do salvamento (ex.: navegador não deixou gravar a senha).
  const [erroGeral, setErroGeral] = useState('');
  // true depois de ativar a conta: evita mostrar "convite já utilizado" no instante em que o status vira 'ativo', antes da troca de página.
  const [ativada, setAtivada] = useState(false);

  /**
   * Regras do formulário: senha dentro das regras, confirmação igual e aceite marcado.
   * useCallback mantém a mesma função entre renders, pois o useFormulario depende dela.
   * @param v - valores atuais.
   * @returns a mensagem de cada campo com erro.
   */
  const validar = useCallback((v: Valores) => {
    const e: Partial<Record<keyof Valores, string>> = {};
    if (!v.senha) e.senha = 'Crie uma senha.';
    else if (!senhaValida(v.senha)) e.senha = 'A senha ainda não cumpre todas as regras abaixo.';
    if (!v.confirmacao) e.confirmacao = 'Repita a senha.';
    else if (v.confirmacao !== v.senha) e.confirmacao = 'As senhas não são iguais. Digite a mesma senha nos dois campos.';
    if (!v.aceite) e.aceite = 'Para continuar, aceite os termos de uso e a política de privacidade (LGPD).';
    return e;
  }, []);
  const f = useFormulario<Valores>({ senha: '', confirmacao: '', aceite: false }, validar);

  // Estado "carregando": a store lê o navegador por uns instantes; nunca mostramos tela em branco.
  if (!d.pronto) {
    return (
      <Cartao titulo="Primeiro acesso" subtitulo="Carregando o seu convite…">
        <div role="status" className="space-y-3">
          <span className="sr-only">Carregando convite…</span>
          <Esqueleto className="h-12 w-full" /><Esqueleto className="h-12 w-full" /><Esqueleto className="h-12 w-full" />
        </div>
      </Cartao>
    );
  }

  // Conta ativada: a store já mudou o status, mas a página ainda está trocando para o painel.
  if (ativada) {
    return (
      <Cartao titulo="Conta ativada" subtitulo="Abrindo o seu painel…">
        <div role="status" className="space-y-3"><span className="sr-only">Conta ativada. Abrindo o painel…</span><Esqueleto className="h-12 w-full" /></div>
      </Cartao>
    );
  }

  // Estados de erro: sem ?convite=, id que não existe, pessoa que já usou o convite ou foi inativada.
  const pessoa = conviteId ? d.pessoa(conviteId) : undefined;
  if (!conviteId || !pessoa) {
    return <ConviteIndisponivel titulo="Convite não encontrado" texto="Este link de convite não é válido. Peça ao administrador do programa para reenviar o convite." />;
  }
  if (pessoa.status === 'ativo') {
    return <ConviteIndisponivel titulo="Convite já utilizado" texto="Esta conta já foi ativada. Entre com seu e-mail e a senha que você criou. Se esqueceu a senha, use “Esqueceu a senha?” no login." />;
  }
  if (pessoa.status === 'inativo') {
    return <ConviteIndisponivel titulo="Convite indisponível" texto="Esta conta está inativa. Fale com o administrador do programa para reativá-la." />;
  }

  /**
   * Salva a senha, ativa a pessoa, abre a sessão e vai para o painel.
   * @param ev - evento de envio do <form>.
   */
  const salvar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErroGeral('');
    if (!f.validarTudo()) return;
    setSalvando(true);
    // SIMULADO: espera 500 ms para fingir a resposta da API.
    await new Promise((r) => setTimeout(r, 500));
    // GRAVA: define a senha simulada (texto puro no localStorage; SIMULADO, NUNCA PARA PRODUÇÃO).
    // TODO(API): POST na API com o token do convite; a API ativa a conta e devolve o token de sessão.
    if (!definirSenha(pessoa.email, f.valores.senha)) {
      setErroGeral('Não foi possível salvar a senha neste navegador. Verifique se ele permite armazenamento e tente de novo.');
      setSalvando(false);
      return;
    }
    setAtivada(true);
    // GRAVA: o status da pessoa vira 'ativo' na store (o admin passa a vê-la como ativa em /pessoas).
    d.salvar('pessoas', { ...pessoa, status: 'ativo' });
    // GRAVA: abre a sessão (sessionStorage: some ao fechar o navegador).
    iniciarSessao({ id: pessoa.id, nome: pessoa.nome, email: pessoa.email, perfil: pessoa.perfil }, false);
    // NAVEGA: replace, para o "voltar" do navegador não reabrir o convite já usado.
    router.replace('/painel');
  };

  return (
    <Cartao titulo={`Bem-vindo, ${pessoa.nome.split(' ')[0]}`} subtitulo="Crie sua senha para ativar a conta e entrar no CAIS.">
      {erroGeral && <div className="mb-5"><Aviso tipo="erro" titulo="Não foi possível salvar">{erroGeral}</Aviso></div>}
      <form onSubmit={salvar} noValidate className="space-y-5">
        {/* Nome e e-mail vêm do cadastro: somente leitura (quem muda é o admin). */}
        <Input id="convidado-nome" label="Nome" value={pessoa.nome} readOnly icon={<User className="h-[18px] w-[18px]" />} />
        <Input id="convidado-email" label="E-mail (seu login)" value={pessoa.email} readOnly icon={<Mail className="h-[18px] w-[18px]" />} />
        <Input id="senha" type="password" label="Senha" placeholder="Crie uma senha" required autoComplete="new-password"
          disabled={salvando} {...f.campo('senha')} />
        {/* Lista de regras em tempo real (ícone + texto, aria-live educado). */}
        <RegrasSenha senha={f.valores.senha} />
        <Input id="confirmar-senha" type="password" label="Confirmar senha" placeholder="Repita a senha" required autoComplete="new-password"
          disabled={salvando} {...f.campo('confirmacao')} />
        <div>
          {/* Aceite obrigatório (§12). Os textos oficiais ainda não existem; o rótulo não leva a nenhuma página.
            * TODO(PROGLOGIC): confirmar os textos e os endereços dos termos de uso e da política de privacidade (LGPD). */}
          <Checkbox id="aceite" label="Li e aceito os termos de uso e a política de privacidade (LGPD)" disabled={salvando}
            checked={f.valores.aceite} onChange={(e) => f.set('aceite', e.target.checked)} onBlur={() => f.blur('aceite')}
            aria-invalid={f.erros.aceite ? true : undefined} aria-describedby={f.erros.aceite ? 'aceite-erro' : undefined} />
          {f.erros.aceite && <p id="aceite-erro" className="mt-1.5 text-[13px] font-medium text-erro">{f.erros.aceite}</p>}
        </div>
        <Button type="submit" tamanho="lg" larguraTotal isLoading={salvando} loadingText="Ativando…">Ativar conta e entrar</Button>
      </form>
      <VoltarAoLogin />
    </Cartao>
  );
}
