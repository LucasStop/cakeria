/**
 * Sistema de notificações Toast aprimorado
 */
const Toast = {
  defaultOptions: {
    duration: 4000,
    position: 'bottom-right',
    closeButton: true,
    pauseOnHover: true,
    title: null
  },

  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.style.position = 'fixed';
      this.container.style.zIndex = '9999';
      document.body.appendChild(this.container);
    }
  },

  create(message, options = {}) {
    this.init();
    
    const settings = { ...this.defaultOptions, ...options };
    
    // Criar elemento toast
    const toast = document.createElement('div');
    toast.className = `custom-toast ${settings.type || 'info'}`;
    
    // Posicionar conforme configuração
    switch (settings.position) {
      case 'top-left':
        this.container.style.top = '20px';
        this.container.style.left = '20px';
        break;
      case 'top-right':
        this.container.style.top = '20px';
        this.container.style.right = '20px';
        break;
      case 'top-center':
        this.container.style.top = '20px';
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        break;
      case 'bottom-left':
        this.container.style.bottom = '20px';
        this.container.style.left = '20px';
        break;
      case 'bottom-center':
        this.container.style.bottom = '20px';
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        break;
      case 'bottom-right':
      default:
        this.container.style.bottom = '20px';
        this.container.style.right = '20px';
        break;
    }
    
    // Conteúdo do toast
    let toastContent = '';
    
    // Adicionar cabeçalho se tiver título ou botão de fechar
    if (settings.title || settings.closeButton) {
      toastContent += '<div class="toast-header">';
      
      // Título
      if (settings.title) {
        toastContent += `<span class="toast-title">${settings.title}</span>`;
      }
      
      // Botão de fechar
      if (settings.closeButton) {
        toastContent += '<button class="toast-close">&times;</button>';
      }
      
      toastContent += '</div>';
    }
    
    // Mensagem
    toastContent += `<div class="toast-message">${message}</div>`;
    
    toast.innerHTML = toastContent;
    
    // Adicionar ao container
    this.container.appendChild(toast);
    
    // Mostrar com animação
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Configurar eventos
    if (settings.closeButton) {
      const closeBtn = toast.querySelector('.toast-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.remove(toast);
        });
      }
    }
    
    // Pausar timer quando mouse estiver sobre o toast
    if (settings.pauseOnHover) {
      let timeoutId;
      
      toast.addEventListener('mouseenter', () => {
        clearTimeout(timeoutId);
      });
      
      toast.addEventListener('mouseleave', () => {
        timeoutId = setTimeout(() => {
          this.remove(toast);
        }, 1000);
      });
    }
    
    // Auto remover após duração especificada
    if (settings.duration > 0) {
      setTimeout(() => {
        this.remove(toast);
      }, settings.duration);
    }
    
    return toast;
  },
  
  remove(toast) {
    toast.classList.remove('show');
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300); // Tempo para a animação de saída
  },
  
  // Métodos de conveniência
  success(message, options = {}) {
    return this.create(message, { ...options, type: 'success' });
  },
  
  error(message, options = {}) {
    return this.create(message, { ...options, type: 'error' });
  },
  
  warning(message, options = {}) {
    return this.create(message, { ...options, type: 'warning' });
  },
  
  info(message, options = {}) {
    return this.create(message, { ...options, type: 'info' });
  }
};

// Expor globalmente
window.Toast = Toast;
