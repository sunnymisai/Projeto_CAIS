/* ============================================================================
   CAMPOLOGO.TSX — CAMPO DE UPLOAD DO LOGO DA EMPRESA
   O que é: um campo para escolher a imagem do logo (PNG, JPG, WebP ou SVG), ver como ela fica sobre fundo claro ou escuro e remover.
   Onde é usado: components/temas/EditorTema.tsx (seção "Identidade da empresa").
   Depende de: react, components/button, lib/temas (LOGO_MAX_BYTES, LOGO_TIPOS, lerArquivoLogo) e lib/utils (cx).
   Contexto: docs/temas-contrato.md (identidade da empresa no tema, fase 2); §9 (design system) e §11 (erro em português, com o que fazer).
   ============================================================================ */
"use client";

import { useEffect, useRef, useState } from 'react';
import Button from '@/components/button';
import { LOGO_MAX_BYTES, LOGO_TIPOS, lerArquivoLogo } from '@/lib/temas';
import { cx } from '@/lib/utils';

/** Texto do limite de tamanho, calculado do mesmo valor que a validação usa (nunca fica desatualizado). */
const LIMITE_EM_KB = Math.round(LOGO_MAX_BYTES / 1024);

// [PV-1] AS MEDIDAS RECOMENDADAS PARA O LOGO: a orientação mostrada na tela e os limites dos avisos (não bloqueiam). O cabeçalho desenha o logo com 30 a 40 px de altura e no máximo 128 px de largura (components/marca/LogoDaMarca.tsx, [PV-1] de lá): por isso o ideal é horizontal, entre 3:1 e 4:1. Se mudar aquele limite, ajuste estes números.
/** Menor largura (px) de uma imagem de pixels antes de o aviso de "pode ficar borrada" aparecer (o cabeçalho a mostra em ~128 px; o dobro cobre telas de alta resolução). */
const LARGURA_MINIMA_PX = 256;
/** Proporção (largura ÷ altura) abaixo da qual o logo é "quase quadrado ou vertical" e fica pequeno no cabeçalho. */
const PROPORCAO_MINIMA = 1.5;
/** Proporção acima da qual o logo é tão comprido que o cabeçalho o encolhe para caber nos 128 px. */
const PROPORCAO_MAXIMA = 4.5;
/** Medida de exemplo exibida na orientação (proporção 3,4:1). */
const MEDIDA_IDEAL = '480 × 140 px';

/**
 * Descobre o tamanho em pixels de uma imagem (data URL). Quem usa decide o aviso de qualidade.
 * SVG pode não informar tamanho (vira 0): como ele escala sem perder nitidez, só a proporção é avaliada quando existe.
 * @param src data URL da imagem.
 * @returns `{ largura, altura }` medidos (ou null enquanto carrega / se a imagem não abre).
 */
function useMedidasDaImagem(src?: string) {
  // Guarda junto de qual imagem (`src`) é a medida: se a imagem mudou e a nova ainda não carregou, a medida velha é ignorada.
  const [lida, setLida] = useState<{ src: string; largura: number; altura: number } | null>(null);
  // Roda ao trocar a imagem; `ativo` evita gravar o resultado de uma imagem antiga se a pessoa trocar rápido. Só grava dentro do onload (nunca direto no efeito).
  useEffect(() => {
    if (!src) return;
    let ativo = true;
    const img = new Image();
    img.onload = () => { if (ativo) setLida({ src, largura: img.naturalWidth, altura: img.naturalHeight }); };
    img.src = src;
    return () => { ativo = false; };
  }, [src]);
  return lida && lida.src === src ? lida : null;
}

/**
 * Campo de logo: botão de escolher arquivo, miniatura sobre o fundo certo e botão de remover.
 * O arquivo é lido e validado por `lerArquivoLogo` (tipo e tamanho); a imagem NUNCA vira HTML, só `<img>`.
 * @param rotulo título do campo, ex.: "Logo para fundo claro".
 * @param fundo sobre qual fundo este logo será usado: dá o fundo da miniatura (claro = branco, escuro = painel escuro).
 * @param valor data URL atual do logo (ou vazio).
 * @param onChange chamada com o novo data URL, ou `undefined` ao remover.
 * @returns o campo com mensagem de erro em texto quando o arquivo é recusado.
 * @example <CampoLogo rotulo="Logo para fundo claro" fundo="claro" valor={id.logoClaro} onChange={(v) => mudar('logoClaro', v)} />
 */
