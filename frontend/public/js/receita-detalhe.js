document.addEventListener('DOMContentLoaded', async function () {
  const recipeId = getRecipeIdFromUrl();
  if (recipeId) {
    await fetchRecipeDetails(recipeId);
    setupCommentFunctionality(recipeId);
  }
});

function getRecipeIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

async function fetchRecipeDetails(id) {
  try {
    const response = await fetch(`${API.BASE_URL}/recipe/${id}`);
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

  // Atualizar o título da página
  document.title = `Cakeria | ${recipe.title}`;

  recipeDetail.innerHTML = `
    <div class="recipe-main-card">
      <div class="recipe-card-header">
        <h1 class="recipe-title">${recipe.title}</h1>
        <div class="recipe-meta">
          <span class="recipe-author"><i class="fas fa-user"></i> ${recipe.author ? recipe.author.name : 'Autor desconhecido'}</span>
          <span class="recipe-date"><i class="far fa-calendar"></i> ${formatDate(recipe.createdAt)}</span>
          <span class="recipe-views"><i class="far fa-eye"></i> ${recipe.views || 0} visualizações</span>
        </div>
        <div class="recipe-management" id="recipe-management-controls" style="display: none;">
          <button class="btn btn-outline btn-sm edit-recipe-btn">
            <i class="fas fa-edit"></i> Editar Receita
          </button>
          <button class="btn btn-outline btn-sm btn-danger delete-recipe-btn">
            <i class="fas fa-trash"></i> Excluir Receita
          </button>
        </div>
      </div>
      
      <div class="recipe-content-wrapper">
        <div class="recipe-image-container">
          <img src="${recipe.image_url || '/assets/placeholder.jpg'}" alt="${recipe.title}" class="recipe-main-image">
          
          <div class="recipe-badges">
            <span class="recipe-badge difficulty-${recipe.difficulty || 'medio'}">
              <i class="fas fa-signal"></i> ${formatDifficulty(recipe.difficulty)}
            </span>
            <span class="recipe-badge">
              <i class="fas fa-clock"></i> ${formatTotalTime(recipe.prepTime, recipe.cookTime)}
            </span>
            <span class="recipe-badge">
              <i class="fas fa-utensils"></i> ${recipe.servings || '4'} porções
            </span>
          </div>
          
          <div class="recipe-actions">
            <button class="btn btn-outline btn-icon" title="Salvar receita">
              <i class="far fa-bookmark" style="color: #444444;"></i>
            </button>
            <button class="btn btn-outline btn-icon" title="Imprimir receita">
              <i class="fas fa-print" style="color: #444444;"></i>
            </button>
            <button class="btn btn-outline btn-icon" title="Compartilhar receita">
              <i class="fas fa-share-alt" style="color: #444444;"></i>
            </button>
          </div>
        </div>
        
        <div class="recipe-details-container">
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
      const ingredientText = ingredient.trim();
      
      // Criar o ícone de verificação
      const icon = document.createElement('i');
      icon.className = 'fas fa-check';
      
      // Criar o texto do ingrediente
      const textSpan = document.createElement('span');
      textSpan.className = 'ingredient-text';
      textSpan.textContent = ingredientText;
      
      // Adicionar elementos ao li
      li.appendChild(icon);
      li.appendChild(textSpan);
      
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
  
  // Configurar botões de ação
  setupActionButtons(recipe);
  
  // Configurar botões de administração
  setupAdminButtons(recipe);
}

// Função auxiliar para formatar a dificuldade
function formatDifficulty(difficulty) {
  if (!difficulty) return 'Médio';
  
  switch(difficulty.toLowerCase()) {
    case 'facil':
    case 'fácil':
    case 'easy':
      return 'Fácil';
    case 'dificil':
    case 'difícil':
    case 'hard':
      return 'Difícil';
    default:
      return 'Médio';
  }
}

// Função auxiliar para calcular e formatar o tempo total
function formatTotalTime(prepTime, cookTime) {
  // Converter para números e garantir que são valores válidos
  const prep = parseInt(prepTime) || 0;
  const cook = parseInt(cookTime) || 0;
  
  const total = prep + cook;
  
  if (total >= 60) {
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    
    if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}min`;
    }
  } else {
    return `${total} min`;
  }
}

