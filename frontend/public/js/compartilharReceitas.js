document.addEventListener('DOMContentLoaded', async function () {
  // Verificar se o usuário está autenticado
  checkAuthStatus();

  try {
    // Inicializar validação de formulário
    initFormValidation();
    
    // Carregar categorias primeiro
    await loadCategories();

    // Verificar se estamos no modo de edição
    await checkEditMode();

    // Configurar manipuladores de eventos
    setupEventListeners();

    // Configurar prévia da imagem
    setupImagePreview();
  } catch (error) {
    console.error("Erro na inicialização da página:", error);
    Notifications.error(
      'Ocorreu um erro ao inicializar da página. Tente novamente.',
      'Erro de inicialização'
    );
  }
});

// Inicializar validação do formulário
function initFormValidation() {
  // Buscar todos os campos com atributo data-required e adicionar required conforme necessário
  const imageInput = document.getElementById('recipe-image');
  if (imageInput && imageInput.getAttribute('data-required') === 'true') {
    // Inicialmente, tornamos a imagem obrigatória para criação
    imageInput.setAttribute('required', '');
    console.log('Imagem configurada como obrigatória por padrão');
  }
}

// Verificar autenticação
function checkAuthStatus() {
  const token = localStorage.getItem('token');

  if (!token) {
    // Redirecionar para a página de login se não estiver autenticado
    Notifications.warning(
      'Você precisa estar logado para compartilhar receitas',
      'Acesso restrito'
    );
    setTimeout(() => {
      window.location.href = '/login.html?redirect=/compartilharReceitas.html';
    }, 2000);
  }

  // Verificar se o token é válido (opcional)
  // Esta função pode ser expandida para verificar a validade do token com o backend
}

