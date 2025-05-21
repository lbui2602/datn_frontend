// Constants
const modal = document.getElementById('editEmployeeModal');
const employeeForm = document.getElementById('editEmployeeForm');
const API_URL = 'http://localhost:3000/api';
let departments = [];
let roles = [];

// Kiểm tra đăng nhập
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    }
}

// Khởi tạo trang
async function initializePage() {
    await Promise.all([
        fetchDepartments(),
        fetchRoles(),
        fetchEmployees()
    ]);
    setupEventListeners();
}

// Lấy danh sách phòng ban
async function fetchDepartments() {
    try {
        const response = await fetch(`${API_URL}/departments`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.code === "1" && data.departments) {
                departments = data.departments;
                populateDepartmentSelects();
            }
        }
    } catch (error) {
        console.error('Error fetching departments:', error);
    }
}

// Lấy danh sách vai trò
async function fetchRoles() {
    try {
        const response = await fetch(`${API_URL}/roles`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.code === "1" && data.roles) {
                roles = data.roles;
                populateRoleSelect();
            }
        }
    } catch (error) {
        console.error('Error fetching roles:', error);
    }
}

// Điền dữ liệu vào các select phòng ban
function populateDepartmentSelects() {
    const filterSelect = document.getElementById('departmentFilter');
    const modalSelect = document.getElementById('modalDepartment');
    
    const departmentOptions = departments.map(dept => 
        `<option value="${dept._id}">${dept.name}</option>`
    ).join('');
    
    filterSelect.innerHTML = '<option value="">Tất cả phòng ban</option>' + departmentOptions;
    modalSelect.innerHTML = '<option value="">Chọn phòng ban</option>' + departmentOptions;
}

// Điền dữ liệu vào select vai trò
function populateRoleSelect() {
    const roleSelect = document.getElementById('modalRole');
    
    const roleOptions = roles.map(role => 
        `<option value="${role._id}">${role.name}</option>`
    ).join('');
    
    roleSelect.innerHTML = '<option value="">Chọn vai trò</option>' + roleOptions;
}

