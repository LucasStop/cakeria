document.addEventListener('DOMContentLoaded', function () {
  const recipeForm = document.getElementById('recipe-form');
  if (!recipeForm) return;

  setupCustomFormValidation();
});

function setupCustomFormValidation() {
  const form = document.getElementById('recipe-form');
  const isEditMode = !!form.dataset.recipeId;
  const imageInput = document.getElementById('recipe-image');

  if (imageInput) {
    imageInput.setAttribute('novalidate', 'true');

    imageInput.removeAttribute('required');

    console.log('Configuração de validação customizada aplicada para o campo de imagem.');
  }

  form.addEventListener('submit', function (event) {
    console.log('Validação customizada em execução...');

    if (isEditMode && form.dataset.currentImageUrl) {
      console.log('Modo de edição com imagem atual: campo de imagem tratado como opcional');
    } else if (!imageInput.files || imageInput.files.length === 0) {
      console.log('Sem imagem selecionada em modo de criação. Validação falha.');
    }
  });
}
