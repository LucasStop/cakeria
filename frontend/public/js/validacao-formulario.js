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

  }

  form.addEventListener('submit', function (event) {

    if (isEditMode && form.dataset.currentImageUrl) {
    } else if (!imageInput.files || imageInput.files.length === 0) {
    }
  });
}
