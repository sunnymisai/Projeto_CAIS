/* ============================================================================
   RECUPERARSENHAFORM.TSX — RECUPERAÇÃO DE SENHA (3 PASSOS, SIMULADA)
   O que é: o cartão da tela /recuperar-senha. Passo 1: e-mail. Passo 2: "e-mail enviado" (com o botão de demonstração que abre o link). Passo 3: nova senha e confirmação, com as regras em tempo real.
   Onde é usado: app/recuperar-senha/page.tsx (dentro de <Suspense>, porque lê a URL com useSearchParams).
   Depende de: lib/auth (definirSenha), lib/senha (senhaValida), lib/toast (useToast), lib/useFormulario, lib/utils (EMAIL_REGEX), components/ui/RegrasSenha, components/ui/basicos (Aviso), components/CartaoAcesso, components/input, components/button e next/navigation.
   Contexto: §15 item 1 (Login → Esqueci a senha → Recuperação de senha), §7 (a recuperação de verdade é do back-end) e docs/notas-next16.md §2 (useSearchParams + Suspense).
   ============================================================================ */
"use client";

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, MailCheck, ArrowRight, LinkIcon, TriangleAlert } from 'lucide-react';
import { definirSenha } from '@/lib/auth';
import { senhaValida } from '@/lib/senha';
import { useToast } from '@/lib/toast';
import { useFormulario } from '@/lib/useFormulario';
import { EMAIL_REGEX } from '@/lib/utils';
import { Aviso } from '@/components/ui/basicos';
import RegrasSenha from '@/components/ui/RegrasSenha';
import { Cartao, VoltarAoLogin } from './CartaoAcesso';
import Input from './input';
import Button from './button';

/**
 * Passo 1: pede o e-mail e "envia o link".
 * @param props.onEnviado - chamada com o e-mail digitado depois do "envio".
 * @returns o formulário do e-mail.
 */
