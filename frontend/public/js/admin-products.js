document.addEventListener('DOMContentLoaded', function () {
  if (window.Toast && typeof window.Toast.init === 'function') {
    window.Toast.init();
  }

  checkAdminAccess();
  loadProducts();
  loadCategories(); 
  setupEventListeners();
});

let currentPage = 1;
const itemsPerPage = 10;
let totalProducts = 0;
let productsData = [];

function loadCategories() {
  API.get('/category')
    .then(categories => {
      if (!Array.isArray(categories)) {
        throw new Error('Resposta inválida do servidor ao carregar categorias');
      }
      populateCategoryFilter(categories);
      populateCategoryModalSelect(categories);
    })
    .catch(error => {
      console.error('Erro ao carregar categorias:', error);
      if (window.Toast) {
        window.Toast.error('Erro ao carregar categorias. Tente novamente mais tarde.');
      }
    });
}

function populateCategoryFilter(categories) {
  const filterSelect = document.getElementById('filterCategory');
  filterSelect.innerHTML = '<option value="">Todas as categorias</option>'; 
  categories.forEach(category => {
    if (category.is_active) { 
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      filterSelect.appendChild(option);
    }
  });
}

function populateCategoryModalSelect(categories) {
  const modalSelect = document.getElementById('editProductCategory');
  modalSelect.innerHTML = '<option value="">Selecione uma categoria</option>';
  categories.forEach(category => {
    if (category.is_active) { 
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      modalSelect.appendChild(option);
    }
  });
}

function loadProducts() {
  const searchTerm = document.getElementById('searchProduct').value.toLowerCase();
  const categoryFilter = document.getElementById('filterCategory').value;
  showLoadingState(true);

  API.get('/product')
    .then(products => {
      if (!Array.isArray(products)) {
        throw new Error('Resposta inválida do servidor');
      }

      productsData = products;
      totalProducts = products.length;

      if (searchTerm || categoryFilter) {
        productsData = productsData.filter(product => {
          const matchesSearch =
            !searchTerm ||
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm);

          const matchesCategory =
            !categoryFilter || product.category_id.toString() === categoryFilter;

          return matchesSearch && matchesCategory;
        });
        totalProducts = productsData.length;
      }

      renderProductsTable();
      renderPagination();
      showLoadingState(false);
    })
    .catch(error => {
      console.error('Erro ao carregar produtos:', error);
      showLoadingState(false);
      if (window.Toast) {
        window.Toast.error('Erro ao carregar produtos. Tente novamente mais tarde.');
      }
    });
}

