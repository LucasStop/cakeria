document.addEventListener('DOMContentLoaded', () => {
  checkAdminAccess();
  loadCategories(); // Adicionado para carregar categorias ao iniciar

  const productForm = document.getElementById('productForm');
  if (productForm) {
    productForm.addEventListener('submit', handleSubmitProduct);
  }

  setupImageUpload();
  setupCustomSizeInput();
});

function checkAdminAccess() {
  const token = localStorage.getItem('token');
  if (!token) {
    Toastify({
      text: 'Você precisa estar logado como administrador.',
      duration: 3000,
      gravity: 'top',
      position: 'right',
    }).showToast();
    window.location.href = 'login.html?redirect=admin-new-product.html';
    return;
  }

  API.get('/auth/verify', { headers: { Authorization: `Bearer ${token}` } })
    .then(data => {
      if (!data.user || data.user.type !== 'admin') {
        Toastify({
          text: 'Acesso restrito a administradores.',
          duration: 3000,
          gravity: 'top',
          position: 'right',
        }).showToast();
        window.location.href = 'index.html';
      }
    })
    .catch(error => {
      console.error('Erro ao verificar permissões:', error);
      Toastify({
        text: 'Erro ao verificar permissões. Faça login novamente.',
        duration: 3000,
        gravity: 'top',
        position: 'right',
      }).showToast();
      window.location.href = 'login.html';
    });
}

async function loadCategories() {
  try {
    const categories = await API.get('/category');
    const categorySelect = document.getElementById('productCategory');

    if (categorySelect && categories && categories.length > 0) {
      // Primeiro, limpe o select para garantir que não haja duplicatas
      categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
      
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id || category._id; // Usar ID da categoria (tentar ambos formatos)
        option.textContent = category.name;
        categorySelect.appendChild(option);
      });
      
      // Se houver apenas uma categoria, selecioná-la automaticamente
      if (categories.length === 1) {
        categorySelect.value = categories[0].id || categories[0]._id;
      }
    } else if (categorySelect) {
      categorySelect.innerHTML = '<option value="">Nenhuma categoria encontrada</option>';
      
      // Mostrar alerta ao usuário
      Toastify({
        text: 'Nenhuma categoria encontrada. Crie uma categoria primeiro.',
        duration: 5000,
        gravity: 'top',
        position: 'right',
      }).showToast();
    }
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
    Toastify({
      text: 'Erro ao carregar categorias.',
      duration: 3000,
      gravity: 'top',
      position: 'right',
    }).showToast();
    const categorySelect = document.getElementById('productCategory');
    if (categorySelect) {
      categorySelect.innerHTML = '<option value="">Erro ao carregar</option>';
    }
  }
}

function setupImageUpload() {
  const productImageInput = document.getElementById('productImage');
  const imagePreview = document.getElementById('imagePreview');
  const imagePlaceholder = document.getElementById('imagePlaceholder');

  if (productImageInput && imagePreview && imagePlaceholder) {
    productImageInput.addEventListener('change', function () {
      const file = this.files[0];
      if (file) {
        // Validação básica do tipo de arquivo (pode ser expandida)
        if (!file.type.startsWith('image/')) {
          Toastify({
            text: 'Por favor, selecione um arquivo de imagem válido (JPG, PNG, GIF).',
            duration: 3000,
            gravity: 'top',
            position: 'right',
          }).showToast();
          this.value = ''; // Limpa o input
          imagePreview.style.display = 'none';
          imagePlaceholder.style.display = 'block';
          return;
        }

        // Validação de tamanho do arquivo (ex: 2MB)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
          Toastify({
            text: 'A imagem é muito grande. O tamanho máximo é 2MB.',
            duration: 3000,
            gravity: 'top',
            position: 'right',
          }).showToast();
          this.value = ''; // Limpa o input
          imagePreview.style.display = 'none';
          imagePlaceholder.style.display = 'block';
          return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
          imagePreview.src = e.target.result;
          imagePreview.style.display = 'block';
          imagePlaceholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
        clearError('productImage-error'); // Limpa erro se houver
      } else {
        imagePreview.style.display = 'none';
        imagePlaceholder.style.display = 'block';
        imagePreview.src = '#';
      }
    });
  }
}

