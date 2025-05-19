const API_URL = 'http://localhost:3001/api';

let produtos = [];
let categorias = [];

// Variáveis globais para filtros
let filtroAtual = {
  nome: '',
  categoria: '',
  precoMin: '',
  precoMax: '',
  validade: ''
};

const contentEl = document.getElementById('content');
const produtosContainer = document.getElementById('produtos-container');
const categoriasContainer = document.getElementById('categorias-container');
const verProdutosBtn = document.getElementById('ver-produtos');
// const navRegiterProduct = document.getElementById('nav-register-product');
const navCategorias = document.getElementById('nav-categorias');
const navAdmin = document.getElementById('nav-admin');

window.navegarParaCategorias = navegarParaCategorias;
window.navegarParaLogin = navegarParaLogin;
window.navegarParaRegistro = navegarParaRegistro;
window.navegarParaSobre = navegarParaSobre;
window.navegarParaCompartilharReceitas = navegarParaCompartilharReceitas;
window.navegarParaAdmin = navegarParaAdmin;
window.navegarParaCadastrarProdutos = navegarParaCadastrarProdutos;
window.navegarParaProdutos = navegarParaProdutos;
window.navegarParaHome = navegarParaHome;

document.addEventListener('DOMContentLoaded', iniciarAplicacao);
if (verProdutosBtn) verProdutosBtn.addEventListener('click', navegarParaProdutos);
if (navProdutos)
  navProdutos.addEventListener('click', e => {
    e.preventDefault();
    navegarParaProdutos();
  });
if (navCategorias)
  navCategorias.addEventListener('click', e => {
    e.preventDefault();
    navegarParaCategorias();
  });

async function iniciarAplicacao() {
  await Promise.all([carregarProdutosDestaque(), carregarCategorias()]);

  Navigation.handleNavigation();
}

async function carregarProdutosDestaque() {
  try {
    produtos = await API.produtos.listar();
    renderizarProdutosDestaque(produtos.slice(0, 3));
  } catch (error) {
    if (produtosContainer) {
      produtosContainer.innerHTML =
        '<p class="error">Erro ao carregar produtos. Tente novamente mais tarde.</p>';
    }
  }
}

async function carregarCategorias() {
  try {
    categorias = await API.categorias.listar();
    renderizarCategorias(categorias);
  } catch (error) {
    if (categoriasContainer) {
      categoriasContainer.innerHTML =
        '<p class="error">Erro ao carregar categorias. Tente novamente mais tarde.</p>';
    }
  }
}

async function carregarDetalhesProduto(id) {
  try {
    const produto = await API.produtos.obterPorId(id);
    renderizarDetalhesProduto(produto);
  } catch (error) {
    if (contentEl) {
      contentEl.innerHTML =
        '<p class="error">Erro ao carregar detalhes do produto. Tente novamente mais tarde.</p>';
    }
  }
}

function renderizarDetalhesProduto(produto) {
  const imageUrl = window.ImageHelper ? 
    window.ImageHelper.getProductImageUrl(produto.id) : 
    `${API.BASE_URL}/products/image/${produto.id}`;

  contentEl.innerHTML = `
    <div class="produto-detalhes">
      <div class="produto-imagem">
        <img src="${imageUrl}" alt="${produto.name}" onerror="this.onerror=null; this.src='/assets/default-product.png';">
      </div>
      <div class="produto-info">
        <h1>${produto.name}</h1>
        <p class="produto-preco">R$ ${formatarPreco(produto.price)}</p>
        <p class="produto-descricao">${produto.description}</p>
        <div class="produto-meta">
          <span class="produto-tamanho"><strong>Tamanho:</strong> ${produto.size || 'Não informado'}</span>
          <span class="produto-estoque"><strong>Estoque:</strong> ${produto.stock} unidades</span>
        </div>
        <div class="produto-acoes">
          <button class="btn btn-primary" id="adicionar-carrinho" data-id="${produto.id}">
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  `;

  currentPage = "produto";
  window.history.pushState({}, "", `/produtos/${produto.id}`);
}

function renderizarCategorias(categoriasList) {
  if (!categoriasContainer) return;

  if (categoriasList.length === 0) {
    categoriasContainer.innerHTML = '<p>Nenhuma categoria encontrada</p>';
    return;
  }

  const html = categoriasList
    .map(
      categoria => `
    <div class="category-card">
      <h3>${categoria.name}</h3>
      <p>${categoria.description || 'Sem descrição'}</p>
      <button class="btn btn-outline" onclick="verProdutosPorCategoria(${
        categoria.id
      })">Ver Produtos</button>
    </div>
  `
    )
    .join('');

  categoriasContainer.innerHTML = html;
}

