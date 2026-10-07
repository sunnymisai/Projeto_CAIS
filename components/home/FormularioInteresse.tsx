/* ============================================================================
   FORMULARIOINTERESSE.TSX — FORMULÁRIO "QUERO TRAZER MINHA EMPRESA"
   O que é: formulário em que a empresa conta o interesse em participar do
   programa. O envio é SIMULADO (ainda não existe API).
   Onde é usado: app/page.tsx (âncora #participar, destino do botão do Hero).
   Depende de: lib/useFormulario.ts, lib/utils.ts (máscaras, cnpjValido,
   EMAIL_REGEX, soDigitos), lib/toast.tsx (useToast), components/input.tsx,
   components/button.tsx, components/ui/form.tsx (Select, AreaTexto),
   components/ui/basicos.tsx (Aviso) e ./CabecalhoSecao.
   Contexto: §11 (regras de cadastro: CNPJ com máscara e erro ao sair do
   campo) e §15 item 0 (homepage).
   ============================================================================ */
"use client";

import { FormEvent, useRef, useState } from "react";
import { Building2, CircleCheck, FileText, Mail, Phone, User } from "lucide-react";
import Input from "@/components/input";
import Button from "@/components/button";
import { AreaTexto, Select } from "@/components/ui/form";
import { Aviso } from "@/components/ui/basicos";
import { useFormulario } from "@/lib/useFormulario";
import { useToast } from "@/lib/toast";
import { EMAIL_REGEX, cnpjValido, mascaraCNPJ, mascaraTelefone, soDigitos } from "@/lib/utils";
import CabecalhoSecao from "./CabecalhoSecao";

// SIMULADO: troque para true para ver o estado de ERRO DE ENVIO na tela.
// Com a API da PROGLOGIC, o erro virá da resposta do servidor e esta constante some.
// TODO(API): remover quando o envio for real.
const SIMULAR_ERRO_DE_ENVIO = false;

// SIMULADO: tempo de espera que finge a ida ao servidor (700 ms).
const ESPERA_SIMULADA_MS = 700;

/** Valores do formulário. Tudo é texto porque vem de campos de formulário. */
interface Interesse extends Record<string, unknown> {
  razaoSocial: string;
  cnpj: string;
  contato: string;
  email: string;
  telefone: string;
  segmento: string;
  mensagem: string;
}

// Formulário vazio (usado no início e em "Enviar outro").
const VAZIO: Interesse = { razaoSocial: "", cnpj: "", contato: "", email: "", telefone: "", segmento: "", mensagem: "" };

// Opções do segmento (campo opcional).
// Lista genérica: não vem do deck, a PROGLOGIC pode ajustar.
const SEGMENTOS = ["Tecnologia", "Indústria", "Comércio e serviços", "Educação", "Saúde", "Financeiro", "Outro"].map((s) => ({
  valor: s,
  rotulo: s,
}));

/**
 * Valida os campos do formulário (função pura, fora do componente para o
 * useFormulario receber sempre a mesma função).
 * Obrigatórios: razão social, CNPJ (com dígitos verificadores), contato e e-mail.
 * Telefone e segmento são opcionais; o telefone, se preenchido, precisa de DDD + número.
 *
 * @param v valores atuais do formulário.
 * @returns objeto { campo: "mensagem" } só com os campos que têm erro.
 * @example validar({ ...VAZIO }).cnpj // "Informe o CNPJ."
 */
function validar(v: Interesse): Partial<Record<keyof Interesse, string>> {
  const e: Partial<Record<keyof Interesse, string>> = {};
  if (!v.razaoSocial.trim()) e.razaoSocial = "Informe a razão social.";
  if (!v.cnpj.trim()) e.cnpj = "Informe o CNPJ.";
  else if (!cnpjValido(v.cnpj)) e.cnpj = "CNPJ inválido. Confira os números.";
  if (!v.contato.trim()) e.contato = "Informe o nome da pessoa de contato.";
  if (!v.email.trim()) e.email = "Informe o e-mail.";
  else if (!EMAIL_REGEX.test(v.email.trim())) e.email = "E-mail inválido. Use o formato nome@empresa.com.br.";
  // Telefone é opcional: só reclama se a pessoa começou a digitar e ficou incompleto.
  const digitos = soDigitos(v.telefone).length;
  if (v.telefone.trim() && digitos < 10) e.telefone = "Telefone incompleto. Use DDD + número.";
  return e;
}

/**
 * Seção com o formulário de interesse da empresa. Client Component, porque
 * guarda os valores, valida e reage ao envio.
 *
 * Estados da tela: vazio, com erro de campo, enviando, enviado e erro de envio.
 *
 * @returns a <section id="participar">.
 */
