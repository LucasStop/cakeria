
document.addEventListener('DOMContentLoaded', function () {
  checkAdminAccess();
  loadUsers();
  setupEventListeners();
  setupFormMasks();
});

let currentPage = 1;
const itemsPerPage = 10;
let totalUsers = 0;
let usersData = [];  
function checkAdminAccess() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    alert('Você precisa estar logado como administrador para acessar esta página.');
    window.location.href = 'login.html?redirect=admin-users.html';
    return;
  }
  
  fetch('http://localhost:3001/api/auth/verify', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
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

function loadUsers() {
  const token = localStorage.getItem('token');
  const searchTerm = document.getElementById('searchUser').value.toLowerCase();
  const typeFilter = document.getElementById('filterType').value;  
  showLoadingState(true);
  
  fetch('http://localhost:3001/api/user', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Erro ao carregar usuários');
    }
    return response.json();
  })
  .then(users => {
    usersData = users.filter(user => {
      const matchesSearch = !searchTerm || 
                           user.name.toLowerCase().includes(searchTerm) || 
                           user.email.toLowerCase().includes(searchTerm);
      const matchesType = !typeFilter || user.type === typeFilter;
      
      return matchesSearch && matchesType;
    });
    
    totalUsers = usersData.length;
    
    renderUsersTable();
    renderPagination();
    showLoadingState(false);
    
    if (window.showScrollIndicator) {
      setTimeout(() => window.showScrollIndicator(), 100);
    }
  })
  .catch(error => {
    console.error('Erro:', error);
    showLoadingState(false);
    alert('Erro ao carregar a lista de usuários. Por favor, tente novamente.');
  });
}

function renderUsersTable() {
  const tableBody = document.querySelector('#usersTable tbody');
  tableBody.innerHTML = '';
  
  if (usersData.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum usuário encontrado</td></tr>';
    return;
  }
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalUsers);
  
  for (let i = startIndex; i < endIndex; i++) {
    const user = usersData[i];
    const row = document.createElement('tr');
    
    let lastLoginFormatted = 'Nunca';
    if (user.last_login) {
      const date = new Date(user.last_login);
      lastLoginFormatted = `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR')}`;
    }
      row.innerHTML = `
      <td data-label="Nome">${user.name}</td>
      <td data-label="Email">${user.email}</td>
      <td data-label="Tipo">${user.type === 'admin' ? 'Administrador' : 'Cliente'}</td>
      <td data-label="Telefone">${user.phone || '-'}</td>
      <td data-label="Último Login">${lastLoginFormatted}</td>
      <td data-label="Ações" class="table-actions">
        <button class="action-btn edit-btn" data-id="${user.id}" title="Editar">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete-btn" data-id="${user.id}" data-name="${user.name}" title="Excluir">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    `;
    
    tableBody.appendChild(row);
  }
  
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      openEditModal(this.getAttribute('data-id'));
    });
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      openDeleteModal(this.getAttribute('data-id'), this.getAttribute('data-name'));
    });
  });
}

function renderPagination() {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';
  
  const totalPages = Math.ceil(totalUsers / itemsPerPage);
  
  if (totalPages <= 1) {
    return;
  }
  
  const prevButton = document.createElement('button');
  prevButton.innerHTML = '&laquo;';
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderUsersTable();
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
      renderUsersTable();
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
      renderUsersTable();
      renderPagination();
    }
  });
  pagination.appendChild(nextButton);
}

function openEditModal(userId) {
  const user = usersData.find(u => u.id == userId);
  if (!user) return;
  
  document.getElementById('editUserId').value = user.id;
  document.getElementById('editName').value = user.name;
  document.getElementById('editEmail').value = user.email;
  document.getElementById('editCpf').value = user.cpf || '';
  document.getElementById('editPassword').value = '';
  document.getElementById('editCurrentPassword').value = '';
  document.getElementById('editType').value = user.type;
  document.getElementById('editPhone').value = user.phone || '';
  
  // Atualizar a visualização da imagem do usuário
  const avatarPreview = document.getElementById('editAvatarPreview');
  avatarPreview.innerHTML = ''; // Limpar conteúdo anterior
    // Verificar se o usuário tem imagem e mostrar
  if (user.image) {
    const img = document.createElement('img');
    img.src = `http://localhost:3001/api/user/${user.id}/image?t=${new Date().getTime()}`; // Evitar cache
    img.alt = `Foto de ${user.name}`;
    img.className = 'uploaded-avatar';
    avatarPreview.appendChild(img);
  } else {
    // Exibir ícone padrão se não houver imagem
    const icon = document.createElement('i');
    icon.className = 'fas fa-user default-avatar-icon';
    avatarPreview.appendChild(icon);
  }
  
  document.getElementById('editUserModal').style.display = 'block';
}

