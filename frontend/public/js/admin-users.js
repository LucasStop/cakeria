document.addEventListener('DOMContentLoaded', function () {
  if (window.Toast && typeof window.Toast.init === 'function') {
    window.Toast.init();
  }
  
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

function loadUsers() {
  const searchTerm = document.getElementById('searchUser').value.toLowerCase();
  const typeFilter = document.getElementById('filterType').value;
  showLoadingState(true);

  API.get('/user')
    .then(users => {
      usersData = users.filter(user => {
        const matchesSearch =
          !searchTerm ||
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
      Toast.error('Erro ao carregar a lista de usuários. Por favor, tente novamente.', {
        position: 'bottom-right',
        closeButton: true,
        pauseOnHover: true,
        title: null,
        zIndex: 99999,
      });
    });
}

function renderUsersTable() {
  const tableBody = document.querySelector('#usersTable tbody');
  tableBody.innerHTML = '';

  if (usersData.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="6" class="text-center">Nenhum usuário encontrado</td></tr>';
    return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalUsers);

  for (let i = startIndex; i < endIndex; i++) {
    const user = usersData[i];
    const row = document.createElement('tr');
    row.setAttribute('data-id', user.id);

    let lastLoginFormatted = 'Nunca';
    if (user.last_login) {
      const date = new Date(user.last_login);
      lastLoginFormatted = `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR')}`;
    }    row.innerHTML = `
      <td data-label="Nome">${user.name}</td>
      <td data-label="Email">${user.email}</td>
      <td data-label="Tipo">${user.type === 'admin' ? 'Administrador' : 'Cliente'}</td>
      <td data-label="Telefone">${user.phone || '-'}</td>
      <td data-label="Último Login">${lastLoginFormatted}</td>
      <td data-label="Ações" class="table-actions">
        <button class="action-btn edit-btn" data-id="${user.id}" title="Editar" onclick="openEditModal(${user.id})">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete-btn" data-id="${user.id}" data-name="${user.name}" title="Excluir" onclick="openDeleteModal(${user.id}, '${user.name.replace(/'/g, "\\'")}')">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    `;

    tableBody.appendChild(row);
  }  // Os eventos agora são adicionados diretamente no HTML com onclick
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

// Tornando a função global para ser acessível via onclick
window.openEditModal = function(userId) {
  console.log('openEditModal chamada com ID:', userId);
  const user = usersData.find(u => u.id == userId);
  if (!user) {
    console.error('Usuário não encontrado com ID:', userId);
    return;
  }
  
  // Vamos editar diretamente na linha da tabela em vez de usar o modal
  const row = document.querySelector(`#usersTable tr[data-id="${userId}"]`);
  if (!row) {
    console.error('Linha da tabela não encontrada para o usuário:', userId);
    return;
  }
  
  // Se já estiver em modo de edição, não faça nada
  if (row.classList.contains('editing')) {
    return;
  }
  
  row.classList.add('editing');
  
  const cells = row.querySelectorAll('td:not(:last-child)');
  
  cells[0].innerHTML = `<input type="text" class="edit-input" value="${user.name}" data-field="name" required>`;
  
  
  cells[2].innerHTML = `
    <select class="edit-input" data-field="type">
      <option value="client" ${user.type === 'client' ? 'selected' : ''}>Cliente</option>
      <option value="admin" ${user.type === 'admin' ? 'selected' : ''}>Administrador</option>
    </select>
  `;
  cells[3].innerHTML = `<input type="text" class="edit-input phone-mask" value="${user.phone || ''}" data-field="phone" placeholder="(00) 00000-0000">`;
  
  
  
  const actionsCell = row.querySelector('td:last-child');
  actionsCell.innerHTML = `
    <button class="action-btn save-btn" data-id="${user.id}" title="Salvar" onclick="saveUserChanges(${user.id})">
      <i class="fas fa-save"></i>
    </button>
    <button class="action-btn cancel-btn" data-id="${user.id}" title="Cancelar" onclick="cancelEdit(${user.id})">
      <i class="fas fa-times"></i>
    </button>
  `;

  const phoneInput = row.querySelector('.phone-mask');
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
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
  }
  
  const nameInput = row.querySelector('input[data-field="name"]');
  if (nameInput) {
    setTimeout(() => {
      nameInput.focus();
      nameInput.select(); 
    }, 0);
  }
  
}

window.openDeleteModal = function(userId, userName) {
  console.log('openDeleteModal chamada com ID:', userId, 'Nome:', userName);
  
  const userRow = document.querySelector(`#usersTable tr[data-id="${userId}"]`);
  if (userRow) {
    userRow.classList.add('highlight-delete');
    
    userRow.classList.add('pulse-delete');
  }
  
  const confirmToast = Toast.create(
    `<div class="toast-confirm-message">
      Tem certeza que deseja excluir o usuário <strong>${userName}</strong>?<br>
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
    const confirmBtn = confirmToast.querySelector('.confirm-delete');
    const cancelBtn = confirmToast.querySelector('.cancel-delete');
    
    const removeRowHighlight = () => {
      const userRow = document.querySelector(`#usersTable tr[data-id="${userId}"]`);
      if (userRow) {
        userRow.classList.remove('highlight-delete');
        userRow.classList.remove('pulse-delete');
      }
    };
    
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function() {
        Toast.remove(confirmToast);
        deleteUser(userId);
      });
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        Toast.remove(confirmToast);
        removeRowHighlight();
      });
    }
    
    const closeBtn = confirmToast.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        removeRowHighlight();
      });
    }
  }
}

