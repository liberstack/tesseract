# Tesseract

Visualização de um hipercubo (tesseract) em 4 dimensões, projetado em tempo real para 3D e renderizado com Three.js. Rotaciona simultaneamente nos seis planos possíveis do espaço 4D e exibe a matriz de rotação ao vivo.

---

## Como funciona

Um tesseract tem 16 vértices e 32 arestas — o equivalente 4D de um cubo. Cada vértice existe em quatro coordenadas `(x, y, z, w)`, e a cada frame ele passa por duas transformações:

1. **Rotação 4D**: os vértices são multiplicados por uma matriz de rotação combinada, resultado da composição de quatro rotações parciais — nos planos `XY`, `XW`, `YZ` e `ZW`. É essa combinação de planos que dá a sensação de um objeto "impossível" se dobrando sobre si mesmo, já que nenhuma dessas rotações existe de forma intuitiva em 3D.
2. **Projeção 4D → 3D**: depois de rotacionado, cada vértice é projetado para 3D usando perspectiva simples — a coordenada `w` funciona como uma "distância" extra, achatando o objeto proporcionalmente conforme se afasta no quarto eixo.

O resultado 3D é desenhado como um conjunto de segmentos de linha (`THREE.LineSegments`), com a posição de cada aresta recalculada e enviada pra GPU a cada frame via `BufferAttribute`.

### Shadow projection

Quando ativada, a projeção de sombra recalcula os mesmos vértices com a coordenada `w` zerada antes de projetar, gerando uma segunda malha semitransparente "achatada" no chão (`y = -1.2`) — uma forma de visualizar a sombra que o objeto 4D projetaria num espaço 3D, análoga a um cubo 3D projetando sombra num plano 2D.

### Matrix display

O painel lateral mostra a matriz de rotação 4×4 usada no frame atual, atualizada a cada frame junto com a animação.

---

## Uso

Abra `index.html` diretamente no navegador. Nenhum servidor ou build necessário.

- A rotação acontece automaticamente, combinando os quatro planos o tempo todo.
- Clique em **SHADOW PROJ. — OFF/ON** pra ativar ou desativar a sombra projetada.
- A matriz de rotação 4D atual fica visível em tempo real no painel de controles.

---

## Estrutura do projeto

```
index.html    — estrutura da página, painel de info e painel de controles
style.css     — tema escuro, tipografia monoespaçada, estilo dos painéis
src/
  app.js      — toda a lógica: matemática 4D, geometria do tesseract, render loop
```

Por ser um projeto pequeno e de propósito único (uma visualização, não uma aplicação com múltiplas telas ou fluxos), toda a lógica fica concentrada em um único `app.js`, dividido internamente por comentários de seção (`/* ── Renderer ── */`, `/* ── 4D Math ── */`, etc.) em vez de múltiplos arquivos.

---

## Tecnologias

- HTML5, CSS3, JavaScript ES6
- [Three.js](https://threejs.org/) (r160, via CDN) — usado apenas para o renderer WebGL, câmera e cena; a matemática de rotação e projeção 4D é feita manualmente, sem nenhuma lib
- `BufferGeometry` com atributos de posição dinâmicos (`DynamicDrawUsage`) para atualizar a geometria a cada frame sem recriar buffers

---

## Licença

MIT — uso livre para fins pessoais e comerciais.