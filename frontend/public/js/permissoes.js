// Funções de autorização para o frontend

// Verifica se o usuário atual está autenticado
function isAuthenticated() {
  return localStorage.getItem('token') !== null;
}

// Obtém o usuário atual do localStorage
function getCurrentUser() {
  const userJson = localStorage.getItem('user');
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch (e) {
    console.error('Erro ao obter dados do usuário:', e);
    return null;
  }
}

// Verifica se o usuário atual é admin
function isAdmin() {
  const user = getCurrentUser();
  return user && user.type === 'admin';
}

// Verifica se o usuário é o proprietário do recurso
function isOwner(resourceOwnerId) {
  const user = getCurrentUser();
  return user && user.id === resourceOwnerId;
}

// Verifica se o usuário pode editar uma receita
function canEditRecipe(recipe) {
  // Admins podem editar qualquer receita
  if (isAdmin()) return true;

  // Verifica se o usuário atual é o autor da receita
  const user = getCurrentUser();
  if (!user) return false;

  const recipeUserId = recipe.userId || recipe.user_id;
  return user.id === recipeUserId;
}

// Verifica se o usuário pode excluir uma receita
function canDeleteRecipe(recipe) {
  // Apenas admins e proprietários podem excluir
  return isAdmin() || canEditRecipe(recipe);
}

// Verifica se o usuário pode excluir um comentário
function canDeleteComment(comment) {
  // Admins podem excluir qualquer comentário
  if (isAdmin()) return true;

  // Usuários podem excluir seus próprios comentários
  const user = getCurrentUser();
  if (!user) return false;

  const commentUserId = comment.user_id;
  return user.id === commentUserId;
}

// Verifica se o usuário pode editar um comentário
function canEditComment(comment) {
  // Apenas o autor do comentário pode editar (não admin)
  const user = getCurrentUser();
  if (!user) return false;

  const commentUserId = comment.user_id;
  return user.id === commentUserId;
}