export default function CampoLogo({ rotulo, fundo, valor, onChange, orientacaoCompleta = true }: {
  rotulo: string; fundo: 'claro' | 'escuro'; valor?: string; onChange: (valor: string | undefined) => void;
  /** Mostra a orientação inteira de medidas. Com dois campos lado a lado, só o primeiro precisa dela (o segundo mostra só o formato e o limite). */
  orientacaoCompleta?: boolean;
}) {
  // O input de arquivo fica escondido; o botão visível o aciona (teclado e leitor de tela funcionam pelo botão).
  const entrada = useRef<HTMLInputElement>(null);
  // Mensagem de erro do último arquivo recusado. Some ao escolher outro ou remover.
  const [erro, setErro] = useState<string | null>(null);
  const idErro = `${rotulo.replace(/\s+/g, '-').toLowerCase()}-erro`;
  const medidas = useMedidasDaImagem(valor);
  // Aviso de qualidade (não bloqueia): imagem pequena de pixels, ou proporção ruim para o cabeçalho.
  // SVG sem tamanho informado (0) não gera aviso de tamanho, porque escala sem perder nitidez.
  const larguraConhecida = !!medidas && medidas.largura > 0 && medidas.altura > 0;
  const proporcao = larguraConhecida ? medidas.largura / medidas.altura : null;
  const ehSvg = !!valor?.startsWith('data:image/svg+xml');
  let aviso: string | null = null;
  if (larguraConhecida && !ehSvg && medidas.largura < LARGURA_MINIMA_PX) {
    aviso = `A imagem é pequena (${medidas.largura} × ${medidas.altura} px) e pode ficar borrada. Use pelo menos ${LARGURA_MINIMA_PX} px de largura.`;
  } else if (proporcao !== null && proporcao < PROPORCAO_MINIMA) {
    aviso = `Este logo é quase quadrado ou vertical e vai aparecer pequeno no cabeçalho. Prefira uma versão horizontal, como ${MEDIDA_IDEAL}.`;
  } else if (proporcao !== null && proporcao > PROPORCAO_MAXIMA) {
    aviso = 'Este logo é muito comprido e será reduzido para caber no cabeçalho. Uma versão um pouco mais alta ficará maior.';
  }

  /**
   * Lê o arquivo escolhido. Se for recusado, mostra o motivo e mantém o logo anterior.
   * @param arquivo arquivo vindo do seletor.
   */
  async function escolher(arquivo: File | undefined) {
    if (!arquivo) return;
    setErro(null);
    try {
      onChange(await lerArquivoLogo(arquivo));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível ler esta imagem. Tente outro arquivo.');
    }
    // Limpa o input: escolher o MESMO arquivo de novo (depois de remover) tem que disparar o evento outra vez.
    if (entrada.current) entrada.current.value = '';
  }

  return (
    <div className="space-y-2">
      <p className="text-[13px] font-semibold text-tinta">{rotulo}</p>
      <div className="flex items-center gap-3">
        {/* Miniatura sobre o fundo em que o logo vai aparecer: assim a pessoa vê se ele some (logo escuro em fundo escuro). */}
        <div className={cx('flex h-12 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-borda p-1.5',
          fundo === 'claro' ? 'bg-white' : 'bg-noite')}>
          {valor
            // eslint-disable-next-line @next/next/no-img-element -- data URL local: não há o que otimizar.
            ? <img src={valor} alt={`Logo escolhido (${fundo === 'claro' ? 'fundo claro' : 'fundo escuro'})`} className="max-h-full max-w-full object-contain" />
            : <span className={cx('text-[11px]', fundo === 'claro' ? 'text-tinta-suave' : 'text-white/60')}>sem logo</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variante="secundario" type="button" onClick={() => entrada.current?.click()}>
            {valor ? 'Trocar imagem' : 'Escolher imagem'}
          </Button>
          {valor && <Button variante="fantasma" type="button" onClick={() => { setErro(null); onChange(undefined); }}>Remover</Button>}
        </div>
        <input ref={entrada} type="file" className="sr-only" tabIndex={-1} aria-hidden accept={LOGO_TIPOS.join(',')}
          onChange={(e) => void escolher(e.target.files?.[0])} />
      </div>
      {/* Orientação sempre visível: formato, proporção ideal e medida de exemplo. A imagem nunca é esticada: o cabeçalho a ajusta dentro da área dele. */}
      <p className="text-[12px] text-tinta-suave">
        PNG, JPG, WebP ou SVG, até {LIMITE_EM_KB} KB.
        {orientacaoCompleta && <> Ideal: imagem horizontal, proporção de 3:1 a 4:1 (ex.: {MEDIDA_IDEAL}), com fundo transparente. SVG mantém a nitidez em qualquer tamanho. O logo nunca é esticado: ele é ajustado dentro da área do cabeçalho. As mesmas medidas valem para os dois logos.</>}
      </p>
      {/* Medida da imagem escolhida e aviso de qualidade (texto, nunca só cor; não bloqueia o salvar). */}
      {larguraConhecida && !aviso && <p className="text-[12px] text-tinta-suave">Imagem de {medidas.largura} × {medidas.altura} px.</p>}
      {aviso && <p className="text-[12px] font-medium text-aviso">{aviso}</p>}
      {/* role="alert": o leitor de tela anuncia o erro assim que ele aparece. */}
      {erro && <p id={idErro} role="alert" className="text-[12px] font-medium text-erro">{erro}</p>}
    </div>
  );
}
