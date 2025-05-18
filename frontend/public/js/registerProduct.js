document.addEventListener('DOMContentLoaded', function() {
  // Verificar autenticação
  if (!isLoggedInAsAdmin()) {
    window.location.href = '/login.html?redirect=/registerProduct.html';
    return;
  }

  // Inicializar o formulário
  initializeForm();
  
  // Carregar categorias para o select
  loadCategories();
});

// Verificar se o usuário está logado e é administrador
function isLoggedInAsAdmin() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user && (user.type === 'admin' || user.isAdmin === true);
  } catch (e) {
    console.error('Erro ao verificar autenticação:', e);
    return false;
  }
}

// Inicializar o formulário e seus eventos
function initializeForm() {
  const form = document.getElementById('product-form');
  if (!form) {
    console.error('Formulário de produto não encontrado!');
    return;
  }
  
  // Adicionar evento de submit
  form.addEventListener('submit', handleProductSubmit);
  
  // Configurar preview da imagem
  const imageInput = document.getElementById('product-image');
  const previewContainer = document.getElementById('image-preview');
  
  if (imageInput && previewContainer) {
    imageInput.addEventListener('change', function() {
      showImagePreview(this.files[0], previewContainer);
    });
  }
  
  // Configurar campo de tamanho personalizado
  const sizeSelect = document.getElementById('product-size');
  const customSizeContainer = document.getElementById('custom-size-container');
  
  if (sizeSelect && customSizeContainer) {
    sizeSelect.addEventListener('change', function() {
      if (this.value === 'custom') {
        customSizeContainer.style.display = 'block';
      } else {
        customSizeContainer.style.display = 'none';
      }
    });
  }
  
  // Configurar validação de data de validade (não pode ser no passado)
  const expirationInput = document.getElementById('product-expiration');
  if (expirationInput) {
    // Definir data mínima como hoje
    const today = new Date().toISOString().split('T')[0];
    expirationInput.min = today;
    
    expirationInput.addEventListener('change', function() {
      if (this.value && new Date(this.value) < new Date(today)) {
        showErrorMessage('expiration-error', 'A data de validade não pode ser no passado');
      } else {
        document.getElementById('expiration-error').textContent = '';
      }
    });
  }
  
  console.log('Formulário de cadastro de produto inicializado');
}

