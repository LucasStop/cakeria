const API = {
  BASE_URL: 'http://localhost:3001/api',
  async request(endpoint, options = {}) {
    try {
      const token = localStorage.getItem('token');
      if (
        token &&
        this.isTokenExpired() &&
        endpoint !== '/auth/login' &&
        endpoint !== '/auth/refresh'
      ) {
        this.clearSession();

        if (window.Toast) {
          Toast.error('Sua sessão expirou. Por favor, faça login novamente.', {
            position: 'bottom-right',
            duration: 5000,
          });
        }

        window.location.href = '/login.html?expired=true';
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }
      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        };
      }

      if (options.body && !(options.body instanceof FormData)) {
        options.headers = {
          ...options.headers,
          'Content-Type': 'application/json',
        };
        options.body = JSON.stringify(options.body);
      }

      const response = await fetch(`${this.BASE_URL}${endpoint}`, options);

      if (response.status === 204) {
        return true;
      }

      if (response.status === 401) {
        const errorData = await response.json();
        if (errorData.message.includes('expirado') || errorData.message.includes('inválido')) {
          this.clearSession();
          window.location.href = '/login.html';
        }
        throw new Error(errorData.message || `Erro ${response.status}`);
      }

      if (!response.ok) {
        const errorData = await response.json();

        if (window.Toast) {
          Toast.error(errorData.message || `Erro ${response.status}`, {
            duration: 5000,
            position: 'bottom-right',
          });
        }

        throw new Error(errorData.message || `Erro ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  isTokenExpired() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp < currentTime;

      return isExpired;
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return false;
    }
  },
  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('justLoggedIn');
  },

  async refreshToken() {
    try {
      const response = await this.request('/auth/refresh', {
        method: 'POST',
      });

      if (response && response.token) {
        localStorage.setItem('token', response.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return false;
    }
  },

  startExpirationChecker() {
    if (this.expirationCheckerId) {
      clearInterval(this.expirationCheckerId);
    }

    const token = localStorage.getItem('token');

    this.expirationCheckerId = setInterval(() => {
      const publicPages = ['/login.html', '/registro.html', '/index.html', '/'];
      const currentPath = window.location.pathname;

      const isPublicPage = publicPages.some(
        page => currentPath === page || currentPath.endsWith(page)
      );

      if (isPublicPage) {
        return;
      }

      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        this.stopExpirationChecker();
        return;
      }

      if (this.isTokenExpired()) {
        this.stopExpirationChecker();

        if (window.Toast) {
          Toast.error('Sua sessão expirou. Por favor, faça login novamente.', {
            position: 'bottom-right',
            duration: 6000,
          });
        } else {
        }

        this.clearSession();
        window.location.href = '/login.html?expired=true';
      }
    }, 30000);
  },

  stopExpirationChecker() {
    if (this.expirationCheckerId) {
      clearInterval(this.expirationCheckerId);
      this.expirationCheckerId = null;
    }
  },

  User: {
    get(userId) {
      return API.request(`/user/${userId}`);
    },
    update(userId, userData) {
      return API.request(`/user/${userId}`, {
        method: 'PUT',
        body: userData,
      });
    },
    changePassword(userId, passwordData) {
      return API.request(`/user/${userId}/password`, {
        method: 'PUT',
        body: passwordData,
      });
    },
    delete(userId) {
      return API.request(`/user/${userId}`, {
        method: 'DELETE',
      });
    },
  },

  Address: {
    getByUser(userId) {
      return API.request(`/address/user/${userId}`);
    },
    create(addressData) {
      return API.request(`/address`, {
        method: 'POST',
        body: addressData,
      });
    },
    update(addressId, addressData) {
      return API.request(`/address/${addressId}`, {
        method: 'PUT',
        body: addressData,
      });
    },
    delete(addressId) {
      return API.request(`/address/${addressId}`, {
        method: 'DELETE',
      });
    },
  },

  get(endpoint) {
    return this.request(endpoint);
  },

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
    });
  },

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
    });
  },

  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  },
};

if (!API.BASE_URL) {
  API.BASE_URL = 'http://localhost:3001/api';
}

const PRODUCT_ENDPOINTS = ['/product'];

API.produtos = {
  listar: async function () {
    let errors = [];

    for (const endpoint of PRODUCT_ENDPOINTS) {
      try {
        const response = await fetch(`${API.BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          const error = new Error(`Erro HTTP: ${response.status}`);
          error.status = response.status;
          errors.push({ endpoint, error });
          continue;
        }

        const data = await response.json();

        API.produtos.ENDPOINT = endpoint;

        if (Array.isArray(data)) {
          return data;
        } else if (typeof data === 'object' && data !== null) {
          if (data.produtos && Array.isArray(data.produtos)) return data.produtos;
          if (data.products && Array.isArray(data.products)) return data.products;
          if (data.data && Array.isArray(data.data)) return data.data;
          if (data.items && Array.isArray(data.items)) return data.items;
          if (data.results && Array.isArray(data.results)) return data.results;

          if (Object.keys(data).length > 0) return [data];
        }

        console.warn(`API.produtos.listar: Formato desconhecido recebido de ${endpoint}:`, data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error(`API.produtos.listar: Erro ao acessar ${endpoint}:`, error.message);
        errors.push({ endpoint, error });
      }
    }

    console.error('API.produtos.listar: Todos os endpoints falharam:', errors);

    try {
      const healthCheck = await fetch(`${API.BASE_URL}/health`).catch(e => ({
        ok: false,
        error: e,
      }));
    } catch (e) {
      console.error('API health check falhou:', e);
    }

    try {
      const rootResponse = await fetch(API.BASE_URL).catch(e => ({ ok: false, error: e }));
      if (rootResponse.ok) {
        const rootData = await rootResponse.text();
      }
    } catch (e) {
      console.error('Falha ao acessar raiz da API:', e);
    }

    return [
      {
        id: 1,
        name: 'Bolo de Chocolate',
        price: 45.9,
        description: 'Delicioso bolo de chocolate com cobertura especial',
        image_id: 'placeholder.png',
      },
      {
        id: 2,
        name: 'Torta de Morango',
        price: 38.5,
        description: 'Torta fresca com morangos da estação',
        image_id: 'placeholder.png',
      },
    ];
  },

  obterPorId: async function (id) {
    const endpoint = API.produtos.ENDPOINT || '/produtos';
    try {
      const response = await fetch(`${API.BASE_URL}${endpoint}/${id}`);
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Erro ao obter produto ${id}:`, error);
      throw error;
    }
  },

  obterPorCategoria: async function (categoriaId) {
    const endpoint = API.produtos.ENDPOINT || '/produtos';
    try {
      const response = await fetch(`${API.BASE_URL}${endpoint}?category=${categoriaId}`);
      if (!response.ok) {
        const altResponse = await fetch(`${API.BASE_URL}/category/${categoriaId}/product`);
        if (!altResponse.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        return await altResponse.json();
      }
      return await response.json();
    } catch (error) {
      console.error(`Erro ao obter produtos da categoria ${categoriaId}:`, error);
      throw error;
    }
  },
};

API.testarEndpoints = async function () {
  const endpoints = [
    '/produtos',
    '/products',
    '/product',
    '/category',
    '/categorias',
    '/receitas',
    '/recipes',
  ];

  const resultados = {};

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API.BASE_URL}${endpoint}`);
      resultados[endpoint] = {
        status: response.status,
        ok: response.ok,
      };

      if (response.ok) {
        try {
          const data = await response.json();
          resultados[endpoint].data = Array.isArray(data)
            ? `Array com ${data.length} itens`
            : 'Objeto: ' + JSON.stringify(data).substring(0, 100) + '...';
        } catch (e) {
          resultados[endpoint].erro = 'Não é JSON válido';
        }
      }
    } catch (error) {
      resultados[endpoint] = {
        erro: error.message,
      };
    }
  }

  console.table(resultados);
  return resultados;
};

window.API = API;

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('logout')) {
    return;
  }

  const token = localStorage.getItem('token');

  const publicPages = ['/login.html', '/registro.html', '/index.html', '/'];
  const currentPath = window.location.pathname;

  const isPublicPage = publicPages.some(page => currentPath === page || currentPath.endsWith(page));

  if (!isPublicPage && token) {
    API.startExpirationChecker();
  }
});
