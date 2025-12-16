# 🎮 Como Usar Imagem de Fundo Personalizada na Batalha

## 📁 Passo 1: Preparar a Imagem

1. Encontra uma imagem de floresta/campo Pokémon (como a que mostraste)
2. Renomeia para: **`battle-background.png`**
3. Formatos suportados: `.png`, `.jpg`, `.jpeg`, `.webp`

## 📂 Passo 2: Colocar no Projeto

Coloca a imagem na pasta:
```
pokedex-react/public/battle-background.png
```

## ✅ Pronto!

A batalha agora usa a tua imagem como fundo! Os Pokémon aparecem automaticamente posicionados:
- **Pokémon adversário** (topo direita)
- **Teu Pokémon** (baixo esquerda)

## 🎨 Ajustar Posicionamento (Opcional)

Se quiseres ajustar onde os Pokémon aparecem, edita no `App.jsx`:

```javascript
// Pokémon 2 (adversário)
position: 'absolute',
top: '10%',      // Altura (ajusta este valor)
right: '20%',    // Distância da direita

// Pokémon 1 (teu)
position: 'absolute',
bottom: '15%',   // Altura do fundo (ajusta este valor)
left: '20%',     // Distância da esquerda
```

## 🖼️ Dicas para a Imagem

- **Resolução recomendada**: 1920x1080 ou superior
- **Proporção**: 16:9 (landscape)
- **Estilo**: Imagens de cenas de batalha Pokémon funcionam melhor
- **Cores**: Evita fundos muito escuros (dificulta ler as stats)

## 🔄 Trocar Imagem

Basta substituir o ficheiro `battle-background.png` por outro e recarregar a página!

---

**Nota**: A imagem cobre todo o ecrã durante a batalha. Todos os elementos CSS desenhados (árvores, nuvens, etc) foram removidos para usar apenas a tua imagem.
