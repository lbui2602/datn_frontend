// Kiểm tra đăng nhập
function checkAuth() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
    }
}

// Lấy danh sách ngày công
async function fetchWorkdays() {
    const monthYear = document.getElementById("monthYearFilter").value;
    const departmentId = document.getElementById("departmentFilter").value;
    const nameFilter = document.getElementById("nameFilter").value.trim();

    try {
        let url = "http://localhost:3000/api/working-days/getAllWithFilter";
        const body = {};
        const [year, month] = monthYear.split('-');
        const formattedDate = `${month}-${year}`;
        if (monthYear) body.monthYear = formattedDate;
        if (departmentId) body.idDepartment = departmentId;
        if (nameFilter) body.name = nameFilter;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(body),
        });

        if (response.ok) {
            const data = await response.json();
            if (data.code === "1") {
                displayWorkdays(data.workingDays);
                // Lưu dữ liệu để xuất Excel
                window.currentWorkingDays = data.workingDays;
            } else {
                console.error("Failed to fetch workdays");
            }
        } else {
            console.error("Failed to fetch workdays");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// Hiển thị danh sách ngày công
function displayWorkdays(workingDays) {
    const tbody = document.querySelector("#workdaysTable tbody");
    tbody.innerHTML = "";

    workingDays.forEach((record) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${record.userId ? record.userId.fullName : "N/A"}</td>
            <td>${record.date || ""}</td>
            <td>${record.totalHours || 0}</td>
            <td>
                <button onclick="showDetails('${record._id}')" class="btn-primary">
                    <i class="fas fa-eye"></i> Xem chi tiết
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Hiển thị chi tiết chấm công trong modal
async function showDetails(workingDayId) {
    try {
        const response = await fetch(`http://localhost:3000/api/working-days/${workingDayId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            if (data.code === "1") {
                displayAttendanceDetails(data.workingDay);
                document.getElementById("detailModal").style.display = "block";
            }
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// Hiển thị chi tiết chấm công
function displayAttendanceDetails(workingDay) {
    const tbody = document.querySelector("#detailTable tbody");
    tbody.innerHTML = "";

    workingDay.attendances.forEach((record) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${workingDay.userId ? workingDay.userId.fullName : "N/A"}</td>
            <td>${record.date || ""}</td>
            <td>${record.time}</td>
            <td>${record.type === "check_in" ? "Vào" : "Ra"}</td>
            <td>${
                record.image
                    ? `<a href="http://localhost:3000${record.image}" target="_blank">Xem</a>`
                    : "N/A"
            }</td>
        `;
        tbody.appendChild(row);
    });
}

// Lấy danh sách phòng ban cho filter
async function fetchDepartments() {
    try {
        const response = await fetch("http://localhost:3000/api/departments", {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            if (data.code === "1") {
                const select = document.getElementById("departmentFilter");
                select.innerHTML = '<option value="">Tất cả phòng ban</option>';

                data.departments.forEach((department) => {
                    const option = document.createElement("option");
                    option.value = department._id;
                    option.textContent = department.name;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// Xuất file Excel từ dữ liệu trên màn hình
function exportToExcel() {
    try {
        if (!window.currentWorkingDays || window.currentWorkingDays.length === 0) {
            alert("Không có dữ liệu để xuất!");
            return;
        }

        // Chuẩn bị dữ liệu cho Excel
        const excelData = window.currentWorkingDays.map(record => ({
            "Họ tên": record.userId ? record.userId.fullName : "N/A",
            "Ngày": record.date || "",
            "Tổng số giờ": record.totalHours || 0
        }));

        // Tạo workbook mới
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Thêm worksheet vào workbook
        XLSX.utils.book_append_sheet(wb, ws, "Ngày công");

        // Tạo tên file với tháng/năm hiện tại
        const monthYear = document.getElementById("monthYearFilter").value;
        const fileName = monthYear 
            ? `ngay_cong_${monthYear}.xlsx` 
            : `ngay_cong_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;

        // Xuất file
        XLSX.writeFile(wb, fileName);
    } catch (error) {
        console.error("Error:", error);
        alert("Có lỗi xảy ra khi xuất file");
    }
}

// Đóng modal
document.querySelector(".close").addEventListener("click", function () {
    document.getElementById("detailModal").style.display = "none";
});

// Đóng modal khi click bên ngoài
window.onclick = function (event) {
    const modal = document.getElementById("detailModal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

// Thiết lập các event listener
document.addEventListener("DOMContentLoaded", function () {
    // Lấy danh sách phòng ban
    fetchDepartments();

    // Lấy danh sách ngày công
    fetchWorkdays();

    // Xử lý sự kiện thay đổi tháng/năm
    document.getElementById("monthYearFilter").addEventListener("change", fetchWorkdays);

    // Xử lý sự kiện thay đổi phòng ban
    document.getElementById("departmentFilter").addEventListener("change", fetchWorkdays);

    // Xử lý sự kiện tìm kiếm theo tên - chỉ gọi khi người dùng thả phím
    document.getElementById("nameFilter").addEventListener("keyup", function(e) {
        if (e.key === "Enter") {
            fetchWorkdays();
        }
    });

    // Xử lý sự kiện xuất Excel
    document.getElementById("exportExcelBtn").addEventListener("click", exportToExcel);
});

// Xử lý đăng xuất
document.getElementById("logoutBtn").addEventListener("click", function () {
    localStorage.removeItem("token");
    localStorage.removeItem("data");
    window.location.href = "login.html";
}); 