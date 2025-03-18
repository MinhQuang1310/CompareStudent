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

    // Hàm reset lại bảng
    function resetTables() {
        // Hủy DataTable cũ và xóa dữ liệu trong tbody
        if ($.fn.DataTable.isDataTable("#errorTable")) {
            $("#errorTable").DataTable().clear().destroy();
        }
        if ($.fn.DataTable.isDataTable("#table1")) {
            $("#table1").DataTable().clear().destroy();
        }
        if ($.fn.DataTable.isDataTable("#table2")) {
            $("#table2").DataTable().clear().destroy();
        }

        // Xóa dữ liệu trong bảng
        $("#table1 tbody").empty();
        $("#table2 tbody").empty();
        $("#errorTable tbody").empty();
    }

    // Xử lý khi tải lên file
    $("#uploadForm").submit(function (event) {
        event.preventDefault();

        let files = $("#files")[0].files;
        if (files.length != 2) {
            alert("Vui lòng chỉ chọn 2 file!");
            return;
        }

        let formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append("files", files[i]);
        }

        // Reset bảng trước khi tải dữ liệu mới
        resetTables();

        // Gửi yêu cầu tải file lên
        fetch("/upload", {
            method: "POST",
            body: formData
        })
            .then(response => response.json())
            .then(uploadResponse => {
                console.log("📂 Danh sách file sau khi tải lên:", uploadResponse.files);
                return fetch('/get_data');  // Gọi ngay sau khi tải lên để lấy dữ liệu mới
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error("❌ Lỗi từ server:", data.error);
                    alert(data.error);
                    return;
                }

                // Cập nhật tên file đúng từ server
                $("#file1Name").text(data.file1_name);
                $("#file2Name").text(data.file2_name);
                $("#file1ErrorNameCompare").text(data.file1_name);
                $("#file1ErrorClassCompare").text(data.file1_name);
                $("#file2ErrorNameCompare").text(data.file2_name);
                $("#file2ErrorClassCompare").text(data.file2_name);

                // Hiển thị dữ liệu đúng vào bảng
                populateTable("table1", data.file1);
                populateTable("table2", data.file2);
            })
            .catch(error => console.error("❌ Lỗi khi tải file hoặc lấy dữ liệu:", error));
    });

    // Hàm cập nhật dữ liệu vào bảng
    function populateTable(tableId, data) {
        let tableBody = $("#" + tableId).find("tbody");
        tableBody.empty();  // Đảm bảo dữ liệu cũ bị xóa hoàn toàn
        data.forEach(row => {
            let tr = $("<tr>");
            tr.append(`<td>${row.MSSV}</td>`);
            tr.append(`<td>${row.HOTEN}</td>`);
            tr.append(`<td>${row.LOP}</td>`);
            tableBody.append(tr);
        });

        // Khởi tạo lại DataTable sau khi thêm dữ liệu mới
        $("#" + tableId).DataTable({
            "destroy": true,  // Chắc chắn reset bảng trước khi tạo mới
            "paging": true,
            "lengthChange": false,
            "pageLength": 10,
            "scrollY": "300px",
            "scrollCollapse": true,
            "searching": true,
            "ordering": true
        });
    }

    // Hàm so sánh dữ liệu
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
                errorTableBody.empty();  // ✅ Xóa dữ liệu cũ trước khi cập nhật mới

                // Cập nhật tên file trong tiêu đề bảng so sánh
                $("#file1ErrorNameCompare").text(data.file1_name);
                $("#file1ErrorClassCompare").text(data.file1_name);
                $("#file2ErrorNameCompare").text(data.file2_name);
                $("#file2ErrorClassCompare").text(data.file2_name);

                if (data.errors.length === 0) {
                    alert("Không có lỗi nào được tìm thấy!");
                    return;
                }

                // Thêm dữ liệu lỗi vào bảng và hiển thị ghi chú
                data.errors.forEach(row => {
                    let tr = $("<tr>");
                    let ghiChu = [];

                    // Kiểm tra họ tên ở file 1 và file 2
                    if (row.MSSV === "N/A") {
                        ghiChu.push("Kiểm tra lại MSSV");
                    } else if (row.HOTEN_file1 === "N/A" || row.LOP_file1 === "N/A") {
                        ghiChu.push(`Không tìm thấy họ tên và lớp tại file ${data.file1_name}`);
                    } else if (row.HOTEN_file2 === "N/A" || row.LOP_file2 === "N/A") {
                        ghiChu.push(`Không tìm thấy họ tên và lớp tại file ${data.file2_name}`);
                    } else if (row.HOTEN_file1 === "N/A") {
                        ghiChu.push(`Không tìm thấy họ tên tại file ${data.file1_name}`);
                    } else if (row.HOTEN_file2 === "N/A") {
                        ghiChu.push(`Không tìm thấy họ tên tại file ${data.file2_name}`);
                    } else if (row.LOP_file1 === "N/A") {
                        ghiChu.push(`Không tìm thấy lớp tại file ${data.file1_name}`);
                    } else if (row.LOP_file2 === "N/A") {
                        ghiChu.push(`Không tìm thấy lớp tại file ${data.file2_name}`);
                    } else if (row.HOTEN_file1 !== row.HOTEN_file2) {
                        ghiChu.push("Kiểm tra lại họ tên");
                    } else if (row.LOP_file1 !== row.LOP_file2) {
                        ghiChu.push("Kiểm tra lại lớp");
                    }

                    // Thêm dữ liệu vào bảng, nếu không có lỗi thì hiển thị "Không có lỗi"
                    tr.append(`<td>${row.MSSV || "N/A"}</td>`);
                    tr.append(`<td>${row.HOTEN_file1 || "N/A"}</td>`);
                    tr.append(`<td>${row.LOP_file1 || "N/A"}</td>`);
                    tr.append(`<td>${row.HOTEN_file2 || "N/A"}</td>`);
                    tr.append(`<td>${row.LOP_file2 || "N/A"}</td>`);
                    tr.append(`<td>${ghiChu.length > 0 ? ghiChu.join(", ") : "Không có lỗi"}</td>`);  // ✅ Hiển thị ghi chú
                    errorTableBody.append(tr);
                });

                // Hủy DataTable trước khi khởi tạo mới
                if ($.fn.DataTable.isDataTable("#errorTable")) {
                    $("#errorTable").DataTable().clear().destroy();
                }

                // Khởi tạo lại DataTable
                $("#errorTable").DataTable({
                    "destroy": true,
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
    window.downloadComparison = function () {
        // Lấy tất cả dữ liệu từ DataTable, không phụ thuộc vào phân trang
        let errors = [];
        $("#errorTable").DataTable().rows().every(function () {
            let row = this.data(); // Lấy dữ liệu của một dòng trong DataTable
            let rowData = {};

            // Duyệt qua các cột trong mỗi dòng và lấy dữ liệu
            rowData["MSSV"] = row[0] || "N/A";
            rowData["HOTEN_file1"] = row[1] || "N/A";
            rowData["LOP_file1"] = row[2] || "N/A";
            rowData["HOTEN_file2"] = row[3] || "N/A";
            rowData["LOP_file2"] = row[4] || "N/A";
            rowData["Ghi_Chu"] = row[5];
            //rowData["Ghi_Chu"] = row[5] || "Không có lỗi"; // Cột ghi chú

            errors.push(rowData); // Thêm dòng dữ liệu vào mảng
        });

        // Gửi dữ liệu so sánh tới backend để tải xuống file
        fetch('/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                errors: errors,
                file1_name: $("#file1Name").text(),  // Lấy tên file 1 từ UI
                file2_name: $("#file2Name").text()   // Lấy tên file 2 từ UI
            })
        })
            .then(response => response.blob())
            .then(blob => {
                // Tạo một liên kết tải xuống cho file Excel
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'ket_qua_so_sanh.xlsx'; // Tên file tải xuống
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch(error => {
                console.error("Lỗi khi tải file:", error);
            });
    };
});
