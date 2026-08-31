# RENOVA CAMP — Site institucional (V4)

Versão atualizada com ajustes solicitados:
- Hero com vídeo de antes e depois ao fundo
- Avanço do vídeo conforme o scroll da página
- Seção de serviços mais minimalista
- Ícones menores e hover interativo
- Bloco “Da necessidade à entrega” removido
- Sessão “Visão e resultado” com 6 imagens
- Sessão “Para quem” com 4 imagens específicas por público

## Como visualizar
Abra `index.html` no navegador.

Para uma visualização local mais confiável:
```bash
python -m http.server 8080
```
Depois acesse `http://localhost:8080`.

## Publicação
### Vercel
- Framework preset: `Other`
- Build command: vazio
- Output directory: `.`

### Netlify
Arraste a pasta inteira para a área de deploy.

### Hospedagem tradicional
Envie `index.html`, `styles.css`, `script.js` e a pasta `assets/`.

## Contatos configurados
- WhatsApp: (19) 97111-1058
- Instagram: @renova.camp

## Logo oficial
A versão atual usa o PNG transparente enviado pelo usuário como logo completo da RENOVA CAMP.

## V5 — correções no Hero
- Logo reduzido e contido dentro do menu
- RENOVE e CUIDE em off-white para maior contraste
- Card lateral repetindo o símbolo removido
- Vídeo do Hero recodificado com quadros-chave em todos os frames para melhorar o scrub
- Scroll do vídeo suavizado com requestAnimationFrame e interpolação

## V6 — serviços sem caixas
- Cards visuais removidos da seção de serviços
- Ícones com fundo transparente
- Numeração removida
- Apenas ícone, título e descrição
- Hover sutil no ícone e no título

## V7 — atualização consolidada
- Serviços realmente sem caixas: somente ícone, título e texto
- Classes novas (`service-item`) para impedir estilos antigos de reaparecerem
- CSS/JS renomeados para evitar cache do navegador
- E-mail oficial: atendimento@renovacamp.com.br
- Endereço oficial: R. Eng. Carlos Stevenson, 580 - Nova Campinas, Campinas - SP
- Rodapé redesenhado com contatos e endereço
- Hero ajustado para 320vh e scroll mais suave


## V9 — ícones vetorizados e contraste melhorado
- Substituídos os ícones antigos pelos novos arquivos vetorizados em PNG transparente
- Referências .webp trocadas por .png
- Fundo da seção de serviços ficou menos preto para destacar melhor o grafite dos ícones
- Aplicado brilho/halo muito sutil atrás dos ícones, sem voltar as caixas
- Mantido layout minimalista: só ícone, título e descrição
- E-mail oficial mantido como atendimento@renovacamp.com.br
- CSS/JS renomeados para V9 para evitar cache do navegador

## V10 — Hero mais lento
- Desktop: hero-scroll aumentado para 500vh
- Mobile/tablet: aumentado para 280vh
- Suavização visual: 0.08
- Suavização do vídeo: 0.10
- CSS/JS versionados para evitar cache

## Estrutura simplificada
A partir desta versão o projeto usa somente:
- `styles.css`
- `script.js`

O Hero está configurado com:
- Desktop: `600vh`
- Mobile/tablet: `320vh`

Não serão mais criados arquivos `styles-vX.css` ou `script-vX.js`.

## Seção de Serviços com scroll
- Vídeo novo: `assets/services-scroll.mp4`
- O vídeo é controlado pelo scroll, como o Hero
- 12 descrições aparecem sequencialmente sobre o vídeo
- O ritmo foi dividido em quatro fases: abertura, primeiros 6, virada da folha, últimos 6
- Altura da seção: `900vh` no desktop
- O projeto continua usando somente `styles.css` e `script.js`

## Vídeo de serviços corrigido
- `assets/services-scroll.mp4` substituído pelo vídeo corrigido enviado posteriormente.
- Poster regenerado a partir do novo vídeo.
- Sincronização do scroll ajustada aos novos momentos da animação:
  abertura ~0–5.5s, primeiros 6 ~5.5–9.7s, virada ~9.7–13.5s, últimos 6 ~13.5–16s.

## Ajustes solicitados
- Hero: indicador muda de `ANTES` para `DEPOIS` ao atingir 40% do progresso.
- Serviços: removida a numeração dos serviços.
- Serviços: adicionado CTA final antes da saída da seção:
  “Não encontrou o que procurava? Entre em contato. Temos a solução perfeita para sua necessidade!”
- Mantidos somente `styles.css` e `script.js`.


## Ajuste mobile estável
- Hero mobile: progressão desacelerada com curva de progresso e interpolação específica para touch.
- Serviços mobile: não depende mais de seek de vídeo.
- No celular a seção de serviços usa uma sequência de 96 frames WebP controlados pelo scroll.
- Desktop continua usando `assets/services-scroll.mp4`.


## Ajuste Hero mobile — velocidade
- Desktop mantido sem alterações.
- Serviços desktop e mobile mantidos sem alterações.
- Hero mobile aumentado para 260svh (250svh em celulares menores).
- Progresso mobile do Hero passou a ser linear para não acelerar no final do swipe.


## Hero vertical no mobile
- Desktop mantém `assets/hero-scroll.mp4` horizontal.
- Mobile usa `assets/hero-scroll-mobile.mp4` em 9:16.
- O vídeo mobile foi recodificado para scrub de scroll com H.264, `faststart` e keyframes densos.
- A velocidade/altura de scroll mobile aprovada foi preservada.
- A seção Serviços não foi alterada.


## Hero desktop atualizado
- Desktop usa o novo `before-after-horizontal.mp4`, tratado como `assets/hero-scroll.mp4`.
- Mobile continua usando `assets/hero-scroll-mobile.mp4` vertical.
- Ambos os vídeos foram preparados para scrub de scroll com H.264, `faststart` e keyframes densos.
- Seção Serviços preservada sem alterações.


## Correção Hero mobile + WhatsApp
- Hero mobile agora usa canvas com 123 frames WebP (720×1280), evitando seek de MP4 no iOS/Safari.
- Hero desktop continua usando `assets/hero-scroll.mp4`.
- Serviços permanecem exatamente no modo aprovado: vídeo no desktop e canvas de frames no mobile.
- Botão flutuante do WhatsApp agora usa ícone tradicional verde, com borda luminosa giratória e pulso discreto.
