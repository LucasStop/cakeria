// API Helper for interacting with the backend

const API = {
  BASE_URL: 'http://localhost:3001/api',  async request(endpoint, options = {}) {
    try {
      const token = localStorage.getItem('token');
      // Verificar se o token existe e se está expirado (apenas para endpoints que exigem autenticação)
      if (token && this.isTokenExpired() && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
        console.log('Token expirado, redirecionando para login...');
        this.clearSession();

        if (window.Toast) {
          Toast.error('Sua sessão expirou. Por favor, faça login novamente.', {
            position: 'top-center',
            duration: 5000
          });
        } else {
          alert('Sua sessão expirou. Por favor, faça login novamente.');
        }

        window.location.href = '/login.html?expired=true';
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }
      if (token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        };
      }

      if (options.body && !(options.body instanceof FormData)) {
        options.headers = {
          ...options.headers,
          'Content-Type': 'application/json'
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
            position: 'bottom-right'
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
    // Se não há token, considerar que não está "expirado" para não exibir mensagem de expiração
    // Isso é diferente de estar autenticado, pois isAuthenticated() ainda retornará false
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp < currentTime;

      if (isExpired) {
        console.log('Token expirado:', {
          expiração: new Date(payload.exp * 1000).toLocaleString(),
          agora: new Date().toLocaleString()
        });
      }

      return isExpired;
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return false; // Em caso de erro, não considerar expirado
    }
  },
  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('justLoggedIn');
    console.log('Sessão limpa');
  },

  async refreshToken() {
    try {
      console.log('Tentando renovar o token...');
      const response = await this.request('/auth/refresh', {
        method: 'POST',
      });

      if (response && response.token) {
        localStorage.setItem('token', response.token);
        console.log('Token renovado com sucesso!');
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

    // Verificar se há token antes de iniciar o verificador
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('Sem token, verificador de expiração não será iniciado.');
      return;
    }

    this.expirationCheckerId = setInterval(() => {
      // Não verificar em páginas públicas ou de login
      const publicPages = ['/login.html', '/registro.html', '/index.html', '/'];
      const currentPath = window.location.pathname;
      
      const isPublicPage = publicPages.some(page => 
        currentPath === page || currentPath.endsWith(page)
      );
      
      if (isPublicPage) {
        return;
      }

      // Verificar se o token ainda existe e não foi removido manualmente (por exemplo, via logout)
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        this.stopExpirationChecker();
        return;
      }

      if (this.isTokenExpired()) {
        this.stopExpirationChecker();
        
        if (window.Toast) {
          Toast.error('Sua sessão expirou. Por favor, faça login novamente.', {
            position: 'top-center',
            duration: 6000
          });
        } else {
          alert('Sua sessão expirou. Por favor, faça login novamente.');
        }
        
        this.clearSession();
        window.location.href = '/login.html?expired=true';
      }
    }, 30000); 

    console.log('Verificador de expiração de token iniciado.');
  },

  stopExpirationChecker() {
    if (this.expirationCheckerId) {
      clearInterval(this.expirationCheckerId);
      this.expirationCheckerId = null;
      console.log('Verificador de expiração de token parado.');
    }
  },

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

  get(endpoint) {
    return this.request(endpoint);
  },

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data
    });
  },

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data
    });
  },

  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  },

};

window.API = API;

document.addEventListener('DOMContentLoaded', () => {
  // Verificar se o usuário está deslogado após uma ação explícita de logout
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('logout')) {
    // Não iniciar o verificador se o usuário acabou de fazer logout
    console.log('Usuário acabou de fazer logout, não verificando expiração');
    return;
  }
  
  // Obter token atual
  const token = localStorage.getItem('token');
  
  // Não iniciar o verificador na página de login, páginas públicas ou quando não há token
  const publicPages = ['/login.html', '/registro.html', '/index.html', '/'];
  const currentPath = window.location.pathname;
  
  const isPublicPage = publicPages.some(page => 
    currentPath === page || currentPath.endsWith(page)
  );
  
  if (!isPublicPage && token) {
    API.startExpirationChecker();
  }
});
