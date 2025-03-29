document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegisterSubmit);
  }

  // Adiciona validação em tempo real para cada campo
  document.getElementById('product-name').addEventListener('input', function () {
    validateField(this, validateName, 'name-error', 'Digite o nome do produto');
  });

  document.getElementById('product-description').addEventListener('input', function () {
    validateField(this, validateDescription, 'description-error', 'Digite a descrição do produto');
  });

  document.getElementById('product-price').addEventListener('input', function () {
    formatPrice(this);
    validateField(this, validatePrice, 'price-error', 'Digite um preço válido no formato R$ 10,00');
  });

  document.getElementById('product-size').addEventListener('input', function () {
    formatWeight(this);
    validateField(this, validateSize, 'size-error', 'Digite o peso ou tamanho do produto');
  });

  document.getElementById('product-stock').addEventListener('input', function () {
    validateField(this, validateStock, 'stock-error', 'Digite a quantidade disponível');
  });

  document.getElementById('product-expiry').addEventListener('input', function () {
    formatDate(this);
    validateField(this, validateExpiry, 'expiry-error', 'Selecione uma data de validade');
  });

  document.getElementById('product-image').addEventListener('change', function () {
    validateField(this, validateImage, 'image-error', 'Selecione uma imagem válida');
  });
});

// Máscara para o preço
function formatPrice(input) {
  let value = input.value.replace(/\D/g, ''); // Remove caracteres não numéricos
  if (value.length > 2) {
    value = value.replace(/(\d{2})$/, ',$1'); // Adiciona vírgula antes dos dois últimos dígitos
  }
  if (value.length > 6) {
    value = value.replace(/(\d)(\d{3})(\d{2})$/, '$1.$2,$3'); // Adiciona ponto de milhar
  }
  if (value.length > 3) {
    value = 'R$ ' + value; // Adiciona o prefixo "R$"
  } else {
    value = 'R$ ' + value; // Para valores com menos de 3 dígitos
  }
  input.value = value;
}

// Máscara para o peso
function formatWeight(input) {
  let value = input.value.replace(/\D/g, ''); // Remove caracteres não numéricos
  if (value.length > 2) {
    value = value.replace(/(\d{2})$/, ',$1'); // Adiciona vírgula antes dos dois últimos dígitos
  }
  input.value = value;
}

// Máscara para a data
function formatDate(input) {
  let value = input.value.replace(/\D/g, ''); // Remove qualquer caractere não numérico
  if (value.length > 2 && value.length <= 4) {
    value = value.replace(/(\d{2})(\d{0,2})$/, '$1/$2'); // Adiciona a barra após o mês
  } else if (value.length > 4) {
    value = value.replace(/(\d{2})(\d{2})(\d{0,4})$/, '$1/$2/$3'); // Adiciona a barra após o dia e o mês
  }
  input.value = value;
}

// Funções de validação
function validateName(name) {
  return name.trim().length >= 3; // O nome do produto deve ter pelo menos 3 caracteres
}

function validateDescription(description) {
  return description.trim().length >= 3; // A descrição do produto deve ter pelo menos 3 caracteres
}

function validatePrice(price) {
  // Verifica se o preço está no formato "R$" seguido de um número positivo
  const pricePattern = /^R\$\s?\d+(\,\d{2})?$/; // Aceita R$ 10 ou R$ 10,00
  return pricePattern.test(price);
}

function validateSize(size) {
  return size.trim().length >= 3; // Peso ou tamanho deve ter pelo menos 3 caracteres
}

function validateStock(stock) {
  return !isNaN(stock) && parseInt(stock) > 0; // O estoque deve ser um número maior que 0
}

function validateExpiry(expiry) {
  return new Date(expiry) > new Date(); // A data de validade deve ser maior que a data atual
}

function validateImage(image) {
  return image.length > 0; // Deve ser selecionada uma imagem
}

// Função para validar os campos
function validateField(inputElement, validationFunction, errorElementId, errorMessage) {
  const value = inputElement.value.trim();
  const errorElement = document.getElementById(errorElementId);

  if (value === '') {
    errorElement.textContent = '';
    inputElement.classList.remove('invalid-input');
    return;
  }

  if (!validationFunction(value)) {
    inputElement.classList.add('invalid-input');
    errorElement.textContent = errorMessage;
  } else {
    inputElement.classList.remove('invalid-input');
    errorElement.textContent = '';
  }
}

// Função para tratar o envio do formulário
async function handleRegisterSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById('product-name');
  const descriptionInput = document.getElementById('product-description');
  const priceInput = document.getElementById('product-price');
  const sizeInput = document.getElementById('product-size');
  const stockInput = document.getElementById('product-stock');
  const expiryInput = document.getElementById('product-expiry');
  const imageInput = document.getElementById('product-image');

  // Limpa as mensagens de erro
  clearAllErrors();

  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();
  const price = priceInput.value;
  const size = sizeInput.value.trim();
  const stock = stockInput.value;
  const expiry = expiryInput.value;
  const image = imageInput.files[0];

  let isValid = true;

  if (!validateName(name)) {
    isValid = false;
    showError(nameInput, 'name-error', 'Digite o nome do produto');
  }

  if (!validateDescription(description)) {
    isValid = false;
    showError(descriptionInput, 'description-error', 'Digite a descrição do produto');
  }

  if (!validatePrice(price)) {
    isValid = false;
    showError(priceInput, 'price-error', 'Digite um preço válido no formato R$ 10,00');
  }

  if (!validateSize(size)) {
    isValid = false;
    showError(sizeInput, 'size-error', 'Digite o peso ou tamanho do produto');
  }

  if (!validateStock(stock)) {
    isValid = false;
    showError(stockInput, 'stock-error', 'Digite a quantidade disponível');
  }

  if (!validateExpiry(expiry)) {
    isValid = false;
    showError(expiryInput, 'expiry-error', 'Selecione uma data de validade válida');
  }

  if (!image) {
    isValid = false;
    showError(imageInput, 'image-error', 'Selecione uma imagem válida');
  }

  if (!isValid) {
    return;
  }

  const productData = {
    name: name,
    description: description,
    price: price,
    size: size,
    stock: stock,
    expiry: expiry,
    image: image,
  };

  console.log('Dados do produto:', productData);
}

function showError(inputElement, errorElementId, errorMessage) {
  inputElement.classList.add('invalid-input');
  const errorElement = document.getElementById(errorElementId);
  errorElement.textContent = errorMessage;
}

function clearAllErrors() {
  const errorMessages = document.querySelectorAll('.error-message');
  errorMessages.forEach(element => {
    element.textContent = '';
  });

  const invalidInputs = document.querySelectorAll('.invalid-input');
  invalidInputs.forEach(element => {
    element.classList.remove('invalid-input');
  });
}
