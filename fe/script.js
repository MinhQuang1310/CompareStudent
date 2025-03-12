$(document).ready(function () {
    $("#files").change(function () {
        let files = $("#files")[0].files;
        let fileNames = [];

        for (let i = 0; i < files.length; i++) {
            fileNames.push(files[i].name);  // Lấy tên file
        }

        if (fileNames.length > 0) {
            $("#fileNames").text("File đã chọn: " + fileNames.join(", "));
        } else {
            $("#fileNames").text(""); // Nếu không có file nào, xóa nội dung
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

        fetch("/upload", {
            method: "POST",
            body: formData
        })
            .then(() => fetch('/get_data'))
            .then(response => response.json())
            .then(data => {
                // Hiển thị tên file trên bảng danh sách
                $("#file1Name").text(files[0].name);
                $("#file2Name").text(files[1].name);

                // Hiển thị tên file trên bảng kết quả so sánh
                $("#file1ErrorNameCompare").text(files[0].name);
                $("#file1ErrorClassCompare").text(files[0].name);
                $("#file2ErrorNameCompare").text(files[1].name);
                $("#file2ErrorClassCompare").text(files[1].name);

                // Hiển thị dữ liệu trong bảng
                populateTable("table1", data.file1);
                populateTable("table2", data.file2);
            })
            .catch(error => console.error("Lỗi khi tải file:", error));
    });

    function populateTable(tableId, data) {
        let tableBody = $("#" + tableId).find("tbody");
        tableBody.empty();

        data.forEach(row => {
            let tr = $("<tr>");
            tr.append(`<td>${row.MSSV}</td>`);
            tr.append(`<td>${row.HOTEN}</td>`);
            tr.append(`<td>${row.LOP}</td>`);
            tableBody.append(tr);
        });

        $("#" + tableId).DataTable().destroy();
        $("#" + tableId).DataTable({
            "paging": true,
            "lengthChange": false,
            "pageLength": 10,
            "scrollY": "300px",
            "scrollCollapse": true,
            "searching": true,
            "ordering": true
        });
    }

    // Gọi API so sánh khi nhấn nút
    window.compareData = function () {
        fetch('/compare')
            .then(response => response.json())
            .then(data => {
                let errorTableBody = $("#errorTable").find("tbody");
                errorTableBody.empty();

                if (data.length === 0) {
                    alert("Không có lỗi nào được tìm thấy!");
                    return;
                }

                data.forEach(row => {
                    let tr = $("<tr>");
                    tr.append(`<td>${row.MSSV}</td>`);
                    tr.append(`<td>${row.HOTEN_file1 || "N/A"}</td>`);
                    tr.append(`<td>${row.LOP_file1 || "N/A"}</td>`);
                    tr.append(`<td>${row.HOTEN_file2 || "N/A"}</td>`);
                    tr.append(`<td>${row.LOP_file2 || "N/A"}</td>`);
                    errorTableBody.append(tr);
                });

                $("#errorTable").DataTable().destroy();
                $("#errorTable").DataTable({
                    "paging": true,
                    "lengthChange": false,
                    "pageLength": 10,
                    "scrollY": "300px",
                    "scrollCollapse": true,
                    "searching": true,
                    "ordering": true
                });
            })
            .catch(error => console.error("Lỗi khi so sánh dữ liệu:", error));
    }
});
