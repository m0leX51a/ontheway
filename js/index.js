document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.getElementById('loginButton');
    console.log('Login button:', loginButton);
    if (loginButton) {
        loginButton.addEventListener('click', function() {
            console.log('Button clicked! Redirecting...');
            window.location.href = './login.html';
        });
    } else {
        console.error('Login button not found!');
    }
});





