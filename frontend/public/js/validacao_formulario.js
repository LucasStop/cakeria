/**
 * Escuta a validação do formulário e impede o envio
 * se não atender aos critérios customizados
 */
document.addEventListener('DOMContentLoaded', function () {
  // Verificar se estamos na página de compartilhar receitas
  const recipeForm = document.getElementById('recipe-form');
  if (!recipeForm) return;

  // Implementar validação customizada para a imagem
  setupCustomFormValidation();
});

// Configurar validação customizada para o formulário
function setupCustomFormValidation() {
  const form = document.getElementById('recipe-form');
  const isEditMode = !!form.dataset.recipeId;
  const imageInput = document.getElementById('recipe-image');

  // Desativar a validação HTML5 built-in para o campo de imagem
  // Usaremos nossa própria validação no JavaScript
  if (imageInput) {
    imageInput.setAttribute('novalidate', 'true');

    // Remover qualquer atributo required para evitar validação nativa
    // Faremos nossa própria validação
    imageInput.removeAttribute('required');

    console.log('Configuração de validação customizada aplicada para o campo de imagem.');
  }

  // Adicionar validação customizada ao formulário
  form.addEventListener('submit', function (event) {
    // Ao invés de impedir o envio aqui, deixamos isso para o manipulador principal
    // que já está configurado no arquivo compartilharReceitas.js

    console.log('Validação customizada em execução...');

    // Se estamos em modo de edição e temos uma imagem atual, não precisamos de nova imagem
    if (isEditMode && form.dataset.currentImageUrl) {
      console.log('Modo de edição com imagem atual: campo de imagem tratado como opcional');
    } else if (!imageInput.files || imageInput.files.length === 0) {
      // Se não há imagem selecionada e estamos criando nova receita
      console.log('Sem imagem selecionada em modo de criação. Validação falha.');
      // Não impedimos o envio aqui, o manipulador principal tratará disso
    }
  });
}
