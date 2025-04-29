// Sistema de notificações toast

const Notifications = {
  containerEl: null,

  // Inicializar o container de notificações
  init() {
    if (this.containerEl) return;

    // Criar container de notificações se não existir
    this.containerEl = document.createElement('div');
    this.containerEl.className = 'toast-container';
    document.body.appendChild(this.containerEl);
  },

  // Exibir uma notificação toast
  show(options) {
    this.init();

    // Opções padrão
    const defaultOptions = {
      type: 'info',
      title: '',
      message: '',
      duration: 5000,
      closable: true,
    };

    const config = { ...defaultOptions, ...options };

    // Criar elemento de toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${config.type}`;

    // Ícone baseado no tipo
    let iconClass = 'fa-info-circle';
    if (config.type === 'success') iconClass = 'fa-check-circle';
    if (config.type === 'error') iconClass = 'fa-exclamation-circle';
    if (config.type === 'warning') iconClass = 'fa-exclamation-triangle';

    // Construir HTML interno
    toast.innerHTML = `
      <div class="toast-icon">
        <i class="fas ${iconClass}"></i>
      </div>
      <div class="toast-content">
        ${config.title ? `<div class="toast-title">${config.title}</div>` : ''}
        <div class="toast-message">${config.message}</div>
      </div>
      ${config.closable ? '<button class="toast-close"><i class="fas fa-times"></i></button>' : ''}
    `;

    // Adicionar ao container
    this.containerEl.appendChild(toast);

    // Configurar botão fechar
    if (config.closable) {
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => this.close(toast));
    }

    // Auto-fechar após duração especificada
    if (config.duration > 0) {
      setTimeout(() => this.close(toast), config.duration);
    }

    return toast;
  },

  // Fechamento animado do toast
  close(toast) {
    if (!toast) return;

    toast.classList.add('slide-out');

    // Remover após animação
    toast.addEventListener('animationend', () => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    });
  },

  // Métodos de conveniência para diferentes tipos
  success(message, title = 'Sucesso', options = {}) {
    return this.show({ type: 'success', title, message, ...options });
  },

  error(message, title = 'Erro', options = {}) {
    return this.show({ type: 'error', title, message, ...options });
  },

  warning(message, title = 'Atenção', options = {}) {
    return this.show({ type: 'warning', title, message, ...options });
  },

  info(message, title = 'Informação', options = {}) {
    return this.show({ type: 'info', title, message, ...options });
  },
};

// Adicionar método de confirmação
Notifications.confirm = function (message, onConfirm, onCancel, options = {}) {
  // Configurações padrão
  const config = {
    title: 'Confirmação',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    ...options,
  };

  // Criar overlay para o modal
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.zIndex = '1000';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.animation = 'fade-in 0.2s ease-out forwards';

  // Criar modal
  const modal = document.createElement('div');
  modal.className = 'confirmation-modal';
  modal.style.backgroundColor = 'white';
  modal.style.borderRadius = '8px';
  modal.style.padding = '25px';
  modal.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
  modal.style.maxWidth = '400px';
  modal.style.width = '90%';
  modal.style.textAlign = 'center';
  modal.style.animation = 'scale-in 0.2s ease-out forwards';

  // Conteúdo do modal
  modal.innerHTML = `
    <h3 style="margin-top:0; color:#333; font-size:1.2rem;">${config.title}</h3>
    <p style="color:#666; margin-bottom:20px;">${message}</p>
    <div style="display:flex; justify-content:center; gap:10px;">
      <button id="modal-cancel" class="btn btn-outline" style="padding:8px 16px;">${config.cancelText}</button>
      <button id="modal-confirm" class="btn btn-primary" style="padding:8px 16px;">${config.confirmText}</button>
    </div>
  `;

  // Adicionar modal ao overlay
  overlay.appendChild(modal);

  // Adicionar overlay ao corpo do documento
  document.body.appendChild(overlay);

  // Configurar botões do modal
  document.getElementById('modal-cancel').addEventListener('click', function () {
    document.body.removeChild(overlay);
    if (typeof onCancel === 'function') onCancel();
  });

  document.getElementById('modal-confirm').addEventListener('click', function () {
    document.body.removeChild(overlay);
    if (typeof onConfirm === 'function') onConfirm();
  });
};

// Certificar que está disponível globalmente
window.Notifications = Notifications;
