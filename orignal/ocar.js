document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = 'http://ontheway.runasp.net/api/Car/';
    const tbody = document.getElementById('carsTableBody');
    let carsData = [];

    const token = localStorage.getItem('authToken');

    if (!token) {
        alert("You are not authorized. Please login.");
        return;
    }

    function fetchCars() {
        fetch(`${apiBaseUrl}GetAll`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('API Data:', data);
                if (Array.isArray(data) && data.length > 0) {
                    carsData = data;
                    displayCars(data);
                } else {
                    throw new Error('API returned empty or invalid data');
                }
            })
            .catch(error => {
                console.error('Error fetching cars:', error);
                tbody.innerHTML = `<tr><td colspan="5">Failed to load cars: ${error.message}</td></tr>`;
            });
    }

    function displayCars(cars) {
        if (!tbody) return;

        tbody.innerHTML = '';
        cars.forEach(car => {
            const identifier = car.id ?? car.plateNumber;
            if (!identifier) return;

            const tr = document.createElement('tr');
            tr.setAttribute('data-identifier', identifier);
            tr.innerHTML = `
                <td>
                    ${car.imageUrls?.length
                        ? `<img src="${car.imageUrls[0]}" alt="Car" style="width: 50px;" onerror="this.src='https://via.placeholder.com/50';">`
                        : `<img src="https://via.placeholder.com/50" alt="No Image">`}
                </td>
                <td>${car.plateNumber ?? ''}</td>
                <td>${car.brand ?? ''}</td>
                <td>${car.location ?? ''}</td>
                <td>
                    <button class="update-btn" data-identifier="${identifier}" title="Update">
                    <i class="fas fa-pen"></i> </button>
                    <button class="delete-btn" data-identifier="${identifier}" title="Delete">
                    <i class="fas fa-trash"></i> </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.update-btn').forEach(button => {
            button.addEventListener('click', () => {
                const identifier = button.getAttribute('data-identifier');
                const car = carsData.find(c => (c.id?.toString() === identifier || c.plateNumber === identifier));
                if (!car) {
                    alert("Car not found.");
                    return;
                }
                showUpdateForm(identifier, car.description, car.location, car.plateNumber, car.color, car.brand, car.imageUrls?.join(',') || '');
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', () => {
                const identifier = button.getAttribute('data-identifier');
                deleteCar(identifier);
            });
        });
    }

    window.showUpdateForm = function (identifier, description, location, plateNumber, color, brand, imageUrls) {
        const formHtml = `
            <div id="updateForm" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 1px solid #ccc; z-index: 1000;">
                <h2>Update Car</h2>
                <form id="carUpdateForm">
                    <label>Description:</label><br>
                    <input type="text" name="description" value="${description}" required><br>
                    <label>Location:</label><br>
                    <input type="text" name="location" value="${location}" required><br>
                    <label>Plate Number:</label><br>
                    <input type="text" name="plateNumber" value="${plateNumber}" required><br>
                    <label>Color:</label><br>
                    <input type="text" name="color" value="${color}" required><br>
                    <label>Brand:</label><br>
                    <input type="text" name="brand" value="${brand}" required><br>
                    <label>Image URLs (comma-separated):</label><br>
                    <input type="text" name="imageUrls" value="${imageUrls}"><br><br>
                    <button type="button" onclick="updateCar('${identifier}')">Save</button>
                    <button type="button" onclick="closeUpdateForm()">Cancel</button>
                </form>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', formHtml);
    };

    window.closeUpdateForm = function () {
        const form = document.getElementById('updateForm');
        if (form) form.remove();
    };

    window.updateCar = function (identifier) {
        const form = document.getElementById('carUpdateForm');
        const formData = new FormData(form);
        const updatedCar = {
            description: formData.get('description'),
            location: formData.get('location'),
            plateNumber: formData.get('plateNumber'),
            color: formData.get('color'),
            brand: formData.get('brand'),
            imageUrls: formData.get('imageUrls')
                ? formData.get('imageUrls').split(',').map(url => url.trim())
                : []
        };

        fetch(`${apiBaseUrl}Update/${identifier}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedCar)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to update car: ${response.status} ${response.statusText}`);
                }
                alert('Car updated successfully');
                closeUpdateForm();
                fetchCars();
            })
            .catch(error => {
                console.error('Error updating car:', error);
                alert('Failed to update car: ' + error.message);
            });
    };

    window.deleteCar = function (identifier) {
        if (!confirm(`Are you sure you want to delete car with ID/Plate Number: ${identifier}?`)) return;

        fetch(`${apiBaseUrl}Delete/${identifier}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to delete car: ${response.status} ${response.statusText}`);
                }
                alert('Car deleted successfully');
                fetchCars();
            })
            .catch(error => {
                console.error('Error deleting car:', error);
                alert('Failed to delete car: ' + error.message);
            });
    };

    // ✅ Search functionality by Plate Number
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');

    if (searchButton && searchInput) {
        searchButton.addEventListener('click', () => {
            const searchTerm = searchInput.value.trim().toLowerCase();

            if (!searchTerm) {
                displayCars(carsData); // Show all if input is empty
                return;
            }

            const filteredCars = carsData.filter(car =>
                car.plateNumber?.toLowerCase().includes(searchTerm)
            );

            if (filteredCars.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No cars found for plate number: "${searchTerm}"</td></tr>`;
            } else {
                displayCars(filteredCars);
            }
        });
    }

    fetchCars();
});
