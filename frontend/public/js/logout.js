function logout() {

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('justLoggedIn');

  window.location.href = '/index.html?logout=true';
}

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  const logoutBtns = document.querySelectorAll('.logout-btn');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', logout);
  });
});
