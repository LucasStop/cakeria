const Notifications = {
  containerEl: null,

  init() {
    if (this.containerEl) return;

    this.containerEl = document.createElement('div');
    this.containerEl.className = 'toast-container';
    document.body.appendChild(this.containerEl);
  },

  show(options) {
    this.init();

    const defaultOptions = {
      type: 'info',
      title: '',
      message: '',
      duration: 5000,
      closable: true,
    };

    const config = { ...defaultOptions, ...options };

    const toast = document.createElement('div');
    toast.className = `toast toast-${config.type}`;

    let iconClass = 'fa-info-circle';
    if (config.type === 'success') iconClass = 'fa-check-circle';
    if (config.type === 'error') iconClass = 'fa-exclamation-circle';
    if (config.type === 'warning') iconClass = 'fa-exclamation-triangle';

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

    this.containerEl.appendChild(toast);

    if (config.closable) {
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => this.close(toast));
    }

    if (config.duration > 0) {
      setTimeout(() => this.close(toast), config.duration);
    }

    return toast;
  },

  close(toast) {
    if (!toast) return;

    toast.classList.add('slide-out');

    toast.addEventListener('animationend', () => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    });
  },

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

Notifications.confirm = function (message, onConfirm, onCancel, options = {}) {
  const config = {
    title: 'Confirmação',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    ...options,
  };

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

  modal.innerHTML = `
    <h3 style="margin-top:0; color:#333; font-size:1.2rem;">${config.title}</h3>
    <p style="color:#666; margin-bottom:20px;">${message}</p>
    <div style="display:flex; justify-content:center; gap:10px;">
      <button id="modal-cancel" class="btn btn-outline" style="padding:8px 16px;">${config.cancelText}</button>
      <button id="modal-confirm" class="btn btn-primary" style="padding:8px 16px;">${config.confirmText}</button>
    </div>
  `;

  overlay.appendChild(modal);

  document.body.appendChild(overlay);

  document.getElementById('modal-cancel').addEventListener('click', function () {
    document.body.removeChild(overlay);
    if (typeof onCancel === 'function') onCancel();
  });

  document.getElementById('modal-confirm').addEventListener('click', function () {
    document.body.removeChild(overlay);
    if (typeof onConfirm === 'function') onConfirm();
  });
};

window.Notifications = Notifications;
