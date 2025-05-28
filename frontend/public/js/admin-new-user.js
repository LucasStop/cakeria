document.addEventListener('DOMContentLoaded', () => {
  checkAdminAccess();

  const form = document.getElementById('userForm');
  if (form) form.addEventListener('submit', handleSubmit);

  addInputEvents();
  initPasswordToggles();
  setupAvatarUpload();
});

function checkAdminAccess() {
  const token = localStorage.getItem('token');

  if (!token) {
    if (window.Toast) {
      Toast.error('Você precisa estar logado como administrador para acessar esta página.', {
        duration: 5000,
      });
    }
    setTimeout(() => {
      window.location.href = 'login.html?redirect=admin-new-user.html';
    }, 2000);
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
        if (window.Toast) {
          Toast.warning('Acesso restrito apenas para administradores.', {
            duration: 5000,
          });
        }
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);
      }
    })
    .catch(error => {
      console.error('Erro ao verificar permissões:', error);
      if (window.Toast) {
        Toast.error('Erro ao verificar suas permissões. Por favor, faça login novamente.', {
          duration: 5000,
        });
      }
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    });
}

function initPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.password-toggle');

  toggleButtons.forEach(button => {
    button.addEventListener('click', function () {
      const input = this.previousElementSibling;

      if (input.type === 'password') {
        input.type = 'text';
        this.querySelector('i').classList.remove('fa-eye');
        this.querySelector('i').classList.add('fa-eye-slash');
      } else {
        input.type = 'password';
        this.querySelector('i').classList.remove('fa-eye-slash');
        this.querySelector('i').classList.add('fa-eye');
      }
    });
  });
}

function addInputEvents() {
  addValidation('register-name', isValidName, 'name-error', 'Digite pelo menos nome e sobrenome');
  addValidation(
    'register-email',
    isValidEmail,
    'email-error',
    'Formato inválido (ex: usuario@email.com)'
  );
  addValidation(
    'register-phone',
    isValidPhone,
    'phone-error',
    'Formato correto: (00) 00000-0000',
    formatPhone
  );
  addValidation('register-cpf', isValidCPF, 'cpf-error', 'CPF inválido', formatCPF);
  addValidation('register-password', isValidPassword, 'password-error', 'Mínimo 5 caracteres');
  addValidation(
    'register-cep',
    isValidCEP,
    'cep-error',
    'Formato correto: 00000-000',
    formatCEPandFetch
  );
  addValidation('register-street', isNotEmpty, 'street-error', 'Digite o nome da rua');
  addValidation(
    'register-number',
    isValidNumber,
    'number-error',
    'Digite um número válido',
    formatNumber
  );
  addValidation(
    'register-neighborhood',
    isValidLettersOnly,
    'neighborhood-error',
    'Digite um bairro válido (sem números)',
    formatLettersOnly
  );
  addValidation(
    'register-city',
    isValidLettersOnly,
    'city-error',
    'Digite uma cidade válida (sem números)',
    formatLettersOnly
  );
  addValidation(
    'register-state',
    isValidLettersOnly,
    'state-error',
    'Digite um estado válido (sem números)',
    formatLettersOnly
  );

  const complement = document.getElementById('register-complement');
  if (complement) {
    complement.addEventListener('input', () => {
      clearError('complement-error', complement);
    });
  }

  const confirmPassword = document.getElementById('register-confirm-password');
  if (confirmPassword) {
    confirmPassword.addEventListener('input', () => {
      const password = document.getElementById('register-password').value;
      if (confirmPassword.value !== password) {
        showError('confirm-password-error', confirmPassword, 'As senhas não coincidem');
      } else {
        clearError('confirm-password-error', confirmPassword);
      }
    });
  }
}

