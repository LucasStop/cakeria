const API = {
  BASE_URL: 'http://localhost:3001/api',

  async get(endpoint) {
    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`);
      if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Erro na API (GET ${endpoint}):`, error);
      throw error;
    }
  },

  async post(endpoint, data) {
    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      if (!response.ok)
        throw new Error(responseData.message || `Erro na requisição: ${response.status}`);

      return responseData;
    } catch (error) {
      console.error(`Erro na API (POST ${endpoint}):`, error);
      throw error;
    }
  },

  produtos: {
    listar: async () => API.get('/products'),
    obterPorId: async id => API.get(`/products/${id}`),
    obterPorCategoria: async categoriaId => API.get(`/products/category/${categoriaId}`),
  },

  categorias: {
    listar: async () => API.get('/categories'),
  },

  auth: {
    login: async credentials => API.post('/auth/login', credentials),
    registro: async userData => API.post('/auth/register', userData),
  },
};
