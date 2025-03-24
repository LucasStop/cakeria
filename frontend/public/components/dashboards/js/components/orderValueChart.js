export function OrderValueChart() {
    var ctx3 = document.getElementById('orderValueChart').getContext('2d');
    var orderValueChart = new Chart(ctx3, {
        type: 'pie',
        data: {
            labels: ['Pedidos até R$50', 'Pedidos entre R$50 e R$100', 'Pedidos acima de R$100'],
            datasets: [{
                label: 'Distribuição de Valores de Pedidos',
                data: [50, 30, 20], // Percentual de valores dos pedidos
                backgroundColor: ['#ff6666', '#66ff66', '#ffcc66'],
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