// Função para configurar a funcionalidade de comentários
function setupCommentFunctionality(recipeId) {
  const commentForm = document.getElementById('comment-form-wrapper');
  const loginMessage = document.getElementById('comment-login-message');
  const commentsList = document.getElementById('comments-list');
  
  // Verificar se o usuário está logado
  const isLoggedIn = localStorage.getItem('token') !== null;
  
  if (isLoggedIn) {
    // Mostrar formulário de comentário
    if (commentForm) commentForm.style.display = 'block';
    if (loginMessage) loginMessage.style.display = 'none';
    
    // Configurar botão de envio de comentário
    const submitButton = document.getElementById('submit-comment');
    const commentTextarea = document.getElementById('comment-text');
    
    if (submitButton && commentTextarea) {
      submitButton.addEventListener('click', async () => {
        const commentText = commentTextarea.value.trim();
        
        if (commentText) {
          try {
            // Desabilitar o botão enquanto envia
            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';
            
            // Enviar o comentário para a API
            await postComment(recipeId, commentText);
            
            // Limpar o campo de texto
            commentTextarea.value = '';
            
            // Recarregar os comentários
            await fetchComments(recipeId);
            
            // Notificar o usuário
            showNotification('Comentário publicado com sucesso!', 'success');
          } catch (error) {
            console.error('Erro ao publicar comentário:', error);
            showNotification('Erro ao publicar seu comentário. Tente novamente.', 'error');
          } finally {
            // Reativar o botão
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar Comentário';
          }
        }
      });
    }
  } else {
    // Mostrar mensagem de login
    if (commentForm) commentForm.style.display = 'none';
    if (loginMessage) loginMessage.style.display = 'block';
  }
  
  // Carregar comentários existentes
  fetchComments(recipeId);
}

