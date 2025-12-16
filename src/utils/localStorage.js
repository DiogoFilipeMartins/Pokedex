/**
 * Utilitários para persistência com localStorage
 */

const STORAGE_KEYS = {
  FAVORITES: 'pokedex_favorites',
  FILTERS: 'pokedex_filters',
  SORT: 'pokedex_sort',
};

// Favoritos
export const getFavorites = () => {
  try {
    const favorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Erro ao ler favoritos:', error);
    return [];
  }
};

export const addFavorite = (pokemon) => {
  try {
    const favorites = getFavorites();
    if (!favorites.find(p => p.id === pokemon.id)) {
      favorites.push(pokemon);
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    }
    return favorites;
  } catch (error) {
    console.error('Erro ao adicionar favorito:', error);
    return getFavorites();
  }
};

export const removeFavorite = (pokemonId) => {
  try {
    const favorites = getFavorites().filter(p => p.id !== pokemonId);
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    return favorites;
  } catch (error) {
    console.error('Erro ao remover favorito:', error);
    return getFavorites();
  }
};

export const isFavorite = (pokemonId) => {
  return getFavorites().some(p => p.id === pokemonId);
};

// Filtros
export const saveFilters = (filters) => {
  try {
    localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(filters));
  } catch (error) {
    console.error('Erro ao salvar filtros:', error);
  }
};

export const getFilters = () => {
  try {
    const filters = localStorage.getItem(STORAGE_KEYS.FILTERS);
    return filters ? JSON.parse(filters) : { type: '', search: '' };
  } catch (error) {
    console.error('Erro ao ler filtros:', error);
    return { type: '', search: '' };
  }
};

// Ordenação
export const saveSort = (sort) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SORT, JSON.stringify(sort));
  } catch (error) {
    console.error('Erro ao salvar ordenação:', error);
  }
};

export const getSort = () => {
  try {
    const sort = localStorage.getItem(STORAGE_KEYS.SORT);
    return sort ? JSON.parse(sort) : { field: 'id', order: 'asc' };
  } catch (error) {
    console.error('Erro ao ler ordenação:', error);
    return { field: 'id', order: 'asc' };
  }
};
