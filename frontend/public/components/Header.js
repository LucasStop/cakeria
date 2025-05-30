class Header extends HTMLElement {
  constructor() {
    super();
  }

  async connectedCallback() {
    const isLoggedIn = localStorage.getItem('token') !== null;
    const user = this.getCurrentUser();
    const variant = this.getAttribute('variant') || (this.isAdmin(user) ? 'admin' : 'client');

    if (variant === 'client') {
      const isLoggedIn = localStorage.getItem('token') !== null;
      const user = this.getCurrentUser();
      let userImageUrl = '';

      if (isLoggedIn && user && user.id) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(
            `${window.API?.BASE_URL || 'http://localhost:3001/api'}/user/${user.id}/image`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (response.ok) {
            const blob = await response.blob();
            userImageUrl = URL.createObjectURL(blob);
          }
        } catch (error) {
          console.error('Error fetching user image:', error);
          userImageUrl = '';
        }
      }

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
                <li><a href="/produtos.html" class="nav-link" id="nav-produtos" data-route="produtos"><i class="fa-solid fa-box"></i> Produtos</a></li>
                <li><a href="/sobre.html" class="nav-link" id="nav-sobre" data-route="sobre"><i class="fa-solid fa-info-circle"></i> Sobre</a></li>
                ${
                  isLoggedIn && this.isAdmin(user)
                    ? `<li><a href="/admin.html" class="nav-link" id="nav-admin" data-route="admin"><i class="fa-solid fa-user-shield"></i> Admin</a></li>`
                    : ''
                }
              </ul>
            </nav>
            
            <div class="auth-buttons">
              ${
                isLoggedIn
                  ? `<div class="user-menu">
                  <a href="/carrinho.html" class="cart-icon-wrapper" title="Carrinho de Compras">
                    <i class="fa-solid fa-shopping-cart"></i>
                    <span class="cart-count">0</span>
                  </a>
                  <div class="user-profile" id="user-profile-toggle">
                    <div class="user-avatar">
                      <img src="${userImageUrl}" alt="Avatar" class="user-avatar-img">
                      <div class="avatar-placeholder" style="${userImageUrl ? 'display:none;' : 'display:flex;'};width:40px;height:40px;align-items:center;justify-content:center;">
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
                    <a href="/carrinho.html" class="dropdown-item">
                      <i class="fa-solid fa-shopping-cart"></i> Meu Carrinho
                    </a>
                    <a href="/pedidos/meus-pedidos.html" class="dropdown-item">
                      <i class="fa-solid fa-shopping-bag"></i> Meus Pedidos
                    </a>
                    ${
                      this.isAdmin(user)
                        ? `<a href="/admin.html" class="dropdown-item">
                        <i class="fa-solid fa-user-shield"></i> Área Admin
                      </a>`
                        : ''
                    }
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
      const isLoggedIn = localStorage.getItem('token') !== null;
      const user = this.getCurrentUser();
      let userImageUrl = '';

      if (isLoggedIn && user && user.id) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(
            `${window.API?.BASE_URL || 'http://localhost:3001/api'}/user/${user.id}/image`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (response.ok) {
            const blob = await response.blob();
            userImageUrl = URL.createObjectURL(blob);
          }
        } catch (error) {
          console.error('Error fetching user image:', error);
          userImageUrl = '';
        }
      }

      this.innerHTML = `
        <header class="header admin-header">
          <div class="container">
            <div class="logo-container">
              <img src="/assets/logo_cakeria.png" alt="Cakeria Logo" class="header-logo">
            </div>
            
            <nav class="nav-bar">
              <ul class="nav-links">
                <li><a href="/admin-produtos.html" class="nav-link" id="nav-produtos" data-route="produtos"><i class="fa-solid fa-box"></i> Produtos</a></li>
                <li><a href="/receitas.html" class="nav-link" data-route="receitas"><i class="fa-solid fa-utensils"></i> Receitas</a></li>
                <li><a href="/pedidos/gerenciar.html" class="nav-link" id="nav-pedidos" data-route="pedidos"><i class="fa-solid fa-shopping-cart"></i> Pedidos</a></li>
                <li><a href="/admin-users.html" class="nav-link" id="nav-usuarios" data-route="usuarios"><i class="fa-solid fa-users"></i> Usuários</a></li>
              </ul>
            </nav>
              <div class="auth-buttons">
                <div class="user-menu">
                  <div class="user-profile" id="user-profile-toggle">
                    <div class="user-avatar">
                      <img src="${userImageUrl}" alt="Avatar" class="user-avatar-img">
                      <div class="avatar-placeholder" style="${userImageUrl ? 'display:none;' : 'display:flex;'};width:40px;height:40px;align-items:center;justify-content:center;">
                        <span class="avatar-initial">${this.getUserInitials(user)}</span>
                      </div>
                    </div>
                    <span class="username">${user?.name || user?.email || 'Administrador'}</span>
                    <i class="fa-solid fa-chevron-down"></i>
                  </div>
                  <div class="dropdown-menu">
                  <a href="/perfil.html" class="dropdown-item">
                    <i class="fa-solid fa-user"></i> Meu Perfil
                  </a>
                  <a href="/index.html" class="dropdown-item">
                    <i class="fa-solid fa-home"></i> Voltar ao Site
                  </a>
                  <a href="/admin.html" class="dropdown-item">
                    <i class="fa-solid fa-user-shield"></i> Painel
                  </a>
                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item logout-btn">
                    <i class="fa-solid fa-sign-out-alt"></i> Sair
                  </button>
                </div>
              </div>
              </div>
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

    if (this.getAttribute('variant') === 'admin') {
      const linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      document.head.appendChild(linkElement);
    }
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

  isAdmin(user) {
    return user && (user.type === 'admin' || user.isAdmin === true);
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

      userProfileToggle.addEventListener('click', e => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
      });

      document.addEventListener('click', () => {
        if (dropdownMenu.classList.contains('show')) {
          dropdownMenu.classList.remove('show');
        }
      });

      dropdownMenu.addEventListener('click', e => {
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
        window.navegarParaHome();
        break;
      case 'produtos':
        window.navegarParaProdutos();
        break;
      case 'sobre':
        window.navegarParaSobre();
        break;
      case 'admin':
        window.navegarParaAdmin();
        break;
      case 'registro-produto':
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
    sessionStorage.removeItem('justLoggedIn');

    window.location.href = '/index.html?logout=true';
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
    document.body.classList.toggle('page-content-obscured');

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
    document.body.classList.remove('page-content-obscured');

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
        (path.includes('/registro-produto') && route === 'registro-produto') ||
        (path.includes('/dashboard') && route === 'dashboard') ||
        (path.includes('/usuarios') && route === 'usuarios')
      ) {
        link.classList.add('active');
      }
    });
  }
}

customElements.define('header-component', Header);

if (typeof window !== 'undefined') {
  const scriptElement = document.createElement('script');
  scriptElement.src = '/js/header-controller.js';
  document.head.appendChild(scriptElement);
}

async function loadUserImage(userId) {
  const userImage = document.getElementById('profile-user-image');
  const avatarPlaceholder = document.getElementById('profile-avatar-placeholder');
  const avatarInitials = document.getElementById('profile-avatar-initials');

  if (!userImage || !userId) return;

  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${window.API.BASE_URL}/user/${userId}/image`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      userImage.src = imageUrl;
      userImage.style.display = 'block';
      if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
    } else {
      if (avatarPlaceholder && avatarInitials) {
        const user = getCurrentUser();
        avatarInitials.textContent = getUserInitials(user);
        avatarPlaceholder.style.display = 'flex';
      }
      userImage.style.display = 'none';
    }
  } catch (e) {
    if (avatarPlaceholder && avatarInitials) {
      const user = getCurrentUser();
      avatarInitials.textContent = getUserInitials(user);
      avatarPlaceholder.style.display = 'flex';
    }
    userImage.style.display = 'none';
  }
}
