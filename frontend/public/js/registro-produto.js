document.addEventListener('DOMContentLoaded', function () {
  if (!isLoggedInAsAdmin()) {
    window.location.href = '/login.html?redirect=/registro-produto.html';
    return;
  }

  initializeForm();

  loadCategories();
});

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

function initializeForm() {
  const form = document.getElementById('product-form');
  if (!form) {
    console.error('Formulário de produto não encontrado!');
    return;
  }

  form.setAttribute('novalidate', '');

  form.addEventListener('submit', handleProductSubmit);

  const imageInput = document.getElementById('product-image');
  const previewContainer = document.getElementById('image-preview');

  if (imageInput && previewContainer) {
    imageInput.addEventListener('change', function () {
      showImagePreview(this.files[0], previewContainer);
    });
  }

  const sizeSelect = document.getElementById('product-size');
  const customSizeContainer = document.getElementById('custom-size-container');

  if (sizeSelect && customSizeContainer) {
    sizeSelect.addEventListener('change', function () {
      if (this.value === 'custom') {
        customSizeContainer.style.display = 'block';
      } else {
        customSizeContainer.style.display = 'none';
      }
    });
  }

  const expirationInput = document.getElementById('product-expiration');
  if (expirationInput) {
    const today = new Date().toISOString().split('T')[0];
    expirationInput.min = today;

    expirationInput.addEventListener('change', function () {
      if (this.value && new Date(this.value) < new Date(today)) {
        showErrorMessage('expiration-error', 'A data de validade não pode ser no passado');
      } else {
        clearFieldError('expiration-error', this);
      }
    });
  }

  setupLiveValidation();

  markRequiredFields();
}

function markRequiredFields() {
  const requiredInputs = document.querySelectorAll(
    'input[required], select[required], textarea[required]'
  );
  requiredInputs.forEach(input => {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) {
      label.classList.add('required-field');
    }
  });
}

function setupLiveValidation() {
  const nameInput = document.getElementById('product-name');
  if (nameInput) {
    nameInput.addEventListener('blur', function () {
      if (!this.value.trim()) {
        showErrorMessage('nome-error', 'O nome do produto é obrigatório');
        this.classList.add('input-error');
      } else if (this.value.trim().length < 3) {
        showErrorMessage('nome-error', 'O nome do produto deve ter no mínimo 3 caracteres');
        this.classList.add('input-error');
      } else {
        clearFieldError('nome-error', this);
      }
    });

    nameInput.addEventListener('input', function () {
      if (this.value.trim().length >= 3) {
        clearFieldError('nome-error', this);
      }
    });
  }

  const priceInput = document.getElementById('product-price');
  if (priceInput) {
    priceInput.addEventListener('blur', function () {
      if (!this.value) {
        showErrorMessage('preco-error', 'O preço é obrigatório');
        this.classList.add('input-error');
      } else if (isNaN(parseFloat(this.value.replace(',', '.')))) {
        showErrorMessage('preco-error', 'Digite um valor válido (ex: 10,50)');
        this.classList.add('input-error');
      } else {
        clearFieldError('preco-error', this);
      }
    });

    priceInput.addEventListener('input', function () {
      if (this.value && !isNaN(parseFloat(this.value.replace(',', '.')))) {
        clearFieldError('preco-error', this);
      }
    });
  }

  const stockInput = document.getElementById('product-stock');
  if (stockInput) {
    stockInput.addEventListener('blur', function () {
      if (this.value === '') {
        showErrorMessage('stock-error', 'A quantidade em estoque é obrigatória');
        this.classList.add('input-error');
      } else if (parseInt(this.value) < 0) {
        showErrorMessage('stock-error', 'A quantidade não pode ser negativa');
        this.classList.add('input-error');
      } else {
        clearFieldError('stock-error', this);
      }
    });

    stockInput.addEventListener('input', function () {
      if (this.value !== '' && parseInt(this.value) >= 0) {
        clearFieldError('stock-error', this);
      }
    });
  }

  const categorySelect = document.getElementById('product-category');
  if (categorySelect) {
    categorySelect.addEventListener('change', function () {
      if (!this.value) {
        showErrorMessage('categoria-error', 'Selecione uma categoria para o produto');
        this.classList.add('input-error');
      } else {
        clearFieldError('categoria-error', this);
      }
    });
  }

  const descriptionInput = document.getElementById('product-description');
  if (descriptionInput) {
    descriptionInput.addEventListener('blur', function () {
      if (this.value.trim().length < 10) {
        showErrorMessage('descricao-error', 'A descrição deve ter no mínimo 10 caracteres');
        this.classList.add('input-error');
      } else {
        clearFieldError('descricao-error', this);
      }
    });

    descriptionInput.addEventListener('input', function () {
      if (this.value.trim().length >= 10) {
        clearFieldError('descricao-error', this);
      }
    });
  }
}

