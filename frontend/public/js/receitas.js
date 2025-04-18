// Variáveis e seletores
const recipesGrid = document.getElementById('recipes-grid');
const paginationContainer = document.getElementById('recipes-pagination');
const searchInput = document.getElementById('search-recipes');
const searchBtn = document.getElementById('search-btn');
const categoryFilter = document.getElementById('category-filter');
const sortSelect = document.getElementById('sort-recipes');
const recipeTemplate = document.getElementById('recipe-card-template');

// Estado da aplicação
let currentPage = 1;
let totalPages = 1;

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de receitas inicializada');
    
    // Configurar event listeners
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            currentPage = 1;
            fetchRecipes();
        });
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            currentPage = 1;
            fetchRecipes();
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentPage = 1;
            fetchRecipes();
        });
    }
    
    // Carregar receitas iniciais
    fetchRecipes();
});

// Buscar receitas da API
async function fetchRecipes() {
    console.log('Buscando receitas do servidor...');
    showLoading();
    
    try {
        // Fazer requisição diretamente
        const endpoint = `${API.BASE_URL}/recipes`;
        console.log('Endpoint da requisição:', endpoint);
        
        // Adicionar timestamp para evitar cache
        const uncachedEndpoint = `${endpoint}?_=${new Date().getTime()}`;
        
        const response = await fetch(uncachedEndpoint);
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }
        
        const recipes = await response.json();
        console.log('Receitas recebidas:', recipes);
        
        if (Array.isArray(recipes) && recipes.length > 0) {
            displayRecipes(recipes);
        } else {
            showEmptyState();
        }
        
    } catch (error) {
        console.error('Erro ao buscar receitas:', error);
        showError();
    }
}

// Exibir indicador de carregamento
function showLoading() {
    recipesGrid.innerHTML = `
        <div class="loading-indicator">
            <div class="spinner"></div>
            <p>Carregando receitas...</p>
        </div>
    `;
}

// Exibir mensagem quando não há receitas
function showEmptyState() {
    recipesGrid.innerHTML = `
        <div class="no-recipes-message">
            <i class="fas fa-utensils"></i>
            <p>Nenhuma receita encontrada. Seja o primeiro a compartilhar!</p>
            <a href="/compartilharReceitas.html" class="btn btn-primary">Compartilhar Receita</a>
        </div>
    `;
}

// Exibir mensagem de erro
function showError() {
    recipesGrid.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Ocorreu um erro ao carregar as receitas.</p>
            <button onclick="fetchRecipes()" class="btn btn-primary">Tentar Novamente</button>
        </div>
    `;
}

// Função para buscar detalhes do usuário por ID
async function getUserById(userId) {
    try {
        const response = await fetch(`${API.BASE_URL}/users/${userId}`);
        if (!response.ok) {
            throw new Error(`Erro ao buscar usuário: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Erro ao buscar detalhes do usuário #${userId}:`, error);
        return null;
    }
}

// Cache para evitar requisições repetidas
const userCache = {};

