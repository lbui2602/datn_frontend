document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('username').value; // input vẫn là username nhưng gửi là email
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.code === "1") {
            console.log(data.isAdmin)
            // Kiểm tra isAdmin
            if (data && data.isAdmin) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data));
                window.location.href = 'dashboard.html';
            } else {
                alert("Bạn không có quyền truy cập trang admin.");
            }
        } else {
            alert(data.message || 'Đăng nhập thất bại');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Có lỗi xảy ra khi đăng nhập');
    }
});