// Inicializar filtros
function initializeFilters() {
  console.log('Inicializando sistema de filtros...');
  
  // Verificar se estamos na página certa e se os elementos existem
  const filterSection = document.querySelector('.filter-section');
  if (!filterSection) {
    console.warn('Seção de filtros não encontrada - pulando inicialização');
    return;
  }
  
  // Carregar categorias no filtro
  setTimeout(() => {
    carregarCategoriasFiltro();
  }, 500); // Pequeno atraso para garantir que a API esteja pronta
  
  // Configurar event listeners para os filtros
  const nameFilter = document.getElementById('filter-name');
  if (nameFilter) {
    nameFilter.addEventListener('input', function() {
      filtroAtual.nome = this.value.trim();
    });
    
    nameFilter.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        aplicarFiltros();
      }
    });
  }
  
  const categoryFilter = document.getElementById('filter-category');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', function() {
      filtroAtual.categoria = this.value;
    });
  }
  
  const minPriceFilter = document.getElementById('filter-min-price');
  if (minPriceFilter) {
    minPriceFilter.addEventListener('input', function() {
      filtroAtual.precoMin = this.value ? parseFloat(this.value) : '';
    });
  }
  
  const maxPriceFilter = document.getElementById('filter-max-price');
  if (maxPriceFilter) {
    maxPriceFilter.addEventListener('input', function() {
      filtroAtual.precoMax = this.value ? parseFloat(this.value) : '';
    });
  }
  
  const expiryFilter = document.getElementById('filter-expiry');
  if (expiryFilter) {
    expiryFilter.addEventListener('change', function() {
      filtroAtual.validade = this.value;
    });
  }
  
  const applyButton = document.getElementById('apply-filters');
  if (applyButton) {
    applyButton.addEventListener('click', aplicarFiltros);
  }
  
  const clearButton = document.getElementById('clear-filters');
  if (clearButton) {
    clearButton.addEventListener('click', limparFiltros);
  }
  
  const searchButton = document.getElementById('search-btn');
  if (searchButton) {
    searchButton.addEventListener('click', aplicarFiltros);
  }
}

// Carregar categorias para o filtro - versão aprimorada
async function carregarCategoriasFiltro() {
  console.log("Iniciando carregamento de categorias para o filtro...");
  const selectCategoria = document.getElementById('filter-category');
  if (!selectCategoria) {
    console.warn('Elemento select de categorias não encontrado');
    return;
  }
  
  // Limpar opções existentes, mantendo apenas a primeira (Todas as categorias)
  while (selectCategoria.options.length > 1) {
    selectCategoria.remove(1);
  }
  
  try {
    let categoriasList = [];
    
    // Abordagem 1: Usar categorias já carregadas na variável global
    if (window.categorias && Array.isArray(window.categorias) && window.categorias.length > 0) {
      console.log("Usando categorias da variável global:", window.categorias.length);
      categoriasList = window.categorias;
    } 
    // Abordagem 2: Carregar via API.categorias.listar
    else if (window.API && window.API.categorias && typeof window.API.categorias.listar === 'function') {
      console.log("Tentando carregar categorias via API.categorias.listar()");
      try {
        categoriasList = await window.API.categorias.listar();
        console.log("Categorias carregadas via API:", categoriasList.length);
      } catch (apiError) {
        console.error("Erro ao carregar via API.categorias.listar():", apiError);
        throw apiError; // Passar para o próximo método
      }
    } 
    // Abordagem 3: Carregar via fetch direto
    else {
      console.log("Tentando fetch direto para categorias");
      const baseUrl = window.API?.BASE_URL || API_URL || 'http://localhost:3001/api';
      
      // Tentar diferentes endpoints
      const possibleEndpoints = [
        '/categories',
        '/categorias',
        '/categoria'
      ];
      
      let success = false;
      
      for (const endpoint of possibleEndpoints) {
        if (success) break;
        
        try {
          const url = `${baseUrl}${endpoint}`;
          console.log(`Tentando carregar de: ${url}`);
          
          const response = await fetch(url);
          
          if (response.ok) {
            const data = await response.json();
            categoriasList = Array.isArray(data) ? data : 
                            (data.categorias || data.categories || data.data || data.items || []);
            
            console.log(`Categorias carregadas via fetch de ${endpoint}:`, categoriasList.length);
            success = true;
          }
        } catch (endpointError) {
          console.warn(`Falha ao carregar de ${endpoint}:`, endpointError);
        }
      }
      
      if (!success) {
        throw new Error("Não foi possível carregar categorias de nenhum endpoint");
      }
    }

    // Se temos categorias carregadas, preencher o select
    if (categoriasList.length > 0) {
      categoriasList.forEach(categoria => {
        // Verificar se a opção já existe
        if (!selectCategoria.querySelector(`option[value="${categoria.id}"]`)) {
          const option = document.createElement('option');
          option.value = categoria.id;
          option.textContent = categoria.name;
          selectCategoria.appendChild(option);
        }
      });
      
      console.log(`${categoriasList.length} categorias adicionadas ao filtro`);
      
      // Restaurar o valor selecionado se existir
      if (filtroAtual.categoria) {
        selectCategoria.value = filtroAtual.categoria;
      }
      
      return true;
    } else {
      console.warn("Nenhuma categoria encontrada para preencher o filtro");
      selectCategoria.innerHTML += '<option value="" disabled>Nenhuma categoria disponível</option>';
      return false;
    }
  } catch (error) {
    console.error('Erro ao carregar categorias para filtro:', error);
    selectCategoria.innerHTML += '<option value="" disabled>Erro ao carregar categorias</option>';
    
    // Adicionar botão para tentar novamente
    const filterItem = selectCategoria.closest('.filter-item');
    if (filterItem && !filterItem.querySelector('.retry-button')) {
      const retryButton = document.createElement('button');
      retryButton.textContent = 'Tentar novamente';
      retryButton.className = 'btn btn-sm retry-button';
      retryButton.style.marginTop = '8px';
      retryButton.addEventListener('click', function() {
        this.disabled = true;
        this.textContent = 'Carregando...';
        carregarCategoriasFiltro().finally(() => {
          this.disabled = false;
          this.textContent = 'Tentar novamente';
        });
      });
      filterItem.appendChild(retryButton);
    }
    
    return false;
  }
}

