// scripts.js

// Proteger a página - verificar se o usuário está autenticado
function protectPage() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = '/login.html';
  }
}

// Obtém o usuário atual do armazenamento local
function getCurrentUser() {
  const userJson = localStorage.getItem('user');
  return userJson ? JSON.parse(userJson) : null;
}

// Atualiza a exibição do usuário no cabeçalho
function updateUserDisplay(user) {
  const userNameEl = document.getElementById('user-name');
  if (userNameEl) {
    userNameEl.textContent = user.name;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Proteger a página - verificar se o usuário está autenticado
  protectPage();
  
  // Obtém o usuário atual
  const user = getCurrentUser();
  
  // Atualizar exibição do usuário se necessário
  if (typeof updateUserDisplay === 'function') {
    updateUserDisplay(user);
  }
  
  // Inicializar a página de receitas
  initRecipesPage();
});

// Variáveis e seletores
const recipesGrid = document.getElementById('recipes-grid');
const paginationContainer = document.getElementById('recipes-pagination');
const searchInput = document.getElementById('search-recipes');
const searchBtn = document.getElementById('search-btn');
const categoryFilter = document.getElementById('category-filter');
const sortSelect = document.getElementById('sort-recipes');
const recipeTemplate = document.getElementById('recipe-card-template');

// Estado da aplicação
let currentPage = 1;
let totalPages = 1;

// Inicializa a página de receitas
function initRecipesPage() {
  console.log('Inicializando página de receitas...');
  setupEventListeners();
  fetchRecipes();
}

// Configura os event listeners
function setupEventListeners() {
  // Busca de receitas
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
      const searchTerm = searchInput.value.trim();
      if (searchTerm) {
        console.log(`Buscando por: ${searchTerm}`);
        currentPage = 1;
        fetchRecipes();
      }
    });
    
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
          console.log(`Buscando por: ${searchTerm}`);
          currentPage = 1;
          fetchRecipes();
        }
      }
    });
  }
  
  // Botão para compartilhar nova receita
  const newRecipeBtn = document.getElementById('new-recipe-btn');
  if (newRecipeBtn) {
    newRecipeBtn.addEventListener('click', () => {
      // Implementar compartilhamento de nova receita
      console.log('Compartilhar nova receita');
      // showNewRecipeModal();
    });
  }
  
  // Filtro por categoria
  if (categoryFilter) {
    // Adicionar categorias dinamicamente
    const categories = ['Bolos', 'Tortas', 'Doces', 'Salgados', 'Bebidas', 'Sem Glúten', 'Veganos'];
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.toLowerCase();
      option.textContent = category;
      categoryFilter.appendChild(option);
    });
    
    categoryFilter.addEventListener('change', () => {
      const selectedCategory = categoryFilter.value;
      console.log(`Filtrando por categoria: ${selectedCategory}`);
      currentPage = 1;
      fetchRecipes();
    });
  }
  
  // Ordenação de receitas
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      const sortOption = sortSelect.value;
      console.log(`Ordenando por: ${sortOption}`);
      currentPage = 1;
      fetchRecipes();
    });
  }
}

// Buscar receitas da API
async function fetchRecipes() {
  console.log('Buscando receitas do servidor...');
  showLoading();
  
  try {
    // Para demonstração, ainda usaremos dados estáticos
    // Posteriormente seria trocado por uma chamada de API real
    const recipes = [
      {
        id: 1,
        title: 'Bolo de Chocolate Fofinho',
        image_url: '/imgs/bolo_chocolate_receita.jpg',
        author: { name: 'Maria Silva' },
        created_at: '10/05/2023',
        views: 1250,
        description: 'Um delicioso bolo de chocolate fofinho, perfeito para qualquer ocasião.',
        difficulty: 'Fácil',
        prep_time: 20,
        cook_time: 20
      },
      {
        id: 2,
        title: 'Brigadeiro Gourmet',
        image_url: '/imgs/brigadeiro_receita.jpg',
        author: { name: 'João Santos' },
        created_at: '23/09/2023',
        views: 856,
        description: 'Brigadeiro gourmet com chocolate premium para impressionar seus convidados.',
        difficulty: 'Fácil',
        prep_time: 15,
        cook_time: 15
      },
      {
        id: 3,
        title: 'Torta de Limão',
        image_url: '/imgs/torta_limao_receita.jpg',
        author: { name: 'Ana Oliveira' },
        created_at: '05/12/2023',
        views: 930,
        description: 'Uma refrescante torta de limão com massa crocante e recheio cremoso.',
        difficulty: 'Médio',
        prep_time: 30,
        cook_time: 30
      }
    ];
    
    // Aguardar um tempo simulando carregamento
    setTimeout(() => {
      if (Array.isArray(recipes) && recipes.length > 0) {
        displayRecipes(recipes);
      } else {
        showEmptyState();
      }
    }, 800);
    
  } catch (error) {
    console.error('Erro ao buscar receitas:', error);
    showError();
  }
}

