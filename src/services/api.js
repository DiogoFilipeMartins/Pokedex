import { 
  collection, 
  addDoc, 
  deleteDoc, 
  getDocs, 
  doc, 
  query, 
  orderBy, 
  limit,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

// ========================================
// VALIDAÇÃO E WHITELIST
// ========================================

const VALID_SORT_FIELDS = ['name', 'id', 'createdAt', 'score', 'timestamp'];
const VALID_ORDER_VALUES = ['asc', 'desc'];

const validateSort = (field, order) => {
  if (field && !VALID_SORT_FIELDS.includes(field)) {
    throw new Error(`Campo de ordenação inválido: ${field}. Permitidos: ${VALID_SORT_FIELDS.join(', ')}`);
  }
  if (order && !VALID_ORDER_VALUES.includes(order)) {
    throw new Error(`Ordem inválida: ${order}. Permitidos: ${VALID_ORDER_VALUES.join(', ')}`);
  }
};

const validatePokemon = (pokemon) => {
  if (!pokemon.id || !pokemon.name) {
    throw new Error('Pokémon inválido: id e name são obrigatórios');
  }
  if (typeof pokemon.id !== 'number' || pokemon.id < 1 || pokemon.id > 1025) {
    throw new Error('ID do Pokémon inválido (deve ser entre 1 e 1025)');
  }
  if (typeof pokemon.name !== 'string' || pokemon.name.trim().length === 0) {
    throw new Error('Nome do Pokémon inválido');
  }
};

// ========================================
// ROTAS DE FAVORITOS
// ========================================

/**
 * GET /favoritos - Lista todos os favoritos
 * @param {Object} options - { sortField, sortOrder, limitCount }
 * @returns {Promise<Array>} Lista de favoritos
 */
export const getFavorites = async (options = {}) => {
  try {
    const { sortField = 'createdAt', sortOrder = 'desc', limitCount = 100 } = options;
    
    // Validação com whitelist
    validateSort(sortField, sortOrder);
    
    const favoritesRef = collection(db, 'favoritos');
    let q = query(favoritesRef, orderBy(sortField, sortOrder));
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao buscar favoritos:', error);
    throw error;
  }
};

/**
 * POST /favoritos - Adiciona novo favorito
 * @param {Object} pokemon - { id, name, sprite }
 * @returns {Promise<Object>} Favorito criado
 */
export const addFavorite = async (pokemon) => {
  try {
    // Validação
    validatePokemon(pokemon);
    
    // Verificar se já existe
    const existing = await getDocs(
      query(collection(db, 'favoritos'), where('id', '==', pokemon.id))
    );
    
    if (!existing.empty) {
      throw new Error('Pokémon já está nos favoritos');
    }
    
    const favoriteData = {
      id: pokemon.id,
      name: pokemon.name.toLowerCase(),
      sprite: pokemon.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'favoritos'), favoriteData);
    
    return {
      docId: docRef.id,
      ...favoriteData
    };
  } catch (error) {
    console.error('Erro ao adicionar favorito:', error);
    throw error;
  }
};

/**
 * DELETE /favoritos/:id - Remove favorito
 * @param {string} docId - ID do documento no Firestore
 * @returns {Promise<boolean>} Sucesso
 */
export const removeFavorite = async (docId) => {
  try {
    if (!docId || typeof docId !== 'string') {
      throw new Error('ID do documento inválido');
    }
    
    await deleteDoc(doc(db, 'favoritos', docId));
    return true;
  } catch (error) {
    console.error('Erro ao remover favorito:', error);
    throw error;
  }
};

/**
 * DELETE /favoritos/pokemon/:pokemonId - Remove favorito por ID do Pokémon
 * @param {number} pokemonId - ID do Pokémon
 * @returns {Promise<boolean>} Sucesso
 */
