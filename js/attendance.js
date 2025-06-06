// Kiểm tra đăng nhập
function checkAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
  }
}

// Lấy danh sách chấm công
async function fetchAttendance() {
  const monthYear = document.getElementById("monthYearFilter").value;
  const departmentId = document.getElementById("departmentFilter").value;
  const nameFilter = document.getElementById("nameFilter").value.trim();

  try {
    let url = "http://localhost:3000/api/attendance/getAllWithFilter";
    const body = {};
    const [year, month] = monthYear.split("-");
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
        displayAttendance(data.attendances);
        // Lưu dữ liệu để xuất Excel
        window.currentAttendances = data.attendances;
      } else {
        console.error("Failed to fetch attendance");
      }
    } else {
      console.error("Failed to fetch attendance");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Hiển thị danh sách chấm công
function displayAttendance(attendanceList) {
  const tbody = document.querySelector("#attendanceTable tbody");
  tbody.innerHTML = "";

  attendanceList.forEach((record) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${record.userId ? record.userId.fullName : "N/A"}</td>
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
    if (!window.currentAttendances || window.currentAttendances.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    // Chuẩn bị dữ liệu cho Excel
    const excelData = window.currentAttendances.map((record) => ({
      "Họ tên": record.userId ? record.userId.fullName : "N/A",
      Ngày: record.date || "",
      "Giờ chấm công": record.time || "",
      Loại: record.type === "check_in" ? "Vào" : "Ra",
    }));

    // Tạo workbook mới
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(wb, ws, "Chấm công");

    // Tạo tên file với ngày hiện tại
    const date = document.getElementById("monthYearFilter").value;
    const fileName = date
      ? `cham_cong_${date}.xlsx`
      : `cham_cong_${new Date()
          .toLocaleDateString("vi-VN")
          .replace(/\//g, "-")}.xlsx`;

    // Xuất file
    XLSX.writeFile(wb, fileName);
  } catch (error) {
    console.error("Error:", error);
    alert("Có lỗi xảy ra khi xuất file");
  }
}

// Thiết lập các event listener
document.addEventListener("DOMContentLoaded", function () {
  // Lấy danh sách phòng ban
  fetchDepartments();

  // Lấy danh sách chấm công
  fetchAttendance();

  // Xử lý sự kiện thay đổi tháng/năm
  document
    .getElementById("monthYearFilter")
    .addEventListener("change", fetchAttendance);

  // Xử lý sự kiện thay đổi phòng ban
  document
    .getElementById("departmentFilter")
    .addEventListener("change", fetchAttendance);

  // Xử lý sự kiện tìm kiếm theo tên - chỉ gọi khi người dùng thả phím
  document.getElementById("nameFilter").addEventListener("keyup", function (e) {
    if (e.key === "Enter") {
      fetchAttendance();
    }
  });

  // Xử lý sự kiện xuất Excel
  document
    .getElementById("exportExcelBtn")
    .addEventListener("click", exportToExcel);
});

// Xử lý đăng xuất
document.getElementById("logoutBtn").addEventListener("click", function () {
  localStorage.removeItem("token");
  localStorage.removeItem("data");
  window.location.href = "login.html";
});