function openDeleteModal(userId, userName) {
  document.getElementById('deleteUserId').value = userId;
  document.getElementById('deleteUserName').textContent = userName;
  document.getElementById('deleteConfirmModal').style.display = 'block';
}

function setupFormMasks() {
  const cpfInputs = document.querySelectorAll('#editCpf');
  cpfInputs.forEach(input => {
    input.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);
      
      if (value.length > 9) {
        value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      } else if (value.length > 6) {
        value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
      } else if (value.length > 3) {
        value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
      }
      
      e.target.value = value;
    });
  });
  
  const phoneInputs = document.querySelectorAll('#editPhone');
  phoneInputs.forEach(input => {
    input.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);
      
      if (value.length > 10) {
        value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      } else if (value.length > 6) {
        value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
      } else if (value.length > 2) {
        value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
      }
      
      e.target.value = value;
    });
  });
}

// Configurar event listeners
function setupEventListeners() {
  
  // Evento para visualizar imagem selecionada
  document.getElementById('editAvatar').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        document.getElementById('edit-avatar-error').textContent = 'A imagem deve ter no máximo 5MB';
        return;
      }
      
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
        document.getElementById('edit-avatar-error').textContent = 'Formato de imagem inválido. Use JPG, PNG ou WebP';
        return;
      }
      
      document.getElementById('edit-avatar-error').textContent = '';
      const reader = new FileReader();
      reader.onload = function(e) {
        const avatarPreview = document.getElementById('editAvatarPreview');
        avatarPreview.innerHTML = '';
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = 'Foto de perfil';
        img.className = 'uploaded-avatar';
        avatarPreview.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  });
    // Botão para selecionar nova imagem
  document.getElementById('editSelectAvatarBtn').addEventListener('click', function() {
    document.getElementById('editAvatar').click();
  });
  
  // Toggle para mostrar/ocultar senha
  document.getElementById('editPasswordToggle').addEventListener('click', function() {
    const passwordField = document.getElementById('editPassword');
    const icon = this.querySelector('i');
    
    if (passwordField.type === 'password') {
      passwordField.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    } else {
      passwordField.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  });
  
  // Toggle para mostrar/ocultar senha atual
  document.getElementById('editCurrentPasswordToggle').addEventListener('click', function() {
    const passwordField = document.getElementById('editCurrentPassword');
    const icon = this.querySelector('i');
    
    if (passwordField.type === 'password') {
      passwordField.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    } else {
      passwordField.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  });
  // Form de edição de usuário
  document.getElementById('editUserForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const userId = document.getElementById('editUserId').value;
    const avatarFile = document.getElementById('editAvatar').files[0];
    
    // Validar campos obrigatórios
    const name = document.getElementById('editName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    
    if (!name) {
      document.getElementById('edit-name-error').textContent = 'Nome é obrigatório';
      return;
    } else {
      document.getElementById('edit-name-error').textContent = '';
    }
    
    if (!email) {
      document.getElementById('edit-email-error').textContent = 'E-mail é obrigatório';
      return;
    } else {
      document.getElementById('edit-email-error').textContent = '';
    }
    
    // Criar FormData para enviar dados multipart (incluindo a imagem)
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('cpf', document.getElementById('editCpf').value || '');
    formData.append('type', document.getElementById('editType').value);
    formData.append('phone', document.getElementById('editPhone').value || '');
    
    // Senha e senha atual (se estiver mudando a senha)
    const password = document.getElementById('editPassword').value;
    const currentPassword = document.getElementById('editCurrentPassword').value;
    
    if (password) {
      if (!currentPassword) {
        document.getElementById('edit-password-error').textContent = 'A senha atual é necessária para alterar a senha';
        return;
      }
      formData.append('password', password);
      formData.append('currentPassword', currentPassword);
    }
    
    // Adicionar imagem se houver
    if (avatarFile) {
      formData.append('image', avatarFile);
    }
    
    updateUser(userId, formData);
  });
  
  // Confirmação de exclusão
  document.getElementById('confirmDelete').addEventListener('click', function() {
    const userId = document.getElementById('deleteUserId').value;
    deleteUser(userId);
  });
  
  // Filtros de pesquisa  document.getElementById('searchUser').addEventListener('input', debounce(loadUsers, 300));
  document.getElementById('filterType').addEventListener('change', loadUsers);
  
  // Fechar modais
  document.querySelectorAll('.close-modal').forEach(elem => {
    elem.addEventListener('click', function() {
      document.getElementById('editUserModal').style.display = 'none';
      document.getElementById('deleteConfirmModal').style.display = 'none';
    });
  });
  
  // Fechar modal clicando fora
  window.addEventListener('click', function(event) {
    if (event.target === document.getElementById('editUserModal')) {
      document.getElementById('editUserModal').style.display = 'none';
    }
    if (event.target === document.getElementById('deleteConfirmModal')) {
      document.getElementById('deleteConfirmModal').style.display = 'none';
    }
  });
  
  // Verificar se o botão de cancelar existe e adicionar evento
  const cancelButtons = document.querySelectorAll('button.btn-secondary.close-modal');
  cancelButtons.forEach(button => {
    button.addEventListener('click', function() {
      document.getElementById('editUserModal').style.display = 'none';
      document.getElementById('deleteConfirmModal').style.display = 'none';
    });
  });
}

// Criar novo usuário
function createUser(userData) {
  const token = localStorage.getItem('token');
  
  fetch('http://localhost:3001/api/user', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: userData // Já deve ser um FormData
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => {
        throw new Error(err.message || 'Erro ao criar usuário');
      });
    }
    return response.json();
  })
  .then(data => {
    alert('Usuário criado com sucesso!');
    loadUsers();
  })
  .catch(error => {
    console.error('Erro:', error);
    alert('Erro ao criar usuário: ' + error.message);
  });
}

