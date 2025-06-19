document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("authToken");

    if (!token) {
        alert("Unauthorized: No token found. Redirecting to login...");
        window.location.href = "login.html"; // Adjust if your login page is named differently
        return;
    }

    fetch("https://ontheway.runasp.net/GetAll", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token,
            "Accept": "*/*"
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Unauthorized. Please login again.");
            }
            throw new Error("Failed to fetch users.");
        }
        return response.json();
    })
    .then(users => {
        const tbody = document.querySelector("#users-table tbody");
        tbody.innerHTML = ""; // Clear existing content

        users.forEach(user => {
            // Skip the "admin2@admin.com" user
            if (user.email === 'admin2@admin.com') return;
            
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>
                    ${user.imageUrl
                        ? `<img src="${user.imageUrl}" alt="User Photo" style="width: 50px; height: 50px; border-radius: 50%;" onerror="this.src='https://via.placeholder.com/50';">`
                        : `<img src="https://via.placeholder.com/50" alt="No Image" style="width: 50px; height: 50px; border-radius: 50%;">`}
                </td>
                <td>${user.firstName} ${user.lastName || ''}</td>
                <td>${user.email}</td>
                <td>${user.phoneNumber}</td>
                <td>
                    <button class="delete-btn" data-id="${user.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });

        // Add delete functionality
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', () => {
                const userId = button.getAttribute('data-id');
                if (confirm(`Are you sure you want to delete user with ID: ${userId}?`)) {
                    deleteUser(userId);
                }
            });
        });
    })
    .catch(error => {
        console.error("Error:", error);
        alert(error.message || "An unexpected error occurred.");
    });

    function deleteUser(userId) {
        fetch(`https://ontheway.runasp.net/Delete/${userId}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to delete user: ${response.status} ${response.statusText}`);
            }
            alert("User deleted successfully");
            // Refresh the user list
            location.reload();
        })
        .catch(error => {
            console.error("Error deleting user:", error);
            alert("Failed to delete user: " + error.message);
        });
    }
});