// Exibir receitas na página
async function displayRecipes(recipes) {
    // Limpar o grid
    recipesGrid.innerHTML = '';
    
    console.log("Começando a exibir receitas. Total:", recipes.length);
    
    // Para cada receita, criar um card
    for (const recipe of recipes) {
        console.log("Processando receita:", recipe);
        
        // Verificar se temos o template
        if (!recipeTemplate) {
            // Se não tivermos o template, criar um HTML básico
            const card = document.createElement('div');
            card.className = 'recipe-card';
            
            // Dados da receita
            const title = recipe.title || 'Sem título';
            const description = recipe.description || 'Sem descrição';
            const author = recipe.author?.name || 'Autor desconhecido';
            const image = recipe.image_url || '/assets/placeholder.jpg'; 
            
            card.innerHTML = `
                <div class="recipe-image">
                    <img src="${image}" alt="${title}" onerror="this.src='/assets/placeholder.jpg'">
                </div>
                <div class="recipe-content">
                    <h3 class="recipe-title">${title}</h3>
                    <div class="recipe-meta">
                        <span class="recipe-author"><i class="fas fa-user"></i> ${author}</span>
                    </div>
                    <p class="recipe-excerpt">${description.substring(0, 100)}...</p>
                    <div class="recipe-footer">
                        <a href="/receita.html?id=${recipe.id}" class="recipe-link">Ver Receita</a>
                    </div>
                </div>
            `;
            
            recipesGrid.appendChild(card);
        } else {
            // Se temos o template, usamos ele
            const card = recipeTemplate.content.cloneNode(true);
            
            // Preencher dados
            const img = card.querySelector('.recipe-image img');
            img.src = recipe.image_url || '/assets/placeholder.jpg';
            img.alt = recipe.title;
            
            card.querySelector('.recipe-title').textContent = recipe.title;
            
            // Autor - Melhor tratamento para diferentes formatos de dados
            const authorSpan = card.querySelector('.author-name');
            if (authorSpan) {
                let authorName = null;
                
                // Verificar diferentes possibilidades para o nome do autor
                if (recipe.author?.name) {
                    authorName = recipe.author.name;
                } else if (recipe.user?.name) {
                    authorName = recipe.user.name;
                } else if (recipe.userName) {
                    authorName = recipe.userName;
                } else if (recipe.userId || recipe.user_id) {
                    // Se tiver apenas o ID do usuário, buscar o nome na API
                    const userId = recipe.userId || recipe.user_id;
                    
                    // Verificar primeiro no cache
                    if (userCache[userId]) {
                        authorName = userCache[userId].name;
                    } else {
                        // Buscar o usuário da API
                        try {
                            const user = await getUserById(userId);
                            if (user && user.name) {
                                authorName = user.name;
                                // Salvar no cache para futuras referências
                                userCache[userId] = user;
                            } else {
                                authorName = `Usuário #${userId}`;
                            }
                        } catch (error) {
                            console.error(`Erro ao buscar usuário ${userId}:`, error);
                            authorName = `Usuário #${userId}`;
                        }
                    }
                } else {
                    authorName = 'Autor desconhecido';
                }
                
                console.log("Nome do autor encontrado:", authorName);
                authorSpan.textContent = authorName;
            }
            
            // Data de criação - Melhorada a lógica para lidar com diferentes formatos
            const dateSpan = card.querySelector('.date-text');
            if (dateSpan) {
                // Log para debugging do formato da data
                console.log("Data original:", recipe.created_at || recipe.createdAt);
                
                // Tentar vários formatos possíveis
                let dateString = recipe.created_at || recipe.createdAt;
                let date;
                
                if (dateString) {
                    date = new Date(dateString);
                    
                    // Se a conversão falhou, tente outro formato
                    if (isNaN(date.getTime())) {
                        // Verificar se é um timestamp numérico
                        if (!isNaN(dateString)) {
                            date = new Date(parseInt(dateString));
                        } 
                        // Verificar formato DD/MM/YYYY
                        else if (typeof dateString === 'string' && dateString.includes('/')) {
                            const [day, month, year] = dateString.split('/');
                            date = new Date(year, month - 1, day);
                        }
                    }
                } else {
                    // Se não há data na receita, use a data atual como fallback
                    date = new Date();
                }
                
                // Formatar a data para exibição
                try {
                    if (!isNaN(date.getTime())) {
                        dateSpan.textContent = date.toLocaleDateString('pt-BR');
                    } else {
                        dateSpan.textContent = 'Data desconhecida';
                    }
                } catch (e) {
                    console.error("Erro ao formatar data:", e);
                    dateSpan.textContent = 'Data desconhecida';
                }
            }
            
            // Visualizações
            const viewsSpan = card.querySelector('.views-count');
            if (viewsSpan) viewsSpan.textContent = recipe.views || 0;
            
            // Descrição
            const excerpt = card.querySelector('.recipe-excerpt');
            if (excerpt) excerpt.textContent = recipe.description?.substring(0, 120) + '...';
            
            // Dificuldade
            const difficultySpan = card.querySelector('.recipe-difficulty');
            if (difficultySpan) difficultySpan.textContent = recipe.difficulty || 'Médio';
            
            // Tempo - Melhor tratamento para diferentes formatos
            const timeSpan = card.querySelector('.time-text');
            if (timeSpan) {
                // Log para debugging dos tempos
                console.log("Dados de tempo:", {
                    prep_time: recipe.prep_time,
                    prepTime: recipe.prepTime,
                    cook_time: recipe.cook_time,
                    cookTime: recipe.cookTime
                });
                
                // Considerar todas as possibilidades de nomenclatura
                const prepTime = recipe.prep_time || recipe.prepTime || 0;
                const cookTime = recipe.cook_time || recipe.cookTime || 0;
                
                // Ajuste para garantir que os valores são tratados como números
                const totalTime = parseInt(prepTime) + parseInt(cookTime);
                
                // Formatação melhorada
                if (totalTime > 0) {
                    timeSpan.textContent = `${totalTime} min`;
                } else if (recipe.totalTime || recipe.total_time) {
                    // Tentar outra possibilidade
                    timeSpan.textContent = `${recipe.totalTime || recipe.total_time} min`;
                } else {
                    // Fallback sem tempo
                    timeSpan.textContent = 'Tempo não informado';
                }
            }
            
            // Link para a receita
            const recipeLink = card.querySelector('.recipe-link');
            if (recipeLink) recipeLink.href = `/receita.html?id=${recipe.id}`;
            
            recipesGrid.appendChild(card);
        }
    }
    
    console.log(`${recipes.length} receitas exibidas com sucesso`);
}

// Garantir a execução quando o DOM estiver carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}

// Função de inicialização separada
function initPage() {
    console.log('Inicializando página de receitas...');
    
    // Adicionar event listeners novamente para garantir
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            currentPage = 1;
            fetchRecipes();
        });
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            currentPage = 1;
            fetchRecipes();
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentPage = 1;
            fetchRecipes();
        });
    }
    
    // Carregar receitas com um pequeno atraso para garantir que todos os elementos estão prontos
    setTimeout(fetchRecipes, 100);
}

// Exportar funções para uso global
window.fetchRecipes = fetchRecipes;
