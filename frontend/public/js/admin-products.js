document.addEventListener('DOMContentLoaded', function () {
  if (window.Toast && typeof window.Toast.init === 'function') {
    window.Toast.init();
  }

  checkAdminAccess();
  loadProducts();
  loadCategories(); // Adicionar chamada para carregar categorias
  setupEventListeners();
});

let currentPage = 1;
const itemsPerPage = 10;
let totalProducts = 0;
let productsData = [];

// Função para carregar categorias
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

// Função para popular o select de filtro de categoria
function populateCategoryFilter(categories) {
  const filterSelect = document.getElementById('filterCategory');
  filterSelect.innerHTML = '<option value="">Todas as categorias</option>'; // Manter a opção padrão
  categories.forEach(category => {
    if (category.is_active) { // Adicionar apenas categorias ativas
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      filterSelect.appendChild(option);
    }
  });
}

// Função para popular o select de categoria no modal de edição
function populateCategoryModalSelect(categories) {
  const modalSelect = document.getElementById('editProductCategory');
  modalSelect.innerHTML = '<option value="">Selecione uma categoria</option>'; // Manter a opção padrão
  categories.forEach(category => {
    if (category.is_active) { // Adicionar apenas categorias ativas
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
      <td><span class="status-badge ${product.is_active ? 'active' : 'inactive'}">${product.is_active ? 'Ativo' : 'Inativo'}</span></td>
      <td>
        <div class="table-actions">
          <button class="action-btn edit-btn" onclick="openEditModal(${product.id})" title="Editar">
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
  } else { // Adicionado para ocultar o campo de tamanho personalizado se não for custom
    document.getElementById('editCustomSizeContainer').style.display = 'none';
    document.getElementById('editProductCustomSize').value = '';
  }

  const previewImgContainer = document.getElementById('editImagePreview');
  previewImgContainer.innerHTML = ''; // Limpa o preview anterior
  if (product.image) {
    const img = document.createElement('img');
    img.src = `http://localhost:3001/api/product/image/${product.id}`;
    img.alt = product.name;
    img.className = 'uploaded-image-preview'; // Classe para a imagem de preview
    previewImgContainer.appendChild(img);
  } else {
    // Adiciona o ícone padrão se não houver imagem
    previewImgContainer.innerHTML = '<span class="default-image-icon"><i class="fas fa-image"></i></span>';
  }

  const modal = document.getElementById('editProductModal');
  modal.classList.add('show');
};

window.openDeleteModal = function (productId, productName) {
  document.getElementById('deleteProductId').value = productId;
  document.getElementById('deleteProductName').textContent = productName;

  const modal = document.getElementById('deleteConfirmModal');
  modal.classList.add('show');
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
        imagePreview.innerHTML = ''; // Limpa o conteúdo anterior (ícone ou imagem antiga)
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = 'Imagem do produto';
        img.className = 'uploaded-image-preview'; // Classe para a imagem de preview
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

  API.delete(`/product/${productId}`)
    .then(() => {
      console.log('Produto excluído com sucesso');

      row.style.opacity = '0';
      setTimeout(() => {
        loadProducts();

        if (window.Toast) {
          window.Toast.success('Produto excluído com sucesso!');
        }

        document.getElementById('deleteConfirmModal').classList.remove('show');
      }, 500);
    })
    .catch(error => {
      console.error('Erro na exclusão:', error);

      row.style.opacity = '1';

      renderProductsTable();

      if (window.Toast) {
        window.Toast.error('Erro ao excluir produto: ' + (error.message || 'Tente novamente'));
      }
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

// Funções utilitárias para formatação de data
function formatDate(dateString) {
  if (!dateString) return 'N/A'; // Adicionado retorno para data inválida
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

function formatDateForInput(dateString) {
  if (!dateString) return ''; // Adicionado retorno para data inválida
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}
