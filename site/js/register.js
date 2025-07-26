document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');

    // Şifre gücü kontrolü
    passwordInput.addEventListener('input', checkPasswordStrength);
    
    // Form gönderimi
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleRegister();
    });

    function handleRegister() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        // Doğrulamalar
        if (!firstName || !lastName || !email || !username || !password || !confirmPassword) {
            showError('Tüm alanları doldurunuz!');
            return;
        }

        if (!isValidEmail(email)) {
            showError('Geçerli bir e-posta adresi giriniz!');
            return;
        }

        if (username.length < 3) {
            showError('Kullanıcı adı en az 3 karakter olmalıdır!');
            return;
        }

        if (password.length < 6) {
            showError('Şifre en az 6 karakter olmalıdır!');
            return;
        }

        if (password !== confirmPassword) {
            showError('Şifreler eşleşmiyor!');
            return;
        }

        if (!agreeTerms) {
            showError('Kullanım şartlarını kabul etmelisiniz!');
            return;
        }

        // Kullanıcı var mı kontrol et
        const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
        if (existingUsers.some(user => user.username === username)) {
            showError('Bu kullanıcı adı zaten kullanılıyor!');
            return;
        }

        if (existingUsers.some(user => user.email === email)) {
            showError('Bu e-posta adresi zaten kayıtlı!');
            return;
        }

        // Loading durumu
        const registerBtn = document.querySelector('.register-btn');
        const originalText = registerBtn.innerHTML;
        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kayıt oluşturuluyor...';
        registerBtn.disabled = true;

        // Simüle edilmiş kayıt işlemi
        setTimeout(() => {
            const newUser = {
                id: Date.now(),
                firstName,
                lastName,
                email,
                username,
                password,
                newsletter: document.getElementById('newsletter').checked,
                createdAt: new Date().toISOString()
            };

            existingUsers.push(newUser);
            localStorage.setItem('users', JSON.stringify(existingUsers));
            localStorage.setItem('currentUser', JSON.stringify(newUser));

            showSuccess('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }, 2000);
    }

    function checkPasswordStrength() {
        const password = passwordInput.value;
        let strength = 0;
        let strengthLabel = '';
        
        // Şifre gücü kriterleri
        if (password.length >= 6) strength++;
        if (password.match(/[a-z]/)) strength++;
        if (password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;

        // Şifre gücüne göre sınıf ve metin
        strengthBar.className = 'strength-bar';
        
        if (password.length === 0) {
            strengthLabel = 'Şifre Gücü';
        } else if (strength <= 2) {
            strengthBar.classList.add('weak');
            strengthLabel = 'Zayıf';
        } else if (strength === 3) {
            strengthBar.classList.add('fair');
            strengthLabel = 'Orta';
        } else if (strength === 4) {
            strengthBar.classList.add('good');
            strengthLabel = 'İyi';
        } else {
            strengthBar.classList.add('strong');
            strengthLabel = 'Güçlü';
        }

        strengthText.textContent = strengthLabel;
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function showError(message) {
        removeExistingAlerts();
        const alert = createAlert(message, 'error');
        document.querySelector('.register-form').insertBefore(alert, registerForm);
    }

    function showSuccess(message) {
        removeExistingAlerts();
        const alert = createAlert(message, 'success');
        document.querySelector('.register-form').insertBefore(alert, registerForm);
    }

    function createAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
            <span>${message}</span>
        `;
        
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

    // Google kayıt simülasyonu
    document.querySelector('.google-btn').addEventListener('click', function() {
        showError('Google kaydı henüz aktif değil!');
    });
});

// Şifre görünürlük toggle
function togglePassword(inputId) {
    const passwordInput = document.getElementById(inputId);
    const eyeIcon = document.getElementById(inputId === 'password' ? 'eyeIcon1' : 'eyeIcon2');
    
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