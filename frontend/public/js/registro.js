const API_URL = "http://localhost:3001/api";

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("register-form");

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegisterSubmit);
  }
  
  // Adiciona validação em tempo real para cada campo
  document.getElementById("register-name").addEventListener("input", function() {
    validateField(this, validateName, "name-error", "Digite pelo menos nome e sobrenome");
  });
  
  document.getElementById("register-email").addEventListener("input", function() {
    validateField(this, validateEmail, "email-error", "Utilize um formato válido (usuario@email.com)");
  });
  
  document.getElementById("register-phone").addEventListener("input", function() {
    validateField(this, validatePhone, "phone-error", "Use o formato (00) 00000-0000");
  });
  
  document.getElementById("register-cpf").addEventListener("input", function() {
    validateField(this, validateCPF, "cpf-error", "Use o formato 000.000.000-00");
  });
  
  document.getElementById("register-password").addEventListener("input", function() {
    validateField(this, validatePassword, "password-error", "A senha deve ter pelo menos 5 caracteres");
  });
  
  document.getElementById("register-confirm-password").addEventListener("input", function() {
    const password = document.getElementById("register-password").value;
    if (this.value !== password) {
      this.classList.add("invalid-input");
      document.getElementById("confirm-password-error").textContent = "As senhas não coincidem";
    } else {
      this.classList.remove("invalid-input");
      document.getElementById("confirm-password-error").textContent = "";
    }
  });

  document.getElementById("register-cep").addEventListener("input", function() {
    validateField(this, validateCEP, "cep-error", "Use o formato 00000-000");
    if (validateCEP(this.value)) {
      fetchAddressInfo(this.value);
    }
  });
  
  document.getElementById("register-street").addEventListener("input", function() {
    validateField(this, validateStreet, "street-error", "Digite o nome da rua");
  });
  
  document.getElementById("register-number").addEventListener("input", function() {
    validateField(this, validateNumber, "number-error", "Digite um número válido");
  });
});

// Função genérica para validar um campo
function validateField(inputElement, validationFunction, errorElementId, errorMessage) {
  const value = inputElement.value.trim();
  const errorElement = document.getElementById(errorElementId);
  
  if (value === "") {
    errorElement.textContent = "";
    inputElement.classList.remove("invalid-input");
    return;
  }
  
  if (!validationFunction(value)) {
    inputElement.classList.add("invalid-input");
    errorElement.textContent = errorMessage;
  } else {
    inputElement.classList.remove("invalid-input");
    errorElement.textContent = "";
  }
}

// Funções de validação
function validateName(name) {
  const regex = /^[a-zA-ZÀ-ÖØ-öø-ÿ]+([ ][a-zA-ZÀ-ÖØ-öø-ÿ]+)+$/; // Nome com pelo menos duas palavras
  return regex.test(name);
}

function validateEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

function validatePhone(phone) {
  // Aceita formatos: (00) 00000-0000 ou 00000000000
  const regex = /^(?:\(\d{2}\)\s?)?\d{5}-?\d{4}$/;
  return regex.test(phone);
}

function validateCPF(cpf) {
  // Aceita formatos: 000.000.000-00 ou 00000000000
  const regex = /^(\d{3}\.){2}\d{3}-\d{2}$|^\d{11}$/;
  return regex.test(cpf);
}

function validatePassword(password) {
  return password.length >= 5;
}

// Funções de validação adicionais para endereço
function validateCEP(cep) {
  // Aceita formatos: 00000-000 ou 00000000
  const regex = /^\d{5}-?\d{3}$/;
  return regex.test(cep);
}

function validateStreet(street) {
  return street.trim().length >= 3;
}

function validateNumber(number) {
  return /^\d+$/.test(number) || /^\d+[a-zA-Z]$/.test(number); // Aceita números ou números seguidos de uma letra
}

// Função para consultar CEP e preencher endereço automaticamente
function fetchAddressInfo(cep) {
  // Remove o traço para compatibilidade com a API
  cep = cep.replace('-', '');
  
  if (cep.length !== 8) return;
  
  fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(response => response.json())
    .then(data => {
      if (!data.erro) {
        document.getElementById("register-street").value = data.logradouro;
        // Não preenchemos o número automaticamente
      }
    })
    .catch(error => console.error('Erro ao buscar CEP:', error));
}

async function handleRegisterSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById("register-name");
  const emailInput = document.getElementById("register-email");
  const phoneInput = document.getElementById("register-phone");
  const cpfInput = document.getElementById("register-cpf");
  const passwordInput = document.getElementById("register-password");
  const confirmPasswordInput = document.getElementById("register-confirm-password");
  const cepInput = document.getElementById("register-cep");
  const streetInput = document.getElementById("register-street");
  const numberInput = document.getElementById("register-number");
  
  // Limpa todas as mensagens de erro anteriores
  clearAllErrors();
  
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const cpf = cpfInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  const cep = cepInput.value.trim();
  const street = streetInput.value.trim();
  const number = numberInput.value.trim();

  // Validar todos os campos
  let isValid = true;

  if (!validateName(name)) {
    isValid = false;
    showError(nameInput, "name-error", "Digite pelo menos nome e sobrenome");
  }

  if (!validateEmail(email)) {
    isValid = false;
    showError(emailInput, "email-error", "Utilize um formato válido (exemplo@dominio.com)");
  }

  if (!validatePhone(phone)) {
    isValid = false;
    showError(phoneInput, "phone-error", "Use o formato (00) 00000-0000");
  }

  if (!validateCPF(cpf)) {
    isValid = false;
    showError(cpfInput, "cpf-error", "Use o formato 000.000.000-00");
  }

  if (!validatePassword(password)) {
    isValid = false;
    showError(passwordInput, "password-error", "A senha deve ter pelo menos 5 caracteres");
  }
  
  if (password !== confirmPassword) {
    isValid = false;
    showError(confirmPasswordInput, "confirm-password-error", "As senhas não coincidem");
  }

  if (!validateCEP(cep)) {
    isValid = false;
    showError(cepInput, "cep-error", "Use o formato 00000-000");
  }

  if (!validateStreet(street)) {
    isValid = false;
    showError(streetInput, "street-error", "Digite o nome da rua");
  }

  if (!validateNumber(number)) {
    isValid = false;
    showError(numberInput, "number-error", "Digite um número válido");
  }

  if (!isValid) {
    return;
  }
  
  const userData = {
    name: name,
    email: email,
    phone: phone,
    cpf: cpf,
    address: {
      cep: cep,
      street: street,
      number: number
    },
    password: password,
  };

  console.log("Dados do formulário:", userData);
}

// Funções auxiliares
function showError(inputElement, errorElementId, errorMessage) {
  inputElement.classList.add("invalid-input");
  const errorElement = document.getElementById(errorElementId);
  errorElement.textContent = errorMessage;
}

function clearAllErrors() {
  const errorMessages = document.querySelectorAll(".error-message");
  errorMessages.forEach(element => {
    element.textContent = "";
  });
  
  const invalidInputs = document.querySelectorAll(".invalid-input");
  invalidInputs.forEach(element => {
    element.classList.remove("invalid-input");
  });
}
