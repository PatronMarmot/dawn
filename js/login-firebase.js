document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const googleSignInBtn = document.getElementById('googleSignIn');
    const forgotPasswordLink = document.getElementById('forgotPassword');

    // Form gönderimi
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleFirebaseLogin();
    });

    // Google ile giriş
    googleSignInBtn.addEventListener('click', handleGoogleSignIn);

    // Şifremi unuttum
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        handleForgotPassword();
    });

    async function handleFirebaseLogin() {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Basit doğrulama
        if (!email || !password) {
            showError('E-posta ve şifre alanları boş bırakılamaz!');
            return;
        }

        if (!isValidEmail(email)) {
            showError('Geçerli bir e-posta adresi giriniz!');
            return;
        }

        // Loading durumu
        const loginBtn = document.querySelector('.login-btn');
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Giriş yapılıyor...';
        loginBtn.disabled = true;

        try {
            // Firebase ile giriş yap
            const userCredential = await window.signInWithEmailAndPassword(window.auth, email, password);
            const user = userCredential.user;

            // Beni hatırla özelliği
            if (rememberMeCheckbox.checked) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            showSuccess('Giriş başarılı! Yönlendiriliyorsunuz...');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);

        } catch (error) {
            console.error('Giriş hatası:', error);
            let errorMessage = 'Giriş sırasında bir hata oluştu!';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı!';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Şifre hatalı!';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Geçersiz e-posta adresi!';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'Bu hesap devre dışı bırakılmış!';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Çok fazla hatalı deneme! Lütfen daha sonra tekrar deneyin.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'İnternet bağlantısını kontrol edin!';
                    break;
            }
            
            showError(errorMessage);
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
    }

    async function handleGoogleSignIn() {
        try {
            const result = await window.signInWithPopup(window.auth, window.provider);
            const user = result.user;

            showSuccess('Google ile giriş başarılı! Yönlendiriliyorsunuz...');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);

        } catch (error) {
            console.error('Google giriş hatası:', error);
            let errorMessage = 'Google ile giriş sırasında bir hata oluştu!';
            
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Giriş penceresi kapatıldı!';
            }
            
            showError(errorMessage);
        }
    }

    async function handleForgotPassword() {
        const email = emailInput.value.trim();
        
        if (!email) {
            showError('Şifre sıfırlama için e-posta adresinizi girin!');
            emailInput.focus();
            return;
        }

        if (!isValidEmail(email)) {
            showError('Geçerli bir e-posta adresi giriniz!');
            return;
        }

        try {
            await window.sendPasswordResetEmail(window.auth, email);
            showSuccess('Şifre sıfırlama e-postası gönderildi! E-posta kutunuzu kontrol edin.');
        } catch (error) {
            console.error('Şifre sıfırlama hatası:', error);
            let errorMessage = 'Şifre sıfırlama sırasında bir hata oluştu!';
            
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı!';
            }
            
            showError(errorMessage);
        }
    }

    function checkRememberedEmail() {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            emailInput.value = rememberedEmail;
            rememberMeCheckbox.checked = true;
        }
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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

    // Sayfa yüklendiğinde hatırlanan e-postayı kontrol et
    checkRememberedEmail();
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