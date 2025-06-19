// Line Chart (Count of Interactions by Day)
const lineChart = new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: {
        labels: ['1', '5', '10', '15', '20', '25', '30'],
        datasets: [{
            label: 'Interactions',
            data: [5, 8, 3, 10, 4, 7, 6],
            borderColor: '#ff6200',
            fill: false,
        }]
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

// Bar Chart (Count of Messages by Month)
const barChart = new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        datasets: [{
            label: 'Messages',
            data: [10, 9, 8, 10, 7, 6, 5, 4, 3, 2, 1, 0],
            backgroundColor: '#ff6200',
        }]
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

// Pie Chart (Number of Users by Quarter)
const pieChart = new Chart(document.getElementById('pieChart'), {
    type: 'pie',
    data: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September'],
        datasets: [{
            data: [66, 185, 304, 245, 66, 505, 400, 214, 514],
            backgroundColor: [
                '#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff',
                '#ff9f40', '#c9cbcf', '#e7e9ed', '#7d4f6d'
            ],
        }]
    },
    options: {
        responsive: true,
    }
});


// Logout button with SweetAlert confirmation (English version)
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
            // Clear session/localStorage if used
            localStorage.clear();
            sessionStorage.clear();

            // Redirect to login page
            window.location.href = 'login.html';
        }
    });
});

