document.addEventListener('DOMContentLoaded', async function () {
  const recipeId = getRecipeIdFromUrl();
  if (recipeId) {
    await fetchRecipeDetails(recipeId);
  }
});

function getRecipeIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

async function fetchRecipeDetails(id) {
  try {
    const response = await fetch(`${API.BASE_URL}/recipes/${id}`);
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`);
    }
    const recipe = await response.json();
    renderRecipeDetails(recipe);
  } catch (error) {
    console.error('Erro ao buscar detalhes da receita:', error);
    showError();
  }
}

function renderRecipeDetails(recipe) {
  const recipeDetail = document.getElementById('recipe-detail');
  if (!recipeDetail) return;

  // Atualizar o breadcrumb com o título da receita
  document.getElementById('recipe-breadcrumb-title').textContent = recipe.title;

  recipeDetail.innerHTML = `
    <div class="recipe-header">
      <h1 class="recipe-title">${recipe.title}</h1>
      <div class="recipe-meta">
        <span class="recipe-author"><i class="fas fa-user"></i> ${recipe.author ? recipe.author.name : 'Autor desconhecido'}</span>
        <span class="recipe-date"><i class="far fa-calendar"></i> ${formatDate(recipe.createdAt)}</span>
        <span class="recipe-views"><i class="far fa-eye"></i> ${recipe.views || 0} visualizações</span>
      </div>
    </div>
    <div class="recipe-image">
      <img src="${recipe.image_url || '/assets/placeholder.jpg'}" alt="${recipe.title}">
    </div>
    <div class="recipe-content">
      <div class="recipe-section">
        <h2><i class="fas fa-utensils"></i> Ingredientes</h2>
        <ul class="recipe-ingredients">
          <!-- Ingredientes serão inseridos aqui via JavaScript -->
        </ul>
      </div>
      <div class="recipe-section">
        <h2><i class="fas fa-list-ol"></i> Modo de Preparo</h2>
        <ol class="recipe-instructions">
          <!-- Instruções serão inseridos aqui via JavaScript -->
        </ol>
      </div>
    </div>
  `;

  // Processar ingredientes com melhor formatação
  const ingredientsList = document.querySelector('.recipe-ingredients');
  if (ingredientsList) {
    ingredientsList.innerHTML = '';

    // Processar ingredientes de maneira mais robusta
    const formattedIngredients = formatArrayOrString(recipe.ingredients);

    formattedIngredients.forEach(ingredient => {
      const li = document.createElement('li');
      li.innerHTML = `<i class="fas fa-check"></i> ${ingredient.trim()}`;
      ingredientsList.appendChild(li);
    });
  }

  // Processar instruções com melhor formatação
  const instructionsList = document.querySelector('.recipe-instructions');
  if (instructionsList) {
    instructionsList.innerHTML = '';

    // Processar instruções de maneira mais robusta
    const formattedInstructions = formatArrayOrString(recipe.instructions);

    formattedInstructions.forEach((step, index) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="step-number">${index + 1}</span> ${step.trim()}`;
      instructionsList.appendChild(li);
    });
  }
}

// Função para formatar arrays ou strings de forma mais robusta
function formatArrayOrString(data) {
  if (!data) return [];

  // Se já é array, limpar itens vazios
  if (Array.isArray(data)) {
    return data.filter(item => item && item.trim());
  }

  // Se é string
  if (typeof data === 'string') {
    // Verificar se parece JSON
    if (data.trim().startsWith('[') || data.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => item && (typeof item === 'string' ? item.trim() : item));
        }
        return [JSON.stringify(parsed)];
      } catch (e) {
        // Se falhar ao analisar JSON, tratamos como string normal
      }
    }

    // Tentar diferentes separadores para dividir a string
    if (data.includes('\n')) {
      return data.split('\n').filter(item => item.trim());
    } else if (data.includes(';')) {
      return data.split(';').filter(item => item.trim());
    } else if (data.includes(',')) {
      return data.split(',').filter(item => item.trim());
    }

    // Se não possui separadores comuns, retornar como um único item
    return [data];
  }

  // Caso não seja string nem array, converter para string
  return [String(data)];
}

// Formatar data de forma mais amigável
function formatDate(dateString) {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Date(dateString).toLocaleDateString('pt-BR', options);
}

function showError() {
  const recipeDetail = document.getElementById('recipe-detail');
  if (recipeDetail) {
    recipeDetail.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Ocorreu um erro ao carregar a receita.</p>
      </div>
    `;
  }
}
