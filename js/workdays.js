// Kiểm tra đăng nhập
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    }
}

// Lấy danh sách ngày công
async function fetchWorkdays() {
    const monthYear = document.getElementById('monthYearFilter').value;
    const department = document.getElementById('departmentFilter').value;
    
    try {
        let url = 'http://localhost:3000/api/workdays';
        if (monthYear) url += `?monthYear=${monthYear}`;
        if (department) url += `${monthYear ? '&' : '?'}department=${department}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const workdays = await response.json();
            displayWorkdays(workdays);
        } else {
            console.error('Failed to fetch workdays');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Hiển thị danh sách ngày công
function displayWorkdays(workdaysList) {
    const tbody = document.querySelector('#workdaysTable tbody');
    tbody.innerHTML = '';

    workdaysList.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.id}</td>
            <td>${record.employeeName}</td>
            <td>${record.department}</td>
            <td>${record.totalWorkdays}</td>
            <td>${record.leaveDays}</td>
            <td>${record.overtimeDays}</td>
            <td>${record.holidayDays}</td>
            <td>
                <button onclick="editWorkday(${record.id})" class="btn-primary">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Lấy danh sách phòng ban cho filter
async function fetchDepartments() {
    try {
        const response = await fetch('http://localhost:3000/api/departments', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const departments = await response.json();
            const select = document.getElementById('departmentFilter');
            
            departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.id;
                option.textContent = dept.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Mở modal chỉnh sửa ngày công
async function editWorkday(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/workdays/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const record = await response.json();
            document.getElementById('workdayId').value = record.id;
            document.getElementById('employeeName').value = record.employeeName;
            document.getElementById('totalWorkdays').value = record.totalWorkdays;
            document.getElementById('leavedays').value = record.leaveDays;
            document.getElementById('overtimeDays').value = record.overtimeDays;
            document.getElementById('holidayDays').value = record.holidayDays;
            
            document.getElementById('editWorkdayModal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Lưu thông tin ngày công
document.getElementById('editWorkdayForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const workdayId = document.getElementById('workdayId').value;
    const workdayData = {
        totalWorkdays: parseInt(document.getElementById('totalWorkdays').value),
        leaveDays: parseInt(document.getElementById('leavedays').value),
        overtimeDays: parseInt(document.getElementById('overtimeDays').value),
        holidayDays: parseInt(document.getElementById('holidayDays').value)
    };

    try {
        const response = await fetch(`http://localhost:3000/api/workdays/${workdayId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(workdayData)
        });

        if (response.ok) {
            alert('Cập nhật thông tin ngày công thành công');
            document.getElementById('editWorkdayModal').style.display = 'none';
            fetchWorkdays();
        } else {
            alert('Cập nhật thông tin ngày công thất bại');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Có lỗi xảy ra khi cập nhật thông tin ngày công');
    }
});

// Đóng modal
document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('editWorkdayModal').style.display = 'none';
});

// Xuất file Excel
document.getElementById('exportWorkdaysBtn').addEventListener('click', async function() {
    try {
        const monthYear = document.getElementById('monthYearFilter').value;
        const department = document.getElementById('departmentFilter').value;
        
        let url = 'http://localhost:3000/api/workdays/export';
        if (monthYear) url += `?monthYear=${monthYear}`;
        if (department) url += `${monthYear ? '&' : '?'}department=${department}`;

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
            a.download = 'workdays.xlsx';
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
document.getElementById('monthYearFilter').addEventListener('change', fetchWorkdays);
document.getElementById('departmentFilter').addEventListener('change', fetchWorkdays);

// Khởi tạo trang
window.addEventListener('load', function() {
    checkAuth();
    fetchDepartments();
    // Set default month filter to current month
    const now = new Date();
    document.getElementById('monthYearFilter').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    fetchWorkdays();
}); 