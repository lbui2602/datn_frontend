document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Kiểm tra mật khẩu xác nhận
    if (password !== confirmPassword) {
        alert('Mật khẩu xác nhận không khớp');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/register/admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fullName,
                email,
                password,
                phone
            })
        });

        const data = await response.json();

        if (response.ok && data.code === '1') {
            alert('Đăng ký thành công!');
            window.location.href = 'login.html';
        } else {
            alert(data.message || 'Đăng ký thất bại!');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Có lỗi xảy ra khi đăng ký');
    }
});
