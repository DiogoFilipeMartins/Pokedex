# 🎮 Pokédex Avançada - Projeto React

Uma aplicação web moderna em React que pesquisa e apresenta dados da **PokéAPI**, aplicando arquitetura SPA, fetch robusto, gestão de estados, persistência com localStorage, paginação, ordenação e acessibilidade.

---

## 📋 Índice
- [API Utilizada](#-api-utilizada)
- [Funcionalidades Implementadas](#-funcionalidades-implementadas)
- [Requisitos Cumpridos](#-requisitos-cumpridos)
- [Arquitetura e Estrutura](#-arquitetura-e-estrutura)
- [Instalação e Execução](#-instalação-e-execução)
- [Contrato API ↔ UI](#-contrato-api--ui)
- [Persistência (localStorage)](#-persistência-localstorage)
- [Decisões Técnicas](#-decisões-técnicas)
- [Como Testar](#-como-testar)

---

## 🌐 API Utilizada

### **PokéAPI** (https://pokeapi.co/)

#### Documentação oficial:
- 📖 https://pokeapi.co/docs/v2

#### Endpoints utilizados:
1. **Lista de Pokémon**: `GET https://pokeapi.co/api/v2/pokemon?limit=500`
   - Retorna lista com nome e URL de 500 Pokémon
   - Resposta: `{ count: number, results: [{ name, url }] }`

2. **Detalhes do Pokémon**: `GET https://pokeapi.co/api/v2/pokemon/{id ou nome}`
   - Retorna dados completos (tipos, stats, sprites, etc.)
   - Usado para detalhes futuros (atualmente usamos apenas a lista)

#### Campos extraídos do JSON:
- **String**: `name` (nome do Pokémon) - formatado com capitalize, fallback "—"
- **Número**: `id` (número do Pokémon) - formatado com `toLocaleString('pt-PT')`
- **URL/Imagem**: `sprites.other.official-artwork.front_default` - com alt descritivo e fallback

---

## ✨ Funcionalidades Implementadas

### 1. **Pesquisa com Debounce e Enter**
- ✅ Debounce de **400ms** (hook `useDebounce`)
- ✅ Enter para pesquisa **imediata**
- ✅ Pesquisa por nome ou número

### 2. **Filtros e Ordenação**
- ✅ Ordenação por **nome** ou **ID** (número)
- ✅ Ordem **crescente** ou **decrescente**
- ✅ Filtros salvos no localStorage e restaurados no carregamento

### 3. **Paginação no Cliente**
- ✅ Escolha de page size: **10, 20, 50, 100**
- ✅ Navegação: Primeira, Anterior, Próxima, Última
- ✅ Indicador de página atual e total

### 4. **UI de Estados**
- ✅ **Loading**: spinner animado
- ✅ **Empty**: mensagem quando não há resultados
- ✅ **Error**: mensagem amigável + botão "Tentar de novo"
- ✅ **Success**: grid responsivo com Pokémon

### 5. **Fetch Robusto**
- ✅ **AbortController**: cancela requisições anteriores
- ✅ **Timeout**: 8 segundos (configurável)
- ✅ Verificação de `!response.ok` antes de `json()`
- ✅ 404 tratado como empty
- ✅ Normalização de payload (`[]` e `{data:[]}`)

### 6. **Persistência com localStorage**
- ✅ **Favoritos**: adicionar/remover Pokémon
- ✅ **Últimos filtros**: pesquisa e ordenação restaurados
- ✅ Indicador visual (❤️/🤍)

### 7. **Acessibilidade**
- ✅ `aria-live="polite"` para mensagens de estado
- ✅ `aria-label` em todos os controles interativos
- ✅ Labels associados a inputs (`htmlFor` + `id`)
- ✅ Navegação por teclado funcional

### 8. **Responsividade**
- ✅ Grid adaptável com `repeat(auto-fill, minmax(200px, 1fr))`
- ✅ Media queries para mobile
- ✅ Fonts e espaçamentos ajustados

### 9. **3 Tipos de Dados Formatados**
- ✅ **String**: nome (capitalize, fallback "—")
- ✅ **Número**: ID (toLocaleString('pt-PT'))
- ✅ **Imagem**: sprite oficial (alt descritivo, fallback on error)

---

## 🚀 Instalação e Execução

### Pré-requisitos
- **Node.js** 16+ e npm

### Passos

1. **Instalar dependências**:
```bash
npm install
```

2. **Modo desenvolvimento** (com proxy Vite):
```bash
npm run dev
```
- Abre em: http://localhost:3000
- Hot reload ativado

3. **Build de produção**:
```bash
npm run build
```

4. **Preview da build**:
```bash
npm run preview
```

### Nota sobre CORS/Proxy
O proxy Vite está configurado em `vite.config.js`:
```javascript
server: {
  proxy: {
    '/api': {
      target: 'https://pokeapi.co/api/v2',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

---

## 📡 Contrato API ↔ UI

### Request (Fetch)
```javascript
// Endpoint
GET https://pokeapi.co/api/v2/pokemon?limit=500

// Headers (automáticos)
Accept: application/json
```

### Response (JSON)
```json
{
  "count": 1302,
  "next": "https://pokeapi.co/api/v2/pokemon?offset=500&limit=500",
  "previous": null,
  "results": [
    { "name": "bulbasaur", "url": "https://pokeapi.co/api/v2/pokemon/1/" }
  ]
}
```

---

## 💾 Persistência (localStorage)

### Chaves utilizadas:
- `pokedex_favorites`: Lista de Pokémon favoritos
- `pokedex_filters`: Última pesquisa e filtros aplicados
- `pokedex_sort`: Configuração de ordenação

### Como testar:
1. Adicionar favoritos (clica 🤍)
2. Pesquisar e ordenar
3. Recarregar página (F5) → dados restaurados
4. DevTools → Application → Local Storage

---

## 🛠 Decisões Técnicas

1. **Vite**: Build rápido, HMR eficiente, requisito obrigatório
2. **Hooks customizados**: Reutilização de lógica (debounce, fetch)
3. **localStorage**: Persistência simples sem backend
4. **AbortController**: Cancela requisições obsoletas
5. **useMemo**: Otimização de performance em listas grandes

---

## ✅ Requisitos Cumpridos

| Requisito | Status |
|-----------|--------|
| Debounce 400ms + Enter | ✅ |
| Filtro + ordenação | ✅ |
| Paginação no cliente | ✅ |
| UI estados (loading/empty/error/success) | ✅ |
| Fetch robusto (AbortController, timeout) | ✅ |
| Persistência localStorage | ✅ |
| CORS proxy Vite | ✅ |
| Acessibilidade (aria-live, labels) | ✅ |
| Responsividade | ✅ |
| 3 tipos dados formatados | ✅ |

---

## 🧪 Como Testar

1. **Debounce**: digita "pika" → aguarda 400ms → pesquisa executa
2. **Enter**: digita e pressiona Enter → pesquisa imediata
3. **Favoritos**: adiciona/remove → recarrega página → persistem
4. **Paginação**: navega páginas, muda page size
5. **Ordenação**: alterna nome/ID, asc/desc
6. **Estados**: simula erro, pesquisa vazia, loading
7. **Responsivo**: redimensiona janela

---

## 🎯 Estrutura do Projeto

```
src/
├── App.jsx              # Componente principal
├── hooks/
│   ├── useDebounce.js   # Hook debounce 400ms
│   └── useFetch.js      # Fetch robusto (AbortController, timeout)
└── utils/
    ├── localStorage.js  # Persistência (favoritos, filtros)
    └── formatters.js    # Formatação de dados (PT-PT)
```

---

**🚀 Pokédex pronta para avaliação!**



2. Instale as dependências
```bash
npm install
```

3. Execute o projeto
```bash
npm start
```

4. Abra [http://localhost:3000](http://localhost:3000) no navegador

## 🎯 Como Usar

1. **Buscar Pokémon**: Digite o nome ou número na barra de busca
2. **Sugestões**: Comece a digitar para ver sugestões filtradas com imagens
3. **Trocar Formas**: Use os botões Normal, Shiny, Mega ou Gigantamax (quando disponíveis)
4. **Ver Stats**: Todas as estatísticas são exibidas com barras de progresso coloridas

## 🛠️ Tecnologias

- **React** - Biblioteca JavaScript para interfaces
- **PokéAPI** - API REST para dados dos Pokémon
- **Hooks** - useState e useEffect para gerenciamento de estado
- **CSS-in-JS** - Estilização inline com transições suaves

## 📦 Estrutura do Código

```
App.js
├── Estados (useState)
│   ├── pokemon - Dados do Pokémon atual
│   ├── input - Valor da busca
│   ├── loading - Estado de carregamento
│   ├── form - Forma selecionada (normal/shiny/mega/gigantamax)
│   └── suggestions - Lista de sugestões
├── Dados
│   ├── formsExtras - URLs das formas especiais
│   └── typeColors - Cores por tipo de Pokémon
└── Funções
    ├── buscarPokemon() - Busca na API
    ├── handleKeyPress() - Busca ao pressionar Enter
    └── useEffect() - Auto-complete com debounce
```

## 🎨 Pokémon com Formas Especiais

O app suporta formas alternativas para:
- **Mega Evolução**: Charizard, Mewtwo, Gengar, Lucario, Gyarados, Gardevoir
- **Gigantamax**: Charizard, Gengar, Lapras, Pikachu, Snorlax

## 🌈 Paleta de Cores por Tipo

| Tipo | Cor |
|------|-----|
| Fire | #F08030 |
| Water | #6890F0 |
| Grass | #78C850 |
| Electric | #F8D030 |
| Psychic | #F85888 |
| Dragon | #7038F8 |
| ... | ... |

## 📝 Exemplos de Uso

```javascript
// Buscar por nome
"pikachu" → Mostra Pikachu com opção Gigantamax

// Buscar por número
"25" → Mostra Pikachu (#025)

// Buscar com auto-complete
"char" → Sugere Charizard, Charmander, Charmeleon...
```

## 🐛 Tratamento de Erros

- Validação de campo vazio
- Mensagem amigável para Pokémon não encontrado
- Fallback para imagens e dados indisponíveis

## 🔮 Melhorias Futuras

- [ ] Adicionar favoritos com localStorage
- [ ] Modo escuro
- [ ] Comparação entre Pokémon
- [ ] Informações de evolução
- [ ] Habilidades e movimentos
- [ ] Filtros por geração e tipo

## 📄 Licença

Este projeto utiliza dados da [PokéAPI](https://pokeapi.co/) que é gratuita e aberta.

## 🙏 Créditos

- Dados: [PokéAPI](https://pokeapi.co/)
- Sprites oficiais: The Pokémon Company
- Fonte: [Poppins](https://fonts.google.com/specimen/Poppins)

---

Feito com ❤️ e React