document.addEventListener('DOMContentLoaded', function () {
  const ctxUsers = document.getElementById('usersChart').getContext('2d');
  const ctxOrders = document.getElementById('ordersChart').getContext('2d');
  const ctxProducts = document.getElementById('productsChart').getContext('2d');

  new Chart(ctxUsers, {
    type: 'pie',
    data: {
      labels: ['Clientes', 'Administradores', 'Fornecedores'],
      datasets: [
        {
          label: 'Usuários',
          data: [120, 10, 5],
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        },
      ],
    },
    options: {
      animation: {
        duration: 1500,
        easing: 'easeOutBounce',
      },
    },
  });

  new Chart(ctxOrders, {
    type: 'pie',
    data: {
      labels: ['Pendente', 'Em Preparo', 'Entregue'],
      datasets: [
        {
          label: 'Pedidos',
          data: [15, 30, 55],
          backgroundColor: ['#FF9F40', '#FFCD56', '#4BC0C0'],
        },
      ],
    },
    options: {
      animation: {
        duration: 1500,
        easing: 'easeOutBounce',
      },
    },
  });

  // Gráfico de Produtos
  new Chart(ctxProducts, {
    type: 'pie',
    data: {
      labels: ['Bolos', 'Doces', 'Tortas'],
      datasets: [
        {
          label: 'Mais Vendidos',
          data: [50, 35, 20],
          backgroundColor: ['#9966FF', '#FF6384', '#36A2EB'],
        },
      ],
    },
    options: {
      animation: {
        duration: 1500,
        easing: 'easeOutBounce',
      },
    },
  });

  const dashboardLink = document.querySelector('a[data-route="dashboard"]');
  const dashboardSection = document.getElementById('dashboards');

  dashboardLink.addEventListener('click', function (event) {
    event.preventDefault();
    dashboardSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  });
});