function PedirLink({ onEnviado }: { onEnviado: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  // [PV-1] A REGRA DO E-MAIL do passo 1: obrigatório e no formato nome@empresa.com.
  /**
   * Valida o e-mail (vazio e formato) e devolve a mensagem de erro, ou '' se estiver certo.
   * @param valor - o e-mail digitado.
   */
  const validar = (valor: string) => {
    if (!valor.trim()) return 'Informe seu e-mail.';
    if (!EMAIL_REGEX.test(valor.trim())) return 'Use um e-mail no formato nome@empresa.com.';
    return '';
  };

  /**
   * Envia o pedido. A tela de sucesso é a MESMA exista ou não uma conta com esse e-mail.
   * @param e - evento de envio do <form>.
   */
  const enviar = async (e: React.FormEvent) => {
    // Impede o recarregamento da página (comportamento padrão do <form>).
    e.preventDefault();
    const msg = validar(email);
    setErro(msg);
    // E-mail inválido: não "envia" nada.
    if (msg) return;
    setEnviando(true);
    // [PV-2] O ENVIO DO LINK (simulado: espera 700 ms). A resposta é igual exista ou não a conta, para ninguém descobrir quem é cadastrado. TODO(API): pedir o e-mail à API.
    // SIMULADO: espera 700 ms para fingir a ida ao servidor e mostrar o botão carregando.
    // TODO(API): POST na API da PROGLOGIC pedindo o e-mail de redefinição; a API manda o link real.
    await new Promise((r) => setTimeout(r, 700));
    // ⚠️ ATENÇÃO: NÃO confira aqui se o e-mail existe. A resposta é igual para quem tem
    // conta e para quem não tem, para ninguém conseguir descobrir quem é cadastrado
    // testando e-mails (enumeração de usuários).
    onEnviado(email.trim());
  };

  return (
    <Cartao titulo="Recuperar senha" subtitulo="Informe o e-mail da sua conta. Vamos enviar um link para você criar uma nova senha.">
      {/* noValidate desliga os balões do navegador: usamos as nossas mensagens. */}
      <form onSubmit={enviar} noValidate className="space-y-5">
        <Input
          id="email"
          type="email"
          inputMode="email"
          label="E-mail"
          placeholder="voce@empresa.com"
          value={email}
          // Ao digitar: se já havia erro, revalida para ele sumir assim que corrigir.
          onChange={(e) => { setEmail(e.target.value); if (erro) setErro(validar(e.target.value)); }}
          // Ao sair do campo: mostra o erro (§11).
          onBlur={() => setErro(validar(email))}
          icon={<Mail className="h-[18px] w-[18px]" />}
          error={erro}
          required
          autoComplete="email"
          disabled={enviando}
        />
        <Button type="submit" tamanho="lg" larguraTotal isLoading={enviando} loadingText="Enviando…">
          Enviar link
          <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Button>
      </form>
      <VoltarAoLogin />
    </Cartao>
  );
}

/**
 * Passo 2: confirma o "envio" e (SIMULADO) oferece o botão que abre o link recebido.
 * @param props.email - o e-mail digitado no passo 1.
 * @returns a confirmação com o aviso de demonstração.
 */
function LinkEnviado({ email }: { email: string }) {
  const router = useRouter();
  return (
    <Cartao titulo="Confira seu e-mail" subtitulo="Se este e-mail estiver cadastrado, enviaremos um link para redefinir a senha. O link vale por pouco tempo.">
      {/* role="status": o leitor de tela anuncia a confirmação sem tirar o foco. */}
      <div role="status" className="mb-5 flex items-center justify-center gap-2 text-sm font-semibold text-sucesso">
        <MailCheck className="h-5 w-5" aria-hidden />Pedido enviado
      </div>
      {/* SIMULADO: no sistema real o link chega por e-mail. Aqui o botão faz esse papel.
        * TODO(API): remover o aviso e o botão; o link vem no e-mail enviado pela API. */}
      <Aviso tipo="info" titulo="Ambiente de demonstração"
        acao={
          // NAVEGA: abre o passo 3 com o "token" falso e o e-mail na URL.
          <Button tamanho="sm" variante="secundario" onClick={() => router.push(`/recuperar-senha?token=demo&email=${encodeURIComponent(email)}`)}>
            <LinkIcon className="h-4 w-4" aria-hidden />Abrir o link recebido
          </Button>
        }>
        Nenhum e-mail foi enviado de verdade. Use o botão para abrir o link como se tivesse chegado na caixa de entrada.
      </Aviso>
      <VoltarAoLogin />
    </Cartao>
  );
}

/** Valores do formulário do passo 3. */
type ValoresNovaSenha = { senha: string; confirmacao: string };

/**
 * Passo 3: define a nova senha.
 * @param props.email - e-mail da conta (vem do link, ?email=).
 * @returns o formulário de nova senha e confirmação.
 */
function NovaSenha({ email }: { email: string }) {
  const router = useRouter();
  const avisar = useToast();
  const [salvando, setSalvando] = useState(false);
  // Erro geral do salvamento (ex.: navegador não deixou gravar), mostrado no topo do formulário.
  const [erroGeral, setErroGeral] = useState('');

  // [PV-3] AS REGRAS DA NOVA SENHA: dentro das regras de lib/senha.ts e confirmação igual.
  /**
   * Regras do formulário: a senha precisa cumprir as regras e a confirmação precisa ser igual.
   * useCallback mantém a mesma função entre renders, pois o useFormulario depende dela.
   * @param v - valores atuais.
   * @returns a mensagem de cada campo com erro.
   */
  const validar = useCallback((v: ValoresNovaSenha) => {
    const e: Partial<Record<keyof ValoresNovaSenha, string>> = {};
    if (!v.senha) e.senha = 'Crie uma nova senha.';
    else if (!senhaValida(v.senha)) e.senha = 'A senha ainda não cumpre todas as regras abaixo.';
    if (!v.confirmacao) e.confirmacao = 'Repita a nova senha.';
    else if (v.confirmacao !== v.senha) e.confirmacao = 'As senhas não são iguais. Digite a mesma senha nos dois campos.';
    return e;
  }, []);
  const f = useFormulario<ValoresNovaSenha>({ senha: '', confirmacao: '' }, validar);

  // [PV-4] A TROCA DE SENHA: grava a nova senha (a antiga deixa de valer), avisa e volta ao login. TODO(API): vira PATCH com o token do link.
  /**
   * Salva a nova senha e volta para o login.
   * @param ev - evento de envio do <form>.
   */
  const salvar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErroGeral('');
    // Algum campo inválido: o useFormulario já mostra as mensagens.
    if (!f.validarTudo()) return;
    setSalvando(true);
    // SIMULADO: espera 500 ms para fingir a resposta da API.
    await new Promise((r) => setTimeout(r, 500));
    // GRAVA: troca a senha simulada no localStorage; a antiga deixa de funcionar.
    // TODO(API): PATCH/POST na API com o token do link; o back-end valida e expira o token.
    if (!definirSenha(email, f.valores.senha)) {
      setErroGeral('Não foi possível salvar a senha neste navegador. Verifique se ele permite armazenamento e tente de novo.');
      setSalvando(false);
      return;
    }
    avisar('Senha alterada. Entre com a nova senha.');
    // NAVEGA: replace, para o "voltar" do navegador não reabrir o formulário de senha.
    router.replace('/login');
  };

  return (
    <Cartao titulo="Criar nova senha" subtitulo={<>Conta: <strong className="font-semibold text-tinta">{email}</strong></>}>
      {erroGeral && <div className="mb-5"><Aviso tipo="erro" titulo="Não foi possível salvar">{erroGeral}</Aviso></div>}
      <form onSubmit={salvar} noValidate className="space-y-5">
        <Input id="nova-senha" type="password" label="Nova senha" placeholder="Crie uma senha" required autoComplete="new-password"
          disabled={salvando} {...f.campo('senha')} />
        {/* Lista de regras em tempo real (ícone + texto, aria-live educado). */}
        <RegrasSenha senha={f.valores.senha} />
        <Input id="confirmar-senha" type="password" label="Confirmar nova senha" placeholder="Repita a senha" required autoComplete="new-password"
          disabled={salvando} {...f.campo('confirmacao')} />
        <Button type="submit" tamanho="lg" larguraTotal isLoading={salvando} loadingText="Salvando…">Salvar nova senha</Button>
      </form>
      <VoltarAoLogin />
    </Cartao>
  );
}

