/* ============================================================================
   FORMPROJETO.TSX
   O que é: o modal de criar ou editar um projeto.
   Onde é usado: app/(sistema)/projetos/page.tsx (botão "Novo projeto") e
                 app/(sistema)/projetos/[id]/page.tsx (editar o projeto aberto).
   Depende de: lib/store (useDados), lib/toast, lib/useFormulario, lib/seed
               (COLUNAS_PADRAO), next/navigation (useRouter), components/ui
               (Modal, form), components/button, components/input, lib/utils
               e ./cores (CORES_QUADRO).
   Contexto: §5 Projetos (criação: nasce Planejado, abre na aba Equipe, ganha
             as 4 colunas; contato depois da empresa; entrega não antes do
             início; rascunho com nome e empresa) e §11 Regras de cadastro.
   ============================================================================ */
"use client";

import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { useDados, Projeto } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { useFormulario } from '@/lib/useFormulario';
import { COLUNAS_PADRAO } from '@/lib/seed';
import Modal from '@/components/ui/Modal';
import Button from '@/components/button';
import Input from '@/components/input';
import { Select, AreaTexto, SecaoForm } from '@/components/ui/form';
import { hojeISO, novoId, somaDias, cx } from '@/lib/utils';
import { CORES_QUADRO } from './cores';

/** Valores do formulário: o projeto sem id, colunas e status (definidos ao salvar). */
type Val = Omit<Projeto, 'id' | 'colunas' | 'status'>;
// Opções do campo "Tipo" (opcional).
const TIPOS = ['Aplicação web', 'Aplicativo móvel', 'Dashboard', 'Integração', 'Site institucional', 'Outro'];

/**
 * Criação e edição de projeto (slide 18).
 * - O contato só habilita depois da empresa e lista apenas os contatos dela.
 * - A entrega não pode vir antes do início.
 * - "Salvar rascunho" exige só nome e empresa.
 * - Ao criar, o projeto nasce como Planejado e abre na aba Equipe.
 *
 * @param projeto projeto a editar; sem ele, o modal cria um novo.
 * @param onFechar fecha o modal.
 * @returns o modal com o formulário do projeto.
 */
