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
  setupDeleteUserModal();
  
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
    
    // Mostrar carregando
    showLoadingState('personal-info-content');
    
    // Carregar dados atualizados do usuário
    const userData = await API.Users.get(user.id);
    
    // Preencher formulário de informações pessoais
    fillPersonalInfoForm(userData);
    
    // Carregar e mostrar endereços
    loadUserAddresses(user.id);
    
    // Esconder carregando
    hideLoadingState('personal-info-content');
    
  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error);
    showNotification('Erro ao carregar dados do usuário. Tente novamente.', 'error');
    hideLoadingState('personal-info-content');
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

  // Botão de exclusão de conta
  const deleteAccountBtn = document.getElementById('delete-account-btn');
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', confirmDeleteUser);
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
    
    // Mostrar carregando
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    
    // Enviar requisição para atualizar usuário
    const updatedUser = await API.Users.update(user.id, userData);
    
    // Atualizar dados no localStorage
    const currentUser = getCurrentUser();
    const mergedUser = { ...currentUser, ...updatedUser };
    localStorage.setItem('user', JSON.stringify(mergedUser));
    
    // Restaurar botão
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
    
    showNotification('Informações atualizadas com sucesso!', 'success');
    
  } catch (error) {
    console.error('Erro ao atualizar informações:', error);
    showNotification(`Erro ao atualizar informações: ${error.message || 'Tente novamente'}`, 'error');
    
    // Restaurar botão em caso de erro
    const submitButton = event.target.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Salvar Alterações';
    }
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
    
    // Validar dados de senha
    if (!validatePasswordData(passwordData)) {
      return;
    }
    
    // Mostrar carregando
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Alterando...';
    
    // Enviar requisição para alterar senha
    await API.Users.update(user.id, {
      currentPassword: passwordData.currentPassword,
      password: passwordData.newPassword
    });
    
    // Restaurar botão
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
    
    // Limpar formulário
    event.target.reset();
    
    showNotification('Senha alterada com sucesso!', 'success');
    
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    showNotification(`Erro ao alterar senha: ${error.message || 'Senha atual incorreta ou tente novamente'}`, 'error');
    
    // Restaurar botão em caso de erro
    const submitButton = event.target.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Alterar Senha';
    }
  }
}

function validatePasswordData(passwordData) {
  let isValid = true;
  
  // Validar senha atual
  if (!passwordData.currentPassword) {
    showFieldError('current-password-error', 'Informe sua senha atual.');
    isValid = false;
  } else {
    clearFieldError('current-password-error');
  }
  
  // Validar nova senha
  if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
    showFieldError('new-password-error', 'A nova senha deve ter no mínimo 6 caracteres.');
    isValid = false;
  } else {
    clearFieldError('new-password-error');
  }
  
  // Validar confirmação de senha
  if (passwordData.newPassword !== passwordData.confirmPassword) {
    showFieldError('confirm-password-error', 'As senhas não conferem.');
    isValid = false;
  } else {
    clearFieldError('confirm-password-error');
  }
  
  return isValid;
}

// === Gerenciamento de endereços ===

function setupAddressManagement() {
  // Botão para adicionar endereço
  const addAddressBtn = document.getElementById('add-address-btn');
  if (addAddressBtn) {
    addAddressBtn.addEventListener('click', () => showAddressForm());
  }
  
  // Botão para cancelar adição/edição de endereço
  const cancelAddressBtn = document.getElementById('cancel-address-btn');
  if (cancelAddressBtn) {
    cancelAddressBtn.addEventListener('click', hideAddressForm);
  }
  
  // Formulário de endereço
  const addressForm = document.getElementById('address-form');
  if (addressForm) {
    addressForm.addEventListener('submit', handleAddressFormSubmit);
  }
  
  // Campo de CEP com autopreenchimento
  const cepInput = document.getElementById('address-cep');
  if (cepInput) {
    cepInput.addEventListener('blur', handleCepBlur);
  }
  
  // Configurar modal de confirmação de exclusão
  setupDeleteConfirmationModal();
}