// Exibir indicador de carregamento
function showLoading() {
  if (recipesGrid) {
    recipesGrid.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Carregando receitas...</p>
      </div>
    `;
  }
}

// Exibir mensagem quando não há receitas
function showEmptyState() {
  if (recipesGrid) {
    recipesGrid.innerHTML = `
      <div class="no-recipes-message">
        <i class="fas fa-utensils"></i>
        <p>Nenhuma receita encontrada. Seja o primeiro a compartilhar!</p>
        <a href="/compartilharReceitas.html" class="btn btn-primary">Compartilhar Receita</a>
      </div>
    `;
  }
}

// Exibir mensagem de erro
function showError() {
  if (recipesGrid) {
    recipesGrid.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Ocorreu um erro ao carregar as receitas.</p>
        <button onclick="fetchRecipes()" class="btn btn-primary">Tentar Novamente</button>
      </div>
    `;
  }
}

// Cache para evitar requisições repetidas
const userCache = {};

// Função para buscar detalhes do usuário por ID
async function getUserById(userId) {
  console.log(`Tentando buscar usuário com ID ${userId}...`);
  
  if (userCache[userId]) {
    return userCache[userId];
  }
  
  try {
    // Simulação de resposta para desenvolvimento
    // Em produção, seria substituído pela chamada real da API
    const user = { id: userId, name: `Usuário #${userId}` };
    
    // Valores específicos para testes
    if (userId === 27) {
      user.name = 'Renan Herculano';
      user.email = 'renan@gmail.com';
    }
    
    userCache[userId] = user;
    return user;
  } catch (error) {
    console.error(`Erro ao buscar detalhes do usuário #${userId}:`, error);
    return null;
  }
}