// Aplicar filtros
function aplicarFiltros() {
  console.log('Aplicando filtros:', filtroAtual);
  
  // Atualizar UI mostrando filtros ativos
  atualizarFiltrosAtivos();
  
  // Recarregar produtos com filtros
  renderizarListaProdutos(filtroAtual);
  
  // Notificação de filtros aplicados
  if (window.Toast) {
    window.Toast.info('Filtros aplicados com sucesso', {
      position: 'bottom-right',
      duration: 3000
    });
  }
}

// Limpar todos os filtros
function limparFiltros() {
  const nameFilter = document.getElementById('filter-name');
  if (nameFilter) nameFilter.value = '';
  
  const categoryFilter = document.getElementById('filter-category');
  if (categoryFilter) categoryFilter.value = '';
  
  const minPriceFilter = document.getElementById('filter-min-price');
  if (minPriceFilter) minPriceFilter.value = '';
  
  const maxPriceFilter = document.getElementById('filter-max-price');
  if (maxPriceFilter) maxPriceFilter.value = '';
  
  const expiryFilter = document.getElementById('filter-expiry');
  if (expiryFilter) expiryFilter.value = '';
  
  // Resetar objeto de filtro
  filtroAtual = {
    nome: '',
    categoria: '',
    precoMin: '',
    precoMax: '',
    validade: ''
  };
  
  // Limpar UI de filtros ativos
  const activeFilters = document.getElementById('active-filters');
  if (activeFilters) activeFilters.innerHTML = '';
  
  // Recarregar produtos sem filtros
  renderizarListaProdutos();
  
  // Notificação de filtros limpos
  if (window.Toast) {
    window.Toast.info('Filtros removidos', {
      position: 'bottom-right',
      duration: 2000
    });
  }
}

