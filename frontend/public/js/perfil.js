// Script para gerenciar a página de perfil do usuário

document.addEventListener('DOMContentLoaded', async () => {
  // Verificar autenticação
  if (!isAuthenticated()) {
    window.location.href = '/login.html?redirect=/perfil.html';
    return;
  }

  // Inicializar componentes
  setupTabNavigation();
  setupPasswordToggles();
  setupFormSubmissions();
  setupAddressManagement();
  
  // Carregar dados do usuário
  await loadUserData();
});

// === Funções de autenticação e usuário ===

function isAuthenticated() {
  return localStorage.getItem('token') !== null;
}

function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    return null;
  }
}

// === Gerenciamento de navegação por abas ===

function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove a classe ativa de todos os botões e conteúdos
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Adiciona a classe ativa ao botão clicado
      btn.classList.add('active');
      
      // Mostra o conteúdo correspondente
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(`${tabId}-content`).classList.add('active');
    });
  });
}

// === Carregamento de dados do usuário ===

async function loadUserData() {
  try {
    const user = getCurrentUser();
    if (!user || !user.id) {
      showNotification('Erro ao carregar dados do usuário. Tente fazer login novamente.', 'error');
      return;
    }
    
    // Carregar dados atualizados do usuário
    const userData = await API.Users.get(user.id);
    
    // Preencher formulário de informações pessoais
    fillPersonalInfoForm(userData);
    
    // Carregar e mostrar endereços
    loadUserAddresses(user.id);
    
  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error);
    showNotification('Erro ao carregar dados do usuário. Tente novamente.', 'error');
  }
}

function fillPersonalInfoForm(userData) {
  document.getElementById('profile-name').value = userData.name || '';
  document.getElementById('profile-email').value = userData.email || '';
  document.getElementById('profile-phone').value = userData.phone || '';
  document.getElementById('profile-cpf').value = userData.cpf || '';
}

// === Gerenciamento de formulários ===

function setupFormSubmissions() {
  // Formulário de informações pessoais
  const personalInfoForm = document.getElementById('personal-info-form');
  if (personalInfoForm) {
    personalInfoForm.addEventListener('submit', handlePersonalInfoSubmit);
  }
  
  // Formulário de segurança (alteração de senha)
  const securityForm = document.getElementById('security-form');
  if (securityForm) {
    securityForm.addEventListener('submit', handleSecurityFormSubmit);
  }
}

async function handlePersonalInfoSubmit(event) {
  event.preventDefault();
  
  try {
    const user = getCurrentUser();
    if (!user || !user.id) {
      showNotification('Sessão expirada. Por favor, faça login novamente.', 'error');
      return;
    }
    
    const formData = new FormData(event.target);
    const userData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      cpf: formData.get('cpf')
    };
    
    // Validar dados
    if (!validatePersonalInfo(userData)) {
      return;
    }
    
    // Enviar requisição para atualizar usuário
    const updatedUser = await API.Users.update(user.id, userData);
    
    // Atualizar dados no localStorage
    const currentUser = getCurrentUser();
    const mergedUser = { ...currentUser, ...updatedUser };
    localStorage.setItem('user', JSON.stringify(mergedUser));
    
    showNotification('Informações atualizadas com sucesso!', 'success');
    
  } catch (error) {
    console.error('Erro ao atualizar informações:', error);
    showNotification('Erro ao atualizar informações. Tente novamente.', 'error');
  }
}

function validatePersonalInfo(userData) {
  let isValid = true;
  
  // Validar nome
  if (!userData.name || userData.name.trim().length < 3) {
    showFieldError('name-error', 'Nome inválido. Mínimo de 3 caracteres.');
    isValid = false;
  } else {
    clearFieldError('name-error');
  }
  
  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!userData.email || !emailRegex.test(userData.email)) {
    showFieldError('email-error', 'E-mail inválido.');
    isValid = false;
  } else {
    clearFieldError('email-error');
  }
  
  // Validar telefone (formato brasileiro)
  const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/;
  if (userData.phone && !phoneRegex.test(userData.phone)) {
    showFieldError('phone-error', 'Telefone inválido. Use formato (00) 00000-0000.');
    isValid = false;
  } else {
    clearFieldError('phone-error');
  }
  
  // Validar CPF
  const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
  if (userData.cpf && !cpfRegex.test(userData.cpf)) {
    showFieldError('cpf-error', 'CPF inválido. Use formato 000.000.000-00.');
    isValid = false;
  } else {
    clearFieldError('cpf-error');
  }
  
  return isValid;
}

