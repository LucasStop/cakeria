// Módulo para gerenciar chamadas à API

const API = {
  BASE_URL: 'http://localhost:3001/api',

  // Helper para obter o token de autenticação
  getToken() {
    return localStorage.getItem('token');
  },

  // Helper para fazer chamadas autenticadas à API
  async call(endpoint, method = 'GET', data = null) {
    const headers = {
      'Content-Type': 'application/json'
    };

    // Adiciona token de autenticação se disponível
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method,
      headers
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, config);
      
      // Para métodos que não retornam conteúdo
      if (method === 'DELETE' && response.status === 204) {
        return { success: true };
      }

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Erro na requisição');
      }
      
      return result;
    } catch (error) {
      console.error(`Erro na chamada à API (${endpoint}):`, error);
      throw error;
    }
  },

  // Usuários
  Users: {
    get(id) {
      return API.call(`/users/${id}`);
    },
    update(id, userData) {
      return API.call(`/users/${id}`, 'PUT', userData);
    },
    changePassword(id, passwordData) {
      return API.call(`/users/${id}/change-password`, 'PUT', passwordData);
    }
  },

  // Endereços
  Addresses: {
    getByUser(userId) {
      return API.call(`/addresses/user/${userId}`);
    },
    get(id) {
      return API.call(`/addresses/${id}`);
    },
    create(addressData) {
      return API.call('/addresses', 'POST', addressData);
    },
    update(id, addressData) {
      return API.call(`/addresses/${id}`, 'PUT', addressData);
    },
    delete(id) {
      return API.call(`/addresses/${id}`, 'DELETE');
    }
  },

  // Autenticação
  Auth: {
    login(credentials) {
      return API.call('/auth/login', 'POST', credentials);
    },
    register(userData) {
      return API.call('/users', 'POST', userData);
    }
  }
};

// Exportar para uso em outros arquivos
window.API = API;