// Função para buscar comentários
async function fetchComments(recipeId) {
  const commentsList = document.getElementById('comments-list');
  
  if (!commentsList) return;
  
  // Mostrar indicador de carregamento
  commentsList.innerHTML = `
    <div class="loading-indicator">
      <div class="spinner"></div>
      <p>Carregando comentários...</p>
    </div>
  `;
  
  try {
    // Buscar comentários da API usando a nova rota
    const response = await fetch(`${API.BASE_URL}/comments/recipe/${recipeId}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar comentários: ${response.status}`);
    }
    
    const comments = await response.json();
    
    // Renderizar comentários
    renderComments(comments);
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    commentsList.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Não foi possível carregar os comentários.</p>
      </div>
    `;
  }
}

// Função para renderizar comentários
function renderComments(comments) {
  const commentsList = document.getElementById('comments-list');
  
  if (!commentsList) return;
  
  if (!comments || comments.length === 0) {
    commentsList.innerHTML = `
      <div class="no-comments-message">
        <i class="far fa-comment-alt"></i>
        <p>Seja o primeiro a comentar nesta receita!</p>
      </div>
    `;
    return;
  }
  
  // Limpar a lista de comentários
  commentsList.innerHTML = '';
  
  // Template para comentários
  const template = document.getElementById('comment-template');
  
  // Adicionar cada comentário
  comments.forEach(comment => {
    if (template) {
      const commentElement = template.content.cloneNode(true);
      
      // Preencher os dados do comentário
      const commentNode = commentElement.querySelector('.comment');
      if (commentNode) {
        commentNode.setAttribute('data-comment-id', comment.id);
      }
      
      const author = commentElement.querySelector('.comment-author');
      if (author) author.textContent = comment.author?.name || 'Usuário anônimo';
      
      const date = commentElement.querySelector('.comment-date');
      if (date) date.textContent = formatDate(comment.createdAt);
      
      const text = commentElement.querySelector('.comment-text');
      if (text) text.textContent = comment.content;
      
      const initials = commentElement.querySelector('.avatar-initials');
      if (initials) {
        const userName = comment.author?.name || 'Usuário anônimo';
        initials.textContent = getUserInitials(userName);
        
        // Aplicar cor personalizada baseada no nome
        const bgColor = generateColorFromName(userName);
        initials.style.backgroundColor = bgColor;
        initials.style.color = '#FFFFFF';
      }
      
      const avatar = commentElement.querySelector('.avatar');
      if (avatar) {
        const userName = comment.author?.name || 'Usuário anônimo';
        avatar.style.backgroundColor = generateColorFromName(userName);
      }
      
      // Configurar botões de ação para comentários
      const actionsSection = commentElement.querySelector('.comment-actions');
      if (actionsSection) {
        // Verificar se o usuário pode excluir este comentário
        const canDelete = canDeleteComment(comment);
        const canEdit = canEditComment(comment);
        
        if (canDelete || canEdit) {
          actionsSection.style.display = 'block';
          
          // Configurar botão de exclusão
          if (canDelete) {
            const deleteButton = actionsSection.querySelector('.delete-comment');
            if (deleteButton) {
              deleteButton.setAttribute('data-comment-id', comment.id);
              deleteButton.addEventListener('click', function() {
                showDeleteCommentConfirmation(comment);
              });
            }
          } else {
            // Esconder botão de exclusão se não tiver permissão
            const deleteButton = actionsSection.querySelector('.delete-comment');
            if (deleteButton) {
              deleteButton.style.display = 'none';
            }
          }
          
      // Configurar botão de edição
          if (canEdit) {
            const editButton = actionsSection.querySelector('.edit-comment');
            if (editButton) {
              editButton.setAttribute('data-comment-id', comment.id);
              editButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Clicou para editar comentário:', comment.id);
                showEditCommentForm(comment);
              });
            }
          } else {
            // Esconder botão de edição se não tiver permissão
            const editButton = actionsSection.querySelector('.edit-comment');
            if (editButton) {
              editButton.style.display = 'none';
            }
          }
        }
      }
      
      commentsList.appendChild(commentElement);
    } else {
      // Fallback se o template não estiver disponível
      const commentElement = document.createElement('div');
      commentElement.className = 'comment';
      commentElement.innerHTML = `
        <div class="comment-content">
          <div class="comment-header">
            <h4 class="comment-author">${comment.author?.name || 'Usuário anônimo'}</h4>
            <span class="comment-date">${formatDate(comment.createdAt)}</span>
          </div>
          <div class="comment-text">${comment.content}</div>
        </div>
      `;
      commentsList.appendChild(commentElement);
    }
  });
}

// Função para enviar um novo comentário
async function postComment(recipeId, content) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Você precisa estar logado para comentar');
  }
  
  const response = await fetch(`${API.BASE_URL}/comments/${recipeId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ content })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erro ao enviar comentário: ${response.status}`);
  }
  
  return await response.json();
}

// Função para obter as iniciais do nome do usuário
function getUserInitials(name) {
  if (!name) return '?';
  
  const parts = name.split(' ').filter(p => p.trim().length > 0);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Função para gerar uma cor consistente baseada no nome de usuário
function generateColorFromName(name) {
  if (!name) return '#777777';
  
  // Lista de cores agradáveis para os avatares
  const colors = [
    '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', 
    '#448AFF', '#40C4FF', '#18FFFF', '#64FFDA', '#69F0AE', 
    '#B2FF59', '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40',
    '#5E35B1', '#3949AB', '#1E88E5', '#039BE5', '#00ACC1', 
    '#00897B', '#43A047', '#7CB342', '#C0CA33', '#FDD835', 
    '#FFB300', '#FB8C00', '#F4511E', '#6D4C41', '#757575'
  ];
  
  // Gerar um número baseado no nome
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Usar esse número para selecionar uma cor
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Função para exibir notificações
function showNotification(message, type = 'info') {
  // Verificar se temos o objeto de notificações global
  if (window.Notifications) {
    window.Notifications[type](message);
  } else {
    // Fallback: criar uma notificação simples
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remover após 5 segundos
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 5000);
  }
}

function formatArrayOrString(data) {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data.filter(item => item && item.trim());
  }

  if (typeof data === 'string') {
    if (data.trim().startsWith('[') || data.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => item && (typeof item === 'string' ? item.trim() : item));
        }
        return [JSON.stringify(parsed)];
      } catch (e) {}
    }

    if (data.includes('\n')) {
      return data.split('\n').filter(item => item.trim());
    } else if (data.includes(';')) {
      return data.split(';').filter(item => item.trim());
    } else if (data.includes(',')) {
      return data.split(',').filter(item => item.trim());
    }

    return [data];
  }

  return [String(data)];
}

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

// Função para configurar os botões de ação
function setupActionButtons(recipe) {
  // Botão de favoritar
  const favoriteButton = document.querySelector('.recipe-actions .btn-icon[title="Salvar receita"]');
  if (favoriteButton) {
    // Verificar se a receita já está nos favoritos
    const favorites = getFavoriteRecipes();
    const isAlreadyFavorite = favorites.some(fav => fav.id === recipe.id);
    
    // Atualizar o ícone se já for favorito
    if (isAlreadyFavorite) {
      const icon = favoriteButton.querySelector('i');
      icon.classList.remove('far');
      icon.classList.add('fas');
      icon.style.color = '#e55757'; // Cor de favorito
    }
    
    favoriteButton.addEventListener('click', function() {
      toggleFavoriteRecipe(recipe, this);
    });
  }
  
  // Botão de imprimir
  const printButton = document.querySelector('.recipe-actions .btn-icon[title="Imprimir receita"]');
  if (printButton) {
    printButton.addEventListener('click', function() {
      printRecipe(recipe);
    });
  }
  
  // Botão de compartilhar
  const shareButton = document.querySelector('.recipe-actions .btn-icon[title="Compartilhar receita"]');
  if (shareButton) {
    shareButton.addEventListener('click', function() {
      shareRecipe(recipe);
    });
  }
}

// Função para obter receitas favoritas do localStorage
function getFavoriteRecipes() {
  const favorites = localStorage.getItem('favoriteRecipes');
  return favorites ? JSON.parse(favorites) : [];
}

// Função para alternar o status de favorito de uma receita
function toggleFavoriteRecipe(recipe, button) {
  const favorites = getFavoriteRecipes();
  const index = favorites.findIndex(fav => fav.id === recipe.id);
  const icon = button.querySelector('i');
  
  if (index === -1) {
    // Adicionar aos favoritos
    const favoriteRecipe = {
      id: recipe.id,
      title: recipe.title,
      image_url: recipe.image_url,
      difficulty: recipe.difficulty,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      dateAdded: new Date().toISOString()
    };
    
    favorites.push(favoriteRecipe);
    
    // Atualizar visual
    icon.classList.remove('far');
    icon.classList.add('fas');
    icon.style.color = '#e55757'; // Cor de favorito
    
    showNotification('Receita adicionada aos favoritos!', 'success');
  } else {
    // Remover dos favoritos
    favorites.splice(index, 1);
    
    // Atualizar visual
    icon.classList.remove('fas');
    icon.classList.add('far');
    icon.style.color = '#444444'; // Cor normal
    
    showNotification('Receita removida dos favoritos!', 'info');
  }
  
  // Salvar no localStorage
  localStorage.setItem('favoriteRecipes', JSON.stringify(favorites));
}

// Função para imprimir a receita
function printRecipe(recipe) {
  // Criar um novo documento para impressão com layout mais limpo
  const printWindow = window.open('', '_blank');
  
  // Gerar o HTML para impressão
  const formattedIngredients = formatArrayOrString(recipe.ingredients)
    .map(ingredient => `<li>${ingredient.trim()}</li>`)
    .join('');
    
  const formattedInstructions = formatArrayOrString(recipe.instructions)
    .map((step, index) => `<li><strong>${index + 1}.</strong> ${step.trim()}</li>`)
    .join('');
  
  const printContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cakeria | ${recipe.title}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
        }
        .print-header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #e55757;
          padding-bottom: 20px;
        }
        .print-header h1 {
          color: #e55757;
          margin-bottom: 10px;
        }
        .recipe-meta {
          display: flex;
          justify-content: center;
          gap: 20px;
          font-size: 14px;
          color: #666;
          margin-bottom: 20px;
        }
        .recipe-section {
          margin-bottom: 30px;
        }
        .recipe-section h2 {
          border-bottom: 1px solid #ddd;
          padding-bottom: 8px;
          color: #e55757;
        }
        ul, ol {
          padding-left: 25px;
        }
        li {
          margin-bottom: 8px;
        }
        .print-footer {
          text-align: center;
          margin-top: 40px;
          font-size: 12px;
          color: #888;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="print-header">
        <h1>${recipe.title}</h1>
        <div class="recipe-meta">
          <span>Dificuldade: ${formatDifficulty(recipe.difficulty)}</span>
          <span>Tempo: ${formatTotalTime(recipe.prepTime, recipe.cookTime)}</span>
          <span>Porções: ${recipe.servings || '4'}</span>
        </div>
      </div>
      
      <div class="recipe-section">
        <h2>Ingredientes</h2>
        <ul>
          ${formattedIngredients}
        </ul>
      </div>
      
      <div class="recipe-section">
        <h2>Modo de Preparo</h2>
        <ol>
          ${formattedInstructions}
        </ol>
      </div>
      
      <div class="print-footer">
        <p>Receita obtida de Cakeria © ${new Date().getFullYear()}</p>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.open();
  printWindow.document.write(printContent);
  printWindow.document.close();
}

// Função para compartilhar a receita
function shareRecipe(recipe) {
  const currentUrl = window.location.href;
  const recipeTitle = recipe.title;
  
  // Verificar se a API de compartilhamento está disponível
  if (navigator.share) {
    navigator.share({
      title: `Cakeria | ${recipeTitle}`,
      text: `Confira essa receita incrível de ${recipeTitle} que encontrei na Cakeria!`,
      url: currentUrl
    })
    .then(() => showNotification('Receita compartilhada com sucesso!', 'success'))
    .catch(error => {
      console.error('Erro ao compartilhar:', error);
      showFallbackShareOptions(currentUrl, recipeTitle);
    });
  } else {
    // Fallback para navegadores que não suportam a API Share
    showFallbackShareOptions(currentUrl, recipeTitle);
  }
}

// Configurar botões de administração na página de detalhes da receita
function setupAdminButtons(recipe) {
  const managementControls = document.getElementById('recipe-management-controls');
  if (!managementControls) return;
  
  // Verificar se o usuário pode editar/excluir esta receita
  const canEdit = canEditRecipe(recipe);
  const canDelete = canDeleteRecipe(recipe);
  
  if (canEdit || canDelete) {
    // Mostrar a seção de gerenciamento
    managementControls.style.display = 'flex';
    
    // Configurar botão de edição se o usuário tiver permissão
    if (canEdit) {
      const editButton = managementControls.querySelector('.edit-recipe-btn');
      if (editButton) {
        editButton.addEventListener('click', () => {
          window.location.href = `/compartilhar-receita.html?id=${recipe.id}`;
        });
      }
    } else {
      // Esconder botão de edição se não tiver permissão
      const editButton = managementControls.querySelector('.edit-recipe-btn');
      if (editButton) {
        editButton.style.display = 'none';
      }
    }
    
    // Configurar botão de exclusão se o usuário tiver permissão
    if (canDelete) {
      const deleteButton = managementControls.querySelector('.delete-recipe-btn');
      if (deleteButton) {
        deleteButton.addEventListener('click', () => {
          showDeleteConfirmation(recipe);
        });
      }
    } else {
      // Esconder botão de exclusão se não tiver permissão
      const deleteButton = managementControls.querySelector('.delete-recipe-btn');
      if (deleteButton) {
        deleteButton.style.display = 'none';
      }
    }
  }
}

// Mostrar confirmação para excluir receita
function showDeleteConfirmation(recipe) {
  const dialog = document.createElement('div');
  dialog.className = 'confirmation-dialog';
  dialog.innerHTML = `
    <div class="dialog-content">
      <h3 class="dialog-title">Excluir Receita</h3>
      <p class="dialog-message">Tem certeza que deseja excluir a receita "${recipe.title}"? Esta ação não pode ser desfeita.</p>
      <div class="dialog-buttons">
        <button class="dialog-btn dialog-btn-cancel">Cancelar</button>
        <button class="dialog-btn dialog-btn-confirm">Excluir</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  // Manipular botão de cancelar
  const cancelButton = dialog.querySelector('.dialog-btn-cancel');
  cancelButton.addEventListener('click', () => {
    dialog.remove();
  });
  
  // Manipular botão de confirmar
  const confirmButton = dialog.querySelector('.dialog-btn-confirm');
  confirmButton.addEventListener('click', async () => {
    try {
      // Adicionar indicador de carregamento
      confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';
      confirmButton.disabled = true;
      
      // Fazer a requisição para excluir a receita
      await fetch(`${API.BASE_URL}/recipe/${recipe.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Mostrar notificação de sucesso
      showNotification('Receita excluída com sucesso!', 'success');
      
      // Redirecionar para a página de receitas
      setTimeout(() => {
        window.location.href = '/receitas.html';
      }, 1500);
    } catch (error) {
      console.error('Erro ao excluir receita:', error);
      showNotification('Erro ao excluir receita. Tente novamente.', 'error');
      dialog.remove();
    }
  });
}

// Mostrar confirmação para excluir comentário
function showDeleteCommentConfirmation(comment) {
  const dialog = document.createElement('div');
  dialog.className = 'confirmation-dialog';
  dialog.innerHTML = `
    <div class="dialog-content">
      <h3 class="dialog-title">Excluir Comentário</h3>
      <p class="dialog-message">Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.</p>
      <div class="dialog-buttons">
        <button class="dialog-btn dialog-btn-cancel">Cancelar</button>
        <button class="dialog-btn dialog-btn-confirm">Excluir</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  // Manipular botão de cancelar
  const cancelButton = dialog.querySelector('.dialog-btn-cancel');
  cancelButton.addEventListener('click', () => {
    dialog.remove();
  });
  
  // Manipular botão de confirmar
  const confirmButton = dialog.querySelector('.dialog-btn-confirm');
  confirmButton.addEventListener('click', async () => {
    try {
      // Adicionar indicador de carregamento
      confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';
      confirmButton.disabled = true;
      
      // Fazer a requisição para excluir o comentário
      await fetch(`${API.BASE_URL}/comments/${comment.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Recarregar os comentários
      await fetchComments(getRecipeIdFromUrl());
      
      // Mostrar notificação de sucesso
      showNotification('Comentário excluído com sucesso!', 'success');
      
      // Remover o diálogo
      dialog.remove();
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      showNotification('Erro ao excluir comentário. Tente novamente.', 'error');
      dialog.remove();
    }
  });
}

// Mostrar formulário para editar comentário
function showEditCommentForm(comment) {
  console.log('Editando comentário:', comment);
  
  // Marcar visualmente o comentário que está sendo editado
  const commentElement = document.querySelector(`.comment[data-comment-id="${comment.id}"]`);
  if (commentElement) {
    commentElement.classList.add('editing');
  } else {
    console.warn('Elemento do comentário não encontrado:', comment.id);
  }
  
  const dialog = document.createElement('div');
  dialog.className = 'edit-comment-dialog';
  dialog.innerHTML = `
    <div class="dialog-content">
      <h3 class="dialog-title">Editar Comentário</h3>
      <textarea class="edit-comment-textarea">${comment.content}</textarea>
      <div class="dialog-buttons">
        <button class="dialog-btn dialog-btn-cancel">Cancelar</button>
        <button class="dialog-btn dialog-btn-save">Salvar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  // Focar no textarea
  const textarea = dialog.querySelector('.edit-comment-textarea');
  textarea.focus();
  
  // Adicionar atalho de teclado (Ctrl+Enter para salvar)
  textarea.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      saveButton.click();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelButton.click();
    }
  });
  
  // Manipular botão de cancelar
  const cancelButton = dialog.querySelector('.dialog-btn-cancel');
  cancelButton.addEventListener('click', () => {
    // Remover classe de edição do comentário
    if (commentElement) {
      commentElement.classList.remove('editing');
    }
    dialog.remove();
  });
  
  // Manipular botão de salvar
  const saveButton = dialog.querySelector('.dialog-btn-save');
  saveButton.addEventListener('click', async () => {
    const newContent = textarea.value.trim();
    
    if (!newContent) {
      showNotification('O comentário não pode estar vazio.', 'warning');
      return;
    }
    
    try {
      // Adicionar indicador de carregamento
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
      saveButton.disabled = true;
      
      console.log('Enviando atualização para o comentário:', comment.id);
      
      // Fazer a requisição para atualizar o comentário
      const response = await fetch(`${API.BASE_URL}/comments/${comment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: newContent })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar comentário');
      }
      
      console.log('Comentário atualizado com sucesso');
      
      // Recarregar os comentários
      await fetchComments(getRecipeIdFromUrl());
      
      // Mostrar notificação de sucesso
      showNotification('Comentário atualizado com sucesso!', 'success');
      
      // Remover classe de edição do comentário
      if (commentElement) {
        commentElement.classList.remove('editing');
      }
      
      // Remover o diálogo
      dialog.remove();
    } catch (error) {
      console.error('Erro ao atualizar comentário:', error);
      showNotification('Erro ao atualizar comentário. Tente novamente.', 'error');
      saveButton.innerHTML = 'Salvar';
      saveButton.disabled = false;
    }
  });
}

// Opções alternativas de compartilhamento
function showFallbackShareOptions(url, title) {
  // Criar menu de compartilhamento
  const shareMenu = document.createElement('div');
  shareMenu.className = 'share-menu';
  shareMenu.innerHTML = `
    <div class="share-menu-content">
      <h3>Compartilhar Receita</h3>
      <div class="share-buttons">
        <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(`Confira essa receita incrível de ${title} que encontrei na Cakeria! ${url}`)}" target="_blank" class="share-button whatsapp">
          <i class="fab fa-whatsapp"></i> WhatsApp
        </a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" class="share-button facebook">
          <i class="fab fa-facebook-f"></i> Facebook
        </a>
        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`Confira essa receita incrível de ${title} que encontrei na Cakeria!`)}&url=${encodeURIComponent(url)}" target="_blank" class="share-button twitter">
          <i class="fab fa-twitter"></i> Twitter
        </a>
        <a href="mailto:?subject=${encodeURIComponent(`Receita de ${title} - Cakeria`)}&body=${encodeURIComponent(`Olá! Confira essa receita incrível que encontrei na Cakeria: ${url}`)}" class="share-button email">
          <i class="fas fa-envelope"></i> Email
        </a>
        <button class="share-button copy-link" id="copy-link-btn">
          <i class="fas fa-link"></i> Copiar Link
        </button>
      </div>
      <button class="close-share-menu">Fechar</button>
    </div>
  `;
  
  // Estilos CSS inline
  const style = document.createElement('style');
  style.textContent = `
    .share-menu {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.6);
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
      animation: fadeIn 0.3s ease-out;
    }
    .share-menu-content {
      background: white;
      border-radius: 12px;
      padding: 25px;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }
    .share-menu h3 {
      text-align: center;
      margin-top: 0;
      color: #333;
      font-size: 1.4rem;
      margin-bottom: 20px;
    }
    .share-buttons {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .share-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 12px;
      border-radius: 8px;
      color: white;
      text-decoration: none;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      font-family: inherit;
      font-size: 1rem;
    }
    .share-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
    .whatsapp { background-color: #25D366; }
    .facebook { background-color: #1877F2; }
    .twitter { background-color: #1DA1F2; }
    .email { background-color: #FF5722; }
    .copy-link { background-color: #607D8B; }
    .close-share-menu {
      display: block;
      width: 100%;
      padding: 12px;
      background-color: #f5f5f5;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      color: #333;
      font-family: inherit;
      font-size: 1rem;
    }
    .close-share-menu:hover {
      background-color: #e0e0e0;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(shareMenu);
  
  // Manipular o clique no botão de fechar
  const closeButton = shareMenu.querySelector('.close-share-menu');
  closeButton.addEventListener('click', function() {
    shareMenu.remove();
  });
  
  // Manipular o clique fora do menu
  shareMenu.addEventListener('click', function(e) {
    if (e.target === shareMenu) {
      shareMenu.remove();
    }
  });
  
  // Funcionalidade para copiar o link
  const copyLinkButton = shareMenu.querySelector('#copy-link-btn');
  copyLinkButton.addEventListener('click', function() {
    navigator.clipboard.writeText(url)
      .then(() => {
        copyLinkButton.textContent = 'Link Copiado!';
        setTimeout(() => {
          copyLinkButton.innerHTML = '<i class="fas fa-link"></i> Copiar Link';
        }, 2000);
      })
      .catch(err => {
        console.error('Erro ao copiar o link:', err);
        // Fallback para navegadores que não suportam clipboard API
        const tempInput = document.createElement('input');
        tempInput.value = url;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        copyLinkButton.textContent = 'Link Copiado!';
        setTimeout(() => {
          copyLinkButton.innerHTML = '<i class="fas fa-link"></i> Copiar Link';
        }, 2000);
      });
  });
}