function setupCustomSizeInput() {
  const productSizeSelect = document.getElementById('productSize');
  const customSizeContainer = document.getElementById('customSizeContainer');
  const productCustomSizeInput = document.getElementById('productCustomSize');

  if (productSizeSelect && customSizeContainer && productCustomSizeInput) {
    productSizeSelect.addEventListener('change', function () {
      if (this.value === 'custom') {
        customSizeContainer.style.display = 'block';
        productCustomSizeInput.required = true;
      } else {
        customSizeContainer.style.display = 'none';
        productCustomSizeInput.required = false;
        productCustomSizeInput.value = ''; // Limpa o valor se não for customizado
      }
    });
  }
}

function showError(errorId, message) {
  const errorSpan = document.getElementById(errorId);
  const inputField = document.getElementById(errorId.replace('-error', '')); // Assumindo que o ID do input é 'productName' e o erro é 'productName-error'
  if (errorSpan) {
    errorSpan.textContent = message;
  }
  if (inputField) {
    inputField.classList.add('invalid-input');
  }
}

function clearError(errorId) {
  const errorSpan = document.getElementById(errorId);
  const inputField = document.getElementById(errorId.replace('-error', ''));
  if (errorSpan) {
    errorSpan.textContent = '';
  }
  if (inputField) {
    inputField.classList.remove('invalid-input');
  }
}

