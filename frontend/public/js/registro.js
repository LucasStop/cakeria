document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  if (form) form.addEventListener('submit', handleSubmit);

  addInputEvents();
  initPasswordToggles();
});

function initPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.password-toggle');
  
  toggleButtons.forEach(button => {
    button.addEventListener('click', function() {
      const input = this.previousElementSibling;
      
      // Botão de mostrar/esconder senha
      if (input.type === 'password') {
        input.type = 'text';
        this.querySelector('svg').innerHTML = '<path d="M12 4.5c-5 0-9.3 3-11 7.5 1.7 4.5 6 7.5 11 7.5s9.3-3 11-7.5c-1.7-4.5-6-7.5-11-7.5zm0 12.5c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/>';
      } else {
        input.type = 'password';
        this.querySelector('svg').innerHTML = '<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>';
      }
    });
  });
}

function addInputEvents() {
  addValidation('register-name', isValidName, 'name-error', 'Digite pelo menos nome e sobrenome');
  addValidation('register-email', isValidEmail, 'email-error', 'Formato inválido (ex: usuario@email.com)');
  addValidation('register-phone', isValidPhone, 'phone-error', 'Formato correto: (00) 00000-0000', formatPhone);
  addValidation('register-cpf', isValidCPF, 'cpf-error', 'CPF inválido', formatCPF);
  addValidation('register-password', isValidPassword, 'password-error', 'Mínimo 5 caracteres');
  addValidation('register-cep', isValidCEP, 'cep-error', 'Formato correto: 00000-000', formatCEPandFetch);
  addValidation('register-street', isNotEmpty, 'street-error', 'Digite o nome da rua');
  addValidation('register-number', isValidNumber, 'number-error', 'Digite um número válido', formatNumber);
  addValidation('register-neighborhood', isValidLettersOnly, 'neighborhood-error', 'Digite um bairro válido (sem números)', formatLettersOnly);
  addValidation('register-city', isValidLettersOnly, 'city-error', 'Digite uma cidade válida (sem números)', formatLettersOnly);
  addValidation('register-state', isValidLettersOnly, 'state-error', 'Digite um estado válido (sem números)', formatLettersOnly);

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

// Validações
const isNotEmpty = (val) => val.trim() !== '';
const isValidName = (val) => val.trim().split(' ').length >= 2;
const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
const isValidPhone = (val) => /^\(\d{2}\) \d{5}-\d{4}$/.test(val);
const isValidCPF = (val) => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(val);
const isValidPassword = (val) => val.length >= 5;
const isValidCEP = (val) => /^\d{5}-\d{3}$/.test(val);
const isValidNumber = (val) => /^\d+$/.test(val);
const isValidLettersOnly = (val) => val.trim() !== '' && /^[A-Za-záàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ ]+$/.test(val);

// Formatações
function formatPhone(input) {
  input.value = input.value.replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

function formatCPF(input) {
  input.value = input.value.replace(/\D/g, '')
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function formatCEPandFetch(input) {
  input.value = input.value.replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2');
  if (isValidCEP(input.value)) fetchAddress(input.value);
}

function formatNumber(input) {
  input.value = input.value.replace(/\D/g, '');
}

function formatLettersOnly(input) {
  input.value = input.value.replace(/[0-9]/g, '');
}

// Erros
function showError(id, input, msg) {
  input.classList.add('invalid-input');
  document.getElementById(id).textContent = msg;
}

function clearError(id, input) {
  input.classList.remove('invalid-input');
  document.getElementById(id).textContent = '';
}

// Busca CEP
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
      
      // Limpar erros dos campos preenchidos automaticamente
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
  
  // Validar todos os campos
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
    'register-state': isValidLettersOnly
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
    showError('confirm-password-error', document.getElementById('register-confirm-password'), 'As senhas não coincidem');
    isValid = false;
  }
  
  if (!isValid) return;

  const form = e.target;
  const userData = {
    name: form.elements.name.value,
    email: form.elements.email.value,
    phone: form.elements.phone.value,
    cpf: form.elements.cpf.value,
    password,
    address: {
      cep: form.elements.cep.value,
      street: form.elements.street.value,
      number: form.elements.number.value,
      complement: form.elements.complement.value,
      neighborhood: form.elements.neighborhood.value,
      city: form.elements.city.value,
      state: form.elements.state.value
    }
  };

  fetch(`http://localhost:3001/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  })
    .then(async (response) => {
      if (response.ok) {
        const responseData = await response.json();
        console.log('Usuário registrado com sucesso:', responseData);

        // Redirecionar para a página de login após um pequeno delay
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 2000);
      } else {
        const errorData = await response.json();
        console.error('Erro ao registrar usuário:', errorData);
      }
    })
    .catch((error) => {
      console.error('Erro na requisição:', error);
    });

  form.reset();
}
