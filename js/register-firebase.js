document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const googleSignUpBtn = document.getElementById('googleSignUp');

    // Şifre gücü kontrolü
    passwordInput.addEventListener('input', checkPasswordStrength);
    
    // Form gönderimi
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleFirebaseRegister();
    });

    // Google ile kayıt
    googleSignUpBtn.addEventListener('click', handleGoogleSignUp);

    async function handleFirebaseRegister() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const agreeTerms = document.getElementById('agreeTerms').checked;
        const newsletter = document.getElementById('newsletter').checked;

        // Doğrulamalar
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            showError('Tüm alanları doldurunuz!');
            return;
        }

        if (!isValidEmail(email)) {
            showError('Geçerli bir e-posta adresi giriniz!');
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

        // Loading durumu
        const registerBtn = document.querySelector('.register-btn');
        const originalText = registerBtn.innerHTML;
        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kayıt oluşturuluyor...';
        registerBtn.disabled = true;

        try {
            // Firebase ile kullanıcı oluştur
            const userCredential = await window.createUserWithEmailAndPassword(window.auth, email, password);
            const user = userCredential.user;

            // Kullanıcı profil bilgilerini güncelle
            await window.updateProfile(user, {
                displayName: `${firstName} ${lastName}`
            });

            // Firestore'da kullanıcı verilerini kaydet
            await window.setDoc(window.doc(window.db, 'users', user.uid), {
                firstName: firstName,
                lastName: lastName,
                email: email,
                newsletter: newsletter,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            });

            showSuccess('Kayıt başarılı! Dashboard\'a yönlendiriliyorsunuz...');

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);

        } catch (error) {
            console.error('Kayıt hatası:', error);
            let errorMessage = 'Kayıt sırasında bir hata oluştu!';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Bu e-posta adresi zaten kullanılıyor!';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Geçersiz e-posta adresi!';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Şifre çok zayıf! En az 6 karakter olmalıdır.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'İnternet bağlantısını kontrol edin!';
                    break;
            }
            
            showError(errorMessage);
            registerBtn.innerHTML = originalText;
            registerBtn.disabled = false;
        }
    }

    async function handleGoogleSignUp() {
        try {
            const result = await window.signInWithPopup(window.auth, window.provider);
            const user = result.user;

            // Firestore'da kullanıcı verilerini kaydet
            await window.setDoc(window.doc(window.db, 'users', user.uid), {
                firstName: user.displayName?.split(' ')[0] || '',
                lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                email: user.email,
                newsletter: false,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                provider: 'google'
            });

            showSuccess('Google ile kayıt başarılı! Yönlendiriliyorsunuz...');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);

        } catch (error) {
            console.error('Google kayıt hatası:', error);
            showError('Google ile kayıt sırasında bir hata oluştu!');
        }
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