async function loadUserAddresses(userId) {
  try {
    const addressesList = document.getElementById('addresses-list');
    addressesList.innerHTML = '<div class="loading-indicator"><div class="spinner"></div><p>Carregando endereços...</p></div>';
    
    // Buscar endereços do usuário
    const addresses = await API.Addresses.getByUser(userId);
    
    // Limpar lista
    addressesList.innerHTML = '';
    
    // Verificar se há endereços
    if (!addresses || addresses.length === 0) {
      addressesList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-map-marker-alt"></i>
          <p>Você ainda não possui endereços cadastrados.</p>
        </div>
      `;
      return;
    }
    
    // Renderizar cada endereço
    addresses.forEach(address => {
      addressesList.appendChild(createAddressCard(address));
    });
    
  } catch (error) {
    console.error('Erro ao carregar endereços:', error);
    
    const addressesList = document.getElementById('addresses-list');
    addressesList.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-circle"></i>
        <p>Erro ao carregar endereços. Tente novamente.</p>
      </div>
    `;
  }
}

function createAddressCard(address) {
  const template = document.getElementById('address-card-template');
  const addressCard = template.content.cloneNode(true);
  
  // Preencher dados do endereço
  addressCard.querySelector('.address-name').textContent = 'Endereço';
  addressCard.querySelector('.address-line').textContent = 
    `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ''}, ${address.neighborhood}`;
  addressCard.querySelector('.address-city-state-zip').textContent = 
    `${address.city} - ${address.state}, ${address.postal_code}`;
  
  // Configurar botões de ação
  const editButton = addressCard.querySelector('.edit-address');
  editButton.addEventListener('click', () => editAddress(address));
  
  const deleteButton = addressCard.querySelector('.delete-address');
  deleteButton.addEventListener('click', () => confirmDeleteAddress(address.id));
  
  // Armazenar id do endereço para uso posterior
  const cardElement = addressCard.querySelector('.address-card');
  cardElement.dataset.addressId = address.id;
  
  return addressCard;
}

function showAddressForm(address = null) {
  const formContainer = document.getElementById('address-form-container');
  formContainer.style.display = 'block';
  
  // Limpar formulário
  const form = document.getElementById('address-form');
  form.reset();
  
  // Se for edição, preencher formulário com dados do endereço
  if (address) {
    document.getElementById('address-id').value = address.id || '';
    document.getElementById('address-cep').value = address.postal_code || '';
    document.getElementById('address-street').value = address.street || '';
    document.getElementById('address-number').value = address.number || '';
    document.getElementById('address-complement').value = address.complement || '';
    document.getElementById('address-neighborhood').value = address.neighborhood || '';
    document.getElementById('address-city').value = address.city || '';
    document.getElementById('address-state').value = address.state || '';
    document.getElementById('address-country').value = address.country || 'Brasil';
  } else {
    // Limpar ID para indicar que é um novo endereço
    document.getElementById('address-id').value = '';
  }
  
  // Rolar até o formulário
  formContainer.scrollIntoView({ behavior: 'smooth' });
}

function hideAddressForm() {
  const formContainer = document.getElementById('address-form-container');
  formContainer.style.display = 'none';
  
  // Limpar formulário
  const form = document.getElementById('address-form');
  form.reset();
}

function editAddress(address) {
  showAddressForm(address);
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
      user_id: user.id,
      postal_code: formData.get('cep'),
      street: formData.get('street'),
      number: formData.get('number'),
      complement: formData.get('complement'),
      neighborhood: formData.get('neighborhood'),
      city: formData.get('city'),
      state: formData.get('state'),
      country: formData.get('country') || 'Brasil'
    };
    
    // Validar dados
    if (!validateAddressData(addressData)) {
      return;
    }
    
    // Mostrar carregando
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    
    let result;
    const addressId = document.getElementById('address-id').value;
    
    // Verificar se é edição ou criação
    if (addressId) {
      // Editar endereço existente
      result = await API.Addresses.update(addressId, addressData);
    } else {
      // Criar novo endereço
      result = await API.Addresses.create(addressData);
    }
    
    // Restaurar botão
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
    
    // Ocultar formulário
    hideAddressForm();
    
    // Recarregar lista de endereços
    loadUserAddresses(user.id);
    
    showNotification(`Endereço ${addressId ? 'atualizado' : 'adicionado'} com sucesso!`, 'success');
    
  } catch (error) {
    console.error('Erro ao salvar endereço:', error);
    showNotification(`Erro ao salvar endereço: ${error.message || 'Tente novamente'}`, 'error');
    
    // Restaurar botão em caso de erro
    const submitButton = event.target.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Salvar Endereço';
    }
  }
}

function validateAddressData(addressData) {
  let isValid = true;
  
  // Validar CEP
  const cepRegex = /^\d{5}-\d{3}$/;
  if (!addressData.postal_code || !cepRegex.test(addressData.postal_code)) {
    showFieldError('cep-error', 'CEP inválido. Use formato 00000-000.');
    isValid = false;
  } else {
    clearFieldError('cep-error');
  }
  
  // Validar rua
  if (!addressData.street || addressData.street.trim().length < 3) {
    showFieldError('street-error', 'Nome da rua inválido.');
    isValid = false;
  } else {
    clearFieldError('street-error');
  }
  
  // Validar número
  if (!addressData.number || addressData.number.trim() === '') {
    showFieldError('number-error', 'Número inválido.');
    isValid = false;
  } else {
    clearFieldError('number-error');
  }
  
  // Validar bairro
  if (!addressData.neighborhood || addressData.neighborhood.trim() === '') {
    showFieldError('neighborhood-error', 'Bairro inválido.');
    isValid = false;
  } else {
    clearFieldError('neighborhood-error');
  }
  
  // Validar cidade
  if (!addressData.city || addressData.city.trim() === '') {
    showFieldError('city-error', 'Cidade inválida.');
    isValid = false;
  } else {
    clearFieldError('city-error');
  }
  
  // Validar estado
  if (!addressData.state || addressData.state.trim() === '') {
    showFieldError('state-error', 'Estado inválido.');
    isValid = false;
  } else {
    clearFieldError('state-error');
  }
  
  return isValid;
}

