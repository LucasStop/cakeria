document.addEventListener('DOMContentLoaded', initProductForm);

function initProductForm() {
  const registerForm = document.getElementById('register-form');
  if (!registerForm) return;

  setupFormListeners();
  
  registerForm.addEventListener('submit', handleRegisterSubmit);
}

function setupFormListeners() {
  const fieldValidations = {
    'product-name': { validator: validateName, errorMsg: 'Digite o nome do produto' },
    'product-description': { validator: validateDescription, errorMsg: 'Digite a descrição do produto' },
    'product-price': { 
      formatter: formatPrice, 
      validator: validatePrice, 
      errorMsg: 'Digite um preço válido no formato R$ 10,00' 
    },
    'product-size': { 
      formatter: formatWeight, 
      validator: validateSize, 
      errorMsg: 'Digite um peso válido em gramas ou kg' 
    },
    'product-stock': { validator: validateStock, errorMsg: 'Digite a quantidade disponível' },
    'product-expiry': { 
      formatter: formatDate, 
      validator: validateExpiry, 
      errorMsg: 'Formato DD/MM/AAAA (não pode ser anterior a hoje)' 
    },
    'product-image': { validator: validateImage, errorMsg: 'Selecione uma imagem válida' }
  };

  Object.entries(fieldValidations).forEach(([fieldId, { formatter, validator, errorMsg }]) => {
    const field = document.getElementById(fieldId);
    if (!field) return;

    const eventType = fieldId === 'product-image' ? 'change' : 'input';
    
    field.addEventListener(eventType, () => {
      if (formatter) formatter(field);
      validateField(field, validator, `${fieldId}-error`, errorMsg);
    });
  });


  document.getElementById('product-image').addEventListener('change', function() {
    const errorElement = document.getElementById('image-error');
    if (this.files.length === 0) {
      errorElement.textContent = 'Selecione uma imagem válida';
      this.classList.add('invalid-input');
    } else if (!this.files[0].type.startsWith('image/')) {
      errorElement.textContent = 'O arquivo deve ser uma imagem';
      this.classList.add('invalid-input');
    } else {
      errorElement.textContent = '';
      this.classList.remove('invalid-input');
    }
  });
}

function formatPrice(input) {
  let value = input.value.replace(/\D/g, '');
  value = value.length > 2 ? value.replace(/(\d{2})$/, ',$1') : value;
  value = value.length > 6 ? value.replace(/(\d)(\d{3})(\d{2})$/, '$1.$2,$3') : value;
  input.value = `R$ ${value}`;
}

function formatWeight(input) {
  let value = input.value.replace(/\D/g, '');
  value = value.length > 3 ? value.replace(/(\d{1,3})(\d{10})$/, '$1.$2') : value;
  input.value = value.length > 0 ? `${value}g` : value;
}

function formatDate(input) {
  let value = input.value.replace(/\D/g, '');
  if (value.length > 2 && value.length <= 4) {
    value = value.replace(/(\d{2})(\d{0,2})/, '$1/$2');
  } else if (value.length > 4) {
    value = value.replace(/(\d{2})(\d{2})(\d{0,4})/, '$1/$2/$3');
  }
  input.value = value;
}

const validateName = (name) => name.trim().length >= 3;
const validateDescription = (description) => description.trim().length >= 3;
const validatePrice = (price) => /^R\$\s?\d+(\,\d{2})?$/.test(price);
const validateSize = (size) => /^\d+(\,\d{1,2})?\s?(g|kg|ml|l)?$/i.test(size.trim());
const validateStock = (stock) => !isNaN(stock) && parseInt(stock) > 0;
const validateImage = (image) => image && image.length > 0 && image[0].type.startsWith('image/');

function validateExpiry(expiry) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(expiry)) return false;
  
  const [day, month, year] = expiry.split('/');
  const expiryDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return !isNaN(expiryDate.getTime()) && expiryDate >= today;
}

function validateField(inputElement, validator, errorElementId, errorMessage) {
  let value;
  if (inputElement.type === 'file') {
    value = inputElement.files;
  } else {
    value = inputElement.value.trim();
  }
  
  const errorElement = document.getElementById(errorElementId);
  const isValid = value === '' || (inputElement.type === 'file' ? value.length === 0 : validator(value));

  inputElement.classList.toggle('invalid-input', !isValid);
  errorElement.textContent = isValid ? '' : errorMessage;
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  clearAllErrors();

  const fields = {
    name: { element: 'product-name', validator: validateName, error: 'name-error', message: 'Digite o nome do produto' },
    description: { element: 'product-description', validator: validateDescription, error: 'description-error', message: 'Digite a descrição do produto' },
    price: { element: 'product-price', validator: validatePrice, error: 'price-error', message: 'Digite um preço válido no formato R$ 10,00' },
    size: { element: 'product-size', validator: validateSize, error: 'size-error', message: 'Digite o peso ou tamanho do produto' },
    stock: { element: 'product-stock', validator: validateStock, error: 'stock-error', message: 'Digite a quantidade disponível' },
    expiry: { element: 'product-expiry', validator: validateExpiry, error: 'expiry-error', message: 'A data de validade não pode ser anterior a hoje e deve estar no formato DD/MM/AAAA' },
    image: { element: 'product-image', validator: validateImage, error: 'image-error', message: 'Selecione uma imagem válida' }
  };

  const formData = new FormData();
  let isValid = true;

  Object.entries(fields).forEach(([key, { element, validator, error, message }]) => {
    const field = document.getElementById(element);
    let value;
    
    if (element === 'product-image') {
      value = field.files;
      if (value.length > 0) {
        formData.append('image', value[0]);
      }
    } else {
      value = field.value.trim();
      formData.append(key, value);
    }

    if (!validator(value)) {
      showError(field, error, message);
      isValid = false;
    }
  });

  if (!isValid) return;

  console.log('Dados do produto:', Object.fromEntries(formData));
  
  // Aqui você pode enviar os dados para o servidor
  // try {
  //   const response = await fetch('/api/products', {
  //     method: 'POST',
  //     body: formData
  //   });
  //   const result = await response.json();
  //   console.log('Sucesso:', result);
  // } catch (error) {  
  //   console.error('Erro:', error);
  // }
}

function showError(inputElement, errorElementId, errorMessage) {
  inputElement.classList.add('invalid-input');
  document.getElementById(errorElementId).textContent = errorMessage;
}

function clearAllErrors() {
  document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
  document.querySelectorAll('.invalid-input').forEach(el => el.classList.remove('invalid-input'));
}