/**
 * Estado de erro: o link é inválido (token errado ou e-mail ausente).
 * @returns a explicação e o caminho para pedir um novo link.
 */
function LinkInvalido() {
  const router = useRouter();
  return (
    <Cartao titulo="Link inválido" subtitulo="Este link de recuperação não é válido ou já expirou.">
      <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-erro/30 bg-erro/10 px-3.5 py-3 text-sm text-erro">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>Peça um novo link informando o e-mail da sua conta.</span>
      </div>
      {/* NAVEGA: volta ao passo 1 (sem ?token=). Botão (e não <a> com botão dentro) para não aninhar controles. */}
      <Button tamanho="lg" larguraTotal onClick={() => router.replace('/recuperar-senha')}>Pedir um novo link</Button>
      <VoltarAoLogin />
    </Cartao>
  );
}

/**
 * Tela de recuperação de senha: escolhe o passo pela URL e pelo que já aconteceu.
 * - com ?token= e ?email= válidos (token "demo"): passo 3 (nova senha);
 * - com ?token= inválido ou sem e-mail: estado de erro;
 * - sem token e já "enviado": passo 2; senão passo 1.
 * @returns o cartão do passo atual.
 */
export default function RecuperarSenhaForm() {
  const params = useSearchParams();
  // E-mail para o qual o link foi "enviado" no passo 1 (null = ainda não enviou).
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null);
  const token = params.get('token');
  const emailDoLink = params.get('email') ?? '';

  // [PV-5] QUAL PASSO ABRIR: com ?token= aceita só "demo" e e-mail válido (simulado, vira a validação da API) e mostra a nova senha; senão, link inválido. Sem token, passo 1 ou 2.
  // Veio de um link (?token=): só "demo" com e-mail em formato válido é aceito (SIMULADO).
  // TODO(API): a API valida o token de verdade (assinado, com validade e uso único).
  if (token !== null) {
    return token === 'demo' && EMAIL_REGEX.test(emailDoLink) ? <NovaSenha email={emailDoLink} /> : <LinkInvalido />;
  }
  return enviadoPara ? <LinkEnviado email={enviadoPara} /> : <PedirLink onEnviado={setEnviadoPara} />;
}
