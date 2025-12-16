# 🔥 Guia de Configuração Firebase - Pokédex

## ✅ Checklist Rápida

- [ ] Passo 1: Criar projeto no Firebase Console
- [ ] Passo 2: Configurar Firestore Database
- [ ] Passo 3: Configurar Regras de Segurança
- [ ] Passo 4: Obter credenciais do projeto
- [ ] Passo 5: Colar credenciais em `src/firebase/config.js`
- [ ] Passo 6: Testar conexão

---

## 📝 Passo 1: Criar Projeto Firebase

1. Acede a [Firebase Console](https://console.firebase.google.com/)
2. Faz login com conta Google
3. Clica em **"Adicionar projeto"**
4. **Nome**: `pokedex-react` (ou o que quiseres)
5. **Google Analytics**: Desabilita (não é necessário)
6. Clica em **"Criar projeto"**
7. Aguarda a criação (~30 segundos)

---

## 📊 Passo 2: Configurar Firestore Database

1. No menu lateral, clica em **"Firestore Database"**
2. Clica em **"Criar banco de dados"**
3. Configurações:
   - **Modo**: Seleciona **"Produção"** (com regras de segurança)
   - **Localização**: Seleciona `europe-west1` (Europa) ou a mais próxima
4. Clica em **"Ativar"**
5. Aguarda a configuração (~20 segundos)

---

## 🔒 Passo 3: Configurar Regras de Segurança

1. Ainda em **Firestore Database**, vai à aba **"Regras"** (Rules)
2. **APAGA TUDO** que está lá
3. **COLA** este código:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ========================================
    // FAVORITOS - Leitura pública, escrita validada
    // ========================================
    match /favoritos/{docId} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasAll(['id', 'name', 'createdAt']) 
                    && request.resource.data.id is int
                    && request.resource.data.id >= 1
                    && request.resource.data.id <= 1025
                    && request.resource.data.name is string;
      allow delete: if true;
    }
    
    // ========================================
    // BATALHAS - Leitura pública, escrita validada
    // ========================================
    match /batalhas/{docId} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasAll(['pokemon1', 'pokemon2', 'winner', 'timestamp'])
                    && request.resource.data.winner in [1, 2];
    }
    
    // ========================================
    // QUIZ SCORES - Leitura pública, escrita validada
    // ========================================
    match /quizScores/{docId} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasAll(['score', 'timestamp'])
                    && request.resource.data.score >= 0
                    && request.resource.data.score is int;
    }
  }
}
```

4. Clica em **"Publicar"** (botão azul no topo)

---

## 🔑 Passo 4: Obter Credenciais

1. Clica no ícone de **engrenagem ⚙️** (topo esquerdo) > **"Configurações do projeto"**
2. Scroll até a secção **"Seus aplicativos"**
3. Clica no ícone **`</>`** (Web app)
4. Preenche:
   - **Nome do app**: `pokedex-react-web`
   - **NÃO marques** "Configurar Firebase Hosting"
5. Clica em **"Registrar app"**
6. Vai aparecer um código JavaScript assim:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "pokedex-react-xxxxx.firebaseapp.com",
  projectId: "pokedex-react-xxxxx",
  storageBucket: "pokedex-react-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};
```

7. **COPIA TODO O OBJETO `firebaseConfig`** 📋

---

## 💾 Passo 5: Colar Credenciais no Projeto

1. Abre o arquivo `src/firebase/config.js` no teu projeto
2. Substitui as linhas que dizem `"COLA_AQUI..."` pelas **TUAS credenciais**:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",  // ← Cola aqui a TUA apiKey
  authDomain: "pokedex-react-xxxxx.firebaseapp.com",  // ← Cola aqui
  projectId: "pokedex-react-xxxxx",  // ← Cola aqui
  storageBucket: "pokedex-react-xxxxx.appspot.com",  // ← Cola aqui
  messagingSenderId: "123456789",  // ← Cola aqui
  appId: "1:123456789:web:abcdef..."  // ← Cola aqui
};
```

3. **Guarda o arquivo** (Ctrl+S)

---

## 🧪 Passo 6: Testar Conexão

1. **Inicia o projeto**:
   ```bash
   npm run dev
   ```

2. Abre o browser em `http://localhost:5173`