function setupDeleteConfirmationModal() {
  const modal = document.getElementById('delete-confirm-modal');
  const cancelBtn = document.getElementById('cancel-delete-btn');
  const confirmBtn = document.getElementById('confirm-delete-btn');
  
  if (!modal || !cancelBtn || !confirmBtn) return;
  
  // Botão para cancelar exclusão
  cancelBtn.addEventListener('click', () => hideModal(modal));
  
  // Fechar modal ao clicar fora
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      hideModal(modal);
    }
  });
}

function confirmDeleteAddress(addressId) {
  // Armazenar ID do endereço para exclusão
  const confirmBtn = document.getElementById('confirm-delete-btn');
  confirmBtn.dataset.addressId = addressId;
  
  // Configurar evento de exclusão
  confirmBtn.addEventListener('click', handleDeleteAddress, { once: true });
  
  // Mostrar modal
  const modal = document.getElementById('delete-confirm-modal');
  showModal(modal);
}

async function handleDeleteAddress() {
  const confirmBtn = document.getElementById('confirm-delete-btn');
  const addressId = confirmBtn.dataset.addressId;
  const modal = document.getElementById('delete-confirm-modal');
  
  try {
    const user = getCurrentUser();
    if (!user || !user.id) {
      showNotification('Sessão expirada. Por favor, faça login novamente.', 'error');
      hideModal(modal);
      return;
    }
    
    // Mostrar carregando
    const originalText = confirmBtn.innerHTML;
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';
    
    // Enviar requisição para excluir endereço
    await API.Addresses.delete(addressId);
    
    // Restaurar botão
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = originalText;
    
    // Fechar modal
    hideModal(modal);
    
    // Remover endereço da lista visualmente
    const addressCard = document.querySelector(`.address-card[data-address-id="${addressId}"]`);
    if (addressCard) {
      addressCard.remove();
    }
    
    // Recarregar lista de endereços
    loadUserAddresses(user.id);
    
    showNotification('Endereço excluído com sucesso!', 'success');
    
  } catch (error) {
    console.error('Erro ao excluir endereço:', error);
    showNotification(`Erro ao excluir endereço: ${error.message || 'Tente novamente'}`, 'error');
    
    // Restaurar botão em caso de erro
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = 'Excluir';
    
    // Fechar modal
    hideModal(modal);
  }
}

// === Gerenciamento de exclusão de usuário ===

function setupDeleteUserModal() {
  const modal = document.getElementById('delete-user-modal');
  const cancelBtn = document.getElementById('cancel-delete-user-btn');
  const confirmBtn = document.getElementById('confirm-delete-user-btn');
  
  if (!modal || !cancelBtn || !confirmBtn) return;
  
  // Botão para cancelar exclusão
  cancelBtn.addEventListener('click', () => hideModal(modal));
  
  // Fechar modal ao clicar fora
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      hideModal(modal);
    }
  });

  // Configurar evento de confirmação
  confirmBtn.addEventListener('click', handleDeleteUser);
}

function confirmDeleteUser() {
  // Mostrar modal de confirmação
  const modal = document.getElementById('delete-user-modal');
  showModal(modal);
}

async function handleDeleteUser() {
  try {
    const user = getCurrentUser();
    if (!user || !user.id) {
      showNotification('Sessão expirada. Por favor, faça login novamente.', 'error');
      return;
    }
    
    const modal = document.getElementById('delete-user-modal');
    const confirmBtn = document.getElementById('confirm-delete-user-btn');
    
    // Mostrar carregando
    const originalText = confirmBtn.innerHTML;
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';
    
    // Enviar requisição para excluir usuário
    await API.Users.delete(user.id);
    
    // Fechar modal
    hideModal(modal);
    
    // Limpar dados de autenticação
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Mostrar notificação e redirecionar
    showNotification('Sua conta foi excluída com sucesso!', 'success');
    
    setTimeout(() => {
      window.location.href = '/index.html';
    }, 2000);
    
  } catch (error) {
    console.error('Erro ao excluir conta:', error);
    
    // Restaurar botão
    const confirmBtn = document.getElementById('confirm-delete-user-btn');
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = 'Excluir Minha Conta';
    }
    
    // Esconder modal
    const modal = document.getElementById('delete-user-modal');
    hideModal(modal);
    
    // Mostrar mensagem de erro
    showNotification(`Erro ao excluir conta: ${error.message || 'Tente novamente mais tarde.'}`, 'error');
  }
}

