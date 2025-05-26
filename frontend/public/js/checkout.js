// Checkout e finalização de pedido
document.addEventListener('DOMContentLoaded', initCheckout);

// Inicializa a página de checkout
function initCheckout() {
  if (!isUserLoggedIn()) {
    redirectToLogin();
    return;
  }

  loadCartItems();
  loadUserAddresses();
  setupEventListeners();
}

// Carrega os itens do carrinho na página de checkout
function loadCartItems() {
  const cartItems = getCartItems();

  if (cartItems.length === 0) {
    // Redireciona para o carrinho se estiver vazio
    window.location.href = './carrinho.html';
    return;
  }

  renderCheckoutItems(cartItems);
  updateCheckoutSummary();
}

// Renderiza os itens do carrinho na página de checkout
function renderCheckoutItems(cartItems) {
  const checkoutItemsElement = document.getElementById('checkout-items');
  if (!checkoutItemsElement) return;

  checkoutItemsElement.innerHTML = '';

  cartItems.forEach(item => {
    const itemElement = createCheckoutItemElement(item);
    checkoutItemsElement.appendChild(itemElement);
  });
}

// Cria um elemento para um item no checkout
function createCheckoutItemElement(item) {
  const div = document.createElement('div');
  div.className = 'checkout-item';

  // Define a URL da imagem
  let imageUrl;
  if (window.ImageHelper && typeof window.ImageHelper.getProductImageUrl === 'function') {
    imageUrl = window.ImageHelper.getProductImageUrl(item.id);
  } else if (item.image_url) {
    imageUrl = item.image_url;
  } else {
    imageUrl = `${window.API?.BASE_URL || 'http://localhost:3001/api'}/product/image/${item.id}`;
  }

  div.innerHTML = `
    <div class="checkout-item-image">
      <img src="${imageUrl}" alt="${item.name}" onerror="this.onerror=null; this.src='/assets/default-product.png';">
    </div>
    <div class="checkout-item-details">
      <div class="checkout-item-name">${item.name}</div>
      <div class="checkout-item-quantity">Quantidade: ${item.quantity}</div>
    </div>
    <div class="checkout-item-price">${formatCurrency(item.price * item.quantity)}</div>
  `;

  return div;
}

// Atualiza o resumo do pedido no checkout
function updateCheckoutSummary() {
  const cartItems = getCartItems();
  const subtotal = calculateSubtotal(cartItems);
  const shipping = calculateShipping(cartItems);
  const total = subtotal + shipping;

  document.getElementById('checkout-subtotal').textContent = formatCurrency(subtotal);
  document.getElementById('checkout-shipping').textContent = formatCurrency(shipping);
  document.getElementById('checkout-total').textContent = formatCurrency(total);

  // Atualiza também os valores no modal de confirmação
  document.getElementById('modal-total').textContent = formatCurrency(total);
}

// Carrega os endereços do usuário
async function loadUserAddresses() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      showError('Não foi possível identificar o usuário atual');
      return;
    }

    const addresses = await fetchUserAddresses(userId);
    populateAddressSelect(addresses);
  } catch (error) {
    console.error('Erro ao carregar endereços:', error);
    showError('Não foi possível carregar seus endereços');
  }
}