3. Abre as **Developer Tools** (F12)

4. Vai à aba **Console**

5. Deves ver a mensagem:
   ```
   🔥 Firebase inicializado com sucesso!
   ```

6. **Testa adicionar um favorito**:
   - Clica no coração de qualquer Pokémon
   - Se não houver erros na consola, está a funcionar! ✅

---

## 🎯 Próximos Passos

Agora que o Firebase está configurado, o sistema já está a usar:

✅ **GET /favoritos** - Lista favoritos da base de dados  
✅ **POST /favoritos** - Adiciona favorito  
✅ **DELETE /favoritos/:id** - Remove favorito  
✅ **POST /batalhas** - Guarda histórico de batalhas  
✅ **POST /quiz/scores** - Guarda pontuações do quiz  
✅ **GET /stats** - Estatísticas globais  

---

## 📊 Ver Dados no Firebase Console

1. Vai ao [Firebase Console](https://console.firebase.google.com/)
2. Seleciona o teu projeto
3. Clica em **"Firestore Database"**
4. Verás 3 coleções:
   - `favoritos` - Lista de Pokémon favoritos
   - `batalhas` - Histórico de batalhas
   - `quizScores` - Pontuações do quiz

Podes ver, editar e apagar dados manualmente aqui!

---

## 🔧 Estrutura das Coleções

### `favoritos`
```json
{
  "id": 25,
  "name": "pikachu",
  "sprite": "https://raw.githubusercontent.com/PokeAPI/sprites/.../25.png",
  "createdAt": Timestamp(...)
}
```

### `batalhas`
```json
{
  "pokemon1": { "id": 25, "name": "pikachu", "finalHP": 35 },
  "pokemon2": { "id": 6, "name": "charizard", "finalHP": 0 },
  "winner": 1,
  "duration": 45000,
  "totalDamage": 234,
  "weather": "sun",
  "timestamp": Timestamp(...)
}
```

### `quizScores`
```json
{
  "playerName": "Jogador1",
  "score": 18,
  "streak": 9,
  "total": 10,
  "accuracy": 90,
  "timestamp": Timestamp(...)
}
```

---

## ⚠️ Troubleshooting

### Erro: "Firebase: Error (auth/invalid-api-key)"
❌ **Problema**: API key inválida  
✅ **Solução**: Verifica se colaste corretamente as credenciais em `src/firebase/config.js`

### Erro: "Missing or insufficient permissions"
❌ **Problema**: Regras de segurança não configuradas  
✅ **Solução**: Volta ao Passo 3 e cola as regras de segurança

### Erro: "FirebaseError: [code=permission-denied]"
❌ **Problema**: Regras muito restritivas  
✅ **Solução**: Verifica se publicaste as regras no Firebase Console

### Favoritos não aparecem
❌ **Problema**: Dados ainda no localStorage  
✅ **Solução**: Limpa localStorage no DevTools: `localStorage.clear()`

---

## 🎓 Validação Implementada

✅ **Whitelist de campos de ordenação**: `['name', 'id', 'createdAt', 'score', 'timestamp']`  
✅ **Whitelist de ordem**: `['asc', 'desc']`  
✅ **Validação de IDs**: Pokémon entre 1 e 1025  
✅ **Validação de tipos**: Campos obrigatórios verificados  
✅ **Prevenção de duplicados**: Favoritos únicos  
✅ **Timestamps automáticos**: `serverTimestamp()`  
✅ **Regras de segurança no Firestore**: Validação server-side  

---

## 📚 Documentação Adicional

- [Firebase Docs](https://firebase.google.com/docs/firestore)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Querying Data](https://firebase.google.com/docs/firestore/query-data/queries)

---

**🎉 Parabéns! Agora tens uma base de dados real com API REST-like (+5% de bónus garantido!)**
