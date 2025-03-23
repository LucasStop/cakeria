// Variáveis globais
let currentPage = 1;
let totalPages = 0;

// Seletores
const recipesGrid = document.getElementById('recipes-grid');
const paginationEl = document.getElementById('recipes-pagination');
const searchInput = document.getElementById('search-recipes');
const searchBtn = document.getElementById('search-btn');
const categoryFilter = document.getElementById('category-filter');
const sortSelect = document.getElementById('sort-recipes');
const newRecipeBtn = document.getElementById('new-recipe-btn');

// Template
const recipeCardTemplate = document.getElementById('recipe-card-template');

document.addEventListener('DOMContentLoaded', async () => {
  // Verificar autenticação para o botão de nova receita
  checkAuthStatus();
  
  // Carregar categorias para o filtro
  await loadCategories();
  
  // Carregar receitas iniciais
  await loadRecipes();
  
  // Configurar event listeners
  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
  
  categoryFilter.addEventListener('change', handleFiltersChange);
  sortSelect.addEventListener('change', handleFiltersChange);
});

async function checkAuthStatus() {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      newRecipeBtn.addEventListener('click', () => {
        window.location.href = '/login.html?redirect=/nova-receita.html';
      });
      return;
    }
    
    // Verificar se o token é válido
    const response = await fetch(`${API.BASE_URL}/auth/validate`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      newRecipeBtn.addEventListener('click', () => {
        window.location.href = '/nova-receita.html';
      });
    } else {
      localStorage.removeItem('token');
      newRecipeBtn.addEventListener('click', () => {
        window.location.href = '/login.html?redirect=/nova-receita.html';
      });
    }
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    newRecipeBtn.addEventListener('click', () => {
      window.location.href = '/login.html?redirect=/nova-receita.html';
    });
  }
}

async function loadCategories() {
  try {
    const categories = await API.get('/categories');
    
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      categoryFilter.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
  }
}

async function loadRecipes() {
  showLoading();
  
  try {
    // Obter parâmetros de filtro e paginação
    const searchTerm = searchInput.value.trim();
    const categoryId = categoryFilter.value;
    const sortBy = sortSelect.value;
    
    // Construir URL com parâmetros
    let url = `/recipes?page=${currentPage}`;
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
    if (categoryId) url += `&category=${categoryId}`;
    if (sortBy) url += `&sort=${sortBy}`;
    
    // Buscar receitas do servidor
    const data = await API.get(url);
    
    // Atualizar paginação
    totalPages = data.totalPages;
    
    // Renderizar receitas
    renderRecipes(data.recipes);
    renderPagination();
  } catch (error) {
    console.error('Erro ao carregar receitas:', error);
    showError('Não foi possível carregar as receitas. Tente novamente mais tarde.');
  }
}

function showLoading() {
  recipesGrid.innerHTML = `
    <div class="loading-indicator">
      <div class="spinner"></div>
      <p>Carregando receitas...</p>
    </div>
  `;
}

function showError(message) {
  recipesGrid.innerHTML = `
    <div class="error-message">
      <i class="fas fa-exclamation-circle"></i>
      <p>${message}</p>
    </div>
  `;
}

function renderRecipes(recipes) {
  if (!recipes || recipes.length === 0) {
    recipesGrid.innerHTML = `
      <div class="no-recipes-message">
        <i class="fas fa-search"></i>
        <p>Nenhuma receita encontrada com os filtros selecionados.</p>
      </div>
    `;
    return;
  }
  
  recipesGrid.innerHTML = '';
  
  recipes.forEach(recipe => {
    // Clonar o template
    const recipeCard = recipeCardTemplate.content.cloneNode(true);
    
    // Imagem
    const img = recipeCard.querySelector('.recipe-image img');
    img.src = recipe.imageUrl || '/assets/default-recipe.jpg';
    img.alt = recipe.title;
    
    // Título e metadados
    recipeCard.querySelector('.recipe-title').textContent = recipe.title;
    recipeCard.querySelector('.author-name').textContent = recipe.author?.name || 'Anônimo';
    
    // Data formatada
    const createdAt = new Date(recipe.createdAt);
    recipeCard.querySelector('.date-text').textContent = createdAt.toLocaleDateString('pt-BR');
    
    // Visualizações
    recipeCard.querySelector('.views-count').textContent = recipe.views || 0;
    
    // Descrição resumida
    const excerpt = recipe.description.substring(0, 120) + (recipe.description.length > 120 ? '...' : '');
    recipeCard.querySelector('.recipe-excerpt').textContent = excerpt;
    
    // Dificuldade
    const difficultyEl = recipeCard.querySelector('.recipe-difficulty');
    difficultyEl.textContent = recipe.difficulty || 'Médio';
    difficultyEl.classList.add(`difficulty-${(recipe.difficulty || 'Médio').toLowerCase()}`);
    
    // Tempo de preparo
    const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
    recipeCard.querySelector('.time-text').textContent = totalTime > 0 ? `${totalTime} min` : 'N/A';
    
    // Link para detalhes
    const recipeLink = recipeCard.querySelector('.recipe-link');
    recipeLink.href = `/receita.html?slug=${recipe.slug}`;
    
    recipesGrid.appendChild(recipeCard);
  });
}

function renderPagination() {
  if (totalPages <= 1) {
    paginationEl.style.display = 'none';
    return;
  }
  
  paginationEl.style.display = 'flex';
  paginationEl.innerHTML = '';
  
  // Botão anterior
  const prevBtn = document.createElement('button');
  prevBtn.classList.add('prev-btn');
  prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadRecipes();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  paginationEl.appendChild(prevBtn);
  
  // Botões de páginas
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = i;
    if (i === currentPage) {
      pageBtn.classList.add('active');
    }
    pageBtn.addEventListener('click', () => {
      currentPage = i;
      loadRecipes();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    paginationEl.appendChild(pageBtn);
  }
  
  // Botão próxima
  const nextBtn = document.createElement('button');
  nextBtn.classList.add('next-btn');
  nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadRecipes();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  paginationEl.appendChild(nextBtn);
}

function handleSearch() {
  currentPage = 1;
  loadRecipes();
}

function handleFiltersChange() {
  currentPage = 1;
  loadRecipes();
}

// Extender o objeto API para validação do token
if (API) {
  API.validateToken = async (token) => {
    try {
      const response = await fetch(`${API.BASE_URL}/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Erro ao validar token:', error);
      return false;
    }
  };
}
