class Header extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const variant = this.getAttribute('variant') || 'user';

    if (variant === 'user') {
      // Verificar se o usuário está logado
      const isLoggedIn = localStorage.getItem('token') !== null;
      const user = this.getCurrentUser();
      
      this.innerHTML = `
        <header class="header">
          <div class="container">
            <div class="logo-container">
              <img src="/assets/logo_cakeria.png" alt="Cakeria Logo" class="header-logo">
            </div>
            
            <nav class="nav-bar">
              <ul class="nav-links">
                <li><a href="/index.html" class="nav-link" data-route="home"><i class="fa-solid fa-home"></i> Home</a></li>
                <li><a href="/receitas.html" class="nav-link" data-route="receitas"><i class="fa-solid fa-utensils"></i> Receitas</a></li>
                <li><a href="/categorias" class="nav-link" id="nav-categorias" data-route="categorias"><i class="fa-solid fa-tags"></i> Categorias</a></li>
                <li><a href="/sobre.html" class="nav-link" id="nav-sobre" data-route="sobre"><i class="fa-solid fa-info-circle"></i> Sobre</a></li>
                ${isLoggedIn && user?.isAdmin ? `<li><a href="/admin.html" class="nav-link" id="nav-admin" data-route="admin"><i class="fa-solid fa-user-shield"></i> Admin</a></li>` : ''}
              </ul>
            </nav>
            
            <div class="auth-buttons">
              ${isLoggedIn 
                ? `<div class="user-menu">
                    <div class="user-profile" id="user-profile-toggle">
                      <div class="user-avatar">
                        <div class="avatar-placeholder">
                          <span class="avatar-initial">${this.getUserInitials(user)}</span>
                        </div>
                      </div>
                      <span class="username">${user?.name || user?.email || 'Usuário'}</span>
                      <i class="fa-solid fa-chevron-down"></i>
                    </div>
                    <div class="dropdown-menu">
                      <a href="/perfil.html" class="dropdown-item">
                        <i class="fa-solid fa-user"></i> Meu Perfil
                      </a>
                      <a href="/pedidos/meus-pedidos.html" class="dropdown-item">
                        <i class="fa-solid fa-shopping-bag"></i> Meus Pedidos
                      </a>
                      <a href="/favoritos.html" class="dropdown-item">
                        <i class="fa-solid fa-heart"></i> Favoritos
                      </a>
                      <div class="dropdown-divider"></div>
                      <button class="dropdown-item logout-btn">
                        <i class="fa-solid fa-sign-out-alt"></i> Sair
                      </button>
                    </div>
                  </div>`
                : `<button class="login-btn" data-route="login">
                    <i class="fa-solid fa-user"></i> Login
                  </button>`
              }
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
                <li><a href="/admin" class="nav-link" data-route="admin"><i class="fa-solid fa-home"></i> Home</a></li>
                <li><a href="/categorias" class="nav-link" id="nav-categorias" data-route="categorias"><i class="fa-solid fa-tags"></i> Categorias</a></li>
                <li><a href="/registerProduct" class="nav-link" data-route="registerProduct"><i class="fa-solid fa-cake-candles"></i> Produtos</a></li>
                <li><a href="/dashboard" class="nav-link" id="nav-dashboard" data-route="dashboard"><i class="fa-solid fa-chart-line"></i> Dashboard</a></li>
                <li><a href="/usuarios" class="nav-link" id="nav-usuarios" data-route="usuarios"><i class="fa-solid fa-users"></i> Usuários</a></li>
              </ul>
            </nav>
            
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

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      return null;
    }
  }

  getUserInitials(user) {
    if (!user) return '?';
    
    if (user.name) {
      const nameParts = user.name.split(' ');
      let initials = nameParts[0][0];
      
      if (nameParts.length > 1) {
        initials += nameParts[nameParts.length - 1][0];
      }
      
      return initials.toUpperCase();
    } else if (user.email) {
      return user.email[0].toUpperCase();
    }
    
    return '?';
  }

  setupEventListeners() {
    const userProfileToggle = this.querySelector('#user-profile-toggle');
    if (userProfileToggle) {
      const dropdownMenu = this.querySelector('.dropdown-menu');
      
      userProfileToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
      });
      
      document.addEventListener('click', () => {
        if (dropdownMenu.classList.contains('show')) {
          dropdownMenu.classList.remove('show');
        }
      });
      
      dropdownMenu.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
    
    const links = this.querySelectorAll('.nav-link');
    links.forEach(link => {
      link.addEventListener('click', e => {
        const href = link.getAttribute('href');
        if (href && href.includes('.html')) {
          return;
        }
        
        e.preventDefault();
        const route = link.getAttribute('data-route');

        links.forEach(l => l.classList.remove('active'));

        link.classList.add('active');

        this.closeMenu();

        this.navigateToRoute(route);
      });
    });

    const loginBtn = this.querySelector('.login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        this.closeMenu();
        window.location.href = '/login.html';
      });
    }

    const logoutBtn = this.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.closeMenu();
        this.handleLogout();
      });
    }

    this.setupMobileMenu();
  }

  navigateToRoute(route) {
    switch (route) {
      case 'home':
        window.location.href = '/index.html';
        break;
      case 'categorias':
        window.navegarParaCategorias();
        break;
      case 'sobre':
        window.navegarParaSobre();
        break;
      case 'admin':
        window.navegarParaAdmin();
        break;
      case 'registerProduct':
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    window.location.href = '/index.html';
  }

  setupMobileMenu() {
    const menuToggle = this.querySelector('.menu-toggle');
    const navBar = this.querySelector('.nav-bar');
    const overlay = this.querySelector('.overlay');

    if (menuToggle && navBar && overlay) {
      menuToggle.addEventListener('click', () => this.toggleMenu());
      overlay.addEventListener('click', () => this.closeMenu());

      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') this.closeMenu();
      });

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

    if (navBar.classList.contains('active')) {
      const isLoggedIn = localStorage.getItem('token') !== null;
      const loginButtonExists = navBar.querySelector('.mobile-login-btn');
      
      if (!isLoggedIn && !loginButtonExists) {
        const navLinks = navBar.querySelector('.nav-links');
        const loginButton = document.createElement('li');
        loginButton.className = 'mobile-login-item';
        loginButton.innerHTML = `
          <a href="/login.html" class="nav-link mobile-login-btn">
            <i class="fa-solid fa-user"></i> Login
          </a>
        `;
        navLinks.appendChild(loginButton);
        
        const loginBtn = loginButton.querySelector('.mobile-login-btn');
        loginBtn.addEventListener('click', () => {
          this.closeMenu();
          window.location.href = '/login.html';
        });
      }
    } else {
      const mobileLoginItem = navBar.querySelector('.mobile-login-item');
      if (mobileLoginItem) {
        mobileLoginItem.remove();
      }
    }

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
    
    const mobileLoginItem = navBar.querySelector('.mobile-login-item');
    if (mobileLoginItem) {
      mobileLoginItem.remove();
    }
    
    document.body.style.overflow = '';
  }

  highlightCurrentPage() {
    const path = window.location.pathname;
    const links = this.querySelectorAll('.nav-link');

    links.forEach(link => {
      link.classList.remove('active');
      const route = link.getAttribute('data-route');

      if (
        ((path === '/' || path === '/index.html') && route === 'home') ||
        (path.includes('/produtos') && route === 'produtos') ||
        (path.includes('/categorias') && route === 'categorias') ||
        (path.includes('/sobre') && route === 'sobre') ||
        (path.includes('/admin') && route === 'admin') ||
        (path.includes('/registerProduct') && route === 'registerProduct') ||
        (path.includes('/dashboard') && route === 'dashboard') ||
        (path.includes('/usuarios') && route === 'usuarios')
      ) {
        link.classList.add('active');
      }
    });
  }
}

customElements.define('header-component', Header);
