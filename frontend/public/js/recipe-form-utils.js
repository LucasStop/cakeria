// Função utilitária para garantir que as categorias estão carregadas
async function ensureCategoriesLoaded() {
  const categorySelect = document.getElementById('recipe-category');

  // Se o select existe e não tem opções (além do placeholder)
  if (categorySelect && categorySelect.options.length <= 1) {
    console.log('Select de categorias está vazio, recarregando categorias...');

    try {
      // Adicionar um indicador visual de carregamento
      const loadingOption = document.createElement('option');
      loadingOption.textContent = 'Carregando categorias...';
      loadingOption.disabled = true;
      loadingOption.selected = true;
      categorySelect.appendChild(loadingOption);

      // Carregar categorias
      await loadCategories();

      // Remover indicador de carregamento
      categorySelect.removeChild(loadingOption);

      return true;
    } catch (error) {
      console.error('Falha ao recarregar categorias:', error);
      return false;
    }
  }

  return true; // Categorias já estão carregadas ou select não existe
}

// Função para tratar erros de carregamento de categorias de forma interativa
function handleCategoryLoadingError() {
  const categorySelect = document.getElementById('recipe-category');
  if (!categorySelect) return;

  // Adicionar botão de recarga ao lado do select
  const parentElement = categorySelect.parentElement;

  // Verificar se já existe um botão de recarga
  const existingButton = parentElement.querySelector('.reload-categories-btn');
  if (existingButton) return;

  // Criar e adicionar botão
  const reloadButton = document.createElement('button');
  reloadButton.type = 'button';
  reloadButton.className = 'btn btn-outline reload-categories-btn';
  reloadButton.innerHTML = '<i class="fas fa-sync-alt"></i> Recarregar';
  reloadButton.style.marginLeft = '10px';

  reloadButton.addEventListener('click', async function () {
    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';

    try {
      await loadCategories();
      showError('category-error', 'Categorias recarregadas com sucesso!', 'success');
    } catch (error) {
      showError('category-error', 'Falha ao carregar categorias. Tente novamente.');
    } finally {
      this.disabled = false;
      this.innerHTML = '<i class="fas fa-sync-alt"></i> Recarregar';
    }
  });

  parentElement.appendChild(reloadButton);
}

// Sobrescrever a função showError para suportar mensagens de sucesso
function showError(elementId, message, type = 'error') {
  const errorElement = document.getElementById(elementId);

  if (!errorElement) {
    console.warn(`Elemento de erro #${elementId} não encontrado`);
    return;
  }

  errorElement.textContent = message;
  errorElement.classList.add('active');

  // Aplicar cor baseada no tipo
  if (type === 'success') {
    errorElement.style.color = '#4CAF50';
  } else {
    errorElement.style.color = '#F44336';
  }

  // Notificação toast para erros críticos
  if (elementId === 'form-error') {
    if (type === 'success') {
      Notifications.success(message, 'Sucesso');
    } else {
      Notifications.error(message, 'Erro no formulário');
    }
  }

  // Remover depois de 5 segundos
  setTimeout(() => {
    errorElement.classList.remove('active');
    errorElement.textContent = '';
    errorElement.style.color = '';
  }, 5000);
}