// Lấy danh sách nhân viên
async function fetchEmployees(searchTerm = '', departmentId = '') {
    try {
        let url;
        if (departmentId) {
            url = `${API_URL}/auth/staff/${departmentId}`;
        } else if (searchTerm) {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            url = `${API_URL}/auth/getAll/${currentUser._id}?search=${encodeURIComponent(searchTerm)}`;
        } else {
            // Sử dụng ID của người dùng hiện tại từ localStorage
            const currentUser = JSON.parse(localStorage.getItem('user'));
            url = `${API_URL}/auth/getAll/${currentUser._id}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.code === "1") {
                // Kiểm tra xem dữ liệu trả về nằm trong thuộc tính nào
                const users = data.users || data.staffs || data.searchResults || [];
                // Store the current employees for Excel export
                window.currentEmployees = users;
                displayEmployees(users);
            } else {
                console.error('Failed to fetch employees:', data.message);
                displayEmployees([]);
            }
        } else {
            throw new Error('Failed to fetch employees');
        }
    } catch (error) {
        console.error('Error fetching employees:', error);
        alert('Có lỗi xảy ra khi tải danh sách nhân viên.');
        displayEmployees([]);
    }
}

// Hiển thị danh sách nhân viên
function displayEmployees(employees) {
    const tbody = document.querySelector('#employeesTable tbody');
    tbody.innerHTML = '';

    if (!employees || employees.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 11;
        cell.textContent = 'Không có dữ liệu nhân viên.';
        cell.className = 'text-center';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    employees.forEach(employee => {
        const row = document.createElement('tr');
        const department = departments.find(d => d._id === employee.idDepartment);
        const role = roles.find(r => r._id === employee.roleId);

        row.innerHTML = `
            <td>${employee._id}</td>
            <td>${employee.fullName || ''}</td>
            <td>${employee.email || ''}</td>
            <td>${employee.phone || ''}</td>
            <td>${employee.address || ''}</td>
            <td>${employee.birthday || ''}</td>
            <td>${employee.gender}</td>
            <td>${department ? department.name : ''}</td>
            <td>${role ? role.name : ''}</td>
            <td>${employee.image ? `<a href="http://localhost:3000${employee.image}" target="_blank">Xem</a>` : 'N/A'}</td>

            <td>
                <span class="status-badge ${employee.status ? 'active' : 'inactive'}">
                    ${employee.status ? 'Xác nhận' : 'Khóa'}
                </span>
            </td>
            <td>
                <button onclick="openEditModal('${employee._id}')" class="btn-icon" title="Sửa" style="margin: 1px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteEmployee('${employee._id}')" class="btn-icon btn-danger" title="Xóa" style="margin: 1px;">
                    <i class="fas fa-trash"></i>
                </button>
                <button onclick="toggleStatus('${employee._id}')" class="btn-icon ${employee.status ? 'btn-warning' : 'btn-success'}" title="${employee.status ? 'Khóa' : 'Xác nhận'}" style="margin: 1px;">
                    <i class="fas fa-${employee.status ? 'ban' : 'check'}"></i>
                </button>
            </td>`;
        tbody.appendChild(row);
    });
}

// Mở modal thêm nhân viên
function openAddModal() {
    modalTitle.textContent = 'Thêm nhân viên mới';
    employeeForm.reset();
    document.getElementById('employeeId').value = '';
    document.getElementById('modalPassword').required = true;
    document.querySelector('.password-group').style.display = 'block';
    modal.style.display = 'block';
}

// Mở modal chỉnh sửa nhân viên
async function openEditModal(id) {
    try {
        let url = `${API_URL}/auth/getProfileByUserId/${id}`
        console.log(url)
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.code === "1" && data.user) {
                const user = data.user;
                modalTitle.textContent = 'Chỉnh sửa thông tin nhân viên';
                document.getElementById('employeeId').value = user._id;
                document.getElementById('modalFullName').value = user.fullName || '';
                document.getElementById('modalEmail').value = user.email || '';
                document.getElementById('modalPhone').value = user.phone || '';
                document.getElementById('modalAddress').value = user.address || '';
                const birthday = user.birthday; // giả sử là "18-05-2025"
                if (birthday) {
                    const parts = birthday.split('-'); // [18, 05, 2025]
                    const formatted = `${parts[2]}-${parts[1]}-${parts[0]}`; // "2025-05-18"
                    document.getElementById('modalBirthday').value = formatted;
                } else {
                    document.getElementById('modalBirthday').value = '';
                }
                document.getElementById('modalGender').value = user.gender || '';
                document.getElementById('modalDepartment').value = user.idDepartment || '';
                document.getElementById('modalRole').value = user.roleId || '';
                
                // Ẩn trường mật khẩu khi chỉnh sửa
                document.getElementById('modalPassword').required = false;
                document.querySelector('.password-group').style.display = 'none';
                
                modal.style.display = 'block';
            }
        } else {
            throw new Error('Failed to fetch employee details');
        }
    } catch (error) {
        console.log('Error opening edit modal:', error);
        alert('Có lỗi xảy ra khi mở form chỉnh sửa.');
    }
}

// Xóa nhân viên
async function deleteEmployee(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
        return;
    }

    try {
        var url = `${API_URL}/auth/delete/${id}`
        var token = localStorage.getItem('token')
        console.log(token)
        const response = await fetch(`${API_URL}/auth/delete/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.code === "1") {
                alert('Xóa nhân viên thành công');
                await fetchEmployees(
                    document.getElementById('searchEmployee').value.trim(),
                    document.getElementById('departmentFilter').value
                );
            } else {
                throw new Error(data.message);
            }
        } else {
            throw new Error('Failed to delete employee');
        }
    } catch (error) {
        console.error('Error deleting employee:', error);
        alert('Có lỗi xảy ra khi xóa nhân viên: ' + error.message);
    }
}

// Thay đổi trạng thái nhân viên
async function toggleStatus(id) {
    try {
        const response = await fetch(`${API_URL}/auth/accept`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ userId: id })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.code === "1") {
                await fetchEmployees(
                    document.getElementById('searchEmployee').value.trim(),
                    document.getElementById('departmentFilter').value
                );
            } else {
                throw new Error(data.message);
            }
        } else {
            throw new Error('Failed to toggle status');
        }
    } catch (error) {
        console.error('Error toggling status:', error);
        alert('Có lỗi xảy ra khi thay đổi trạng thái: ' + error.message);
    }
}