// === Consulta de CEP via API ===

async function handleCepBlur() {
  const cep = this.value.replace(/\D/g, '');
  
  if (cep.length !== 8) return;
  
  try {
    // Mostrar carregando
    showFieldLoading(this);
    
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    
    // Esconder carregando
    hideFieldLoading(this);
    
    if (data.erro) {
      showFieldError('cep-error', 'CEP não encontrado.');
      return;
    }
    
    // Preencher campos automaticamente
    document.getElementById('address-street').value = data.logradouro;
    document.getElementById('address-neighborhood').value = data.bairro;
    document.getElementById('address-city').value = data.localidade;
    document.getElementById('address-state').value = data.uf;
    
    // Focar no campo de número
    document.getElementById('address-number').focus();
    
  } catch (error) {
    console.error('Erro ao consultar CEP:', error);
    hideFieldLoading(this);
    showFieldError('cep-error', 'Erro ao consultar CEP. Tente novamente.');
  }
}

// === Gerenciamento de senhas ===

function setupPasswordToggles() {
  const passwordToggles = document.querySelectorAll('.password-toggle');
  
  passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const input = toggle.previousElementSibling;
      const eyeIcon = toggle.querySelector('.eye-icon');
      
      if (input.type === 'password') {
        input.type = 'text';
        eyeIcon.innerHTML = '<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>';
      } else {
        input.type = 'password';
        eyeIcon.innerHTML = '<path d="M12 4.5c-5 0-9.3 3-11 7.5 1.7 4.5 6 7.5 11 7.5s9.3-3 11-7.5c-1.7-4.5-6-7.5-11-7.5zm0 12.5c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/>';
      }
    });
  });
}

// === Utilitários de UI ===

function showFieldError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message;
    
    // Adicionar classe de erro ao input correspondente
    const inputId = elementId.replace('-error', '');
    const inputElement = document.getElementById(inputId);
    if (inputElement) {
      inputElement.classList.add('invalid-input');
    }
  }
}

function clearFieldError(elementId) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = '';
    
    // Remover classe de erro do input correspondente
    const inputId = elementId.replace('-error', '');
    const inputElement = document.getElementById(inputId);
    if (inputElement) {
      inputElement.classList.remove('invalid-input');
    }
  }
}

function showFieldLoading(field) {
  // Adicionar ícone de carregamento ao lado do campo
  field.classList.add('loading-field');
  field.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23999\' d=\'M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z\'%3E%3CanimateTransform attributeName=\'transform\' attributeType=\'XML\' dur=\'1s\' from=\'0 12 12\' repeatCount=\'indefinite\' to=\'360 12 12\' type=\'rotate\'/%3E%3C/path%3E%3C/svg%3E")';
  field.style.backgroundRepeat = 'no-repeat';
  field.style.backgroundPosition = 'right 10px center';
  field.style.backgroundSize = '20px';
}

function hideFieldLoading(field) {
  // Remover ícone de carregamento
  field.classList.remove('loading-field');
  field.style.backgroundImage = '';
}

function showLoadingState(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.classList.add('loading-indicator');
    loadingIndicator.innerHTML = '<div class="spinner"></div><p>Carregando...</p>';
    container.prepend(loadingIndicator);
  }
}

function hideLoadingState(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    const loadingIndicator = container.querySelector('.loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
  }
}

function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  const notificationMessage = document.getElementById('notification-message');
  const notificationIcon = document.getElementById('notification-icon');
  
  if (!notification) return;
  
  // Definir ícone com base no tipo
  let iconClass = 'fa-info-circle';
  if (type === 'success') iconClass = 'fa-check-circle';
  if (type === 'error') iconClass = 'fa-exclamation-circle';
  if (type === 'warning') iconClass = 'fa-exclamation-triangle';
  
  // Definir classe do tipo
  notification.className = 'notification';
  notification.classList.add(type);
  
  // Definir conteúdo
  notificationIcon.className = `fas ${iconClass}`;
  notificationMessage.textContent = message;
  
  // Mostrar notificação
  notification.classList.add('show');
  
  // Esconder após 5 segundos
  setTimeout(() => {
    notification.classList.remove('show');
  }, 5000);
}

function showModal(modal) {
  if (!modal) return;
  modal.classList.add('show');
  document.body.style.overflow = 'hidden'; // Impedir rolagem
}

function hideModal(modal) {
  if (!modal) return;
  modal.classList.remove('show');
  document.body.style.overflow = ''; // Restaurar rolagem
}