function protectPage() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = '/login.html';
  }
}

function getCurrentUser() {
  const userJson = localStorage.getItem('user');
  return userJson ? JSON.parse(userJson) : null;
}

function isAuthenticated() {
  return !!getCurrentUser();
}

function updateUserDisplay(user) {
  const userNameEl = document.getElementById('user-name');
  if (userNameEl) {
    userNameEl.textContent = user.name;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();

  if (user && typeof updateUserDisplay === 'function') {
    updateUserDisplay(user);
  }

  initRecipesPage();

  const newRecipeBtn = document.getElementById('new-recipe-btn');
  if (newRecipeBtn) {
    newRecipeBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (isAuthenticated()) {
        window.location.href = '/compartilhar-receita.html';
      } else {
        window.location.href = `/login.html?redirect=${encodeURIComponent('/compartilhar-receita.html')}`;
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

const recipesGrid = document.getElementById('recipes-grid');
const paginationContainer = document.getElementById('recipes-pagination');
const searchInput = document.getElementById('search-recipes');
const searchBtn = document.getElementById('search-btn');
const categoryFilter = document.getElementById('category-filter');
const sortSelect = document.getElementById('sort-recipes');
const recipeTemplate = document.getElementById('recipe-card-template');

let currentPage = 1;
let totalPages = 1;

function initRecipesPage() {
  setupEventListeners();
  fetchRecipes();
}

function setupEventListeners() {
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
      const searchTerm = searchInput.value.trim();
      if (searchTerm) {
        currentPage = 1;
        fetchRecipes();
      }
    });

    searchInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
          currentPage = 1;
          fetchRecipes();
        }
      }
    });
  }

  const newRecipeBtn = document.getElementById('new-recipe-btn');
  if (newRecipeBtn) {
    newRecipeBtn.addEventListener('click', () => {});
  }

  if (categoryFilter) {
    const categories = ['Bolos', 'Tortas', 'Doces', 'Salgados', 'Bebidas', 'Sem Glúten', 'Veganos'];
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.toLowerCase();
      option.textContent = category;
      categoryFilter.appendChild(option);
    });

    categoryFilter.addEventListener('change', () => {
      const selectedCategory = categoryFilter.value;
      currentPage = 1;
      fetchRecipes();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      const sortOption = sortSelect.value;
      currentPage = 1;
      fetchRecipes();
    });
  }
}

async function fetchRecipes() {
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

    const data = await API.get(endpoint);

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

function showEmptyState() {
  if (recipesGrid) {
    recipesGrid.innerHTML = `
      <div class="no-recipes-message">
        <i class="fas fa-utensils"></i>
        <p>Nenhuma receita encontrada. Seja o primeiro a compartilhar!</p>
        <a href="/compartilhar-receita.html" class="btn btn-primary">Compartilhar Receita</a>
      </div>
    `;
  }
}

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

const userCache = {};

async function getUserById(userId) {
  if (userCache[userId]) {
    return userCache[userId];
  }

  try {
    const user = { id: userId, name: `Usuário #${userId}` };

    if (userId === 27) {
      user.name = 'Renan Herculano';
      user.email = 'renan@gmail.com.br';
    }

    userCache[userId] = user;
    return user;
  } catch (error) {
    console.error(`Erro ao buscar detalhes do usuário #${userId}:`, error);
    return null;
  }
}

async function displayRecipes(recipes) {
  if (!recipesGrid) return;
  recipesGrid.innerHTML = '';

  for (const recipe of recipes) {
    if (!recipeTemplate) {
      const card = document.createElement('div');
      card.className = 'recipe-card';

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
      const card = recipeTemplate.content.cloneNode(true);

      const img = card.querySelector('.recipe-image img');
      img.src = recipe.image_url || '/assets/placeholder.jpg';
      img.alt = recipe.title;

      card.querySelector('.recipe-title').textContent = recipe.title;

      const authorSpan = card.querySelector('.author-name');
      if (authorSpan) {
        let authorName = null;

        if (recipe.author?.name) {
          authorName = recipe.author.name;
        } else if (recipe.user?.name) {
          authorName = recipe.user.name;
        } else if (recipe.userName) {
          authorName = recipe.userName;
        } else if (recipe.userId || recipe.user_id) {
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

        authorSpan.textContent = authorName;
      }

      const dateSpan = card.querySelector('.date-text');
      if (dateSpan) {
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

      const viewsSpan = card.querySelector('.views-count');
      if (viewsSpan) {
        const viewCount = recipe.views || 0;
        viewsSpan.textContent = viewCount;

        if (viewCount > 10) {
          const viewsIcon = card.querySelector('.recipe-views i');
          if (viewsIcon) {
            viewsIcon.classList.remove('far');
            viewsIcon.classList.add('fas');
            viewsIcon.style.color = '#e55757';
          }
        }
      }

      const excerpt = card.querySelector('.recipe-excerpt');
      if (excerpt) excerpt.textContent = recipe.description?.substring(0, 120) + '...';

      const difficultySpan = card.querySelector('.recipe-difficulty');
      if (difficultySpan) difficultySpan.textContent = recipe.difficulty || 'Médio';

      const timeSpan = card.querySelector('.time-text');
      if (timeSpan) {
        const prepTime = recipe.prep_time || recipe.prepTime || 0;
        const cookTime = recipe.cook_time || recipe.cookTime || 0;

        const totalTime = parseInt(prepTime) + parseInt(cookTime);

        if (totalTime > 0) {
          timeSpan.textContent = `${totalTime} min`;
        } else if (recipe.totalTime || recipe.total_time) {
          timeSpan.textContent = `${recipe.totalTime || recipe.total_time} min`;
        } else {
          timeSpan.textContent = 'Tempo não informado';
        }
      }

      const recipeLink = card.querySelector('.recipe-link');
      if (recipeLink) {
        recipeLink.href = `/receita.html?id=${recipe.id}`;
      }

      const adminActions = card.querySelector('.recipe-admin-actions');
      if (adminActions) {
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
                window.location.href = `/compartilhar-receita.html?id=${recipe.id}`;
              });
            }
          } else {
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

  const cancelButton = dialog.querySelector('.dialog-btn-cancel');
  cancelButton.addEventListener('click', () => {
    dialog.remove();
  });

  const confirmButton = dialog.querySelector('.dialog-btn-confirm');
  confirmButton.addEventListener('click', async () => {
    try {
      confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';
      confirmButton.disabled = true;

      await fetch(`${API.BASE_URL}/recipe/${recipe.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      showNotification('Receita excluída com sucesso!', 'success');

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

function showNotification(message, type = 'info') {
  if (window.Notifications) {
    window.Notifications[type](message);
  } else {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 5000);
  }
}

window.fetchRecipes = fetchRecipes;
window.verReceitaDetalhes = function (id) {
  window.location.href = `/receita.html?id=${id}`;
};
