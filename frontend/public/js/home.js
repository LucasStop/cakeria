document.addEventListener('DOMContentLoaded', () => {
  protectPage();

  const user = getCurrentUser();

  updateUserDisplay(user);

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  setupTabsEventListeners();
  loadDashboardData();

  // Inicializa os estados dos botões de favoritos
  initializeFavoriteButtons();

  // Configura atualizações automáticas de dados
  setupAutoRefresh();
});

function updateUserDisplay(user) {
  if (!user) return;

  const usernameElement = document.getElementById('username');
  if (usernameElement) {
    usernameElement.textContent = user.name || user.email;
  }

  const avatarInitial = document.querySelector('.avatar-initial');
  if (avatarInitial && user.name) {
    const nameParts = user.name.split(' ');
    let initials = nameParts[0][0];

    if (nameParts.length > 1) {
      initials += nameParts[nameParts.length - 1][0];
    }

    avatarInitial.textContent = initials.toUpperCase();
  } else if (avatarInitial && user.email) {
    avatarInitial.textContent = user.email[0].toUpperCase();
  }
}

function setupTabsEventListeners() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');

      // Desativa todos os botões e conteúdos
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Ativa o botão e conteúdo clicado
      button.classList.add('active');
      document.getElementById(tabId).classList.add('active');

      // Carrega dados específicos da aba se necessário
      if (tabId === 'favoritas') {
        loadFavoriteRecipes();
      } else if (tabId === 'rascunhos') {
        loadDraftRecipes();
      } else if (tabId === 'feitas') {
        loadMadeRecipes();
      }
    });
  });
}

async function loadDashboardData() {
  try {
    await Promise.all([loadFeaturedRecipes(), loadUserOrders(), loadPublishedRecipes()]);
  } catch (error) {
    console.error('Erro ao carregar dados da dashboard:', error);
    showErrorNotification('Erro ao carregar dados da dashboard');
  }
}

/**
 * Carrega receitas em destaque da API
 */
async function loadFeaturedRecipes() {
  try {
    const recipesGrid = document.querySelector('#receitas .receitas-grid');
    if (!recipesGrid) return;

    // Exibe indicador de carregamento
    recipesGrid.innerHTML =
      '<div class="loading-indicator"><div class="spinner"></div><p>Carregando receitas...</p></div>';

    // Verificação de cache com try/catch para evitar erros de parsing
    let recipes;
    try {
      const cachedData = localStorage.getItem('featuredRecipesCache');
      const cacheTimestamp = localStorage.getItem('featuredRecipesCacheTime');
      const now = new Date().getTime();
      const cacheLifetime = 5 * 60 * 1000; // 5 minutos

      if (cachedData && cacheTimestamp && now - parseInt(cacheTimestamp) < cacheLifetime) {
        recipes = JSON.parse(cachedData);
        console.log('Usando dados em cache para receitas em destaque');
      }
    } catch (cacheError) {
      console.warn('Erro ao usar cache de receitas:', cacheError);
    }

    // Se não tiver cache válido, busca da API
    if (!recipes) {
      recipes = await API.request('/recipe', { method: 'GET' });

      // Armazena em cache apenas se obtiver dados válidos
      if (recipes && Array.isArray(recipes)) {
        try {
          localStorage.setItem('featuredRecipesCache', JSON.stringify(recipes));
          localStorage.setItem('featuredRecipesCacheTime', new Date().getTime().toString());
        } catch (storageError) {
          console.warn('Erro ao armazenar cache:', storageError);
        }
      }
    }

    if (!recipes || !Array.isArray(recipes) || recipes.length === 0) {
      recipesGrid.innerHTML =
        '<div class="empty-state"><p>Nenhuma receita encontrada no momento.</p><button class="btn btn-primary mt-3" onclick="loadFeaturedRecipes()">Tentar Novamente</button></div>';
      return;
    }

    // Ordena por visualizações e seleciona as 3 mais populares
    const featuredRecipes = recipes.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3);

    // Renderiza as receitas
    const recipesHTML = featuredRecipes
      .map(recipe => {
        const imageUrl = recipe.image
          ? `${API.BASE_URL}/recipe/${recipe.id}/image`
          : '/assets/placeholder.jpg';
        const difficultyText = recipe.difficulty || 'Médio';
        const prepTime = recipe.prepTime || '40';
        const isPopular = recipe.views > 10;

        return `
        <div class="receita-card" data-recipe-id="${recipe.id}">
          <div class="receita-img">
            <img src="${imageUrl}" alt="${recipe.title}" onerror="this.src='/assets/placeholder.jpg'"/>
            ${isPopular ? '<span class="receita-badge">Popular</span>' : ''}
          </div>
          <div class="receita-content">
            <h3>${recipe.title}</h3>
            <div class="receita-meta">
              <span><i class="fas fa-clock"></i> ${prepTime} min</span>
              <span><i class="fas fa-signal"></i> ${difficultyText}</span>
              ${recipe.views ? `<span><i class="fas fa-eye"></i> ${recipe.views}</span>` : ''}
            </div>
            <p>${recipe.description ? recipe.description.substring(0, 80) + '...' : 'Sem descrição'}</p>
            <div class="receita-actions">
              <a href="/receita.html?id=${recipe.id}" class="btn btn-primary">Ver Receita</a>
              <button class="btn-icon" title="Adicionar aos favoritos" onclick="toggleFavoriteRecipe(${recipe.id}, this)">
                <i class="fas fa-heart"></i>
              </button>
              <button class="btn-icon" title="Compartilhar" onclick="shareRecipe(${recipe.id})">
                <i class="fas fa-share-alt"></i>
              </button>
            </div>
          </div>
        </div>
      `;
      })
      .join('');

    recipesGrid.innerHTML = recipesHTML;

    // Inicializa os estados dos botões de favoritos após renderizar
    initializeFavoriteButtons();
  } catch (error) {
    handleRecipeApiError(error, document.querySelector('#receitas .receitas-grid'));
  }
}

