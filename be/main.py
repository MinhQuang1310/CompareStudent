from flask import Flask, send_from_directory, jsonify, request, render_template
import pandas as pd
import os

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Khởi tạo Flask app, chỉ định static_folder là "fe"
app = Flask(__name__, static_folder="../fe", template_folder="../fe")

# # Đọc file Excel
# file1_path = "../data/TEST_DSSV_1.xlsx"
# file2_path = "../data/TEST_DSSV_2.xlsx"

# def read_excel(file_path):
#     return pd.read_excel(file_path, sheet_name=0, dtype=str).fillna("")

# @app.route('/')
# def serve_index():
#     """Hiển thị giao diện FE"""
#     return send_from_directory("../fe", "index.html")

@app.route('/')
def serve_index():
    return render_template("index.html")

@app.route('/<path:filename>')
def serve_static_files(filename):
    """Phục vụ file CSS, JS từ thư mục fe"""
    return send_from_directory("../fe", filename)  # Đảm bảo Flask tìm đúng CSS & JS

@app.route('/upload', methods=['POST'])
def upload_files():
    """Xóa file cũ và nhận file mới từ người dùng"""
    if 'files' not in request.files:
        return jsonify({"error": "Không nhận được file nào!"}), 400

    files = request.files.getlist("files")

    if len(files) < 2 or len(files) > 5:
        return jsonify({"error": "Vui lòng chọn từ 2 đến 5 file!"}), 400

    # ✅ Xóa toàn bộ file cũ trước khi lưu file mới
    for file in os.listdir(UPLOAD_FOLDER):
        file_path = os.path.join(UPLOAD_FOLDER, file)
        if os.path.isfile(file_path):
            os.remove(file_path)

    file_paths = []
    for file in files:
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)
        file_paths.append(file_path)

    return jsonify({"message": "Tải lên thành công!", "files": [file.filename for file in files]})

@app.route('/get_data')
def get_data():
    """Trả về dữ liệu từ file mới nhất đã tải lên"""
    file_paths = sorted(
        [os.path.join(UPLOAD_FOLDER, f) for f in os.listdir(UPLOAD_FOLDER) if f.endswith(".xlsx")],
        key=os.path.getctime, reverse=True
    )


    if len(file_paths) < 2:
        return jsonify({"error": "Không đủ file để hiển thị!"}), 400

    dfs = [pd.read_excel(file_paths[0], dtype=str).fillna(""), pd.read_excel(file_paths[1], dtype=str).fillna("")]


    return jsonify({
        "file1": dfs[0].to_dict(orient="records"),
        "file2": dfs[1].to_dict(orient="records"),
        "file1_name": os.path.basename(file_paths[0]),
        "file2_name": os.path.basename(file_paths[1])
    })



# @app.route('/compare')
# def compare():
#     """API so sánh dữ liệu từ 2 file Excel"""
#     file_paths = [os.path.join(UPLOAD_FOLDER, f) for f in os.listdir(UPLOAD_FOLDER) if f.endswith(".xlsx")]

#     if len(file_paths) < 2:
#         return jsonify({"error": "Không đủ file để so sánh!"}), 400

#     df1 = pd.read_excel(file_paths[0], dtype=str).fillna("")
#     df2 = pd.read_excel(file_paths[1], dtype=str).fillna("")

#     merged_df = df1.merge(df2, on="MSSV", suffixes=('_file1', '_file2'), how="outer", indicator=True)

#     errors = merged_df[
#         (merged_df['_merge'] != 'both') |
#         (merged_df['HOTEN_file1'] != merged_df['HOTEN_file2']) |
#         (merged_df['LOP_file1'] != merged_df['LOP_file2'])
#     ].drop(columns=['_merge'])

#     errors = errors.fillna("N/A")

#     return jsonify(errors.to_dict(orient="records"))

@app.route('/compare')
def compare():
    """API so sánh dữ liệu từ 2 file Excel"""
    file_paths = sorted(
        [os.path.join(UPLOAD_FOLDER, f) for f in os.listdir(UPLOAD_FOLDER) if f.endswith(".xlsx")],
        key=os.path.getctime, reverse=True
    )

    if len(file_paths) < 2:
        return jsonify({"error": "Không đủ file để so sánh!"}), 400

    # ✅ Lấy đúng 2 file mới nhất
    file1_path, file2_path = file_paths[:2]


    df1 = pd.read_excel(file1_path, dtype=str).fillna("")
    df2 = pd.read_excel(file2_path, dtype=str).fillna("")

    merged_df = df1.merge(df2, on="MSSV", suffixes=('_file1', '_file2'), how="outer", indicator=True)

    errors = merged_df[
        (merged_df['_merge'] != 'both') |
        (merged_df['HOTEN_file1'] != merged_df['HOTEN_file2']) |
        (merged_df['LOP_file1'] != merged_df['LOP_file2'])
    ].drop(columns=['_merge'])

    errors = errors.fillna("N/A")

    return jsonify({
        "errors": errors.to_dict(orient="records"),
        "file1_name": os.path.basename(file1_path),
        "file2_name": os.path.basename(file2_path)
    })


# @app.route('/get_data')
# def get_data():
#     """API trả về dữ liệu từ 2 file Excel"""
#     df1 = read_excel(file1_path)
#     df2 = read_excel(file2_path)

#     return jsonify({
#         "file1": df1.to_dict(orient="records"),
#         "file2": df2.to_dict(orient="records")
#     })

# @app.route('/compare')
# def compare():
#     """API so sánh dữ liệu từ 2 file Excel"""
#     df1 = read_excel(file1_path).map(lambda x: x.strip().lower() if isinstance(x, str) else x)
#     df2 = read_excel(file2_path).map(lambda x: x.strip().lower() if isinstance(x, str) else x)

#     merged_df = df1.merge(df2, on="MSSV", suffixes=('_file1', '_file2'), how="outer", indicator=True)

#     errors = merged_df[
#         (merged_df['_merge'] != 'both') |
#         (merged_df['HOTEN_file1'] != merged_df['HOTEN_file2']) |
#         (merged_df['LOP_file1'] != merged_df['LOP_file2'])
#     ].drop(columns=['_merge'])

#     # Thay thế NaN bằng "N/A" để JSON hợp lệ
#     errors = errors.fillna("N/A")

#     return jsonify(errors.to_dict(orient="records"))



# if __name__ == '__main__':
#     app.run(debug=True, host="0.0.0.0", port=5000)
    
if __name__ == '__main__':
    app.run(debug=False, host="0.0.0.0", port=10000)
