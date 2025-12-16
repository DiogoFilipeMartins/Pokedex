import { useState, useEffect, useMemo, useRef } from 'react';
import { useDebounce } from './hooks/useDebounce';
import { useFetch } from './hooks/useFetch';
import { 
  getFavorites as getLocalFavorites, 
  addFavorite as addLocalFavorite, 
  removeFavorite as removeLocalFavorite, 
  isFavorite,
  saveFilters,
  getFilters,
  saveSort,
  getSort 
} from './utils/localStorage';
import { 
  getFavorites as getFirebaseFavorites,
  addFavorite as addFirebaseFavorite,
  removeFavoriteByPokemonId,
  saveBattleResult,
  saveQuizScore
} from './services/api';
import { formatNumber, formatString, capitalize } from './utils/formatters';
import './App.css';

function App() {
  // Estados principais
  const [search, setSearch] = useState(() => getFilters().search || '');
  const [typeFilter, setTypeFilter] = useState(() => getFilters().type || '');
  const [sortConfig, setSortConfig] = useState(() => getSort());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [favorites, setFavorites] = useState(getLocalFavorites);
  const [useFirebase, setUseFirebase] = useState(true); // Usar Firebase por padrão
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [pokemonDetails, setPokemonDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [currentForm, setCurrentForm] = useState('default');
  const [abilityDescriptions, setAbilityDescriptions] = useState({});
  const [expandedAbility, setExpandedAbility] = useState(null);
  const [pokemonVariants, setPokemonVariants] = useState([]);
  
  // Estados de batalha
  const [battleMode, setBattleMode] = useState(false);
  const [battleSlot1, setBattleSlot1] = useState(null);
  const [battleSlot2, setBattleSlot2] = useState(null);
  const [battleActive, setBattleActive] = useState(false);
  const [battleHP1, setBattleHP1] = useState(null);
  const [battleHP2, setBattleHP2] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [battleLog, setBattleLog] = useState([]);
  const [isAttacking, setIsAttacking] = useState(null);
  const [battleWinner, setBattleWinner] = useState(null);
  
  // Novos estados para melhorias
  const [pokemon1Moves, setPokemon1Moves] = useState([]);
  const [pokemon2Moves, setPokemon2Moves] = useState([]);
  const [status1, setStatus1] = useState(null); // burn, paralysis, poison
  const [status2, setStatus2] = useState(null);
  const [statBoosts1, setStatBoosts1] = useState({ attack: 0, defense: 0, speed: 0 });
  const [statBoosts2, setStatBoosts2] = useState({ attack: 0, defense: 0, speed: 0 });
  const [damageFlash, setDamageFlash] = useState(null);
  const [particles, setParticles] = useState([]);
  
  // Sistema de clima/weather
  const [weather, setWeather] = useState(null); // sun, rain, sandstorm, snow
  const [weatherTurns, setWeatherTurns] = useState(0);
  
  // Sistema de Ultimate
  const [ultimateEnergy1, setUltimateEnergy1] = useState(0);
  const [ultimateEnergy2, setUltimateEnergy2] = useState(0);
  const [isUltimate, setIsUltimate] = useState(null);
  
  // Animações
  const [battleIntro, setBattleIntro] = useState(false);
  const [faintingPokemon, setFaintingPokemon] = useState(null);
  
  // Sistema de Quiz
  const [quizMode, setQuizMode] = useState(false);
  const [quizPokemon, setQuizPokemon] = useState(null);
  const [quizAnswer, setQuizAnswer] = useState('');
  const [quizRevealed, setQuizRevealed] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizStreak, setQuizStreak] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    try {
      const saved = localStorage.getItem('pokedex_quiz_highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [bestStreak, setBestStreak] = useState(() => {
    try {
      const saved = localStorage.getItem('pokedex_quiz_beststreak');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const searchInputRef = useRef(null);
  const debouncedSearch = useDebounce(search, 400);

  const { data: pokemonList, loading, error, refetch } = useFetch(
    'https://pokeapi.co/api/v2/pokemon?limit=10000',
    { timeout: 8000 }
  );

  const types = [
    'normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting',
    'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost',
    'dragon', 'dark', 'steel', 'fairy'
  ];

  const typeColors = {
    grass: '#78C850',
    fire: '#F08030',
    water: '#6890F0',
    bug: '#A8B820',
    normal: '#A8A878',
    poison: '#A040A0',
    electric: '#F8D030',
    ground: '#E0C068',
    fairy: '#EE99AC',
    fighting: '#C03028',
    psychic: '#F85888',
    rock: '#B8A038',
    ghost: '#705898',
    ice: '#98D8D8',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    flying: '#A890F0'
  };

  // Tabela de efetividade de tipos
  const typeEffectiveness = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
    flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
  };

  const formsExtras = {
    charizard: { mega: true, megaY: true, gigantamax: true },
    mewtwo: { megaX: true, megaY: true },
    gengar: { mega: true, gigantamax: true },
    lapras: { gigantamax: true },
    pikachu: { gigantamax: true },
    lucario: { mega: true },
    gyarados: { mega: true },
    gardevoir: { mega: true },
    snorlax: { gigantamax: true },
    blastoise: { mega: true, gigantamax: true },
    venusaur: { mega: true, gigantamax: true },
    alakazam: { mega: true },
    machamp: { gigantamax: true },
    kingler: { gigantamax: true },
  };

  // Funções de batalha
  const calculateTypeEffectiveness = (attackerType, defenderTypes) => {
    let multiplier = 1;
    defenderTypes.forEach(defType => {
      const effectiveness = typeEffectiveness[attackerType]?.[defType] ?? 1;
      multiplier *= effectiveness;
    });
    return multiplier;
  };

  const calculateDamage = (attacker, defender, move, attackerBoosts, attackerStatus, defenderBoosts, isUltimateMove = false) => {
    const isPhysical = move.damage_class === 'physical';
    const attackStat = isPhysical ? 'attack' : 'special-attack';
    const defenseStat = isPhysical ? 'defense' : 'special-defense';
    
    let attack = attacker.stats.find(s => s.stat.name === attackStat).base_stat;
    let defense = defender.stats.find(s => s.stat.name === defenseStat).base_stat;
    
    // Aplicar boosts de stats (cada nível = 50% de mudança)
    const attackBoost = attackerBoosts[attackStat === 'attack' || attackStat === 'special-attack' ? 'attack' : 'attack'];
    const defenseBoost = defenderBoosts[defenseStat === 'defense' || defenseStat === 'special-defense' ? 'defense' : 'defense'];
    attack = Math.floor(attack * (1 + attackBoost * 0.5));
    defense = Math.floor(defense * (1 + defenseBoost * 0.5));
    
    // Burn reduz ataque físico em 50%
    if (attackerStatus === 'burn' && isPhysical) {
      attack = Math.floor(attack * 0.5);
    }
    
    const attackerTypes = attacker.types.map(t => t.type.name);
    const defenderTypes = defender.types.map(t => t.type.name);
    
    const typeMultiplier = calculateTypeEffectiveness(move.type, defenderTypes);
    const randomFactor = 0.85 + Math.random() * 0.15;
    
    // Chance de crítico (6.25% como nos jogos)
    const isCritical = Math.random() < 0.0625;
    const critMultiplier = isCritical ? 1.5 : 1;
    
    // STAB (Same Type Attack Bonus) - 1.5x se o ataque é do mesmo tipo do Pokémon
    const stab = attackerTypes.includes(move.type) ? 1.5 : 1;
    
    // Efeitos de clima
    let weatherMultiplier = 1;
    if (weather) {
      if (weather === 'sun') {
        if (move.type === 'fire') weatherMultiplier = 1.5;
        if (move.type === 'water') weatherMultiplier = 0.5;
      } else if (weather === 'rain') {
        if (move.type === 'water') weatherMultiplier = 1.5;
        if (move.type === 'fire') weatherMultiplier = 0.5;
      } else if (weather === 'snow') {
        if (move.type === 'ice') weatherMultiplier = 1.3;
      }
    }
    
    // Ultimate multiplier
    const ultimateMultiplier = isUltimateMove ? 3 : 1;
    
    const power = move.power || 60;
    const baseDamage = ((2 * 50 / 5 + 2) * power * (attack / defense)) / 50 + 2;
    const finalDamage = Math.floor(baseDamage * typeMultiplier * randomFactor * critMultiplier * stab * weatherMultiplier * ultimateMultiplier * 0.5);
    
    return { damage: Math.max(5, finalDamage), effectiveness: typeMultiplier, isCritical, moveName: move.name, moveType: move.type };
  };

  const startBattle = async () => {
    if (!battleSlot1 || !battleSlot2) return;
    
    // Intro cinematográfica
    setBattleIntro(true);
    setTimeout(() => setBattleIntro(false), 3000);
    
    // Carregar movimentos dos Pokémon
    const moves1 = await loadPokemonMoves(battleSlot1);
    const moves2 = await loadPokemonMoves(battleSlot2);
    setPokemon1Moves(moves1);
    setPokemon2Moves(moves2);
    
    setBattleActive(true);
    const hp1 = battleSlot1.stats.find(s => s.stat.name === 'hp').base_stat;
    const hp2 = battleSlot2.stats.find(s => s.stat.name === 'hp').base_stat;
    setBattleHP1(hp1);
    setBattleHP2(hp2);
    
    // Reset status e boosts
    setStatus1(null);
    setStatus2(null);
    setStatBoosts1({ attack: 0, defense: 0, speed: 0 });
    setStatBoosts2({ attack: 0, defense: 0, speed: 0 });
    setUltimateEnergy1(0);
    setUltimateEnergy2(0);
    setFaintingPokemon(null);
    
    // Clima aleatório (30% de chance)
    if (Math.random() < 0.3) {
      const weathers = ['sun', 'rain', 'sandstorm', 'snow'];
      const randomWeather = weathers[Math.floor(Math.random() * weathers.length)];
      setWeather(randomWeather);
      setWeatherTurns(5);
      const weatherNames = {
        sun: '☀️ Sol Forte',
        rain: '🌧️ Chuva',
        sandstorm: '🌪️ Tempestade de Areia',
        snow: '❄️ Neve'
      };
      setTimeout(() => {
        setBattleLog(prev => [...prev, `${weatherNames[randomWeather]} começou!`]);
      }, 3000);
    } else {
      setWeather(null);
      setWeatherTurns(0);
    }
    
    const speed1 = battleSlot1.stats.find(s => s.stat.name === 'speed').base_stat;
    const speed2 = battleSlot2.stats.find(s => s.stat.name === 'speed').base_stat;
    
    const firstAttacker = speed1 >= speed2 ? 1 : 2;
    setCurrentTurn(firstAttacker);
    
    setTimeout(() => {
      setBattleLog([
        `⚡ ${capitalize(battleSlot1.name)} (Velocidade: ${speed1}) vs ${capitalize(battleSlot2.name)} (Velocidade: ${speed2})`,
        `🏁 ${capitalize(speed1 >= speed2 ? battleSlot1.name : battleSlot2.name)} é mais rápido e ataca primeiro!`
      ]);
    }, 3000);
  };
  
  const loadPokemonMoves = async (pokemon) => {
    const abortController = new AbortController();
    try {
      // Pegar 4 movimentos aleatórios
      const shuffled = [...pokemon.moves].sort(() => 0.5 - Math.random());
      const selectedMoves = shuffled.slice(0, 4);
      
      const moveDetails = await Promise.all(
        selectedMoves.map(async (m) => {
          try {
            const response = await fetch(m.move.url, { signal: abortController.signal });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            return {
              name: data.name,
              power: data.power,
              type: data.type.name,
              damage_class: data.damage_class.name,
              effect_chance: data.effect_chance,
              effect_entries: data.effect_entries
            };
          } catch {
            return {
              name: m.move.name,
              power: 60,
              type: pokemon.types[0].type.name,
              damage_class: 'physical',
              effect_chance: null
            };
          }
        })
      );
      
      return moveDetails.filter(m => m.power && m.power > 0);
    } catch {
      return [];
    }
  };

  const endBattle = () => {
    setBattleActive(false);
    setBattleHP1(null);
    setBattleHP2(null);
    setCurrentTurn(1);
    setBattleLog([]);
    setIsAttacking(null);
    setBattleWinner(null);
    setPokemon1Moves([]);
    setPokemon2Moves([]);
    setStatus1(null);
    setStatus2(null);
    setStatBoosts1({ attack: 0, defense: 0, speed: 0 });
    setStatBoosts2({ attack: 0, defense: 0, speed: 0 });
    setDamageFlash(null);
    setParticles([]);
    setWeather(null);
    setWeatherTurns(0);
    setUltimateEnergy1(0);
    setUltimateEnergy2(0);
    setIsUltimate(null);
    setBattleIntro(false);
    setFaintingPokemon(null);
  };

  const selectPokemonForBattle = async (pokemon, slot) => {
    const abortController = new AbortController();
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.id}`, {
        signal: abortController.signal
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (slot === 1) setBattleSlot1(data);
      else setBattleSlot2(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Erro ao carregar Pokémon para batalha:', err);
        setStatusMessage('Erro ao carregar Pokémon para batalha');
      }
    }
  };

  // Sistema de batalha automática
  useEffect(() => {
    if (!battleActive || battleWinner || pokemon1Moves.length === 0 || pokemon2Moves.length === 0 || battleIntro) return;

    const battleInterval = setInterval(() => {
      // Gerenciar turnos de clima
      if (weather && weatherTurns > 0) {
        setWeatherTurns(prev => prev - 1);
        if (weatherTurns === 1) {
          setBattleLog(prev => [...prev, `O clima voltou ao normal.`]);
          setWeather(null);
        }
      }
      
      // Dano de clima (tempestade de areia)
      if (weather === 'sandstorm') {
        const types1 = battleSlot1.types.map(t => t.type.name);
        const types2 = battleSlot2.types.map(t => t.type.name);
        const immuneTypes = ['rock', 'ground', 'steel'];
        
        if (!types1.some(t => immuneTypes.includes(t))) {
          const sandDmg = Math.floor(battleSlot1.stats.find(s => s.stat.name === 'hp').base_stat * 0.0625);
          setBattleHP1(prev => Math.max(0, prev - sandDmg));
          setBattleLog(prev => [...prev, `🌪️ ${capitalize(battleSlot1.name)} foi ferido pela tempestade de areia!`]);
        }
        if (!types2.some(t => immuneTypes.includes(t))) {
          const sandDmg = Math.floor(battleSlot2.stats.find(s => s.stat.name === 'hp').base_stat * 0.0625);
          setBattleHP2(prev => Math.max(0, prev - sandDmg));
          setBattleLog(prev => [...prev, `🌪️ ${capitalize(battleSlot2.name)} foi ferido pela tempestade de areia!`]);
        }
      }
      
      // Dano de veneno
      if (status1 === 'poison') {
        const poisonDmg = Math.floor(battleSlot1.stats.find(s => s.stat.name === 'hp').base_stat * 0.0625);
        setBattleHP1(prev => Math.max(0, prev - poisonDmg));
        setBattleLog(prev => [...prev, `🟣 ${capitalize(battleSlot1.name)} sofreu ${poisonDmg} de dano por envenenamento!`]);
      }
      if (status2 === 'poison') {
        const poisonDmg = Math.floor(battleSlot2.stats.find(s => s.stat.name === 'hp').base_stat * 0.0625);
        setBattleHP2(prev => Math.max(0, prev - poisonDmg));
        setBattleLog(prev => [...prev, `🟣 ${capitalize(battleSlot2.name)} sofreu ${poisonDmg} de dano por envenenamento!`]);
      }
      
      if (battleHP1 <= 0) {
        setFaintingPokemon(1);
        setTimeout(async () => {
          setBattleWinner(2);
          setBattleLog(prev => [...prev, `🏆 ${capitalize(battleSlot2.name)} venceu a batalha!`]);
          
          // Salvar resultado no Firebase
          if (useFirebase) {
            try {
              await saveBattleResult({
                pokemon1: { id: battleSlot1.id, name: battleSlot1.name, finalHP: 0 },
                pokemon2: { id: battleSlot2.id, name: battleSlot2.name, finalHP: battleHP2 },
                winner: 2,
                duration: Date.now(),
                totalDamage: battleSlot2.stats.find(s => s.stat.name === 'hp').base_stat - battleHP2,
                weather: weather
              });
              console.log('💾 Batalha salva no Firebase!');
            } catch (error) {
              console.error('Erro ao salvar batalha:', error);
            }
          }
        }, 1000);
        return;
      }
      if (battleHP2 <= 0) {
        setFaintingPokemon(2);
        setTimeout(async () => {
          setBattleWinner(1);
          setBattleLog(prev => [...prev, `🏆 ${capitalize(battleSlot1.name)} venceu a batalha!`]);
          
          // Salvar resultado no Firebase
          if (useFirebase) {
            try {
              await saveBattleResult({
                pokemon1: { id: battleSlot1.id, name: battleSlot1.name, finalHP: battleHP1 },
                pokemon2: { id: battleSlot2.id, name: battleSlot2.name, finalHP: 0 },
                winner: 1,
                duration: Date.now(),
                totalDamage: battleSlot1.stats.find(s => s.stat.name === 'hp').base_stat - battleHP1,
                weather: weather
              });
              console.log('💾 Batalha salva no Firebase!');
            } catch (error) {
              console.error('Erro ao salvar batalha:', error);
            }
          }
        }, 1000);
        return;
      }

      if (currentTurn === 1) {
        // Verificar paralisia (25% chance de não atacar)
        if (status1 === 'paralysis' && Math.random() < 0.25) {
          setBattleLog(prev => [...prev, `⚡ ${capitalize(battleSlot1.name)} está paralisado e não conseguiu atacar!`]);
          setCurrentTurn(2);
          return;
        }
        
        setIsAttacking(1);
        
        // Sistema de esquiva (baseado em Speed)
        const defenderSpeed = battleSlot2.stats.find(s => s.stat.name === 'speed').base_stat;
        const dodgeChance = defenderSpeed > 100 ? 0.15 : defenderSpeed > 80 ? 0.10 : 0.05;
        if (Math.random() < dodgeChance) {
          setBattleLog(prev => [...prev, `💨 ${capitalize(battleSlot2.name)} esquivou do ataque!`]);
          setCurrentTurn(2);
          return;
        }
        
        // Verificar Ultimate
        const useUltimate = ultimateEnergy1 >= 100;
        if (useUltimate) {
          setIsUltimate(1);
          setUltimateEnergy1(0);
          setTimeout(() => setIsUltimate(null), 1000);
        }
        
        const move = pokemon1Moves[Math.floor(Math.random() * pokemon1Moves.length)];
        let { damage, effectiveness, isCritical, moveName, moveType } = calculateDamage(
          battleSlot1, battleSlot2, move, statBoosts1, status1, statBoosts2, useUltimate
        );
        
        // Sistema de defesa (20% chance)
        const defended = Math.random() < 0.20;
        if (defended) {
          damage = Math.floor(damage * 0.25);
          setBattleLog(prev => [...prev, `🛡️ ${capitalize(battleSlot2.name)} defendeu! Dano reduzido!`]);
        }
        
        setBattleHP2(prev => Math.max(0, prev - damage));
        setDamageFlash(2);
        setTimeout(() => setDamageFlash(null), 200);
        
        // Criar partículas (mais se for ultimate)
        const particleCount = useUltimate ? 20 : 8;
        const newParticles = Array.from({ length: particleCount }, (_, i) => ({
          id: Date.now() + i,
          type: moveType,
          x: Math.random() * 100,
          y: Math.random() * 100
        }));
        setParticles(newParticles);
        setTimeout(() => setParticles([]), 800);
        
        let effectMsg = '';
        if (useUltimate) effectMsg = ' 🌟 ULTIMATE!';
        if (isCritical) effectMsg += ' ⭐ CRÍTICO!';
        if (effectiveness > 1) effectMsg += ' 💥 Super eficaz!';
        else if (effectiveness < 1 && effectiveness > 0) effectMsg += ' 🛡️ Pouco eficaz...';
        else if (effectiveness === 0) effectMsg += ' ❌ Não teve efeito...';
        
        setBattleLog(prev => [...prev, `⚔️ ${capitalize(battleSlot1.name)} usou ${moveName.replace('-', ' ')}! Causou ${damage} de dano!${effectMsg}`]);
        
        // Aumentar energia ultimate se não usou
        if (!useUltimate) {
          setUltimateEnergy1(prev => Math.min(100, prev + 25));
        }
        
        // Chance de aplicar status baseado no tipo do movimento (15%)
        if (Math.random() < 0.15 && !status2) {
          let newStatus = null;
          if (moveType === 'fire') newStatus = 'burn';
          else if (moveType === 'electric') newStatus = 'paralysis';
          else if (moveType === 'poison') newStatus = 'poison';
          
          if (newStatus) {
            setStatus2(newStatus);
            const statusNames = { burn: '🔥 queimado', paralysis: '⚡ paralisado', poison: '🟣 envenenado' };
            setBattleLog(prev => [...prev, `${capitalize(battleSlot2.name)} ficou ${statusNames[newStatus]}!`]);
          }
        }
        
        // Chance de alterar stats (10%) - Buff próprio ou debuff no oponente
        if (Math.random() < 0.1) {
          const isBuff = Math.random() < 0.5; // 50% buff próprio, 50% debuff oponente
          const statChange = isBuff ? 1 : -1;
          const stat = ['attack', 'defense'][Math.floor(Math.random() * 2)];
          
          if (isBuff) {
            // Buff próprio
            setStatBoosts1(prev => ({ ...prev, [stat]: Math.max(-3, Math.min(3, prev[stat] + statChange)) }));
            const statNames = { attack: 'Ataque', defense: 'Defesa' };
            setBattleLog(prev => [...prev, `↑ ${statNames[stat]} de ${capitalize(battleSlot1.name)} aumentou!`]);
          } else {
            // Debuff no oponente
            setStatBoosts2(prev => ({ ...prev, [stat]: Math.max(-3, Math.min(3, prev[stat] + statChange)) }));
            const statNames = { attack: 'Ataque', defense: 'Defesa' };
            setBattleLog(prev => [...prev, `↓ ${statNames[stat]} de ${capitalize(battleSlot2.name)} diminuiu!`]);
          }
        }
        
        setTimeout(() => {
          setIsAttacking(null);
          setCurrentTurn(2);
        }, 500);
      } else {
        // Verificar paralisia (25% chance de não atacar)
        if (status2 === 'paralysis' && Math.random() < 0.25) {
          setBattleLog(prev => [...prev, `⚡ ${capitalize(battleSlot2.name)} está paralisado e não conseguiu atacar!`]);
          setCurrentTurn(1);
          return;
        }
        
        setIsAttacking(2);
        
        // Sistema de esquiva (baseado em Speed)
        const defenderSpeed = battleSlot1.stats.find(s => s.stat.name === 'speed').base_stat;
        const dodgeChance = defenderSpeed > 100 ? 0.15 : defenderSpeed > 80 ? 0.10 : 0.05;
        if (Math.random() < dodgeChance) {
          setBattleLog(prev => [...prev, `💨 ${capitalize(battleSlot1.name)} esquivou do ataque!`]);
          setCurrentTurn(1);
          return;
        }
        
        // Verificar Ultimate
        const useUltimate = ultimateEnergy2 >= 100;
        if (useUltimate) {
          setIsUltimate(2);
          setUltimateEnergy2(0);
          setTimeout(() => setIsUltimate(null), 1000);
        }
        
        const move = pokemon2Moves[Math.floor(Math.random() * pokemon2Moves.length)];
        let { damage, effectiveness, isCritical, moveName, moveType } = calculateDamage(
          battleSlot2, battleSlot1, move, statBoosts2, status2, statBoosts1, useUltimate
        );
        
        // Sistema de defesa (20% chance)
        const defended = Math.random() < 0.20;
        if (defended) {
          damage = Math.floor(damage * 0.25);
          setBattleLog(prev => [...prev, `🛡️ ${capitalize(battleSlot1.name)} defendeu! Dano reduzido!`]);
        }
        
        setBattleHP1(prev => Math.max(0, prev - damage));
        setDamageFlash(1);
        setTimeout(() => setDamageFlash(null), 200);
        
        // Criar partículas (mais se for ultimate)
        const particleCount = useUltimate ? 20 : 8;
        const newParticles = Array.from({ length: particleCount }, (_, i) => ({
          id: Date.now() + i,
          type: moveType,
          x: Math.random() * 100,
          y: Math.random() * 100
        }));
        setParticles(newParticles);
        setTimeout(() => setParticles([]), 800);
        
        let effectMsg = '';
        if (useUltimate) effectMsg = ' 🌟 ULTIMATE!';
        if (isCritical) effectMsg += ' ⭐ CRÍTICO!';
        if (effectiveness > 1) effectMsg += ' 💥 Super eficaz!';
        else if (effectiveness < 1 && effectiveness > 0) effectMsg += ' 🛡️ Pouco eficaz...';
        else if (effectiveness === 0) effectMsg += ' ❌ Não teve efeito...';
        
        setBattleLog(prev => [...prev, `⚔️ ${capitalize(battleSlot2.name)} usou ${moveName.replace('-', ' ')}! Causou ${damage} de dano!${effectMsg}`]);
        
        // Aumentar energia ultimate se não usou
        if (!useUltimate) {
          setUltimateEnergy2(prev => Math.min(100, prev + 25));
        }
        
        // Chance de aplicar status baseado no tipo do movimento (15%)
        if (Math.random() < 0.15 && !status1) {
          let newStatus = null;
          if (moveType === 'fire') newStatus = 'burn';
          else if (moveType === 'electric') newStatus = 'paralysis';
          else if (moveType === 'poison') newStatus = 'poison';
          
          if (newStatus) {
            setStatus1(newStatus);
            const statusNames = { burn: '🔥 queimado', paralysis: '⚡ paralisado', poison: '🟣 envenenado' };
            setBattleLog(prev => [...prev, `${capitalize(battleSlot1.name)} ficou ${statusNames[newStatus]}!`]);
          }
        }
        
        // Chance de alterar stats (10%) - Buff próprio ou debuff no oponente
        if (Math.random() < 0.1) {
          const isBuff = Math.random() < 0.5; // 50% buff próprio, 50% debuff oponente
          const statChange = isBuff ? 1 : -1;
          const stat = ['attack', 'defense'][Math.floor(Math.random() * 2)];
          
          if (isBuff) {
            // Buff próprio
            setStatBoosts2(prev => ({ ...prev, [stat]: Math.max(-3, Math.min(3, prev[stat] + statChange)) }));
            const statNames = { attack: 'Ataque', defense: 'Defesa' };
            setBattleLog(prev => [...prev, `↑ ${statNames[stat]} de ${capitalize(battleSlot2.name)} aumentou!`]);
          } else {
            // Debuff no oponente
            setStatBoosts1(prev => ({ ...prev, [stat]: Math.max(-3, Math.min(3, prev[stat] + statChange)) }));
            const statNames = { attack: 'Ataque', defense: 'Defesa' };
            setBattleLog(prev => [...prev, `↓ ${statNames[stat]} de ${capitalize(battleSlot1.name)} diminuiu!`]);
          }
        }
        
        setTimeout(() => {
          setIsAttacking(null);
          setCurrentTurn(1);
        }, 500);
      }
    }, 3000);

    return () => clearInterval(battleInterval);
  }, [battleActive, currentTurn, battleHP1, battleHP2, battleSlot1, battleSlot2, battleWinner, pokemon1Moves, pokemon2Moves, status1, status2, statBoosts1, statBoosts2, weather, weatherTurns, ultimateEnergy1, ultimateEnergy2, battleIntro]);

  const filteredAndSortedPokemon = useMemo(() => {
    if (!pokemonList?.results) return [];

    let filtered = pokemonList.results.map((p) => {
      const id = parseInt(p.url.split('/').filter(Boolean).pop());
      return {
        id,
        name: p.name,
        url: p.url,
        types: [],
      };
    }).filter(p => p.id <= 1025);

    if (debouncedSearch) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.id.toString().includes(debouncedSearch)
      );
    }

    filtered.sort((a, b) => {
      let compareA = a[sortConfig.field];
      let compareB = b[sortConfig.field];

      if (sortConfig.field === 'name') {
        compareA = compareA.toLowerCase();
        compareB = compareB.toLowerCase();
      }

      if (sortConfig.order === 'asc') {
        return compareA > compareB ? 1 : -1;
      } else {
        return compareA < compareB ? 1 : -1;
      }
    });

    return filtered;
  }, [pokemonList, debouncedSearch, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedPokemon.length / pageSize);
  const paginatedPokemon = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedPokemon.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedPokemon, currentPage, pageSize]);

  // Carregar favoritos do Firebase na inicialização
  useEffect(() => {
    const loadFavorites = async () => {
      if (!useFirebase) return;
      
      setLoadingFavorites(true);
      try {
        const firebaseFavs = await getFirebaseFavorites({ sortField: 'createdAt', sortOrder: 'desc' });
        // Converter para formato do localStorage para compatibilidade
        const favsMap = firebaseFavs.reduce((acc, fav) => {
          acc[fav.id] = { id: fav.id, name: fav.name, docId: fav.docId };
          return acc;
        }, {});
        setFavorites(favsMap);
        setStatusMessage(`✅ ${firebaseFavs.length} favoritos carregados do Firebase`);
        setTimeout(() => setStatusMessage(''), 3000);
      } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
        setStatusMessage('⚠️ Erro ao carregar favoritos. Usando localStorage.');
        setUseFirebase(false);
        setFavorites(getLocalFavorites());
      } finally {
        setLoadingFavorites(false);
      }
    };
    
    loadFavorites();
  }, []);

  // Carregar favoritos do Firebase na inicialização
  useEffect(() => {
    const loadFavorites = async () => {
      if (!useFirebase) return;
      
      setLoadingFavorites(true);
      try {
        const firebaseFavs = await getFirebaseFavorites({ sortField: 'createdAt', sortOrder: 'desc' });
        // Converter para formato do localStorage para compatibilidade
        const favsMap = firebaseFavs.reduce((acc, fav) => {
          acc[fav.id] = { id: fav.id, name: fav.name, docId: fav.docId };
          return acc;
        }, {});
        setFavorites(favsMap);
        setStatusMessage(`✅ ${firebaseFavs.length} favoritos carregados do Firebase`);
        setTimeout(() => setStatusMessage(''), 3000);
      } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
        setStatusMessage('⚠️ Erro ao carregar favoritos. Usando localStorage.');
        setUseFirebase(false);
        setFavorites(getLocalFavorites());
      } finally {
        setLoadingFavorites(false);
      }
    };
    
    loadFavorites();
  }, []);

  useEffect(() => {
    saveFilters({ search: debouncedSearch, type: typeFilter });
  }, [debouncedSearch, typeFilter]);

  useEffect(() => {
    saveSort(sortConfig);
  }, [sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, typeFilter, sortConfig]);

  useEffect(() => {
    if (loading) {
      setStatusMessage('A carregar Pokémon...');
    } else if (error) {
      setStatusMessage(`Erro: ${error.message}`);
    } else if (filteredAndSortedPokemon.length === 0 && debouncedSearch) {
      setStatusMessage('Nenhum Pokémon encontrado');
    } else if (filteredAndSortedPokemon.length > 0) {
      setStatusMessage(`${filteredAndSortedPokemon.length} Pokémon encontrados`);
    }
  }, [loading, error, filteredAndSortedPokemon.length, debouncedSearch]);

  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleFavorite = async (pokemon, customId = null) => {
    const pokemonId = customId || pokemon.id;
    const pokemonData = customId ? { ...pokemon, id: customId } : pokemon;
    
    // Verificar se é favorito (compatível com object e array)
    const isFav = Array.isArray(favorites) 
      ? favorites.some(f => f.id === pokemonId)
      : favorites[pokemonId] !== undefined;
    
    try {
      if (useFirebase) {
        // Usar Firebase
        if (isFav) {
          await removeFavoriteByPokemonId(pokemonId);
          setStatusMessage(`💔 ${capitalize(pokemon.name)} removido dos favoritos`);
        } else {
          // Usar o sprite correto - se já vem no objeto pokemon, usa esse, senão usa o padrão
          const spriteUrl = pokemon.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
          
          await addFirebaseFavorite({
            id: pokemonId,
            name: pokemon.name,
            sprite: spriteUrl
          });
          setStatusMessage(`❤️ ${capitalize(pokemon.name)} adicionado aos favoritos`);
        }
        
        // Recarregar favoritos do Firebase
        const firebaseFavs = await getFirebaseFavorites({ sortField: 'createdAt', sortOrder: 'desc' });
        const favsMap = firebaseFavs.reduce((acc, fav) => {
          acc[fav.id] = { id: fav.id, name: fav.name, docId: fav.docId };
          return acc;
        }, {});
        setFavorites(favsMap);
      } else {
        // Fallback para localStorage
        if (isFav) {
          removeLocalFavorite(pokemonId);
          setStatusMessage(`💔 ${capitalize(pokemon.name)} removido dos favoritos`);
        } else {
          addLocalFavorite(pokemonData);
          setStatusMessage(`❤️ ${capitalize(pokemon.name)} adicionado aos favoritos`);
        }
        setFavorites(getLocalFavorites());
      }
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
      setStatusMessage(`❌ Erro: ${error.message}`);
    }
    
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      setSearch(e.target.value);
      setStatusMessage('Pesquisa imediata realizada');
    }
  };

  const handleRetry = () => {
    setStatusMessage('A tentar novamente...');
    refetch();
  };

  const fetchPokemonDetails = async (pokemon) => {
    setSelectedPokemon(pokemon);
    setLoadingDetails(true);
    setCurrentForm('default');
    setAbilityDescriptions({});
    setExpandedAbility(null);
    
    const abortController = new AbortController();
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.id}`, {
        signal: abortController.signal
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setPokemonDetails(data);
      
      const descriptions = {};
      for (const ability of data.abilities) {
        try {
          const abilityResponse = await fetch(ability.ability.url, {
            signal: abortController.signal
          });
          if (abilityResponse.ok) {
            const abilityData = await abilityResponse.json();
            const ptDescription = abilityData.effect_entries.find(e => e.language.name === 'en');
            const shortDescription = abilityData.flavor_text_entries.find(e => e.language.name === 'en');
            descriptions[ability.ability.name] = {
              effect: ptDescription?.effect || ptDescription?.short_effect || 'Descrição não disponível',
              shortEffect: shortDescription?.flavor_text?.replace(/\n/g, ' ') || ptDescription?.short_effect || 'Descrição não disponível'
            };
          }
        } catch (err) {
          console.error(`Erro ao buscar habilidade ${ability.ability.name}:`, err);
          descriptions[ability.ability.name] = {
            effect: 'Erro ao carregar descrição',
            shortEffect: 'Erro ao carregar descrição'
          };
        }
      }
      setAbilityDescriptions(descriptions);
      
      try {
        const speciesResponse = await fetch(data.species.url, {
          signal: abortController.signal
        });
        if (speciesResponse.ok) {
          const speciesData = await speciesResponse.json();
          const varieties = speciesData.varieties || [];
          
          const variantsData = [];
          for (const variety of varieties) {
            try {
              const variantResponse = await fetch(variety.pokemon.url, {
                signal: abortController.signal
              });
              if (variantResponse.ok) {
                const variantData = await variantResponse.json();
                if (variantData.id !== data.id) {
                  variantsData.push({
                    id: variantData.id,
                    name: variety.pokemon.name,
                    isDefault: variety.is_default,
                    sprite: variantData.sprites.other['official-artwork'].front_default || variantData.sprites.front_default
                  });
                }
              }
            } catch (err) {
              console.error(`Erro ao buscar variante ${variety.pokemon.name}:`, err);
            }
          }
          setPokemonVariants(variantsData);
        }
      } catch (err) {
        console.error('Erro ao buscar variantes:', err);
        setPokemonVariants([]);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Erro:', error);
        setStatusMessage('Erro ao carregar detalhes do Pokémon');
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeDetails = () => {
    setSelectedPokemon(null);
    setPokemonDetails(null);
    setCurrentForm('default');
    setAbilityDescriptions({});
    setExpandedAbility(null);
    setPokemonVariants([]);
  };
  
  // Funções do Quiz
  const startQuizMode = () => {
    setQuizMode(true);
    setQuizScore(0);
    setQuizStreak(0);
    setQuizTotal(0);
    loadNewQuizPokemon();
  };
  
  const exitQuizMode = () => {
    setQuizMode(false);
    setQuizPokemon(null);
    setQuizAnswer('');
    setQuizRevealed(false);
    setShowHint(false);
    setUsedHint(false);
  };
  
  const loadNewQuizPokemon = async () => {
    setQuizRevealed(false);
    setQuizAnswer('');
    setShowHint(false);
    setUsedHint(false);
    
    const randomId = Math.floor(Math.random() * 1025) + 1;
    const abortController = new AbortController();
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`, {
        signal: abortController.signal
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setQuizPokemon(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Erro ao carregar Pokémon do quiz:', err);
        setStatusMessage('Erro ao carregar Pokémon do quiz');
      }
    }
  };
  
  const checkQuizAnswer = async () => {
    if (!quizPokemon || !quizAnswer.trim()) return;
    
    const userAnswer = quizAnswer.toLowerCase().trim();
    const correctAnswer = quizPokemon.name.toLowerCase();
    
    setQuizRevealed(true);
    const newTotal = quizTotal + 1;
    setQuizTotal(newTotal);
    
    if (userAnswer === correctAnswer) {
      const points = usedHint ? 1 : 2;
      const newScore = quizScore + points;
      const newStreak = quizStreak + 1;
      setQuizScore(newScore);
      setQuizStreak(newStreak);
      
      // Atualizar High Score
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('pokedex_quiz_highscore', newScore.toString());
        setStatusMessage('🏆 NOVO RECORDE DE PONTUAÇÃO!');
        setTimeout(() => setStatusMessage(''), 4000);
      }
      
      // Atualizar Best Streak
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
        localStorage.setItem('pokedex_quiz_beststreak', newStreak.toString());
        if (newScore <= highScore) { // Só mostra se não mostrou o high score
          setStatusMessage('🔥 NOVA MELHOR SEQUÊNCIA!');
          setTimeout(() => setStatusMessage(''), 4000);
        }
      }
      
      // Salvar score no Firebase a cada 5 acertos ou streak de 10
      if (useFirebase && (newTotal % 5 === 0 || newStreak >= 10)) {
        try {
          await saveQuizScore({
            playerName: 'Jogador',
            score: newScore,
            streak: newStreak,
            total: newTotal
          });
          console.log('🎮 Score do quiz salvo no Firebase!');
        } catch (error) {
          console.error('Erro ao salvar score:', error);
        }
      }
    } else {
      setQuizStreak(0);
    }
  };
  
  const skipQuizPokemon = () => {
    setQuizRevealed(true);
    setQuizTotal(prev => prev + 1);
    setQuizStreak(0);
  };

  const getFormSprite = () => {
    if (!pokemonDetails) return '';
    
    if (currentForm === 'default') {
      return pokemonDetails.sprites.other['official-artwork'].front_default;
    } else if (currentForm === 'shiny') {
      return pokemonDetails.sprites.other['official-artwork'].front_shiny;
    }
    return pokemonDetails.sprites.other['official-artwork'].front_default;
  };

  return (
    <>
      {/* Fundo Gradiente Moderno */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        zIndex: -1
      }} />
      
      {/* Tela de Batalha Fullscreen */}
      {battleActive && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/battle-background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '40px',
          overflow: 'hidden'
        }}>
          {/* Intro Cinematográfica */}
          {battleIntro && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.9)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'fadeIn 0.5s'
            }}>
              <h1 style={{
                color: 'white',
                fontSize: '64px',
                textTransform: 'uppercase',
                marginBottom: '30px',
                animation: 'battleIntro 2s',
                textShadow: '0 0 20px rgba(255,255,255,0.5)'
              }}>
                {capitalize(battleSlot1.name)} VS {capitalize(battleSlot2.name)}
              </h1>
              <div style={{
                fontSize: '48px',
                color: '#FFD700',
                animation: 'countdown 3s'
              }}>
                🎮 BATALHA!
              </div>
            </div>
          )}
          
          {/* Indicador de Clima */}
          {weather && (
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.8)',
              padding: '12px 24px',
              borderRadius: '12px',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              {weather === 'sun' && '☀️ Sol Forte'}
              {weather === 'rain' && '🌧️ Chuva'}
              {weather === 'sandstorm' && '🌪️ Tempestade'}
              {weather === 'snow' && '❄️ Neve'}
              <span style={{ fontSize: '14px', opacity: 0.8 }}>({weatherTurns} turnos)</span>
            </div>
          )}
          
          {/* Partículas de Clima */}
          {weather === 'rain' && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 1 }}>
              {Array.from({ length: 100 }).map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: `${Math.random() * 100}%`,
                  top: `${-20 + Math.random() * 20}%`,
                  width: '2px',
                  height: '25px',
                  background: 'linear-gradient(to bottom, rgba(200,220,255,0.8), rgba(150,200,255,0.4))',
                  animation: `rain ${0.5 + Math.random() * 0.5}s linear infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                  boxShadow: '0 0 3px rgba(200,220,255,0.5)'
                }} />)
              )}
            </div>
          )}
          
          {weather === 'snow' && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 1 }}>
              {Array.from({ length: 60 }).map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: `${Math.random() * 100}%`,
                  top: `${-10 + Math.random() * 10}%`,
                  width: `${6 + Math.random() * 6}px`,
                  height: `${6 + Math.random() * 6}px`,
                  background: 'radial-gradient(circle, white, rgba(255,255,255,0.7))',
                  borderRadius: '50%',
                  animation: `snow ${2 + Math.random() * 3}s linear infinite`,
                  animationDelay: `${Math.random() * 3}s`,
                  boxShadow: '0 0 5px rgba(255,255,255,0.8)',
                  filter: 'blur(1px)'
                }} />)
              )}
            </div>
          )}
          
          {weather === 'sun' && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 1 }}>
              {/* Raios de sol girando */}
              <div style={{
                position: 'absolute',
                top: '10%',
                right: '15%',
                width: '200px',
                height: '200px',
                animation: 'sunRays 20s linear infinite'
              }}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '3px',
                    height: '100px',
                    background: 'linear-gradient(to bottom, rgba(255,220,100,0.6), transparent)',
                    transformOrigin: 'top center',
                    transform: `translate(-50%, 0) rotate(${i * 30}deg)`,
                    filter: 'blur(2px)'
                  }} />
                ))}
              </div>
              {/* Partículas de luz */}
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={`spark-${i}`} style={{
                  position: 'absolute',
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${3 + Math.random() * 5}px`,
                  height: `${3 + Math.random() * 5}px`,
                  background: 'radial-gradient(circle, rgba(255,230,120,0.9), rgba(255,200,80,0.3))',
                  borderRadius: '50%',
                  animation: `sunRays ${3 + Math.random() * 2}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 3}s`,
                  boxShadow: '0 0 10px rgba(255,220,100,0.8)'
                }} />)
              )}
            </div>
          )}
          
          {weather === 'sandstorm' && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 1 }}>
              {Array.from({ length: 80 }).map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: `${-20 + Math.random() * 20}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${3 + Math.random() * 8}px`,
                  height: `${3 + Math.random() * 8}px`,
                  background: `rgba(${180 + Math.random() * 40}, ${140 + Math.random() * 30}, ${80 + Math.random() * 30}, ${0.3 + Math.random() * 0.5})`,
                  borderRadius: '50%',
                  animation: `sandstorm ${1.5 + Math.random() * 2}s linear infinite`,
                  animationDelay: `${Math.random() * 3}s`,
                  boxShadow: `0 0 3px rgba(200,160,100,0.4)`,
                  filter: 'blur(1px)'
                }} />)
              )}
            </div>
          )}

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          {/* Pokémon 2 (adversário - topo) */}
          <div style={{
            position: 'absolute',
            top: '25%',
            right: '25%',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '40px',
            zIndex: 2
          }}>
            <div style={{
              background: 'rgba(0,0,0,0.85)',
              borderRadius: '16px',
              padding: '16px 24px',
              minWidth: '300px',
              border: '3px solid rgba(255,255,255,0.3)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '22px', textTransform: 'capitalize', color: 'white', fontWeight: '700' }}>
                {battleSlot2.name}
              </h3>
              <div style={{ marginBottom: '10px' }}>
                <div style={{
                  background: '#E0E0E0',
                  borderRadius: '10px',
                  height: '20px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    background: battleHP2 / battleSlot2.stats.find(s => s.stat.name === 'hp').base_stat > 0.5 ? '#4CAF50' :
                              battleHP2 / battleSlot2.stats.find(s => s.stat.name === 'hp').base_stat > 0.2 ? '#FF9800' : '#F44336',
                    width: `${(battleHP2 / battleSlot2.stats.find(s => s.stat.name === 'hp').base_stat) * 100}%`,
                    height: '100%',
                    transition: 'all 0.5s ease'
                  }} />
                </div>
              </div>
              <p style={{ margin: '0', fontSize: '16px', fontWeight: 'bold', color: 'white' }}>
                HP: {battleHP2} / {battleSlot2.stats.find(s => s.stat.name === 'hp').base_stat}
              </p>
              
              {/* Status Effect */}
              {status2 && (
                <div style={{
                  marginTop: '8px',
                  padding: '4px 8px',
                  background: status2 === 'burn' ? '#FF6B6B' : status2 === 'paralysis' ? '#FFD93D' : '#9D50BB',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'inline-block'
                }}>
                  {status2 === 'burn' ? '🔥 Queimado' : status2 === 'paralysis' ? '⚡ Paralisado' : '🟣 Envenenado'}
                </div>
              )}
              
              {/* Stat Boosts */}
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', fontSize: '12px', color: 'white' }}>
                {statBoosts2.attack !== 0 && (
                  <span style={{ color: statBoosts2.attack > 0 ? '#4CAF50' : '#F44336' }}>
                    ATK {statBoosts2.attack > 0 ? '↑' : '↓'}{Math.abs(statBoosts2.attack)}
                  </span>
                )}
                {statBoosts2.defense !== 0 && (
                  <span style={{ color: statBoosts2.defense > 0 ? '#4CAF50' : '#F44336' }}>
                    DEF {statBoosts2.defense > 0 ? '↑' : '↓'}{Math.abs(statBoosts2.defense)}
                  </span>
                )}
              </div>
              
              {/* Barra de Ultimate */}
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', color: '#FFD700' }}>
                  <span>⚡ ULTIMATE</span>
                  <span>{ultimateEnergy2}%</span>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: ultimateEnergy2 >= 100 ? 'linear-gradient(90deg, #FFD700, #FFA500)' : 'linear-gradient(90deg, #4A90E2, #357ABD)',
                    width: `${ultimateEnergy2}%`,
                    height: '100%',
                    transition: 'all 0.3s ease',
                    boxShadow: ultimateEnergy2 >= 100 ? '0 0 10px #FFD700' : 'none',
                    animation: ultimateEnergy2 >= 100 ? 'pulse 1s infinite' : 'none'
                  }} />
                </div>
              </div>
              
              {isAttacking === 2 && (
                <p style={{ margin: '10px 0 0 0', color: '#FF6B6B', fontWeight: 'bold', fontSize: '14px' }}>
                  ⚔️ Atacando...
                </p>
              )}
              {currentTurn === 2 && !isAttacking && !battleWinner && (
                <p style={{ margin: '10px 0 0 0', color: '#64B5F6', fontWeight: 'bold', fontSize: '14px' }}>
                  ⏳ Aguardando...
                </p>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              {/* Efeito Ultimate */}
              {isUltimate === 2 && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '80px',
                  animation: 'ultimateFlash 1s',
                  zIndex: 10,
                  textShadow: '0 0 30px #FFD700'
                }}>
                  🌟
                </div>
              )}
              <img
                src={battleSlot2.sprites.other['official-artwork'].front_default}
                alt={battleSlot2.name}
                style={{
                  width: '220px',
                  height: '220px',
                  objectFit: 'contain',
                  filter: battleHP2 <= 0 ? 'grayscale(100%) brightness(0.6)' : damageFlash === 2 ? 'brightness(2) saturate(0)' : isUltimate === 2 ? 'drop-shadow(0 0 20px #FFD700)' : 'drop-shadow(4px 4px 8px rgba(0,0,0,0.5))',
                  animation: isAttacking === 2 ? 'shake 0.5s' : faintingPokemon === 2 ? 'faint 1s forwards' : 'none',
                  imageRendering: 'pixelated',
                  transition: 'filter 0.1s',
                  transform: isUltimate === 2 ? 'scale(1.2)' : 'scale(1)',
                  transformTransition: 'all 0.3s'
                }}
              />
              {/* Partículas de Ataque */}
              {damageFlash === 2 && particles.map(p => (
                <div
                  key={p.id}
                  style={{
                    position: 'absolute',
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: typeColors[p.type] || '#FFF',
                    animation: 'particleFade 0.8s ease-out',
                    boxShadow: `0 0 10px ${typeColors[p.type] || '#FFF'}`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Pokémon 1 (jogador - base) */}
          <div style={{
            position: 'absolute',
            bottom: '8%',
            left: '10%',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '40px',
            zIndex: 2
          }}>
            <div style={{ position: 'relative' }}>
              {/* Efeito Ultimate */}
              {isUltimate === 1 && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) scaleX(-1)',
                  fontSize: '80px',
                  animation: 'ultimateFlash 1s',
                  zIndex: 10,
                  textShadow: '0 0 30px #FFD700'
                }}>
                  🌟
                </div>
              )}
              <img
                src={battleSlot1.sprites.other['official-artwork'].front_default}
                alt={battleSlot1.name}
                style={{
                  width: '260px',
                  height: '260px',
                  objectFit: 'contain',
                  filter: battleHP1 <= 0 ? 'grayscale(100%) brightness(0.6)' : damageFlash === 1 ? 'brightness(2) saturate(0)' : isUltimate === 1 ? 'drop-shadow(0 0 20px #FFD700)' : 'drop-shadow(-4px 4px 8px rgba(0,0,0,0.5))',
                  transform: isUltimate === 1 ? 'scaleX(-1.2) scaleY(1.2)' : 'scaleX(-1)',
                  animation: isAttacking === 1 ? 'shake 0.5s' : faintingPokemon === 1 ? 'faint 1s forwards' : 'none',
                  imageRendering: 'pixelated',
                  transition: 'filter 0.1s, transform 0.3s'
                }}
              />
              {/* Partículas de Ataque */}
              {damageFlash === 1 && particles.map(p => (
                <div
                  key={p.id}
                  style={{
                    position: 'absolute',
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: typeColors[p.type] || '#FFF',
                    animation: 'particleFade 0.8s ease-out',
                    boxShadow: `0 0 10px ${typeColors[p.type] || '#FFF'}`
                  }}
                />
              ))}
            </div>
            <div style={{
              background: 'rgba(0,0,0,0.85)',
              borderRadius: '16px',
              padding: '16px 24px',
              minWidth: '300px',
              border: '3px solid rgba(255,255,255,0.3)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '22px', textTransform: 'capitalize', color: 'white', fontWeight: '700' }}>
                {battleSlot1.name}
              </h3>
              <div style={{ marginBottom: '10px' }}>
                <div style={{
                  background: '#E0E0E0',
                  borderRadius: '10px',
                  height: '20px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    background: battleHP1 / battleSlot1.stats.find(s => s.stat.name === 'hp').base_stat > 0.5 ? '#4CAF50' :
                              battleHP1 / battleSlot1.stats.find(s => s.stat.name === 'hp').base_stat > 0.2 ? '#FF9800' : '#F44336',
                    width: `${(battleHP1 / battleSlot1.stats.find(s => s.stat.name === 'hp').base_stat) * 100}%`,
                    height: '100%',
                    transition: 'all 0.5s ease'
                  }} />
                </div>
              </div>
              <p style={{ margin: '0', fontSize: '16px', fontWeight: 'bold', color: 'white' }}>
                HP: {battleHP1} / {battleSlot1.stats.find(s => s.stat.name === 'hp').base_stat}
              </p>
              
              {/* Status Effect */}
              {status1 && (
                <div style={{
                  marginTop: '8px',
                  padding: '4px 8px',
                  background: status1 === 'burn' ? '#FF6B6B' : status1 === 'paralysis' ? '#FFD93D' : '#9D50BB',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'inline-block'
                }}>
                  {status1 === 'burn' ? '🔥 Queimado' : status1 === 'paralysis' ? '⚡ Paralisado' : '🟣 Envenenado'}
                </div>
              )}
              
              {/* Stat Boosts */}
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', fontSize: '12px', color: 'white' }}>
                {statBoosts1.attack !== 0 && (
                  <span style={{ color: statBoosts1.attack > 0 ? '#4CAF50' : '#F44336' }}>
                    ATK {statBoosts1.attack > 0 ? '↑' : '↓'}{Math.abs(statBoosts1.attack)}
                  </span>
                )}
                {statBoosts1.defense !== 0 && (
                  <span style={{ color: statBoosts1.defense > 0 ? '#4CAF50' : '#F44336' }}>
                    DEF {statBoosts1.defense > 0 ? '↑' : '↓'}{Math.abs(statBoosts1.defense)}
                  </span>
                )}
              </div>
              
              {/* Barra de Ultimate */}
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', color: '#FFD700' }}>
                  <span>⚡ ULTIMATE</span>
                  <span>{ultimateEnergy1}%</span>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: ultimateEnergy1 >= 100 ? 'linear-gradient(90deg, #FFD700, #FFA500)' : 'linear-gradient(90deg, #4A90E2, #357ABD)',
                    width: `${ultimateEnergy1}%`,
                    height: '100%',
                    transition: 'all 0.3s ease',
                    boxShadow: ultimateEnergy1 >= 100 ? '0 0 10px #FFD700' : 'none',
                    animation: ultimateEnergy1 >= 100 ? 'pulse 1s infinite' : 'none'
                  }} />
                </div>
              </div>
              
              {isAttacking === 1 && (
                <p style={{ margin: '10px 0 0 0', color: '#FF6B6B', fontWeight: 'bold', fontSize: '14px' }}>
                  ⚔️ Atacando...
                </p>
              )}
              {currentTurn === 1 && !isAttacking && !battleWinner && (
                <p style={{ margin: '10px 0 0 0', color: '#64B5F6', fontWeight: 'bold', fontSize: '14px' }}>
                  ⏳ Aguardando...
                </p>
              )}
            </div>
          </div>
          </div>

          {/* Painel de informações */}
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'rgba(0,0,0,0.92)',
            borderRadius: '16px',
            padding: '20px 24px',
            maxWidth: '400px',
            width: '350px',
            border: '3px solid rgba(255,255,255,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            zIndex: 10
          }}>
            <div style={{
              maxHeight: '120px',
              overflowY: 'auto',
              marginBottom: '15px',
              color: 'white',
              padding: '8px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px'
            }}>
              {battleLog.slice(-5).map((log, i) => (
                <p key={i} style={{
                  margin: '6px 0',
                  fontSize: '15px',
                  animation: 'fadeIn 0.5s',
                  lineHeight: '1.4',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}>
                  {log}
                </p>
              ))}
            </div>
            <button
              onClick={endBattle}
              style={{
                width: '100%',
                padding: '14px',
                background: battleWinner ? '#4CAF50' : '#F44336',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '12px',
                fontSize: '17px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {battleWinner ? '🏆 Terminar Batalha' : '❌ Desistir'}
            </button>
          </div>
        </div>
      )}

      {/* Fundo Gradiente Moderno */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        zIndex: -1
      }} />
      
      {/* Interface Principal */}
      <div className="app" style={{ minHeight: '100vh' }}>
        <div role="status" aria-live="polite" aria-atomic="true" style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}>
          {statusMessage}
        </div>

        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
          <header style={{ 
            textAlign: 'center', 
            marginBottom: '30px',
            padding: '40px',
            background: '#1a1a1a',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            border: '1px solid #2a2a2a'
          }}>
            <h1 style={{ 
              fontSize: '48px', 
              margin: '0 0 10px 0',
              color: '#ffffff',
              fontWeight: '700'
            }}>
               Pokédex Avançada
            </h1>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <p style={{ color: '#888', margin: 0 }}>
                {formatNumber(filteredAndSortedPokemon.length)} Pokémon disponíveis
              </p>
              {useFirebase && (
                <span style={{ 
                  padding: '4px 12px', 
                  background: '#28a745',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  🔥 Firebase Conectado
                </span>
              )}
              {loadingFavorites && (
                <span style={{ 
                  padding: '4px 12px', 
                  background: '#fd7e14',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  ⏳ Carregando...
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setBattleMode(!battleMode);
                if (battleMode) {
                  setBattleSlot1(null);
                  setBattleSlot2(null);
                  setBattleActive(false);
                }
              }}
              style={{
                padding: '12px 28px',
                background: battleMode ? '#dc3545' : '#28a745',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                marginRight: '15px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              {battleMode ? '❌ Sair do Modo Batalha' : '⚔️ Modo Batalha'}
            </button>
            
            <button
              onClick={() => {
                if (quizMode) {
                  exitQuizMode();
                } else {
                  startQuizMode();
                  setBattleMode(false);
                  setBattleSlot1(null);
                  setBattleSlot2(null);
                  setBattleActive(false);
                }
              }}
              style={{
                padding: '12px 28px',
                background: quizMode ? '#dc3545' : '#fd7e14',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              {quizMode ? '❌ Sair do Quiz' : '❓ Quem é este Pokémon?'}
            </button>
          </header>

          {/* Modo Quiz */}
          {quizMode && quizPokemon && (
            <div style={{
              background: '#1a1a1a',
              borderRadius: '16px',
              padding: '40px',
              marginBottom: '30px',
              color: 'white',
              textAlign: 'center',
              border: '1px solid #2a2a2a'
            }}>
              <h2 style={{ fontSize: '48px', marginBottom: '20px', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                🔍 Quem é este Pokémon?
              </h2>
              
              {/* Recordes */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '40px', 
                marginBottom: '20px',
                padding: '15px',
                background: 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,140,0,0.15) 100%)',
                borderRadius: '12px',
                border: '2px solid rgba(255,215,0,0.3)'
              }}>
                <div style={{ fontSize: '22px', fontWeight: 'bold' }}>
                  <span style={{ color: '#ffd700' }}>🏆 Recorde:</span> <span style={{ color: '#fff' }}>{highScore}</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 'bold' }}>
                  <span style={{ color: '#ff4500' }}>🔥 Melhor Sequência:</span> <span style={{ color: '#fff' }}>{bestStreak}</span>
                </div>
              </div>
              
              {/* Pontuação Atual */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '30px', fontSize: '20px' }}>
                <div>
                  <strong>🎯 Pontuação:</strong> <span style={{ color: quizScore > highScore ? '#4CAF50' : '#fff' }}>{quizScore}</span>
                </div>
                <div>
                  <strong>🔥 Sequência:</strong> <span style={{ color: quizStreak > bestStreak ? '#ff4500' : '#fff' }}>{quizStreak}</span>
                </div>
                <div>
                  <strong>📊 Total:</strong> {quizTotal}
                </div>
                <div>
                  <strong>✅ Acertos:</strong> {quizTotal > 0 ? `${Math.round((quizScore / (quizTotal * 2)) * 100)}%` : '0%'}
                </div>
              </div>
              
              {/* Silhueta do Pokémon */}
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '20px',
                padding: '40px',
                marginBottom: '30px',
                minHeight: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <img
                  src={quizPokemon.sprites.other['official-artwork'].front_default}
                  alt="Silhueta"
                  style={{
                    width: '280px',
                    height: '280px',
                    objectFit: 'contain',
                    filter: quizRevealed ? 'none' : 'brightness(0)',
                    transition: 'filter 0.5s ease'
                  }}
                />
                
                {quizRevealed && (
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: quizAnswer.toLowerCase().trim() === quizPokemon.name.toLowerCase() ? '#4CAF50' : '#F44336',
                    padding: '10px 20px',
                    borderRadius: '12px',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    animation: 'bounceIn 0.5s'
                  }}>
                    {quizAnswer.toLowerCase().trim() === quizPokemon.name.toLowerCase() ? '✅ CORRETO!' : '❌ ERRADO!'}
                  </div>
                )}
              </div>
              
              {/* Dica */}
              {showHint && !quizRevealed && (
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  padding: '15px',
                  marginBottom: '20px',
                  animation: 'fadeIn 0.3s'
                }}>
                  <p style={{ margin: '5px 0', fontSize: '16px' }}>
                    <strong>💡 Dica:</strong> Tipo(s): {quizPokemon.types.map(t => capitalize(t.type.name)).join(', ')}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '16px' }}>
                    <strong>🔢</strong> Número: #{String(quizPokemon.id).padStart(3, '0')}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '14px', opacity: 0.8 }}>
                    (Vale apenas 1 ponto)
                  </p>
                </div>
              )}
              
              {quizRevealed && (
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ fontSize: '32px', textTransform: 'capitalize', marginBottom: '10px' }}>
                    {quizPokemon.name}
                  </h3>
                  <p style={{ fontSize: '18px', opacity: 0.9 }}>
                    #{String(quizPokemon.id).padStart(3, '0')} | Tipos: {quizPokemon.types.map(t => capitalize(t.type.name)).join(', ')}
                  </p>
                </div>
              )}
              
              {/* Input e Botões */}
              {!quizRevealed ? (
                <div>
                  <input
                    type="text"
                    value={quizAnswer}
                    onChange={(e) => {
                      setQuizAnswer(e.target.value);
                      e.target.setCustomValidity('');
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        if (e.target.reportValidity()) {
                          checkQuizAnswer();
                        }
                      }
                    }}
                    onInvalid={(e) => {
                      e.target.setCustomValidity('Digite o nome do Pokémon (mínimo 3 caracteres)');
                    }}
                    placeholder="Digite o nome do Pokémon..."
                    required
                    minLength="3"
                    maxLength="30"
                    pattern="[a-zA-Z-]+"
                    title="Digite o nome do Pokémon (apenas letras e hífens)"
                    aria-label="Digite o nome do Pokémon"
                    style={{
                      width: '400px',
                      maxWidth: '90%',
                      padding: '15px',
                      fontSize: '18px',
                      borderRadius: '12px',
                      border: 'none',
                      marginBottom: '20px',
                      textAlign: 'center'
                    }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={checkQuizAnswer}
                      disabled={!quizAnswer.trim()}
                      style={{
                        padding: '12px 30px',
                        background: quizAnswer.trim() ? '#4CAF50' : '#999',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: quizAnswer.trim() ? 'pointer' : 'not-allowed'
                      }}
                    >
                      ✅ Confirmar
                    </button>
                    
                    <button
                      onClick={() => { setShowHint(true); setUsedHint(true); }}
                      disabled={showHint}
                      style={{
                        padding: '12px 30px',
                        background: showHint ? '#999' : '#FFA500',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: showHint ? 'not-allowed' : 'pointer'
                      }}
                    >
                      💡 Dica
                    </button>
                    
                    <button
                      onClick={skipQuizPokemon}
                      style={{
                        padding: '12px 30px',
                        background: '#F44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      ⏭️ Pular
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={loadNewQuizPokemon}
                  style={{
                    padding: '15px 40px',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}
                >
                  ➡️ Próximo Pokémon
                </button>
              )}
            </div>
          )}

          {/* Arena de Batalha */}
          {battleMode && !quizMode && (
            <div style={{
              position: 'relative',
              background: 'linear-gradient(to bottom, #87CEEB 0%, #87CEEB 50%, #90EE90 50%, #228B22 100%)',
              borderRadius: '16px',
              padding: '30px',
              marginBottom: '30px',
              color: 'white',
              border: '1px solid #2a2a2a',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
              {/* Sol */}
              <div style={{
                position: 'absolute',
                top: '30px',
                right: '50px',
                width: '80px',
                height: '80px',
                background: 'radial-gradient(circle, #FFD700 0%, #FFA500 100%)',
                borderRadius: '50%',
                boxShadow: '0 0 40px rgba(255,215,0,0.6)',
                zIndex: 1
              }} />
              
              {/* Nuvens */}
              <div style={{
                position: 'absolute',
                top: '50px',
                left: '100px',
                width: '120px',
                height: '40px',
                background: 'rgba(255,255,255,0.8)',
                borderRadius: '50px',
                boxShadow: '0 0 20px rgba(255,255,255,0.5)',
                zIndex: 1
              }} />
              <div style={{
                position: 'absolute',
                top: '80px',
                right: '200px',
                width: '100px',
                height: '35px',
                background: 'rgba(255,255,255,0.7)',
                borderRadius: '50px',
                zIndex: 1
              }} />
              
              {/* Árvores no fundo */}
              <div style={{
                position: 'absolute',
                bottom: '30px',
                left: '30px',
                zIndex: 0
              }}>
                <div style={{ 
                  width: '0',
                  height: '0',
                  borderLeft: '30px solid transparent',
                  borderRight: '30px solid transparent',
                  borderBottom: '50px solid #228B22',
                  margin: '0 auto'
                }} />
                <div style={{ width: '15px', height: '40px', background: '#654321', margin: '0 auto' }} />
              </div>
              
              <div style={{
                position: 'absolute',
                bottom: '30px',
                right: '30px',
                zIndex: 0
              }}>
                <div style={{ 
                  width: '0',
                  height: '0',
                  borderLeft: '30px solid transparent',
                  borderRight: '30px solid transparent',
                  borderBottom: '50px solid #228B22',
                  margin: '0 auto'
                }} />
                <div style={{ width: '15px', height: '40px', background: '#654321', margin: '0 auto' }} />
              </div>
              
              {/* Grama decorativa */}
              <div style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                height: '30px',
                background: 'repeating-linear-gradient(90deg, #228B22 0px, #228B22 10px, #32CD32 10px, #32CD32 20px)',
                opacity: 0.3,
                zIndex: 1
              }} />
              
              <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '32px', position: 'relative', zIndex: 2, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                ⚔️ Arena de Batalha ⚔️
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: '30px',
                alignItems: 'center',
                marginBottom: '20px',
                position: 'relative',
                zIndex: 2
              }}>
                {/* Slot 1 */}
                <div style={{
                  background: 'rgba(139,69,19,0.3)',
                  backdropFilter: 'blur(5px)',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                  minHeight: '300px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  border: '2px solid rgba(101,67,33,0.5)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                }}>
                  {battleSlot1 ? (
                    <>
                      <button
                        onClick={() => setBattleSlot1(null)}
                        style={{
                          position: 'relative',
                          alignSelf: 'flex-end',
                          background: 'rgba(255,255,255,0.3)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '30px',
                          height: '30px',
                          cursor: 'pointer',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      >
                        ✕
                      </button>
                      <img
                        src={battleSlot1.sprites.other['official-artwork'].front_default}
                        alt={battleSlot1.name}
                        style={{ width: '150px', height: '150px', objectFit: 'contain', margin: '0 auto 10px' }}
                      />
                      <h3 style={{ fontSize: '24px', textTransform: 'capitalize', margin: '0 0 10px 0' }}>
                        {battleSlot1.name}
                      </h3>
                      <p style={{ fontSize: '14px', margin: '0' }}>
                        #{String(battleSlot1.id).padStart(3, '0')}
                      </p>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '10px' }}>
                        {battleSlot1.types.map(t => (
                          <span key={t.type.name} style={{
                            background: typeColors[t.type.name],
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            textTransform: 'capitalize'
                          }}>
                            {t.type.name}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize: '18px', opacity: 0.7 }}>Selecione o Pokémon 1</p>
                  )}
                </div>

                <div style={{ fontSize: '48px', fontWeight: 'bold' }}>VS</div>

                {/* Slot 2 */}
                <div style={{
                  background: 'rgba(139,69,19,0.3)',
                  backdropFilter: 'blur(5px)',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                  minHeight: '300px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  border: '2px solid rgba(101,67,33,0.5)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                }}>
                  {battleSlot2 ? (
                    <>
                      <button
                        onClick={() => setBattleSlot2(null)}
                        style={{
                          position: 'relative',
                          alignSelf: 'flex-end',
                          background: 'rgba(255,255,255,0.3)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '30px',
                          height: '30px',
                          cursor: 'pointer',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      >
                        ✕
                      </button>
                      <img
                        src={battleSlot2.sprites.other['official-artwork'].front_default}
                        alt={battleSlot2.name}
                        style={{ width: '150px', height: '150px', objectFit: 'contain', margin: '0 auto 10px' }}
                      />
                      <h3 style={{ fontSize: '24px', textTransform: 'capitalize', margin: '0 0 10px 0' }}>
                        {battleSlot2.name}
                      </h3>
                      <p style={{ fontSize: '14px', margin: '0' }}>
                        #{String(battleSlot2.id).padStart(3, '0')}
                      </p>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '10px' }}>
                        {battleSlot2.types.map(t => (
                          <span key={t.type.name} style={{
                            background: typeColors[t.type.name],
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            textTransform: 'capitalize'
                          }}>
                            {t.type.name}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize: '18px', opacity: 0.7 }}>Selecione o Pokémon 2</p>
                  )}
                </div>
              </div>

              {battleSlot1 && battleSlot2 && !battleActive && (
                <button
                  onClick={startBattle}
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  🎮 INICIAR BATALHA
                </button>
              )}
            </div>
          )}

          {/* Resto do código existente (pesquisa, grid, etc.) continua igual... */}
          {!quizMode && (
          <div style={{
            background: '#1a1a1a',
            borderRadius: '16px',
            padding: '30px',
            marginBottom: '30px',
            border: '1px solid #2a2a2a'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="search-input" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#ccc' }}>
                🔍 Pesquisar Pokémon (debounce 400ms, Enter para imediato)
              </label>
              <input
                id="search-input"
                ref={searchInputRef}
                type="text"
                placeholder="Nome ou número..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  e.target.setCustomValidity('');
                }}
                onKeyPress={handleSearchKeyPress}
                onInvalid={(e) => {
                  e.target.setCustomValidity('Digite pelo menos 2 caracteres para pesquisar');
                }}
                pattern=".{2,}"
                minLength="2"
                maxLength="50"
                aria-label="Pesquisar Pokémon por nome ou número"
                title="Digite pelo menos 2 caracteres"
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  fontSize: '16px',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  background: '#0f0f0f',
                  color: '#fff'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#555';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#333';
                }}
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <label htmlFor="sort-field" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#ccc', fontSize: '14px' }}>
                  📊 Ordenar por
                </label>
                <select
                  id="sort-field"
                  value={sortConfig.field}
                  onChange={(e) => handleSort(e.target.value)}
                  aria-label="Escolher campo de ordenação"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: '#0f0f0f',
                    color: '#fff'
                  }}
                >
                  <option value="id">Número (ID)</option>
                  <option value="name">Nome</option>
                </select>
              </div>

              <div>
                <label htmlFor="sort-order" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#ccc', fontSize: '14px' }}>
                  🔄 Ordem
                </label>
                <select
                  id="sort-order"
                  value={sortConfig.order}
                  onChange={(e) => setSortConfig(prev => ({ ...prev, order: e.target.value }))}
                  aria-label="Escolher ordem de ordenação"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: '#0f0f0f',
                    color: '#fff'
                  }}
                >
                  <option value="asc">Crescente (A-Z / 1-9)</option>
                  <option value="desc">Decrescente (Z-A / 9-1)</option>
                </select>
              </div>

              <div>
                <label htmlFor="page-size" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#ccc', fontSize: '14px' }}>
                  📄 Itens por página
                </label>
                <select
                  id="page-size"
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  aria-label="Escolher número de itens por página"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: '#0f0f0f',
                    color: '#fff'
                  }}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
          </div>
          )}

          {!quizMode && loading && (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              background: '#1a1a1a',
              borderRadius: '12px',
              border: '1px solid #2a2a2a'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                border: '6px solid #f3f3f3',
                borderTop: '6px solid #F08030',
                borderRadius: '50%',
                margin: '0 auto 20px',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p style={{ fontSize: '18px', color: '#999' }}>A carregar Pokémon...</p>
            </div>
          )}

          {!quizMode && error && (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              background: '#1a1a1a',
              borderRadius: '12px',
              border: '1px solid #2a2a2a'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
              <h2 style={{ color: '#dc3545', marginBottom: '10px' }}>Erro ao carregar</h2>
              <p style={{ color: '#999', marginBottom: '20px' }}>{error.message}</p>
              <button
                onClick={handleRetry}
                aria-label="Tentar carregar novamente"
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  background: '#F08030',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                🔄 Tentar de novo
              </button>
            </div>
          )}

          {!quizMode && !loading && !error && filteredAndSortedPokemon.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              background: '#1a1a1a',
              borderRadius: '12px',
              border: '1px solid #2a2a2a'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔍</div>
              <h2 style={{ color: '#ccc', marginBottom: '10px' }}>Nenhum Pokémon encontrado</h2>
              <p style={{ color: '#999' }}>Tenta ajustar os filtros ou a pesquisa</p>
            </div>
          )}

          {!quizMode && !loading && !error && paginatedPokemon.length > 0 && (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
              }}>
                {paginatedPokemon.map((pokemon) => {
                  const isFav = Array.isArray(favorites) 
                    ? favorites.some(f => f.id === pokemon.id)
                    : favorites[pokemon.id] !== undefined;
                  return (
                    <div
                      key={pokemon.id}
                      onClick={() => {
                        if (battleMode) {
                          // Modo batalha: selecionar para slot
                          if (!battleSlot1) selectPokemonForBattle(pokemon, 1);
                          else if (!battleSlot2) selectPokemonForBattle(pokemon, 2);
                        } else {
                          // Modo normal: abrir detalhes
                          fetchPokemonDetails(pokemon);
                        }
                      }}
                      style={{
                        background: '#1a1a1a',
                        borderRadius: '12px',
                        padding: '20px',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        position: 'relative',
                        border: battleMode && (battleSlot1?.id === pokemon.id || battleSlot2?.id === pokemon.id) ? '2px solid #28a745' : '1px solid #2a2a2a'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#252525';
                        e.currentTarget.style.borderColor = '#3a3a3a';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#1a1a1a';
                        e.currentTarget.style.borderColor = battleMode && (battleSlot1?.id === pokemon.id || battleSlot2?.id === pokemon.id) ? '#28a745' : '#2a2a2a';
                      }}
                    >
                      {!battleMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(pokemon);
                          }}
                          aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'transparent',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            transition: 'transform 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        >
                          {isFav ? '❤️' : '🤍'}
                        </button>
                      )}

                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
                        alt={`${formatString(capitalize(pokemon.name))} sprite`}
                        style={{
                          width: '120px',
                          height: '120px',
                          objectFit: 'contain',
                          marginBottom: '12px'
                        }}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/120?text=?';
                          e.target.alt = 'Imagem não disponível';
                        }}
                      />
                      <p style={{
                        fontSize: '14px',
                        color: '#999',
                        marginBottom: '4px'
                      }}>
                        #{formatNumber(pokemon.id).padStart(3, '0')}
                      </p>
                      <h3 style={{
                        fontSize: '18px',
                        color: '#333',
                        textTransform: 'capitalize',
                        margin: 0
                      }}>
                        {formatString(pokemon.name)}
                      </h3>
                    </div>
                  );
                })}
              </div>

              {/* Paginação */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
                padding: '20px',
                background: '#1a1a1a',
                borderRadius: '12px',
                border: '1px solid #2a2a2a'
              }}>
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  aria-label="Primeira página"
                  style={{
                    padding: '10px 18px',
                    background: currentPage === 1 ? '#2a2a2a' : '#0d6efd',
                    color: currentPage === 1 ? '#666' : 'white',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: '600'
                  }}
                >
                  ⏮ Primeira
                </button>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                  style={{
                    padding: '10px 18px',
                    background: currentPage === 1 ? '#2a2a2a' : '#0d6efd',
                    color: currentPage === 1 ? '#666' : 'white',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: '600'
                  }}
                >
                  ◀ Anterior
                </button>

                <span style={{ padding: '0 20px', fontWeight: '600', color: '#ccc' }}>
                  Página {formatNumber(currentPage)} de {formatNumber(totalPages)}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Próxima página"
                  style={{
                    padding: '10px 18px',
                    background: currentPage === totalPages ? '#2a2a2a' : '#0d6efd',
                    color: currentPage === totalPages ? '#666' : 'white',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Próxima ▶
                </button>

                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  aria-label="Última página"
                  style={{
                    padding: '10px 18px',
                    background: currentPage === totalPages ? '#2a2a2a' : '#0d6efd',
                    color: currentPage === totalPages ? '#666' : 'white',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Última ⏭
                </button>
              </div>

              {/* Favoritos */}
              {(Array.isArray(favorites) ? favorites.length : Object.keys(favorites).length) > 0 && (
                <div style={{
                  marginTop: '40px',
                  padding: '30px',
                  background: '#1a1a1a',
                  borderRadius: '12px',
                  border: '1px solid #2a2a2a'
                }}>
                  <h2 style={{ marginBottom: '24px', color: '#ffc107', fontSize: '24px', fontWeight: '600' }}>
                    ❤️ Favoritos ({formatNumber(Array.isArray(favorites) ? favorites.length : Object.keys(favorites).length)})
                  </h2>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '20px'
                  }}>
                    {(Array.isArray(favorites) ? favorites : Object.values(favorites)).map(fav => {
                      const isFav = true; // Já está na lista de favoritos
                      return (
                        <div
                          key={fav.id}
                          onClick={() => fetchPokemonDetails(fav)}
                          style={{
                            background: '#252525',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            position: 'relative',
                            border: '1px solid #ffc107'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#2a2a2a';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#252525';
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(fav);
                            }}
                            aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                            style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              background: 'transparent',
                              border: 'none',
                              fontSize: '24px',
                              cursor: 'pointer',
                              transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                          >
                            {isFav ? '❤️' : '🤍'}
                          </button>

                          <img
                            src={
                              fav.sprite || 
                              `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${fav.id}.png`
                            }
                            alt={`${formatString(capitalize(fav.name))} sprite`}
                            style={{
                              width: '120px',
                              height: '120px',
                              objectFit: 'contain',
                              marginBottom: '12px'
                            }}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/120?text=?';
                              e.target.alt = 'Imagem não disponível';
                            }}
                          />
                          <p style={{
                            fontSize: '14px',
                            color: '#999',
                            marginBottom: '4px'
                          }}>
                            #{formatNumber(fav.id).padStart(3, '0')}
                          </p>
                          <h3 style={{
                            fontSize: '18px',
                            color: '#333',
                            textTransform: 'capitalize',
                            margin: 0
                          }}>
                            {formatString(fav.name)}
                          </h3>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Modal de Detalhes do Pokémon */}
          {selectedPokemon && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px',
                overflowY: 'auto'
              }}
              onClick={closeDetails}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: pokemonDetails ? typeColors[pokemonDetails.types[0].type.name] || '#78C850' : '#78C850',
                  borderRadius: '30px',
                  maxWidth: '900px',
                  width: '100%',
                  padding: '40px',
                  position: 'relative',
                  maxHeight: '90vh',
                  overflowY: 'auto'
                }}
              >
                {/* Botão Fechar */}
                <button
                  onClick={closeDetails}
                  aria-label="Fechar"
                  style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'rgba(255,255,255,0.3)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: 'white'
                  }}
                >
                  ✕
                </button>

                {loadingDetails ? (
                  <div style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      border: '6px solid rgba(255,255,255,0.3)',
                      borderTop: '6px solid white',
                      borderRadius: '50%',
                      margin: '0 auto',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ color: 'white', marginTop: '20px' }}>A carregar...</p>
                  </div>
                ) : pokemonDetails ? (
                  <>
                    {/* Número gigante no fundo */}
                    <div style={{
                      position: 'absolute',
                      top: '20px',
                      right: '80px',
                      fontSize: '180px',
                      fontWeight: '900',
                      color: 'rgba(255,255,255,0.1)',
                      userSelect: 'none'
                    }}>
                      #{String(pokemonDetails.id).padStart(3, '0')}
                    </div>

                    {/* Cabeçalho */}
                    <div style={{ position: 'relative', zIndex: 1, marginBottom: '30px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '20px'
                      }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <div style={{
                            background: 'rgba(255,255,255,0.3)',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            display: 'inline-block',
                            color: 'white',
                            fontWeight: '600',
                            marginBottom: '10px'
                          }}>
                            {pokemonDetails.types.map(t => capitalize(t.type.name)).join(' / ')}
                          </div>
                          <h2 style={{
                            color: 'white',
                            fontSize: '48px',
                            margin: '0',
                            textTransform: 'capitalize'
                          }}>
                            {pokemonDetails.name}
                          </h2>
                          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '18px', marginTop: '10px' }}>
                            Altura: {(pokemonDetails.height / 10).toLocaleString('pt-PT')} m | 
                            Peso: {(pokemonDetails.weight / 10).toLocaleString('pt-PT')} kg
                          </p>
                        </div>

                        <img
                          src={getFormSprite()}
                          alt={`${pokemonDetails.name} sprite`}
                          style={{
                            width: '280px',
                            height: '280px',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))'
                          }}
                        />
                      </div>
                    </div>

                    {/* Variações */}
                    <div style={{ marginBottom: '20px' }}>
                      <h3 style={{ color: 'white', marginBottom: '12px' }}>🎨 Variações</h3>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setCurrentForm('default')}
                          style={{
                            padding: '10px 20px',
                            borderRadius: '12px',
                            border: 'none',
                            background: currentForm === 'default' ? 'white' : 'rgba(255,255,255,0.3)',
                            color: currentForm === 'default' ? typeColors[pokemonDetails.types[0].type.name] : 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          Normal
                        </button>
                        <button
                          onClick={() => setCurrentForm('shiny')}
                          style={{
                            padding: '10px 20px',
                            borderRadius: '12px',
                            border: 'none',
                            background: currentForm === 'shiny' ? 'white' : 'rgba(255,255,255,0.3)',
                            color: currentForm === 'shiny' ? typeColors[pokemonDetails.types[0].type.name] : 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          ✨ Shiny
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{
                      background: 'rgba(255,255,255,0.95)',
                      borderRadius: '20px',
                      padding: '30px'
                    }}>
                      <h3 style={{ marginBottom: '20px', color: '#333' }}>📊 Stats Base</h3>
                      {pokemonDetails.stats.map((stat, i) => {
                        const maxStat = 255;
                        const percentage = (stat.base_stat / maxStat) * 100;
                        const statNames = {
                          'hp': 'HP',
                          'attack': 'Ataque',
                          'defense': 'Defesa',
                          'special-attack': 'Ataque Especial',
                          'special-defense': 'Defesa Especial',
                          'speed': 'Velocidade'
                        };
                        return (
                          <div key={i} style={{ marginBottom: '16px' }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: '6px'
                            }}>
                              <span style={{ fontWeight: '600' }}>
                                {statNames[stat.stat.name] || stat.stat.name}
                              </span>
                              <span style={{ fontWeight: '700', color: typeColors[pokemonDetails.types[0].type.name] }}>
                                {formatNumber(stat.base_stat)}
                              </span>
                            </div>
                            <div style={{
                              background: '#E0E0E0',
                              borderRadius: '10px',
                              height: '12px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                background: typeColors[pokemonDetails.types[0].type.name],
                                width: `${percentage}%`,
                                height: '100%',
                                borderRadius: '10px',
                                transition: 'width 0.5s ease'
                              }} />
                            </div>
                          </div>
                        );
                      })}
                      <div style={{
                        marginTop: '20px',
                        paddingTop: '20px',
                        borderTop: '2px solid #E0E0E0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: '700'
                      }}>
                        <span>Total:</span>
                        <span style={{ color: typeColors[pokemonDetails.types[0].type.name] }}>
                          {formatNumber(pokemonDetails.stats.reduce((sum, s) => sum + s.base_stat, 0))}
                        </span>
                      </div>
                    </div>

                    {/* Habilidades */}
                    <div style={{
                      background: 'rgba(255,255,255,0.95)',
                      borderRadius: '20px',
                      padding: '20px',
                      marginTop: '20px'
                    }}>
                      <h3 style={{ marginBottom: '12px', color: '#333' }}>⚔️ Habilidades</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {pokemonDetails.abilities.map((ability, i) => {
                          const abilityName = ability.ability.name;
                          const isExpanded = expandedAbility === abilityName;
                          const description = abilityDescriptions[abilityName];
                          
                          return (
                            <div
                              key={i}
                              style={{
                                background: ability.is_hidden ? '#FFE0B2' : '#E3F2FD',
                                borderRadius: '12px',
                                padding: '12px',
                                cursor: description ? 'pointer' : 'default',
                                transition: 'all 0.3s ease',
                                border: isExpanded ? `2px solid ${typeColors[pokemonDetails.types[0].type.name]}` : '2px solid transparent'
                              }}
                              onClick={() => description && setExpandedAbility(isExpanded ? null : abilityName)}
                            >
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <div style={{
                                  fontSize: '16px',
                                  fontWeight: '600',
                                  textTransform: 'capitalize',
                                  color: '#333'
                                }}>
                                  {abilityName.replace('-', ' ')}
                                  {ability.is_hidden && <span style={{ 
                                    marginLeft: '8px',
                                    fontSize: '12px',
                                    padding: '2px 8px',
                                    background: '#FF9800',
                                    color: 'white',
                                    borderRadius: '8px',
                                    fontWeight: '600'
                                  }}>Oculta</span>}
                                </div>
                                {description && (
                                  <span style={{ fontSize: '20px', transition: 'transform 0.3s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                    ▼
                                  </span>
                                )}
                              </div>
                              
                              {isExpanded && description && (
                                <div style={{
                                  marginTop: '12px',
                                  paddingTop: '12px',
                                  borderTop: '1px solid rgba(0,0,0,0.1)',
                                  fontSize: '14px',
                                  lineHeight: '1.6',
                                  color: '#555'
                                }}>
                                  <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>
                                    📝 {description.shortEffect}
                                  </p>
                                  {description.effect !== description.shortEffect && (
                                    <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>
                                      ℹ️ {description.effect}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Variantes */}
                    {pokemonVariants.length > 0 && (
                      <div style={{
                        background: 'rgba(255,255,255,0.95)',
                        borderRadius: '20px',
                        padding: '20px',
                        marginTop: '20px'
                      }}>
                        <h3 style={{ marginBottom: '16px', color: '#333' }}>🔄 Variantes ({pokemonVariants.length})</h3>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                          gap: '12px'
                        }}>
                          {pokemonVariants.map((variant, i) => {
                            // Usar o ID numérico real da variante - converter para string para comparação
                            const variantIdStr = String(variant.id);
                            const isVariantFavorite = Array.isArray(favorites) 
                              ? favorites.some(f => String(f.id) === variantIdStr)
                              : (favorites[variant.id] !== undefined || favorites[variantIdStr] !== undefined);
                            
                            return (
                            <div
                              key={i}
                              style={{
                                background: 'white',
                                borderRadius: '12px',
                                padding: '12px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                border: '2px solid #E3F2FD',
                                transition: 'all 0.2s',
                                position: 'relative'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                e.currentTarget.style.borderColor = typeColors[pokemonDetails.types[0].type.name];
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.borderColor = '#E3F2FD';
                              }}
                            >
                              {/* Botão de Favorito */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite({
                                    id: variant.id,
                                    name: variant.name,
                                    sprite: variant.sprite
                                  });
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  background: isVariantFavorite ? '#FF6B9D' : 'white',
                                  border: '2px solid #FF6B9D',
                                  borderRadius: '50%',
                                  width: '28px',
                                  height: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  fontSize: '14px',
                                  zIndex: 10
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'scale(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                {isVariantFavorite ? '❤️' : '🤍'}
                              </button>
                              
                              <div
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${variant.id}`);
                                    if (response.ok) {
                                      const data = await response.json();
                                      setPokemonDetails(data);
                                      setCurrentForm('default');
                                    }
                                  } catch (err) {
                                    console.error('Erro ao carregar variante:', err);
                                  }
                                }}
                              >
                              <img
                                src={variant.sprite || 'https://via.placeholder.com/80?text=?'}
                                alt={variant.name}
                                style={{
                                  width: '80px',
                                  height: '80px',
                                  objectFit: 'contain',
                                  marginBottom: '8px'
                                }}
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/80?text=?';
                                }}
                              />
                              <p style={{
                                fontSize: '11px',
                                color: '#999',
                                marginBottom: '4px'
                              }}>
                                #{String(variant.id).padStart(3, '0')}
                              </p>
                              <h4 style={{
                                fontSize: '13px',
                                color: '#333',
                                textTransform: 'capitalize',
                                margin: 0,
                                wordBreak: 'break-word'
                              }}>
                                {variant.name.replace('-', ' ')}
                              </h4>
                              </div>
                            </div>
                          );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes particleFade {
            0% { 
              opacity: 1; 
              transform: scale(1) translateY(0); 
            }
            100% { 
              opacity: 0; 
              transform: scale(0) translateY(-30px); 
            }
          }
          @keyframes faint {
            0% { 
              opacity: 1; 
              transform: translateY(0) rotate(0deg); 
            }
            100% { 
              opacity: 0; 
              transform: translateY(100px) rotate(90deg); 
            }
          }
          @keyframes ultimateFlash {
            0%, 100% { 
              opacity: 0; 
              transform: translate(-50%, -50%) scale(0.5); 
            }
            50% { 
              opacity: 1; 
              transform: translate(-50%, -50%) scale(2); 
            }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          @keyframes battleIntro {
            0% { 
              transform: scale(0.5); 
              opacity: 0; 
            }
            50% { 
              transform: scale(1.2); 
            }
            100% { 
              transform: scale(1); 
              opacity: 1; 
            }
          }
          @keyframes countdown {
            0% { 
              transform: scale(0); 
              opacity: 0; 
            }
            60% { 
              transform: scale(1.3); 
              opacity: 1; 
            }
            100% { 
              transform: scale(1); 
              opacity: 1; 
            }
          }
          @keyframes rain {
            0% { transform: translateY(-100px); }
            100% { transform: translateY(100vh); }
          }
          @keyframes snow {
            0% { transform: translateY(-100px); }
            100% { transform: translateY(100vh); }
          }
        `}</style>
      </div>
    </>
  );
}

export default App;