// Atualizar a UI mostrando filtros ativos
function atualizarFiltrosAtivos() {
  const filtrosContainer = document.getElementById('active-filters');
  if (!filtrosContainer) return;
  
  filtrosContainer.innerHTML = '';
  let temFiltroAtivo = false;
  
  // Verificar e mostrar cada filtro ativo
  if (filtroAtual.nome) {
    criarMarcadorFiltro(filtrosContainer, 'Nome', filtroAtual.nome, () => {
      document.getElementById('filter-name').value = '';
      filtroAtual.nome = '';
      aplicarFiltros();
    });
    temFiltroAtivo = true;
  }
  
  if (filtroAtual.categoria) {
    const selectCategoria = document.getElementById('filter-category');
    const categoriaTexto = selectCategoria.options[selectCategoria.selectedIndex].text;
    
    criarMarcadorFiltro(filtrosContainer, 'Categoria', categoriaTexto, () => {
      document.getElementById('filter-category').value = '';
      filtroAtual.categoria = '';
      aplicarFiltros();
    });
    temFiltroAtivo = true;
  }
  
  if (filtroAtual.precoMin || filtroAtual.precoMax) {
    let textoPreco = '';
    if (filtroAtual.precoMin && filtroAtual.precoMax) {
      textoPreco = `R$ ${filtroAtual.precoMin} até R$ ${filtroAtual.precoMax}`;
    } else if (filtroAtual.precoMin) {
      textoPreco = `A partir de R$ ${filtroAtual.precoMin}`;
    } else {
      textoPreco = `Até R$ ${filtroAtual.precoMax}`;
    }
    
    criarMarcadorFiltro(filtrosContainer, 'Preço', textoPreco, () => {
      document.getElementById('filter-min-price').value = '';
      document.getElementById('filter-max-price').value = '';
      filtroAtual.precoMin = '';
      filtroAtual.precoMax = '';
      aplicarFiltros();
    });
    temFiltroAtivo = true;
  }
  
  if (filtroAtual.validade) {
    let textoValidade = '';
    switch(filtroAtual.validade) {
      case 'valid':
        textoValidade = 'Produtos válidos';
        break;
      case 'soon':
        textoValidade = 'Vencimento próximo (30 dias)';
        break;
      case 'expired':
        textoValidade = 'Produtos vencidos';
        break;
    }
    
    criarMarcadorFiltro(filtrosContainer, 'Validade', textoValidade, () => {
      document.getElementById('filter-expiry').value = '';
      filtroAtual.validade = '';
      aplicarFiltros();
    });
    temFiltroAtivo = true;
  }
  
  // Se tem algum filtro, adicionar opção para limpar todos
  if (temFiltroAtivo) {
    const limparTodos = document.createElement('button');
    limparTodos.className = 'btn btn-sm btn-outline';
    limparTodos.innerHTML = 'Limpar todos os filtros';
    limparTodos.style.marginLeft = 'auto';
    limparTodos.addEventListener('click', limparFiltros);
    filtrosContainer.appendChild(limparTodos);
  }
}

// Criar um marcador de filtro ativo
function criarMarcadorFiltro(container, tipo, valor, onRemove) {
  const filtroEl = document.createElement('div');
  filtroEl.className = 'active-filter';
  
  // Selecionar ícone apropriado baseado no tipo de filtro
  let iconClass = 'fa-tag';
  switch(tipo.toLowerCase()) {
    case 'nome': iconClass = 'fa-font'; break;
    case 'categoria': iconClass = 'fa-list'; break; 
    case 'preço': iconClass = 'fa-dollar-sign'; break;
    case 'validade': iconClass = 'fa-calendar'; break;
  }
  
  filtroEl.innerHTML = `
    <i class="fas ${iconClass}"></i>
    <span><strong>${tipo}:</strong> ${valor}</span>
    <button type="button" title="Remover filtro"><i class="fas fa-times"></i></button>
  `;
  
  // Adicionar evento para remover o filtro
  filtroEl.querySelector('button').addEventListener('click', onRemove);
  
  container.appendChild(filtroEl);
  
  // Efeito de entrada
  setTimeout(() => {
    filtroEl.style.transform = 'scale(1.05)';
    setTimeout(() => {
      filtroEl.style.transform = 'scale(1)';
    }, 150);
  }, 10);
}