function renderProductsTable() {
  const tableBody = document.querySelector('#productsTable tbody');
  tableBody.innerHTML = '';

  if (productsData.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="9" class="text-center">Nenhum produto encontrado</td>';
    tableBody.appendChild(emptyRow);
    return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalProducts);

  for (let i = startIndex; i < endIndex; i++) {
    const product = productsData[i];
    const row = document.createElement('tr');
    row.setAttribute('data-id', product.id);

    const imageUrl = product.image && `http://localhost:3001/api/product/image/${product.id}`;

    row.innerHTML = `
      <td>${product.id}</td>
      <td>
        <div class="product-image-container">
          <img src="${imageUrl}" alt="${product.name}" class="product-thumbnail" 
        </div>
      </td>
      <td>${product.name}</td>
      <td>${product.category ? product.category.name : 'Sem categoria'}</td>
      <td>R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}</td>
      <td>${product.stock}</td>
      <td>${formatDate(product.expiry_date)}</td>
      <td><span class="status-badge ${product.is_active ? 'active' : 'inactive'}">${product.is_active ? 'Ativo' : 'Inativo'}</span></td>      <td>
        <div class="table-actions">
          
          <button class="action-btn edit-btn" onclick="openEditInline(${product.id})" title="Edição rápida">
           <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn delete-btn" onclick="openDeleteModal(${product.id}, '${product.name}')" title="Excluir">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;

    tableBody.appendChild(row);
  }
}

window.openEditModal = function (productId) {
  const product = productsData.find(p => p.id == productId);
  if (!product) {
    console.error('Produto não encontrado:', productId);
    return;
  }

  document.getElementById('editProductId').value = product.id;
  document.getElementById('editProductName').value = product.name;
  document.getElementById('editProductPrice').value = parseFloat(product.price)
    .toFixed(2)
    .replace('.', ',');
  document.getElementById('editProductStock').value = product.stock;
  document.getElementById('editProductExpiry').value = formatDateForInput(product.expiry_date);
  document.getElementById('editProductCategory').value = product.category_id;
  document.getElementById('editProductSize').value = product.size;
  document.getElementById('editProductDescription').value = product.description;
  document.getElementById('editProductStatus').value = product.is_active.toString();

  if (product.size === 'custom') {
    document.getElementById('editCustomSizeContainer').style.display = 'block';
    document.getElementById('editProductCustomSize').value = product.custom_size || '';
  } else { 
    document.getElementById('editCustomSizeContainer').style.display = 'none';
    document.getElementById('editProductCustomSize').value = '';
  }

  const previewImgContainer = document.getElementById('editImagePreview');
  previewImgContainer.innerHTML = ''; 
  if (product.image) {
    const img = document.createElement('img');
    img.src = `http://localhost:3001/api/product/image/${product.id}`;
    img.alt = product.name;
    img.className = 'uploaded-image-preview'; 
    previewImgContainer.appendChild(img);
  } else {
    previewImgContainer.innerHTML = '<span class="default-image-icon"><i class="fas fa-image"></i></span>';
  }

  const modal = document.getElementById('editProductModal');
  modal.classList.add('show');
};

window.openDeleteModal = function (productId, productName) {
  console.log('openDeleteModal chamada com ID:', productId, 'Nome:', productName);
  
  const productRow = document.querySelector(`#productsTable tr[data-id="${productId}"]`);
  if (productRow) {
    productRow.classList.add('highlight-delete', 'pulse-delete');
  }
  
  if (window.Toast) {
    const confirmToast = window.Toast.create(
      `<div class="toast-confirm-message">
        Tem certeza que deseja excluir o produto <strong>${productName}</strong>?<br>
        Esta ação não pode ser desfeita.
       </div>
       <div class="toast-actions">
         <button class="cancel-delete">Cancelar</button>
         <button class="confirm-delete">Sim, excluir</button>
       </div>`,
      {
        type: 'warning',
        title: 'Confirmar exclusão',
        duration: 10000, 
        position: 'bottom-right', 
        closeButton: true,
        pauseOnHover: true,
        zIndex: 99999
      }
    );
      if (confirmToast) {
      const toastElement = confirmToast.toastElement || confirmToast;
      
      const cancelBtn = toastElement.querySelector('.cancel-delete');
      const confirmBtn = toastElement.querySelector('.confirm-delete');
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
          if (productRow) {
            productRow.classList.remove('highlight-delete', 'pulse-delete');
          }
          window.Toast.remove(confirmToast);
        });
      }
      
      if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
          window.Toast.remove(confirmToast);
          deleteProduct(productId);
        });
      }
      
      confirmToast.onClose = function() {
        if (productRow) {
          productRow.classList.remove('highlight-delete', 'pulse-delete');
        }
      };
    }
  } else {
    document.getElementById('deleteProductId').value = productId;
    document.getElementById('deleteProductName').textContent = productName;

    const modal = document.getElementById('deleteConfirmModal');
    modal.classList.add('show');
  }
};

