# Contrato API ↔ UI - Pokédex Avançada

## Visão Geral

Esta aplicação consome a **PokéAPI v2** (https://pokeapi.co/api/v2/). Este documento define o contrato entre a API externa e a interface do usuário.

---

## Endpoints Utilizados

### 1. **GET /pokemon**
Retorna lista paginada de Pokémon.

**URL:** `https://pokeapi.co/api/v2/pokemon?limit={limit}&offset={offset}`

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Default | Descrição |
|-----------|------|-------------|---------|-----------|
| `limit` | number | Não | 20 | Número de resultados por página (1-10000) |
| `offset` | number | Não | 0 | Índice inicial para paginação |

**Headers:**
```
Accept: application/json
Content-Type: application/json
```

**Resposta de Sucesso (200):**
```json
{
  "count": 1302,
  "next": "https://pokeapi.co/api/v2/pokemon?offset=20&limit=20",
  "previous": null,
  "results": [
    {
      "name": "bulbasaur",
      "url": "https://pokeapi.co/api/v2/pokemon/1/"
    },
    {
      "name": "ivysaur",
      "url": "https://pokeapi.co/api/v2/pokemon/2/"
    }
  ]
}
```

**Campos de Resposta:**
- `count` (number): Total de Pokémon disponíveis
- `next` (string|null): URL para próxima página
- `previous` (string|null): URL para página anterior
- `results` (array): Lista de Pokémon
  - `name` (string): Nome do Pokémon
  - `url` (string): URL para detalhes completos

**Resposta de Erro (404):**
```json
{
  "detail": "Not found."
}
```

**Códigos de Status:**
- `200`: Sucesso
- `404`: Recurso não encontrado
- `500`: Erro interno do servidor

---

### 2. **GET /pokemon/{id}**
Retorna detalhes completos de um Pokémon específico.

**URL:** `https://pokeapi.co/api/v2/pokemon/{id}`

**Path Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number\|string | ID numérico (1-1025) ou nome do Pokémon |

**Headers:**
```
Accept: application/json
Content-Type: application/json
```

**Resposta de Sucesso (200):**
```json
{
  "id": 1,
  "name": "bulbasaur",
  "base_experience": 64,
  "height": 7,
  "weight": 69,
  "abilities": [
    {
      "ability": {
        "name": "overgrow",
        "url": "https://pokeapi.co/api/v2/ability/65/"
      },
      "is_hidden": false,
      "slot": 1
    }
  ],
  "forms": [
    {
      "name": "bulbasaur",
      "url": "https://pokeapi.co/api/v2/pokemon-form/1/"
    }
  ],
  "moves": [
    {
      "move": {
        "name": "razor-wind",
        "url": "https://pokeapi.co/api/v2/move/13/"
      }
    }
  ],
  "species": {
    "name": "bulbasaur",
    "url": "https://pokeapi.co/api/v2/pokemon-species/1/"
  },
  "sprites": {
    "front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
    "front_shiny": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/1.png",
    "other": {
      "official-artwork": {
        "front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png"
      }
    }
  },
  "stats": [
    {
      "base_stat": 45,
      "effort": 0,
      "stat": {
        "name": "hp",
        "url": "https://pokeapi.co/api/v2/stat/1/"
      }
    },
    {
      "base_stat": 49,
      "effort": 0,
      "stat": {
        "name": "attack",
        "url": "https://pokeapi.co/api/v2/stat/2/"
      }
    },
    {
      "base_stat": 49,
      "effort": 0,
      "stat": {
        "name": "defense",
        "url": "https://pokeapi.co/api/v2/stat/3/"
      }
    }
  ],
  "types": [
    {
      "slot": 1,
      "type": {
        "name": "grass",
        "url": "https://pokeapi.co/api/v2/type/12/"
      }
    },
    {
      "slot": 2,
      "type": {
        "name": "poison",
        "url": "https://pokeapi.co/api/v2/type/4/"
      }
    }
  ]
}
```

**Campos Principais:**
- `id` (number): ID único do Pokémon
- `name` (string): Nome do Pokémon
- `height` (number): Altura em decímetros
- `weight` (number): Peso em hectogramas
- `abilities` (array): Lista de habilidades
- `moves` (array): Lista de movimentos disponíveis
- `stats` (array): Estatísticas base (HP, Attack, Defense, Sp. Attack, Sp. Defense, Speed)
- `types` (array): Tipos do Pokémon (grass, fire, water, etc.)
- `sprites` (object): URLs de imagens/sprites

**Resposta de Erro (404):**
```json
{
  "detail": "Not found."
}
```

---

### 3. **GET /move/{id}**
Retorna detalhes de um movimento específico.

**URL:** `https://pokeapi.co/api/v2/move/{id}`

**Path Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number\|string | ID numérico ou nome do movimento |

**Resposta de Sucesso (200):**
```json
{
  "id": 1,
  "name": "pound",
  "accuracy": 100,
  "power": 40,
  "pp": 35,
  "priority": 0,
  "damage_class": {
    "name": "physical",
    "url": "https://pokeapi.co/api/v2/move-damage-class/2/"
  },
  "effect_chance": null,
  "effect_entries": [
    {
      "effect": "Inflicts regular damage with no additional effect.",
      "language": {
        "name": "en"
      },
      "short_effect": "Inflicts regular damage."
    }
  ],
  "type": {
    "name": "normal",
    "url": "https://pokeapi.co/api/v2/type/1/"
  }
}
```

**Campos Utilizados:**
- `name` (string): Nome do movimento
- `power` (number|null): Poder base do ataque
- `type` (object): Tipo do movimento
- `damage_class` (object): Classe de dano (physical, special, status)
- `effect_chance` (number|null): % de chance de efeito secundário
- `effect_entries` (array): Descrições do efeito

---

### 4. **GET /ability/{id}**
Retorna detalhes de uma habilidade.

**URL:** `https://pokeapi.co/api/v2/ability/{id}`

**Resposta de Sucesso (200):**
```json
{
  "id": 65,
  "name": "overgrow",
  "effect_entries": [
    {
      "effect": "When this Pokémon has 1/3 or less of its HP remaining, its grass-type moves inflict 1.5× as much regular damage.",
      "language": {
        "name": "en"
      },
      "short_effect": "Strengthens grass moves to inflict 1.5× damage at 1/3 max HP or less."
    }
  ],
  "flavor_text_entries": [
    {
      "flavor_text": "Powers up Grass-type moves in a pinch.",
      "language": {
        "name": "en"
      }
    }
  ]
}
```

---

### 5. **GET /pokemon-species/{id}**
Retorna dados de espécie (variedades, descrições).

**URL:** `https://pokeapi.co/api/v2/pokemon-species/{id}`

**Resposta de Sucesso (200):**
```json
{
  "id": 1,
  "name": "bulbasaur",
  "varieties": [
    {
      "is_default": true,
      "pokemon": {
        "name": "bulbasaur",
        "url": "https://pokeapi.co/api/v2/pokemon/1/"
      }
    }
  ],
  "flavor_text_entries": [
    {
      "flavor_text": "A strange seed was planted on its back at birth. The plant sprouts and grows with this POKéMON.",
      "language": {
        "name": "en"
      }
    }
  ]
}
```

---

## 🔧 Implementação no Cliente

### useFetch Hook
```javascript
const { data, loading, error, refetch } = useFetch(url, options);
```

**Opções:**
- `timeout` (number): Timeout em ms (default: 8000)
- `autoFetch` (boolean): Auto-executar na montagem (default: true)
- Suporta **AbortController** para cancelamento
- Tratamento automático de timeouts

**Estados Retornados:**
- `data` (object|null): Dados da resposta ou null
- `loading` (boolean): true durante carregamento
- `error` (object|null): Objeto de erro com `type` e `message`
- `refetch` (function): Função para reexecutar fetch

**Tipos de Erro:**
```javascript
{
  type: 'timeout' | 'cancelled' | 'empty' | 'error',
  message: string
}
```

---

## 🔍 Filtragem e Ordenação (Cliente)

**Realizada no cliente após receber dados completos:**

### Filtros Disponíveis:
1. **Pesquisa por texto** (debounced 400ms)
   - Nome do Pokémon (case-insensitive)
   - ID numérico

2. **Filtro por tipo**
   - 18 tipos disponíveis: normal, fire, water, grass, electric, ice, fighting, poison, ground, flying, psychic, bug, rock, ghost, dragon, dark, steel, fairy

### Ordenação:
**Campos:**
- `id` (number): Número na Pokédex
- `name` (string): Nome alfabético

**Direções:**
- `asc`: Crescente
- `desc`: Decrescente

**Implementação:**
```javascript
{
  field: 'id' | 'name',
  order: 'asc' | 'desc'
}
```

---

## Paginação (Cliente)

**Implementada no cliente após filtragem:**

**Parâmetros:**
- `currentPage` (number): Página atual (1-indexed)
- `pageSize` (number): Itens por página (10, 20, 50, 100)
- `totalPages` (number): Total de páginas calculado

**Navegação:**
- Primeira página
- Página anterior
- Próxima página
- Última página

---

## Validação no Cliente

### 1. **Input de Pesquisa**
```html
<input 
  type="text"
  minLength="2"
  maxLength="50"
  pattern=".{2,}"
  title="Digite pelo menos 2 caracteres"
/>
```

**Regras:**
- Mínimo 2 caracteres
- Máximo 50 caracteres
- Mensagem customizada via `setCustomValidity()`

### 2. **Input do Quiz**
```html
<input 
  type="text"
  required
  minLength="3"
  maxLength="30"
  pattern="[a-zA-Z-]+"
  title="Digite o nome do Pokémon (apenas letras e hífens)"
/>
```

**Regras:**
- Campo obrigatório
- Mínimo 3 caracteres
- Máximo 30 caracteres
- Apenas letras e hífens
- Validação via `reportValidity()` antes de submeter

---

## Tratamento de Erros

### Tipos de Erro:
1. **Network Errors**: Falha de conexão
2. **Timeout Errors**: Requisição excedeu tempo limite (8s)
3. **HTTP Errors**: Status code 4xx/5xx
4. **Abort Errors**: Requisição cancelada pelo usuário
5. **Parse Errors**: Falha ao processar JSON

### Respostas de Erro:
```javascript
// Timeout
{
  type: 'timeout',
  message: 'Tempo limite excedido. Tente novamente.'
}

// Not Found
{
  type: 'empty',
  message: 'Nenhum resultado encontrado'
}

// Generic Error
{
  type: 'error',
  message: 'Erro ao carregar dados'
}

// Cancelled
{
  type: 'cancelled',
  message: 'Requisição cancelada'
}
```

---

## 🔐 Segurança e Performance

### AbortController:
Todas as chamadas fetch usam `AbortController.signal`
Limpeza automática em `useEffect` cleanup
Cancelamento de requisições pendentes antes de novas

### Debounce:
Input de pesquisa com 400ms de debounce
Evita requisições excessivas durante digitação

### Cache Local:
Favoritos persistidos em `localStorage`
Filtros e ordenação persistidos em `localStorage`

### Limites:
- Timeout padrão: 8000ms
- Máximo de Pokémon: 1025 (filtrados no cliente)
- Movimentos carregados por batalha: 4 por Pokémon

---

## 📝 Formato de Dados Internos

### Pokémon Simplificado (Lista):
```javascript
{
  id: number,
  name: string,
  url: string,
  types: array
}
```

### Pokémon Completo (Detalhes):
```javascript
{
  id: number,
  name: string,
  height: number,
  weight: number,
  abilities: array,
  moves: array,
  stats: array,
  types: array,
  sprites: object,
  species: object
}
```

### Movimento (Batalha):
```javascript
{
  name: string,
  power: number,
  type: string,
  damage_class: string,
  effect_chance: number|null,
  effect_entries: array
}
```

---

##  Casos de Uso

### 1. Listar Pokémon
```
GET /pokemon?limit=10000
→ Filtragem no cliente
→ Paginação no cliente (pageSize: 20)
```

### 2. Buscar Pokémon por Nome
```
GET /pokemon?limit=10000
→ Filtro por nome no cliente (debounced)
```

### 3. Ver Detalhes
```
GET /pokemon/{id}
→ GET /ability/{abilityId} (para cada habilidade)
→ GET /pokemon-species/{id} (para variantes)
```

### 4. Iniciar Batalha
```
GET /pokemon/{id1}
GET /pokemon/{id2}
→ GET /move/{moveId} (4 movimentos por Pokémon)
```

### 5. Quiz Mode
```
GET /pokemon/{randomId}
→ Exibir sprite silhueta
→ Validar resposta no cliente
```

---

## 📚 Referências

- **PokéAPI Docs**: https://pokeapi.co/docs/v2
- **GitHub**: https://github.com/PokeAPI/pokeapi
- **Rate Limiting**: Nenhum (API pública)
- **CORS**: Habilitado para todos os domínios

---

## 🔄 Changelog

### v1.0.0 (2025-12-15)
- AbortController em todas as chamadas fetch
- Validação HTML5 (pattern, minLength, maxLength, required)
- Mensagens customizadas via `setCustomValidity()`
- Tratamento de erros estruturado
- Documentação completa do contrato API

---

**Última atualização:** 15 de Dezembro de 2025
