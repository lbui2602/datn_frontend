document.addEventListener('DOMContentLoaded', function() {
    const changePasswordForm = document.getElementById('changePasswordForm');
    const logoutBtn = document.getElementById('logoutBtn');

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Handle logout
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });

    // Handle password change
    changePasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate passwords
        if (newPassword !== confirmPassword) {
            alert('Mật khẩu mới và xác nhận mật khẩu không khớp!');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/auth/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    oldPassword,
                    newPassword
                })
            });

            const data = await response.json();

            if (data.code === '1') {
                alert('Đổi mật khẩu thành công!');
                changePasswordForm.reset();
            } else {
                alert(data.message || 'Có lỗi xảy ra khi đổi mật khẩu!');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi đổi mật khẩu!');
        }
    });
}); 