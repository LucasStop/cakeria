document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o usuário está autenticado
    checkAuthStatus();
    
    // Carregar categorias
    loadCategories();
    
    // Configurar manipuladores de eventos
    setupEventListeners();
    
    // Configurar prévia da imagem
    setupImagePreview();
});

// Verificar autenticação
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        // Redirecionar para a página de login se não estiver autenticado
        window.location.href = '/login.html?redirect=/compartilharReceitas.html';
    }
    
    // Verificar se o token é válido (opcional)
    // Esta função pode ser expandida para verificar a validade do token com o backend
}

// Carregar categorias do servidor
async function loadCategories() {
    try {
        const categorySelect = document.getElementById('recipe-category');
        
        // Usar a API real para buscar categorias
        const categories = await API.get('/categories');
        
        // Preencher o dropdown de categorias
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        showError('category-error', 'Não foi possível carregar as categorias. Tente novamente.');
    }
}

// Configurar manipuladores de eventos
function setupEventListeners() {
    // Adicionar ingrediente
    document.getElementById('add-ingredient').addEventListener('click', function() {
        const container = document.getElementById('ingredients-container');
        const newIngredient = document.createElement('div');
        newIngredient.className = 'ingredient-item';
        newIngredient.innerHTML = `
            <input type="text" name="ingredients[]" placeholder="Ex: 2 xícaras de farinha de trigo" required>
            <button type="button" class="remove-btn"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(newIngredient);
        
        // Adicionar evento de remoção
        newIngredient.querySelector('.remove-btn').addEventListener('click', function() {
            container.removeChild(newIngredient);
        });
    });
    
    // Adicionar passo
    document.getElementById('add-step').addEventListener('click', function() {
        const container = document.getElementById('steps-container');
        const stepsCount = container.children.length + 1;
        
        const newStep = document.createElement('div');
        newStep.className = 'step-item';
        newStep.innerHTML = `
            <div class="step-number">${stepsCount}</div>
            <textarea name="steps[]" rows="2" placeholder="Descreva o passo..." required></textarea>
            <button type="button" class="remove-btn"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(newStep);
        
        // Adicionar evento de remoção
        newStep.querySelector('.remove-btn').addEventListener('click', function() {
            container.removeChild(newStep);
            // Atualizar números dos passos
            updateStepNumbers();
        });
    });
    
    // Botão cancelar
    document.getElementById('cancel-btn').addEventListener('click', function() {
        if (confirm('Tem certeza que deseja cancelar? Todas as informações serão perdidas.')) {
            window.location.href = '/receitas.html';
        }
    });
    
    // Submissão do formulário
    document.getElementById('recipe-form').addEventListener('submit', handleFormSubmit);
    
    // Configurar eventos de remoção para os itens iniciais
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const item = this.closest('.ingredient-item, .step-item');
            const container = item.parentElement;
            container.removeChild(item);
            
            if (item.classList.contains('step-item')) {
                updateStepNumbers();
            }
        });
    });
}

// Atualizar números dos passos após remoção
function updateStepNumbers() {
    const stepItems = document.querySelectorAll('.step-item');
    stepItems.forEach((item, index) => {
        item.querySelector('.step-number').textContent = index + 1;
    });
}

// Configurar prévia da imagem
function setupImagePreview() {
    const imageInput = document.getElementById('recipe-image');
    const imagePreview = document.getElementById('image-preview');
    const fileName = document.getElementById('file-name');
    
    imageInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            
            // Verificar se é uma imagem
            if (!file.type.match('image.*')) {
                showError('image-error', 'Por favor, selecione um arquivo de imagem válido.');
                imagePreview.style.display = 'none';
                fileName.textContent = 'Arquivo inválido';
                return;
            }
            
            // Exibir nome do arquivo
            fileName.textContent = file.name;
            
            // Criar prévia da imagem
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    });
}

// Manipular envio do formulário
async function handleFormSubmit(e) {
    e.preventDefault();
    
    try {
        const form = document.getElementById('recipe-form');
        const formData = new FormData(form);
        
        // Coletar múltiplos ingredientes e passos corretamente
        const ingredients = Array.from(document.querySelectorAll('input[name="ingredients[]"]')).map(input => input.value);
        const steps = Array.from(document.querySelectorAll('textarea[name="steps[]"]')).map(textarea => textarea.value);
        
        // Remover os campos de array original
        formData.delete('ingredients[]');
        formData.delete('steps[]');
        
        // Adicionar tags como array
        const tagsString = formData.get('tags');
        const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()) : [];
        formData.delete('tags');
        
        // Construir objeto de dados
        const recipeData = {
            title: formData.get('title'),
            categoryId: formData.get('category'),
            difficulty: formData.get('difficulty'),
            prepTime: parseInt(formData.get('prepTime')),
            cookTime: parseInt(formData.get('cookTime')),
            servings: parseInt(formData.get('servings')),
            description: formData.get('description'),
            ingredients: ingredients,
            steps: steps,
            tags: tags,
            authorId: JSON.parse(localStorage.getItem('user'))?.id // Adicionar ID do autor
        };
        
        // Usar a API real para enviar a receita
        const token = localStorage.getItem('token');
        const imageFile = formData.get('image');
        
        // Primeiro enviar os dados da receita
        const response = await fetch(`${API.BASE_URL}/recipes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(recipeData)
        });
        
        if (!response.ok) {
            throw new Error('Falha ao salvar receita');
        }
        
        const savedRecipe = await response.json();
        
        // Se houver imagem, fazer upload em uma segunda requisição
        if (imageFile) {
            const imageFormData = new FormData();
            imageFormData.append('image', imageFile);
            
            const imageUploadResponse = await fetch(`${API.BASE_URL}/recipes/${savedRecipe.id}/image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: imageFormData
            });
            
            if (!imageUploadResponse.ok) {
                console.warn('A receita foi salva, mas houve um problema ao enviar a imagem');
            }
        }
        
        alert('Receita enviada com sucesso!');
        
        // Redirecionar após sucesso
        window.location.href = '/receitas.html';
        
    } catch (error) {
        console.error('Erro ao enviar receita:', error);
        alert('Ocorreu um erro ao enviar sua receita. Por favor, tente novamente.');
    }
}

// Mostrar mensagem de erro
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.add('active');
    
    // Remover depois de 5 segundos
    setTimeout(() => {
        errorElement.classList.remove('active');
        errorElement.textContent = '';
    }, 5000);
}