async function loadCategories() {
  const categorySelect = document.getElementById('product-category');
  if (!categorySelect) return;

  try {
    categorySelect.innerHTML =
      '<option value="" disabled selected>Carregando categorias...</option>';

    const possibleEndpoints = ['/category'];

    let categories = [];
    let succeeded = false;

    for (const endpoint of possibleEndpoints) {
      try {
        const response = await fetch(`${API.BASE_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        if (response.ok) {
          const data = await response.json();
          categories = Array.isArray(data)
            ? data
            : data.categories || data.data || data.items || [];
          succeeded = true;
          break;
        }
      } catch (endpointError) {
        console.warn(`Falha ao carregar de ${endpoint}:`, endpointError);
      }
    }

    if (!succeeded) {
      throw new Error('Não foi possível carregar as categorias de nenhum endpoint');
    }

    categorySelect.innerHTML =
      '<option value="" disabled selected>Selecione uma categoria</option>';

    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
    showErrorMessage(
      'categoria-error',
      'Erro ao carregar categorias. Por favor, recarregue a página.'
    );

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

function showImagePreview(file, container) {
  if (!file || !container) return;

  container.innerHTML = '';

  if (!file.type.match('image.*')) {
    container.innerHTML = '<p class="error">Por favor, selecione um arquivo de imagem válido.</p>';
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    container.innerHTML = '<p class="error">A imagem deve ter no máximo 5MB.</p>';
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = document.createElement('img');
    img.src = e.target.result;
    img.alt = 'Preview';
    img.className = 'preview-image';
    container.appendChild(img);
  };
  reader.readAsDataURL(file);
}

async function handleProductSubmit(e) {
  e.preventDefault();

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

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
  }

  clearAllErrors();

  const validationResult = validateProductForm();

  if (!validationResult.isValid) {
    if (formErrorDisplay) {
      formErrorDisplay.innerHTML = `
        <div class="error-summary">
          <i class="fas fa-exclamation-circle"></i>
          <strong>Não foi possível cadastrar o produto</strong>
          <p>Por favor, verifique os campos destacados</p>
        </div>
      `;
      formErrorDisplay.classList.add('active');
    }

    const firstErrorField = document.querySelector('.input-error');
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        firstErrorField.focus();
      }, 600);
    }

    if (window.Toast) {
      window.Toast.error('Por favor, preencha todos os campos obrigatórios', {
        position: 'bottom-right',
        duration: 5000,
      });

      validationResult.errors.forEach((error, index) => {
        setTimeout(
          () => {
            window.Toast.warning(error, {
              position: 'bottom-right',
              duration: 5000,
              title: 'Campo Obrigatório',
            });
          },
          500 + index * 800
        );
      });
    }

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Cadastrar Produto';
    }
    return;
  }

  try {
    const formData = new FormData();
    formData.append('name', nameInput.value.trim());
    formData.append('price', parseFloat(priceInput.value.replace(',', '.')));
    formData.append('stock_quantity', parseInt(stockInput.value));
    formData.append('category_id', categorySelect.value);

    if (expirationInput.value) {
      formData.append('expiration_date', expirationInput.value);
    }

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

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }

    const possibleEndpoints = ['/product'];

    const possibleServers = [API.BASE_URL, 'http://localhost:3001/api'];

    if (API.produtos && API.produtos.ENDPOINT) {
      possibleEndpoints.unshift(API.produtos.ENDPOINT);
    }

    let response;
    let success = false;
    let lastError;
    let connectionRefused = false;

    for (const server of possibleServers) {
      if (success) break;

      for (const endpoint of possibleEndpoints) {
        const url = `${server}${endpoint}`;

        try {
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => abortController.abort(), 5000);

          response = await fetch(url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
            signal: abortController.signal,
          }).finally(() => {
            clearTimeout(timeoutId);
          });

          if (response.ok) {
            if (API.produtos) API.produtos.ENDPOINT = endpoint;
            success = true;
            break;
          }
        } catch (endpointError) {
          console.warn(`Falha ao enviar para ${endpoint}:`, endpointError);

          if (endpointError.message.includes('Failed to fetch')) {
            connectionRefused = true;
          }

          lastError = endpointError;
        }
      }
    }

    if (!success) {
      if (connectionRefused) {
        throw new Error(
          'Não foi possível conectar ao servidor. Verifique se o backend está em execução ou tente novamente mais tarde.'
        );
      } else if (response) {
        let errorDetail = '';
        try {
          const errorData = await response.json();
          console.error('Detalhes do erro:', errorData);
          errorDetail = errorData.message || errorData.error || '';
        } catch (parseError) {}

        throw new Error(`Erro ao cadastrar produto (${response.status}): ${errorDetail}`);
      } else {
        throw lastError || new Error('Não foi possível conectar ao servidor');
      }
    }

    const responseData = await response.json();

    if (formErrorDisplay) {
      formErrorDisplay.textContent = 'Produto cadastrado com sucesso!';
      formErrorDisplay.className = 'success-message';
    }

    if (window.Toast) {
      window.Toast.success('Produto cadastrado com sucesso!');
    }

    e.target.reset();
    if (document.getElementById('image-preview')) {
      document.getElementById('image-preview').innerHTML = '';
    }

    setTimeout(() => {
      window.location.href = '/produtos.html';
    }, 2000);
  } catch (error) {
    console.error('Erro ao cadastrar produto:', error);

    if (
      error.message.includes('Failed to fetch') ||
      error.message.includes('conectar ao servidor')
    ) {
      if (formErrorDisplay) {
        formErrorDisplay.textContent =
          'Erro de conexão com o servidor. Verifique se o backend está em execução.';
        formErrorDisplay.className = 'error-message';
      }

      const formActions = document.querySelector('.form-actions') || formErrorDisplay.parentElement;
      if (formActions) {
        const retryButton = document.createElement('button');
        retryButton.type = 'button';
        retryButton.className = 'btn btn-primary retry-btn';
        retryButton.innerHTML = '<i class="fas fa-sync-alt"></i> Tentar Novamente';
        retryButton.addEventListener('click', function () {
          handleProductSubmit(e);
        });

        const existingRetryBtn = formActions.querySelector('.retry-btn');
        if (existingRetryBtn) formActions.removeChild(existingRetryBtn);

        formActions.appendChild(retryButton);
      }
    } else {
      if (formErrorDisplay) {
        formErrorDisplay.textContent =
          error.message || 'Erro ao cadastrar produto. Tente novamente.';
        formErrorDisplay.className = 'error-message';
      }
    }

    if (window.Toast) {
      window.Toast.error(error.message || 'Erro ao cadastrar produto');
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Cadastrar Produto';
    }
  }
}

function validateProductForm() {
  const result = {
    isValid: true,
    errors: [],
  };

  const nameInput = document.getElementById('product-name');
  if (!nameInput.value.trim()) {
    showErrorMessage('nome-error', 'O nome do produto é obrigatório');
    nameInput.classList.add('input-error');
    result.errors.push('Digite um nome para o produto');
    result.isValid = false;

    pulseField(nameInput);
  } else if (nameInput.value.trim().length < 3) {
    showErrorMessage('nome-error', 'O nome do produto deve ter no mínimo 3 caracteres');
    nameInput.classList.add('input-error');
    result.errors.push('O nome deve ter no mínimo 3 caracteres');
    result.isValid = false;

    pulseField(nameInput);
  } else {
    clearFieldError('nome-error', nameInput);
  }

  const priceInput = document.getElementById('product-price');
  if (!priceInput.value) {
    showErrorMessage('preco-error', 'O preço é obrigatório');
    priceInput.classList.add('input-error');
    result.errors.push('Informe o preço do produto');
    result.isValid = false;

    pulseField(priceInput);
  } else if (isNaN(parseFloat(priceInput.value.replace(',', '.')))) {
    showErrorMessage('preco-error', 'Informe um preço válido (exemplo: 10,50)');
    priceInput.classList.add('input-error');
    result.errors.push('O preço informado não é válido');
    result.isValid = false;

    pulseField(priceInput);
  } else {
    clearFieldError('preco-error', priceInput);
  }

  const stockInput = document.getElementById('product-stock');
  if (stockInput.value === '') {
    showErrorMessage('stock-error', 'A quantidade em estoque é obrigatória');
    stockInput.classList.add('input-error');
    result.errors.push('Informe a quantidade em estoque');
    result.isValid = false;

    pulseField(stockInput);
  } else if (parseInt(stockInput.value) < 0) {
    showErrorMessage('stock-error', 'A quantidade não pode ser negativa');
    stockInput.classList.add('input-error');
    result.errors.push('A quantidade em estoque não pode ser negativa');
    result.isValid = false;

    pulseField(stockInput);
  } else {
    clearFieldError('stock-error', stockInput);
  }

  const expirationInput = document.getElementById('product-expiration');
  if (expirationInput.value) {
    const today = new Date().toISOString().split('T')[0];
    if (new Date(expirationInput.value) < new Date(today)) {
      showErrorMessage('expiration-error', 'A data de validade não pode ser no passado');
      expirationInput.classList.add('input-error');
      result.errors.push('A data de validade deve ser futura');
      result.isValid = false;

      pulseField(expirationInput);
    } else {
      clearFieldError('expiration-error', expirationInput);
    }
  }

  const sizeSelect = document.getElementById('product-size');
  const customSizeInput = document.getElementById('product-custom-size');
  if (sizeSelect.value === 'custom' && !customSizeInput.value.trim()) {
    showErrorMessage('size-error', 'Por favor, especifique o tamanho personalizado');
    customSizeInput.classList.add('input-error');
    result.errors.push('Especifique o tamanho personalizado');
    result.isValid = false;

    pulseField(customSizeInput);
  } else {
    clearFieldError('size-error', customSizeInput);
  }

  const categorySelect = document.getElementById('product-category');
  if (!categorySelect.value) {
    showErrorMessage('categoria-error', 'Selecione uma categoria');
    categorySelect.classList.add('input-error');
    result.errors.push('Selecione uma categoria para o produto');
    result.isValid = false;

    pulseField(categorySelect);
  } else {
    clearFieldError('categoria-error', categorySelect);
  }

  const descriptionInput = document.getElementById('product-description');
  if (descriptionInput && descriptionInput.value.trim().length < 10) {
    showErrorMessage('descricao-error', 'A descrição deve ter no mínimo 10 caracteres');
    descriptionInput.classList.add('input-error');
    result.errors.push('Forneça uma descrição com pelo menos 10 caracteres');
    result.isValid = false;

    pulseField(descriptionInput);
  } else {
    clearFieldError('descricao-error', descriptionInput);
  }

  return result;
}

function showErrorMessage(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorElement.classList.add('active');

    errorElement.style.animation = 'none';
    setTimeout(() => {
      errorElement.style.animation = 'errorPulse 0.5s ease';
    }, 10);

    const inputId = elementId.replace('-error', '');
    const field =
      document.getElementById(inputId) ||
      document.querySelector(`[id$="${inputId}"]`) ||
      document.querySelector(`[name="${inputId}"]`);

    if (field) {
      field.classList.add('input-error');

      field.addEventListener('input', function onInput() {}, { once: false });
    }
  }
}

function pulseField(field) {
  field.classList.add('pulse-field');
  setTimeout(() => {
    field.classList.remove('pulse-field');
  }, 1500);
}

function clearFieldError(errorId, inputElement) {
  const errorElement = document.getElementById(errorId);
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.classList.remove('active');
  }

  if (inputElement) {
    inputElement.classList.remove('input-error');
  }
}

function clearAllErrors() {
  const formErrorDisplay = document.getElementById('form-error');
  if (formErrorDisplay) {
    formErrorDisplay.innerHTML = '';
    formErrorDisplay.classList.remove('active');
  }

  document.querySelectorAll('.error-message').forEach(el => {
    el.textContent = '';
    el.classList.remove('active');
  });

  document.querySelectorAll('.input-error').forEach(el => {
    el.classList.remove('input-error');
  });
}
