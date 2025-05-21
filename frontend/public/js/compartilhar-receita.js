document.addEventListener('DOMContentLoaded', async function () {
  checkAuthStatus();

  try {
    initFormValidation();

    await loadCategories();

    await checkEditMode();

    setupEventListeners();

    setupImagePreview();
  } catch (error) {
    console.error('Erro na inicialização da página:', error);
    Notifications.error(
      'Ocorreu um erro ao inicializar da página. Tente novamente.',
      'Erro de inicialização'
    );
  }
});

function initFormValidation() {
  const imageInput = document.getElementById('recipe-image');
  if (imageInput && imageInput.getAttribute('data-required') === 'true') {
    imageInput.setAttribute('required', '');
    console.log('Imagem configurada como obrigatória por padrão');
  }
}

function checkAuthStatus() {
  const token = localStorage.getItem('token');

  if (!token) {
    Notifications.warning(
      'Você precisa estar logado para compartilhar receitas',
      'Acesso restrito'
    );
    setTimeout(() => {
      window.location.href = '/login.html?redirect=/compartilhar-receita.html';
    }, 2000);
  }
}

async function checkEditMode() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

    console.log('Verificando modo de edição, ID da receita:', recipeId);

    if (!recipeId) {
      console.log('Modo: criação de nova receita');
      document.querySelector('.page-title').textContent = 'Compartilhar Nova Receita';
      document.getElementById('submit-btn').textContent = 'Compartilhar Receita';
      return;
    }

    console.log('Modo: edição de receita existente, ID:', recipeId);
    document.querySelector('.page-title').textContent = 'Editar Receita';
    document.getElementById('submit-btn').textContent = 'Salvar Alterações';

    document.body.classList.add('edit-mode');

    const pageHeader = document.querySelector('.page-header');
    if (pageHeader) {
      const editModeAlert = document.createElement('div');
      editModeAlert.className = 'edit-mode-alert';
      editModeAlert.innerHTML = `
        <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 10px; margin: 10px 0; border-radius: 4px;">
          <p style="margin: 0; color: #155724;"><i class="fas fa-edit"></i> <strong>Modo de Edição:</strong> Você pode atualizar os detalhes da receita. A imagem atual será mantida se você não selecionar uma nova.</p>
        </div>
      `;
      pageHeader.appendChild(editModeAlert);
    }

    const form = document.getElementById('recipe-form');
    if (!form) {
      console.error('Formulário não encontrado');
      throw new Error('Elemento de formulário não encontrado');
    }

    form.dataset.recipeId = recipeId;

    await ensureCategoriesLoaded();

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token de autenticação não encontrado');
      throw new Error('Você precisa estar autenticado para editar receitas');
    }

    console.log(`Buscando dados da receita ${recipeId} na API...`);

    try {
      const recipe = await API.get(`/recipe/${recipeId}`);
      console.log('Dados da receita carregados com sucesso:', recipe);

      if (!canEditRecipe(recipe)) {
        console.error('Usuário não tem permissão para editar esta receita');
        Notifications.error('Você não tem permissão para editar esta receita', 'Acesso negado');
        setTimeout(() => {
          window.location.href = '/receitas.html';
        }, 2000);
        return;
      }

      fillFormWithRecipeData(recipe);
    } catch (apiError) {
      console.error('Erro na chamada à API:', apiError);

      console.log('Tentando método alternativo para buscar a receita...');

      try {
        const response = await fetch(`${API.BASE_URL}/recipe/${recipeId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }

        const recipe = await response.json();
        console.log('Dados obtidos pelo método alternativo:', recipe);

        if (!canEditRecipe(recipe)) {
          throw new Error('Sem permissão para editar esta receita');
        }

        fillFormWithRecipeData(recipe);
      } catch (fetchError) {
        console.error('Também falhou o método alternativo:', fetchError);
        throw new Error(`Falha ao carregar dados da receita: ${apiError.message}`);
      }
    }
  } catch (error) {
    console.error('Erro ao verificar modo de edição:', error);

    Notifications.error(
      `Erro ao carregar dados para edição: ${error.message}. Por favor, tente novamente ou contate o suporte.`,
      'Erro no carregamento'
    );

    const formError = document.getElementById('form-error');
    if (formError) {
      formError.textContent = `Detalhes: ${error.message}`;
      formError.classList.add('active');
    }

    const formActions = document.querySelector('.form-actions');
    if (formActions) {
      formActions.innerHTML = `
        <a href="/receitas.html" class="btn btn-outline">Voltar para Receitas</a>
        <button type="button" id="retry-btn" class="btn btn-primary">Tentar Novamente</button>
      `;

      const retryBtn = document.getElementById('retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', function () {
          window.location.reload();
        });
      }
    }

    handleCategoryLoadingError();
  }
}

function fillFormWithRecipeData(recipe) {
  console.log('Preenchendo formulário com dados:', recipe);

  document.getElementById('recipe-title').value = recipe.title || '';


  const formHeader = document.querySelector('.page-subtitle');
  if (formHeader && recipe.id) {
    formHeader.innerHTML = `Você está editando a receita <strong>"${recipe.title}"</strong>. Modifique o que for necessário e salve as alterações.`;
    formHeader.style.color = '#28a745';
  }

  const categorySelect = document.getElementById('recipe-category');
  if (categorySelect) {
    let categoryId = recipe.categoryId;

    if (categoryId === undefined) {
      if (recipe.category_id !== undefined) {
        categoryId = recipe.category_id;
      } else if (recipe.category && recipe.category.id !== undefined) {
        categoryId = recipe.category.id;
      }
    }

    if (categoryId !== undefined && categoryId !== null) {
      console.log('Tentando selecionar categoria ID:', categoryId);

      const categoryIdStr = String(categoryId);

      const options = Array.from(categorySelect.options);
      console.log(
        'Opções de categoria disponíveis:',
        options.map(o => ({ value: o.value, text: o.textContent }))
      );

      try {
        categorySelect.value = categoryIdStr;

        if (categorySelect.value !== categoryIdStr) {
          const option = categorySelect.querySelector(`option[value="${categoryIdStr}"]`);
          if (option) {
            option.selected = true;
          } else {
            throw new Error('Opção não encontrada');
          }
        }

        console.log('Categoria selecionada:', categorySelect.value);
      } catch (e) {
        console.warn('Falha ao selecionar categoria:', e);

        if (recipe.category && recipe.category.name) {
          const tempOption = document.createElement('option');
          tempOption.value = categoryIdStr;
          tempOption.textContent = recipe.category.name + ' (carregamento temporário)';
          categorySelect.appendChild(tempOption);
          categorySelect.value = categoryIdStr;
          console.log('Adicionada categoria temporária:', recipe.category.name);
        }
      }
    } else {
      console.warn('ID de categoria não definido na receita:', recipe);
    }
  } else {
    console.error('Elemento select de categoria não encontrado');
  }

  const difficultySelect = document.getElementById('recipe-difficulty');
  if (difficultySelect) {
    let difficulty = (recipe.difficulty || '').toLowerCase();
    if (difficulty === 'fácil' || difficulty === 'facil' || difficulty === 'easy') {
      difficulty = 'facil';
    } else if (difficulty === 'difícil' || difficulty === 'dificil' || difficulty === 'hard') {
      difficulty = 'dificil';
    } else if (!difficulty || difficulty === 'médio' || difficulty === 'medium') {
      difficulty = 'medio';
    }

    const options = Array.from(difficultySelect.options);
    const hasValue = options.some(o => o.value === difficulty);

    difficultySelect.value = hasValue ? difficulty : 'medio';
  }

  document.getElementById('recipe-prep-time').value = recipe.prepTime || recipe.prep_time || '';
  document.getElementById('recipe-cook-time').value = recipe.cookTime || recipe.cook_time || '';
  document.getElementById('recipe-servings').value = recipe.servings || '';
  document.getElementById('recipe-description').value = recipe.description || '';

  console.log('Ingredientes da receita:', recipe.ingredients);

  const ingredientsContainer = document.getElementById('ingredients-container');
  ingredientsContainer.innerHTML = '';  

  const ingredients =
    typeof recipe.ingredients === 'string' ? recipe.ingredients.split('\n') : recipe.ingredients;

  console.log('Ingredientes processados:', ingredients);

  if (ingredients && ingredients.length > 0) {
    ingredients.forEach(ingredient => {
      if (ingredient && ingredient.trim()) {
        const ingredientItem = document.createElement('div');
        ingredientItem.className = 'ingredient-item';
        ingredientItem.innerHTML = `
          <input type="text" name="ingredients[]" value="${ingredient.trim()}" required>
          <button type="button" class="remove-btn"><i class="fas fa-times"></i></button>
        `;
        ingredientsContainer.appendChild(ingredientItem);

        ingredientItem.querySelector('.remove-btn').addEventListener('click', function () {
          ingredientsContainer.removeChild(ingredientItem);
        });
      }
    });
  } else {
    const ingredientItem = document.createElement('div');
    ingredientItem.className = 'ingredient-item';
    ingredientItem.innerHTML = `
      <input type="text" name="ingredients[]" placeholder="Ex: 2 xícaras de farinha de trigo" required>
      <button type="button" class="remove-btn"><i class="fas fa-times"></i></button>
    `;
    ingredientsContainer.appendChild(ingredientItem);

    ingredientItem.querySelector('.remove-btn').addEventListener('click', function () {
      ingredientsContainer.removeChild(ingredientItem);
    });
  }

  console.log('Instruções da receita:', recipe.instructions);

  const stepsContainer = document.getElementById('steps-container');
  stepsContainer.innerHTML = ''; 

  const instructions =
    typeof recipe.instructions === 'string' ? recipe.instructions.split('\n') : recipe.instructions;

  console.log('Instruções processadas:', instructions);

  if (instructions && instructions.length > 0) {
    instructions.forEach((step, index) => {
      if (step && step.trim()) {
        const stepItem = document.createElement('div');
        stepItem.className = 'step-item';
        stepItem.innerHTML = `
          <div class="step-number">${index + 1}</div>
          <textarea name="steps[]" rows="2" required>${step.trim()}</textarea>
          <button type="button" class="remove-btn"><i class="fas fa-times"></i></button>
        `;
        stepsContainer.appendChild(stepItem);

        stepItem.querySelector('.remove-btn').addEventListener('click', function () {
          stepsContainer.removeChild(stepItem);
          updateStepNumbers();
        });
      }
    });
  } else {
    const stepItem = document.createElement('div');
    stepItem.className = 'step-item';
    stepItem.innerHTML = `
      <div class="step-number">1</div>
      <textarea name="steps[]" rows="2" placeholder="Descreva o passo..." required></textarea>
      <button type="button" class="remove-btn"><i class="fas fa-times"></i></button>
    `;
    stepsContainer.appendChild(stepItem);

    stepItem.querySelector('.remove-btn').addEventListener('click', function () {
      stepsContainer.removeChild(stepItem);
      updateStepNumbers();
    });
  }

  if (recipe.imageUrl || recipe.image_url) {
    const imageUrl = recipe.imageUrl || recipe.image_url;
    console.log('Exibindo imagem da receita:', imageUrl);

    const imagePreview = document.getElementById('image-preview');
    imagePreview.src = imageUrl;
    imagePreview.style.display = 'block';

    const fileNameEl = document.getElementById('file-name');
    if (fileNameEl) {
      fileNameEl.textContent = 'Imagem atual';
    }

    const imageInput = document.getElementById('recipe-image');
    if (imageInput) {
      imageInput.required = false;
      imageInput.removeAttribute('required');
      console.log('Removido atributo required do campo de imagem em fillFormWithRecipeData');

      const requirementSpan = document.getElementById('image-requirement');
      if (requirementSpan) {
        requirementSpan.textContent = '(Opcional)';
      }
      const imageHelper = document.getElementById('image-helper');
      if (imageHelper) {
        imageHelper.style.display = 'block';
      }

      const imageStatus = document.getElementById('image-status');
      if (imageStatus) {
        imageStatus.style.display = 'block';
      }
    }

    const form = document.getElementById('recipe-form');
    if (form) {
      form.dataset.currentImageUrl = imageUrl;
    }
  }
}

async function loadCategories() {
  try {
    console.log('Iniciando carregamento de categorias');
    const categorySelect = document.getElementById('recipe-category');

    if (!categorySelect) {
      console.error('Elemento select de categorias não encontrado');
      return;
    }

    const firstOption = categorySelect.querySelector('option[disabled]');
    categorySelect.innerHTML = '';
    if (firstOption) {
      categorySelect.appendChild(firstOption);
    }

    console.log('Fazendo requisição para obter categorias');
    const categories = await API.get('/category');
    console.log('Categorias recebidas:', categories);

    if (!Array.isArray(categories) || categories.length === 0) {
      console.warn('Nenhuma categoria retornada da API');
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Sem categorias disponíveis';
      option.disabled = true;
      categorySelect.appendChild(option);
      return;
    }

    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });

    console.log(`${categories.length} categorias carregadas com sucesso`);
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
    showError('category-error', 'Não foi possível carregar as categorias. Tente novamente.');
    throw new Error('Falha ao carregar categorias');
  }
}

function setupEventListeners() {
  document.getElementById('add-ingredient').addEventListener('click', function () {
    const container = document.getElementById('ingredients-container');
    const newIngredient = document.createElement('div');
    newIngredient.className = 'ingredient-item';
    newIngredient.innerHTML = `
            <input type="text" name="ingredients[]" placeholder="Ex: 2 xícaras de farinha de trigo" required>
            <button type="button" class="remove-btn"><i class="fas fa-times"></i></button>
        `;
    container.appendChild(newIngredient);

    newIngredient.querySelector('.remove-btn').addEventListener('click', function () {
      container.removeChild(newIngredient);
    });
  });

  document.getElementById('add-step').addEventListener('click', function () {
    const container = document.getElementById('steps-container');
    const stepsCount = container.children.length + 1;

    const newStep = document.createElement('div');
    newStep.className = 'step-item';
    newStep.innerHTML = `
            <div class="step-number">${stepsCount}</div>
            <textarea name="steps[]" rows="2" placeholder="Descreva o passo..." required></textarea>
            <button type="button" class="remove-btn"><i class="fas fa-times"></i></button>
        `;
    container.appendChild(newStep);

    newStep.querySelector('.remove-btn').addEventListener('click', function () {
      container.removeChild(newStep);

      updateStepNumbers();
    });
  });

  document.getElementById('cancel-btn').addEventListener('click', function () {
    Notifications.confirm(
      'Tem certeza que deseja cancelar? Todas as informações preenchidas serão perdidas.',

      function () {
        window.location.href = '/receitas.html';
      },

      null,

      {
        title: 'Cancelar edição',
        confirmText: 'Sim, cancelar',
        cancelText: 'Continuar editando',
      }
    );
  });

  document.getElementById('recipe-form').addEventListener('submit', function (e) {
    console.log('Formulário enviado');
    e.preventDefault();

    if (!validateForm()) {
      console.error('Validação falhou');
      return;
    }

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    handleFormSubmit(e);
  });

  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const item = this.closest('.ingredient-item, .step-item');
      const container = item.parentElement;
      container.removeChild(item);

      if (item.classList.contains('step-item')) {
        updateStepNumbers();
      }
    });
  });
}

function validateForm() {
  let isValid = true;

  const form = document.getElementById('recipe-form');
  const isEditMode = !!form.dataset.recipeId;
  const hasCurrentImage = !!form.dataset.currentImageUrl;

  const requiredFields = [
    { id: 'recipe-title', name: 'Título' },
    { id: 'recipe-category', name: 'Categoria' },
    { id: 'recipe-difficulty', name: 'Nível de dificuldade' },
    { id: 'recipe-prep-time', name: 'Tempo de preparo' },
    { id: 'recipe-cook-time', name: 'Tempo de cozimento' },
    { id: 'recipe-servings', name: 'Rendimento' },
    { id: 'recipe-description', name: 'Descrição' },
  ];

  requiredFields.forEach(field => {
    const element = document.getElementById(field.id);
    if (!element || !element.value.trim()) {
      showError(`${field.id}-error`, `O campo ${field.name} é obrigatório.`);
      isValid = false;
    }
  });

  const ingredients = document.querySelectorAll('input[name="ingredients[]"]');
  if (ingredients.length === 0 || !Array.from(ingredients).some(i => i.value.trim())) {
    showError('ingredients-error', 'Adicione pelo menos um ingrediente.');
    isValid = false;
  }

  const steps = document.querySelectorAll('textarea[name="steps[]"]');
  if (steps.length === 0 || !Array.from(steps).some(s => s.value.trim())) {
    showError('steps-error', 'Adicione pelo menos um passo no modo de preparo.');
    isValid = false;
  }

  const imageInput = document.getElementById('recipe-image');
  const hasNewImage = imageInput && imageInput.files && imageInput.files.length > 0;

  if (isEditMode && hasCurrentImage && !hasNewImage) {
    console.log('Validação: imagem atual será mantida, campo de imagem é opcional');
  } else if (!hasNewImage && !isEditMode) {
    showError('image-error', 'Por favor, selecione uma imagem para a receita.');
    console.log('Validação: sem imagem selecionada em modo de criação. Validação falha.');
    isValid = false;
  }

  if (!isValid) {
    showError('form-error', 'Por favor, corrija os erros no formulário antes de prosseguir.');
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  }

  return isValid;
}

function updateStepNumbers() {
  const stepItems = document.querySelectorAll('.step-item');
  stepItems.forEach((item, index) => {
    item.querySelector('.step-number').textContent = index + 1;
  });
}

function setupImagePreview() {
  const imageInput = document.getElementById('recipe-image');
  const imagePreview = document.getElementById('image-preview');
  const fileName = document.getElementById('file-name');

  imageInput.addEventListener('change', function () {
    if (this.files && this.files[0]) {
      const file = this.files[0];

      if (!file.type.match('image.*')) {
        showError('image-error', 'Por favor, selecione um arquivo de imagem válido.');
        imagePreview.style.display = 'none';
        fileName.textContent = 'Arquivo inválido';
        return;
      }

      fileName.textContent = file.name;

      const reader = new FileReader();
      reader.onload = function (e) {
        imagePreview.src = e.target.result;
        imagePreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });
}

async function handleFormSubmit(e) {
  e.preventDefault();

  try {
    const form = document.getElementById('recipe-form');
    const formData = new FormData(form);

    const recipeId = form.dataset.recipeId;
    const isEditMode = !!recipeId;

    const currentImageUrl = form.dataset.currentImageUrl || null;

    console.log(
      'Formulário submetido. Modo de edição:',
      isEditMode ? 'Sim' : 'Não',
      'ID:',
      recipeId
    );
    console.log('URL da imagem atual:', currentImageUrl);

    const ingredients = Array.from(document.querySelectorAll('input[name="ingredients[]"]'))
      .map(input => input.value.trim())
      .filter(value => value); 

    const steps = Array.from(document.querySelectorAll('textarea[name="steps[]"]'))
      .map(textarea => textarea.value.trim())
      .filter(value => value); 

    if (ingredients.length === 0) {
      throw new Error('Adicione pelo menos um ingrediente à receita');
    }

    if (steps.length === 0) {
      throw new Error('Adicione pelo menos um passo ao modo de preparo');
    }

    formData.delete('ingredients[]');
    formData.delete('steps[]');

    const tagsString = formData.get('tags');
    const tags = tagsString
      ? tagsString
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag)
      : [];
    formData.delete('tags');

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Você precisa estar autenticado para compartilhar receitas');
    }

    const user = JSON.parse(localStorage.getItem('user')) || {};
    if (!user.id) {
      throw new Error('Informações do usuário não encontradas. Tente fazer login novamente');
    }

    const imageInput = document.getElementById('recipe-image');
    const hasNewImage = imageInput && imageInput.files && imageInput.files.length > 0;

    const recipeData = {
      title: formData.get('title'),
      categoryId: parseInt(formData.get('category')),
      difficulty: formData.get('difficulty'),
      prepTime: parseInt(formData.get('prepTime')),
      cookTime: parseInt(formData.get('cookTime')),
      servings: parseInt(formData.get('servings')),
      description: formData.get('description'),
      ingredients: ingredients.join('\n'),
      instructions: steps.join('\n'),
      userId: user.id,
    };

    if (isEditMode && currentImageUrl && !hasNewImage) {
      recipeData.imageUrl = currentImageUrl;
      console.log('Mantendo a imagem atual:', currentImageUrl);
    }

    console.log('Dados da receita a serem enviados:', recipeData);

    let url = `${API.BASE_URL}/recipe`;
    let method = 'POST';
    let successMessage = 'Sua receita foi compartilhada com sucesso!';
    let successTitle = 'Receita salva';

    if (isEditMode) {
      url = `${API.BASE_URL}/recipe/${recipeId}`;
      method = 'PUT';
      successMessage = 'Sua receita foi atualizada com sucesso!';
      successTitle = 'Receita atualizada';
      console.log(`Atualizando receita ${recipeId} com URL: ${url}`);
    } else {
      console.log('Criando nova receita');
    }

    console.log(`Enviando requisição ${method} para ${url}`);
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(recipeData),
    });

    if (!response.ok) {
      let errorMessage = 'Falha ao salvar receita';

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.error('Detalhes do erro:', errorData);
      } catch (jsonError) {
        console.error('Erro ao processar resposta de erro:', jsonError);
      }

      throw new Error(errorMessage);
    }

    const savedRecipe = await response.json();
    console.log('Receita salva com sucesso:', savedRecipe);

    if (hasNewImage) {
      const targetRecipeId = isEditMode ? recipeId : savedRecipe.id;
      const imageFormData = new FormData();
      imageFormData.append('image', imageInput.files[0]);

      try {
        console.log(`Enviando nova imagem para receita ${targetRecipeId}`);
        const imageResponse = await fetch(`${API.BASE_URL}/recipe/${targetRecipeId}/image`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: imageFormData,
        });

        if (!imageResponse.ok) {
          console.warn('A receita foi salva, mas houve problema ao enviar a imagem');
        } else {
          console.log('Nova imagem enviada com sucesso');
        }
      } catch (imageError) {
        console.warn('Erro ao enviar imagem:', imageError);
      }
    } else if (isEditMode) {
      console.log('Nenhuma nova imagem fornecida. Mantendo a imagem existente.');
    } else {
      console.log('Nenhuma imagem fornecida para a nova receita.');
    }

    Notifications.success(successMessage, successTitle);

    setTimeout(() => {
      window.location.href = `/receita.html?id=${isEditMode ? recipeId : savedRecipe.id}`;
    }, 2000);
  } catch (error) {
    console.error('Erro ao enviar receita:', error);
    Notifications.error(
      error.message || 'Verifique os dados e tente novamente.',
      'Erro ao compartilhar receita'
    );

    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  }
}

function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  errorElement.textContent = message;
  errorElement.classList.add('active');

  if (elementId === 'form-error') {
    Notifications.error(message, 'Erro no formulário');
  }

  setTimeout(() => {
    errorElement.classList.remove('active');
    errorElement.textContent = '';
  }, 5000);
}
