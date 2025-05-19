class Footer extends HTMLElement {
  constructor() {
    super();
  }

  async connectedCallback() {
    try {
      const response = await fetch('/components/Footer.html');
      if (!response.ok) {
        throw new Error(`Erro ao carregar o template do Footer: ${response.status}`);
      }

      const html = await response.text();
      this.innerHTML = html;

      this.setupEventListeners();
    } catch (error) {
      console.error('Não foi possível carregar o componente Footer:', error);
      this.innerHTML = '<p>Erro ao carregar o componente Footer</p>';
    }
  }

  setupEventListeners() {
    const links = this.querySelectorAll('.footer-links a');
    links.forEach(link => {
      link.addEventListener('click', e => {
        const href = link.getAttribute('href');

        if (href === '/') {
          return;
        }

        e.preventDefault();

        if (href.includes('/produtos')) {
          window.navegarParaProdutos();
        } else if (href.includes('/categorias')) {
          window.navegarParaCategorias();
        } else if (href.includes('/sobre')) {
          window.navegarParaSobre();
        } else if (href.includes('/login')) {
          window.navegarParaLogin();
        } else if (href.includes('/registro')) {
          window.navegarParaRegistro();
        }
      });
    });
  }
}

if (!customElements.get('footer-component')) {
  customElements.define('footer-component', Footer);
}
