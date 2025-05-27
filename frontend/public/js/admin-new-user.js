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
    alert('Você precisa estar logado como administrador para acessar esta página.');
    window.location.href = 'login.html?redirect=admin-new-user.html';
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

  input.addEventListener('input', () => {
    if (formatFn) formatFn(input);
    if (!validateFn(input.value)) {
      showError(errorId, input, errorMsg);
    } else {
      clearError(errorId, input);
    }
  });
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
  document.getElementById(id).textContent = msg;
}

function clearError(id, input) {
  input.classList.remove('invalid-input');
  document.getElementById(id).textContent = '';
}

function fetchAddress(cep) {
  cep = cep.replace(/\D/g, '');

  fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(response => {
      if (!response.ok) {
        throw new Error('CEP não encontrado');
      }
      return response.json();
    })
    .then(data => {
      if (data.erro) {
        showError('cep-error', document.getElementById('register-cep'), 'CEP não encontrado');
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
    })
    .catch(error => {
      console.error('Erro ao buscar o endereço:', error);
      showError('cep-error', document.getElementById('register-cep'), 'Erro ao buscar o CEP');
    });
}

function handleSubmit(e) {
  e.preventDefault();

  let isValid = true;

  const fields = {
    'register-name': isValidName,
    'register-email': isValidEmail,
    'register-phone': isValidPhone,
    'register-cpf': isValidCPF,
    'register-password': isValidPassword,
    'register-cep': isValidCEP,
    'register-street': isNotEmpty,
    'register-number': isValidNumber,
    'register-neighborhood': isValidLettersOnly,
    'register-city': isValidLettersOnly,
    'register-state': isValidLettersOnly,
  };

  for (const [id, validateFn] of Object.entries(fields)) {
    const input = document.getElementById(id);
    if (!input) continue;

    if (!validateFn(input.value)) {
      const errorId = id.replace('register-', '') + '-error';
      showError(errorId, input, 'Campo inválido');
      isValid = false;
    }
  }

  const password = document.getElementById('register-password').value;
  const confirm = document.getElementById('register-confirm-password').value;

  if (password !== confirm) {
    showError(
      'confirm-password-error',
      document.getElementById('register-confirm-password'),
      'As senhas não coincidem'
    );
    isValid = false;
  }

  if (!isValid) return;

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

    fetch(`http://localhost:3001/api/users`, {
      method: 'POST',
      body: formData,
    })
      .then(async response => {
        if (response.ok) {
          const responseData = await response.json();

          alert('Usuário cadastrado com sucesso!');
          window.location.href = 'admin-users.html';
        } else {
          const errorData = await response.json();
          console.error('Erro ao registrar usuário:', errorData);
          alert('Erro ao cadastrar usuário: ' + (errorData.message || 'Erro desconhecido'));
        }
      })
      .catch(error => {
        console.error('Erro na requisição:', error);
        alert('Erro na requisição: ' + error.message);
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

    fetch(`http://localhost:3001/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
      .then(async response => {
        if (response.ok) {
          const responseData = await response.json();

          alert('Usuário cadastrado com sucesso!');
          window.location.href = 'admin-users.html';
        } else {
          const errorData = await response.json();
          console.error('Erro ao registrar usuário:', errorData);
          alert('Erro ao cadastrar usuário: ' + (errorData.message || 'Erro desconhecido'));
        }
      })
      .catch(error => {
        console.error('Erro na requisição:', error);
        alert('Erro na requisição: ' + error.message);
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
