document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('recipe-form');
  const isEditMode = form && form.dataset.recipeId;

  if (isEditMode) {
    enhanceImageHandling();
  }
});

function enhanceImageHandling() {
  const imageInput = document.getElementById('recipe-image');
  const imageRequirement = document.getElementById('image-requirement');
  const imagePreview = document.getElementById('image-preview');
  const imageStatus = document.getElementById('image-status');
  const imageStatusText = document.getElementById('image-status-text');
  const form = document.getElementById('recipe-form');

  if (!imageInput || !imageRequirement || !form) return;

  const currentImageUrl = form.dataset.currentImageUrl;
  if (currentImageUrl) {
    imageRequirement.textContent = '(Opcional)';
    imageRequirement.classList.add('optional');

    imageInput.removeAttribute('required');

    if (imageStatus) {
      imageStatus.style.display = 'block';
      imageStatus.style.borderLeft = '4px solid #28a745';

      const editModeInfo = document.getElementById('edit-mode-info');
      if (editModeInfo) {
        editModeInfo.style.display = 'block';
      }
    }

    if (imagePreview && imagePreview.src) {
      imagePreview.title =
        'Imagem atual da receita (será mantida se nenhuma nova imagem for selecionada)';
      imagePreview.classList.add('has-image');

      const fileNameEl = document.getElementById('file-name');
      if (fileNameEl) {
        fileNameEl.textContent = 'Imagem atual será mantida';
        fileNameEl.classList.add('has-file');
      }

      const helperText = document.getElementById('image-helper');
      if (helperText) {
        helperText.style.display = 'block';
      }
    }
  }

  imageInput.addEventListener('change', function () {
    const hasNewImage = this.files && this.files.length > 0;

    if (hasNewImage) {
      const helperText = document.getElementById('image-helper');
      if (helperText) {
        helperText.textContent = 'Nova imagem selecionada. A imagem anterior será substituída.';
        helperText.style.color = '#ffc107';
      }

      if (imageStatus && imageStatusText) {
        imageStatus.style.display = 'block';
        imageStatus.style.borderLeft = '4px solid #ffc107';
        imageStatusText.textContent = 'Nova imagem será enviada e substituirá a atual';
      }
    } else {
      if (currentImageUrl) {
        const helperText = document.getElementById('image-helper');
        if (helperText) {
          helperText.textContent =
            'Ao editar uma receita, você pode manter a imagem atual ou enviar uma nova.';
          helperText.style.color = '#6c757d';
        }

        if (imageStatus && imageStatusText) {
          imageStatus.style.display = 'block';
          imageStatus.style.borderLeft = '4px solid #28a745';
          imageStatusText.textContent = 'Imagem atual será mantida';
        }
      }
    }
  });
}
