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

// Verifica se o usuário está autenticado
function isAuthenticated() {
  return !!getCurrentUser();
}

// Atualiza a exibição do usuário no cabeçalho
function updateUserDisplay(user) {
  const userNameEl = document.getElementById('user-name');
  if (userNameEl) {
    userNameEl.textContent = user.name;
  }
}

// Página de receitas não precisa ser protegida totalmente, apenas verificar autenticação para ações específicas
document.addEventListener('DOMContentLoaded', () => {
  // Obtém o usuário atual se estiver autenticado
  const user = getCurrentUser();

  // Atualizar exibição do usuário se estiver autenticado
  if (user && typeof updateUserDisplay === 'function') {
    updateUserDisplay(user);
  }

  // Inicializar a página de receitas
  initRecipesPage();

  // Configurar botão de compartilhar receita para verificar autenticação quando clicado
  const newRecipeBtn = document.getElementById('new-recipe-btn');
  if (newRecipeBtn) {
    newRecipeBtn.addEventListener('click', function (e) {
      e.preventDefault();
      // Verificar autenticação antes de redirecionar
      if (isAuthenticated()) {
        window.location.href = '/compartilharReceitas.html';
      } else {
        // Redirecionar para login com redirecionamento para compartilharReceitas
        window.location.href = `/login.html?redirect=${encodeURIComponent('/compartilharReceitas.html')}`;
        if (window.Toast) {
          Toast.warning('Você precisa fazer login para compartilhar receitas', {
            duration: 5000,
            position: 'top-center',
          });
        }
      }
    });
  }
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

    searchInput.addEventListener('keypress', e => {
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
    let endpoint = '/recipe';

    const queryParams = [];

    if (categoryFilter && categoryFilter.value && categoryFilter.value !== 'todas') {
      queryParams.push(`category=${encodeURIComponent(categoryFilter.value)}`);
    }

    if (searchInput && searchInput.value.trim()) {
      queryParams.push(`search=${encodeURIComponent(searchInput.value.trim())}`);
    }

    if (sortSelect && sortSelect.value) {
      queryParams.push(`sort=${encodeURIComponent(sortSelect.value)}`);
    }

    queryParams.push(`page=${currentPage}`);

    if (queryParams.length > 0) {
      endpoint += `?${queryParams.join('&')}`;
    }

    console.log('Endpoint da API:', endpoint);

    const data = await API.get(endpoint);
    console.log('Dados recebidos da API:', data);

    let recipes;
    if (data.recipes) {
      recipes = data.recipes;
      totalPages = data.totalPages || 1;
    } else if (Array.isArray(data)) {
      recipes = data;
    } else {
      recipes = [];
    }

    if (Array.isArray(recipes) && recipes.length > 0) {
      displayRecipes(recipes);
    } else {
      showEmptyState();
    }
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

  console.log('Começando a exibir receitas. Total:', recipes.length);

  // Para cada receita, criar um card
  for (const recipe of recipes) {
    console.log('Processando receita:', recipe);

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

          if (userCache[userId]) {
            authorName = userCache[userId].name;
          } else {
            try {
              const user = await getUserById(userId);
              if (user && user.name) {
                authorName = user.name;
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

        console.log('Nome do autor encontrado:', authorName);
        authorSpan.textContent = authorName;
      }

      const dateSpan = card.querySelector('.date-text');
      if (dateSpan) {
        console.log('Data original:', recipe.created_at || recipe.createdAt);

        let dateString = recipe.created_at || recipe.createdAt;
        let date;

        if (dateString) {
          date = new Date(dateString);

          if (isNaN(date.getTime())) {
            if (!isNaN(dateString)) {
              date = new Date(parseInt(dateString));
            } else if (typeof dateString === 'string' && dateString.includes('/')) {
              const [day, month, year] = dateString.split('/');
              date = new Date(year, month - 1, day);
            }
          }
        } else {
          date = new Date();
        }

        try {
          if (!isNaN(date.getTime())) {
            dateSpan.textContent = date.toLocaleDateString('pt-BR');
          } else {
            dateSpan.textContent = 'Data desconhecida';
          }
        } catch (e) {
          console.error('Erro ao formatar data:', e);
          dateSpan.textContent = 'Data desconhecida';
        }
      }

      // Visualizações
      const viewsSpan = card.querySelector('.views-count');
      if (viewsSpan) {
        const viewCount = recipe.views || 0;
        viewsSpan.textContent = viewCount;

        // Adicionar classe para destacar receitas populares (mais de 10 visualizações)
        if (viewCount > 10) {
          const viewsIcon = card.querySelector('.recipe-views i');
          if (viewsIcon) {
            viewsIcon.classList.remove('far');
            viewsIcon.classList.add('fas');
            viewsIcon.style.color = '#e55757'; // Destacar ícone com cor
          }
        }
      }

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
          timeSpan.textContent = `${recipe.totalTime || recipe.total_time} min`;
        } else {
          timeSpan.textContent = 'Tempo não informado';
        }
      }

      // Link para a receita
      const recipeLink = card.querySelector('.recipe-link');
      if (recipeLink) {
        recipeLink.href = `/receita.html?id=${recipe.id}`;
      }

      // Botões de administração
      const adminActions = card.querySelector('.recipe-admin-actions');
      if (adminActions) {
        // Verificar se o usuário pode editar/excluir esta receita
        const canEdit = canEditRecipe(recipe);
        const canDelete = canDeleteRecipe(recipe);

        if (canEdit || canDelete) {
          adminActions.style.display = 'flex';

          if (canEdit) {
            const editButton = adminActions.querySelector('.edit-recipe');
            if (editButton) {
              editButton.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/compartilharReceitas.html?id=${recipe.id}`;
              });
            }
          } else {
            // Esconder botão de edição se não tiver permissão
            const editButton = adminActions.querySelector('.edit-recipe');
            if (editButton) {
              editButton.style.display = 'none';
            }
          }

          if (canDelete) {
            const deleteButton = adminActions.querySelector('.delete-recipe');
            if (deleteButton) {
              deleteButton.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                showDeleteConfirmation(recipe);
              });
            }
          } else {
            // Esconder botão de exclusão se não tiver permissão
            const deleteButton = adminActions.querySelector('.delete-recipe');
            if (deleteButton) {
              deleteButton.style.display = 'none';
            }
          }
        }
      }

      recipesGrid.appendChild(card);
    }
  }
}

console.log(`${recipes.length} receitas exibidas com sucesso`);

// Mostrar confirmação para excluir receita na página de listagem
function showDeleteConfirmation(recipe) {
  const dialog = document.createElement('div');
  dialog.className = 'confirmation-dialog';
  dialog.innerHTML = `
    <div class="dialog-content">
      <h3 class="dialog-title">Excluir Receita</h3>
      <p class="dialog-message">Tem certeza que deseja excluir a receita "${recipe.title}"? Esta ação não pode ser desfeita.</p>
      <div class="dialog-buttons">
        <button class="dialog-btn dialog-btn-cancel">Cancelar</button>
        <button class="dialog-btn dialog-btn-confirm">Excluir</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  // Manipular botão de cancelar
  const cancelButton = dialog.querySelector('.dialog-btn-cancel');
  cancelButton.addEventListener('click', () => {
    dialog.remove();
  });

  // Manipular botão de confirmar
  const confirmButton = dialog.querySelector('.dialog-btn-confirm');
  confirmButton.addEventListener('click', async () => {
    try {
      // Adicionar indicador de carregamento
      confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';
      confirmButton.disabled = true;

      // Fazer a requisição para excluir a receita
      await fetch(`${API.BASE_URL}/recipe/${recipe.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // Mostrar notificação de sucesso
      showNotification('Receita excluída com sucesso!', 'success');

      // Recarregar a lista de receitas
      setTimeout(() => {
        fetchRecipes();
        dialog.remove();
      }, 1000);
    } catch (error) {
      console.error('Erro ao excluir receita:', error);
      showNotification('Erro ao excluir receita. Tente novamente.', 'error');
      dialog.remove();
    }
  });
}

// Função para exibir notificações
function showNotification(message, type = 'info') {
  // Verificar se temos o objeto de notificações global
  if (window.Notifications) {
    window.Notifications[type](message);
  } else {
    // Fallback: criar uma notificação simples
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remover após 5 segundos
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 5000);
  }
}

// Exportar funções para uso global
window.fetchRecipes = fetchRecipes;
window.verReceitaDetalhes = function (id) {
  console.log(`Ver detalhes da receita ${id}`);
  window.location.href = `/receita.html?id=${id}`;
};