// Busca os endereços do usuário na API
async function fetchUserAddresses(userId) {
  try {
    if (window.API && typeof window.API.request === 'function') {
      return await window.API.request(`/address/user/${userId}`, { method: 'GET' });
    }

    const token = localStorage.getItem('token');
    const response = await fetch(
      `${window.API?.BASE_URL || 'http://localhost:3001/api'}/address/user/${userId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Falha ao buscar endereços');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar endereços:', error);
    throw error;
  }
}

// Popula o select de endereços com os endereços do usuário
function populateAddressSelect(addresses) {
  const addressSelect = document.getElementById('address-select');
  if (!addressSelect) return;

  // Mantém a opção padrão
  addressSelect.innerHTML =
    '<option value="" disabled selected>Selecione um endereço para entrega</option>';

  if (!addresses || addresses.length === 0) {
    // Se não houver endereços, mostra o formulário de novo endereço
    toggleNewAddressForm(true);
    return;
  }

  addresses.forEach(address => {
    const option = document.createElement('option');
    option.value = address.id;
    option.textContent = formatAddressOption(address);
    addressSelect.appendChild(option);
  });
}

// Formata um endereço para exibição no select
function formatAddressOption(address) {
  return `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city}/${address.state}`;
}

// Configura os event listeners da página
function setupEventListeners() {
  // Botão de voltar para o carrinho
  const btnBackToCart = document.getElementById('btn-back-to-cart');
  if (btnBackToCart) {
    btnBackToCart.addEventListener('click', () => {
      window.location.href = './carrinho.html';
    });
  }

  // Botão de novo endereço
  const btnNewAddress = document.getElementById('btn-new-address');
  if (btnNewAddress) {
    btnNewAddress.addEventListener('click', () => {
      toggleNewAddressForm();
    });
  }

  // Select de endereço (para esconder o form quando um endereço for selecionado)
  const addressSelect = document.getElementById('address-select');
  if (addressSelect) {
    addressSelect.addEventListener('change', () => {
      if (addressSelect.value) {
        toggleNewAddressForm(false);
      }
    });
  }

  // Select de método de pagamento (para mostrar campos específicos)
  const paymentMethodSelect = document.getElementById('payment-method');
  if (paymentMethodSelect) {
    paymentMethodSelect.addEventListener('change', () => {
      updatePaymentFields(paymentMethodSelect.value);
    });
  }

  // Botão de confirmar pedido
  const btnPlaceOrder = document.getElementById('btn-place-order');
  if (btnPlaceOrder) {
    btnPlaceOrder.addEventListener('click', validateAndShowConfirmation);
  }

  // Modal de confirmação do pedido
  setupOrderConfirmationModal();
}

// Configura o modal de confirmação do pedido
function setupOrderConfirmationModal() {
  const modal = document.getElementById('order-confirmation-modal');
  if (!modal) return;

  const closeButtons = modal.querySelectorAll('.close, #cancel-order');
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  });

  const confirmButton = modal.querySelector('#confirm-order');
  if (confirmButton) {
    confirmButton.addEventListener('click', createOrder);
  }

  // Fecha o modal ao clicar fora
  window.addEventListener('click', event => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}

// Alterna a exibição do formulário de novo endereço
function toggleNewAddressForm(show) {
  const newAddressForm = document.getElementById('new-address-form');
  if (!newAddressForm) return;

  if (show === undefined) {
    // Se não for especificado, inverte o estado atual
    show = newAddressForm.style.display === 'none';
  }

  newAddressForm.style.display = show ? 'block' : 'none';

  // Se mostrar o form, desativa o select
  const addressSelect = document.getElementById('address-select');
  if (addressSelect) {
    if (show) {
      addressSelect.selectedIndex = 0;
      addressSelect.disabled = true;
    } else {
      addressSelect.disabled = false;
    }
  }
}

// Atualiza os campos de pagamento com base no método selecionado
function updatePaymentFields(method) {
  // Esconde todos os campos específicos primeiro
  const paymentFields = document.querySelectorAll('.payment-fields');
  paymentFields.forEach(field => {
    field.style.display = 'none';
  });

  // Mostra os campos do método selecionado
  if (method === 'credit_card' || method === 'debit_card') {
    document.getElementById('credit-card-fields').style.display = 'block';
  } else if (method === 'pix') {
    document.getElementById('pix-fields').style.display = 'block';
  } else if (method === 'bank_transfer') {
    document.getElementById('bank-transfer-fields').style.display = 'block';
  }

  // Atualiza o método de pagamento no modal
  updatePaymentMethodDisplay(method);
}

// Atualiza a exibição do método de pagamento no modal
function updatePaymentMethodDisplay(method) {
  const paymentMethodDisplay = document.getElementById('modal-payment-method');
  if (!paymentMethodDisplay) return;

  const methodNames = {
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    pix: 'PIX',
    bank_transfer: 'Transferência Bancária',
    money: 'Dinheiro na Entrega',
  };

  paymentMethodDisplay.textContent = methodNames[method] || 'Não selecionado';
}

// Valida o formulário e mostra a confirmação
function validateAndShowConfirmation() {
  clearAllErrors();

  // Verifica se há produtos no carrinho
  const cartItems = getCartItems();
  if (cartItems.length === 0) {
    showError('Seu carrinho está vazio');
    return;
  }

  // Obtém o ID do endereço selecionado ou os dados do novo endereço
  const addressData = getAddressData();
  if (!addressData) {
    document.getElementById('address-error').textContent =
      'Selecione um endereço ou adicione um novo';
    return;
  }

  // Verifica o método de pagamento
  const paymentMethodSelect = document.getElementById('payment-method');
  if (!paymentMethodSelect || !paymentMethodSelect.value) {
    document.getElementById('payment-method-error').textContent =
      'Selecione uma forma de pagamento';
    return;
  }

  // Atualiza informações no modal
  updatePaymentMethodDisplay(paymentMethodSelect.value);

  // Exibe o modal de confirmação
  const modal = document.getElementById('order-confirmation-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

// Obtém os dados do endereço do formulário
function getAddressData() {
  const addressSelect = document.getElementById('address-select');
  const newAddressForm = document.getElementById('new-address-form');

  // Se o formulário de novo endereço estiver visível, valida e retorna os dados do novo endereço
  if (newAddressForm && newAddressForm.style.display === 'block') {
    const requiredFields = ['street', 'number', 'neighborhood', 'city', 'state', 'postal_code'];
    let isValid = true;

    const newAddress = {};

    requiredFields.forEach(field => {
      const input = document.getElementById(field);
      if (!input || !input.value.trim()) {
        document.getElementById(`${field}-error`).textContent = 'Campo obrigatório';
        isValid = false;
      } else {
        newAddress[field] = input.value.trim();
      }
    });

    // Adiciona campos opcionais
    const complement = document.getElementById('complement');
    if (complement && complement.value.trim()) {
      newAddress.complement = complement.value.trim();
    }

    const reference = document.getElementById('reference');
    if (reference && reference.value.trim()) {
      newAddress.reference = reference.value.trim();
    }

    return isValid ? { new: true, address: newAddress } : null;
  }

  // Se não estiver usando o formulário de novo endereço, verifica o select
  if (addressSelect && addressSelect.value) {
    return { new: false, address_id: addressSelect.value };
  }

  return null;
}

// Cria o pedido na API
async function createOrder() {
  try {
    const loadingButton = document.getElementById('confirm-order');
    if (loadingButton) {
      loadingButton.textContent = 'Processando...';
      loadingButton.disabled = true;
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Não foi possível identificar o usuário atual');
    }

    // Obtém os itens do carrinho
    const cartItems = getCartItems();
    if (cartItems.length === 0) {
      throw new Error('Seu carrinho está vazio');
    }

    // Obtém os dados do endereço
    const addressData = getAddressData();
    if (!addressData) {
      throw new Error('Dados de endereço inválidos');
    }

    // Se for um novo endereço, primeiro cria o endereço
    let addressId = addressData.address_id;
    if (addressData.new) {
      const newAddress = await createNewAddress(userId, addressData.address);
      addressId = newAddress.id;
    }

    // Obtém o método de pagamento
    const paymentMethodSelect = document.getElementById('payment-method');
    if (!paymentMethodSelect || !paymentMethodSelect.value) {
      throw new Error('Método de pagamento não selecionado');
    }

    // Obtém as observações
    const notesInput = document.getElementById('notes');
    const notes = notesInput ? notesInput.value.trim() : '';

    // Calcula os valores
    const { subtotal, shipping, total } = calculateOrderTotals();

    // Prepara os dados para a API
    const orderData = {
      user_id: userId,
      address_id: addressId,
      payment_method: paymentMethodSelect.value,
      notes: notes,
      subtotal: subtotal,
      shipping: shipping,
      total: total,
      product: cartItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
      })),
    };

    // Envia para a API
    const createdOrder = await submitOrder(orderData);

    // Limpa o carrinho
    clearCart();

    // Redireciona para a página de sucesso ou mostra mensagem
    redirectToOrderSuccess(createdOrder.id);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    showError(error.message || 'Não foi possível finalizar seu pedido. Tente novamente.');

    const loadingButton = document.getElementById('confirm-order');
    if (loadingButton) {
      loadingButton.textContent = 'Confirmar Pedido';
      loadingButton.disabled = false;
    }

    // Fecha o modal
    const modal = document.getElementById('order-confirmation-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
}

// Cria um novo endereço na API
async function createNewAddress(userId, addressData) {
  try {
    if (window.API && typeof window.API.request === 'function') {
      return await window.API.request(`/address`, {
        method: 'POST',
        body: { ...addressData, user_id: userId },
      });
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${window.API?.BASE_URL || 'http://localhost:3001/api'}/address`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...addressData, user_id: userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Falha ao criar endereço');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao criar endereço:', error);
    throw error;
  }
}

