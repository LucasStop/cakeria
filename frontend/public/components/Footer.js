class Footer extends HTMLElement {
  constructor() {
    super();
    console.log('Footer component constructor initialized');
  }

  async connectedCallback() {
    console.log('Footer component connected to DOM');
    try {
      const response = await fetch('/components/Footer.html');
      if (!response.ok) {
        throw new Error(`Erro ao carregar o template do Footer: ${response.status}`);
      }

      const html = await response.text();
      this.innerHTML = html;

      this.setupEventListeners();
      console.log('Footer template carregado com sucesso');
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
  console.log('Footer component registrado');
}