// Carregar categorias para o select
async function loadCategories() {
  const categorySelect = document.getElementById('product-category');
  if (!categorySelect) return;
  
  try {
    // Adicionar opção de carregamento
    categorySelect.innerHTML = '<option value="" disabled selected>Carregando categorias...</option>';
    
    // Tentar diferentes endpoints para categorias
    const possibleEndpoints = [
      '/categories',
      '/categorias',
      '/categoria'
    ];
    
    let categories = [];
    let succeeded = false;
    
    // Tentar cada endpoint até ter sucesso
    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`Tentando carregar categorias de ${API.BASE_URL}${endpoint}`);
        const response = await fetch(`${API.BASE_URL}${endpoint}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          categories = Array.isArray(data) ? data : 
                     (data.categories || data.data || data.items || []);
          succeeded = true;
          console.log(`Categorias carregadas com sucesso de ${endpoint}:`, categories);
          break;
        }
      } catch (endpointError) {
        console.warn(`Falha ao carregar de ${endpoint}:`, endpointError);
      }
    }
    
    if (!succeeded) {
      throw new Error('Não foi possível carregar as categorias de nenhum endpoint');
    }
    
    // Limpar e preencher o select
    categorySelect.innerHTML = '<option value="" disabled selected>Selecione uma categoria</option>';
    
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
    
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
    showErrorMessage('categoria-error', 'Erro ao carregar categorias. Por favor, recarregue a página.');
    
    // Adicionar botão para recarregar categorias
    const errorDiv = document.getElementById('categoria-error');
    if (errorDiv) {
      errorDiv.innerHTML += ' <button class="btn btn-sm reload-btn">Recarregar</button>';
      const reloadBtn = errorDiv.querySelector('.reload-btn');
      if (reloadBtn) {
        reloadBtn.addEventListener('click', loadCategories);
      }
    }
  }
}

// Mostrar preview da imagem
function showImagePreview(file, container) {
  if (!file || !container) return;
  
  // Limpar preview anterior
  container.innerHTML = '';
  
  // Verificar se é um arquivo de imagem
  if (!file.type.match('image.*')) {
    container.innerHTML = '<p class="error">Por favor, selecione um arquivo de imagem válido.</p>';
    return;
  }
  
  // Verificar tamanho (máx 5MB)
  if (file.size > 5 * 1024 * 1024) {
    container.innerHTML = '<p class="error">A imagem deve ter no máximo 5MB.</p>';
    return;
  }
  
  // Criar preview
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = document.createElement('img');
    img.src = e.target.result;
    img.alt = 'Preview';
    img.className = 'preview-image';
    container.appendChild(img);
  };
  reader.readAsDataURL(file);
}

// Tratar envio do formulário
async function handleProductSubmit(e) {
  e.preventDefault();
  
  // Obter elementos do formulário
  const nameInput = document.getElementById('product-name');
  const priceInput = document.getElementById('product-price');
  const stockInput = document.getElementById('product-stock');
  const expirationInput = document.getElementById('product-expiration');
  const sizeSelect = document.getElementById('product-size');
  const customSizeInput = document.getElementById('product-custom-size');
  const descriptionInput = document.getElementById('product-description');
  const categorySelect = document.getElementById('product-category');
  const imageInput = document.getElementById('product-image');
  const submitButton = document.querySelector('button[type="submit"]');
  const formErrorDisplay = document.getElementById('form-error');
  
  // Desabilitar botão e mostrar loading
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
  }
  
  // Limpar mensagens de erro anteriores
  document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
  if (formErrorDisplay) formErrorDisplay.textContent = '';

  // Validar campos
  let isValid = true;
  
  if (!nameInput.value.trim()) {
    showErrorMessage('nome-error', 'Nome do produto é obrigatório');
    isValid = false;
  }
  
  if (!priceInput.value || isNaN(parseFloat(priceInput.value.replace(',', '.')))) {
    showErrorMessage('preco-error', 'Preço inválido');
    isValid = false;
  }
  
  if (!stockInput.value || parseInt(stockInput.value) < 0) {
    showErrorMessage('stock-error', 'Quantidade em estoque deve ser um número igual ou maior que zero');
    isValid = false;
  }
  
  if (expirationInput.value) {
    const today = new Date().toISOString().split('T')[0];
    if (new Date(expirationInput.value) < new Date(today)) {
      showErrorMessage('expiration-error', 'A data de validade não pode ser no passado');
      isValid = false;
    }
  }
  
  if (sizeSelect.value === 'custom' && !customSizeInput.value.trim()) {
    showErrorMessage('size-error', 'Por favor, especifique o tamanho personalizado');
    isValid = false;
  }
  
  if (!categorySelect.value) {
    showErrorMessage('categoria-error', 'Selecione uma categoria');
    isValid = false;
  }
  
  if (!isValid) {
    // Restaurar botão
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Cadastrar Produto';
    }
    return;
  }
  
  try {
    console.log('Preparando dados para envio...');
    
    // Preparar dados do formulário
    const formData = new FormData();
    formData.append('name', nameInput.value.trim());
    formData.append('price', parseFloat(priceInput.value.replace(',', '.')));
    formData.append('stock_quantity', parseInt(stockInput.value));
    formData.append('category_id', categorySelect.value);
    
    // Adicionar data de validade se fornecida
    if (expirationInput.value) {
      formData.append('expiration_date', expirationInput.value);
    }
    
    // Adicionar tamanho
    if (sizeSelect.value) {
      if (sizeSelect.value === 'custom') {
        formData.append('size', customSizeInput.value.trim());
      } else {
        formData.append('size', sizeSelect.value);
      }
    }
    
    if (descriptionInput && descriptionInput.value.trim()) {
      formData.append('description', descriptionInput.value.trim());
    }
    
    if (imageInput && imageInput.files.length > 0) {
      formData.append('image', imageInput.files[0]);
    }
    
    // Log dos dados sendo enviados (sem a imagem para não sobrecarregar o console)
    console.log('Enviando dados:', {
      name: nameInput.value,
      price: parseFloat(priceInput.value.replace(',', '.')),
      stock_quantity: parseInt(stockInput.value),
      expiration_date: expirationInput.value || 'não especificada',
      size: sizeSelect.value === 'custom' ? customSizeInput.value : sizeSelect.value,
      category_id: categorySelect.value,
      description: descriptionInput ? descriptionInput.value : '',
      hasImage: imageInput && imageInput.files.length > 0
    });
    
    // Buscar token
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }
    
    // Determinar o endpoint correto
    let endpoint = `${API.BASE_URL}/produtos`;
    
    // Verificar se o API.js definiu um endpoint específico
    if (API.produtos && API.produtos.ENDPOINT) {
      endpoint = `${API.BASE_URL}${API.produtos.ENDPOINT}`;
    }
    
    console.log('Enviando para endpoint:', endpoint);
    
    // Enviar para a API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    console.log('Status da resposta:', response.status);
    
    if (!response.ok) {
      // Tentar obter detalhes do erro
      let errorDetail = '';
      try {
        const errorData = await response.json();
        console.error('Detalhes do erro:', errorData);
        errorDetail = errorData.message || errorData.error || '';
      } catch (parseError) {}
      
      throw new Error(`Erro ao cadastrar produto (${response.status}): ${errorDetail}`);
    }
    
    const responseData = await response.json();
    console.log('Produto cadastrado com sucesso:', responseData);
    
    // Exibir mensagem de sucesso
    if (formErrorDisplay) {
      formErrorDisplay.textContent = 'Produto cadastrado com sucesso!';
      formErrorDisplay.className = 'success-message';
    }
    
    // Usar toast se disponível
    if (window.Toast) {
      window.Toast.success('Produto cadastrado com sucesso!');
    }
    
    // Resetar formulário
    e.target.reset();
    if (document.getElementById('image-preview')) {
      document.getElementById('image-preview').innerHTML = '';
    }
    
    // Redirecionar após 2 segundos
    setTimeout(() => {
      window.location.href = '/produtos.html';
    }, 2000);
    
  } catch (error) {
    console.error('Erro ao cadastrar produto:', error);
    
    // Exibir erro
    if (formErrorDisplay) {
      formErrorDisplay.textContent = error.message || 'Erro ao cadastrar produto. Tente novamente.';
      formErrorDisplay.className = 'error-message';
    }
    
    // Usar toast se disponível
    if (window.Toast) {
      window.Toast.error(error.message || 'Erro ao cadastrar produto');
    }
  } finally {
    // Restaurar botão
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Cadastrar Produto';
    }
  }
}

// Exibir mensagem de erro
function showErrorMessage(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.className = 'error-message';
  }
}