// Verificar se estamos no modo de edição
async function checkEditMode() {
  try {
    // Verificar se há ID de receita na URL (modo de edição)
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');
    
    console.log('Verificando modo de edição, ID da receita:', recipeId);
    
    if (!recipeId) {
      // Modo de criação de nova receita
      console.log('Modo: criação de nova receita');
      document.querySelector('.page-title').textContent = 'Compartilhar Nova Receita';
      document.getElementById('submit-btn').textContent = 'Compartilhar Receita';
      return;
    }
    
    // Modo de edição - carregar dados da receita
    console.log('Modo: edição de receita existente, ID:', recipeId);
    document.querySelector('.page-title').textContent = 'Editar Receita';
    document.getElementById('submit-btn').textContent = 'Salvar Alterações';
    
    // Adicionar classe para sinalizar que estamos no modo de edição
    document.body.classList.add('edit-mode');
    
    // Adicionar aviso visível sobre o modo de edição
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
    
    // Adicionar ID como atributo de dados ao formulário
    const form = document.getElementById('recipe-form');
    if (!form) {
      console.error('Formulário não encontrado');
      throw new Error('Elemento de formulário não encontrado');
    }
    
    form.dataset.recipeId = recipeId;
    
    // Garantir que as categorias estão carregadas antes de continuar
    await ensureCategoriesLoaded();
    
    // Buscar token de autenticação
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token de autenticação não encontrado');
      throw new Error('Você precisa estar autenticado para editar receitas');
    }
    
    console.log(`Buscando dados da receita ${recipeId} na API...`);
    
    try {
      // Usar o método API.get em vez de fetch diretamente
      const recipe = await API.get(`/recipes/${recipeId}`);
      console.log('Dados da receita carregados com sucesso:', recipe);
      
      // Verificar permissões
      if (!canEditRecipe(recipe)) {
        console.error('Usuário não tem permissão para editar esta receita');
        Notifications.error('Você não tem permissão para editar esta receita', 'Acesso negado');
        setTimeout(() => {
          window.location.href = '/receitas.html';
        }, 2000);
        return;
      }
      
      // Preencher o formulário com os dados da receita
      fillFormWithRecipeData(recipe);
      
    } catch (apiError) {
      console.error('Erro na chamada à API:', apiError);
      
      // Tentar alternativa com fetch direta como fallback
      console.log('Tentando método alternativo para buscar a receita...');
      
      try {
        const response = await fetch(`${API.BASE_URL}/recipes/${recipeId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const recipe = await response.json();
        console.log('Dados obtidos pelo método alternativo:', recipe);
        
        // Verificar permissões
        if (!canEditRecipe(recipe)) {
          throw new Error('Sem permissão para editar esta receita');
        }
        
        // Preencher formulário
        fillFormWithRecipeData(recipe);
        
      } catch (fetchError) {
        console.error('Também falhou o método alternativo:', fetchError);
        throw new Error(`Falha ao carregar dados da receita: ${apiError.message}`);
      }
    }
    
  } catch (error) {
    console.error('Erro ao verificar modo de edição:', error);
    
    // Exibir mensagem de erro mais informativa
    Notifications.error(
      `Erro ao carregar dados para edição: ${error.message}. Por favor, tente novamente ou contate o suporte.`,
      'Erro no carregamento'
    );
    
    // Verificar se existe o elemento de erro para formulário e mostrar detalhes
    const formError = document.getElementById('form-error');
    if (formError) {
      formError.textContent = `Detalhes: ${error.message}`;
      formError.classList.add('active');
    }
    
    // Adicionar botão para tentar novamente
    const formActions = document.querySelector('.form-actions');
    if (formActions) {
      formActions.innerHTML = `
        <a href="/receitas.html" class="btn btn-outline">Voltar para Receitas</a>
        <button type="button" id="retry-btn" class="btn btn-primary">Tentar Novamente</button>
      `;
      
      // Adicionar event listener para o botão de retry
      const retryBtn = document.getElementById('retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', function() {
          window.location.reload();
        });
      }
    }
    
    // Lidar com problemas específicos de categorias
    handleCategoryLoadingError();
  }
}

// Preencher formulário com dados da receita
function fillFormWithRecipeData(recipe) {
  console.log('Preenchendo formulário com dados:', recipe);
  
  // Preencher campos básicos com verificação e fallbacks
  document.getElementById('recipe-title').value = recipe.title || '';
  
  // Outros preenchimentos de campos...
  
  // Vamos inserir uma mensagem mais visível no formulário para indicar o modo de edição
  const formHeader = document.querySelector('.page-subtitle');
  if (formHeader && recipe.id) {
    formHeader.innerHTML = `Você está editando a receita <strong>"${recipe.title}"</strong>. Modifique o que for necessário e salve as alterações.`;
    formHeader.style.color = '#28a745';
  }
  
  // Verificar categoria e selecionar se disponível
  const categorySelect = document.getElementById('recipe-category');
  if (categorySelect) {
    let categoryId = recipe.categoryId;
    
    // Diferentes formatos possíveis para o ID da categoria
    if (categoryId === undefined) {
      if (recipe.category_id !== undefined) {
        categoryId = recipe.category_id;
      } else if (recipe.category && recipe.category.id !== undefined) {
        categoryId = recipe.category.id;
      }
    }
    
    if (categoryId !== undefined && categoryId !== null) {
      console.log('Tentando selecionar categoria ID:', categoryId);
      
      // Converter para string para garantir compatibilidade
      const categoryIdStr = String(categoryId);
      
      // Listar opções disponíveis para debug
      const options = Array.from(categorySelect.options);
      console.log('Opções de categoria disponíveis:', options.map(o => ({ value: o.value, text: o.textContent })));
      
      // Tentar várias abordagens para selecionar a categoria
      try {
        // Abordagem 1: Atribuição direta
        categorySelect.value = categoryIdStr;
        
        // Verificar se funcionou
        if (categorySelect.value !== categoryIdStr) {
          // Abordagem 2: Buscar element e selecionar
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
        
        // Adicionar a categoria faltante como opção temporária
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
  
  // Preencher outros campos com validação
  const difficultySelect = document.getElementById('recipe-difficulty');
  if (difficultySelect) {
    // Normalizar valores de dificuldade
    let difficulty = (recipe.difficulty || '').toLowerCase();
    if (difficulty === 'fácil' || difficulty === 'facil' || difficulty === 'easy') {
      difficulty = 'facil';
    } else if (difficulty === 'difícil' || difficulty === 'dificil' || difficulty === 'hard') {
      difficulty = 'dificil';
    } else if (!difficulty || difficulty === 'médio' || difficulty === 'medium') {
      difficulty = 'medio';
    }
    
    // Verificar se o valor existe nas opções
    const options = Array.from(difficultySelect.options);
    const hasValue = options.some(o => o.value === difficulty);
    
    difficultySelect.value = hasValue ? difficulty : 'medio';
  }
  
  // Outros campos com validação e conversão de tipo
  document.getElementById('recipe-prep-time').value = recipe.prepTime || recipe.prep_time || '';
  document.getElementById('recipe-cook-time').value = recipe.cookTime || recipe.cook_time || '';
  document.getElementById('recipe-servings').value = recipe.servings || '';
  document.getElementById('recipe-description').value = recipe.description || '';
  
  // Log para depuração de renderização dos ingredientes
  console.log('Ingredientes da receita:', recipe.ingredients);
  
  // Preencher ingredientes
  const ingredientsContainer = document.getElementById('ingredients-container');
  ingredientsContainer.innerHTML = ''; // Limpar container
  
  // Se os ingredientes estiverem em formato de string, dividir por quebras de linha
  const ingredients = typeof recipe.ingredients === 'string' 
    ? recipe.ingredients.split('\n') 
    : recipe.ingredients;
  
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
        
        // Adicionar evento de remoção
        ingredientItem.querySelector('.remove-btn').addEventListener('click', function() {
          ingredientsContainer.removeChild(ingredientItem);
        });
      }
    });
  } else {
    // Garantir que haja pelo menos um campo de ingrediente
    const ingredientItem = document.createElement('div');
    ingredientItem.className = 'ingredient-item';
    ingredientItem.innerHTML = `
      <input type="text" name="ingredients[]" placeholder="Ex: 2 xícaras de farinha de trigo" required>
      <button type="button" class="remove-btn"><i class="fas fa-times"></i></button>
    `;
    ingredientsContainer.appendChild(ingredientItem);
    
    // Adicionar evento de remoção
    ingredientItem.querySelector('.remove-btn').addEventListener('click', function() {
      ingredientsContainer.removeChild(ingredientItem);
    });
  }
  
  // Log para depuração de renderização das instruções
  console.log('Instruções da receita:', recipe.instructions);
  
  // Preencher passos de preparo
  const stepsContainer = document.getElementById('steps-container');
  stepsContainer.innerHTML = ''; // Limpar container
  
  // Se as instruções estiverem em formato de string, dividir por quebras de linha
  const instructions = typeof recipe.instructions === 'string' 
    ? recipe.instructions.split('\n') 
    : recipe.instructions;
  
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
        
        // Adicionar evento de remoção
        stepItem.querySelector('.remove-btn').addEventListener('click', function() {
          stepsContainer.removeChild(stepItem);
          updateStepNumbers();
        });
      }
    });
  } else {
    // Garantir que haja pelo menos um campo de passo
    const stepItem = document.createElement('div');
    stepItem.className = 'step-item';
    stepItem.innerHTML = `
      <div class="step-number">1</div>
      <textarea name="steps[]" rows="2" placeholder="Descreva o passo..." required></textarea>
      <button type="button" class="remove-btn"><i class="fas fa-times"></i></button>
    `;
    stepsContainer.appendChild(stepItem);
    
    // Adicionar evento de remoção
    stepItem.querySelector('.remove-btn').addEventListener('click', function() {
      stepsContainer.removeChild(stepItem);
      updateStepNumbers();
    });
  }
  
  // Se a receita tem imagem, mostrar imagem atual
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
    
    // Como já existe uma imagem, tornar o campo de imagem opcional
    const imageInput = document.getElementById('recipe-image');
    if (imageInput) {
      // FORÇAR a remoção do atributo required
      imageInput.required = false;
      imageInput.removeAttribute('required');
      console.log('Removido atributo required do campo de imagem em fillFormWithRecipeData');
      
      // Mudar o texto do campo para indicar que é opcional
      const requirementSpan = document.getElementById('image-requirement');
      if (requirementSpan) {
        requirementSpan.textContent = '(Opcional)';
      }
      // Mostrar o texto de ajuda
      const imageHelper = document.getElementById('image-helper');
      if (imageHelper) {
        imageHelper.style.display = 'block';
      }
      
      // Exibir o status da imagem 
      const imageStatus = document.getElementById('image-status');
      if (imageStatus) {
        imageStatus.style.display = 'block';
      }
    }
    
    // Armazenar a URL da imagem atual como atributo de dados do formulário
    const form = document.getElementById('recipe-form');
    if (form) {
      form.dataset.currentImageUrl = imageUrl;
    }
  }
}

// Carregar categorias do servidor
async function loadCategories() {
  try {
    console.log('Iniciando carregamento de categorias');
    const categorySelect = document.getElementById('recipe-category');
    
    if (!categorySelect) {
      console.error('Elemento select de categorias não encontrado');
      return;
    }

    // Limpar opções existentes (exceto a primeira, se for placeholder)
    const firstOption = categorySelect.querySelector('option[disabled]');
    categorySelect.innerHTML = '';
    if (firstOption) {
      categorySelect.appendChild(firstOption);
    }

    // Usar a API real para buscar categorias
    console.log('Fazendo requisição para obter categorias');
    const categories = await API.get('/categories');
    console.log('Categorias recebidas:', categories);

    // Verificar se temos categorias válidas
    if (!Array.isArray(categories) || categories.length === 0) {
      console.warn('Nenhuma categoria retornada da API');
      const option = document.createElement('option');
      option.value = "";
      option.textContent = "Sem categorias disponíveis";
      option.disabled = true;
      categorySelect.appendChild(option);
      return;
    }

    // Preencher o dropdown de categorias
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

// Configurar manipuladores de eventos
function setupEventListeners() {
  // Adicionar ingrediente
  document.getElementById('add-ingredient').addEventListener('click', function () {
    const container = document.getElementById('ingredients-container');
    const newIngredient = document.createElement('div');
    newIngredient.className = 'ingredient-item';
    newIngredient.innerHTML = `
            <input type="text" name="ingredients[]" placeholder="Ex: 2 xícaras de farinha de trigo" required>
            <button type="button" class="remove-btn"><i class="fas fa-times"></i></button>
        `;
    container.appendChild(newIngredient);

    // Adicionar evento de remoção
    newIngredient.querySelector('.remove-btn').addEventListener('click', function () {
      container.removeChild(newIngredient);
    });
  });

  // Adicionar passo
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

    // Adicionar evento de remoção
    newStep.querySelector('.remove-btn').addEventListener('click', function () {
      container.removeChild(newStep);
      // Atualizar números dos passos
      updateStepNumbers();
    });
  });

  // Botão cancelar - usar o sistema de confirmação
  document.getElementById('cancel-btn').addEventListener('click', function () {
    Notifications.confirm(
      'Tem certeza que deseja cancelar? Todas as informações preenchidas serão perdidas.',
      // Callback quando confirmado
      function () {
        window.location.href = '/receitas.html';
      },
      // Callback quando cancelado
      null,
      // Opções adicionais
      {
        title: 'Cancelar edição',
        confirmText: 'Sim, cancelar',
        cancelText: 'Continuar editando',
      }
    );
  });

  // Submissão do formulário
  document.getElementById('recipe-form').addEventListener('submit', function(e) {
    console.log('Formulário enviado');
    e.preventDefault();
    
    // Validar o formulário antes de processar
    if (!validateForm()) {
      console.error('Validação falhou');
      return;
    }
    
    // Adicionar classe para mostrar o spinner de carregamento
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    // Processar e enviar o formulário
    handleFormSubmit(e);
  });

  // Configurar eventos de remoção para os itens iniciais
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

// Validar formulário antes do envio
function validateForm() {
  let isValid = true;
  
  // Verificar se estamos em modo de edição
  const form = document.getElementById('recipe-form');
  const isEditMode = !!form.dataset.recipeId;
  const hasCurrentImage = !!form.dataset.currentImageUrl;
  
  // Lista de campos obrigatórios (exceto a imagem que tem regra especial)
  const requiredFields = [
    { id: 'recipe-title', name: 'Título' },
    { id: 'recipe-category', name: 'Categoria' },
    { id: 'recipe-difficulty', name: 'Nível de dificuldade' },
    { id: 'recipe-prep-time', name: 'Tempo de preparo' },
    { id: 'recipe-cook-time', name: 'Tempo de cozimento' },
    { id: 'recipe-servings', name: 'Rendimento' },
    { id: 'recipe-description', name: 'Descrição' }
  ];
  
  // Verificar todos os campos obrigatórios
  requiredFields.forEach(field => {
    const element = document.getElementById(field.id);
    if (!element || !element.value.trim()) {
      showError(`${field.id}-error`, `O campo ${field.name} é obrigatório.`);
      isValid = false;
    }
  });
  
  // Verificar ingredientes
  const ingredients = document.querySelectorAll('input[name="ingredients[]"]');
  if (ingredients.length === 0 || !Array.from(ingredients).some(i => i.value.trim())) {
    showError('ingredients-error', 'Adicione pelo menos um ingrediente.');
    isValid = false;
  }
  
  // Verificar passos
  const steps = document.querySelectorAll('textarea[name="steps[]"]');
  if (steps.length === 0 || !Array.from(steps).some(s => s.value.trim())) {
    showError('steps-error', 'Adicione pelo menos um passo no modo de preparo.');
    isValid = false;
  }
  
  // Verificar o campo de imagem
  const imageInput = document.getElementById('recipe-image');
  const hasNewImage = imageInput && imageInput.files && imageInput.files.length > 0;
  
  // Se estamos editando e temos uma imagem atual, o campo é opcional
  if (isEditMode && hasCurrentImage && !hasNewImage) {
    console.log('Validação: imagem atual será mantida, campo de imagem é opcional');
    // A imagem é opcional nesse caso, não precisamos fazer nada
  } else if (!hasNewImage && !isEditMode) {
    // Sem imagem selecionada em modo de criação de nova receita
    showError('image-error', 'Por favor, selecione uma imagem para a receita.');
    console.log('Validação: sem imagem selecionada em modo de criação. Validação falha.');
    isValid = false;
  }
  
  // Se o formulário não é válido, exibir mensagem geral
  if (!isValid) {
    showError('form-error', 'Por favor, corrija os erros no formulário antes de prosseguir.');
    // Reativar o botão de envio se foi desativado
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  }
  
  return isValid;
}

// Atualizar números dos passos após remoção
function updateStepNumbers() {
  const stepItems = document.querySelectorAll('.step-item');
  stepItems.forEach((item, index) => {
    item.querySelector('.step-number').textContent = index + 1;
  });
}

// Configurar prévia da imagem
function setupImagePreview() {
  const imageInput = document.getElementById('recipe-image');
  const imagePreview = document.getElementById('image-preview');
  const fileName = document.getElementById('file-name');

  imageInput.addEventListener('change', function () {
    if (this.files && this.files[0]) {
      const file = this.files[0];

      // Verificar se é uma imagem
      if (!file.type.match('image.*')) {
        showError('image-error', 'Por favor, selecione um arquivo de imagem válido.');
        imagePreview.style.display = 'none';
        fileName.textContent = 'Arquivo inválido';
        return;
      }

      // Exibir nome do arquivo
      fileName.textContent = file.name;

      // Criar prévia da imagem
      const reader = new FileReader();
      reader.onload = function (e) {
        imagePreview.src = e.target.result;
        imagePreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });
}

// Manipular envio do formulário
async function handleFormSubmit(e) {
  e.preventDefault();

  try {
    const form = document.getElementById('recipe-form');
    const formData = new FormData(form);

    // Verificar se estamos em modo de edição ou criação
    const recipeId = form.dataset.recipeId;
    const isEditMode = !!recipeId;
    
    // Armazenar a URL da imagem atual ao editar
    const currentImageUrl = form.dataset.currentImageUrl || null;
    
    console.log('Formulário submetido. Modo de edição:', isEditMode ? 'Sim' : 'Não', 'ID:', recipeId);
    console.log('URL da imagem atual:', currentImageUrl);

    // Coletar múltiplos ingredientes e passos corretamente
    const ingredients = Array.from(document.querySelectorAll('input[name="ingredients[]"]'))
      .map(input => input.value.trim())
      .filter(value => value); // Remover valores vazios
    
    const steps = Array.from(document.querySelectorAll('textarea[name="steps[]"]'))
      .map(textarea => textarea.value.trim())
      .filter(value => value); // Remover valores vazios

    if (ingredients.length === 0) {
      throw new Error('Adicione pelo menos um ingrediente à receita');
    }

    if (steps.length === 0) {
      throw new Error('Adicione pelo menos um passo ao modo de preparo');
    }

    // Remover os campos de array original
    formData.delete('ingredients[]');
    formData.delete('steps[]');

    // Adicionar tags como array
    const tagsString = formData.get('tags');
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    formData.delete('tags');

    // Obter o token de autenticação
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Você precisa estar autenticado para compartilhar receitas');
    }

    // Obter dados do usuário do localStorage
    const user = JSON.parse(localStorage.getItem('user')) || {};
    if (!user.id) {
      throw new Error('Informações do usuário não encontradas. Tente fazer login novamente');
    }

    // Verificar se há uma nova imagem selecionada
    const imageInput = document.getElementById('recipe-image');
    const hasNewImage = imageInput && imageInput.files && imageInput.files.length > 0;
    
    // Construir objeto de dados para a API
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
      userId: user.id
    };
    
    // Se estamos em modo de edição e temos uma URL de imagem atual mas nenhuma nova imagem foi selecionada
    if (isEditMode && currentImageUrl && !hasNewImage) {
      // Manter a URL da imagem atual
      recipeData.imageUrl = currentImageUrl;
      console.log('Mantendo a imagem atual:', currentImageUrl);
    }

    console.log('Dados da receita a serem enviados:', recipeData);
    
    // Configurar URL e método baseado no modo (edição ou criação)
    let url = `${API.BASE_URL}/recipes`;
    let method = 'POST';
    let successMessage = 'Sua receita foi compartilhada com sucesso!';
    let successTitle = 'Receita salva';
    
    if (isEditMode) {
      url = `${API.BASE_URL}/recipes/${recipeId}`;
      method = 'PUT';
      successMessage = 'Sua receita foi atualizada com sucesso!';
      successTitle = 'Receita atualizada';
      console.log(`Atualizando receita ${recipeId} com URL: ${url}`);
    } else {
      console.log('Criando nova receita');
    }

    // Enviar dados da receita para o servidor
    console.log(`Enviando requisição ${method} para ${url}`);
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(recipeData),
    });

    // Verificar resposta para erros
    if (!response.ok) {
      let errorMessage = 'Falha ao salvar receita';

      try {
        // Tentar obter mensagem de erro detalhada do servidor
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

    // Fazer upload da imagem somente se uma nova imagem foi selecionada
    if (hasNewImage) {
      const targetRecipeId = isEditMode ? recipeId : savedRecipe.id;
      const imageFormData = new FormData();
      imageFormData.append('image', imageInput.files[0]);

      try {
        console.log(`Enviando nova imagem para receita ${targetRecipeId}`);
        const imageResponse = await fetch(`${API.BASE_URL}/recipes/${targetRecipeId}/image`, {
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

    // Redirecionar após alguns segundos
    setTimeout(() => {
      window.location.href = `/receita.html?id=${isEditMode ? recipeId : savedRecipe.id}`;
    }, 2000);
  } catch (error) {
    console.error('Erro ao enviar receita:', error);
    Notifications.error(
      error.message || 'Verifique os dados e tente novamente.',
      'Erro ao compartilhar receita'
    );
    
    // Reativar o botão
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  }
}

// Mostrar mensagem de erro
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  errorElement.textContent = message;
  errorElement.classList.add('active');

  // Notificação toast para erros críticos
  if (elementId === 'form-error') {
    Notifications.error(message, 'Erro no formulário');
  }

  // Remover depois de 5 segundos
  setTimeout(() => {
    errorElement.classList.remove('active');
    errorElement.textContent = '';
  }, 5000);
}
