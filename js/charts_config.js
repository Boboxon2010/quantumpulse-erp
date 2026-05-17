// QuantumPulse - Chart.js Grafiklar Sozlamalari

document.addEventListener('DOMContentLoaded', () => {
    // 1. Asosiy Sotuvlar Dinamikasi (Chiziqli Grafik - Line Chart)
    const salesCtx = document.getElementById('mainSalesChart').getContext('2d');
    
    // Chiziq ostidagi neon gradient effekti
    let gradientBlue = salesCtx.createLinearGradient(0, 0, 0, 400);
    gradientBlue.addColorStop(0, 'rgba(0, 242, 254, 0.5)');
    gradientBlue.addColorStop(1, 'rgba(0, 242, 254, 0.0)');

    new Chart(salesCtx, {
        type: 'line',
        data: {
            labels: ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'],
            datasets: [{
                label: 'Kunlik Tushum ($)',
                data: [12500, 15000, 14200, 18500, 22000, 26500, 24000],
                borderColor: '#00f2fe',
                backgroundColor: gradientBlue,
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#00f2fe',
                pointBorderWidth: 2,
                pointRadius: 5,
                fill: true,
                tension: 0.4 // Chiziqni silliq (to'lqinsimon) qilish
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#64748b' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b' }
                }
            }
        }
    });

    // 2. Ombor Holati (Aylanma Grafik - Doughnut Chart)
    const invCtx = document.getElementById('inventoryDoughnut').getContext('2d');
    
    new Chart(invCtx, {
        type: 'doughnut',
        data: {
            labels: ['Tayyor Mahsulotlar', 'Xomashyo', 'Tranzitdagi Yuklar', 'Tugayotganlar'],
            datasets: [{
                data: [55, 25, 15, 5],
                backgroundColor: [
                    '#4facfe', // Neon Purple
                    '#00f2fe', // Neon Cyan
                    '#00e676', // Neon Green
                    '#ff4b4b'  // Red Alert
                ],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            resizeDelay: 50, // Grafik o'zgarish paytida biroz kutib, keyin o'lcham olsin
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#64748b' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b' }
                }
            }
        }
    });
});