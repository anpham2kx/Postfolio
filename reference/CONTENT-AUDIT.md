# Đối chiếu nội dung nguồn

Ngày đọc: 21/10/2026 (Asia/Saigon). Nguồn: <https://www.anpham2kx.io.vn/>.

Trình đọc web không truy cập được URL, nhưng tải HTTPS trực tiếp thành công. Website là ứng dụng React; nội dung đầy đủ nằm trong bundle công khai `/assets/index-J2GXVwpP.js`. Đã lưu HTML, JS, CSS và ảnh gốc trong thư mục này để đối chiếu. Không thực thi hoặc nhúng lại bundle nguồn vào project.

## Nội dung đã giữ

- `Pham Thanh An`, ảnh đại diện, `Software Engineer`, toàn bộ đoạn giới thiệu bằng tiếng Anh.
- Cả ba sở thích và nguyên văn mô tả: Lập trình web/app, Chơi Game, Nghe nhạc.
- Frontend: HTML5 / CSS3 / JavaScript 90%, ReactJS 85%, Tailwind CSS / Sass 80%.
- Backend: Node.js / Express.js 75%, MongoDB / PostgreSQL 70%.
- Git / GitHub, Docker, Vite, REST API, Figma, VS Code.
- Học Viện Công Nghệ Bưu Chính Viễn Thông (PTIT), Chuyên ngành Công Nghệ Phần Mềm, 2023 - Hiện tại, GPA 3.2/4.0, 85/150 tín chỉ. Đây là dữ liệu nguyên trạng trên nguồn, không suy luận hoặc cập nhật số liệu theo ngày hiện tại.
- DỰ ÁN: chỉ có tiêu đề, không có bản ghi, ảnh, mô tả hoặc liên kết dự án trong component nguồn `Be`. Project mới giữ trang này và thông báo đúng tình trạng đó.
- Form liên hệ và đường dẫn trở về đầu sách.

## Liên kết nguyên trạng

- Facebook: <https://www.facebook.com/pham.thanh.an.2550>
- Telegram: <https://t.me>
- Điện thoại: <https://zalo.me/0375480845> (UI mới ghi thêm Zalo để diễn đạt đúng đích đến).
- GitHub: <https://github.com/AnPham1820>

Telegram trên nguồn chỉ trỏ tới trang chung, không có username. Giữ đúng URL, không đoán tài khoản. Không đăng nhập hoặc kiểm chứng quyền sở hữu các tài khoản ngoài website.

## Ảnh

Ảnh `/avatar.png` tải từ nguồn trùng SHA-256 với `avatar.png` có sẵn tại workspace:

`F5E3147F53443674C176E3D87E8CD6C5B2072D6262D629B296A2A01489B25C38`

Ảnh được chuyển sang WebP 640×960, 49.194 byte, không đổi nội dung hình. File gốc còn tại `reference/avatar-original.png` và `avatar.png`. Nguồn không có ảnh nào khác trong nội dung portfolio.

## Các khác biệt có chủ đích

- Thêm mục lục, trang kết nối, nhãn điều hướng, lời dẫn biên tập, thông báo mục dự án trống; không thêm thành tích, dự án, kinh nghiệm hoặc dữ liệu cá nhân.
- Sắp xếp thành 8 trang: Giới thiệu, Mục lục, Sở thích, Kỹ năng, Học vấn, Dự án, Kết nối, Liên hệ.
- Service/template EmailJS sử dụng đúng giá trị người dùng yêu cầu, thay cho giá trị cũ trong bundle nguồn.
- Mã nguồn gốc có một hàm tải CV mô phỏng, nhưng không render nút CV và không cung cấp file. Không tạo CV hoặc liên kết tải giả.
- Hai script quảng cáo bên thứ ba trong HTML gốc không phải nội dung portfolio và không được nhúng vào ứng dụng mới.

Không có phần nội dung portfolio nào bị chặn sau khi tải thành công bundle. Mục dự án trống là trạng thái thật của nguồn, không phải lỗi truy cập. Chưa thể xác nhận email được phát tới hộp thư vì không gửi email thật trong quá trình kiểm thử.
