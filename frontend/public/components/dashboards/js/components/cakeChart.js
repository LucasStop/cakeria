export function CakeChart() {
    var ctx1 = document.getElementById('cakeTypeChart').getContext('2d');
    var cakeTypeChart = new Chart(ctx1, {
        type: 'pie',
        data: {
            labels: ['Bolo de Chocolate', 'Red Velvet', 'Bolo de Frutas', 'Outros'],
            datasets: [{
                label: 'Tipos de Bolos Vendidos',
                data: [30, 20, 25, 25], // Percentual de vendas de cada tipo de bolo
                backgroundColor: ['#ff5733', '#33c3ff', '#c3ff33', '#ff33a1'],
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    enabled: true
                }
            }
        }
    });
}
