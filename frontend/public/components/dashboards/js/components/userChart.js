export function UserChart() {
    var ctx2 = document.getElementById('userChart').getContext('2d');
    var userChart = new Chart(ctx2, {
        type: 'pie',
        data: {
            labels: ['Novos Usuários', 'Usuários Ativos', 'Usuários Inativos'],
            datasets: [{
                label: 'Usuários Cadastrados',
                data: [40, 35, 25], // Percentual de cada categoria de usuários
                backgroundColor: ['#ff9933', '#66ccff', '#99cc33'],
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
