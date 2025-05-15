/**
 * Sistema de notificações Toast
 * 
 * Uso:
 * Toast.success('Operação realizada com sucesso!')
 * Toast.error('Ocorreu um erro ao processar sua solicitação.')
 * Toast.warning('Atenção! Esta ação não pode ser desfeita.')
 * Toast.info('O sistema será atualizado em breve.')
 */

const Toast = {
  // Configurações padrão
  defaultOptions: {
    duration: 3000,         // Duração do toast em milissegundos
    position: 'top-right',  // Posição: 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'
    closeButton: true,      // Mostrar botão de fechar
    pauseOnHover: true,     // Pausar contagem quando passar o mouse
    showProgress: true,     // Mostrar barra de progresso
    maxVisible: 5           // Número máximo de toasts visíveis simultaneamente
  },

  // Contêiner principal para todos os toasts
  container: null,
  
  // Array para armazenar toasts ativos
  activeToasts: [],
  
  // Inicializar o sistema de toast
  init() {
    if (this.container) return;
    
    // Criar contêiner principal
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
    
    // Adicionar estilos CSS
    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        .toast-container {
          position: fixed;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 350px;
          box-sizing: border-box;
        }
        
        .toast-container.top-right { top: 20px; right: 20px; }
        .toast-container.top-left { top: 20px; left: 20px; }
        .toast-container.bottom-right { bottom: 20px; right: 20px; }
        .toast-container.bottom-left { bottom: 20px; left: 20px; }
        .toast-container.top-center { top: 20px; left: 50%; transform: translateX(-50%); }
        .toast-container.bottom-center { bottom: 20px; left: 50%; transform: translateX(-50%); }
        
        .toast {
          background-color: #ffffff;
          color: #333333;
          padding: 15px;
          border-radius: 8px;
          min-width: 250px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: flex-start;
          opacity: 0;
          transform: translateY(-20px);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .toast.visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        .toast.success { border-left: 4px solid #4CAF50; }
        .toast.error { border-left: 4px solid #F44336; }
        .toast.warning { border-left: 4px solid #FFC107; }
        .toast.info { border-left: 4px solid #2196F3; }
        
        .toast-icon {
          margin-right: 12px;
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .toast.success .toast-icon { color: #4CAF50; }
        .toast.error .toast-icon { color: #F44336; }
        .toast.warning .toast-icon { color: #FFC107; }
        .toast.info .toast-icon { color: #2196F3; }
        
        .toast-content {
          flex-grow: 1;
        }
        
        .toast-title {
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .toast-message {
          margin: 0;
          font-size: 14px;
        }
        
        .toast-close {
          background: none;
          border: none;
          color: #999;
          cursor: pointer;
          font-size: 16px;
          padding: 0;
          margin-left: 10px;
          flex-shrink: 0;
        }
        
        .toast-close:hover {
          color: #333;
        }
        
        .toast-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          width: 0;
          opacity: 0.7;
          transition: width linear;
        }
        
        .toast.success .toast-progress { background-color: #4CAF50; }
        .toast.error .toast-progress { background-color: #F44336; }
        .toast.warning .toast-progress { background-color: #FFC107; }
        .toast.info .toast-progress { background-color: #2196F3; }
      `;
      document.head.appendChild(style);
    }
  },

  // Criar um toast
  show(message, options = {}) {
    // Garantir que o sistema esteja inicializado
    this.init();
    
    // Mesclar opções padrão com opções fornecidas
    const settings = {...this.defaultOptions, ...options};
    
    // Atualizar a posição do contêiner
    this.container.className = `toast-container ${settings.position}`;
    
    // Limitar o número de toasts visíveis
    while (this.activeToasts.length >= settings.maxVisible) {
      this.dismiss(this.activeToasts[0]);
    }
    
    // Criar elemento toast
    const toast = document.createElement('div');
    toast.className = `toast ${settings.type || 'info'}`;
    
    // Criar conteúdo do toast
    const icon = this.getIconForType(settings.type);
    
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        ${settings.title ? `<div class="toast-title">${settings.title}</div>` : ''}
        <p class="toast-message">${message}</p>
      </div>
      ${settings.closeButton ? `<button class="toast-close">&times;</button>` : ''}
      ${settings.showProgress ? `<div class="toast-progress"></div>` : ''}
    `;
    
    // Adicionar ao contêiner
    this.container.appendChild(toast);
    
    // Adicionar à lista de toasts ativos
    const toastId = Date.now();
    this.activeToasts.push(toastId);
    
    // Referência ao toast para uso em escopos internos
    toast.dataset.id = toastId;
    
 
    if (settings.closeButton) {
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => this.dismiss(toastId));
    }
    
   
    let progressBar = null;
    
    if (settings.showProgress && settings.duration > 0) {
      progressBar = toast.querySelector('.toast-progress');
      let isPaused = false;
      
      if (settings.pauseOnHover) {
        toast.addEventListener('mouseenter', () => { isPaused = true; });
        toast.addEventListener('mouseleave', () => { isPaused = false; });
      }
      
      const startTime = Date.now();
      const interval = setInterval(() => {
        if (!isPaused) {
          const elapsed = Date.now() - startTime;
          const width = (elapsed / settings.duration) * 100;
          progressBar.style.width = `${Math.min(width, 100)}%`;
          
          if (elapsed >= settings.duration) {
            clearInterval(interval);
            this.dismiss(toastId);
          }
        }
      }, 10);
    } else if (settings.duration > 0) {
     
      setTimeout(() => this.dismiss(toastId), settings.duration);
    }
    
   
    setTimeout(() => toast.classList.add('visible'), 10);
    
    return toastId;
  },
  
 
  dismiss(toastId) {
    const index = this.activeToasts.indexOf(toastId);
    if (index !== -1) {
      this.activeToasts.splice(index, 1);
    }
    
    const toast = this.container.querySelector(`.toast[data-id="${toastId}"]`);
    if (toast) {
      toast.classList.remove('visible');
      
     
      setTimeout(() => {
        if (toast.parentNode === this.container) {
          this.container.removeChild(toast);
        }
      }, 300); 
    }
  },
  
  
  success(message, options = {}) {
    return this.show(message, {
      ...options, 
      type: 'success',
      title: options.title || 'Sucesso!'
    });
  },
  
  error(message, options = {}) {
    return this.show(message, {
      ...options, 
      type: 'error',
      title: options.title || 'Erro!'
    });
  },
  
  warning(message, options = {}) {
    return this.show(message, {
      ...options, 
      type: 'warning',
      title: options.title || 'Atenção!'
    });
  },
  
  info(message, options = {}) {
    return this.show(message, {
      ...options, 
      type: 'info',
      title: options.title || 'Informação'
    });
  },
  
  // Ícones para os diferentes tipos
  getIconForType(type) {
    switch (type) {
      case 'success':
        return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
      case 'error':
        return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
      case 'warning':
        return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
      case 'info':
      default:
        return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }
  }
};

// Exportar para uso global
window.Toast = Toast;
