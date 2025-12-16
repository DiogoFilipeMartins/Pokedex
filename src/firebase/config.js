import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDWxmhp4z6HxN_YxoUtb87-q6CY4hREz7g",
  authDomain: "pokedex-avancada.firebaseapp.com",
  projectId: "pokedex-avancada",
  storageBucket: "pokedex-avancada.firebasestorage.app",
  messagingSenderId: "674099188174",
  appId: "1:674099188174:web:100ad9059d3d5ae9fc5b9f",
  measurementId: "G-S8M1RG8PJ9"
};


// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);

// Log para confirmar inicialização (remover em produção)
console.log('🔥 Firebase inicializado com sucesso!');
