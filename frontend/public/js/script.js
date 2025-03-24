const API_URL = "http://localhost:3001/api";

let produtos = [];
let categorias = [];

const contentEl = document.getElementById("content");
const produtosContainer = document.getElementById("produtos-container");
const categoriasContainer = document.getElementById("categorias-container");
const verProdutosBtn = document.getElementById("ver-produtos");
const navProdutos = document.getElementById("nav-produtos");
const navCategorias = document.getElementById("nav-categorias");

window.navegarParaProdutos = navegarParaProdutos;
window.navegarParaCategorias = navegarParaCategorias;
window.navegarParaLogin = navegarParaLogin;
window.navegarParaRegistro = navegarParaRegistro;
window.navegarParaReceitas = navegarParaReceitas;
window.navegarParaSobre = navegarParaSobre;

document.addEventListener("DOMContentLoaded", iniciarAplicacao);
if (verProdutosBtn)
  verProdutosBtn.addEventListener("click", navegarParaProdutos);
if (navProdutos)
  navProdutos.addEventListener("click", (e) => {
    e.preventDefault();
    navegarParaProdutos();
  });
if (navCategorias)
  navCategorias.addEventListener("click", (e) => {
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

function renderizarProdutosDestaque(produtosDestaque) {
  if (!produtosContainer) return;

  if (produtosDestaque.length === 0) {
    produtosContainer.innerHTML = "<p>Nenhum produto encontrado</p>";
    return;
  }

  const html = produtosDestaque
    .map(
      (produto) => `
    <div class="product-card">
      <div class="product-img" style="background-image: url('${
        produto.image_url
          ? `/imgs/${produto.image_url}`
          : "/imgs/placeholder.png"
      }')"></div>
      <div class="product-info">
        <h3>${produto.name}</h3>
        <p class="product-price">R$ ${parseFloat(produto.price).toFixed(2)}</p>
        <button class="btn btn-primary" onclick="verDetalhesProduto(${
          produto.id
        })">Ver Detalhes</button>
      </div>
    </div>
  `
    )
    .join("");

  produtosContainer.innerHTML = html;
}

function renderizarCategorias(categoriasList) {
  if (!categoriasContainer) return;

  if (categoriasList.length === 0) {
    categoriasContainer.innerHTML = "<p>Nenhuma categoria encontrada</p>";
    return;
  }

  const html = categoriasList
    .map(
      (categoria) => `
    <div class="category-card">
      <h3>${categoria.name}</h3>
      <p>${categoria.description || "Sem descrição"}</p>
      <button class="btn btn-outline" onclick="verProdutosPorCategoria(${
        categoria.id
      })">Ver Produtos</button>
    </div>
  `
    )
    .join("");

  categoriasContainer.innerHTML = html;
}

function renderizarDetalhesProduto(produto) {
  const mainContent = `
    <section class="product-details">
      <div class="product-image">
        <img src="${
          produto.image_url
            ? `/imgs/${produto.image_url}`
            : "/imgs/placeholder.png"
        }" alt="${produto.name}">
      </div>
      <div class="product-details-info">
        <h1>${produto.name}</h1>
        <p class="product-category">Categoria: ${
          produto.category?.name || "Não categorizado"
        }</p>
        <p class="product-details-price">R$ ${parseFloat(produto.price).toFixed(
          2
        )}</p>
        <p class="product-details-description">${
          produto.description || "Sem descrição disponível"
        }</p>
        <button class="btn btn-primary">Adicionar ao Carrinho</button>
        <button class="btn btn-outline" onclick="navegarParaProdutos()">Voltar para Produtos</button>
      </div>
    </section>
  `;

  contentEl.innerHTML = mainContent;
  currentPage = "produto";
  window.history.pushState({}, "", `/produtos/${produto.id}`);
}

function renderizarListaProdutos() {
  const mainContent = `
    <section class="products-list">
      <div class="container">
        <h1 class="section-title">Nossos Produtos</h1>
        <div class="featured-products">
          ${produtos
            .map(
              (produto) => `
            <div class="product-card">
              <div class="product-img" style="background-image: url('${
                produto.image_url
                  ? `/imgs/${produto.image_url}`
                  : "/imgs/placeholder.png"
              }')"></div>
              <div class="product-info">
                <h3>${produto.name}</h3>
                <p class="product-price">R$ ${parseFloat(produto.price).toFixed(
                  2
                )}</p>
                <button class="btn btn-primary" onclick="verDetalhesProduto(${
                  produto.id
                })">Ver Detalhes</button>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    </section>
  `;

  contentEl.innerHTML = mainContent;
  currentPage = "produtos";
  window.history.pushState({}, "", "/produtos");
}

function renderizarListaCategorias() {
  const mainContent = `
    <section class="categories-list">
      <div class="container">
        <h1 class="section-title">Nossas Categorias</h1>
        <div class="category-grid">
          ${categorias
            .map(
              (categoria) => `
            <div class="category-card">
              <h3>${categoria.name}</h3>
              <p>${categoria.description || "Sem descrição"}</p>
              <button class="btn btn-outline" onclick="verProdutosPorCategoria(${
                categoria.id
              })">Ver Produtos</button>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    </section>
  `;

  contentEl.innerHTML = mainContent;
  currentPage = "categorias";
  window.history.pushState({}, "", "/categorias");
}

function navegarParaProdutos() {
  renderizarListaProdutos();
}

function navegarParaCategorias() {
  renderizarListaCategorias();
}

function navegarParaLogin() {
  window.location.href = "/login.html";
  currentPage = "login";
}

function navegarParaRegistro() {
  window.location.href = "/registro.html";
  currentPage = "registro";
}

function navegarParaReceitas() {
  carregarConteudoHTML("/receitas.html");
}

function navegarParaSobre() {
  carregarConteudoHTML("/sobre.html");
}

// Função para carregar conteúdo HTML de arquivos externos
async function carregarConteudoHTML(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro ao carregar a página: ${response.status}`);
    }

    const html = await response.text();

    // Extrair o conteúdo usando DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Limpar estilos específicos anteriores antes de inserir novo conteúdo
    removerEstilosEspecificos();

    // Buscar e aplicar estilos específicos do documento
    const styles = Array.from(doc.querySelectorAll('style, link[rel="stylesheet"]'));
    
    // Verificar quais estilos já existem para evitar duplicação
    const existingStyleUrls = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map((link) => link.getAttribute("href"));
    
    // Aplicar estilos da página carregada
    styles.forEach((style) => {
      // Para link de stylesheet externo
      if (style.tagName === "LINK" && style.getAttribute("rel") === "stylesheet") {
        const href = style.getAttribute("href");
        // Só adiciona se não for o CSS principal (styles.css) ou components.css
        if (!existingStyleUrls.includes(href) && 
            !href.includes('styles.css') && 
            !href.includes('components.css')) {
          console.log("Adicionando CSS:", href);
          const linkEl = document.createElement("link");
          linkEl.setAttribute("rel", "stylesheet");
          linkEl.setAttribute("href", href);
          linkEl.setAttribute("data-page-specific", "true");
          document.head.appendChild(linkEl);
        }
      }
      // Para estilos inline
      else if (style.tagName === "STYLE") {
        const styleEl = document.createElement("style");
        styleEl.setAttribute("data-page-specific", "true");
        styleEl.textContent = style.textContent;
        document.head.appendChild(styleEl);
      }
    });

    // Extrair o conteúdo principal
    let mainContent;
    if (doc.querySelector("main")) {
      mainContent = doc.querySelector("main").innerHTML;
    } else if (doc.querySelector("body")) {
      // Se não encontrar a tag main, busca o conteúdo do body excluindo scripts e estilos
      const bodyContent = doc.querySelector("body");
      // Remover scripts e estilos do conteúdo copiado
      Array.from(bodyContent.querySelectorAll("script, style, link")).forEach(
        (el) => el.remove()
      );
      mainContent = bodyContent.innerHTML;
    } else {
      throw new Error("Conteúdo não encontrado");
    }

    // Inserir o novo conteúdo
    contentEl.innerHTML = mainContent;

    // Definir a página atual baseada no URL
    if (url.includes("receitas")) {
      currentPage = "receitas";
      window.history.pushState({}, "", "/receitas");
      
      // Adicionar CSS específico para receitas se não estiver já incluído
      adicionarCSS("/css/receitas.css");
    } else if (url.includes("sobre")) {
      currentPage = "sobre";
      window.history.pushState({}, "", "/sobre");
      
      // Adicionar CSS específico para sobre se não estiver já incluído
      adicionarCSS("/css/sobre.css");
      adicionarCSS("/css/animations.css");
    }

    // Executar scripts que possam estar no conteúdo carregado
    const scripts = Array.from(contentEl.querySelectorAll("script"));
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
    
    // Se estiver na página sobre, inicializar animações de scroll
    if (url.includes("sobre")) {
      // Verificar se o script de animações já foi carregado
      setTimeout(() => {
        if (typeof initScrollAnimations === 'function') {
          initScrollAnimations();
        } else {
          carregarScript("/js/scroll-animations.js").then(() => {
            if (typeof initScrollAnimations === 'function') {
              initScrollAnimations();
            }
          });
        }
      }, 100);
    }
  } catch (error) {
    console.error("Erro ao carregar conteúdo:", error);
    contentEl.innerHTML = `<p class="error">Erro ao carregar a página. Tente novamente mais tarde.</p>`;
  }
}

// Função auxiliar para carregar um script
async function carregarScript(src) {
  return new Promise((resolve, reject) => {
    // Verificar se o script já existe
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

// Função auxiliar para adicionar CSS se não estiver já carregado
function adicionarCSS(href) {
  const existingLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map(link => link.getAttribute("href"));
    
  if (!existingLinks.includes(href)) {
    console.log("Adicionando CSS faltante:", href);
    const linkEl = document.createElement("link");
    linkEl.setAttribute("rel", "stylesheet");
    linkEl.setAttribute("href", href);
    linkEl.setAttribute("data-page-specific", "true");
    document.head.appendChild(linkEl);
    return true;
  }
  return false;
}

// Função auxiliar para remover estilos específicos de página
function removerEstilosEspecificos() {
  // Remover estilos específicos anteriores antes de inserir novos
  Array.from(
    document.querySelectorAll(
      "style[data-page-specific], link[data-page-specific]"
    )
  ).forEach((el) => el.remove());
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
    // Tentar carregar do arquivo HTML dedicado
    const response = await fetch(`/receitas/${id}.html`);

    if (response.ok) {
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const receitaContent = doc.querySelector("main")
        ? doc.querySelector("main").innerHTML
        : doc.querySelector("body").innerHTML;

      contentEl.innerHTML = receitaContent;
      currentPage = "receita-detalhes";
      window.history.pushState({}, "", `/receitas/${id}`);
      return;
    }

    // Fallback para os dados estáticos se o arquivo não existir
    throw new Error("Arquivo HTML da receita não encontrado");
  } catch (error) {
    console.log("Usando dados estáticos para a receita:", error);

    // Resto do código existente usando os dados estáticos
    const receitas = [
      {
        id: 1,
        titulo: "Bolo de Chocolate Fofinho",
        imagem: "/imgs/bolo_chocolate_receita.jpg",
        tempoPreparacao: "40 minutos",
        rendimento: "8 porções",
        ingredientes: [
          "2 xícaras de farinha de trigo",
          "1 xícara de açúcar",
          "1/2 xícara de chocolate em pó",
          "1 colher (sopa) de fermento em pó",
          "1/2 colher (chá) de bicarbonato de sódio",
          "2 ovos",
          "1/2 xícara de óleo",
          "1 xícara de leite",
        ],
        preparo: [
          "Em uma tigela, misture os ingredientes secos.",
          "Em outro recipiente, bata os ovos com o óleo e o leite.",
          "Junte a mistura líquida aos ingredientes secos e mexa até obter uma massa homogênea.",
          "Transfira para uma forma untada e enfarinhada.",
          "Asse em forno preaquecido a 180°C por aproximadamente 30 minutos.",
        ],
      },
      {
        id: 2,
        titulo: "Brigadeiro Gourmet",
        imagem: "/imgs/brigadeiro_receita.jpg",
        tempoPreparacao: "30 minutos",
        rendimento: "20 unidades",
        ingredientes: [
          "1 lata de leite condensado",
          "3 colheres (sopa) de chocolate em pó 70% cacau",
          "1 colher (sopa) de manteiga",
          "Chocolate granulado para decorar",
        ],
        preparo: [
          "Em uma panela, coloque o leite condensado, o chocolate em pó e a manteiga.",
          "Cozinhe em fogo baixo, mexendo sempre, até desprender do fundo da panela.",
          "Deixe esfriar e enrole em pequenas bolinhas.",
          "Passe no chocolate granulado e coloque em forminhas de papel.",
        ],
      },
      {
        id: 3,
        titulo: "Torta de Limão",
        imagem: "/imgs/torta_limao_receita.jpg",
        tempoPreparacao: "60 minutos",
        rendimento: "8 porções",
        ingredientes: [
          "1 pacote de biscoito maisena",
          "100g de manteiga",
          "1 lata de leite condensado",
          "Suco de 4 limões",
          "1 lata de creme de leite",
          "Raspas de limão para decorar",
        ],
        preparo: [
          "Triture o biscoito e misture com a manteiga derretida.",
          "Forre uma forma e leve ao forno por 10 minutos.",
          "Bata o leite condensado com o suco de limão até engrossar.",
          "Adicione o creme de leite e misture levemente.",
          "Despeje sobre a base de biscoito e leve à geladeira por 3 horas.",
          "Decore com raspas de limão antes de servir.",
        ],
      },
    ];

    const receita = receitas.find((r) => r.id === id);

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
                  ${receita.ingredientes
                    .map((item) => `<li>${item}</li>`)
                    .join("")}
                </ul>
              </div>
              
              <div class="recipe-instructions">
                <h2>Modo de Preparo</h2>
                <ol>
                  ${receita.preparo
                    .map((passo) => `<li>${passo}</li>`)
                    .join("")}
                </ol>
              </div>
            </div>
          </div>
        </section>
      `;

      contentEl.innerHTML = detalhesHtml;
      currentPage = "receita-detalhes";
      window.history.pushState({}, "", `/receitas/${id}`);
    }
  }
};

window.carregarConteudoHTML = carregarConteudoHTML; // Exportar para uso global
window.removerEstilosEspecificos = removerEstilosEspecificos;
