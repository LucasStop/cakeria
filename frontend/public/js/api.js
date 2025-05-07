// API Helper for interacting with the backend

const API = {
  BASE_URL: 'http://localhost:3001/api',

  // Método genérico para requisições
  async request(endpoint, options = {}) {
    try {
      // Adiciona o token de autenticação se disponível
      const token = localStorage.getItem('token');
      if (token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        };
      }

      // Adiciona o Content-Type se estiver enviando JSON
      if (options.body && !(options.body instanceof FormData)) {
        options.headers = {
          ...options.headers,
          'Content-Type': 'application/json'
        };
        options.body = JSON.stringify(options.body);
      }

      const response = await fetch(`${this.BASE_URL}${endpoint}`, options);
      
      // Se for 204 (No Content), retorna true
      if (response.status === 204) {
        return true;
      }
      
      // Se for uma resposta de erro
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      }

      // Retorna os dados
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Métodos para Users
  Users: {
    get(userId) {
      return API.request(`/users/${userId}`);
    },
    update(userId, userData) {
      return API.request(`/users/${userId}`, {
        method: 'PUT',
        body: userData
      });
    },
    changePassword(userId, passwordData) {
      return API.request(`/users/${userId}/password`, {
        method: 'PUT',
        body: passwordData
      });
    },
    delete(userId) {
      return API.request(`/users/${userId}`, {
        method: 'DELETE'
      });
    }
  },

  // Métodos para Addresses
  Addresses: {
    getByUser(userId) {
      return API.request(`/addresses/user/${userId}`);
    },
    create(addressData) {
      return API.request(`/addresses`, {
        method: 'POST',
        body: addressData
      });
    },
    update(addressId, addressData) {
      return API.request(`/addresses/${addressId}`, {
        method: 'PUT',
        body: addressData
      });
    },
    delete(addressId) {
      return API.request(`/addresses/${addressId}`, {
        method: 'DELETE'
      });
    }
  },
  
  // Método genérico para GET
  get(endpoint) {
    return this.request(endpoint);
  },

  // Método genérico para POST
  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data
    });
  },

  // Método genérico para PUT
  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data
    });
  },

  // Método genérico para DELETE
  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
};

// Exportar para uso em outros arquivos
window.API = API;
