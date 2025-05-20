/**
 * Sistema de notificações Toast aprimorado
 * Versão com correção de bugs
 */

// IIFE para evitar conflitos globais
(function() {
  // Verificar se o Toast já existe globalmente
  if (window.Toast) {
    console.warn('Toast já está definido globalmente. Não será reinstanciado.');
    return;
  }

  // Namespace para o sistema Toast
  const Toast = {
    defaultOptions: {
      duration: 4000,
      position: 'bottom-right',
      closeButton: true,
      pauseOnHover: true,
      title: null
    },

    container: null,
    cssLoaded: false,
    debug: true, // Habilitar logs para depuração

    // Inicializar o sistema de Toast
    init() {
      if (this.debug) console.log('[Toast] Inicializando sistema de Toast');
      
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
        
        if (this.debug) console.log('[Toast] Contêiner criado e anexado ao body');
      }
      
      // Garantir que o CSS esteja carregado
      this.ensureToastCssLoaded();
    },
    
    // Garantir que o CSS do toast esteja carregado
    ensureToastCssLoaded() {
      if (this.cssLoaded) return;
      
      if (this.debug) console.log('[Toast] Verificando se o CSS está carregado');
      
      // Verificar se o CSS do toast já está carregado
      if (!document.querySelector('link[href*="toast.css"]')) {
        if (this.debug) console.log('[Toast] CSS não encontrado, carregando dinamicamente');
        
        // Carregar o CSS do toast dinamicamente
        const toastStyle = document.createElement('link');
        toastStyle.rel = 'stylesheet';
        toastStyle.href = '/css/toast.css';
        document.head.appendChild(toastStyle);
        
        // Adicionar evento para verificar quando o CSS for carregado
        toastStyle.onload = () => {
          this.cssLoaded = true;
          if (this.debug) console.log('[Toast] CSS carregado com sucesso');
        };
        
        // Adicionar fallback caso o carregamento falhe
        toastStyle.onerror = () => {
          console.error('[Toast] Erro ao carregar CSS do toast');
          this.addFallbackStyles();
        };
      } else {
        this.cssLoaded = true;
        if (this.debug) console.log('[Toast] CSS já estava carregado');
      }
    },
    
    // Adicionar estilos de fallback caso o CSS não carregue
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

    // Criar um novo toast
    create(message, options = {}) {
      try {
        this.init();
        
        const settings = { ...this.defaultOptions, ...options };
        
        if (this.debug) console.log('[Toast] Criando toast com mensagem:', message);
        
        // Criar elemento toast
        const toast = document.createElement('div');
        toast.className = `custom-toast ${settings.type || 'info'}`;
        
        // Configurar o contêiner de acordo com a posição
        this.container.className = `toast-container ${settings.position || 'bottom-right'}`;
        
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
        
        // Ícone baseado no tipo
        let iconClass = 'fa-info-circle';
        if (settings.type === 'success') iconClass = 'fa-check-circle';
        if (settings.type === 'error') iconClass = 'fa-exclamation-circle';
        if (settings.type === 'warning') iconClass = 'fa-exclamation-triangle';
        
        // Mensagem com ícone
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
        
        if (this.debug) console.log('[Toast] Toast criado com sucesso');
        
        return toast;
      } catch (error) {
        console.error('[Toast] Erro ao criar toast:', error);
        // Tentar criar um toast de fallback muito simples
        this.showFallbackToast(message, options.type || 'info');
      }
    },
    
    // Remover um toast
    remove(toast) {
      if (!toast) return;
      
      toast.classList.remove('show');
      toast.classList.add('hide');
      
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
          if (this.debug) console.log('[Toast] Toast removido');
        }
      }, 300); // Tempo para a animação de saída
    },
    
    // Toast bem simples para fallback em caso de erro crítico
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
      
      // Cor específica de acordo com o tipo
      const colors = {
        success: '#4CAF50',
        error: '#F44336',
        warning: '#FFC107',
        info: '#2196F3'
      };
      
      toast.style.borderLeft = `4px solid ${colors[type] || colors.info}`;
      toast.textContent = message;
      
      document.body.appendChild(toast);
      
      // Auto-remover após 5 segundos
      setTimeout(() => {
        if (toast.parentNode) {
          document.body.removeChild(toast);
        }
      }, 5000);
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

  // Expor o objeto global
  window.Toast = Toast;
  
  // Verificar se o DOM já está carregado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      Toast.init();
    });
  } else {
    // O DOM já está carregado
    Toast.init();
  }
})();

// Adicionar evento de verificação para alertar se o Toast está funcionando
window.addEventListener('load', function() {
  setTimeout(() => {
    if (window.Toast && !window.Toast._hasShownFirstToast) {
      console.log("Toast está disponível. Use window.Toast.info('mensagem') para testá-lo.");
    }
  }, 1000);
});

// Função de debug para testar o Toast
window.testToast = function() {
  if (window.Toast) {
    window.Toast.info('Teste de notificação - Isso deve estar visível!', {
      position: 'top-center',
      duration: 3000
    });
    window.Toast._hasShownFirstToast = true;
    return "Toast exibido! Se você não vir nada, verifique os erros no console.";
  } else {
    console.error("Objeto Toast não está disponível!");
    return "Erro: Toast não está disponível.";
  }
};