// Modificar a função existente para aceitar filtros
async function renderizarListaProdutos(filtros = null) {
  try {
    contentEl.innerHTML = `
      <section class="products-list">
        <div class="container">
          <h1 class="section-title">Nossos Produtos</h1>
          <div class="loading-indicator">
            <div class="spinner"></div>
            <p>Carregando produtos...</p>
          </div>
        </div>
      </section>
    `;

    console.log('Iniciando carregamento de produtos...');
    
    if (!API || !API.produtos || typeof API.produtos.listar !== 'function') {
      console.error('API não está configurada corretamente:', API);
      throw new Error('Configuração da API não está completa');
    }

    try {
      console.log('Chamando API.produtos.listar()...');
      produtos = await API.produtos.listar();
      console.log(`Carregados ${produtos ? produtos.length : 0} produtos do banco de dados`);
      
      if (!produtos || !Array.isArray(produtos)) {
        console.error('Resposta inválida da API:', produtos);
        throw new Error('Formato inválido de resposta');
      }
    } catch (apiError) {
      console.error('Erro específico da API:', apiError);
      
      console.log('Tentando método alternativo com fetch direto...');
      const response = await fetch(`${API.BASE_URL || 'http://localhost:3001/api'}/produtos`);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      produtos = await response.json();
      console.log('Produtos carregados via fetch direto:', produtos.length);
    }

    // Após carregar os produtos, aplicar filtros antes de renderizar
    if (filtros) {
      produtos = filtrarProdutos(produtos, filtros);
    }

    const mainContent = `
      <section class="products-list">
        <div class="container">
          <h1 class="section-title">Nossos Produtos</h1>
          
          <!-- Seção de filtros com estilo aprimorado -->
          <section class="filter-section">
            <h2 class="filter-title"><i class="fas fa-filter"></i> Filtrar Produtos</h2>
            <div class="filter-container">
              <div class="filter-item">
                <label for="filter-name">Nome do produto</label>
                <div class="search-box">
                  <input type="text" id="filter-name" placeholder="Buscar produtos..." value="${filtros?.nome || ''}">
                  <button id="search-btn" type="button"><i class="fas fa-search"></i></button>
                </div>
              </div>
              
              <div class="filter-item">
                <label for="filter-category">Categoria</label>
                <select id="filter-category">
                  <option value="">Todas as categorias</option>
                  <!-- As categorias serão carregadas dinamicamente -->
                </select>
              </div>
              
              <div class="filter-item">
                <label for="filter-min-price">Preço</label>
                <div class="price-range-container">
                  <input type="number" id="filter-min-price" placeholder="Mín" min="0" step="0.01" value="${filtros?.precoMin || ''}">
                  <span>até</span>
                  <input type="number" id="filter-max-price" placeholder="Máx" min="0" step="0.01" value="${filtros?.precoMax || ''}">
                </div>
              </div>
              
              <div class="filter-item">
                <label for="filter-expiry">Validade</label>
                <select id="filter-expiry">
                  <option value="">Todos os produtos</option>
                  <option value="valid" ${filtros?.validade === 'valid' ? 'selected' : ''}>Produtos válidos</option>
                  <option value="soon" ${filtros?.validade === 'soon' ? 'selected' : ''}>Vencimento próximo (30 dias)</option>
                  <option value="expired" ${filtros?.validade === 'expired' ? 'selected' : ''}>Produtos vencidos</option>
                </select>
              </div>
              
              <div class="filter-actions">
                <button id="apply-filters" class="btn btn-primary" type="button">
                  <i class="fas fa-filter"></i> Aplicar Filtros
                </button>
                <button id="clear-filters" class="btn btn-outline" type="button">
                  <i class="fas fa-times"></i> Limpar
                </button>
              </div>
            </div>
          </section>

          <!-- Área para filtros ativos -->
          <div id="active-filters" class="active-filters-container"></div>

          ${produtos.length === 0 ? 
            `<div class="empty-state">
              <p>Nenhum produto encontrado${filtros ? ' com os filtros selecionados' : ''}.</p>
              ${filtros ? '<button class="btn btn-outline" onclick="limparFiltros()">Limpar filtros</button>' : ''}
              ${isAdmin() ? `<a href="/registerProduct.html" class="btn btn-primary">Cadastrar Novo Produto</a>` : ''}
            </div>` :
            `<div class="featured-products">
              ${produtos.map(produto => {
                const imageUrl = window.ImageHelper ? 
                  window.ImageHelper.getProductImageUrl(produto.id) : 
                  `${API.BASE_URL}/products/image/${produto.id}`;
                return `
                  <div class="product-card">
                    <div class="product-img" style="background-image: url('${imageUrl}')"></div>
                    <div class="product-info">
                      <h3>${produto.name}</h3>
                      <p class="product-price">R$ ${parseFloat(produto.price).toFixed(2).replace('.', ',')}</p>
                      <button class="btn btn-primary" onclick="verDetalhesProduto(${produto.id})">
                        <i class="fas fa-eye"></i> Ver Detalhes
                      </button>
                    </div>
                  </div>`;
              }).join("")}
            </div>`
          }
        </div>
      </section>
    `;

    contentEl.innerHTML = mainContent;
    
    // Inicializar os filtros com um atraso maior para garantir que tudo esteja renderizado
    setTimeout(() => {
      initializeFilters();
      
      // Recriar os filtros ativos após renderizar
      if (filtros) {
        atualizarFiltrosAtivos();
      }
    }, 300);
    
    if (window.Toast && produtos.length > 0) {
      window.Toast.success(`${produtos.length} produtos carregados com sucesso!`, {
        position: 'bottom-right',
        duration: 3000
      });
    } else if (window.Toast && produtos.length === 0) {
      window.Toast.info('Não encontramos produtos disponíveis.', {
        position: 'bottom-right',
        duration: 3000
      });
    }
  } catch (error) {
    console.error('Erro detalhado ao carregar produtos:', error);
    
    contentEl.innerHTML = `
      <section class="products-list">
        <div class="container">
          <h1 class="section-title">Nossos Produtos</h1>
          <div class="error-state">
            <i class="fas fa-exclamation-circle" style="color: #e53e3e; font-size: 2rem; margin-bottom: 1rem;"></i>
            <p class="error">Erro ao carregar produtos: ${error.message || 'Falha na comunicação com o servidor'}.</p>
            <p>Verifique sua conexão com a internet e tente novamente.</p>
            <button class="btn btn-primary" onclick="renderizarListaProdutos()">Tentar Novamente</button>
          </div>
        </div>
      </section>
    `;
    
    if (window.Toast) {
      window.Toast.error(`Não foi possível carregar os produtos: ${error.message || 'Erro de conexão'}`, {
        position: 'top-center',
        duration: 5000
      });
    }
  }
}