export default function FormularioInteresse() {
  const f = useFormulario<Interesse>(VAZIO, validar);
  const avisar = useToast();
  // "preenchendo" (vazio ou com erro de campo), "enviando", "enviado" ou "erro" (falha no envio).
  const [fase, setFase] = useState<"preenchendo" | "enviando" | "enviado" | "erro">("preenchendo");
  const formRef = useRef<HTMLFormElement>(null);
  // Mensagem de sucesso: recebe o foco ao aparecer, para o leitor de tela anunciá-la.
  const sucessoRef = useRef<HTMLDivElement>(null);

  /**
   * Envio do formulário.
   * 1) Valida tudo; se houver erro, leva o foco ao primeiro campo com erro.
   * 2) Se estiver tudo certo, finge o envio (SIMULADO) e mostra o resultado.
   *
   * @param ev evento de envio (a página não deve recarregar).
   */
  async function enviar(ev: FormEvent<HTMLFormElement>) {
    // Impede o envio nativo do navegador, que recarregaria a página.
    ev.preventDefault();

    if (!f.validarTudo()) {
      // Espera o React desenhar as mensagens de erro (aria-invalid) e foca o primeiro campo inválido.
      setTimeout(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return;
    }

    // Botão vira "Enviando…" e fica desabilitado: evita envio duplicado.
    setFase("enviando");

    // SIMULADO: espera 700 ms como se estivesse falando com o servidor.
    // TODO(API): trocar por um POST na API da PROGLOGIC com os valores de `f.valores`.
    await new Promise((resolve) => setTimeout(resolve, ESPERA_SIMULADA_MS));

    // SIMULADO: falha de envio, ligada pela constante lá em cima.
    if (SIMULAR_ERRO_DE_ENVIO) {
      setFase("erro");
      return;
    }

    // GRAVA: nada é gravado de verdade neste protótipo; só mostra o toast e a mensagem de sucesso.
    avisar("Interesse enviado com sucesso.");
    setFase("enviado");
    // Leva o foco à mensagem de sucesso (o formulário que tinha o foco saiu da tela).
    setTimeout(() => sucessoRef.current?.focus(), 0);
  }

  /** "Enviar outro": limpa o formulário, volta ao estado inicial e foca o 1º campo. */
  function enviarOutro() {
    f.reiniciar(VAZIO);
    setFase("preenchendo");
    setTimeout(() => document.getElementById("interesse-razao")?.focus(), 0);
  }

  const enviando = fase === "enviando";

  return (
    <section id="participar" aria-labelledby="titulo-participar" className="scroll-mt-20 bg-fundo py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <div>
          <CabecalhoSecao
            rotulo="Participar"
            idTitulo="titulo-participar"
            titulo="Quero trazer minha empresa"
            descricao="Conte um pouco sobre a sua empresa. A coordenação do programa entra em contato."
          />
        </div>

        <div className="rounded-2xl border border-borda bg-superficie p-6 shadow-card sm:p-8">
          {fase === "enviado" ? (
            // Estado "enviado": a mensagem ocupa o lugar do formulário.
            // tabIndex -1: pode receber foco por código, mas não entra na ordem do Tab.
            <div ref={sucessoRef} tabIndex={-1} role="status" className="flex flex-col items-start gap-4 focus:outline-none">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sucesso/12 text-sucesso">
                <CircleCheck className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="font-space text-xl font-semibold text-tinta">
                Recebemos seu interesse. A coordenação do programa entra em contato.
              </p>
              <Button variante="secundario" onClick={enviarOutro}>
                Enviar outro
              </Button>
            </div>
          ) : (
            // noValidate: desliga as mensagens nativas do navegador; quem valida é o useFormulario,
            // com o erro aparecendo ao sair do campo (padrão do sistema).
            <form ref={formRef} onSubmit={enviar} noValidate className="space-y-5">
              {/* Estado de erro de envio: diz o que houve e como tentar de novo. */}
              {fase === "erro" && (
                <Aviso tipo="erro" titulo="Não foi possível enviar agora">
                  Seus dados continuam aqui. Confira a conexão e clique em Enviar de novo.
                </Aviso>
              )}

              <Input
                id="interesse-razao"
                label="Razão social"
                required
                autoComplete="organization"
                icon={<Building2 className="h-[18px] w-[18px]" />}
                {...f.campo("razaoSocial")}
              />
              <Input
                label="CNPJ"
                required
                inputMode="numeric"
                autoComplete="off"
                placeholder="00.000.000/0000-00"
                icon={<FileText className="h-[18px] w-[18px]" />}
                {...f.campo("cnpj", mascaraCNPJ)}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Nome do contato"
                  required
                  autoComplete="name"
                  icon={<User className="h-[18px] w-[18px]" />}
                  {...f.campo("contato")}
                />
                <Input
                  label="E-mail"
                  type="email"
                  required
                  autoComplete="email"
                  icon={<Mail className="h-[18px] w-[18px]" />}
                  {...f.campo("email")}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Telefone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                  hint="Opcional."
                  icon={<Phone className="h-[18px] w-[18px]" />}
                  {...f.campo("telefone", mascaraTelefone)}
                />
                <Select label="Segmento" opcoes={SEGMENTOS} placeholder="Selecione…" {...f.campo("segmento")} />
              </div>
              <AreaTexto label="Mensagem" rows={4} placeholder="Conte o que a sua empresa procura (opcional)." {...f.campo("mensagem")} />

              <p className="text-[13px] text-tinta-suave">
                <span className="text-erro" aria-hidden="true">*</span> Campos obrigatórios.
              </p>

              <Button type="submit" tamanho="lg" isLoading={enviando} loadingText="Enviando…">
                {fase === "erro" ? "Tentar de novo" : "Enviar interesse"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
