document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = 'https://ontheway.runasp.net/api/Car/';
    const detailsBaseUrl = 'https://ontheway.runasp.net/api/CarDetails/';
    const usersApiUrl = 'https://ontheway.runasp.net/GetAll';
    const tbody = document.getElementById('carsTableBody');
    let carsData = [];
    let colors = [];
    let brands = [];
    let usersData = [];

    const token = localStorage.getItem('authToken');

    if (!token) {
        alert("You are not authorized. Please login.");
        return;
    }

    // Fetch initial data including users
    async function fetchInitialData() {
        try {
            const [colorsResp, brandsResp, usersResp] = await Promise.all([
                fetch(`${detailsBaseUrl}colors`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${detailsBaseUrl}brands`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(usersApiUrl, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': '*/*' } })
            ]);
            if (!colorsResp.ok || !brandsResp.ok || !usersResp.ok) throw new Error('Failed to fetch initial data');
            colors = await colorsResp.json();
            brands = await brandsResp.json();
            usersData = await usersResp.json();
            fetchCars();
        } catch (error) {
            console.error('Error fetching initial data:', error);
            tbody.innerHTML = `<tr><td colspan="8">Failed to load initial data: ${error.message}</td></tr>`;
        }
    }

    function fetchCars() {
        fetch(`${apiBaseUrl}GetAll`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => {
                if (!response.ok) throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
                return response.json();
            })
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    carsData = data;
                    displayCars(data);
                } else throw new Error('API returned empty or invalid data');
            })
            .catch(error => {
                console.error('Error fetching cars:', error);
                tbody.innerHTML = `<tr><td colspan="8">Failed to load cars: ${error.message}</td></tr>`;
            });
    }

    function displayCars(cars) {
        if (!tbody) return;
        tbody.innerHTML = '';
        cars.forEach(car => {
            const identifier = car.id ?? car.plateNumber;
            if (!identifier) return;
            const uploader = usersData.find(u => u.id === car.userId) || { firstName: 'Unknown', lastName: '', email: '' };
            const uploadedBy = `${uploader.firstName} ${uploader.lastName || ''}`;
            const email = uploader.email || '';
            const tr = document.createElement('tr');
            tr.setAttribute('data-identifier', identifier);
            tr.innerHTML = `
                <td>
                    ${car.imageUrls?.length
                        ? `<img src="${car.imageUrls[0]}" alt="Car" style="width: 50px;" onerror="this.src='https://via.placeholder.com/50';">`
                        : `<img src="https://via.placeholder.com/50" alt="No Image">`}
                </td>
                <td>${car.plateNumber ?? ''}</td>
                <td>${car.brandName ?? ''}</td>
                <td>${car.modelName ?? ''}</td>
                <td><a href="${car.location}" target="_blank" class="location-link">${car.location ?? ''}</a></td>
                <td>${uploadedBy}</td>
                <td>${email}</td>
                <td>
                    <button class="update-btn" data-identifier="${identifier}" title="Update">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="delete-btn" data-identifier="${identifier}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
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
                showUpdateForm(car);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', () => {
                const identifier = button.getAttribute('data-identifier');
                deleteCar(identifier);
            });
        });
    }

    async function showUpdateForm(car) {
        const color = colors.find(c => c.name === car.colorName) || { id: 0, name: '' };
        const brand = brands.find(b => b.name === car.brandName) || { id: 0, name: '' };
        let models = [];
        if (brand.id) {
            const modelsResp = await fetch(`${detailsBaseUrl}models/${brand.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (modelsResp.ok) models = await modelsResp.json();
        }
        const model = models.find(m => m.name === car.modelName) || { id: 0, name: '' };

        const formHtml = `
            <div id="updateForm" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #101732; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.5); z-index: 1000; color: white;">
                <h2>Update Car</h2>
                <form id="carUpdateForm">
                    <label>Description:</label><br>
                    <input type="text" name="description" value="${car.description || ''}" required><br>
                    <label>Location:</label><br>
                    <input type="text" name="location" value="${car.location || ''}" required><br>
                    <label>Plate Number:</label><br>
                    <input type="text" name="plateNumber" value="${car.plateNumber || ''}" required><br>
                    <label>Color:</label><br>
                    <select name="colorID" required>
                        ${colors.map(c => `<option value="${c.id}" ${c.id === color.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select><br>
                    <label>Brand:</label><br>
                    <select name="brandID" required onchange="updateModels(this.value)">
                        ${brands.map(b => `<option value="${b.id}" ${b.id === brand.id ? 'selected' : ''}>${b.name}</option>`).join('')}
                    </select><br>
                    <label>Model:</label><br>
                    <select name="modelID" required>
                        ${models.map(m => `<option value="${m.id}" ${m.id === model.id ? 'selected' : ''}>${m.name}</option>`).join('')}
                    </select><br>
                    <button type="button" onclick="updateCar('${car.id}')">Save</button>
                    <button type="button" onclick="closeUpdateForm()">Cancel</button>
                </form>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', formHtml);
    }

    window.updateModels = async function(brandId) {
        const select = document.querySelector('#carUpdateForm [name="modelID"]');
        const response = await fetch(`${detailsBaseUrl}models/${brandId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
            const models = await response.json();
            select.innerHTML = models.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        } else {
            select.innerHTML = '<option value="">No models available</option>';
        }
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
            colorID: parseInt(formData.get('colorID')),
            brandID: parseInt(formData.get('brandID')),
            modelID: parseInt(formData.get('modelID'))
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
                if (!response.ok) throw new Error(`Failed to update car: ${response.status} ${response.statusText}`);
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
                if (!response.ok) throw new Error(`Failed to delete car: ${response.status} ${response.statusText}`);
                alert('Car deleted successfully');
                fetchCars();
            })
            .catch(error => {
                console.error('Error deleting car:', error);
                alert('Failed to delete car: ' + error.message);
            });
    };

    // Search functionality by Plate Number
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');

    if (searchButton && searchInput) {
        searchButton.addEventListener('click', () => {
            const searchTerm = searchInput.value.trim().toLowerCase();
            if (!searchTerm) {
                displayCars(carsData);
                return;
            }
            const filteredCars = carsData.filter(car =>
                car.plateNumber?.toLowerCase().includes(searchTerm)
            );
            if (filteredCars.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">No cars found for plate number: "${searchTerm}"</td></tr>`;
            } else {
                displayCars(filteredCars);
            }
        });
    }

    fetchInitialData();
});