/**
 * Este arquivo contém melhorias para o formulário de receitas,
 * especialmente para lidar com edição de imagens
 */

// Executar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
  // Verificar se estamos no modo de edição
  const form = document.getElementById('recipe-form');
  const isEditMode = form && form.dataset.recipeId;
  
  if (isEditMode) {
    console.log('Aplicando melhorias para o modo de edição de imagens');
    enhanceImageHandling();
  }
});

// Melhorar a manipulação de imagens no formulário
function enhanceImageHandling() {
  const imageInput = document.getElementById('recipe-image');
  const imageRequirement = document.getElementById('image-requirement');
  const imagePreview = document.getElementById('image-preview');
  const imageStatus = document.getElementById('image-status');
  const imageStatusText = document.getElementById('image-status-text');
  const form = document.getElementById('recipe-form');
  
  if (!imageInput || !imageRequirement || !form) return;
  
  // Se temos uma imagem atual armazenada
  const currentImageUrl = form.dataset.currentImageUrl;
  if (currentImageUrl) {
    // Marcar visualmente que a imagem é opcional 
    imageRequirement.textContent = '(Opcional)';
    imageRequirement.classList.add('optional');
    
    // IMPORTANTE: Remover o atributo required do campo de imagem
    imageInput.removeAttribute('required');
    console.log('Atributo required removido do campo de imagem - modo de edição');
    
    // Mostrar e configurar o elemento de status da imagem
    if (imageStatus) {
      imageStatus.style.display = 'block';
      imageStatus.style.borderLeft = '4px solid #28a745';
      
      // Mostrar informações adicionais sobre o modo de edição
      const editModeInfo = document.getElementById('edit-mode-info');
      if (editModeInfo) {
        editModeInfo.style.display = 'block';
      }
    }
    
// Adicionar dica visual de que estamos mantendo a imagem atual
    if (imagePreview && imagePreview.src) {
      // Adicionar tooltip e classe visual
      imagePreview.title = 'Imagem atual da receita (será mantida se nenhuma nova imagem for selecionada)';
      imagePreview.classList.add('has-image');
      
      // Melhorar a aparência do nome do arquivo
      const fileNameEl = document.getElementById('file-name');
      if (fileNameEl) {
        fileNameEl.textContent = 'Imagem atual será mantida';
        fileNameEl.classList.add('has-file');
      }
      
      // Adicionar texto de ajuda abaixo da prévia
      const helperText = document.getElementById('image-helper');
      if (helperText) {
        helperText.style.display = 'block';
      }
    }
  }
  
  // Adicionar evento para quando o usuário selecionar uma nova imagem
  imageInput.addEventListener('change', function() {
    const hasNewImage = this.files && this.files.length > 0;
    
    if (hasNewImage) {
      // Se selecionou nova imagem, atualizar o texto para indicar que a imagem será substituída
      const helperText = document.getElementById('image-helper');
      if (helperText) {
        helperText.textContent = 'Nova imagem selecionada. A imagem anterior será substituída.';
        helperText.style.color = '#ffc107'; // Amarelo para alerta
      }
      
      // Atualizar o status da imagem
      if (imageStatus && imageStatusText) {
        imageStatus.style.display = 'block';
        imageStatus.style.borderLeft = '4px solid #ffc107';
        imageStatusText.textContent = 'Nova imagem será enviada e substituirá a atual';
      }
    } else {
      // Se não há nova imagem selecionada e estamos em edição
      if (currentImageUrl) {
        // Restaurar o texto de ajuda original
        const helperText = document.getElementById('image-helper');
        if (helperText) {
          helperText.textContent = 'Ao editar uma receita, você pode manter a imagem atual ou enviar uma nova.';
          helperText.style.color = '#6c757d';
        }
        
        // Atualizar o status da imagem
        if (imageStatus && imageStatusText) {
          imageStatus.style.display = 'block';
          imageStatus.style.borderLeft = '4px solid #28a745';
          imageStatusText.textContent = 'Imagem atual será mantida';
        }
      }
    }
  });
}
