function logout() {
  console.log('Iniciando processo de logout');

  localStorage.removeItem('token');
  localStorage.removeItem('user');

  window.location.href = '/index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
    console.log('Evento de logout registrado');
  }
});