function setupFormMasks() {
  const cpfInputs = document.querySelectorAll('#editCpf');
  cpfInputs.forEach(input => {
    input.addEventListener('input', function (e) {
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
    input.addEventListener('input', function (e) {
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

function setupEventListeners() {
  document.getElementById('editAvatar').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        document.getElementById('edit-avatar-error').textContent =
          'A imagem deve ter no máximo 5MB';
        return;
      }

      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
        document.getElementById('edit-avatar-error').textContent =
          'Formato de imagem inválido. Use JPG, PNG ou WebP';
        return;
      }

      document.getElementById('edit-avatar-error').textContent = '';
      const reader = new FileReader();
      reader.onload = function (e) {
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
  document.getElementById('editSelectAvatarBtn').addEventListener('click', function () {
    document.getElementById('editAvatar').click();
  });

  document.getElementById('editPasswordToggle').addEventListener('click', function () {
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

  document.getElementById('editCurrentPasswordToggle').addEventListener('click', function () {
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
  });  document.getElementById('editUserForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const userId = document.getElementById('editUserId').value;
    const avatarFile = document.getElementById('editAvatar').files[0];

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

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('cpf', document.getElementById('editCpf').value || '');
    formData.append('type', document.getElementById('editType').value);
    formData.append('phone', document.getElementById('editPhone').value || '');

    const password = document.getElementById('editPassword').value;
    const currentPassword = document.getElementById('editCurrentPassword').value;

    if (password) {
      if (!currentPassword) {
        document.getElementById('edit-password-error').textContent =
          'A senha atual é necessária para alterar a senha';
        return;
      }
      formData.append('password', password);
      formData.append('currentPassword', currentPassword);
    }

    if (avatarFile) {
      formData.append('image', avatarFile);
    }

    updateUser(userId, formData);
  });

  document.getElementById('confirmDelete').addEventListener('click', function () {
    const userId = document.getElementById('deleteUserId').value;
    deleteUser(userId);
  });

  document.getElementById('searchUser').addEventListener('input', debounce(loadUsers, 300));
  document.getElementById('filterType').addEventListener('change', loadUsers);

  document.querySelectorAll('.close-modal').forEach(elem => {
    elem.addEventListener('click', function () {
      document.getElementById('editUserModal').style.display = 'none';
      document.getElementById('deleteConfirmModal').style.display = 'none';
    });
  });

  window.addEventListener('click', function (event) {
    if (event.target === document.getElementById('editUserModal')) {
      document.getElementById('editUserModal').style.display = 'none';
    }
    if (event.target === document.getElementById('deleteConfirmModal')) {
      document.getElementById('deleteConfirmModal').style.display = 'none';
    }
  });

  const cancelButtons = document.querySelectorAll('button.btn-secondary.close-modal');
  cancelButtons.forEach(button => {
    button.addEventListener('click', function () {
      document.getElementById('editUserModal').style.display = 'none';
      document.getElementById('deleteConfirmModal').style.display = 'none';
    });
  });
}

function createUser(userData) {
  const token = localStorage.getItem('token');

  fetch('http://localhost:3001/api/user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
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

function updateUser(userId, formData) {
  const submitButton = document.querySelector('#editUserForm button[type="submit"]');
  const originalButtonText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

  console.log('Enviando atualização para usuário:', userId);

  API.User.update(userId, formData)
    .then(data => {
      Toast.success('Usuário atualizado com sucesso!', {
        position: 'bottom-right',
        closeButton: true,
        pauseOnHover: true,
        title: null,
        zIndex: 99999,
      });
      document.getElementById('editUserModal').style.display = 'none';
      loadUsers();
    })
    .catch(error => {
      console.error('Erro na atualização:', error);
      Toast.error('Erro ao atualizar usuário: ' + error.message, {
        position: 'bottom-right',
        closeButton: true,
        pauseOnHover: true,
        title: null,
        zIndex: 99999,
      });
    })
    .finally(() => {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    });
}

window.deleteUser = function(userId) {
  console.log('Excluindo usuário:', userId);
  
  const row = document.querySelector(`#usersTable tr[data-id="${userId}"]`);
  if (!row) {
    console.error('Linha da tabela não encontrada para o usuário:', userId);
    return;
  }
  
  row.style.transition = 'opacity 0.5s ease';
  row.style.opacity = '0.5';
  
  const actionsCell = row.querySelector('td:last-child');
  actionsCell.innerHTML = '<div class="spinner"><i class="fas fa-spinner fa-spin"></i> Excluindo...</div>';
  API.User.delete(userId)
    .then(() => {
      console.log('Usuário excluído com sucesso');
      
      row.style.opacity = '0';
      setTimeout(() => {
        loadUsers();
        
        Toast.success('Usuário excluído com sucesso!', {
          position: 'bottom-right',
          closeButton: true,
          pauseOnHover: true,
          title: null,
          zIndex: 99999,
        });
      }, 500);
    })
    .catch(error => {
      console.error('Erro na exclusão:', error);
      
      row.style.opacity = '1';
      
      renderUsersTable();
      
      Toast.error('Erro ao excluir usuário: ' + (error.message || 'Tente novamente'), {
        position: 'bottom-right',
        closeButton: true,
        pauseOnHover: true,
        title: null,
        zIndex: 99999,
      });
    });
}

function showLoadingState(isLoading) {
  const tableBody = document.querySelector('#usersTable tbody');
  if (isLoading) {
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Carregando...</td></tr>';
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

window.saveUserChanges = function(userId) {
  console.log('Salvando alterações para o usuário:', userId);
  const row = document.querySelector(`#usersTable tr[data-id="${userId}"]`);
  if (!row) {
    console.error('Linha da tabela não encontrada para o usuário:', userId);
    return;
  }
  
  const nameInput = row.querySelector('input[data-field="name"]');
  const emailInput = row.querySelector('input[data-field="email"]');
  
  // Validações básicas
  if (nameInput && !nameInput.value.trim()) {
    Toast.error('O nome não pode ficar em branco.', {
      position: 'bottom-right',
    });
    nameInput.focus();
    return;
  }
  
  if (emailInput) {
    const emailValue = emailInput.value.trim();
    if (!emailValue) {
      Toast.error('O email não pode ficar em branco.', {
        position: 'bottom-right',
      });
      emailInput.focus();
      return;
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailValue)) {
      Toast.error('Por favor, insira um email válido.', {
        position: 'bottom-right',
      });
      emailInput.focus();
      return;
    }
  }
  
  const formData = new FormData();
  const inputs = row.querySelectorAll('.edit-input');
  
  inputs.forEach(input => {
    const field = input.getAttribute('data-field');
    const value = input.value.trim();
    formData.append(field, value);
  });
  
  const user = usersData.find(u => u.id == userId);
  if (user && user.cpf) {
    formData.append('cpf', user.cpf);
  }
  const allInputs = row.querySelectorAll('.edit-input');
  allInputs.forEach(input => {
    input.disabled = true;
    input.classList.add('saving');
  });
  
  row.classList.add('loading');
  const actionsCell = row.querySelector('td:last-child');
  const originalActionsHtml = actionsCell.innerHTML;
  actionsCell.innerHTML = '<div class="spinner"><i class="fas fa-spinner fa-spin"></i> Salvando...</div>';

  const loadingToast = Toast.info('Salvando alterações...', {
    position: 'bottom-right',
    duration: 0 
  });

  API.User.update(userId, formData)
    .then(data => {
      console.log('Usuário atualizado com sucesso:', data);
      
      if (loadingToast) Toast.remove(loadingToast);
      
      const userIndex = usersData.findIndex(u => u.id == userId);
      if (userIndex !== -1) {
        inputs.forEach(input => {
          const field = input.getAttribute('data-field');
          const value = input.value;
          usersData[userIndex][field] = value;
        });
      }
      row.classList.remove('editing', 'loading');
      
      renderUsersTable();
      
      setTimeout(() => {
        const updatedRow = document.querySelector(`#usersTable tr[data-id="${userId}"]`);
        if (updatedRow) {
          updatedRow.classList.add('success-highlight');
          setTimeout(() => {
            updatedRow.classList.remove('success-highlight');
          }, 2000);
        }
      }, 50);
      Toast.success(`Usuário ${data.name} atualizado com sucesso!`, {
        position: 'bottom-right',
        closeButton: true,
        pauseOnHover: true,
        title: null,
        zIndex: 99999,
      });
    })    .catch(error => {
      console.error('Erro na atualização:', error);
      
      if (loadingToast) Toast.remove(loadingToast);
      
      row.classList.remove('loading');
      actionsCell.innerHTML = originalActionsHtml;
      
      allInputs.forEach(input => {
        input.disabled = false;
        input.classList.remove('saving');
      });
      
      row.classList.add('error-highlight');
      setTimeout(() => {
        row.classList.remove('error-highlight');
      }, 2000);
      
      Toast.error('Erro ao atualizar usuário: ' + (error.message || 'Tente novamente'), {
        position: 'bottom-right',
        closeButton: true,
        pauseOnHover: true,
        title: 'Falha na atualização',
        zIndex: 99999,
      });
    });
};

window.cancelEdit = function(userId) {
  console.log('Cancelando edição para o usuário:', userId);
  const row = document.querySelector(`#usersTable tr[data-id="${userId}"]`);
  if (!row) {
    console.error('Linha da tabela não encontrada para o usuário:', userId);
    return;
  }
  
  row.classList.remove('editing');
  
  renderUsersTable();
};