/**
 * Carrega os pedidos do usuário
 */
async function loadUserOrders() {
  try {
    const user = getCurrentUser();
    if (!user || !user.id) return;

    const orderList = document.querySelector('.order-list');
    const pedidosStatus = document.querySelector('.pedidos-status');

    if (!orderList || !pedidosStatus) return;

    // Exibe indicador de carregamento
    orderList.innerHTML =
      '<div class="loading-indicator"><div class="spinner"></div><p>Carregando pedidos...</p></div>';

    // Verifica se há dados em cache e se ainda são válidos (menos de 5 minutos)
    let orders;
    try {
      const cachedData = localStorage.getItem('userOrdersCache');
      const cacheTimestamp = localStorage.getItem('userOrdersCacheTime');
      const now = new Date().getTime();
      const cacheLifetime = 5 * 60 * 1000; // 5 minutos em milissegundos

      // Se temos cache válido, use-o
      if (cachedData && cacheTimestamp && now - parseInt(cacheTimestamp) < cacheLifetime) {
        orders = JSON.parse(cachedData);
        console.log('Usando dados em cache para pedidos do usuário');
      }
    } catch (cacheError) {
      console.warn('Erro ao utilizar cache de pedidos:', cacheError);
    }

    // Se não tiver cache válido, busca da API
    if (!orders) {
      const token = localStorage.getItem('token');
      orders = await API.request(`/order/user/${user.id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Armazena em cache apenas se obtiver dados válidos
      if (orders && Array.isArray(orders)) {
        try {
          localStorage.setItem('userOrdersCache', JSON.stringify(orders));
          localStorage.setItem('userOrdersCacheTime', new Date().getTime().toString());
        } catch (storageError) {
          console.warn('Erro ao armazenar cache de pedidos:', storageError);
        }
      }
    }

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      orderList.innerHTML =
        '<div class="empty-state"><div class="empty-icon"><i class="fas fa-shopping-bag"></i></div><h3>Nenhum pedido encontrado</h3><p>Você ainda não tem pedidos.</p><a href="/produtos.html" class="btn btn-primary">Fazer Pedido</a></div>';

      // Atualiza contadores de status
      updateOrderStatusCounts({
        pending: 0,
        processing: 0,
        delivered: 0,
      });

      return;
    }

    // Conta pedidos por status
    const statusCounts = {
      pending: 0,
      processing: 0,
      delivered: 0,
    };

    orders.forEach(order => {
      if (order.status === 'pending') statusCounts.pending++;
      else if (['processing', 'shipping'].includes(order.status)) statusCounts.processing++;
      else if (order.status === 'delivered') statusCounts.delivered++;
    });

    // Atualiza contadores na UI
    updateOrderStatusCounts(statusCounts);

    // Ordenar os pedidos (mais recentes primeiro)
    const sortedOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Limita a exibição para os 3 pedidos mais recentes
    const recentOrders = sortedOrders.slice(0, 3);

    // Renderiza os pedidos
    const ordersHTML = recentOrders
      .map(order => {
        const orderDate = new Date(order.createdAt).toLocaleDateString('pt-BR');
        const deliveryDate =
          order.status === 'delivered'
            ? `Entregue em: ${new Date(order.updatedAt).toLocaleDateString('pt-BR')}`
            : `Entrega: ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('pt-BR') : 'A confirmar'}`;

        // Pega o primeiro produto do pedido para mostrar como imagem
        const firstProduct = order.product && order.product.length > 0 ? order.product[0] : null;
        const productName = firstProduct ? firstProduct.name : 'Produto';
        const productImage =
          firstProduct && firstProduct.id
            ? `${API.BASE_URL}/product/image/${firstProduct.id}`
            : '/assets/placeholder.jpg';

        // Define classe e texto baseado no status
        let statusClass, statusText;
        switch (order.status) {
          case 'pending':
            statusClass = 'pending';
            statusText = 'Pendente';
            break;
          case 'processing':
            statusClass = 'processing';
            statusText = 'Em Preparo';
            break;
          case 'shipping':
            statusClass = 'processing';
            statusText = 'Em Trânsito';
            break;
          case 'delivered':
            statusClass = 'delivered';
            statusText = 'Entregue';
            break;
          default:
            statusClass = 'pending';
            statusText = 'Processando';
        }

        return `
        <div class="order-item">
          <div class="order-img">
            <img src="${productImage}" alt="${productName}" onerror="this.src='/assets/placeholder.jpg'"/>
          </div>
          <div class="order-details">
            <h4>${productName}${order.product && order.product.length > 1 ? ` + ${order.product.length - 1} itens` : ''}</h4>
            <p class="order-date">Pedido em: ${orderDate}</p>
            <p class="order-id">Pedido #${order.id}</p>
          </div>
          <div class="order-status">
            <span class="status-badge ${statusClass}">${statusText}</span>
            <p class="delivery-date">${deliveryDate}</p>
          </div>
          <div class="order-actions">
            <a href="/pedido.html?id=${order.id}" class="btn btn-sm btn-outline">Detalhes</a>
            ${order.status === 'delivered' ? '<button class="btn btn-sm btn-primary" onclick="reorderItems(' + order.id + ')">Pedir Novamente</button>' : ''}
          </div>
        </div>
      `;
      })
      .join('');

    orderList.innerHTML = ordersHTML;

    // Adiciona link para ver todos os pedidos se houver mais que 3
    if (orders.length > 3) {
      orderList.innerHTML += `
        <div class="view-all-link">
          <a href="/pedidos.html" class="btn btn-link">Ver todos os ${orders.length} pedidos <i class="fas fa-arrow-right"></i></a>
        </div>`;
    }
  } catch (error) {
    handleOrderApiError(error, document.querySelector('.order-list'));
  }
}

/**
 * Atualiza os contadores de status de pedido na UI
 */
function updateOrderStatusCounts(counts) {
  const pendingCount = document.querySelector('.status-icon.pending + .status-info .status-count');
  const processingCount = document.querySelector(
    '.status-icon.processing + .status-info .status-count'
  );
  const deliveredCount = document.querySelector(
    '.status-icon.delivered + .status-info .status-count'
  );

  if (pendingCount) pendingCount.textContent = counts.pending;
  if (processingCount) processingCount.textContent = counts.processing;
  if (deliveredCount) deliveredCount.textContent = counts.delivered;
}

/**
 * Carrega as receitas publicadas pelo usuário
 */
async function loadPublishedRecipes() {
  try {
    const user = getCurrentUser();
    if (!user || !user.id) return;

    const recipesGrid = document.querySelector('#publicadas .receitas-grid');

    if (!recipesGrid) return;

    // Exibe indicador de carregamento
    recipesGrid.innerHTML =
      '<div class="loading-indicator"><div class="spinner"></div><p>Carregando receitas...</p></div>';

    // Faz a requisição para a API filtrando pelo autor
    const recipes = await API.request(`/recipe/${user.id}`, {
      method: 'GET',
    });

    if (!recipes || !Array.isArray(recipes) || recipes.length === 0) {
      recipesGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-book-open"></i></div>
          <h3>Você ainda não publicou receitas</h3>
          <p>Compartilhe suas criações culinárias com a comunidade.</p>
          <a href="/compartilhar-receita.html" class="btn btn-primary">Publicar Receita</a>
        </div>
      `;
      return;
    }

    // Renderiza as receitas
    const recipesHTML = recipes
      .map(recipe => {
        const imageUrl = recipe.image
          ? `${API.BASE_URL}/recipe/${recipe.id}/image`
          : '/assets/placeholder.jpg';

        return `
        <div class="receita-card">
          <div class="receita-img">
            <img src="${imageUrl}" alt="${recipe.title}" onerror="this.src='/assets/placeholder.jpg'"/>
            ${recipe.views > 0 ? `<span class="receita-badge">${recipe.views} visualizações</span>` : ''}
          </div>
          <div class="receita-content">
            <h3>${recipe.title}</h3>
            <div class="receita-meta">
              <span><i class="fas fa-calendar"></i> ${new Date(recipe.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
            <p>${recipe.description.substring(0, 80)}...</p>
            <div class="receita-actions">
              <a href="/receita.html?id=${recipe.id}" class="btn btn-primary">Ver Receita</a>
              <a href="/compartilhar-receita.html?id=${recipe.id}" class="btn-icon" title="Editar">
                <i class="fas fa-edit"></i>
              </a>
            </div>
          </div>
        </div>
      `;
      })
      .join('');

    recipesGrid.innerHTML = recipesHTML;
  } catch (error) {
    console.error('Erro ao carregar receitas publicadas:', error);
    const recipesGrid = document.querySelector('#publicadas .receitas-grid');
    if (recipesGrid) {
      recipesGrid.innerHTML =
        '<div class="empty-state"><p>Erro ao carregar receitas. Tente novamente mais tarde.</p></div>';
    }
  }
}