function checkAdminAccess() {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('Você precisa estar logado como administrador para acessar esta página.');
    window.location.href = 'login.html?redirect=admin-produtos.html';
    return;
  }

  fetch('http://localhost:3001/api/auth/verify', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(response => response.json())
    .then(data => {
      if (!data.user || data.user.type !== 'admin') {
        alert('Acesso restrito apenas para administradores.');
        window.location.href = 'index.html';
      }
    })
    .catch(error => {
      console.error('Erro ao verificar permissões:', error);
      alert('Erro ao verificar suas permissões. Por favor, faça login novamente.');
      window.location.href = 'login.html';
    });
}

function renderPagination() {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  if (totalPages <= 1) {
    return;
  }

  const prevButton = document.createElement('button');
  prevButton.innerHTML = '&laquo;';
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderProductsTable();
      renderPagination();
    }
  });
  pagination.appendChild(prevButton);

  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement('button');
    pageButton.textContent = i;
    pageButton.classList.toggle('active', i === currentPage);
    pageButton.addEventListener('click', () => {
      currentPage = i;
      renderProductsTable();
      renderPagination();
    });
    pagination.appendChild(pageButton);
  }

  const nextButton = document.createElement('button');
  nextButton.innerHTML = '&raquo;';
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderProductsTable();
      renderPagination();
    }
  });
  pagination.appendChild(nextButton);
}

function setupEventListeners() {
  document.getElementById('editProductImage').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        document.getElementById('edit-image-error').textContent = 'A imagem deve ter no máximo 5MB';
        return;
      }

      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
        document.getElementById('edit-image-error').textContent =
          'Formato de imagem inválido. Use JPG, PNG ou WebP';
        return;
      }

      document.getElementById('edit-image-error').textContent = '';
      const reader = new FileReader();
      reader.onload = function (e) {
        const imagePreview = document.getElementById('editImagePreview');
        imagePreview.innerHTML = ''; 
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = 'Imagem do produto';
        img.className = 'uploaded-image-preview'; 
        imagePreview.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('editSelectImageBtn').addEventListener('click', function () {
    document.getElementById('editProductImage').click();
  });

  document.getElementById('editProductSize').addEventListener('change', function () {
    const customSizeContainer = document.getElementById('editCustomSizeContainer');
    customSizeContainer.style.display = this.value === 'custom' ? 'block' : 'none';
  });
  document.getElementById('editProductForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const productId = document.getElementById('editProductId').value;
    const imageFile = document.getElementById('editProductImage').files[0];

    const name = document.getElementById('editProductName').value.trim();
    const price = document.getElementById('editProductPrice').value.trim();

    if (!name) {
      document.getElementById('edit-name-error').textContent = 'Nome é obrigatório';
      return;
    } else {
      document.getElementById('edit-name-error').textContent = '';
    }

    if (!price) {
      document.getElementById('edit-price-error').textContent = 'Preço é obrigatório';
      return;
    } else {
      document.getElementById('edit-price-error').textContent = '';
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price.replace(',', '.'));
    formData.append('stock', document.getElementById('editProductStock').value || '0');
    formData.append('expiry_date', document.getElementById('editProductExpiry').value);
    formData.append('category_id', document.getElementById('editProductCategory').value);
    formData.append('size', document.getElementById('editProductSize').value);
    formData.append('description', document.getElementById('editProductDescription').value || '');
    formData.append('is_active', document.getElementById('editProductStatus').value);

    const customSize = document.getElementById('editProductCustomSize');
    if (customSize && customSize.value.trim()) {
      formData.append('custom_size', customSize.value.trim());
    }

    if (imageFile) {
      formData.append('image', imageFile);
    }

    updateProduct(productId, formData);
  });
  document.getElementById('confirmDelete').addEventListener('click', function () {
    const productId = document.getElementById('deleteProductId').value;
    deleteProduct(productId);
  });

  document.getElementById('searchProduct').addEventListener('input', debounce(loadProducts, 300));
  document.getElementById('filterCategory').addEventListener('change', loadProducts);
  document.querySelectorAll('.close-modal').forEach(elem => {
    elem.addEventListener('click', function () {
      document.getElementById('editProductModal').classList.remove('show');
      document.getElementById('deleteConfirmModal').classList.remove('show');
    });
  });

  window.addEventListener('click', function (event) {
    if (event.target === document.getElementById('editProductModal')) {
      document.getElementById('editProductModal').classList.remove('show');
    }
    if (event.target === document.getElementById('deleteConfirmModal')) {
      document.getElementById('deleteConfirmModal').classList.remove('show');
    }
  });

  const cancelButtons = document.querySelectorAll('button.btn-secondary.close-modal');
  cancelButtons.forEach(button => {
    button.addEventListener('click', function () {
      document.getElementById('editProductModal').classList.remove('show');
      document.getElementById('deleteConfirmModal').classList.remove('show');
    });
  });
}

