document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    try {
        const response = await fetch('https://ontheway.runasp.net/api/Auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.status === 200) {
            // Store the token in localStorage
            localStorage.setItem('authToken', data.token);
            // Navigate to dashboard
            window.location.href = 'dashboard.html';
        } else {
            errorMessage.style.display = 'block';
            errorMessage.textContent = data.message || 'Invalid email or password';
        }
    } catch (error) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'An error occurred. Please try again later.';
    }
});