/**
 * Carrega as receitas favoritas do usuário
 */
async function loadFavoriteRecipes() {
  try {
    const user = getCurrentUser();
    if (!user || !user.id) return;

    const favoritesTab = document.getElementById('favoritas');

    if (!favoritesTab) return;

    // Exibe indicador de carregamento
    favoritesTab.innerHTML =
      '<div class="loading-indicator"><div class="spinner"></div><p>Carregando favoritos...</p></div>';

    // Tenta buscar favoritos do usuário
    try {
      // Verifica se há implementação de favoritos na API
      const favorites = await API.request(`/user/${user.id}`, {
        method: 'GET',
      });

      if (favorites && Array.isArray(favorites) && favorites.length > 0) {
        // Renderiza a grade de receitas
        favoritesTab.innerHTML = `<div class="receitas-grid"></div>`;
        const recipesGrid = favoritesTab.querySelector('.receitas-grid');

        // Renderiza as receitas
        const recipesHTML = favorites
          .map(recipe => {
            const imageUrl = recipe.image
              ? `${API.BASE_URL}/recipe/${recipe.id}/image`
              : '/assets/placeholder.jpg';
            const difficultyText = recipe.difficulty || 'Médio';
            const prepTime = recipe.prepTime || '40';

            return `
            <div class="receita-card">
              <div class="receita-img">
                <img src="${imageUrl}" alt="${recipe.title}" onerror="this.src='/assets/placeholder.jpg'"/>
                <span class="receita-badge favorite">Favorita</span>
              </div>
              <div class="receita-content">
                <h3>${recipe.title}</h3>
                <div class="receita-meta">
                  <span><i class="fas fa-clock"></i> ${prepTime} min</span>
                  <span><i class="fas fa-signal"></i> ${difficultyText}</span>
                </div>
                <p>${recipe.description.substring(0, 80)}...</p>
                <div class="receita-actions">
                  <a href="/receita.html?id=${recipe.id}" class="btn btn-primary">Ver Receita</a>
                  <button class="btn-icon btn-favorite active" title="Remover dos favoritos" onclick="toggleFavoriteRecipe(${recipe.id}, this)">
                    <i class="fas fa-heart"></i>
                  </button>
                  <button class="btn-icon" title="Compartilhar" onclick="shareRecipe(${recipe.id})">
                    <i class="fas fa-share-alt"></i>
                  </button>
                </div>
              </div>
            </div>
          `;
          })
          .join('');

        recipesGrid.innerHTML = recipesHTML;
        return;
      }
    } catch (error) {
      // Se a API não tiver implementação de favoritos, vamos usar os dados do localStorage
      console.log('API de favoritos não implementada, usando localStorage');
    }

    // Usando localStorage como fallback
    const storedFavorites = localStorage.getItem('favoriteRecipes');
    let favoriteIds = [];

    if (storedFavorites) {
      try {
        favoriteIds = JSON.parse(storedFavorites);
      } catch (e) {
        favoriteIds = [];
      }
    }

    if (favoriteIds.length > 0) {
      // Busca informações completas das receitas
      const recipes = await API.request('/recipe', { method: 'GET' });

      if (recipes && Array.isArray(recipes)) {
        // Filtra apenas as receitas favoritas
        const favoriteRecipes = recipes.filter(recipe => favoriteIds.includes(recipe.id));

        if (favoriteRecipes.length > 0) {
          // Renderiza a grade de receitas
          favoritesTab.innerHTML = `<div class="receitas-grid"></div>`;
          const recipesGrid = favoritesTab.querySelector('.receitas-grid');

          // Renderiza as receitas
          const recipesHTML = favoriteRecipes
            .map(recipe => {
              const imageUrl = recipe.image
                ? `${API.BASE_URL}/recipe/${recipe.id}/image`
                : '/assets/placeholder.jpg';
              const difficultyText = recipe.difficulty || 'Médio';
              const prepTime = recipe.prepTime || '40';

              return `
              <div class="receita-card">
                <div class="receita-img">
                  <img src="${imageUrl}" alt="${recipe.title}" onerror="this.src='/assets/placeholder.jpg'"/>
                  <span class="receita-badge favorite">Favorita</span>
                </div>
                <div class="receita-content">
                  <h3>${recipe.title}</h3>
                  <div class="receita-meta">
                    <span><i class="fas fa-clock"></i> ${prepTime} min</span>
                    <span><i class="fas fa-signal"></i> ${difficultyText}</span>
                  </div>
                  <p>${recipe.description.substring(0, 80)}...</p>
                  <div class="receita-actions">
                    <a href="/receita.html?id=${recipe.id}" class="btn btn-primary">Ver Receita</a>
                    <button class="btn-icon btn-favorite active" title="Remover dos favoritos" onclick="toggleFavoriteRecipe(${recipe.id}, this)">
                      <i class="fas fa-heart"></i>
                    </button>
                    <button class="btn-icon" title="Compartilhar" onclick="shareRecipe(${recipe.id})">
                      <i class="fas fa-share-alt"></i>
                    </button>
                  </div>
                </div>
              </div>
            `;
            })
            .join('');

          recipesGrid.innerHTML = recipesHTML;
          return;
        }
      }
    }

    // Se não houver favoritos
    favoritesTab.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fas fa-heart"></i></div>
        <h3>Nenhuma receita favorita</h3>
        <p>Adicione receitas aos favoritos para encontrá-las facilmente aqui.</p>
        <a href="/receitas.html" class="btn btn-primary">Explorar Receitas</a>
      </div>
    `;
  } catch (error) {
    handleRecipeApiError(error, document.getElementById('favoritas'));
  }
}

/**
 * Carrega as receitas em rascunho do usuário
 */
async function loadDraftRecipes() {
  try {
    const user = getCurrentUser();
    if (!user || !user.id) return;

    const draftsTab = document.getElementById('rascunhos');

    if (!draftsTab) return;

    // Exibe indicador de carregamento
    draftsTab.innerHTML =
      '<div class="loading-indicator"><div class="spinner"></div><p>Carregando rascunhos...</p></div>';

    // Faz a requisição para a API filtrando pelo autor e status
    const recipes = await API.request(`/recipe/${user.id}`, {
      method: 'GET',
    });

    if (!recipes || !Array.isArray(recipes) || recipes.length === 0) {
      draftsTab.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-file-alt"></i></div>
          <h3>Nenhum rascunho encontrado</h3>
          <p>Seus rascunhos de receitas aparecerão aqui.</p>
          <a href="/compartilhar-receita.html" class="btn btn-primary">Criar Nova Receita</a>
        </div>
      `;
      return;
    }

    // Renderiza a grade de receitas
    draftsTab.innerHTML = `<div class="receitas-grid"></div>`;
    const recipesGrid = draftsTab.querySelector('.receitas-grid');

    // Renderiza as receitas
    const recipesHTML = recipes
      .map(recipe => {
        const imageUrl = recipe.image
          ? `${API.BASE_URL}/recipe/${recipe.id}/image`
          : '/assets/placeholder.jpg';
        const updatedDate = new Date(recipe.updatedAt).toLocaleDateString('pt-BR');

        return `
        <div class="receita-card">
          <div class="receita-img">
            <img src="${imageUrl}" alt="${recipe.title}" onerror="this.src='/assets/placeholder.jpg'"/>
            <span class="receita-badge draft">Rascunho</span>
          </div>
          <div class="receita-content">
            <h3>${recipe.title}</h3>
            <div class="receita-meta">
              <span><i class="fas fa-calendar"></i> Atualizado em: ${updatedDate}</span>
            </div>
            <p>${recipe.description ? recipe.description.substring(0, 80) + '...' : 'Sem descrição'}</p>
            <div class="receita-actions">
              <a href="/compartilhar-receita.html?id=${recipe.id}" class="btn btn-primary">Continuar Editando</a>
              <button class="btn-icon" title="Publicar" onclick="publishRecipe(${recipe.id})">
                <i class="fas fa-upload"></i>
              </button>
            </div>
          </div>
        </div>
      `;
      })
      .join('');

    recipesGrid.innerHTML = recipesHTML;
  } catch (error) {
    console.error('Erro ao carregar rascunhos:', error);
    const draftsTab = document.getElementById('rascunhos');
    if (draftsTab) {
      draftsTab.innerHTML =
        '<div class="empty-state"><p>Erro ao carregar rascunhos. Tente novamente mais tarde.</p></div>';
    }
  }
}