// Envia o pedido para a API
async function submitOrder(orderData) {
  try {
    if (window.API && typeof window.API.request === 'function') {
      return await window.API.request('/order', {
        method: 'POST',
        body: orderData,
      });
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${window.API?.BASE_URL || 'http://localhost:3001/api'}/order`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Falha ao criar pedido');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao enviar pedido:', error);
    throw error;
  }
}

// Calcula os totais do pedido
function calculateOrderTotals() {
  const cartItems = getCartItems();
  const subtotal = calculateSubtotal(cartItems);
  const shipping = calculateShipping(cartItems);
  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
  };
}

// Redireciona para a página de sucesso
function redirectToOrderSuccess(orderId) {
  // Salva o ID do pedido na sessão para mostrar na página de sucesso
  sessionStorage.setItem('lastOrderId', orderId);

  // Redireciona para a página de sucesso
  window.location.href = './pedido-sucesso.html';
}

// Calcula o subtotal do carrinho
function calculateSubtotal(cartItems) {
  return cartItems.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
}

// Calcula o frete (simplificado)
function calculateShipping(cartItems) {
  if (cartItems.length === 0) return 0;

  const subtotal = calculateSubtotal(cartItems);
  // Frete grátis para compras acima de R$ 100
  if (subtotal >= 100) return 0;

  // Frete fixo de R$ 10 para compras menores
  return 10;
}

// Obtém o ID do usuário atual
async function getCurrentUserId() {
  try {
    // Se houver uma função para obter o usuário atual, usa ela
    if (window.getUserInfo && typeof window.getUserInfo === 'function') {
      const userInfo = await window.getUserInfo();
      return userInfo.id;
    }

    // Tenta obter do localStorage (se o ID estiver armazenado)
    const userId = localStorage.getItem('user_id');
    if (userId) return userId;

    // Tenta obter a partir do objeto user no localStorage
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user && user.id) {
          return user.id;
        }
      } catch (parseError) {
        console.error('Erro ao analisar dados do usuário:', parseError);
      }
    }

    // Se o ID não estiver disponível diretamente, tenta extrair do token JWT
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          if (payload && payload.id) {
            console.log('ID do usuário obtido do token JWT:', payload.id);
            return payload.id;
          }
        }
      } catch (tokenError) {
        console.error('Erro ao extrair ID do token:', tokenError);
      }
    }

    // Se não conseguir obter o ID de nenhuma forma, redireciona para o login
    showError('Não foi possível identificar seu usuário. Por favor, faça login novamente.');
    setTimeout(() => {
      window.location.href = './login.html?redirect=checkout';
    }, 3000);
    return null;
  } catch (error) {
    console.error('Erro ao obter ID do usuário:', error);

    // Se ocorrer algum erro, redireciona para o login
    showError('Não foi possível identificar seu usuário. Por favor, faça login novamente.');
    setTimeout(() => {
      window.location.href = './login.html?redirect=checkout';
    }, 3000);
    return null;
  }
}

// Formata um valor para moeda
function formatCurrency(value) {
  return `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`;
}

// Obtem os itens do carrinho do localStorage
function getCartItems() {
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  } catch (error) {
    console.error('Erro ao obter itens do carrinho:', error);
    return [];
  }
}

// Limpa o carrinho
function clearCart() {
  localStorage.removeItem('cart');
  updateCartCounter();
}

// Atualiza o contador do carrinho no header
function updateCartCounter() {
  try {
    const cartItems = getCartItems();
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

    const possibleCounters = [
      document.querySelector('.cart-count'),
      document.querySelector('.cart-counter'),
      document.querySelector('.cart-badge'),
      document.querySelector('[data-cart-count]'),
    ];

    for (const counter of possibleCounters) {
      if (counter) {
        counter.textContent = totalItems;
        if (totalItems > 0) {
          counter.classList.add('active');
        } else {
          counter.classList.remove('active');
        }
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar contador do carrinho:', error);
  }
}

// Limpa todas as mensagens de erro
function clearAllErrors() {
  document.querySelectorAll('.error-message').forEach(element => {
    element.textContent = '';
  });
}

// Exibe uma mensagem de erro
function showError(message) {
  if (window.Toast) {
    Toast.error(message);
  } else {
    alert(`Erro: ${message}`);
  }
}

// Verifica se o usuário está logado
function isUserLoggedIn() {
  return !!localStorage.getItem('token');
}

// Redireciona para a página de login
function redirectToLogin() {
  window.location.href = './login.html?redirect=checkout';
}
