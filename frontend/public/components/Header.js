class Header extends HTMLElement {
  constructor() {
    super();
  }

  async connectedCallback() {
    try {
      const response = await fetch("/components/Header.html");
      if (!response.ok) {
        throw new Error(
          `Erro ao carregar o template do Header: ${response.status}`
        );
      }

      const html = await response.text();
      this.innerHTML = html;

      this.setupEventListeners();
      this.highlightCurrentPage();
    } catch (error) {
      console.error("Não foi possível carregar o componente Header:", error);
      this.innerHTML = "<p>Erro ao carregar o componente Header</p>";
    }
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

        if (route === "home") {
          window.location.href = "/";
        } else if (route === "produtos") {
          window.navegarParaProdutos();
        } else if (route === "categorias") {
          window.navegarParaCategorias();
        } else if (route === "receitas") {
          window.navegarParaReceitas();
        } else if (route === "sobre") {
          window.navegarParaSobre();
        }
      });
    });

    const loginBtn = this.querySelector(".login-btn");
    if (loginBtn) {
      loginBtn.addEventListener("click", () => {
        this.closeMenu();
        window.navegarParaLogin();
      });
    }

    this.setupMobileMenu();
  }

  setupMobileMenu() {
    const menuToggle = this.querySelector(".menu-toggle");
    const navBar = this.querySelector(".nav-bar");
    const overlay = this.querySelector(".overlay");

    if (menuToggle && navBar && overlay) {
      menuToggle.addEventListener("click", () => {
        this.toggleMenu();
      });

      overlay.addEventListener("click", () => {
        this.closeMenu();
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          this.closeMenu();
        }
      });

      window.addEventListener("resize", () => {
        if (window.innerWidth > 900 && navBar.classList.contains("active")) {
          this.closeMenu();
        }
      });
    }
  }

  toggleMenu() {
    const navBar = this.querySelector(".nav-bar");
    const menuToggle = this.querySelector(".menu-toggle");
    const overlay = this.querySelector(".overlay");

    navBar.classList.toggle("active");
    menuToggle.classList.toggle("active");
    overlay.classList.toggle("active");

    if (navBar.classList.contains("active")) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }

  closeMenu() {
    const navBar = this.querySelector(".nav-bar");
    const menuToggle = this.querySelector(".menu-toggle");
    const overlay = this.querySelector(".overlay");

    if (navBar && navBar.classList.contains("active")) {
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
        (path.includes("/produtos") &&
          link.getAttribute("data-route") === "produtos") ||
        (path.includes("/categorias") &&
          link.getAttribute("data-route") === "categorias") ||
        (path.includes("/receitas") &&
          link.getAttribute("data-route") === "receitas") ||
        (path.includes("/sobre") &&
          link.getAttribute("data-route") === "sobre")
      ) {
        link.classList.add("active");
      }
    });
  }
}

customElements.define("header-component", Header);
