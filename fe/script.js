$(document).ready(function () {
    $("#files").change(function () {
        let files = $("#files")[0].files;
        let fileNames = [];

        for (let i = 0; i < files.length; i++) {
            fileNames.push(files[i].name);
        }

        if (fileNames.length > 0) {
            $("#fileNames").text("File đã chọn: " + fileNames.join(", "));
        } else {
            $("#fileNames").text("");
        }
    });

    $("#uploadForm").submit(function (event) {
        event.preventDefault();

        let files = $("#files")[0].files;
        if (files.length < 2 || files.length > 5) {
            alert("Vui lòng chọn tối thiểu 2 và tối đa 5 file!");
            return;
        }

        let formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append("files", files[i]);
        }

        // ✅ Xóa toàn bộ dữ liệu bảng trước khi cập nhật
        resetTables();

        fetch("/upload", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(uploadResponse => {
            console.log("📂 Danh sách file sau khi tải lên:", uploadResponse.files);
            return fetch('/get_data');  // ✅ Gọi ngay sau khi tải lên để lấy dữ liệu mới
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error("❌ Lỗi từ server:", data.error);
                alert(data.error);
                return;
            }


            // ✅ Cập nhật tên file đúng từ server
            $("#file1Name").text(data.file1_name);
            $("#file2Name").text(data.file2_name);
            $("#file1ErrorNameCompare").text(data.file1_name);
            $("#file1ErrorClassCompare").text(data.file1_name);
            $("#file2ErrorNameCompare").text(data.file2_name);
            $("#file2ErrorClassCompare").text(data.file2_name);

            // ✅ Hiển thị dữ liệu đúng vị trí bảng
            populateTable("table1", data.file1);
            populateTable("table2", data.file2);
        })
        .catch(error => console.error("❌ Lỗi khi tải file hoặc lấy dữ liệu:", error));
    });

    function resetTables() {
        // ✅ Hủy DataTable nếu đã khởi tạo
        if ($.fn.DataTable.isDataTable("#table1")) {
            $("#table1").DataTable().clear().destroy();
        }
        if ($.fn.DataTable.isDataTable("#table2")) {
            $("#table2").DataTable().clear().destroy();
        }

        // ✅ Xóa tất cả dữ liệu trong tbody trước khi thêm mới
        $("#table1 tbody").empty();
        $("#table2 tbody").empty();
    }

    function populateTable(tableId, data) {
        let tableBody = $("#" + tableId).find("tbody");
        tableBody.empty(); // ✅ Đảm bảo dữ liệu cũ bị xóa hoàn toàn
        data.forEach(row => {
            let tr = $("<tr>");
            tr.append(`<td>${row.MSSV}</td>`);
            tr.append(`<td>${row.HOTEN}</td>`);
            tr.append(`<td>${row.LOP}</td>`);
            tableBody.append(tr);
        });

        // ✅ Khởi tạo lại DataTable sau khi thêm dữ liệu mới
        $("#" + tableId).DataTable({
            "destroy": true,
            "paging": true,
            "lengthChange": false,
            "pageLength": 10,
            "scrollY": "300px",
            "scrollCollapse": true,
            "searching": true,
            "ordering": true
        });
    }

    window.compareData = function () {
        fetch('/compare')
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error("❌ Lỗi từ server:", data.error);
                    alert(data.error);
                    return;
                }
    
                let errorTableBody = $("#errorTable").find("tbody");
                errorTableBody.empty(); // ✅ Xóa dữ liệu cũ trước khi cập nhật mới
    
                // ✅ Cập nhật tên file trong tiêu đề bảng so sánh
                $("#file1ErrorNameCompare").text(data.file1_name);
                $("#file1ErrorClassCompare").text(data.file1_name);
                $("#file2ErrorNameCompare").text(data.file2_name);
                $("#file2ErrorClassCompare").text(data.file2_name);
    
                if (data.errors.length === 0) {
                    alert("Không có lỗi nào được tìm thấy!");
                    return;
                }
    
                // ✅ Đảm bảo bảng DataTable được xóa đúng cách trước khi thêm dữ liệu mới
                if ($.fn.DataTable.isDataTable("#errorTable")) {
                    $("#errorTable").DataTable().clear().destroy();
                }
    
                // ✅ Thêm dữ liệu lỗi vào bảng
                data.errors.forEach(row => {
                    let tr = $("<tr>");
                    tr.append(`<td>${row.MSSV || "N/A"}</td>`);
                    tr.append(`<td>${row.HOTEN_file1 || "N/A"}</td>`);
                    tr.append(`<td>${row.LOP_file1 || "N/A"}</td>`);
                    tr.append(`<td>${row.HOTEN_file2 || "N/A"}</td>`);
                    tr.append(`<td>${row.LOP_file2 || "N/A"}</td>`);
                    errorTableBody.append(tr);
                });
    
    
                // ✅ Khởi tạo lại DataTable
                $("#errorTable").DataTable({
                    "destroy": true, // ✅ Chắc chắn reset bảng trước khi tạo mới
                    "paging": true,
                    "lengthChange": false,
                    "pageLength": 10,
                    "scrollY": "300px",
                    "scrollCollapse": true,
                    "searching": true,
                    "ordering": true
                });
    
                console.log("✅ Bảng lỗi đã cập nhật thành công!");
            })
            .catch(error => console.error("❌ Lỗi khi so sánh dữ liệu:", error));
    };
    
});
