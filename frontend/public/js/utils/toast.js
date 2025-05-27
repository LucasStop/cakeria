(function () {
  if (window.Toast) {
    console.warn('Toast já está definido globalmente. Não será reinstanciado.');
    return;
  }

  const Toast = {
    defaultOptions: {
      duration: 4000,
      position: 'bottom-right',
      closeButton: true,
      pauseOnHover: true,
      title: null,
      zIndex: 99999,
    },

    container: null,
    cssLoaded: false,
    debug: true,

    init() {
      if (this.debug) console.log('[Toast] Inicializando sistema de Toast');

      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);

        if (this.debug) console.log('[Toast] Contêiner criado e anexado ao body');
      }

      this.ensureToastCssLoaded();
    },

    ensureToastCssLoaded() {
      if (this.cssLoaded) return;

      if (this.debug) console.log('[Toast] Verificando se o CSS está carregado');

      if (!document.querySelector('link[href*="toast.css"]')) {
        if (this.debug) console.log('[Toast] CSS não encontrado, carregando dinamicamente');

        const toastStyle = document.createElement('link');
        toastStyle.rel = 'stylesheet';
        toastStyle.href = '/css/toast.css';
        document.head.appendChild(toastStyle);

        toastStyle.onload = () => {
          this.cssLoaded = true;
          if (this.debug) console.log('[Toast] CSS carregado com sucesso');
        };

        toastStyle.onerror = () => {
          console.error('[Toast] Erro ao carregar CSS do toast');
          this.addFallbackStyles();
        };
      } else {
        this.cssLoaded = true;
        if (this.debug) console.log('[Toast] CSS já estava carregado');
      }
    },

    addFallbackStyles() {
      const style = document.createElement('style');
      style.textContent = `
        .toast-container { 
          position: fixed; 
          z-index: 9999; 
          pointer-events: none;
        }
        .toast-container.bottom-right { bottom: 20px; right: 20px; }
        .toast-container.bottom-left { bottom: 20px; left: 20px; }
        .toast-container.top-right { top: 20px; right: 20px; }
        .toast-container.top-left { top: 20px; left: 20px; }
        .toast-container.top-center { top: 20px; left: 50%; transform: translateX(-50%); }
        .toast-container.bottom-center { bottom: 20px; left: 50%; transform: translateX(-50%); }
        
        .custom-toast {
          background: white;
          color: #333;
          padding: 15px;
          border-radius: 4px;
          max-width: 350px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          margin-bottom: 10px;
          pointer-events: auto;
          opacity: 0;
          transform: translateY(15px);
          transition: all 0.3s ease;
        }
        .custom-toast.show {
          opacity: 1;
          transform: translateY(0);
        }
        .custom-toast.info { border-left: 4px solid #2196F3; }
        .custom-toast.success { border-left: 4px solid #4CAF50; }
        .custom-toast.error { border-left: 4px solid #F44336; }
        .custom-toast.warning { border-left: 4px solid #FFC107; }
        
        .toast-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        .toast-close {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
        }
      `;
      document.head.appendChild(style);
      this.cssLoaded = true;
      if (this.debug) console.log('[Toast] Estilos de fallback adicionados');
    },

    create(message, options = {}) {
      try {
        this.init();

        const settings = { ...this.defaultOptions, ...options };

        if (this.debug) console.log('[Toast] Criando toast com mensagem:', message);

        const toast = document.createElement('div');
        toast.className = `custom-toast ${settings.type || 'info'}`;

        this.container.className = `toast-container ${settings.position || 'bottom-right'}`;

        let toastContent = '';

        if (settings.title || settings.closeButton) {
          toastContent += '<div class="toast-header">';

          if (settings.title) {
            toastContent += `<span class="toast-title">${settings.title}</span>`;
          }

          if (settings.closeButton) {
            toastContent += '<button class="toast-close">&times;</button>';
          }

          toastContent += '</div>';
        }

        let iconClass = 'fa-info-circle';
        if (settings.type === 'success') iconClass = 'fa-check-circle';
        if (settings.type === 'error') iconClass = 'fa-exclamation-circle';
        if (settings.type === 'warning') iconClass = 'fa-exclamation-triangle';

        toastContent += `
          <div class="toast-message">
            <div class="toast-icon">
              <i class="fas ${iconClass}"></i>
            </div>
            <div class="toast-content">
              ${message}
            </div>
          </div>
        `;

        toast.innerHTML = toastContent;

        this.container.appendChild(toast);

        setTimeout(() => {
          toast.classList.add('show');
        }, 10);

        if (settings.closeButton) {
          const closeBtn = toast.querySelector('.toast-close');
          if (closeBtn) {
            closeBtn.addEventListener('click', () => {
              this.remove(toast);
            });
          }
        }

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

        if (settings.duration > 0) {
          setTimeout(() => {
            this.remove(toast);
          }, settings.duration);
        }

        if (this.debug) console.log('[Toast] Toast criado com sucesso');

        return toast;
      } catch (error) {
        console.error('[Toast] Erro ao criar toast:', error);
        this.showFallbackToast(message, options.type || 'info');
      }
    },

    remove(toast) {
      if (!toast) return;

      toast.classList.remove('show');
      toast.classList.add('hide');

      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
          if (this.debug) console.log('[Toast] Toast removido');
        }
      }, 300);
    },

    showFallbackToast(message, type) {
      console.log(`[Toast Fallback] ${type}: ${message}`);

      const toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.right = '20px';
      toast.style.background = 'white';
      toast.style.color = '#333';
      toast.style.padding = '10px 20px';
      toast.style.borderRadius = '4px';
      toast.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
      toast.style.zIndex = '9999';
      toast.style.maxWidth = '350px';

      const colors = {
        success: '#4CAF50',
        error: '#F44336',
        warning: '#FFC107',
        info: '#2196F3',
      };

      toast.style.borderLeft = `4px solid ${colors[type] || colors.info}`;
      toast.textContent = message;

      document.body.appendChild(toast);

      setTimeout(() => {
        if (toast.parentNode) {
          document.body.removeChild(toast);
        }
      }, 5000);
    },

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
    },
  };

  window.Toast = Toast;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      Toast.init();
    });
  } else {
    Toast.init();
  }
})();

window.addEventListener('load', function () {
  setTimeout(() => {
    if (window.Toast && !window.Toast._hasShownFirstToast) {
      console.log("Toast está disponível. Use window.Toast.info('mensagem') para testá-lo.");
    }
  }, 1000);
});

window.testToast = function () {
  if (window.Toast) {
    window.Toast.info('Teste de notificação - Isso deve estar visível!', {
      position: 'bottom-right',
      duration: 3000,
    });
    window.Toast._hasShownFirstToast = true;
    return 'Toast exibido! Se você não vir nada, verifique os erros no console.';
  } else {
    console.error('Objeto Toast não está disponível!');
    return 'Erro: Toast não está disponível.';
  }
};