function addValidation(id, validateFn, errorId, errorMsg, formatFn = null) {
  const input = document.getElementById(id);
  if (!input) return;

  // Adiciona o tooltip de ajuda
  const helpIcon = document.createElement('span');
  helpIcon.className = 'help-icon';
  helpIcon.innerHTML = '<i class="fas fa-question-circle"></i>';
  helpIcon.title = errorMsg;
  
  // Adiciona o ícone após a label
  const label = input.parentElement.querySelector('label');
  if (label) {
    label.appendChild(helpIcon);
  }
  
  // Adiciona evento para mostrar o tooltip ao passar o mouse
  helpIcon.addEventListener('mouseenter', function() {
    const tooltip = document.createElement('div');
    tooltip.className = 'help-tooltip';
    tooltip.textContent = errorMsg;
    this.appendChild(tooltip);
  });
  
  helpIcon.addEventListener('mouseleave', function() {
    const tooltip = this.querySelector('.help-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  });

  // Para os campos de senha, adiciona indicador de força
  if (id === 'register-password') {
    const strengthIndicator = document.createElement('div');
    strengthIndicator.className = 'password-strength-indicator';
    strengthIndicator.innerHTML = `
      <div class="strength-meter">
        <div class="strength-bar"></div>
      </div>
      <div class="strength-text">Força da senha: <span>Fraca</span></div>
    `;
    input.parentElement.appendChild(strengthIndicator);
    
    // Adiciona evento para atualizar o indicador de força
    input.addEventListener('input', function() {
      updatePasswordStrength(this.value, strengthIndicator);
    });
  }

  // Evento principal de validação ao digitar
  input.addEventListener('input', () => {
    if (formatFn) formatFn(input);
    
    // Timeout para validar após o usuário parar de digitar
    clearTimeout(input.validationTimeout);
    input.validationTimeout = setTimeout(() => {
      if (!validateFn(input.value)) {
        showError(errorId, input, errorMsg);
      } else {
        clearError(errorId, input);
        
        // Adiciona animação de validação bem-sucedida
        if (input.value) {
          const successIcon = document.createElement('span');
          successIcon.className = 'success-icon';
          successIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
          input.parentElement.appendChild(successIcon);
          
          // Remove o ícone após 2 segundos
          setTimeout(() => {
            successIcon.remove();
          }, 2000);
        }
      }
    }, 500);
  });
  
  // Valida também ao perder o foco
  input.addEventListener('blur', () => {
    if (input.value && !validateFn(input.value)) {
      showError(errorId, input, errorMsg);
    }
  });
}

// Função para atualizar o indicador de força da senha
function updatePasswordStrength(password, indicator) {
  let strength = 0;
  
  // Critérios de força
  if (password.length >= 5) strength += 20;
  if (password.length >= 8) strength += 20;
  if (/[A-Z]/.test(password)) strength += 20;
  if (/[0-9]/.test(password)) strength += 20;
  if (/[^A-Za-z0-9]/.test(password)) strength += 20;
  
  // Atualiza a barra de força
  const strengthBar = indicator.querySelector('.strength-bar');
  strengthBar.style.width = `${strength}%`;
  
  // Atualiza a cor baseada na força
  if (strength <= 20) {
    strengthBar.style.backgroundColor = '#ff4d4d';
    indicator.querySelector('.strength-text span').textContent = 'Muito fraca';
  } else if (strength <= 40) {
    strengthBar.style.backgroundColor = '#ffa64d';
    indicator.querySelector('.strength-text span').textContent = 'Fraca';
  } else if (strength <= 60) {
    strengthBar.style.backgroundColor = '#ffff4d';
    indicator.querySelector('.strength-text span').textContent = 'Média';
  } else if (strength <= 80) {
    strengthBar.style.backgroundColor = '#4dff4d';
    indicator.querySelector('.strength-text span').textContent = 'Forte';
  } else {
    strengthBar.style.backgroundColor = '#4dffff';
    indicator.querySelector('.strength-text span').textContent = 'Muito forte';
  }
}

const isNotEmpty = val => val.trim() !== '';
const isValidName = val => val.trim().split(' ').length >= 2;
const isValidEmail = val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
const isValidPhone = val => /^\(\d{2}\) \d{5}-\d{4}$/.test(val);
const isValidCPF = val => {
  const cpf = val.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let firstVerifier = (sum * 10) % 11;
  if (firstVerifier === 10) firstVerifier = 0;
  if (firstVerifier !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  let secondVerifier = (sum * 10) % 11;
  if (secondVerifier === 10) secondVerifier = 0;
  return secondVerifier === parseInt(cpf.charAt(10));
};
const isValidPassword = val => val.length >= 5;
const isValidCEP = val => /^\d{5}-\d{3}$/.test(val);
const isValidNumber = val => /^\d+$/.test(val);
const isValidLettersOnly = val =>
  val.trim() !== '' && /^[A-Za-záàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ ]+$/.test(val);

function formatPhone(input) {
  input.value = input.value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

function formatCPF(input) {
  input.value = input.value
    .replace(/\D/g, '')
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function formatCEPandFetch(input) {
  input.value = input.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2');
  if (isValidCEP(input.value)) fetchAddress(input.value);
}

function formatNumber(input) {
  input.value = input.value.replace(/\D/g, '');
}

function formatLettersOnly(input) {
  input.value = input.value.replace(/[0-9]/g, '');
}

function showError(id, input, msg) {
  input.classList.add('invalid-input');
  const errorElement = document.getElementById(id);
  if (errorElement) {
    errorElement.textContent = msg;
    errorElement.classList.add('show-error');
    
    // Adiciona ícone de erro (se ainda não tiver)
    if (!input.parentElement.querySelector('.error-icon')) {
      const errorIcon = document.createElement('span');
      errorIcon.className = 'error-icon';
      errorIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
      errorIcon.title = msg;
      input.parentElement.appendChild(errorIcon);
      
      // Adiciona evento para mostrar o tooltip ao passar o mouse
      errorIcon.addEventListener('mouseenter', function() {
        const tooltip = document.createElement('div');
        tooltip.className = 'error-tooltip';
        tooltip.textContent = msg;
        this.appendChild(tooltip);
      });
      
      errorIcon.addEventListener('mouseleave', function() {
        const tooltip = this.querySelector('.error-tooltip');
        if (tooltip) {
          tooltip.remove();
        }
      });
    }
  }
}

function clearError(id, input) {
  input.classList.remove('invalid-input');
  const errorElement = document.getElementById(id);
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.classList.remove('show-error');
  }
  
  // Remove ícone de erro se existir
  const errorIcon = input.parentElement.querySelector('.error-icon');
  if (errorIcon) {
    errorIcon.remove();
  }
}

function fetchAddress(cep) {
  cep = cep.replace(/\D/g, '');
  
  // Mostrar toast de carregamento
  const loadingToast = window.Toast ? 
    Toast.info('<span class="loading-spinner"></span> Buscando endereço...', {
      duration: 0, // Sem tempo limite
    }) : null;

  fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(response => {
      if (!response.ok) {
        throw new Error('CEP não encontrado');
      }
      return response.json();
    })
    .then(data => {
      // Remove o toast de carregamento
      if (loadingToast) {
        Toast.remove(loadingToast);
      }
      
      if (data.erro) {
        showError('cep-error', document.getElementById('register-cep'), 'CEP não encontrado');
        if (window.Toast) {
          Toast.warning('CEP não encontrado. Por favor, verifique o número.', {
            duration: 4000,
          });
        }
        return;
      }

      const streetField = document.getElementById('register-street');
      const neighborhoodField = document.getElementById('register-neighborhood');
      const cityField = document.getElementById('register-city');
      const stateField = document.getElementById('register-state');

      if (streetField) streetField.value = data.logradouro || '';
      if (neighborhoodField) neighborhoodField.value = data.bairro || '';
      if (cityField) cityField.value = data.localidade || '';
      if (stateField) stateField.value = data.uf || '';

      if (data.logradouro) clearError('street-error', streetField);
      if (data.bairro) clearError('neighborhood-error', neighborhoodField);
      if (data.localidade) clearError('city-error', cityField);
      if (data.uf) clearError('state-error', stateField);
      
      if (window.Toast) {
        Toast.success('Endereço encontrado com sucesso!', {
          duration: 3000,
        });
      }
    })
    .catch(error => {
      console.error('Erro ao buscar o endereço:', error);
      
      // Remove o toast de carregamento
      if (loadingToast) {
        Toast.remove(loadingToast);
      }
      
      showError('cep-error', document.getElementById('register-cep'), 'Erro ao buscar o CEP');
      
      if (window.Toast) {
        Toast.error('Erro ao buscar o endereço. Por favor, verifique sua conexão e tente novamente.', {
          duration: 4000,
        });
      }
    });
}

function handleSubmit(e) {
  e.preventDefault();

  let isValid = true;
  let errorMessages = [];

  const fields = {
    'register-name': { 
      validate: isValidName, 
      message: 'Digite pelo menos nome e sobrenome' 
    },
    'register-email': { 
      validate: isValidEmail, 
      message: 'Formato inválido (ex: usuario@email.com)' 
    },
    'register-phone': { 
      validate: isValidPhone, 
      message: 'Formato correto: (00) 00000-0000' 
    },
    'register-cpf': { 
      validate: isValidCPF, 
      message: 'CPF inválido' 
    },
    'register-password': { 
      validate: isValidPassword, 
      message: 'Mínimo 5 caracteres' 
    },
    'register-cep': { 
      validate: isValidCEP, 
      message: 'Formato correto: 00000-000' 
    },
    'register-street': { 
      validate: isNotEmpty, 
      message: 'Digite o nome da rua' 
    },
    'register-number': { 
      validate: isValidNumber, 
      message: 'Digite um número válido' 
    },
    'register-neighborhood': { 
      validate: isValidLettersOnly, 
      message: 'Digite um bairro válido (sem números)' 
    },
    'register-city': { 
      validate: isValidLettersOnly, 
      message: 'Digite uma cidade válida (sem números)' 
    },
    'register-state': { 
      validate: isValidLettersOnly, 
      message: 'Digite um estado válido (sem números)' 
    },
  };

  for (const [id, config] of Object.entries(fields)) {
    const input = document.getElementById(id);
    if (!input) continue;

    if (!config.validate(input.value)) {
      const errorId = id.replace('register-', '') + '-error';
      showError(errorId, input, config.message);
      errorMessages.push(`${input.labels[0]?.textContent || id}: ${config.message}`);
      isValid = false;
    }
  }

  const password = document.getElementById('register-password')?.value;
  const confirm = document.getElementById('register-confirm-password')?.value;

  if (password && confirm && password !== confirm) {
    showError(
      'confirm-password-error',
      document.getElementById('register-confirm-password'),
      'As senhas não coincidem'
    );
    errorMessages.push('Senha: As senhas não coincidem');
    isValid = false;
  }

  if (!isValid) {
    if (window.Toast) {
      Toast.error(
        `<strong>Por favor, corrija os seguintes erros:</strong><br>
        <ul class="toast-error-list">
          ${errorMessages.map(msg => `<li>${msg}</li>`).join('')}
        </ul>`,
        {
          title: 'Erro de validação',
          duration: 6000,
        }
      );
    }
    return;
  }

  // Mostrar toast de sucesso com carregamento
  const loadingToast = window.Toast ? 
    Toast.info('<span class="loading-spinner"></span> Enviando dados...', {
      duration: 0, // Sem tempo limite
    }) : null;

  const form = e.target;
  const fileInput = document.getElementById('register-avatar');
  const hasAvatar = fileInput && fileInput.files && fileInput.files.length > 0;
  const userType = document.getElementById('type').value;

  if (hasAvatar) {
    const formData = new FormData();

    formData.append('name', form.elements.name.value);
    formData.append('email', form.elements.email.value);
    formData.append('phone', form.elements.phone.value);
    formData.append('cpf', form.elements.cpf.value);
    formData.append('password', password);
    formData.append('type', userType);
    formData.append('image', fileInput.files[0]);

    const addressData = {
      cep: form.elements.cep.value,
      street: form.elements.street.value,
      number: form.elements.number.value,
      complement: form.elements.complement.value,
      neighborhood: form.elements.neighborhood.value,
      city: form.elements.city.value,
      state: form.elements.state.value,
    };

    formData.append('address', JSON.stringify(addressData));

    fetch(`http://localhost:3001/api/user`, {
      method: 'POST',
      body: formData,
    })
      .then(async response => {
        if (response.ok) {
          const responseData = await response.json();

          window.location.href = 'admin-users.html';
        } else {
          const errorData = await response.json();
          console.error('Erro ao registrar usuário:', errorData);
        }
      })
      .catch(error => {
        console.error('Erro na requisição:', error);
      });
  } else {
    const userData = {
      name: form.elements.name.value,
      email: form.elements.email.value,
      phone: form.elements.phone.value,
      cpf: form.elements.cpf.value,
      password,
      type: userType,
      address: {
        cep: form.elements.cep.value,
        street: form.elements.street.value,
        number: form.elements.number.value,
        complement: form.elements.complement.value,
        neighborhood: form.elements.neighborhood.value,
        city: form.elements.city.value,
        state: form.elements.state.value,
      },
    };

    fetch(`http://localhost:3001/api/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
      .then(async response => {
        if (response.ok) {
          const responseData = await response.json();

          window.location.href = 'admin-users.html';
        } else {
          const errorData = await response.json();
          console.error('Erro ao registrar usuário:', errorData);
        }
      })
      .catch(error => {
        console.error('Erro na requisição:', error);
      });
  }
}

function setupAvatarUpload() {
  const fileInput = document.getElementById('register-avatar');
  const selectButton = document.getElementById('select-avatar-btn');
  const previewDiv = document.getElementById('avatar-preview');

  if (!fileInput || !selectButton || !previewDiv) return;

  selectButton.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', function () {
    const file = this.files[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('avatar-error', this, 'Por favor, selecione um arquivo de imagem válido.');
      this.value = '';
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showError('avatar-error', this, 'A imagem é muito grande. O tamanho máximo é 5MB.');
      this.value = '';
      return;
    }

    clearError('avatar-error', this);

    const reader = new FileReader();
    reader.onload = function (e) {
      while (previewDiv.firstChild) {
        previewDiv.removeChild(previewDiv.firstChild);
      }

      const img = document.createElement('img');
      img.src = e.target.result;
      previewDiv.appendChild(img);
    };

    reader.readAsDataURL(file);
  });
}
