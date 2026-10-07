/* ============================================================================
   ABASEGURANCA.TSX — ABA "SEGURANÇA" DE MEU PERFIL
   O que é: formulário de troca de senha (senha atual, nova senha com regras em tempo real e confirmação).
   Onde é usado: app/(sistema)/perfil/page.tsx.
   Depende de: lib/auth (conferirSenha, definirSenha), lib/senha (senhaValida), lib/store (Pessoa), lib/toast, lib/useFormulario, components/ui/RegrasSenha, components/ui/basicos, components/input e components/button.
   Contexto: §8 (Onda 1: perfil e preferências), §7 (a senha de verdade é do back-end) e §15 item 1.
   ============================================================================ */
"use client";

import { useCallback, useState } from 'react';
import { Pessoa } from '@/lib/store';
import { conferirSenha, definirSenha } from '@/lib/auth';
import { senhaValida } from '@/lib/senha';
import { useToast } from '@/lib/toast';
import { useFormulario } from '@/lib/useFormulario';
import { Aviso, Card, CardTitulo } from '@/components/ui/basicos';
import RegrasSenha from '@/components/ui/RegrasSenha';
import Input from '@/components/input';
import Button from '@/components/button';

/** Valores do formulário de troca de senha. */
type Valores = { atual: string; nova: string; confirmacao: string };
const VAZIO: Valores = { atual: '', nova: '', confirmacao: '' };

/**
 * Aba Segurança: troca a senha da pessoa logada.
 * @param props.pessoa - o cadastro da pessoa logada (o e-mail é a chave da senha simulada).
 * @returns o card com o formulário.
 */
export default function AbaSeguranca({ pessoa }: { pessoa: Pessoa }) {
  const avisar = useToast();
  const [salvando, setSalvando] = useState(false);
  // Erro da senha atual (só se descobre ao conferir com lib/auth, por isso fica fora do useFormulario).
  const [erroAtual, setErroAtual] = useState('');
  // Erro geral do salvamento (ex.: navegador não deixou gravar).
  const [erroGeral, setErroGeral] = useState('');

  /**
   * Regras: senha atual preenchida, nova dentro das regras e diferente da atual, confirmação igual.
   * useCallback mantém a mesma função entre renders, pois o useFormulario depende dela.
   * @param v - valores atuais.
   * @returns a mensagem de cada campo com erro.
   */
  const validar = useCallback((v: Valores) => {
    const e: Partial<Record<keyof Valores, string>> = {};
    if (!v.atual) e.atual = 'Informe a sua senha atual.';
    if (!v.nova) e.nova = 'Crie uma nova senha.';
    else if (!senhaValida(v.nova)) e.nova = 'A nova senha ainda não cumpre todas as regras abaixo.';
    else if (v.nova === v.atual) e.nova = 'A nova senha precisa ser diferente da atual.';
    if (!v.confirmacao) e.confirmacao = 'Repita a nova senha.';
    else if (v.confirmacao !== v.nova) e.confirmacao = 'As senhas não são iguais. Digite a mesma senha nos dois campos.';
    return e;
  }, []);
  const f = useFormulario<Valores>(VAZIO, validar);

  /**
   * Confere a senha atual e grava a nova.
   * @param ev - evento de envio do <form>.
   */
  const salvar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErroGeral('');
    setErroAtual('');
    if (!f.validarTudo()) return;
    setSalvando(true);
    // SIMULADO: espera 500 ms para fingir a resposta da API.
    await new Promise((r) => setTimeout(r, 500));
    // Senha atual errada: avisa no campo certo e não troca nada.
    // TODO(API): a API confere a senha atual e responde 400/401.
    if (!conferirSenha(pessoa.email, f.valores.atual)) {
      setErroAtual('Senha atual incorreta. Confira e tente de novo.');
      setSalvando(false);
      return;
    }
    // GRAVA: troca a senha simulada (texto puro no localStorage; SIMULADO, NUNCA PARA PRODUÇÃO).
    if (!definirSenha(pessoa.email, f.valores.nova)) {
      setErroGeral('Não foi possível salvar a senha neste navegador. Verifique se ele permite armazenamento e tente de novo.');
      setSalvando(false);
      return;
    }
    // Limpa o formulário: a senha digitada não deve ficar na tela depois de salva.
    f.reiniciar(VAZIO);
    avisar('Senha alterada. Use a nova senha no próximo login.');
    setSalvando(false);
  };

  return (
    <Card>
      <CardTitulo titulo="Trocar senha" descricao="Informe a senha atual e crie uma nova." />
      <form onSubmit={salvar} noValidate className="max-w-md space-y-5 p-5">
        {erroGeral && <Aviso tipo="erro" titulo="Não foi possível salvar">{erroGeral}</Aviso>}
        <Input compacto id="senha-atual" type="password" label="Senha atual" required autoComplete="current-password" disabled={salvando}
          {...f.campo('atual')} error={erroAtual || f.erros.atual}
          onChange={(e) => { setErroAtual(''); f.set('atual', e.target.value); }} />
        <Input compacto id="senha-nova" type="password" label="Nova senha" required autoComplete="new-password" disabled={salvando} {...f.campo('nova')} />
        {/* Lista de regras em tempo real (ícone + texto, aria-live educado). */}
        <RegrasSenha senha={f.valores.nova} />
        <Input compacto id="senha-confirmar" type="password" label="Confirmar nova senha" required autoComplete="new-password" disabled={salvando} {...f.campo('confirmacao')} />
        <Button type="submit" isLoading={salvando} loadingText="Salvando…">Trocar senha</Button>
      </form>
    </Card>
  );
}
