function isAuthenticated() {
  return localStorage.getItem('token') !== null;
}

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

function isAdmin() {
  const user = getCurrentUser();
  return user && user.type === 'admin';
}

function isOwner(resourceOwnerId) {
  const user = getCurrentUser();
  return user && user.id === resourceOwnerId;
}

function canEditRecipe(recipe) {
  if (isAdmin()) return true;

  const user = getCurrentUser();
  if (!user) return false;

  const recipeUserId = recipe.userId || recipe.user_id;
  return user.id === recipeUserId;
}

function canDeleteRecipe(recipe) {
  return isAdmin() || canEditRecipe(recipe);
}

function canDeleteComment(comment) {
  const adminCheck = isAdmin();

  if (adminCheck) return true;

  const user = getCurrentUser();
  if (!user) return false;

  const commentUserId = comment.user_id;
  return user.id === commentUserId;
}

function canEditComment(comment) {
  const user = getCurrentUser();
  if (!user) return false;

  const commentUserId = comment.user_id;
  return user.id === commentUserId;
}