// Função para filtrar produtos com base nos critérios
function filtrarProdutos(produtos, filtros) {
  return produtos.filter(produto => {
    // Filtrar por nome
    if (filtros.nome && 
        !produto.name.toLowerCase().includes(filtros.nome.toLowerCase()) && 
        (!produto.description || !produto.description.toLowerCase().includes(filtros.nome.toLowerCase()))) {
      return false;
    }
    
    // Filtrar por categoria
    if (filtros.categoria && produto.category_id != filtros.categoria) {
      return false;
    }
    
    // Filtrar por preço mínimo
    if (filtros.precoMin && parseFloat(produto.price) < filtros.precoMin) {
      return false;
    }
    
    // Filtrar por preço máximo
    if (filtros.precoMax && parseFloat(produto.price) > filtros.precoMax) {
      return false;
    }
    
    // Filtrar por validade
    if (filtros.validade) {
      const hoje = new Date();
      const dataValidade = new Date(produto.expiry_date);
      const diasParaVencer = Math.floor((dataValidade - hoje) / (1000 * 60 * 60 * 24));
      
      switch(filtros.validade) {
        case 'valid': 
          if (dataValidade < hoje) return false;
          break;
        case 'soon': 
          if (diasParaVencer < 0 || diasParaVencer > 30) return false;
          break;
        case 'expired': 
          if (dataValidade > hoje) return false;
          break;
      }
    }
    
    return true;
  });
}

function isAdmin() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user && (user.type === 'admin' || user.isAdmin === true);
  } catch (e) {
    return false;
  }
}

