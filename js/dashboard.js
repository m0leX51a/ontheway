async function fetchDashboardStats() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert("You are not authorized. Please login.");
        return;
    }

    try {
        const response = await fetch('https://ontheway.runasp.net/DashboardStats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        document.getElementById('countCars').textContent = data.totalCars;
        document.getElementById('countUsers').textContent = data.totalUsers;
        document.getElementById('countFoundedCars').textContent = data.deletedCarsCount;

        const recentCarsTable = document.querySelector('#recentCarsTable tbody');
        recentCarsTable.innerHTML = '';
        data.recentCars.forEach(car => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${car.plateNumber}</td>
                <td>${new Date(car.createAt).toLocaleString()}</td>
            `;
            recentCarsTable.appendChild(row);
        });

        const carsResponse = await fetch('https://ontheway.runasp.net/api/Car/GetAll', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!carsResponse.ok) {
            throw new Error(`Network response was not ok: ${carsResponse.status} ${carsResponse.statusText}`);
        }

        const carsData = await carsResponse.json();
        updateCharts(data, carsData);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        document.getElementById('countCars').textContent = 'Error';
        document.getElementById('countUsers').textContent = 'Error';
        document.getElementById('countFoundedCars').textContent = 'Error';
        document.querySelector('#recentCarsTable tbody').innerHTML = `<tr><td colspan="2">Failed to load recent cars</td></tr>`;
    }
}

function updateCharts(dashboardData, carsData) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const lineChartCanvas = document.getElementById('barChart'); 
    const userGrowth = months.map((_, i) => dashboardData.totalUsers + (i * 2)); 
    const carGrowth = months.map((_, i) => dashboardData.totalCars + (i * 1)); 
    if (window.lineChartInstance) window.lineChartInstance.destroy();
    window.lineChartInstance = new Chart(lineChartCanvas, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Users',
                    data: userGrowth,
                    borderColor: '#36a2eb',
                    fill: false,
                },
                {
                    label: 'Cars',
                    data: carGrowth,
                    borderColor: '#ff6384',
                    fill: false,
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    const brandCounts = {};
    carsData.forEach(car => {
        brandCounts[car.brandName] = (brandCounts[car.brandName] || 0) + 1;
    });
    const pieChartCanvas = document.getElementById('pieChart');
    if (window.pieChartInstance) window.pieChartInstance.destroy();
    window.pieChartInstance = new Chart(pieChartCanvas, {
        type: 'pie',
        data: {
            labels: Object.keys(brandCounts),
            datasets: [{
                data: Object.values(brandCounts),
                backgroundColor: [
                    '#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff',
                    '#ff9f40', '#c9cbcf', '#e7e9ed'
                ]
            }]
        },
        options: {
            responsive: true,
        }
    });
}

document.querySelector('.logout').addEventListener('click', function () {
    Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to log out from your account?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, log out',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardStats();
});