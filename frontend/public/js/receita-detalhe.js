document.addEventListener('DOMContentLoaded', async function() {
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

  recipeDetail.innerHTML = `
    <div class="recipe-header">
      <h1 class="recipe-title">${recipe.title}</h1>
      <div class="recipe-meta">
        <span class="recipe-author"><i class="fas fa-user"></i> ${recipe.author.name}</span>
        <span class="recipe-date"><i class="far fa-calendar"></i> ${new Date(recipe.createdAt).toLocaleDateString('pt-BR')}</span>
        <span class="recipe-views"><i class="far fa-eye"></i> ${recipe.views}</span>
      </div>
    </div>
    <div class="recipe-image">
      <img src="${recipe.image_url || '/assets/placeholder.jpg'}" alt="${recipe.title}">
    </div>
    <div class="recipe-content">
      <h2>Ingredientes</h2>
      <ul class="recipe-ingredients"></ul>
      <h2>Modo de Preparo</h2>
      <ol class="recipe-instructions"></ol>
    </div>
  `;

  // Processar ingredientes
  const ingredientsList = document.querySelector('.recipe-ingredients ul');
  if (ingredientsList) {
    // Limpar a lista
    ingredientsList.innerHTML = '';
    
    // Verificar se os ingredientes são uma string e dividi-la em linhas
    let ingredients = recipe.ingredients;
    if (typeof ingredients === 'string') {
      ingredients = ingredients.split('\n');
    } 
    // Caso seja uma string JSON
    else if (typeof ingredients === 'string' && (ingredients.startsWith('[') || ingredients.includes(','))) {
      try {
        ingredients = JSON.parse(ingredients);
      } catch (e) {
        ingredients = ingredients.split(',');
      }
    }
    
    // Garantir que temos um array para iterar
    if (!Array.isArray(ingredients)) {
      ingredients = [ingredients];
    }
    
    // Adicionar cada ingrediente à lista
    ingredients.forEach(ingredient => {
      if (ingredient && ingredient.trim()) {
        const li = document.createElement('li');
        li.textContent = ingredient.trim();
        ingredientsList.appendChild(li);
      }
    });
  }
  
  // Processar instruções de forma semelhante
  const instructionsList = document.querySelector('.recipe-instructions ol');
  if (instructionsList) {
    // Limpar a lista
    instructionsList.innerHTML = '';
    
    // Verificar se as instruções são uma string e dividi-la em linhas
    let instructions = recipe.instructions;
    if (typeof instructions === 'string') {
      instructions = instructions.split('\n');
    } 
    // Caso seja uma string JSON
    else if (typeof instructions === 'string' && (instructions.startsWith('[') || instructions.includes(','))) {
      try {
        instructions = JSON.parse(instructions);
      } catch (e) {
        instructions = instructions.split(',');
      }
    }
    
    // Garantir que temos um array para iterar
    if (!Array.isArray(instructions)) {
      instructions = [instructions];
    }
    
    // Adicionar cada passo à lista
    instructions.forEach(step => {
      if (step && step.trim()) {
        const li = document.createElement('li');
        li.textContent = step.trim();
        instructionsList.appendChild(li);
      }
    });
  }
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