/**
 * Carrega as receitas que o usuário marcou como feitas
 */
async function loadMadeRecipes() {
  try {
    const user = getCurrentUser();
    if (!user || !user.id) return;

    const madeTab = document.getElementById('feitas');

    if (!madeTab) return;

    // Exibe indicador de carregamento
    madeTab.innerHTML =
      '<div class="loading-indicator"><div class="spinner"></div><p>Carregando receitas...</p></div>';

    // Tenta buscar receitas feitas do usuário
    try {
      // Verifica se há implementação de receitas feitas na API
      const madeRecipes = await API.request(`/recipe/${user.id}`, {
        method: 'GET',
      });

      if (madeRecipes && Array.isArray(madeRecipes) && madeRecipes.length > 0) {
        // Renderiza a grade de receitas
        madeTab.innerHTML = `<div class="receitas-grid"></div>`;
        const recipesGrid = madeTab.querySelector('.receitas-grid');

        // Renderiza as receitas
        const recipesHTML = madeRecipes
          .map(recipe => {
            const imageUrl = recipe.image
              ? `${API.BASE_URL}/recipe/${recipe.id}/image`
              : '/assets/placeholder.jpg';
            const madeDate = new Date(
              recipe.madeDates && recipe.madeDates.length > 0
                ? recipe.madeDates[recipe.madeDates.length - 1]
                : new Date()
            ).toLocaleDateString('pt-BR');

            return `
            <div class="receita-card">
              <div class="receita-img">
                <img src="${imageUrl}" alt="${recipe.title}" onerror="this.src='/assets/placeholder.jpg'"/>
                <span class="receita-badge made">Feita</span>
              </div>
              <div class="receita-content">
                <h3>${recipe.title}</h3>
                <div class="receita-meta">
                  <span><i class="fas fa-check-circle"></i> Feita em: ${madeDate}</span>
                </div>
                <p>${recipe.description.substring(0, 80)}...</p>
                <div class="receita-actions">
                  <a href="/receita.html?id=${recipe.id}" class="btn btn-primary">Ver Receita</a>
                  <button class="btn-icon" title="Adicionar aos favoritos" onclick="toggleFavoriteRecipe(${recipe.id}, this)">
                    <i class="fas fa-heart"></i>
                  </button>
                  <button class="btn-icon" title="Compartilhar" onclick="shareRecipe(${recipe.id})">
                    <i class="fas fa-share-alt"></i>
                  </button>
                </div>
              </div>
            </div>
          `;
          })
          .join('');

        recipesGrid.innerHTML = recipesHTML;
        return;
      }
    } catch (error) {
      // Se a API não tiver implementação de receitas feitas, mostraremos um estado vazio
      console.log('API de receitas feitas não implementada', error);
    }

    // Se não houver receitas feitas ou API não estiver disponível
    madeTab.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fas fa-check-circle"></i></div>
        <h3>Nenhuma receita marcada como feita</h3>
        <p>Quando você marcar receitas como feitas, elas aparecerão aqui.</p>
        <a href="/receitas.html" class="btn btn-primary">Explorar Receitas</a>
      </div>
    `;
  } catch (error) {
    handleRecipeApiError(error, document.getElementById('feitas'));
  }
}

/**
 * Marca uma receita como feita pelo usuário
 * @param {number} recipeId - ID da receita
 */
async function markRecipeAsMade(recipeId) {
  try {
    const user = getCurrentUser();
    if (!user || !user.id) {
      if (window.Toast) {
        Toast.error('Você precisa estar logado para marcar receitas como feitas');
      }
      return;
    }

    // Tenta usar a API
    try {
      await API.request(`/recipe/${user.id}`, {
        method: 'POST',
      });

      if (window.Toast) {
        Toast.success('Receita marcada como feita!');
      }

      // Se estamos na aba de receitas feitas, recarregue-a
      const madeTab = document.getElementById('feitas');
      if (madeTab && madeTab.classList.contains('active')) {
        loadMadeRecipes();
      }

      return;
    } catch (error) {
      console.log('API de receitas feitas não implementada', error);

      if (window.Toast) {
        Toast.info('Funcionalidade de marcar receitas como feitas será implementada em breve!');
      }
    }
  } catch (error) {
    console.error('Erro ao marcar receita como feita:', error);

    if (window.Toast) {
      Toast.error('Erro ao processar sua solicitação. Tente novamente.');
    }
  }
}

/**
 * Função para alternar uma receita como favorita
 * @param {number} recipeId - ID da receita
 * @param {HTMLElement} button - Botão que foi clicado (opcional)
 */
async function toggleFavoriteRecipe(recipeId, button) {
  try {
    const user = getCurrentUser();
    if (!user || !user.id) {
      if (window.Toast) {
        Toast.error('Você precisa estar logado para favoritar receitas');
      }
      return;
    }

    // Tenta usar a API
    let apiSuccess = false;

    try {
      // Verifica se a receita está nos favoritos
      const favorites = await API.request(`/user/${user.id}/favorites`, {
        method: 'GET',
      });

      if (favorites && Array.isArray(favorites)) {
        const isFavorite = favorites.some(fav => fav.id === recipeId);

        if (isFavorite) {
          // Remove dos favoritos
          await API.request(`/user/${user.id}/favorites/${recipeId}`, {
            method: 'DELETE',
          });

          if (window.Toast) {
            Toast.success('Receita removida dos favoritos');
          }
        } else {
          // Adiciona aos favoritos
          await API.request(`/user/${user.id}/favorites/${recipeId}`, {
            method: 'POST',
          });

          if (window.Toast) {
            Toast.success('Receita adicionada aos favoritos');
          }
        }

        apiSuccess = true;

        // Atualiza visualmente o botão
        if (button) {
          if (isFavorite) {
            button.classList.remove('active');
            button.title = 'Adicionar aos favoritos';
          } else {
            button.classList.add('active');
            button.title = 'Remover dos favoritos';
          }
        }

        // Se estamos na aba de favoritos, recarregue-a
        const favoritesTab = document.getElementById('favoritas');
        if (favoritesTab && favoritesTab.classList.contains('active')) {
          loadFavoriteRecipes();
        }
      }
    } catch (error) {
      console.log('API de favoritos não implementada, usando localStorage', error);
    }

    // Se a API não funcionou, use localStorage como fallback
    if (!apiSuccess) {
      // Busca os favoritos armazenados localmente
      const storedFavorites = localStorage.getItem('favoriteRecipes');
      let favorites = [];

      if (storedFavorites) {
        try {
          favorites = JSON.parse(storedFavorites);
        } catch (e) {
          favorites = [];
        }
      }

      const index = favorites.indexOf(recipeId);
      const isFavorite = index !== -1;

      if (isFavorite) {
        // Remove dos favoritos
        favorites.splice(index, 1);
        localStorage.setItem('favoriteRecipes', JSON.stringify(favorites));

        if (window.Toast) {
          Toast.success('Receita removida dos favoritos');
        }

        // Atualiza visualmente o botão
        if (button) {
          button.classList.remove('active');
          button.title = 'Adicionar aos favoritos';
        }
      } else {
        // Adiciona aos favoritos
        favorites.push(recipeId);
        localStorage.setItem('favoriteRecipes', JSON.stringify(favorites));

        if (window.Toast) {
          Toast.success('Receita adicionada aos favoritos');
        }

        // Atualiza visualmente o botão
        if (button) {
          button.classList.add('active');
          button.title = 'Remover dos favoritos';
        }
      }

      // Se estamos na aba de favoritos, recarregue-a
      const favoritesTab = document.getElementById('favoritas');
      if (favoritesTab && favoritesTab.classList.contains('active')) {
        loadFavoriteRecipes();
      }
    }
  } catch (error) {
    console.error('Erro ao alternar favorito:', error);

    if (window.Toast) {
      Toast.error('Erro ao processar sua solicitação. Tente novamente.');
    }
  }
}

/**
 * Função para compartilhar uma receita
 */
function shareRecipe(recipeId) {
  // Implementação básica de compartilhamento
  const recipeUrl = `${window.location.origin}/receita.html?id=${recipeId}`;

  if (navigator.share) {
    navigator
      .share({
        title: 'Receita na Cakeria',
        text: 'Confira esta receita deliciosa!',
        url: recipeUrl,
      })
      .catch(error => console.error('Erro ao compartilhar:', error));
  } else {
    // Fallback para navegadores que não suportam a API Web Share
    const tempInput = document.createElement('input');
    document.body.appendChild(tempInput);
    tempInput.value = recipeUrl;
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);

    if (window.Toast) {
      Toast.success('Link da receita copiado para a área de transferência!');
    } else {
      alert('Link da receita copiado para a área de transferência!');
    }
  }
}

/**
 * Função para pedir novamente itens de um pedido anterior
 */
async function reorderItems(orderId) {
  try {
    if (window.Toast) {
      Toast.info('Adicionando itens ao carrinho...');
    }

    // Obter detalhes do pedido
    const order = await API.request(`/order/${orderId}`, {
      method: 'GET',
    });

    if (!order || !order.product || order.product.length === 0) {
      throw new Error('Pedido não encontrado ou sem produtos');
    }

    // Adicionar os produtos ao carrinho
    let cartItems = getCartItems();

    order.product.forEach(product => {
      const quantity = product.OrderProduct?.quantity || 1;

      // Verifica se o produto já está no carrinho
      const existingItem = cartItems.find(item => item.id === product.id);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cartItems.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: quantity,
          image: product.image ? `${API.BASE_URL}/product/image/${product.id}` : null,
        });
      }
    });

    // Salva o carrinho atualizado
    saveCartItems(cartItems);

    // Atualiza o contador de itens no carrinho
    updateCartCounter();

    if (window.Toast) {
      Toast.success('Itens adicionados ao carrinho!');
    }

    // Redireciona para o carrinho
    setTimeout(() => {
      window.location.href = '/carrinho.html';
    }, 1000);
  } catch (error) {
    console.error('Erro ao repetir pedido:', error);
    if (window.Toast) {
      Toast.error('Erro ao processar seu pedido. Tente novamente.');
    }
  }
}

/**
 * Obtém os itens do carrinho do localStorage
 */
function getCartItems() {
  const cartItems = localStorage.getItem('cartItems');
  return cartItems ? JSON.parse(cartItems) : [];
}

/**
 * Salva os itens do carrinho no localStorage
 */
function saveCartItems(cartItems) {
  localStorage.setItem('cartItems', JSON.stringify(cartItems));
}

/**
 * Atualiza o contador de itens no carrinho
 */
function updateCartCounter() {
  const cartCounter = document.querySelector('.cart-count');
  if (!cartCounter) return;

  const cartItems = getCartItems();
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  cartCounter.textContent = itemCount;
  cartCounter.style.display = itemCount > 0 ? 'flex' : 'none';
}

/**
 * Publica um rascunho de receita
 */
async function publishRecipe(recipeId) {
  try {
    if (window.Toast) {
      Toast.info('Publicando receita...');
    }

    await API.request(`/recipe/${recipeId}`, {
      method: 'PUT',
      body: {
        status: 'publicado',
      },
    });

    if (window.Toast) {
      Toast.success('Receita publicada com sucesso!');
    }

    // Recarrega as abas para atualizar os dados
    loadPublishedRecipes();
    loadDraftRecipes();

    // Ativa a aba de receitas publicadas
    const publishedTab = document.querySelector('[data-tab="publicadas"]');
    if (publishedTab) {
      publishedTab.click();
    }
  } catch (error) {
    console.error('Erro ao publicar receita:', error);
    if (window.Toast) {
      Toast.error('Erro ao publicar receita. Tente novamente.');
    }
  }
}

/**
 * Exibe uma notificação de erro
 */
function showErrorNotification(message) {
  if (window.Toast) {
    Toast.error(message);
  } else {
    console.error(message);
  }
}

/**
 * Trata erros específicos de API de receitas
 * @param {Error} error - O erro capturado
 * @param {HTMLElement} container - Elemento onde mostrar o erro
 */
function handleRecipeApiError(error, container) {
  console.error('Erro na API de receitas:', error);

  if (!container) return;

  let errorMessage = 'Erro ao carregar receitas. Tente novamente mais tarde.';

  // Verifica se é um erro de conexão
  if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
    errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
  }
  // Verifica se é um erro de autorização
  else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
    setTimeout(() => {
      logout();
    }, 3000);
  }

  container.innerHTML = `<div class="empty-state">
    <div class="empty-icon"><i class="fas fa-exclamation-circle"></i></div>
    <p>${errorMessage}</p>
    <button class="btn btn-primary" onclick="window.location.reload()">Tentar Novamente</button>
  </div>`;

  if (window.Toast) {
    Toast.error(errorMessage);
  }
}

/**
 * Trata erros específicos de API de pedidos
 * @param {Error} error - O erro capturado
 * @param {HTMLElement} container - Elemento onde mostrar o erro
 */
function handleOrderApiError(error, container) {
  console.error('Erro na API de pedidos:', error);

  if (!container) return;

  let errorMessage = 'Erro ao carregar pedidos. Tente novamente mais tarde.';

  // Verifica se é um erro de conexão
  if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
    errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
  }
  // Verifica se é um erro de autorização
  else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
    setTimeout(() => {
      logout();
    }, 3000);
  }

  container.innerHTML = `<div class="empty-state">
    <div class="empty-icon"><i class="fas fa-exclamation-circle"></i></div>
    <p>${errorMessage}</p>
    <button class="btn btn-primary" onclick="window.location.reload()">Tentar Novamente</button>
  </div>`;

  if (window.Toast) {
    Toast.error(errorMessage);
  }
}

/**
 * Configura atualizações automáticas de dados para componentes críticos
 */
function setupAutoRefresh() {
  // Verifica e atualiza pedidos a cada 2 minutos (120000ms)
  setInterval(() => {
    // Apenas atualiza se o usuário estiver na página
    if (document.visibilityState === 'visible') {
      const ordersList = document.querySelector('.order-list');
      if (ordersList) {
        // Limpa cache de pedidos para forçar recarga
        localStorage.removeItem('userOrdersCache');
        localStorage.removeItem('userOrdersCacheTime');
        loadUserOrders();
        console.log('Atualizando pedidos automaticamente...');
      }
    }
  }, 120000);

  // Escuta eventos de visibilidade da página
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Quando usuário volta à página, recarrega dados que podem ter mudado
      console.log('Usuário voltou à página, atualizando dados...');
      loadUserOrders();
    }
  });
}

/**
 * Inicializa os estados dos botões de favoritos com base nos dados salvos
 */
function initializeFavoriteButtons() {
  // Busca os favoritos armazenados localmente
  const storedFavorites = localStorage.getItem('favoriteRecipes');
  if (!storedFavorites) return;

  try {
    const favorites = JSON.parse(storedFavorites);
    if (!Array.isArray(favorites) || favorites.length === 0) return;

    // Seleciona todos os botões de favorito
    const favoriteButtons = document.querySelectorAll('.btn-icon[title="Adicionar aos favoritos"]');

    favoriteButtons.forEach(button => {
      // Extrai o ID da receita do evento onclick
      const onclickAttr = button.getAttribute('onclick');
      if (!onclickAttr || !onclickAttr.includes('toggleFavoriteRecipe')) return;

      const recipeIdMatch = onclickAttr.match(/toggleFavoriteRecipe\((\d+)/);
      if (!recipeIdMatch || !recipeIdMatch[1]) return;

      const recipeId = parseInt(recipeIdMatch[1]);

      // Verifica se a receita está nos favoritos
      if (favorites.includes(recipeId)) {
        button.classList.add('active');
        button.title = 'Remover dos favoritos';
      }
    });
  } catch (e) {
    console.error('Erro ao inicializar botões de favoritos:', e);
  }
}
