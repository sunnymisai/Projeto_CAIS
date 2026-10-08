/* ============================================================================
   APP/(SISTEMA)/DESIGN-SYSTEM/PAGE.TSX
   O que é: a documentação viva do design system do CAIS: cada componente aparece funcionando, com todos os seus estados.
   Onde é usado: rota /design-system (protegida). Linkada pelo menu lateral (components/shell/navegacao.ts). Regra do time (CLAUDE.md): todo componente novo de components/ui deve ganhar uma seção aqui.
   Depende de: componentes de components/ui (form, basicos, Graficos, Tabela, Modal, RegrasSenha, Semaforo), components/button, components/input, components/checkbox, components/CaisLogo, CabecalhoPagina (components/shell/Pagina), useToast (lib/toast.tsx) e lucide-react.
   Contexto: docs/contexto-cais.md §9 (Design system e marca: "documentado ao vivo"), §10 (Anatomia de toda tela) e §13 (Qualidade: os quatro estados).
   ============================================================================ */
// "use client": as demonstrações usam estado (abas, modal, interruptor) e toast,
// que só funcionam no navegador (docs/notas-next16.md §1).
"use client";

import { ReactNode, useState } from 'react';
import { Mail, Plus, Trash2, Inbox } from 'lucide-react';
import { CabecalhoPagina } from '@/components/shell/Pagina';
import Button from '@/components/button';
import Input from '@/components/input';
import Checkbox from '@/components/checkbox';
import CaisLogo from '@/components/CaisLogo';
import { Select, AreaTexto, Segmentado, Interruptor } from '@/components/ui/form';
import { Card, Etiqueta, EtiquetaTarefa, Avatar, GrupoAvatares, Aviso, Abas, Paginacao, Progresso, Esqueleto, EstadoVazio, EstadoErro } from '@/components/ui/basicos';
import { BarraEmpilhada, Rosca, Colunas, COR_GRAFICO } from '@/components/ui/Graficos';
import { Tabela, Th, Td, Tr } from '@/components/ui/Tabela';
import Modal from '@/components/ui/Modal';
import RegrasSenha from '@/components/ui/RegrasSenha';
import { IndicadorCarga, LinhaDeSemanas, LegendaSemaforo } from '@/components/ui/Semaforo';
import { useToast } from '@/lib/toast';

/* Documentação viva: cada componente aparece com seus estados, como pede
   o slide 13 ("Documentado ao vivo"). */

/**
 * Tabela dos tokens de cor mostrada na seção "Tokens". Cada token tem um valor por tema.
 * @example
 * // na tela, use a classe do token: className="text-primaria" (nunca o hex solto)
 */
// ⚠️ ATENÇÃO: estes hex são só para exibir. A cor de verdade vem de app/globals.css;
// se um valor mudar lá e não for atualizado aqui, a documentação passa a mentir.
const CORES = [
  { nome: 'Primária', token: '--primaria', uso: 'Ação, foco, link, seleção', claro: '#7052F2', escuro: '#8F74FF' },
  { nome: 'Marca', token: '--marca', uso: 'Só o símbolo e ilustrações', claro: '#7C5CFF', escuro: '#8F74FF' },
  { nome: 'Sucesso', token: '--sucesso', uso: 'Concluído, válido, em dia', claro: '#047857', escuro: '#34D399' },
  { nome: 'Atenção', token: '--aviso', uso: 'Prazo perto, sobrecarga', claro: '#B45309', escuro: '#FBBF24' },
  { nome: 'Erro', token: '--erro', uso: 'Falha, atraso, excluir', claro: '#DC3545', escuro: '#FF6B7A' },
  { nome: 'Tinta', token: '--tinta', uso: 'Texto principal', claro: '#14161F', escuro: '#ECEDF3' },
  { nome: 'Névoa', token: '--fundo', uso: 'Fundo da aplicação', claro: '#F6F7FB', escuro: '#0B0C12' },
];

// Atalhos do topo da página: [id da seção, rótulo do link].
// ⚠️ ATENÇÃO: o id precisa ser igual ao id de uma <Secao>; se não for, o link âncora não rola para lugar nenhum.
const SECOES = [
  ['tokens', 'Tokens'], ['tipografia', 'Tipografia'], ['botoes', 'Botões'], ['campos', 'Campos'], ['selecao', 'Seleção'],
  ['etiquetas', 'Etiquetas e avatar'], ['feedback', 'Avisos e estados'], ['navegacao', 'Abas e paginação'], ['dados', 'Tabela e gráficos'], ['semaforo', 'Semáforo de carga'], ['modal', 'Modal'],
] as const;

