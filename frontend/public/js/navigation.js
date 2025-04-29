const Navigation = {
  navegarParaAdmin: function () {
    window.renderizarAdmin();
    this.currentPage = 'admin';
    window.history.pushState({}, '', '/admin');
  },

  navegarParaCadastrarProdutos: function () {
    window.location.href = '/registerProduct.html';
    this.currentPage = 'registerProduct';
  },

  navegarParaCategorias: function () {
    window.removerEstilosEspecificos && window.removerEstilosEspecificos();
    window.renderizarListaCategorias();
    this.currentPage = 'categorias';
    window.history.pushState({}, '', '/categorias');
  },

  navegarParaSobre: function () {
    window.carregarConteudoHTML('/sobre.html');
    this.currentPage = 'sobre';
    window.history.pushState({}, '', '/sobre');
  },

  navegarParaLogin: function () {
    window.location.href = '/login.html';
    this.currentPage = 'login';
  },

  navegarParaRegistro: function () {
    window.location.href = '/registro.html';
    this.currentPage = 'registro';
  },

  navegarParaCompartilharReceitas: function () {
    window.location.href = '/compartilharReceitas.html';
    this.currentPage = 'compartilharReceitas';
  },

  handleNavigation: function () {
    const path = window.location.pathname;

    if (path.startsWith('/produtos/') && path.length > 10) {
      const produtoId = path.split('/').pop();
      window.carregarDetalhesProduto(produtoId);
    } else if (path === '/produtos') {
      this.navegarParaProdutos();
    } else if (path === '/categorias') {
      this.navegarParaCategorias();
    } else if (path === '/registerProduct') {
      this.navegarParaRegistroProduct();
    } else if (path === '/sobre') {
      this.navegarParaSobre();
    } else if (path === '/compartilharReceitas') {
      this.navegarParaCompartilharReceitas();
    } else if (path.startsWith('/receitas/')) {
      const receitaId = parseInt(path.split('/').pop());
      if (!isNaN(receitaId)) {
        window.verReceitaDetalhes(receitaId);
      }
    } else if (path === '/login') {
      this.navegarParaLogin();
    } else if (path === '/registro') {
      this.navegarParaRegistro();
    } else if (path === '/admin') {
      this.navegarParaAdmin();
    } else {
      window.renderizarListaProdutos();
    }
  },
};

window.navegarParaCompartilharReceitas = function () {
  Navigation.navegarParaCompartilharReceitas();
};

window.navegarParaCadastrarProdutos = function () {
  Navigation.navegarParaCadastrarProdutos();
};
window.navegarParaCategorias = function () {
  Navigation.navegarParaCategorias();
};

window.navegarParaSobre = function () {
  Navigation.navegarParaSobre();
};
window.navegarParaLogin = function () {
  Navigation.navegarParaLogin();
};
window.navegarParaRegistro = function () {
  Navigation.navegarParaRegistro();
};
window.navegarParaAdmin = function () {
  Navigation.navegarParaAdmin();
};