// Exibir receitas na página
async function displayRecipes(recipes) {
  // Limpar o grid
  if (!recipesGrid) return;
  recipesGrid.innerHTML = '';
  
  console.log("Começando a exibir receitas. Total:", recipes.length);
  
  // Para cada receita, criar um card
  for (const recipe of recipes) {
    console.log("Processando receita:", recipe);
    
    // Verificar se temos o template
    if (!recipeTemplate) {
      // Se não tivermos o template, criar um HTML básico
      const card = document.createElement('div');
      card.className = 'recipe-card';
      
      // Dados da receita
      const title = recipe.title || 'Sem título';
      const description = recipe.description || 'Sem descrição';
      const author = recipe.author?.name || 'Autor desconhecido';
      const image = recipe.image_url || '/assets/placeholder.jpg'; 
      
      card.innerHTML = `
        <div class="recipe-image">
          <img src="${image}" alt="${title}" onerror="this.src='/assets/placeholder.jpg'">
        </div>
        <div class="recipe-content">
          <h3 class="recipe-title">${title}</h3>
          <div class="recipe-meta">
            <span class="recipe-author"><i class="fas fa-user"></i> ${author}</span>
          </div>
          <p class="recipe-excerpt">${description.substring(0, 100)}...</p>
          <div class="recipe-footer">
            <a href="/receita.html?id=${recipe.id}" class="recipe-link">Ver Receita</a>
          </div>
        </div>
      `;
      
      recipesGrid.appendChild(card);
    } else {
      // Se temos o template, usamos ele
      const card = recipeTemplate.content.cloneNode(true);
      
      // Preencher dados
      const img = card.querySelector('.recipe-image img');
      img.src = recipe.image_url || '/assets/placeholder.jpg';
      img.alt = recipe.title;
      
      card.querySelector('.recipe-title').textContent = recipe.title;
      
      // Autor - Melhor tratamento para diferentes formatos de dados
      const authorSpan = card.querySelector('.author-name');
      if (authorSpan) {
        let authorName = null;
        
        // Verificar diferentes possibilidades para o nome do autor
        if (recipe.author?.name) {
          authorName = recipe.author.name;
        } else if (recipe.user?.name) {
          authorName = recipe.user.name;
        } else if (recipe.userName) {
          authorName = recipe.userName;
        } else if (recipe.userId || recipe.user_id) {
          // Se tiver apenas o ID do usuário, buscar o nome na API
          const userId = recipe.userId || recipe.user_id;
          
          // Verificar primeiro no cache
          if (userCache[userId]) {
            authorName = userCache[userId].name;
          } else {
            // Buscar o usuário da API
            try {
              const user = await getUserById(userId);
              if (user && user.name) {
                authorName = user.name;
                // Salvar no cache para futuras referências
                userCache[userId] = user;
              } else {
                authorName = `Usuário #${userId}`;
              }
            } catch (error) {
              console.error(`Erro ao buscar usuário ${userId}:`, error);
              authorName = `Usuário #${userId}`;
            }
          }
        } else {
          authorName = 'Autor desconhecido';
        }
        
        console.log("Nome do autor encontrado:", authorName);
        authorSpan.textContent = authorName;
      }
      
      // Data de criação - Melhorada a lógica para lidar com diferentes formatos
      const dateSpan = card.querySelector('.date-text');
      if (dateSpan) {
        // Log para debugging do formato da data
        console.log("Data original:", recipe.created_at || recipe.createdAt);
        
        // Tentar vários formatos possíveis
        let dateString = recipe.created_at || recipe.createdAt;
        let date;
        
        if (dateString) {
          date = new Date(dateString);
          
          // Se a conversão falhou, tente outro formato
          if (isNaN(date.getTime())) {
            // Verificar se é um timestamp numérico
            if (!isNaN(dateString)) {
              date = new Date(parseInt(dateString));
            } 
            // Verificar formato DD/MM/YYYY
            else if (typeof dateString === 'string' && dateString.includes('/')) {
              const [day, month, year] = dateString.split('/');
              date = new Date(year, month - 1, day);
            }
          }
        } else {
          // Se não há data na receita, use a data atual como fallback
          date = new Date();
        }
        
        // Formatar a data para exibição
        try {
          if (!isNaN(date.getTime())) {
            dateSpan.textContent = date.toLocaleDateString('pt-BR');
          } else {
            dateSpan.textContent = 'Data desconhecida';
          }
        } catch (e) {
          console.error("Erro ao formatar data:", e);
          dateSpan.textContent = 'Data desconhecida';
        }
      }
      
      // Visualizações
      const viewsSpan = card.querySelector('.views-count');
      if (viewsSpan) viewsSpan.textContent = recipe.views || 0;
      
      // Descrição
      const excerpt = card.querySelector('.recipe-excerpt');
      if (excerpt) excerpt.textContent = recipe.description?.substring(0, 120) + '...';
      
      // Dificuldade
      const difficultySpan = card.querySelector('.recipe-difficulty');
      if (difficultySpan) difficultySpan.textContent = recipe.difficulty || 'Médio';
      
      // Tempo - Melhor tratamento para diferentes formatos
      const timeSpan = card.querySelector('.time-text');
      if (timeSpan) {
        // Considerar todas as possibilidades de nomenclatura
        const prepTime = recipe.prep_time || recipe.prepTime || 0;
        const cookTime = recipe.cook_time || recipe.cookTime || 0;
        
        // Ajuste para garantir que os valores são tratados como números
        const totalTime = parseInt(prepTime) + parseInt(cookTime);
        
        // Formatação melhorada
        if (totalTime > 0) {
          timeSpan.textContent = `${totalTime} min`;
        } else if (recipe.totalTime || recipe.total_time) {
          // Tentar outra possibilidade
          timeSpan.textContent = `${recipe.totalTime || recipe.total_time} min`;
        } else {
          // Fallback sem tempo
          timeSpan.textContent = 'Tempo não informado';
        }
      }
      
      // Link para a receita
      const recipeLink = card.querySelector('.recipe-link');
      if (recipeLink) {
        recipeLink.href = `/receita.html?id=${recipe.id}`;
      }
      
      recipesGrid.appendChild(card);
    }
  }
  
  console.log(`${recipes.length} receitas exibidas com sucesso`);
}

// Exportar funções para uso global
window.fetchRecipes = fetchRecipes;
window.verReceitaDetalhes = function(id) {
  console.log(`Ver detalhes da receita ${id}`);
  window.location.href = `/receita.html?id=${id}`;
};
