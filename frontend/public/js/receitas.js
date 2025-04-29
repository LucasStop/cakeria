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

// scripts/receitas.js

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

// Inicializa a página de receitas
function initRecipesPage() {
  loadRecipes();
  setupEventListeners();
}

// Carrega as receitas do servidor ou de dados estáticos
async function loadRecipes() {
  try {
    const recipesGrid = document.getElementById('recipes-grid');
    if (!recipesGrid) return;
    
    // Mostrar indicador de carregamento
    recipesGrid.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Carregando receitas...</p>
      </div>
    `;
    
    // Dados estáticos para demonstração
    // Posteriormente, isso seria substituído por uma chamada API
    const recipes = [
      {
        id: 1,
        title: 'Bolo de Chocolate Fofinho',
        image: '/imgs/bolo_chocolate_receita.jpg',
        author: 'Maria Silva',
        date: '10/05/2023',
        views: 1250,
        excerpt: 'Um delicioso bolo de chocolate fofinho, perfeito para qualquer ocasião.',
        difficulty: 'Fácil',
        time: '40 minutos'
      },
      {
        id: 2,
        title: 'Brigadeiro Gourmet',
        image: '/imgs/brigadeiro_receita.jpg',
        author: 'João Santos',
        date: '23/09/2023',
        views: 856,
        excerpt: 'Brigadeiro gourmet com chocolate premium para impressionar seus convidados.',
        difficulty: 'Fácil',
        time: '30 minutos'
      },
      {
        id: 3,
        title: 'Torta de Limão',
        image: '/imgs/torta_limao_receita.jpg',
        author: 'Ana Oliveira',
        date: '05/12/2023',
        views: 930,
        excerpt: 'Uma refrescante torta de limão com massa crocante e recheio cremoso.',
        difficulty: 'Médio',
        time: '60 minutos'
      }
    ];
    
    // Aguardar um tempo simulando carregamento
    setTimeout(() => {
      renderRecipes(recipes);
    }, 800);
    
  } catch (error) {
    console.error('Erro ao carregar receitas:', error);
    const recipesGrid = document.getElementById('recipes-grid');
    if (recipesGrid) {
      recipesGrid.innerHTML = '<p class="error">Erro ao carregar receitas. Tente novamente mais tarde.</p>';
    }
  }
}

// Renderiza as receitas na grade
function renderRecipes(recipes) {
  const recipesGrid = document.getElementById('recipes-grid');
  const template = document.getElementById('recipe-card-template');
  
  if (!recipesGrid || !template) return;
  
  // Limpar a grade
  recipesGrid.innerHTML = '';
  
  if (recipes.length === 0) {
    recipesGrid.innerHTML = '<p class="no-results">Nenhuma receita encontrada.</p>';
    return;
  }
  
  recipes.forEach(recipe => {
    const clone = document.importNode(template.content, true);
    
    // Preencher dados na receita
    clone.querySelector('.recipe-image img').src = recipe.image;
    clone.querySelector('.recipe-image img').alt = recipe.title;
    clone.querySelector('.recipe-title').textContent = recipe.title;
    clone.querySelector('.author-name').textContent = recipe.author;
    clone.querySelector('.date-text').textContent = recipe.date;
    clone.querySelector('.views-count').textContent = recipe.views;
    clone.querySelector('.recipe-excerpt').textContent = recipe.excerpt;
    clone.querySelector('.recipe-difficulty').textContent = recipe.difficulty;
    clone.querySelector('.time-text').textContent = recipe.time;
    
    // Configurar link para ver detalhes da receita
    const recipeLink = clone.querySelector('.recipe-link');
    recipeLink.href = `/receitas/${recipe.id}`;
    recipeLink.onclick = function(e) {
      e.preventDefault();
      window.verReceitaDetalhes(recipe.id);
    };
    
    recipesGrid.appendChild(clone);
  });
}

// Configura os event listeners
function setupEventListeners() {
  // Busca de receitas
  const searchInput = document.getElementById('search-recipes');
  const searchBtn = document.getElementById('search-btn');
  
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
      const searchTerm = searchInput.value.trim();
      if (searchTerm) {
        // Implementar busca de receitas
        console.log(`Buscando por: ${searchTerm}`);
        // searchRecipes(searchTerm);
      }
    });
    
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
          // Implementar busca de receitas
          console.log(`Buscando por: ${searchTerm}`);
          // searchRecipes(searchTerm);
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
  const categoryFilter = document.getElementById('category-filter');
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
      // filterRecipesByCategory(selectedCategory);
    });
  }
  
  // Ordenação de receitas
  const sortSelect = document.getElementById('sort-recipes');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      const sortOption = sortSelect.value;
      console.log(`Ordenando por: ${sortOption}`);
      // sortRecipes(sortOption);
    });
  }
}