async function handleSecurityFormSubmit(event) {
  event.preventDefault();
  
  try {
    const user = getCurrentUser();
    if (!user || !user.id) {
      showNotification('Sessão expirada. Por favor, faça login novamente.', 'error');
      return;
    }
    
    const formData = new FormData(event.target);
    const passwordData = {
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
      confirmPassword: formData.get('confirmPassword')
    };
    
    // Validar senhas
    if (!validatePasswordChange(passwordData)) {
      return;
    }
    
    // Enviar requisição para alterar senha
    await API.Users.changePassword(user.id, {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
    
    // Limpar formulário
    event.target.reset();
    
    showNotification('Senha alterada com sucesso!', 'success');
    
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    
    if (error.message.includes('atual')) {
      showFieldError('current-password-error', 'Senha atual incorreta.');
    } else {
      showNotification('Erro ao alterar senha. Tente novamente.', 'error');
    }
  }
}

function validatePasswordChange(passwordData) {
  let isValid = true;
  
  // Verificar se a senha atual foi informada
  if (!passwordData.currentPassword) {
    showFieldError('current-password-error', 'Informe a senha atual.');
    isValid = false;
  } else {
    clearFieldError('current-password-error');
  }
  
  // Verificar se a nova senha é forte o suficiente
  if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
    showFieldError('new-password-error', 'A nova senha deve ter no mínimo 6 caracteres.');
    isValid = false;
  } else {
    clearFieldError('new-password-error');
  }
  
  // Verificar se as senhas coincidem
  if (passwordData.newPassword !== passwordData.confirmPassword) {
    showFieldError('confirm-password-error', 'As senhas não coincidem.');
    isValid = false;
  } else {
    clearFieldError('confirm-password-error');
  }
  
  return isValid;
}

// === Gerenciamento de endereços ===

function setupAddressManagement() {
  // Botão para adicionar novo endereço
  const addAddressBtn = document.getElementById('add-address-btn');
  if (addAddressBtn) {
    addAddressBtn.addEventListener('click', showAddressForm);
  }
  
  // Botão para cancelar edição de endereço
  const cancelAddressBtn = document.getElementById('cancel-address-btn');
  if (cancelAddressBtn) {
    cancelAddressBtn.addEventListener('click', hideAddressForm);
  }
  
  // Formulário de endereço
  const addressForm = document.getElementById('address-form');
  if (addressForm) {
    addressForm.addEventListener('submit', handleAddressFormSubmit);
  }
  
  // Busca automática de endereço pelo CEP
  const cepInput = document.getElementById('address-cep');
  if (cepInput) {
    cepInput.addEventListener('blur', fetchAddressByCep);
  }
  
  // Botões do modal de confirmação de exclusão
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', hideDeleteModal);
  }
  
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', confirmDeleteAddress);
  }
}

async function loadUserAddresses(userId) {
  try {
    const addressesList = document.getElementById('addresses-list');
    if (!addressesList) return;
    
    // Mostrar loading
    addressesList.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Carregando endereços...</p>
      </div>
    `;
    
    // Buscar endereços do usuário
    const addresses = await API.Addresses.getByUser(userId);
    
    // Renderizar endereços
    if (addresses && addresses.length > 0) {
      renderAddresses(addresses);
    } else {
      addressesList.innerHTML = `
        <div class="empty-state">
          <p>Você ainda não possui endereços cadastrados.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Erro ao carregar endereços:', error);
    
    const addressesList = document.getElementById('addresses-list');
    if (addressesList) {
      addressesList.innerHTML = `
        <div class="error-state">
          <p>Erro ao carregar endereços. Tente novamente mais tarde.</p>
        </div>
      `;
    }
  }
}

function renderAddresses(addresses) {
  const addressesList = document.getElementById('addresses-list');
  if (!addressesList) return;
  
  addressesList.innerHTML = '';
  
  const template = document.getElementById('address-card-template');
  if (!template) return;
  
  addresses.forEach(address => {
    const clone = document.importNode(template.content, true);
    
    // Preencher informações do endereço
    clone.querySelector('.address-name').textContent = formatAddressName(address);
    clone.querySelector('.address-line').textContent = formatAddressLine(address);
    clone.querySelector('.address-city-state-zip').textContent = formatCityStateZip(address);
    
    // Configurar botões de ação
    const editBtn = clone.querySelector('.edit-address');
    if (editBtn) {
      editBtn.addEventListener('click', () => editAddress(address));
    }
    
    const deleteBtn = clone.querySelector('.delete-address');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => showDeleteModal(address.id));
    }
    
    // Adicionar ID do endereço como atributo
    const addressCard = clone.querySelector('.address-card');
    if (addressCard) {
      addressCard.setAttribute('data-address-id', address.id);
    }
    
    addressesList.appendChild(clone);
  });
}

