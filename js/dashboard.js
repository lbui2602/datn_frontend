// Kiểm tra đăng nhập
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    }
}

// Lấy thông tin thống kê
async function fetchDashboardStats() {
    try {
        const response = await fetch('http://localhost:3000/api/dashboard/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById('totalEmployees').textContent = data.totalEmployees;
            document.getElementById('todayAttendance').textContent = data.todayAttendance;
            document.getElementById('monthlyWorkdays').textContent = data.monthlyWorkdays;
        } else {
            console.error('Failed to fetch dashboard stats');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Hiển thị thông tin người dùng
function displayUserInfo() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('currentUser').textContent = user.username;
    }
}

// Xử lý đăng xuất
document.getElementById('logoutBtn').addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('data');
    window.location.href = 'login.html';
});

// Khởi tạo trang
window.addEventListener('load', function() {
    checkAuth();
    displayUserInfo();
    fetchDashboardStats();
}); 