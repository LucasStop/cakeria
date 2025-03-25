class Header extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const variant = this.getAttribute("variant") || "user"; 

    if (variant === "user") {
      this.innerHTML = `
        <header class="header">
          <div class="container">
            <div class="logo-container">
              <img src="/assets/logo_cakeria.png" alt="Cakeria Logo" class="header-logo">
            </div>
            
            <nav class="nav-bar">
              <ul class="nav-links">
                <li><a href="/" class="nav-link" data-route="home"><i class="fa-solid fa-home"></i> Home</a></li>
                <li><a href="/produtos" class="nav-link" id="nav-produtos" data-route="produtos"><i class="fa-solid fa-cake-candles"></i> Produtos</a></li>
                <li><a href="/categorias" class="nav-link" id="nav-categorias" data-route="categorias"><i class="fa-solid fa-tags"></i> Categorias</a></li>
                <li><a href="/admin" class="nav-link" data-route="admin"><i class="fa-solid fa-user"></i> Admin</a></li>
                
              </ul>
            </nav>
            
            <div class="auth-buttons">
              <button class="login-btn" data-route="login">
                <i class="fa-solid fa-user"></i> Login
              </button>
            </div>
            
            <button class="menu-toggle" aria-label="Menu">
              <span class="bar"></span>
              <span class="bar"></span>
              <span class="bar"></span>
            </button>
          </div>
          <div class="overlay"></div>
        </header>
      `;
    } else if (variant === "admin") {
      this.innerHTML = `
        <header class="header">
          <div class="container">
            <div class="logo-container">
              <img src="/assets/logo_cakeria.png" alt="Cakeria Logo" class="header-logo">
            </div>
            
            <nav class="nav-bar">
              <ul class="nav-links">
                <li><a href="/" class="nav-link" data-route="home"><i class="fa-solid fa-home"></i> Home</a></li>
                <li><a href="/cadastrar-produtos" class="nav-link" id="nav-cadastrar-produtos" data-route="cadastrar-produtos"><i class="fa-solid fa-cake-candles"></i>Produtos</a></li>
                <li><a href="#dashboard" class="nav-link" data-route="dashboard"><i class="fa-solid fa-chart-line"></i> Dashboard</a></li>
                <li><a href="/usuarios" class="nav-link" data-route="usuarios"><i class="fa-solid fa-users"></i> Usuários</a></li>
              </ul>
            </nav>
            
            <div class="auth-buttons">
              <button class="login-btn" data-route="login">
                <i class="fa-solid fa-user"></i> Login
              </button>
            </div>
            
            <button class="menu-toggle" aria-label="Menu">
              <span class="bar"></span>
              <span class="bar"></span>
              <span class="bar"></span>
            </button>
          </div>
          <div class="overlay"></div>
        </header>
      `;
    }

    this.setupEventListeners();
    this.highlightCurrentPage();
  }

  setupEventListeners() {
    const links = this.querySelectorAll(".nav-link");
    links.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const route = link.getAttribute("data-route");

        links.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");

        this.closeMenu();

        if (route === "home") window.location.href = "/";
        else if (route === "produtos") window.navegarParaProdutos();
        else if (route === "categorias") window.navegarParaCategorias();
        else if (route === "cadastrar-produtos") window.navegarParaCadastrarProdutos();
        else if (route === "dashboard") window.navegarParaDashboard();
        else if (route === "usuarios") window.navegarParaUsuarios();
      });
    });

    this.setupMobileMenu();
  }

  setupMobileMenu() {
    const menuToggle = this.querySelector(".menu-toggle");
    const navBar = this.querySelector(".nav-bar");
    const overlay = this.querySelector(".overlay");

    if (menuToggle && navBar && overlay) {
      menuToggle.addEventListener("click", () => this.toggleMenu());
      overlay.addEventListener("click", () => this.closeMenu());
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") this.closeMenu(); });
      window.addEventListener("resize", () => { if (window.innerWidth > 900) this.closeMenu(); });
    }
  }

  toggleMenu() {
    const navBar = this.querySelector(".nav-bar");
    const menuToggle = this.querySelector(".menu-toggle");
    const overlay = this.querySelector(".overlay");

    navBar.classList.toggle("active");
    menuToggle.classList.toggle("active");
    overlay.classList.toggle("active");

    document.body.style.overflow = navBar.classList.contains("active") ? "hidden" : "";
  }

  closeMenu() {
    const navBar = this.querySelector(".nav-bar");
    const menuToggle = this.querySelector(".menu-toggle");
    const overlay = this.querySelector(".overlay");

    if (navBar.classList.contains("active")) {
      navBar.classList.remove("active");
      menuToggle.classList.remove("active");
      overlay.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  highlightCurrentPage() {
    const path = window.location.pathname;
    const links = this.querySelectorAll(".nav-link");

    links.forEach((link) => {
      link.classList.remove("active");
      if (
        (path === "/" && link.getAttribute("data-route") === "home") ||
        (path.includes("/produtos") && link.getAttribute("data-route") === "produtos") ||
        (path.includes("/categorias") && link.getAttribute("data-route") === "categorias") ||
        (path.includes("/cadastrar-produtos") && link.getAttribute("data-route") === "cadastrar-produtos") ||
        (path.includes("/dashboard") && link.getAttribute("data-route") === "dashboard") ||
        (path.includes("/usuarios") && link.getAttribute("data-route") === "usuarios")
      ) {
        link.classList.add("active");
      }
    });
  }
}

customElements.define("header-component", Header);
