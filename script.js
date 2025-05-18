function showTab(id) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

function loadData(endpoint, containerId) {
  fetch('http://localhost:3000' + endpoint)
    .then(res => res.json())
    .then(data => {
      document.getElementById(containerId).innerHTML =
        '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
    })
    .catch(err => {
      document.getElementById(containerId).innerHTML =
        '<span style="color:red;">Lỗi tải dữ liệu</span>';
    });
}