export const removeFavoriteByPokemonId = async (pokemonId) => {
  try {
    const q = query(collection(db, 'favoritos'), where('id', '==', pokemonId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error('Favorito não encontrado');
    }
    
    const batch = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(batch);
    
    return true;
  } catch (error) {
    console.error('Erro ao remover favorito:', error);
    throw error;
  }
};

// ========================================
// ROTAS DE HISTÓRICO DE BATALHAS
// ========================================

/**
 * GET /batalhas - Lista histórico de batalhas
 * @param {Object} options - { sortField, sortOrder, limitCount }
 * @returns {Promise<Array>} Lista de batalhas
 */
export const getBattleHistory = async (options = {}) => {
  try {
    const { sortField = 'timestamp', sortOrder = 'desc', limitCount = 50 } = options;
    
    validateSort(sortField, sortOrder);
    
    const battlesRef = collection(db, 'batalhas');
    let q = query(battlesRef, orderBy(sortField, sortOrder));
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    throw error;
  }
};

/**
 * POST /batalhas - Salva resultado de batalha
 * @param {Object} battleData - Dados da batalha
 * @returns {Promise<Object>} Batalha salva
 */
export const saveBattleResult = async (battleData) => {
  try {
    // Validação
    if (!battleData.winner || !battleData.pokemon1 || !battleData.pokemon2) {
      throw new Error('Dados de batalha incompletos');
    }
    
    const battle = {
      pokemon1: {
        id: battleData.pokemon1.id,
        name: battleData.pokemon1.name,
        finalHP: battleData.pokemon1.finalHP || 0
      },
      pokemon2: {
        id: battleData.pokemon2.id,
        name: battleData.pokemon2.name,
        finalHP: battleData.pokemon2.finalHP || 0
      },
      winner: battleData.winner, // 1 ou 2
      duration: battleData.duration || 0,
      totalDamage: battleData.totalDamage || 0,
      weather: battleData.weather || null,
      timestamp: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'batalhas'), battle);
    
    return {
      docId: docRef.id,
      ...battle
    };
  } catch (error) {
    console.error('Erro ao salvar batalha:', error);
    throw error;
  }
};

// ========================================
// ROTAS DE PONTUAÇÕES DO QUIZ
// ========================================

/**
 * GET /quiz/scores - Lista top scores
 * @param {number} limitCount - Número de resultados
 * @returns {Promise<Array>} Top scores
 */
export const getQuizScores = async (limitCount = 10) => {
  try {
    const scoresRef = collection(db, 'quizScores');
    const q = query(scoresRef, orderBy('score', 'desc'), limit(limitCount));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao buscar scores:', error);
    throw error;
  }
};

/**
 * POST /quiz/scores - Salva pontuação do quiz
 * @param {Object} scoreData - { playerName, score, streak, total }
 * @returns {Promise<Object>} Score salvo
 */
export const saveQuizScore = async (scoreData) => {
  try {
    if (!scoreData.score || scoreData.score < 0) {
      throw new Error('Pontuação inválida');
    }
    
    const score = {
      playerName: scoreData.playerName || 'Anônimo',
      score: scoreData.score,
      streak: scoreData.streak || 0,
      total: scoreData.total || 0,
      accuracy: scoreData.total > 0 ? Math.round((scoreData.score / (scoreData.total * 2)) * 100) : 0,
      timestamp: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'quizScores'), score);
    
    return {
      docId: docRef.id,
      ...score
    };
  } catch (error) {
    console.error('Erro ao salvar score:', error);
    throw error;
  }
};

// ========================================
// ESTATÍSTICAS GLOBAIS
// ========================================

/**
 * GET /stats - Estatísticas gerais
 * @returns {Promise<Object>} Estatísticas
 */
export const getGlobalStats = async () => {
  try {
    const [favorites, battles, scores] = await Promise.all([
      getDocs(collection(db, 'favoritos')),
      getDocs(collection(db, 'batalhas')),
      getDocs(collection(db, 'quizScores'))
    ]);
    
    return {
      totalFavorites: favorites.size,
      totalBattles: battles.size,
      totalQuizAttempts: scores.size,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    throw error;
  }
};