function renderizarListaCategorias() {
  const mainContent = `
    <section class="categories-list">
      <div class="container">
        <h1 class="section-title">Nossas Categorias</h1>
        <div class="category-grid">
          ${categorias
            .map(
              categoria => `
            <div class="category-card">
              <h3>${categoria.name}</h3>
              <p>${categoria.description || 'Sem descrição'}</p>
              <button class="btn btn-outline" onclick="verProdutosPorCategoria(${
                categoria.id
              })">Ver Produtos</button>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    </section>
  `;

  contentEl.innerHTML = mainContent;
  currentPage = 'categorias';
  window.history.pushState({}, '', '/categorias');
}

function navegarParaHome() {
  window.location.href = '/index.html';
  currentPage = 'home';
}

function navegarParaCadastrarProdutos() {
  window.location.href = '/registerProduct.html';
  currentPage = 'registerProduct';
}

function navegarParaProdutos() {
  renderizarListaProdutos();
  currentPage = 'produtos';
  window.history.pushState({}, '', '/produtos');
}

function navegarParaCategorias() {
  renderizarListaCategorias();
}

function navegarParaLogin() {
  window.location.href = '/login.html';
  currentPage = 'login';
}

function navegarParaRegistro() {
  window.location.href = '/registro.html';
  currentPage = 'registro';
}

function navegarParaSobre() {
  carregarConteudoHTML('/sobre.html');
}

function navegarParaCompartilharReceitas() {
  console.log('Navegando para compartilhar receitas...');
  window.location.href = '/compartilharReceitas.html';
  currentPage = 'compartilharReceitas';
}

window.navegarParaHome = navegarParaHome;
window.navegarParaCompartilharReceitas = navegarParaCompartilharReceitas;

function navegarParaAdmin() {
  window.location.href = '/admin.html';
  currentPage = 'admin';
}

async function carregarConteudoHTML(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro ao carregar a página: ${response.status}`);
    }

    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    removerEstilosEspecificos();

    const styles = Array.from(doc.querySelectorAll('style, link[rel="stylesheet"]'));

    const existingStyleUrls = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(
      link => link.getAttribute('href')
    );

    styles.forEach(style => {
      if (style.tagName === 'LINK' && style.getAttribute('rel') === 'stylesheet') {
        const href = style.getAttribute('href');
        if (
          !existingStyleUrls.includes(href) &&
          !href.includes('styles.css') &&
          !href.includes('components.css')
        ) {
          console.log('Adicionando CSS:', href);
          const linkEl = document.createElement('link');
          linkEl.setAttribute('rel', 'stylesheet');
          linkEl.setAttribute('href', href);
          linkEl.setAttribute('data-page-specific', 'true');
          document.head.appendChild(linkEl);
        }
      } else if (style.tagName === 'STYLE') {
        const styleEl = document.createElement('style');
        styleEl.setAttribute('data-page-specific', 'true');
        styleEl.textContent = style.textContent;
        document.head.appendChild(styleEl);
      }
    });

    let mainContent;
    if (doc.querySelector('main')) {
      mainContent = doc.querySelector('main').innerHTML;
    } else if (doc.querySelector('body')) {
      const bodyContent = doc.querySelector('body');
      Array.from(bodyContent.querySelectorAll('script, style, link')).forEach(el => el.remove());
      mainContent = bodyContent.innerHTML;
    } else {
      throw new Error('Conteúdo não encontrado');
    }

    contentEl.innerHTML = mainContent;

    if (url.includes('receitas')) {
      currentPage = 'receitas';
      window.history.pushState({}, '', '/receitas');

      adicionarCSS('/css/receitas.css');
    } else if (url.includes('sobre')) {
      currentPage = 'sobre';
      window.history.pushState({}, '', '/sobre');

      adicionarCSS('/css/sobre.css');
      adicionarCSS('/css/animations.css');
    }

    const scripts = Array.from(contentEl.querySelectorAll('script'));
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });

    if (url.includes('sobre')) {
      setTimeout(() => {
        if (typeof initScrollAnimations === 'function') {
          initScrollAnimations();
        } else {
          carregarScript('/js/scroll-animations.js').then(() => {
            if (typeof initScrollAnimations === 'function') {
              initScrollAnimations();
            }
          });
        }
      }, 100);
    }
  } catch (error) {
    console.error('Erro ao carregar conteúdo:', error);
    contentEl.innerHTML = `<p class="error">Erro ao carregar a página. Tente novamente mais tarde.</p>`;
  }
}

async function carregarScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function adicionarCSS(href) {
  const existingLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(link =>
    link.getAttribute('href')
  );

  if (!existingLinks.includes(href)) {
    console.log('Adicionando CSS faltante:', href);
    const linkEl = document.createElement('link');
    linkEl.setAttribute('rel', 'stylesheet');
    linkEl.setAttribute('href', href);
    linkEl.setAttribute('data-page-specific', 'true');
    document.head.appendChild(linkEl);
    return true;
  }
  return false;
}

function removerEstilosEspecificos() {
  Array.from(
    document.querySelectorAll('style[data-page-specific], link[data-page-specific]')
  ).forEach(el => el.remove());
}

window.carregarDetalhesProduto = carregarDetalhesProduto;
window.renderizarListaProdutos = renderizarListaProdutos;
window.renderizarListaCategorias = renderizarListaCategorias;

window.verDetalhesProduto = async function (id) {
  await carregarDetalhesProduto(id);
};

window.verProdutosPorCategoria = async function (categoriaId) {
  try {
    produtos = await API.produtos.obterPorCategoria(categoriaId);
    renderizarListaProdutos();
  } catch (error) {
    if (contentEl) {
      contentEl.innerHTML =
        '<p class="error">Erro ao carregar produtos desta categoria. Tente novamente mais tarde.</p>';
    }
  }
};