function updateProduct(productId, formData) {
  const submitButton = document.querySelector('#editProductForm button[type="submit"]');
  const originalButtonText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

  console.log('Enviando atualização para produto:', productId);

  API.put(`/product/${productId}`, formData)
    .then(data => {
      if (window.Toast) {
        window.Toast.success('Produto atualizado com sucesso!');
      }
      document.getElementById('editProductModal').classList.remove('show');
      loadProducts();
    })
    .catch(error => {
      console.error('Erro na atualização:', error);
      if (window.Toast) {
        window.Toast.error('Erro ao atualizar produto: ' + error.message);
      }
    })
    .finally(() => {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    });
}

window.deleteProduct = function (productId) {
  console.log('Excluindo produto:', productId);

  const row = document.querySelector(`#productsTable tr[data-id="${productId}"]`);
  if (!row) {
    console.error('Linha da tabela não encontrada para o produto:', productId);
    return;
  }

  row.style.transition = 'opacity 0.5s ease';
  row.style.opacity = '0.5';

  const actionsCell = row.querySelector('td:last-child');
  actionsCell.innerHTML =
    '<div class="spinner"><i class="fas fa-spinner fa-spin"></i> Excluindo...</div>';
    
  // Função para lidar com sucesso na exclusão
  function handleDeleteSuccess() {
    console.log('Produto excluído com sucesso');
    
    row.style.opacity = '0';
    setTimeout(() => {
      loadProducts();
      
      if (window.Toast) {
        window.Toast.success('Produto excluído com sucesso!');
      }
      
      document.getElementById('deleteConfirmModal').classList.remove('show');
    }, 500);
  }
  
  // Função para lidar com erro na exclusão
  function handleDeleteError(error) {
    console.error('Erro na exclusão:', error);
    
    row.style.opacity = '1';
    renderProductsTable();
    
    if (window.Toast) {
      window.Toast.error('Erro ao excluir produto: ' + (error.message || 'Tente novamente'));
    }
  }

  // Executar a requisição de exclusão
  const token = localStorage.getItem('token');
  
  fetch(`http://localhost:3001/api/product/${productId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.message || 'Erro ao excluir produto');
      });
    }
    return response.json();
  })
  .then(() => {
    handleDeleteSuccess();
  })  .catch(error => {
    handleDeleteError(error);
  });
};

function showLoadingState(isLoading) {
  const tableBody = document.querySelector('#productsTable tbody');
  if (isLoading) {
    tableBody.innerHTML = '<tr><td colspan="9" class="text-center">Carregando...</td></tr>';
  }
}

function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

function showLoading() {
  if (document.querySelector('.loading-overlay')) {
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';

  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';

  overlay.appendChild(spinner);

  document.body.appendChild(overlay);
}

function hideLoading() {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) {
    document.body.removeChild(overlay);
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'; // Adicionado retorno para data inválida
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

function formatDateForInput(dateString) {
  if (!dateString) return ''; 
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

window.openEditInline = function(productId) {
  console.log('openEditInline chamada com ID:', productId);
  const product = productsData.find(p => p.id == productId);
  if (!product) {
    console.error('Produto não encontrado:', productId);
    return;
  }
  
  const row = document.querySelector(`#productsTable tr[data-id="${productId}"]`);
  if (!row) {
    console.error('Linha da tabela não encontrada para o produto:', productId);
    return;
  }
  
  if (row.classList.contains('editing')) {
    console.log('Esta linha já está em edição');
    return;
  }
  
  row.classList.add('editing');
  
  const cells = row.querySelectorAll('td:not(:first-child):not(:nth-child(2)):not(:last-child)');
  
  cells[0].innerHTML = `<input type="text" class="edit-input" value="${product.name}" data-field="name" required>`;
  
  const categorySelectHtml = `
    <select class="edit-input" data-field="category_id">
      ${document.getElementById('editProductCategory').innerHTML}
    </select>
  `;
  cells[1].innerHTML = categorySelectHtml;
  
  cells[2].innerHTML = `<input type="text" class="edit-input price-mask" value="${parseFloat(product.price).toFixed(2).replace('.', ',')}" data-field="price" required>`;
  
  cells[3].innerHTML = `<input type="number" class="edit-input" value="${product.stock}" data-field="stock" min="0" required>`;
  
  cells[4].innerHTML = `<input type="date" class="edit-input" value="${formatDateForInput(product.expiry_date)}" data-field="expiry_date">`;
  
  cells[5].innerHTML = `
    <select class="edit-input" data-field="is_active">
      <option value="true" ${product.is_active ? 'selected' : ''}>Ativo</option>
      <option value="false" ${!product.is_active ? 'selected' : ''}>Inativo</option>
    </select>
  `;
    const actionsCell = row.querySelector('td:last-child');
  actionsCell.innerHTML = `
    <div class="table-actions" style="display: flex; gap: 5px;">
      <button class="action-btn save-btn" data-id="${product.id}" title="Salvar" onclick="saveProductChanges(${product.id})">
        <i class="fas fa-save"></i>
      </button>
      <button class="action-btn cancel-btn" data-id="${product.id}" title="Cancelar" onclick="cancelProductEdit(${product.id})">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  const categorySelect = row.querySelector('select[data-field="category_id"]');
  if (categorySelect) {
    categorySelect.value = product.category_id;
  }
  
  const priceInput = row.querySelector('.price-mask');
  if (priceInput) {
    priceInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value === '') {
        e.target.value = '';
        return;
      }
      value = (parseInt(value) / 100).toFixed(2).replace('.', ',');
      e.target.value = value;
    });
  }
}

window.saveProductChanges = function(productId) {
  console.log('Salvando alterações para o produto:', productId);
  const row = document.querySelector(`#productsTable tr[data-id="${productId}"]`);
  if (!row) {
    console.error('Linha da tabela não encontrada para o produto:', productId);
    return;
  }
  
  const nameInput = row.querySelector('input[data-field="name"]');
  const priceInput = row.querySelector('input[data-field="price"]');
  
  if (nameInput && !nameInput.value.trim()) {
    if (window.Toast) {
      window.Toast.error('O nome do produto não pode ficar em branco.', {
        position: 'bottom-right',
      });
    }
    nameInput.focus();
    return;
  }
  
  if (priceInput && !priceInput.value.trim()) {
    if (window.Toast) {
      window.Toast.error('O preço do produto não pode ficar em branco.', {
        position: 'bottom-right',
      });
    }
    priceInput.focus();
    return;
  }
  
  const formData = new FormData();
  const inputs = row.querySelectorAll('.edit-input');
  
  inputs.forEach(input => {
    const field = input.getAttribute('data-field');
    let value = input.value.trim();
    
    // Converter preço de vírgula para ponto
    if (field === 'price') {
      value = value.replace(',', '.');
    }
    
    formData.append(field, value);
  });
  
  // Desabilitar os inputs durante o salvamento
  const allInputs = row.querySelectorAll('.edit-input');
  allInputs.forEach(input => {
    input.disabled = true;
    input.classList.add('saving');
  });
  
  // Adicionar classe de carregamento e mostrar spinner  row.classList.add('loading');
  const actionsCell = row.querySelector('td:last-child');
  const originalActionsHtml = actionsCell.innerHTML;
  actionsCell.innerHTML = '<div class="table-actions"><div class="spinner"><i class="fas fa-spinner fa-spin"></i> Salvando...</div></div>';
  
  // Mostrar toast de carregamento
  let loadingToast;
  if (window.Toast) {
    loadingToast = window.Toast.info('Salvando alterações...', {
      position: 'bottom-right',
      duration: 0 
    });
  }
  
  // Enviar requisição para a API
  API.put(`/product/${productId}`, formData)
    .then(data => {
      console.log('Produto atualizado com sucesso:', data);
      
      // Remover toast de carregamento
      if (loadingToast && window.Toast) {
        window.Toast.remove(loadingToast);
      }
      
      // Atualizar os dados do produto na memória
      const productIndex = productsData.findIndex(p => p.id == productId);
      if (productIndex !== -1) {
        inputs.forEach(input => {
          const field = input.getAttribute('data-field');
          let value = input.value;
          
          // Converter valores conforme necessário
          if (field === 'price') {
            value = parseFloat(value.replace(',', '.'));
          } else if (field === 'stock') {
            value = parseInt(value);
          } else if (field === 'is_active') {
            value = value === 'true';
          }
          
          productsData[productIndex][field] = value;
        });
      }
      
      // Remover classes de edição e carregamento
      row.classList.remove('editing', 'loading');
      
      // Renderizar a tabela novamente
      renderProductsTable();
      
      // Destacar a linha atualizada com sucesso
      setTimeout(() => {
        const updatedRow = document.querySelector(`#productsTable tr[data-id="${productId}"]`);
        if (updatedRow) {
          updatedRow.classList.add('success-highlight');
          setTimeout(() => {
            updatedRow.classList.remove('success-highlight');
          }, 2000);
        }
      }, 50);
      
      // Mostrar toast de sucesso
      if (window.Toast) {
        window.Toast.success(`Produto atualizado com sucesso!`, {
          position: 'bottom-right',
          closeButton: true,
          pauseOnHover: true,
          title: null,
          zIndex: 99999,
        });
      }
    })
    .catch(error => {
      console.error('Erro na atualização:', error);
      
      // Remover toast de carregamento
      if (loadingToast && window.Toast) {
        window.Toast.remove(loadingToast);
      }
      
      // Restaurar o estado da linha
      row.classList.remove('loading');
      actionsCell.innerHTML = originalActionsHtml;
      
      // Reativar os inputs
      allInputs.forEach(input => {
        input.disabled = false;
        input.classList.remove('saving');
      });
      
      // Destacar a linha com erro
      row.classList.add('error-highlight');
      setTimeout(() => {
        row.classList.remove('error-highlight');
      }, 2000);
      
      // Mostrar toast de erro
      if (window.Toast) {
        window.Toast.error('Erro ao atualizar produto: ' + (error.message || 'Tente novamente'), {
          position: 'bottom-right',
          closeButton: true,
          pauseOnHover: true,
          title: 'Falha na atualização',
          zIndex: 99999,
        });
      }
    });
};

window.cancelProductEdit = function(productId) {
  console.log('Cancelando edição para o produto:', productId);
  const row = document.querySelector(`#productsTable tr[data-id="${productId}"]`);
  if (!row) {
    console.error('Linha da tabela não encontrada para o produto:', productId);
    return;
  }
  
  // Remover a classe de edição e adicionar a classe de cancelamento temporariamente
  row.classList.remove('editing');
  row.classList.add('edit-cancelled');
  
  // Remover a classe de cancelamento após a animação
  setTimeout(() => {
    row.classList.remove('edit-cancelled');
  }, 500);
  
  // Renderizar a tabela novamente para restaurar o estado original
  renderProductsTable();
};
