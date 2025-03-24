const API_URL = "http://localhost:3001/api";

let produtos = [];
let categorias = [];

const contentEl = document.getElementById("content");
const produtosContainer = document.getElementById("produtos-container");
const categoriasContainer = document.getElementById("categorias-container");
const verProdutosBtn = document.getElementById("ver-produtos");
const navProdutos = document.getElementById("nav-produtos");
const navCategorias = document.getElementById("nav-categorias");
const navAdmin = document.getElementById("nav-admin");

window.navegarParaProdutos = navegarParaProdutos;
window.navegarParaCategorias = navegarParaCategorias;
window.navegarParaLogin = navegarParaLogin;
window.navegarParaRegistro = navegarParaRegistro;
window.navegarParaAdmin = navegarParaAdmin;


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

// function renderizarProdutosDestaque(produtosDestaque) {
//   if (!produtosContainer) return;

//   if (produtosDestaque.length === 0) {
//     produtosContainer.innerHTML = "<p>Nenhum produto encontrado</p>";
//     return;
//   }

//   const html = produtosDestaque
//     .map(
//       (produto) => `
//     <div class="product-card">
//       <div class="product-img" style="background-image: url('${
//         produto.image_id
//           ? `/imgs/${produto.image_id}`
//           : "/imgs/placeholder.png"
//       }')"></div>
//       <div class="product-info">
//         <h3>${produto.name}</h3>
//         <p class="product-price">R$ ${parseFloat(produto.price).toFixed(2)}</p>
//         <button class="btn btn-primary" onclick="verDetalhesProduto(${
//           produto.id
//         })">Ver Detalhes</button>
//       </div>
//     </div>
//   `
//     )
//     .join("");

//   produtosContainer.innerHTML = html;
// }

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

// function renderizarDetalhesProduto(produto) {
//   const mainContent = `
//     <section class="product-details">
//       <div class="product-image">
//         <img src="${
//           produto.image_id
//             ? `/imgs/${produto.image_id}`
//             : "/imgs/placeholder.png"
//         }" alt="${produto.name}">
//       </div>
//       <div class="product-details-info">
//         <h1>${produto.name}</h1>
//         <p class="product-category">Categoria: ${
//           produto.category?.name || "Não categorizado"
//         }</p>
//         <p class="product-details-price">R$ ${parseFloat(produto.price).toFixed(
//           2
//         )}</p>
//         <p class="product-details-description">${
//           produto.description || "Sem descrição disponível"
//         }</p>
//         <button class="btn btn-primary">Adicionar ao Carrinho</button>
//         <button class="btn btn-outline" onclick="navegarParaProdutos()">Voltar para Produtos</button>
//       </div>
//     </section>
//   `;

//   contentEl.innerHTML = mainContent;
//   currentPage = "produto";
//   window.history.pushState({}, "", `/produtos/${produto.id}`);
// }

// function renderizarListaProdutos() {
//   const mainContent = `
//     <section class="products-list">
//       <div class="container">
//         <h1 class="section-title">Nossos Produtos</h1>
//         <div class="featured-products">
//           ${produtos
//             .map(
//               (produto) => `
//             <div class="product-card">
//               <div class="product-img" style="background-image: url('${
//                 produto.image_id
//                   ? `/imgs/${produto.image_id}`
//                   : "/imgs/placeholder.png"
//               }')"></div>
//               <div class="product-info">
//                 <h3>${produto.name}</h3>
//                 <p class="product-price">R$ ${parseFloat(produto.price).toFixed(
//                   2
//                 )}</p>
//                 <button class="btn btn-primary" onclick="verDetalhesProduto(${
//                   produto.id
//                 })">Ver Detalhes</button>
//               </div>
//             </div>
//           `
//             )
//             .join("")}
//         </div>
//       </div>
//     </section>
//   `;

//   contentEl.innerHTML = mainContent;
//   currentPage = "produtos";
//   window.history.pushState({}, "", "/produtos");
// }

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

function navegarParaAdmin() {
  window.location.href = "/admin";
  currentPage = "admin";
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