window.verReceitaDetalhes = async function (id) {
  try {
    const response = await fetch(`/receitas/${id}.html`);

    if (response.ok) {
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const receitaContent = doc.querySelector('main')
        ? doc.querySelector('main').innerHTML
        : doc.querySelector('body').innerHTML;

      contentEl.innerHTML = receitaContent;
      currentPage = 'receita-detalhes';
      window.history.pushState({}, '', `/receitas/${id}`);
      return;
    }

    throw new Error('Arquivo HTML da receita não encontrado');
  } catch (error) {
    console.log('Usando dados estáticos para a receita:', error);

    const receitas = [
      {
        id: 1,
        titulo: 'Bolo de Chocolate Fofinho',
        imagem: '/imgs/bolo_chocolate_receita.jpg',
        tempoPreparacao: '40 minutos',
        rendimento: '8 porções',
        ingredientes: [
          '2 xícaras de farinha de trigo',
          '1 xícara de açúcar',
          '1/2 xícara de chocolate em pó',
          '1 colher (sopa) de fermento em pó',
          '1/2 colher (chá) de bicarbonato de sódio',
          '2 ovos',
          '1/2 xícara de óleo',
          '1 xícara de leite',
        ],
        preparo: [
          'Em uma tigela, misture os ingredientes secos.',
          'Em outro recipiente, bata os ovos com o óleo e o leite.',
          'Junte a mistura líquida aos ingredientes secos e mexa até obter uma massa homogênea.',
          'Transfira para uma forma untada e enfarinhada.',
          'Asse em forno preaquecido a 180°C por aproximadamente 30 minutos.',
        ],
      },
      {
        id: 2,
        titulo: 'Brigadeiro Gourmet',
        imagem: '/imgs/brigadeiro_receita.jpg',
        tempoPreparacao: '30 minutos',
        rendimento: '20 unidades',
        ingredientes: [
          '1 lata de leite condensado',
          '3 colheres (sopa) de chocolate em pó 70% cacau',
          '1 colher (sopa) de manteiga',
          'Chocolate granulado para decorar',
        ],
        preparo: [
          'Em uma panela, coloque o leite condensado, o chocolate em pó e a manteiga.',
          'Cozinhe em fogo baixo, mexendo sempre, até desprender do fundo da panela.',
          'Deixe esfriar e enrole em pequenas bolinhas.',
          'Passe no chocolate granulado e coloque em forminhas de papel.',
        ],
      },
      {
        id: 3,
        titulo: 'Torta de Limão',
        imagem: '/imgs/torta_limao_receita.jpg',
        tempoPreparacao: '60 minutos',
        rendimento: '8 porções',
        ingredientes: [
          '1 pacote de biscoito maisena',
          '100g de manteiga',
          '1 lata de leite condensado',
          'Suco de 4 limões',
          '1 lata de creme de leite',
          'Raspas de limão para decorar',
        ],
        preparo: [
          'Triture o biscoito e misture com a manteiga derretida.',
          'Forre uma forma e leve ao forno por 10 minutos.',
          'Bata o leite condensado com o suco de limão até engrossar.',
          'Adicione o creme de leite e misture levemente.',
          'Despeje sobre a base de biscoito e leve à geladeira por 3 horas.',
          'Decore com raspas de limão antes de servir.',
        ],
      },
    ];

    const receita = receitas.find(r => r.id === id);

    if (receita) {
      const detalhesHtml = `
        <section class="recipe-details">
          <div class="container">
            <div class="recipe-details-header">
              <h1 class="recipe-title">${receita.titulo}</h1>
              <button class="btn btn-outline" onclick="navegarParaReceitas()">Voltar para Receitas</button>
            </div>
            
            <div class="recipe-details-content">
              <div class="recipe-details-image">
                <img src="${receita.imagem}" alt="${receita.titulo}">
              </div>
              
              <div class="recipe-meta">
                <div class="recipe-meta-item">
                  <i class="fa-regular fa-clock"></i>
                  <span>Tempo: ${receita.tempoPreparacao}</span>
                </div>
                <div class="recipe-meta-item">
                  <i class="fa-solid fa-utensils"></i>
                  <span>Rendimento: ${receita.rendimento}</span>
                </div>
              </div>
              
              <div class="recipe-ingredients">
                <h2>Ingredientes</h2>
                <ul>
                  ${receita.ingredientes.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
              
              <div class="recipe-instructions">
                <h2>Modo de Preparo</h2>
                <ol>
                  ${receita.preparo.map(passo => `<li>${passo}</li>`).join('')}
                </ol>
              </div>
            </div>
          </div>
        </section>
      `;

      contentEl.innerHTML = detalhesHtml;
      currentPage = 'receita-detalhes';
      window.history.pushState({}, '', `/receitas/${id}`);
    }
  }
};

window.carregarConteudoHTML = carregarConteudoHTML;
window.removerEstilosEspecificos = removerEstilosEspecificos;
window.navegarParaHome = navegarParaHome;
window.initializeFilters = initializeFilters;
window.aplicarFiltros = aplicarFiltros;
window.limparFiltros = limparFiltros;