// Função de placeholder para o submit, a ser implementada
async function handleSubmitProduct(event) {
  event.preventDefault();

  // Limpar erros anteriores
  const errorFields = [
    'productName',
    'productDescription',
    'productPrice',
    'productStock',
    'productCategory',
    'productImage',
    'productCustomSize',
    'productExpiryDate',
    'productStatus',
  ];
  errorFields.forEach(field => clearError(`${field}-error`));

  const productName = document.getElementById('productName').value.trim();
  const productDescription = document.getElementById('productDescription').value.trim();
  const productPrice = document.getElementById('productPrice').value;
  const productStock = document.getElementById('productStock').value;
  const productCategory = document.getElementById('productCategory').value;
  const productImageFile = document.getElementById('productImage').files[0];
  let productSize = document.getElementById('productSize').value;
  const productCustomSize = document.getElementById('productCustomSize').value.trim();
  const productExpiryDate = document.getElementById('productExpiryDate').value;
  const productStatus = document.getElementById('productStatus').value;

  const token = localStorage.getItem('token');
  if (!token) {
    Toastify({
      text: 'Você precisa estar logado como administrador.',
      duration: 3000,
      gravity: 'top',
      position: 'right',
    }).showToast();
    window.location.href = `login.html?redirect=${window.location.pathname.split('/').pop()}`;
    return;
  }

  let errors = [];
  // Validação dos campos
  if (!isNotEmpty(productName)) {
    errors.push({ field: 'productName', message: 'O nome do produto é obrigatório.' });
  }
  if (!isNotEmpty(productDescription)) {
    errors.push({
      field: 'productDescription',
      message: 'A descrição do produto é obrigatória.',
    });
  }
  if (!isValidPrice(productPrice)) {
    errors.push({
      field: 'productPrice',
      message: 'O preço do produto deve ser um número válido e maior ou igual a zero.',
    });
  }
  if (!isValidStock(productStock)) {
    errors.push({
      field: 'productStock',
      message: 'O estoque do produto deve ser um número válido e maior ou igual a zero.',
    });
  }  // Garante que productCategory (que é o ID) não seja uma string vazia (opção "Selecione uma categoria")
  if (!productCategory || productCategory === '') {
    errors.push({
      field: 'productCategory',
      message: 'A categoria do produto deve ser selecionada.',
    });
    
    // Adiciona destaque visual ao campo de categoria
    const categorySelect = document.getElementById('productCategory');
    if (categorySelect) {
      categorySelect.classList.add('invalid-input');
      categorySelect.focus();
    }
  }
  if (productSize === 'custom' && !isNotEmpty(productCustomSize)) {
    errors.push({
      field: 'productCustomSize',
      message: 'O tamanho personalizado não pode estar vazio se "Outro" for selecionado.',
    });
  }
  if (!productImageFile) {
    errors.push({ field: 'productImage', message: 'A imagem do produto é obrigatória.' });
  }

  if (productExpiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(productExpiryDate + 'T00:00:00'); // Adiciona T00:00:00 para evitar problemas de fuso horário na conversão

    if (isNaN(expiry.getTime())) {
      errors.push({ field: 'productExpiryDate', message: 'Data de validade inválida.' });
    } else if (expiry < today) {
      errors.push({
        field: 'productExpiryDate',
        message: 'A data de validade não pode ser uma data passada.',
      });
    }
  } else {
    // Se a data de validade for opcional no backend e puder ser nula, remova este else.
    // Se for obrigatória, esta validação garante que o usuário seja informado.
    // O controller já define um default se não for enviado, então esta validação de obrigatoriedade no frontend pode ser opcional.
    // errors.push({ field: 'productExpiryDate', message: 'A data de validade é obrigatória.' });
  }

  if (errors.length > 0) {
    errors.forEach(error => {
      showError(`${error.field}-error`, error.message);
    });
    Toastify({
      text: 'Por favor, corrija os erros destacados.',
      duration: 3000,
      gravity: 'top',
      position: 'right',
    }).showToast();
    return;
  }
  const formData = new FormData();
  formData.append('name', productName);
  formData.append('description', productDescription);
  formData.append('price', productPrice);
  formData.append('stock', productStock);
  
  // Garantir que category_id seja enviado corretamente
  if (!productCategory || productCategory === '') {
    // Se não houver categoria selecionada, mostrar erro novamente
    showError('productCategory-error', 'A categoria do produto é obrigatória.');
    Toastify({
      text: 'Selecione uma categoria para continuar.',
      duration: 3000,
      gravity: 'top',
      position: 'right',
    }).showToast();
    return;
  }
  
  // Assegurar que o ID da categoria seja um valor válido
  formData.append('category_id', productCategory);
  console.log('Categoria enviada:', productCategory); // Log para debug

  if (productSize === 'custom') {
    formData.append('size', productCustomSize);
  } else if (productSize && productSize !== '') {
    formData.append('size', productSize);
  }

  if (productExpiryDate) {
    formData.append('expiration_date', productExpiryDate);
  }

  formData.append('is_active', productStatus === 'active');

  if (productImageFile) {
    formData.append('image', productImageFile);
  }

  try {
    const response = await API.post('/product', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    Toastify({
      text: 'Produto criado com sucesso!',
      duration: 3000,
      gravity: 'top',
      position: 'right',
    }).showToast();

    document.getElementById('productForm').reset();
    const imagePreview = document.getElementById('imagePreview');
    const imagePlaceholder = document.getElementById('imagePlaceholder');
    if (imagePreview && imagePlaceholder) {
      imagePreview.style.display = 'none';
      imagePreview.src = '#';
      imagePlaceholder.style.display = 'block';
    }
    const customSizeContainer = document.getElementById('customSizeContainer');
    if (customSizeContainer) customSizeContainer.style.display = 'none';
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.details ||
      error.message ||
      'Erro ao criar produto. Tente novamente.';
    Toastify({
      text: errorMessage,
      duration: 5000,
      gravity: 'top',
      position: 'right',
    }).showToast();
  }
}

// Funções de validação específicas para produtos (exemplos)
function isNotEmpty(value) {
  return value && value.trim() !== '';
}

function isValidPrice(value) {
  const price = parseFloat(value);
  return !isNaN(price) && price >= 0;
}

function isValidStock(value) {
  const stock = parseInt(value, 10);
  return !isNaN(stock) && stock >= 0;
}
