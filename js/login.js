document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    // Sayfa yüklendiğinde hatırlanan kullanıcıyı kontrol et
    checkRememberedUser();

    // Form gönderimi
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });

    // Enter tuşu ile giriş
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });

    function handleLogin() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // Basit doğrulama
        if (!username || !password) {
            showError('Kullanıcı adı ve şifre alanları boş bırakılamaz!');
            return;
        }

        // Loading durumu
        const loginBtn = document.querySelector('.login-btn');
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Giriş yapılıyor...';
        loginBtn.disabled = true;

        // Simüle edilmiş giriş kontrolü
        setTimeout(() => {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.username === username && u.password === password);

            if (user) {
                // Başarılı giriş
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                // Beni hatırla özelliği
                if (rememberMeCheckbox.checked) {
                    localStorage.setItem('rememberedUser', username);
                } else {
                    localStorage.removeItem('rememberedUser');
                }

                showSuccess('Giriş başarılı! Yönlendiriliyorsunuz...');
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                showError('Kullanıcı adı veya şifre hatalı!');
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
            }
        }, 1500);
    }

    function checkRememberedUser() {
        const rememberedUser = localStorage.getItem('rememberedUser');
        if (rememberedUser) {
            usernameInput.value = rememberedUser;
            rememberMeCheckbox.checked = true;
        }
    }

    function showError(message) {
        removeExistingAlerts();
        const alert = createAlert(message, 'error');
        document.querySelector('.login-form').insertBefore(alert, loginForm);
    }

    function showSuccess(message) {
        removeExistingAlerts();
        const alert = createAlert(message, 'success');
        document.querySelector('.login-form').insertBefore(alert, loginForm);
    }

    function createAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Alert stilleri
        alert.style.cssText = `
            display: flex;
            align-items: center;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 10px;
            font-size: 0.9rem;
            background: ${type === 'error' ? '#ffe6e6' : '#e6ffe6'};
            color: ${type === 'error' ? '#d63031' : '#00b894'};
            border: 1px solid ${type === 'error' ? '#fab1a0' : '#81ecec'};
            animation: slideIn 0.3s ease;
        `;

        alert.querySelector('i').style.marginRight = '10px';
        
        return alert;
    }

    function removeExistingAlerts() {
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
    }

    // Google giriş simülasyonu
    document.querySelector('.google-btn').addEventListener('click', function() {
        showError('Google girişi henüz aktif değil!');
    });
});

// Şifre görünürlük toggle
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        eyeIcon.className = 'fas fa-eye';
    }
}

// CSS animasyonu ekleme
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);