function formatAddressName(address) {
  let name = address.complement ? `${address.complement}` : 'Endereço';
  return name;
}

function formatAddressLine(address) {
  return `${address.street}, ${address.number}`;
}

function formatCityStateZip(address) {
  const cep = (address.postal_code || address.cep || '').replace(/^(\d{5})(\d{3})$/, '$1-$2');
  return `${address.neighborhood}, ${address.city} - ${address.state}, ${cep}`;
}

function showAddressForm() {
  const formContainer = document.getElementById('address-form-container');
  if (formContainer) {
    // Limpar formulário
    document.getElementById('address-form').reset();
    document.getElementById('address-id').value = '';
    
    // Mostrar formulário
    formContainer.style.display = 'block';
    
    // Rolar para o formulário
    formContainer.scrollIntoView({ behavior: 'smooth' });
  }
}

function hideAddressForm() {
  const formContainer = document.getElementById('address-form-container');
  if (formContainer) {
    formContainer.style.display = 'none';
  }
}

async function fetchAddressByCep() {
  const cepInput = document.getElementById('address-cep');
  if (!cepInput) return;
  
  const cep = cepInput.value.replace(/\D/g, '');
  if (cep.length !== 8) return;
  
  try {
    // Mostrar loading
    document.getElementById('street-error').textContent = 'Buscando endereço...';
    
    // Consultar API ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    
    if (data.erro) {
      showFieldError('cep-error', 'CEP não encontrado.');
      return;
    }
    
    // Preencher campos
    document.getElementById('address-street').value = data.logradouro || '';
    document.getElementById('address-neighborhood').value = data.bairro || '';
    document.getElementById('address-city').value = data.localidade || '';
    document.getElementById('address-state').value = data.uf || '';
    
    clearFieldError('street-error');
    clearFieldError('cep-error');
    
    // Colocar foco no campo número
    document.getElementById('address-number').focus();
    
  } catch (error) {
    console.error('Erro ao consultar CEP:', error);
    showFieldError('cep-error', 'Erro ao consultar CEP. Tente novamente.');
  }
}

async function handleAddressFormSubmit(event) {
  event.preventDefault();
  
  try {
    const user = getCurrentUser();
    if (!user || !user.id) {
      showNotification('Sessão expirada. Por favor, faça login novamente.', 'error');
      return;
    }
    
    const formData = new FormData(event.target);
    const addressData = {
      cep: formData.get('cep'),
      street: formData.get('street'),
      number: formData.get('number'),
      complement: formData.get('complement'),
      neighborhood: formData.get('neighborhood'),
      city: formData.get('city'),
      state: formData.get('state'),
      country: formData.get('country') || 'Brasil',
      user_id: user.id
    };
    
    // Validar dados
    if (!validateAddress(addressData)) {
      return;
    }
    
    const addressId = formData.get('id');
    let response;
    
    if (addressId) {
      // Editar endereço existente
      response = await API.Addresses.update(addressId, addressData);
      showNotification('Endereço atualizado com sucesso!', 'success');
    } else {
      // Criar novo endereço
      response = await API.Addresses.create(addressData);
      showNotification('Endereço adicionado com sucesso!', 'success');
    }
    
    // Atualizar lista de endereços
    loadUserAddresses(user.id);
    
    // Esconder formulário
    hideAddressForm();
    
  } catch (error) {
    console.error('Erro ao salvar endereço:', error);
    showNotification('Erro ao salvar endereço. Tente novamente.', 'error');
  }
}