// Xử lý form thêm/sửa nhân viên
employeeForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const employeeId = document.getElementById('employeeId').value;

    const birthdayInput = document.getElementById('modalBirthday').value;
    const [year, month, day] = birthdayInput.split('-');
    const formattedBirthday = `${day}-${month}-${year}`;
    const employeeData = {
        _id : employeeId,
        fullName: document.getElementById('modalFullName').value,
        email: document.getElementById('modalEmail').value,
        phone: document.getElementById('modalPhone').value,
        address: document.getElementById('modalAddress').value,
        birthday: formattedBirthday,
        gender: document.getElementById('modalGender').value,
        roleId: document.getElementById('modalRole').value,
        idDepartment: document.getElementById('modalDepartment').value,
    };

    // Thêm mật khẩu nếu là thêm mới
    if (!employeeId) {
        const password = document.getElementById('modalPassword').value;
        if (!password) {
            alert('Vui lòng nhập mật khẩu cho nhân viên mới.');
            return;
        }
        employeeData.password = password;
    }

    try {
        const method = employeeId ? 'PUT' : 'POST';
        const url = employeeId ? `${API_URL}/auth/update` : `${API_URL}/auth/register`;

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(employeeData)
        });

        const data = await response.json();
        
        if (data.code === "1") {
            alert(employeeId ? 'Cập nhật thông tin thành công' : 'Thêm nhân viên thành công');
            closeModal();
            await fetchEmployees(
                document.getElementById('searchEmployee').value.trim(),
                document.getElementById('departmentFilter').value
            );
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error saving employee:', error);
        alert(`Có lỗi xảy ra: ${error.message}`);
    }
});

// Thiết lập các event listener
function setupEventListeners() {
    // Nút thêm nhân viên
    document.getElementById('addEmployeeBtn').addEventListener('click', openAddModal);

    // Tìm kiếm nhân viên
    document.getElementById('searchEmployee').addEventListener('input', debounce(function(e) {
        fetchEmployees(
            e.target.value.trim(),
            document.getElementById('departmentFilter').value
        );
    }, 300));

    // Lọc theo phòng ban
    document.getElementById('departmentFilter').addEventListener('change', function(e) {
        fetchEmployees(
            document.getElementById('searchEmployee').value.trim(),
            e.target.value
        );
    });

    // Nút đăng xuất
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('token');
        localStorage.removeItem('data');
        window.location.href = 'login.html';
    });

    // Đóng modal
    document.querySelector('.modal .close').addEventListener('click', closeModal);
    window.addEventListener('click', function(event) {
        if (event.target == modal) {
            closeModal();
        }
    });

    // Xuất file Excel
    document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);
}

// Đóng modal
function closeModal() {
    modal.style.display = 'none';
    employeeForm.reset();
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Xuất file Excel
function exportToExcel() {
    try {
        if (!window.currentEmployees || window.currentEmployees.length === 0) {
            alert("Không có dữ liệu để xuất!");
            return;
        }

        // Chuẩn bị dữ liệu cho Excel
        const excelData = window.currentEmployees.map(employee => {
            const department = departments.find(d => d._id === employee.idDepartment);
            const role = roles.find(r => r._id === employee.roleId);
            
            return {
                "ID": employee._id || "N/A",
                "Họ tên": employee.fullName || "N/A",
                "Email": employee.email || "N/A",
                "Số điện thoại": employee.phone || "N/A",
                "Địa chỉ": employee.address || "N/A",
                "Ngày sinh": employee.birthday || "N/A",
                "Giới tính": employee.gender || "N/A",
                "Phòng ban": department ? department.name : "N/A",
                "Trạng thái": employee.status ? "Xác nhận" : "Khóa"
            };
        });

        // Tạo workbook mới
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Thêm worksheet vào workbook
        XLSX.utils.book_append_sheet(wb, ws, "Nhân viên");

        // Xuất file với tên phù hợp
        const fileName = `danh_sach_nhan_vien_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
        XLSX.writeFile(wb, fileName);
    } catch (error) {
        console.error("Error:", error);
        alert("Có lỗi xảy ra khi xuất file");
    }
}

// Khởi tạo trang khi load
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializePage();
});