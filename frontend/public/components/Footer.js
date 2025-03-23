class Footer extends HTMLElement {
  constructor() {
    super();
  }

  async connectedCallback() {
    try {
      const response = await fetch("/components/Footer.html");
      if (!response.ok) {
        throw new Error(
          `Erro ao carregar o template do Footer: ${response.status}`
        );
      }

      const html = await response.text();
      this.innerHTML = html;
    } catch (error) {
      console.error("Não foi possível carregar o componente Footer:", error);
      this.innerHTML = "<p>Erro ao carregar o componente Footer</p>";
    }
  }
}

customElements.define("footer-component", Footer);
