const Navigation = {


  navegarParaProdutos: function () {
    window.renderizarListaProdutos();
    this.currentPage = "produtos";
    window.history.pushState({}, "", "/produtos");
  },

  navegarParaAdmin: function () {
    window.renderizarAdmin();
    this.currentPage = "admin";
    window.history.pushState({}, "", "/admin");
  },

  navegarParaRegistroProduct: function () {
    window.renderizarRegistroProduct();
    this.currentPage = "registerProduct";
    window.history.pushState({}, "", "/registerProduct");
  },


  navegarParaCategorias: function () {
    window.renderizarListaCategorias();
    this.currentPage = "categorias";
    window.history.pushState({}, "", "/categorias");
  },

  navegarParaLogin: function () {
    window.location.href = "/login.html";
    this.currentPage = "login";
  },

  navegarParaRegistro: function () {
    window.location.href = "/registro.html";
    this.currentPage = "registro";
  },

  handleNavigation: function () {
    const path = window.location.pathname;

    if (path.startsWith("/produtos/") && path.length > 10) {
      const produtoId = path.split("/").pop();
      window.carregarDetalhesProduto(produtoId);
    } else if (path === "/produtos") {
      this.navegarParaProdutos();
    } else if (path === "/categorias") {
      this.navegarParaCategorias();
    } else if (path === "/login") {
      this.navegarParaLogin();
    } else if (path === "/registro") {
      this.navegarParaRegistro();
    } else if (path === "/admin") {
      this.navegarParaAdmin();
    } else {
      window.renderizarListaProdutos();
    }
  },
};

window.navegarParaProdutos = function () {
  Navigation.navegarParaProdutos();
};
window.navegarParaCategorias = function () {
  Navigation.navegarParaCategorias();
};
window.navegarParaLogin = function () {
  Navigation.navegarParaLogin();
};
window.navegarParaRegistro = function () {
  Navigation.navegarParaRegistro();
};
window.navegarParaAdmin = function () {
  Navigation.navegarParaAdmin();
}