function validateAddress(addressData) {
  let isValid = true;
  
  // Validar CEP
  const cepRegex = /^\d{5}-?\d{3}$/;
  if (!addressData.cep || !cepRegex.test(addressData.cep.replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2'))) {
    showFieldError('cep-error', 'CEP inválido.');
    isValid = false;
  } else {
    clearFieldError('cep-error');
  }
  
  // Validar rua
  if (!addressData.street || addressData.street.trim().length < 3) {
    showFieldError('street-error', 'Rua inválida.');
    isValid = false;
  } else {
    clearFieldError('street-error');
  }
  
  // Validar número
  if (!addressData.number) {
    showFieldError('number-error', 'Número inválido.');
    isValid = false;
  } else {
    clearFieldError('number-error');
  }
  
  // Validar bairro
  if (!addressData.neighborhood || addressData.neighborhood.trim().length < 2) {
    showFieldError('neighborhood-error', 'Bairro inválido.');
    isValid = false;
  } else {
    clearFieldError('neighborhood-error');
  }
  
  // Validar cidade
  if (!addressData.city || addressData.city.trim().length < 2) {
    showFieldError('city-error', 'Cidade inválida.');
    isValid = false;
  } else {
    clearFieldError('city-error');
  }
  
  // Validar estado
  if (!addressData.state || addressData.state.trim().length < 2) {
    showFieldError('state-error', 'Estado inválido.');
    isValid = false;
  } else {
    clearFieldError('state-error');
  }
  
  return isValid;
}

async function editAddress(address) {
  // Preencher formulário com dados do endereço
  document.getElementById('address-id').value = address.id;
  document.getElementById('address-cep').value = address.postal_code || address.cep || '';
  document.getElementById('address-street').value = address.street || '';
  document.getElementById('address-number').value = address.number || '';
  document.getElementById('address-complement').value = address.complement || '';
  document.getElementById('address-neighborhood').value = address.neighborhood || '';
  document.getElementById('address-city').value = address.city || '';
  document.getElementById('address-state').value = address.state || '';
  document.getElementById('address-country').value = address.country || 'Brasil';
  
  // Mostrar formulário
  showAddressForm();
}

// Variável para armazenar o ID do endereço a ser excluído
let addressToDeleteId = null;

function showDeleteModal(addressId) {
  addressToDeleteId = addressId;
  
  const modal = document.getElementById('delete-confirm-modal');
  if (modal) {
    modal.classList.add('show');
  }
}

function hideDeleteModal() {
  const modal = document.getElementById('delete-confirm-modal');
  if (modal) {
    modal.classList.remove('show');
  }
  
  addressToDeleteId = null;
}

async function confirmDeleteAddress() {
  if (!addressToDeleteId) {
    hideDeleteModal();
    return;
  }
  
  try {
    const user = getCurrentUser();
    if (!user || !user.id) {
      showNotification('Sessão expirada. Por favor, faça login novamente.', 'error');
      hideDeleteModal();
      return;
    }
    
    // Excluir endereço
    await API.Addresses.delete(addressToDeleteId);
    
    // Atualizar lista de endereços
    loadUserAddresses(user.id);
    
    showNotification('Endereço excluído com sucesso!', 'success');
    
  } catch (error) {
    console.error('Erro ao excluir endereço:', error);
    showNotification('Erro ao excluir endereço. Tente novamente.', 'error');
  } finally {
    hideDeleteModal();
  }
}

// === Utilidades ===

function setupPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.password-toggle');
  
  toggleButtons.forEach(button => {
    button.addEventListener('click', function() {
      const input = this.previousElementSibling;
      
      if (input.type === 'password') {
        input.type = 'text';
        this.innerHTML = `
          <svg class="eye-icon" viewBox="0 0 24 24">
            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
          </svg>
        `;
      } else {
        input.type = 'password';
        this.innerHTML = `
          <svg class="eye-icon" viewBox="0 0 24 24">
            <path d="M12 4.5c-5 0-9.3 3-11 7.5 1.7 4.5 6 7.5 11 7.5s9.3-3 11-7.5c-1.7-4.5-6-7.5-11-7.5zm0 12.5c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/>
          </svg>
        `;
      }
    });
  });
}

function showFieldError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    
    // Destacar campo com erro
    const inputElement = element.previousElementSibling;
    if (inputElement && inputElement.tagName === 'INPUT') {
      inputElement.classList.add('invalid-input');
    }
  }
}

function clearFieldError(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = '';
    
    // Remover destaque de erro
    const inputElement = element.previousElementSibling;
    if (inputElement && inputElement.tagName === 'INPUT') {
      inputElement.classList.remove('invalid-input');
    }
  }
}

function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  const notificationMessage = document.getElementById('notification-message');
  const notificationIcon = document.getElementById('notification-icon');
  
  if (!notification || !notificationMessage || !notificationIcon) return;
  
  // Remover classes de tipo anteriores
  notification.classList.remove('success', 'error', 'warning');
  
  // Adicionar classe de tipo
  notification.classList.add(type);
  
  // Definir ícone
  switch (type) {
    case 'success':
      notificationIcon.className = 'fas fa-check-circle';
      break;
    case 'error':
      notificationIcon.className = 'fas fa-times-circle';
      break;
    case 'warning':
      notificationIcon.className = 'fas fa-exclamation-triangle';
      break;
    default:
      notificationIcon.className = 'fas fa-info-circle';
  }
  
  // Definir mensagem
  notificationMessage.textContent = message;
  
  // Mostrar notificação
  notification.classList.add('show');
  
  // Esconder notificação após 5 segundos
  setTimeout(() => {
    notification.classList.remove('show');
  }, 5000);
}