/**
 * Bloco padrão de cada seção da documentação: título, descrição e um card com os exemplos.
 * @param id âncora usada pelos atalhos do topo (#id).
 * @param titulo nome da seção.
 * @param descricao regra de uso do componente, em uma frase.
 * @param children os exemplos ao vivo.
 * @returns a seção pronta.
 */
function Secao({ id, titulo, descricao, children }: { id: string; titulo: string; descricao: string; children: ReactNode }) {
  return (
    // scroll-mt-6: ao clicar no atalho, a seção para um pouco abaixo do topo, sem colar na borda.
    <section id={id} className="scroll-mt-6">
      <h2 className="font-space text-xl font-semibold text-tinta">{titulo}</h2>
      <p className="mb-4 mt-1 text-sm text-tinta-suave">{descricao}</p>
      <Card className="p-6">{children}</Card>
    </section>
  );
}

/**
 * Rótulo pequeno em caixa alta que nomeia um grupo de exemplos dentro de uma seção.
 * @param children texto do rótulo.
 * @returns o parágrafo estilizado.
 */
function Rot({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-tinta-suave">{children}</p>;
}

/**
 * Página do design system: a documentação viva do §9.
 * Em vez de imagens, mostra os componentes reais funcionando, com seus estados
 * (repouso, foco, erro, carregando, desabilitado, vazio...). Se o componente muda,
 * a documentação muda junto.
 * Todo componente novo deve ser documentado aqui, numa nova <Secao>.
 * @returns a página completa.
 */
export default function DesignSystem() {
  // Estados que existem só para as demonstrações interativas funcionarem. Nada é gravado.
  const avisar = useToast();
  const [aba, setAba] = useState<'a' | 'b' | 'c'>('a');
  const [seg, setSeg] = useState<'p' | 'e' | 'a'>('p');
  const [sw, setSw] = useState(true);
  const [pag, setPag] = useState(2);
  const [modal, setModal] = useState(false);
  const [carregando, setCarregando] = useState(false);
  // Senha digitada na demonstração das regras de senha (não é gravada em lugar nenhum).
  const [senhaDemo, setSenhaDemo] = useState('');

  return (
    // max-w-[1200px] e respiro crescente (p-4 → lg:p-8) iguais às outras telas.
    <div className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">
      <CabecalhoPagina titulo="Design System CAIS" descricao="O contrato visual do produto. Cada componente com os seus estados, não só o visual «normal»." />

      {/* Atalhos para as seções: links âncora (#id) que rolam a página até a seção. */}
      <nav aria-label="Seções do design system" className="mb-8 flex flex-wrap gap-2">
        {SECOES.map(([id, r]) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-borda bg-superficie px-3 py-1.5 text-[13px] font-semibold text-tinta-suave hover:border-primaria/40 hover:text-primaria">{r}</a>
        ))}
      </nav>

      {/*
        * Ao criar um componente novo em components/ui, acrescente aqui uma <Secao>
        * com todos os estados dele e um id novo em SECOES (regra do CLAUDE.md e do §9).
        */}
      <div className="space-y-10">
        <Secao id="tokens" titulo="Tokens de cor" descricao="Cor tem significado: verde é sucesso em toda tela. Os valores mudam por tema; o nome do token não.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CORES.map((c) => (
              <div key={c.token} className="overflow-hidden rounded-xl border border-borda">
                {/*
                  * Metade esquerda = valor no tema claro, metade direita = tema escuro.
                  * style inline aqui é exceção: a própria amostra precisa pintar o hex do token.
                  */}
                <div className="flex h-16">
                  <span className="flex-1" style={{ background: c.claro }} title={`Claro ${c.claro}`} />
                  <span className="flex-1" style={{ background: c.escuro }} title={`Escuro ${c.escuro}`} />
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-tinta">{c.nome}</p>
                  <p className="font-mono text-[11px] text-tinta-suave">{c.token}</p>
                  <p className="mt-1 text-[12px] text-tinta-suave">{c.uso}</p>
                  <p className="mt-1 font-mono text-[11px] text-tinta-fraca">{c.claro} · {c.escuro}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <Rot>Raio de canto</Rot>
              <div className="flex items-end gap-3">
                {/* Cada item: [nome do raio, classe do Tailwind, valor em px]. */}
                {[['sm', 'rounded-md', '6'], ['md', 'rounded-lg', '8'], ['lg', 'rounded-xl', '12'], ['xl', 'rounded-2xl', '16'], ['2xl', 'rounded-3xl', '24']].map(([n, c, px]) => (
                  <div key={n} className="text-center"><div className={`h-12 w-12 border-2 border-primaria bg-primaria-suave ${c}`} /><p className="mt-1 text-[11px] text-tinta-suave">{px}px</p></div>
                ))}
              </div>
            </div>
            <div>
              <Rot>Espaçamento (escala de 4 px)</Rot>
              <div className="flex items-end gap-2">
                {/* Escala de 4 px: o quadrado tem exatamente o tamanho em px do passo. */}
                {[4, 8, 12, 16, 24, 32, 48].map((s) => (
                  <div key={s} className="text-center"><div className="rounded-sm bg-primaria" style={{ width: s, height: s }} /><p className="mt-1 text-[11px] text-tinta-suave">{s}</p></div>
                ))}
              </div>
            </div>
          </div>
        </Secao>

        {/* Escala tipográfica do §9: Space Grotesk (font-space) para títulos, Archivo para o resto. */}
        <Secao id="tipografia" titulo="Tipografia" descricao="Space Grotesk para marca e títulos. Archivo para interface, texto e tabela densa.">
          <div className="space-y-4">
            <CaisLogo size={36} />
            <p className="font-space text-[32px] font-semibold leading-tight tracking-tight text-tinta">Título de página · 32/26</p>
            <p className="font-space text-xl font-semibold text-tinta">Título de seção · 20</p>
            <p className="font-space text-[17px] font-semibold text-tinta">Título de card · 17</p>
            <p className="text-[15px] text-tinta">Corpo · 15. Onboarding por trilhas, gestão de projetos e dashboards que mostram como tudo está andando.</p>
            <p className="text-sm text-tinta-suave">Apoio · 14. Texto secundário, descrições e ajuda.</p>
            <p className="text-[12px] text-tinta-suave">Legenda · 12. Contagens, datas e metadados.</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-tinta-suave">Rótulo de seção · 11</p>
          </div>
        </Secao>

        {/* "Uma ação primária por tela": a variante primária deve aparecer uma vez só em cada tela. */}
        <Secao id="botoes" titulo="Botões" descricao="Uma ação primária por tela. O botão nasce com repouso, hover, foco, carregando e desabilitado.">
          <Rot>Variantes</Rot>
          <div className="mb-6 flex flex-wrap gap-2">
            <Button><Plus className="h-4 w-4" />Primário</Button>
            <Button variante="secundario">Secundário</Button>
            <Button variante="fantasma">Fantasma</Button>
            <Button variante="perigo"><Trash2 className="h-4 w-4" />Perigo</Button>
          </div>
          <Rot>Tamanhos e estados</Rot>
          <div className="flex flex-wrap items-center gap-2">
            <Button tamanho="sm">Pequeno</Button>
            <Button>Médio</Button>
            <Button tamanho="lg">Grande</Button>
            <Button disabled>Desabilitado</Button>
            {/* SIMULADO: liga o carregando por 1,5 s só para mostrar o estado isLoading do botão. */}
            <Button isLoading={carregando} onClick={() => { setCarregando(true); setTimeout(() => setCarregando(false), 1500); }}>Clique para carregar</Button>
            <Button variante="secundario" onClick={() => avisar('Ação concluída com sucesso.')}>Mostrar toast</Button>
          </div>
        </Secao>

        {/*
          * Exemplos estáticos (defaultValue): mostram cada estado do campo sem precisar de useFormulario.
          * Nas telas reais o erro só aparece ao sair do campo (lib/useFormulario.ts).
          */}
        <Secao id="campos" titulo="Campos" descricao="O erro aparece ao sair do campo, não a cada tecla. Rótulo sempre visível; * indica obrigatório.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input compacto label="Repouso" placeholder="nome@empresa.com" icon={<Mail className="h-4 w-4" />} />
            <Input compacto label="Com dica" placeholder="00000-000" hint="Preenche o endereço automaticamente." />
            <Input compacto label="Com erro" required defaultValue="12.345.678/0001-00" error="CNPJ inválido. Confira os 14 dígitos." />
            {/* 11.222.333/0001-81 é um CNPJ de teste com dígitos verificadores válidos. */}
            <Input compacto label="Válido" defaultValue="11.222.333/0001-81" valid />
            <Input compacto label="Desabilitado" disabled placeholder="Escolha a empresa primeiro" />
            <Input compacto label="Senha" type="password" defaultValue="Cais@2026" />
            <div className="sm:col-span-2"><AreaTexto label="Área de texto" placeholder="Descreva em poucas linhas." /></div>
          </div>
          <div className="mt-6">
            <Rot>Tamanho padrão (login)</Rot>
            <div className="max-w-sm"><Input label="E-mail" placeholder="nome@empresa.com" icon={<Mail className="h-4 w-4" />} /></div>
          </div>
          {/* RegrasSenha (components/ui/RegrasSenha.tsx): digite para ver as regras serem cumpridas. */}
          <div className="mt-6">
            <Rot>Regras da senha em tempo real (ícone e texto, nunca só cor)</Rot>
            <div className="grid max-w-sm gap-3">
              <Input compacto label="Digite uma senha" type="password" value={senhaDemo} onChange={(e) => setSenhaDemo(e.target.value)} />
              <RegrasSenha senha={senhaDemo} />
            </div>
          </div>
        </Secao>

        <Secao id="selecao" titulo="Seleção" descricao="Select nativo estilizado (acessível e bom no celular), controle segmentado, interruptor e caixa de seleção.">
          <div className="grid gap-6 sm:grid-cols-2">
            <Select label="Select" placeholder="Selecione" opcoes={[{ valor: '1', rotulo: 'Em negociação' }, { valor: '2', rotulo: 'Ativa' }, { valor: '3', rotulo: 'Encerrada' }]} />
            {/* Lista de opções vazia de propósito: aqui só importa mostrar o estado de erro. */}
            <Select label="Select com erro" required placeholder="Selecione o papel" error="Escolha o papel no projeto." opcoes={[]} />
            <div><Rot>Segmentado</Rot><Segmentado rotulo="Perfil" valor={seg} onChange={setSeg} opcoes={[{ valor: 'p', rotulo: 'Profissional' }, { valor: 'e', rotulo: 'Empresa' }, { valor: 'a', rotulo: 'Administrador' }]} /></div>
            <div className="space-y-4">
              <Interruptor ligado={sw} onChange={setSw} rotulo="Interruptor" descricao="Enviar convite por e-mail ao salvar" />
              <Checkbox id="ds-check" label="Caixa de seleção" defaultChecked />
            </div>
          </div>
        </Secao>

        <Secao id="etiquetas" titulo="Etiquetas e avatar" descricao="Etiqueta de status (suave) e etiqueta de tarefa (sólida, estilo Trello). Avatar com iniciais e cor estável por nome.">
          <Rot>Status</Rot>
          <div className="mb-5 flex flex-wrap gap-2">
            <Etiqueta>Neutro</Etiqueta><Etiqueta tom="primaria" ponto>Em andamento</Etiqueta><Etiqueta tom="sucesso" ponto>Ativa</Etiqueta>
            <Etiqueta tom="aviso">Rascunho</Etiqueta><Etiqueta tom="erro" ponto>2 atrasadas</Etiqueta>
          </div>
          <Rot>Tarefa</Rot>
          <div className="mb-5 flex flex-wrap gap-1.5">{['Front', 'UX', 'API', 'QA', 'Gráfico', 'Login'].map((e) => <EtiquetaTarefa key={e} nome={e} />)}</div>
          <Rot>Avatar</Rot>
          <div className="flex flex-wrap items-center gap-4">
            <Avatar nome="Ana Souza" tamanho={24} /><Avatar nome="Bruno Lima" tamanho={32} /><Avatar nome="Carla Nunes" tamanho={40} />
            <GrupoAvatares nomes={['Ana Souza', 'Bruno Lima', 'Carla Nunes', 'Diego Alves', 'Elisa Rocha', 'Felipe Andrade']} />
          </div>
        </Secao>

        {/* Os quatro estados de toda tela (§13): carregando, vazio, com erro e com dado. */}
        <Secao id="feedback" titulo="Avisos e os quatro estados" descricao="Toda tela tem carregando, vazio, com erro e com dado. Erro diz o que houve, em português, e como tentar de novo.">
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <Aviso tipo="info" titulo="Informação">Uma pessoa pode receber trilhas das três camadas.</Aviso>
            <Aviso tipo="sucesso" titulo="Sucesso">Trilha publicada. 6 pessoas foram avisadas.</Aviso>
            <Aviso tipo="aviso" titulo="Atenção">A carga total passa de 40 h por semana. É aviso, não bloqueio.</Aviso>
            <Aviso tipo="erro" titulo="Não foi possível salvar" acao={<Button tamanho="sm" variante="secundario">Tentar de novo</Button>}>Sem conexão com o servidor.</Aviso>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-borda p-4"><Rot>Carregando</Rot><div className="space-y-2"><Esqueleto className="h-4 w-3/4" /><Esqueleto className="h-4 w-full" /><Esqueleto className="h-4 w-1/2" /></div></div>
            <div className="rounded-xl border border-borda"><EstadoVazio icone={<Inbox className="h-6 w-6" />} titulo="Vazio" descricao="Explica por que está vazio e oferece a próxima ação." acao={<Button tamanho="sm">Criar o primeiro</Button>} /></div>
            <div className="rounded-xl border border-borda md:col-span-2"><EstadoErro titulo="Com erro" descricao="Diz o que houve, em português, e como tentar de novo. É o que o layout mostra quando a store não consegue ler os dados." acoes={<Button tamanho="sm">Tentar de novo</Button>} /></div>
          </div>
          <div className="mt-5 space-y-3">
            <Rot>Progresso</Rot>
            <Progresso valor={35} rotulo="Exemplo primária" /><Progresso valor={100} tom="sucesso" rotulo="Exemplo sucesso" /><Progresso valor={70} tom="aviso" fino rotulo="Exemplo atenção" />
          </div>
        </Secao>

        {/* As abas trocam com as setas do teclado; a paginação mostra a contagem no rodapé da lista (§10). */}
        <Secao id="navegacao" titulo="Abas e paginação" descricao="Abas navegáveis pelas setas do teclado. Paginação com contagem do resultado no rodapé da lista.">
          <Abas rotulo="Exemplo" ativa={aba} onChange={setAba} abas={[{ id: 'a', rotulo: 'Visão geral' }, { id: 'b', rotulo: 'Equipe', contagem: 4 }, { id: 'c', rotulo: 'Tarefas', contagem: 9 }]} />
          <p className="py-6 text-sm text-tinta-suave">Conteúdo da aba selecionada ({aba === 'a' ? 'Visão geral' : aba === 'b' ? 'Equipe' : 'Tarefas'}).</p>
          <Paginacao pagina={pag} total={42} porPagina={10} onChange={setPag} rotuloItem="empresas" />
        </Secao>

        {/* Tabela e gráficos com dados fictícios, só para mostrar a aparência e os estados. */}
        <Secao id="dados" titulo="Tabela e gráficos" descricao="Tabela densa com rolagem horizontal própria. Gráficos em SVG com resumo em texto para leitor de tela.">
          <div className="mb-6 overflow-hidden rounded-xl border border-borda">
            <Tabela rotulo="Exemplo de tabela">
              <thead><tr><Th>Pessoa</Th><Th>Papel</Th><Th>Carga</Th><Th>Status</Th></tr></thead>
              <tbody>
                {[['Ana Souza', 'Líder', '20 h', 'sucesso'], ['Bruno Lima', 'Front-end', '45 h', 'aviso'], ['Carla Nunes', 'UX', '15 h', 'sucesso']].map(([n, p, c, t]) => (
                  <Tr key={n}><Td><span className="flex items-center gap-2"><Avatar nome={n} tamanho={26} />{n}</span></Td><Td>{p}</Td><Td className="tabular-nums">{c}</Td>
                    <Td><Etiqueta tom={t as 'sucesso' | 'aviso'} ponto>{t === 'aviso' ? 'Sobrecarga' : 'Ok'}</Etiqueta></Td></Tr>
                ))}
              </tbody>
            </Tabela>
          </div>
          <div className="grid items-center gap-8 md:grid-cols-3">
            {/* Os gráficos recebem a cor por prop; os hex abaixo reproduzem as cores da marca (§9) só na demonstração. */}
            <div className="flex justify-center"><Rosca centro="14" subcentro="conclusões" segmentos={[{ rotulo: 'Concluídas', valor: 14, cor: COR_GRAFICO.concluida }, { rotulo: 'Andamento', valor: 5, cor: COR_GRAFICO.andamento }, { rotulo: 'Não iniciadas', valor: 3, cor: COR_GRAFICO.naoIniciada }]} /></div>
            <div className="space-y-3"><BarraEmpilhada segmentos={[{ rotulo: 'A', valor: 5, cor: COR_GRAFICO.concluida }, { rotulo: 'B', valor: 3, cor: COR_GRAFICO.andamento }, { rotulo: 'C', valor: 2, cor: COR_GRAFICO.naoIniciada }]} /><BarraEmpilhada segmentos={[{ rotulo: 'A', valor: 2, cor: COR_GRAFICO.concluida }, { rotulo: 'B', valor: 6, cor: COR_GRAFICO.andamento }, { rotulo: 'C', valor: 2, cor: COR_GRAFICO.naoIniciada }]} /></div>
            <Colunas altura={90} itens={[{ rotulo: 'A fazer', valor: 4, cor: COR_GRAFICO.aFazer }, { rotulo: 'Fazendo', valor: 5, cor: COR_GRAFICO.andamento }, { rotulo: 'Revisão', valor: 1, cor: COR_GRAFICO.revisao }, { rotulo: 'Pronto', valor: 4, cor: COR_GRAFICO.concluida }]} />
          </div>
        </Secao>

        {/* Semáforo de carga (bloco F, lib/carga.ts): os quatro níveis em pílula, a fileira de semanas e a legenda.
          * Cor nunca sozinha: cada nível tem ícone próprio e o texto (por extenso ou no aria-label do compacto). */}
        <Secao id="semaforo" titulo="Semáforo de carga" descricao="Ocupação da pessoa pelo pico do dia mais cheio. Ícone, número e texto juntos; a cor reforça, não substitui.">
          <div className="space-y-5">
            <div>
              <Rot>Indicador (normal e compacto)</Rot>
              <div className="flex flex-wrap items-center gap-2">
                <IndicadorCarga nivel="livre" pct={0} /><IndicadorCarga nivel="verde" pct={50} /><IndicadorCarga nivel="amarelo" pct={90} /><IndicadorCarga nivel="vermelho" pct={112.5} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <IndicadorCarga nivel="livre" pct={0} compacto /><IndicadorCarga nivel="verde" pct={50} compacto /><IndicadorCarga nivel="amarelo" pct={90} compacto /><IndicadorCarga nivel="vermelho" pct={112.5} compacto />
              </div>
            </div>
            <div>
              <Rot>Linha de semanas</Rot>
              <LinhaDeSemanas rotulo="Exemplo de linha de semanas" semanas={[
                { segunda: '2026-10-12', pct: 112.5, nivel: 'vermelho' }, { segunda: '2026-10-19', pct: 90, nivel: 'amarelo' },
                { segunda: '2026-10-26', pct: 50, nivel: 'verde' }, { segunda: '2026-11-02', pct: 0, nivel: 'livre' },
              ]} />
            </div>
            <div>
              <Rot>Legenda</Rot>
              <LegendaSemaforo />
            </div>
          </div>
        </Secao>

        {/* Modal: prende o foco, fecha com Esc ou clique fora e devolve o foco ao botão que abriu. */}
        <Secao id="modal" titulo="Modal" descricao="Abre por cima, prende o foco, fecha com Esc ou clicando fora e devolve o foco a quem abriu.">
          <Button onClick={() => setModal(true)}>Abrir modal</Button>
          <Modal aberto={modal} onFechar={() => setModal(false)} titulo="Alocar pessoa" descricao="Portal de pedidos" tamanho="sm"
            // O botão "Alocar" só fecha o modal e mostra um toast: é demonstração, nada é gravado.
            rodape={<><Button variante="secundario" onClick={() => setModal(false)}>Cancelar</Button><Button onClick={() => { setModal(false); avisar('Pessoa alocada.'); }}>Alocar</Button></>}>
            <div className="space-y-4">
              <Input compacto label="Pessoa" required placeholder="Buscar por nome" />
              <Aviso tipo="aviso">A carga total passa de 40 h por semana. Dá para confirmar mesmo assim.</Aviso>
            </div>
          </Modal>
        </Secao>
      </div>
    </div>
  );
}