export default function FormProjeto({ projeto, onFechar }: { projeto?: Projeto; onFechar: () => void }) {
  const d = useDados();
  const avisar = useToast();
  const router = useRouter();
  // Rascunho valida menos campos; a regra é lida na hora da validação.
  // useRef (e não useState) porque o valor precisa valer NA MESMA chamada
  // de salvar(), sem esperar um novo render.
  const modoRascunho = useRef(false);

  /*
   * Regras de validação (§5 e §11). O erro aparece ao sair do campo.
   * Nome e empresa são sempre obrigatórios; o resto só fora do rascunho.
   */
  const validar = useCallback((v: Val) => {
    const e: Partial<Record<keyof Val, string>> = {};
    if (!v.nome.trim()) e.nome = 'Dê um nome ao projeto.';
    if (!v.empresaId) e.empresaId = 'Escolha a empresa dona do projeto.';
    // Rascunho: basta nome e empresa (§5). Para aqui e não cobra o resto.
    if (modoRascunho.current) return e;
    if (!v.contatoNome) e.contatoNome = 'Escolha o contato da empresa.';
    if (!v.descricao.trim()) e.descricao = 'Descreva o que a empresa precisa.';
    if (!v.inicio) e.inicio = 'Informe a data de início.';
    if (!v.entrega) e.entrega = 'Informe a entrega prevista.';
    // Entrega não vem antes do início (§5). Datas ISO comparam certo como texto.
    else if (v.inicio && v.entrega < v.inicio) e.entrega = 'A entrega não pode vir antes do início.';
    if (!v.liderId) e.liderId = 'Escolha o líder do projeto.';
    return e;
  }, []);

  // Editando: parte do projeto existente. Novo: começa hoje, entrega em 60 dias, fundo roxo.
  const f = useFormulario<Val>(projeto ? { ...projeto } : {
    nome: '', tipo: '', empresaId: '', contatoNome: '', descricao: '', inicio: hojeISO(), entrega: somaDias(hojeISO(), 60), prioridade: 'media', liderId: '', cor: 'roxo',
  }, validar);
  const v = f.valores;

  const empresa = d.empresa(v.empresaId);
  /*
   * Contatos possíveis = contato principal da empresa + usuários de perfil
   * "empresa" ligados a ela. Set tira nomes repetidos; filter(Boolean) tira
   * vazios. Sem empresa escolhida, a lista fica vazia (contato só depois da empresa, §5).
   */
  const contatos = empresa ? [...new Set([empresa.contatoNome, ...d.pessoas.filter((p) => p.perfil === 'empresa' && p.empresaId === empresa.id).map((p) => p.nome)])].filter(Boolean) : [];
  // Líder: escolhido entre profissionais ativos já cadastrados.
  const lideres = d.pessoas.filter((p) => p.perfil === 'profissional' && p.status === 'ativo');

  /**
   * Valida e grava o projeto.
   * @param rascunho true = "Salvar rascunho" (só nome e empresa obrigatórios).
   */
  const salvar = (rascunho: boolean) => {
    // Avisa a validação de qual regra usar ANTES de validar.
    modoRascunho.current = rascunho;
    {
      // Com erro: os campos ficam destacados e um toast explica o que falta.
      if (!f.validarTudo()) { avisar(rascunho ? 'Para o rascunho, basta nome e empresa.' : 'Revise os campos destacados.', 'erro'); return; }
      // Edição: mantém id, status e colunas; troca só os campos do formulário.
      if (projeto) {
        // GRAVA: atualiza o projeto existente.
        // TODO(API): trocar por PUT do projeto.
        d.salvar('projetos', { ...projeto, ...f.valores });
        avisar('Projeto atualizado.');
        onFechar();
        return;
      }
      /*
       * Criação (§5): o projeto nasce como Planejado e ganha o quadro com as
       * 4 colunas padrão. O map copia cada coluna para os projetos não
       * dividirem o mesmo objeto de COLUNAS_PADRAO.
       */
      const novo: Projeto = { ...f.valores, id: novoId('prj'), status: 'planejado', colunas: COLUNAS_PADRAO.map((c) => ({ ...c })) };
      // GRAVA: cria o projeto na store.
      // TODO(API): trocar por POST do projeto.
      d.salvar('projetos', novo);
      avisar(rascunho ? 'Rascunho salvo como Planejado.' : 'Projeto criado. Agora, aloque a equipe.');
      onFechar();
      // NAVEGA: abre o projeto novo direto na aba Equipe (próximo passo é alocar).
      router.push(`/projetos/${novo.id}?aba=equipe`);
    }
  };

  return (
    <Modal aberto onFechar={onFechar} tamanho="lg" titulo={projeto ? 'Editar projeto' : 'Novo projeto'}
      descricao={projeto ? projeto.nome : 'O projeto nasce de uma empresa e já ganha um quadro com A fazer, Fazendo, Revisão e Pronto.'}
      rodape={<>
        <Button variante="secundario" onClick={onFechar}>Cancelar</Button>
        {/* Rascunho só existe na criação; na edição o projeto já existe. */}
        {!projeto && <Button variante="secundario" onClick={() => salvar(true)}>Salvar rascunho</Button>}
        <Button onClick={() => salvar(false)}>{projeto ? 'Salvar alterações' : 'Criar projeto'}</Button>
      </>}>
      {/* noValidate: quem valida é o useFormulario, não o navegador. Enter = salvar completo. */}
      <form onSubmit={(e) => { e.preventDefault(); salvar(false); }} noValidate className="space-y-7">
        <SecaoForm titulo="Identificação">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input compacto label="Nome do projeto" required placeholder="Ex.: Portal de pedidos" {...f.campo('nome')} />
            <Select label="Tipo" placeholder="Selecione" value={v.tipo} onChange={(e) => f.set('tipo', e.target.value)} opcoes={TIPOS.map((t) => ({ valor: t, rotulo: t }))} />
            <Select label="Empresa" required placeholder="Escolha a empresa" value={v.empresaId} error={f.erros.empresaId}
              // Trocar de empresa limpa o contato: o contato antigo era da outra empresa.
              onChange={(e) => { f.set('empresaId', e.target.value); f.set('contatoNome', ''); }} onBlur={() => f.blur('empresaId')}
              // Empresas encerradas não recebem projeto novo.
              opcoes={d.empresas.filter((e) => e.status !== 'encerrada').map((e) => ({ valor: e.id, rotulo: e.nomeFantasia }))} />
            {/* Contato só habilita depois da empresa (§5); o placeholder explica o porquê. */}
            <Select label="Contato da empresa" required disabled={!empresa} placeholder={empresa ? 'Escolha o contato' : 'Escolha a empresa primeiro'}
              value={v.contatoNome} error={f.erros.contatoNome} onChange={(e) => f.set('contatoNome', e.target.value)} onBlur={() => f.blur('contatoNome')}
              opcoes={contatos.map((c) => ({ valor: c, rotulo: c }))} />
          </div>
        </SecaoForm>

        <SecaoForm titulo="Escopo">
          <AreaTexto label="Descrição e entregas esperadas" required placeholder="O que a empresa precisa, em poucas linhas." rows={3}
            value={v.descricao} error={f.erros.descricao} onChange={(e) => f.set('descricao', e.target.value)} onBlur={() => f.blur('descricao')} />
        </SecaoForm>

        <SecaoForm titulo="Prazo e responsável">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input compacto label="Início" required type="date" {...f.campo('inicio')} />
            {/* min={v.inicio}: o calendário já bloqueia entrega antes do início (a validação confere de novo). */}
            <Input compacto label="Entrega prevista" required type="date" min={v.inicio} {...f.campo('entrega')} />
            <Select label="Prioridade" value={v.prioridade} onChange={(e) => f.set('prioridade', e.target.value as Projeto['prioridade'])}
              opcoes={[{ valor: 'baixa', rotulo: 'Baixa' }, { valor: 'media', rotulo: 'Média' }, { valor: 'alta', rotulo: 'Alta' }]} />
          </div>
          <Select label="Líder do projeto" required placeholder="Escolha uma pessoa já cadastrada" value={v.liderId} error={f.erros.liderId}
            onChange={(e) => f.set('liderId', e.target.value)} onBlur={() => f.blur('liderId')}
            opcoes={lideres.map((p) => ({ valor: p.id, rotulo: `${p.nome} · ${p.area}` }))} />
        </SecaoForm>

        <SecaoForm titulo="Fundo do quadro">
          {/* Grupo de rádio feito com botões: role/aria-checked dizem ao leitor de tela qual está marcado. */}
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Fundo do quadro">
            {Object.entries(CORES_QUADRO).map(([k, c]) => (
              // type="button" para clicar na cor não enviar o formulário.
              <button key={k} type="button" role="radio" aria-checked={v.cor === k} aria-label={c.nome} onClick={() => f.set('cor', k)}
                // ring-offset cria um respiro entre a amostra e o anel de seleção.
                className={cx('relative h-12 w-20 rounded-xl transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria focus-visible:ring-offset-2 focus-visible:ring-offset-superficie',
                  v.cor === k && 'ring-2 ring-primaria ring-offset-2 ring-offset-superficie')}
                style={{ background: c.fundo }}>
                {/* Check centralizado (absolute inset-0 m-auto) marca a cor escolhida, além do anel. */}
                {v.cor === k && <Check className="absolute inset-0 m-auto h-5 w-5 text-white" aria-hidden />}
              </button>
            ))}
          </div>
        </SecaoForm>
        {/* Botão invisível para o Enter enviar o formulário. */}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