// Atualizar usuário
function updateUser(userId, formData) {
  const token = localStorage.getItem('token');
  
  // Mostrar feedback visual de carregamento
  const submitButton = document.querySelector('#editUserForm button[type="submit"]');
  const originalButtonText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    console.log("Enviando atualização para usuário:", userId);
  
  fetch(`http://localhost:3001/api/user/${userId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })
  .then(response => {
    console.log("Resposta recebida:", response.status);
    if (!response.ok) {
      return response.json().then(err => {
        throw new Error(err.message || 'Erro ao atualizar usuário');
      });
    }
    return response.json();
  })
  .then(data => {
    console.log("Usuário atualizado com sucesso:", data);
    alert('Usuário atualizado com sucesso!');
    document.getElementById('editUserModal').style.display = 'none';
    loadUsers(); // Recarregar a lista de usuários
  })
  .catch(error => {
    console.error('Erro na atualização:', error);
    alert('Erro ao atualizar usuário: ' + error.message);
  })
  .finally(() => {
    // Restaurar o botão
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
  });
}

// Excluir usuário
function deleteUser(userId) {
  const token = localStorage.getItem('token');
  
  // Mostrar feedback visual de carregamento
  const deleteButton = document.getElementById('confirmDelete');
  const originalButtonText = deleteButton.innerHTML;
  deleteButton.disabled = true;
  deleteButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';
    console.log("Excluindo usuário:", userId);
  
  fetch(`http://localhost:3001/api/user/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => {
    console.log("Resposta da exclusão:", response.status);
    
    // Status 204 é sucesso sem conteúdo
    if (response.status === 204) {
      console.log("Usuário excluído com sucesso (status 204)");
      return { success: true };
    }
    
    // Se não for 204 e não for ok, provavelmente é um erro
    if (!response.ok) {
      return response.json()
        .then(err => { throw new Error(err.message || 'Erro ao excluir usuário'); })
        .catch(() => { throw new Error('Erro ao excluir usuário'); }); // Se não conseguir ler como JSON
    }
    
    // Tentar ler como JSON se houver conteúdo
    return response.json().catch(() => ({ success: true }));
  })
  .then(() => {
    alert('Usuário excluído com sucesso!');
    document.getElementById('deleteConfirmModal').style.display = 'none';
    loadUsers(); // Recarregar a lista de usuários
  })
  .catch(error => {
    console.error('Erro na exclusão:', error);
    alert('Erro ao excluir usuário: ' + error.message);
  })
  .finally(() => {
    // Restaurar o botão
    deleteButton.disabled = false;
    deleteButton.innerHTML = originalButtonText;
  });
}

// Utilitários
function showLoadingState(isLoading) {
  const tableBody = document.querySelector('#usersTable tbody');
  if (isLoading) {
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Carregando...</td></tr>';
  }
}

// Função para limitar a frequência de chamadas (debounce)
function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
