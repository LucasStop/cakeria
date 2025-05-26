function logout() {
  console.log('Iniciando processo de logout');

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('justLoggedIn');

  window.location.href = '/index.html?logout=true';
}

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
    console.log('Evento de logout registrado no botão principal');
  }

  const logoutBtns = document.querySelectorAll('.logout-btn');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', logout);
    console.log('Evento de logout registrado no dropdown do header');
  });
});
