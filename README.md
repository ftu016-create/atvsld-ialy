# Ứng Dụng Quản Lý & Xuất Biên Bản ATVSLĐ (Vercel Ready)

Hệ thống tạo, quản lý và xuất Biên bản kiểm tra An toàn Vệ sinh Lao động (ATVSLĐ) chuẩn thể thức công văn & EVN cho **Công ty Thủy điện Ialy - Phân xưởng Vận hành (NMTĐ Ialy & Ialy Mở Rộng)**.

## 🚀 Tính năng nổi bật
1. **Xuất file Word (.docx) chuẩn 100%**:
   - Quốc hiệu, Tiêu ngữ, Tên đơn vị, Số hiệu văn bản.
   - Bảng 16 nhóm tiêu chuẩn ATVSLĐ (cột STT, Nội dung, Kết quả, Kiến nghị khắc phục, Ghi chú).
   - Bảng phân công thành viên đoàn kiểm tra và Trưởng đoàn ký tên 2 cột.
   - Phụ lục hình ảnh 2 cột (NMTĐ Ialy & NMTĐ Ialy MR) kèm chú thích vị trí kiểm tra.
2. **Chạy trực tiếp & Tối ưu 100% trên Vercel**:
   - Sử dụng thư viện `docx` JavaScript/TypeScript chạy trực tiếp trên trình duyệt / Edge.
   - **Cold-start 0s**, không cần cài đặt Python, LibreOffice hay MS Word trên máy chủ.
   - Hoàn toàn miễn phí và không giới hạn lưu lượng trên Vercel Free Tier.
3. **Kho lưu trữ & Quản lý biên bản**:
   - Tự động lưu bản nháp, quản lý lịch sử các tháng.
   - Nhân bản (Duplicate) biên bản sang tháng mới chỉ với 1 click.
   - Sao lưu (Export) và Khôi phục (Import) toàn bộ dữ liệu dạng file `.json`.
4. **Xem trước trực quan A4**:
   - Chế độ xem trước thời gian thực giống hệt trang in trước khi tải file về.

---

## 📦 Hướng dẫn Triển khai lên Vercel (2 Cách)

### Cách 1: Triển khai bằng Vercel CLI (1 phút)
Mở Terminal trong thư mục dự án và chạy:
```bash
# 1. Cài đặt Vercel CLI (nếu chưa có)
npm install -g vercel

# 2. Đăng nhập và deploy lên production
vercel --prod
```

### Cách 2: Triển khai qua GitHub
1. Đẩy mã nguồn lên GitHub repository.
2. Truy cập [vercel.com/new](https://vercel.com/new).
3. Chọn Import repository vừa tạo.
4. Giữ nguyên cấu hình mặc định (Framework: `Vite`, Build command: `npm run build`, Output directory: `dist`).
5. Nhấn **Deploy**.

---

## 🏷️ Hướng Dẫn Đổi Tên Địa Chỉ Trên GitHub & Vercel

### 1. Đổi tên địa chỉ Repository trên GitHub:
1. Mở trang repository của anh trên GitHub (`https://github.com/username/ten-repo-hien-tai`).
2. Nhấn vào tab **Settings** (ở hàng menu phía trên cùng của repo).
3. Tại mục **General** ngay đầu trang, ở ô **Repository name**, anh nhập tên mới (ví dụ: `atvsld-ialy`).
4. Bấm nút **Rename**.
   > *Lưu ý: Nếu anh đang clone mã nguồn về máy tính, hãy chạy lệnh sau để cập nhật remote URL:*
   > ```bash
   > git remote set-url origin https://github.com/TÊN-GITHUB-CỦA-ANH/TÊN-REPO-MỚI.git
   > ```

### 2. Đổi tên địa chỉ Web / Tên miền (Domain) trên Vercel:
1. Truy cập [vercel.com/dashboard](https://vercel.com/dashboard) và bấm vào dự án của anh.
2. Vào tab **Settings** (ở thanh menu trên) -> chọn mục **Domains** ở cột bên trái.
3. Tại ô input **Domain**, nhập địa chỉ mong muốn (ví dụ: `atvsld-ialy.vercel.app`) -> bấm **Add**.
4. Xóa tên miền cũ nếu không muốn dùng (nhấn dấu 3 chấm `...` bên cạnh tên miền cũ -> chọn **Delete** / **Remove**).
5. *(Tùy chọn)* Để đổi tên cả Project: Vào tab **Settings** -> mục **General** -> ở phần **Project Name** nhập tên mới rồi bấm **Save**.

---

## 🛠️ Chạy ở môi trường máy cá nhân (Local Development)
```bash
# Cài đặt thư viện
npm install

# Khởi chạy máy chủ phát triển
npm run dev
```
Truy cập trình duyệt tại: `http://localhost:3000`
