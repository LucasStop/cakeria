const API_URL = "http://localhost:3001/api";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLoginSubmit);
  }

  // Adiciona validação em tempo real para cada campo
  document.getElementById("email").addEventListener("input", function() {
    validateField(this, validateEmail, "email-error", "Utilize um formato válido (usuario@email.com)");
  });
  
  document.getElementById("password").addEventListener("input", function() {
    validateField(this, validatePassword, "password-error", "A senha deve ter pelo menos 5 caracteres");
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
function validateEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

function validatePassword(password) {
  return password.length >= 5;
}

async function handleLoginSubmit(e) {
  e.preventDefault();

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  
  // Limpa todas as mensagens de erro anteriores
  clearAllErrors();
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Validar todos os campos
  let isValid = true;

  if (!validateEmail(email)) {
    isValid = false;
    showError(emailInput, "email-error", "Utilize um formato válido (usuario@email.com)");
  }

  if (!validatePassword(password)) {
    isValid = false;
    showError(passwordInput, "password-error", "A senha deve ter pelo menos 5 caracteres");
  }

  if (!isValid) {
    return;
  }

  const userData = {
    email: email,
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
