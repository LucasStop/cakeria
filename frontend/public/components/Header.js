class Header extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const variant = this.getAttribute('variant') || 'user';

    if (variant === 'user') {
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
                <li><a href="/receitas" class="nav-link" id="nav-receitas" data-route="receitas"><i class="fa-solid fa-book-open"></i> Receitas</a></li>
                <li><a href="/sobre" class="nav-link" id="nav-sobre" data-route="sobre"><i class="fa-solid fa-info-circle"></i> Sobre</a></li>
                <li><a href="/admin" class="nav-link" id="nav-admin" data-route="admin"><i class="fa-solid fa-user-shield"></i> Admin</a></li>
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
    } else if (variant === 'admin') {
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
                <li><a href="/categorias" class="nav-link" id="nav-categorias" data-route="categorias"><i class="fa-solid fa-tags"></i> Categorias</a></li>
                <li><a href="/dashboard" class="nav-link" id="nav-dashboard" data-route="dashboard"><i class="fa-solid fa-chart-line"></i> Dashboard</a></li>
                <li><a href="/usuarios" class="nav-link" id="nav-usuarios" data-route="usuarios"><i class="fa-solid fa-users"></i> Usuários</a></li>
              </ul>
            </nav>
            
            <div class="auth-buttons">
              <button class="logout-btn" data-route="logout">
                <i class="fa-solid fa-sign-out-alt"></i> Sair
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
    const links = this.querySelectorAll('.nav-link');
    links.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const route = link.getAttribute('data-route');

        // Remover classe 'active' de todos os links
        links.forEach(l => l.classList.remove('active'));

        // Adicionar classe 'active' ao link clicado
        link.classList.add('active');

        // Fechar o menu mobile se estiver aberto
        this.closeMenu();

        // Navegar para a rota
        this.navigateToRoute(route);
      });
    });

    // Adicionar eventos para os botões de autenticação
    const loginBtn = this.querySelector('.login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        this.closeMenu();
        window.navegarParaLogin();
      });
    }

    const logoutBtn = this.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.closeMenu();
        this.handleLogout();
      });
    }

    // Configurar menu mobile
    this.setupMobileMenu();
  }

  navigateToRoute(route) {
    switch (route) {
      case 'home':
        window.location.href = '/';
        break;
      case 'produtos':
        window.navegarParaProdutos();
        break;
      case 'categorias':
        window.navegarParaCategorias();
        break;
      case 'receitas':
        window.navegarParaReceitas();
        break;
      case 'sobre':
        window.navegarParaSobre();
        break;
      case 'admin':
        window.navegarParaAdmin();
        break;
      case 'cadastrar-produtos':
        window.navegarParaCadastrarProdutos();
        break;
      case 'dashboard':
        window.navegarParaDashboard();
        break;
      case 'usuarios':
        window.navegarParaUsuarios();
        break;
      default:
        console.warn(`Rota desconhecida: ${route}`);
    }
  }

  handleLogout() {
    // Remover token e dados do usuário
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Redirecionar para a página inicial
    window.location.href = '/';
  }

  setupMobileMenu() {
    const menuToggle = this.querySelector('.menu-toggle');
    const navBar = this.querySelector('.nav-bar');
    const overlay = this.querySelector('.overlay');

    if (menuToggle && navBar && overlay) {
      menuToggle.addEventListener('click', () => this.toggleMenu());
      overlay.addEventListener('click', () => this.closeMenu());

      // Fechar menu ao pressionar ESC
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') this.closeMenu();
      });

      // Ajustar menu ao redimensionar a janela
      window.addEventListener('resize', () => {
        if (window.innerWidth > 900 && navBar.classList.contains('active')) {
          this.closeMenu();
        }
      });
    }
  }

  toggleMenu() {
    const navBar = this.querySelector('.nav-bar');
    const menuToggle = this.querySelector('.menu-toggle');
    const overlay = this.querySelector('.overlay');

    navBar.classList.toggle('active');
    menuToggle.classList.toggle('active');
    overlay.classList.toggle('active');

    document.body.style.overflow = navBar.classList.contains('active') ? 'hidden' : '';
  }

  closeMenu() {
    const navBar = this.querySelector('.nav-bar');
    if (!navBar || !navBar.classList.contains('active')) return;

    const menuToggle = this.querySelector('.menu-toggle');
    const overlay = this.querySelector('.overlay');

    navBar.classList.remove('active');
    menuToggle.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  highlightCurrentPage() {
    const path = window.location.pathname;
    const links = this.querySelectorAll('.nav-link');

    links.forEach(link => {
      link.classList.remove('active');
      const route = link.getAttribute('data-route');

      if (
        (path === '/' && route === 'home') ||
        (path.includes('/produtos') && route === 'produtos') ||
        (path.includes('/categorias') && route === 'categorias') ||
        (path.includes('/receitas') && route === 'receitas') ||
        (path.includes('/sobre') && route === 'sobre') ||
        (path.includes('/admin') && route === 'admin') ||
        (path.includes('/cadastrar-produtos') && route === 'cadastrar-produtos') ||
        (path.includes('/dashboard') && route === 'dashboard') ||
        (path.includes('/usuarios') && route === 'usuarios')
      ) {
        link.classList.add('active');
      }
    });
  }
}

customElements.define('header-component', Header);
