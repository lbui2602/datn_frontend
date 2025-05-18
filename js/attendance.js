// Kiểm tra đăng nhập
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    }
}

// Lấy danh sách chấm công
async function fetchAttendance() {
    const month = document.getElementById('monthFilter').value;
    const employeeId = document.getElementById('employeeFilter').value;
    
    try {
        let url = 'http://localhost:3000/api/attendance';
        if (month) url += `?month=${month}`;
        if (employeeId) url += `${month ? '&' : '?'}employeeId=${employeeId}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const attendance = await response.json();
            displayAttendance(attendance);
        } else {
            console.error('Failed to fetch attendance');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Hiển thị danh sách chấm công
function displayAttendance(attendanceList) {
    const tbody = document.querySelector('#attendanceTable tbody');
    tbody.innerHTML = '';

    attendanceList.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.id}</td>
            <td>${record.employeeName}</td>
            <td>${new Date(record.date).toLocaleDateString()}</td>
            <td>${record.timeIn}</td>
            <td>${record.timeOut}</td>
            <td>${record.totalHours}</td>
            <td>${getStatusText(record.status)}</td>
            <td>
                <button onclick="editAttendance(${record.id})" class="btn-primary">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Chuyển đổi trạng thái thành text
function getStatusText(status) {
    const statusMap = {
        'present': 'Có mặt',
        'absent': 'Vắng mặt',
        'late': 'Đi muộn'
    };
    return statusMap[status] || status;
}

// Lấy danh sách nhân viên cho filter
async function fetchEmployees() {
    try {
        const response = await fetch('http://localhost:3000/api/employees', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const employees = await response.json();
            const select = document.getElementById('employeeFilter');
            
            employees.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee.id;
                option.textContent = employee.fullName;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Mở modal chỉnh sửa chấm công
async function editAttendance(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/attendance/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const record = await response.json();
            document.getElementById('attendanceId').value = record.id;
            document.getElementById('attendanceDate').value = record.date.split('T')[0];
            document.getElementById('timeIn').value = record.timeIn;
            document.getElementById('timeOut').value = record.timeOut;
            document.getElementById('status').value = record.status;
            
            document.getElementById('editAttendanceModal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Lưu thông tin chấm công
document.getElementById('editAttendanceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const attendanceId = document.getElementById('attendanceId').value;
    const attendanceData = {
        date: document.getElementById('attendanceDate').value,
        timeIn: document.getElementById('timeIn').value,
        timeOut: document.getElementById('timeOut').value,
        status: document.getElementById('status').value
    };

    try {
        const response = await fetch(`http://localhost:3000/api/attendance/${attendanceId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(attendanceData)
        });

        if (response.ok) {
            alert('Cập nhật thông tin chấm công thành công');
            document.getElementById('editAttendanceModal').style.display = 'none';
            fetchAttendance();
        } else {
            alert('Cập nhật thông tin chấm công thất bại');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Có lỗi xảy ra khi cập nhật thông tin chấm công');
    }
});

// Đóng modal
document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('editAttendanceModal').style.display = 'none';
});

// Xuất file Excel
document.getElementById('exportAttendanceBtn').addEventListener('click', async function() {
    try {
        const month = document.getElementById('monthFilter').value;
        const employeeId = document.getElementById('employeeFilter').value;
        
        let url = 'http://localhost:3000/api/attendance/export';
        if (month) url += `?month=${month}`;
        if (employeeId) url += `${month ? '&' : '?'}employeeId=${employeeId}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'attendance.xlsx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } else {
            alert('Xuất file thất bại');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Có lỗi xảy ra khi xuất file');
    }
});

// Xử lý sự kiện thay đổi filter
document.getElementById('monthFilter').addEventListener('change', fetchAttendance);
document.getElementById('employeeFilter').addEventListener('change', fetchAttendance);

// Khởi tạo trang
window.addEventListener('load', function() {
    checkAuth();
    fetchEmployees();
    // Set default month filter to current month
    const now = new Date();
    document.getElementById('monthFilter').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    fetchAttendance();
}); 