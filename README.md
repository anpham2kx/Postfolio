# The Portfolio Book · Pham Thanh An

Portfolio sách 3D hoàn chỉnh bằng **Next.js App Router, React, TypeScript strict và Tailwind CSS**. Nội dung được đọc trực tiếp từ [website gốc](https://www.anpham2kx.io.vn/) ngày 21/10/2026; bản đối chiếu nằm tại [reference/CONTENT-AUDIT.md](reference/CONTENT-AUDIT.md).

Giao diện giấy ấm và xanh ngọc, font Manrope/Lora tự lưu trữ, sáng/tối, một hoặc hai trang theo chiều rộng thực tế của sách. Trang đầu có liên kết liên hệ/mục lục; mục lục và các nút đánh dấu chương cho phép chuyển nhanh. Trên màn hình hẹp, liên kết đến từng phần nằm ngay trong trang giới thiệu.

**Lưu ý về nội dung:** website gốc chưa có dự án, chỉ có tiêu đề DỰ ÁN. Trang dự án được giữ và nêu rõ điều này. Không thêm dự án, CV hoặc thông tin cá nhân giả. Telegram giữ đúng liên kết chung `https://t.me` của nguồn.

## Chạy project

Yêu cầu Node.js **22.12+** (đã kiểm thử trên Node 24.18.1), npm và trình duyệt hiện đại.

```bash
npm ci --include=optional
cp .env.example .env.local
npm run dev
```

Mở <http://localhost:3000>.

PowerShell trên Windows:

```powershell
npm.cmd ci --include=optional
Copy-Item .env.example .env.local
npm.cmd run dev
```

Dùng `npm.cmd` nếu PowerShell chặn script `npm.ps1`. Không cần đổi execution policy toàn hệ thống. Workspace bàn giao đã có `.env.local` từ cấu hình được cung cấp; file này được gitignore.

Build và chạy production:

```bash
npm run build
npm start
```

Ứng dụng sử dụng Next.js chính thức, không thay bằng một framework tương thích. Có thể triển khai lên nền tảng hỗ trợ Next.js/Node. Trước khi build trên hosting, đặt biến môi trường và `NEXT_PUBLIC_SITE_URL` bằng URL triển khai. Project được bàn giao local, chưa xuất bản lên dịch vụ hosting.

## Cấu hình EmailJS

Nội dung `.env.local`:

```dotenv
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_hzhh52o
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_j5k4p8q
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=QCLgOuRqCwyGGQ2hW
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Trong dashboard EmailJS, kiểm tra service còn kết nối, người nhận trong template đúng, và template dùng đúng ba biến:

```text
{{from_name}}
{{from_email}}
{{message}}
```

Có thể đặt Reply-To là `{{from_email}}`. Nếu bật giới hạn domain trong EmailJS, thêm domain triển khai và localhost khi phát triển. Khởi động lại dev server hoặc build lại khi đổi biến `NEXT_PUBLIC_*` vì Next.js nhúng chúng vào bundle lúc build.

Form gửi trực tiếp đến [EmailJS REST API](https://www.emailjs.com/docs/rest-api/send/) bằng `fetch`; không cần thư viện gửi mail phía server. `template_params` chỉ có đúng `from_name`, `from_email`, `message`. Public Key là cấu hình công khai; **không** đặt mật khẩu email/private key vào các biến public hay mã trình duyệt.

Kiểm tra họ tên 2–100 ký tự, email hợp lệ tối đa 254 ký tự, nội dung 10–5.000 ký tự sau khi trim. Lỗi gắn với từng trường; focus chuyển đến trường lỗi đầu tiên. Ref khóa ngay trước request ngăn gửi trùng; fieldset bị khóa trong khi gửi. Chỉ reset khi HTTP thành công. Lỗi mạng, timeout, HTTP 429 và các lỗi HTTP khác đều giữ dữ liệu. Timeout 20 giây báo chưa xác nhận được kết quả; không tự gửi lại vì email có thể đã được dịch vụ nhận.

Kiểm thử tự động giả lập response của EmailJS và kiểm tra payload; không gửi email thật. Việc giao thư, hạn mức, allowlist và cấu hình template ở tài khoản cần được kiểm tra trên môi trường triển khai.

## Cấu trúc file

```text
src/
  app/
    layout.tsx              # Server layout, metadata, khởi tạo theme, fallback không JS
    page.tsx                # Server page ghép nội dung với bộ đọc sách
    globals.css             # Tailwind, token sáng/tối, layout giấy, hiệu ứng 3D
  data/portfolio.ts         # Dữ liệu đã đối chiếu, liên kết, chỉ mục chương
  components/
    book-pages.tsx          # Server Components dựng 8 trang nội dung
    book.tsx                # Client shell: điều hướng, theme, hiển thị đơn giản
    contact-form.tsx        # Client form: validation, khóa gửi, trạng thái
    icon.tsx                # Icon Lucide dùng chung
  hooks/use-book.ts         # Pointer, keyboard, RAF, resize, capture, điều phối DOM
  lib/
    book-machine.ts         # Logic thuần: trang, spread, lock, ngưỡng kéo/vận tốc
    contact.ts              # Validation + transport EmailJS
public/
  images/avatar.webp       # Ảnh gốc được tối ưu, 640×960
  fonts/                   # WOFF2 Latin/Vietnamese + SIL OFL licenses
  icon.png
reference/                 # Bản nguồn đã tải + biên bản đối chiếu
tests/
  unit/                    # Máy trạng thái và EmailJS contract
  e2e/                     # Trình duyệt, gesture, form, responsive, axe
docs/
  TESTING.md               # Kết quả và giới hạn kiểm thử
  screenshots/             # Ảnh desktop, tablet, phone sáng/tối/contact
```

## Luồng lật sách

`book-machine.ts` là nguồn trạng thái duy nhất: `anchor` là trang nội dung đang đọc, `mode` là 1/2 trang, `phase` là `idle → dragging/settling → idle`. `begin()` khóa đồng bộ nên thao tác nhanh không tạo nhiều transaction chồng nhau. Input mới trong khi đang chuyển bị bỏ qua có chủ đích; không xếp hàng một chuỗi lật ngoài ý muốn. Nút điều hướng bị disabled đúng lúc và tại biên đầu/cuối.

`ResizeObserver` đo **chiều rộng phần sách**: từ 860 CSS px trở lên hiện hai trang; hẹp hơn hiện một trang. Trang bên phải đang focus/chạm/cuộn được ghi nhận vào `anchor`. Khi đổi chế độ, chỉ tính lại spread chứa anchor, không đổi trang đang đọc. Resize, pointercancel, mất capture thật, Escape, mất focus cửa sổ và tab bị ẩn đều hủy transaction về vị trí ổn định. RAF cũ được vô hiệu bằng generation token.

Pointer Events thống nhất chuột/cảm ứng/bút. Cảm ứng có ngưỡng 10 px và tỷ lệ ngang/dọc 1,25 trước khi nhận thao tác; `touch-action: pan-y pinch-zoom` giữ cuộn dọc và pinch zoom. Chuột/bút kéo ở **mép trái/phải 15–20 px** để không cản chọn chữ. Không bắt đầu kéo từ link, button, field, label hoặc vùng contenteditable. Capture chuyển sang phần tử sách ổn định khi đã xác nhận kéo ngang. Sự kiện mất implicit capture từ phần tử cũ trên cảm ứng được bỏ qua đúng cách.

Trong lúc kéo, chỉ cập nhật transform của một lớp lật bằng `requestAnimationFrame`; không set React state mỗi pointermove. Hoàn tất khi vượt 32% đường kéo hoặc flick cùng hướng nhanh hơn 0,55 px/ms với tối thiểu 24 px. Flick ngược nhanh hơn 0,35 px/ms hủy lật; vận tốc quá 100 ms không còn được dùng. Có thể kéo ngược về đầu để hủy.

Các trang thật được mount một lần. Trang không hiển thị dùng `hidden` và `inert`. Animation dùng bản sao DOM inert/aria-hidden, đã bỏ ID; không tạo thêm React form hoặc gửi request. Nhờ vậy dữ liệu form và vị trí cuộn được giữ qua các lần lật. Các phần nội dung dài có vùng cuộn riêng trong giấy và footer cố định; không cắt bỏ nội dung để ép vừa trang.

## Hiệu năng và accessibility

- Server Components cho dữ liệu/nội dung tĩnh; Client Components chỉ bao quanh tương tác sách và form. Nội dung vẫn có trong HTML ban đầu.
- Ảnh gốc 1.964.030 byte được chuyển thành WebP 49.194 byte, sau đó `next/image` cung cấp ảnh theo kích thước hiển thị. Font tự lưu trữ với `font-display: swap`, không gọi Google Fonts khi người đọc mở trang.
- Không WebGL, không animation nền liên tục. Một lớp lật được tạo khi cần rồi hủy; trạng thái kéo không render lại toàn sách theo frame.
- Nút chế độ đơn giản được lưu local. Trình duyệt không hỗ trợ CSS 3D tự chọn fallback; máy báo tối đa 2 logical CPU mặc định dùng hiệu ứng đơn giản. Đây là heuristic, không phải benchmark phần cứng.
- `prefers-reduced-motion` bỏ animation tự chạy/settle; pointer drag vẫn bám tay. Không có spinner quay khi giảm chuyển động.
- Phím trái/phải không can thiệp input, textarea, select, contenteditable, IME, modifier keys hoặc khi đang chọn văn bản. Escape hủy lật. Nút bấm vẫn dùng được khi không dùng gesture.
- Focus visible, skip link, nhãn vùng/trang, aria-live cho số trang và trạng thái gửi, error description cho form, nội dung ẩn không nằm trong tab order.
- Theme theo hệ thống ở lần đầu và lưu lựa chọn; không phụ thuộc localStorage để app hoạt động. Khi tắt JavaScript, 8 trang hiển thị thành tài liệu dọc; form/animation cần JS.

## Kiểm tra

```bash
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium firefox webkit
npm run test:e2e
```

Hoặc `npm run check` để chạy TypeScript, lint, unit test và build theo thứ tự. E2E tự mở production server trên `127.0.0.1:3000`; chạy build trước. Không dùng đồng thời dev server trên cổng 3000 khi chạy E2E. HTML report nằm ở `playwright-report/index.html`; trace chỉ giữ khi thất bại. Bộ test đọc cấu hình EmailJS ở `.env.local`; các bài contract mong đợi đúng các ID đã cung cấp.

Nếu npm bỏ sót native optional dependency của Vitest trên Windows, chạy lại `npm install --include=optional`; không cần xóa mã nguồn hay thay đổi bảo mật máy.

Phạm vi đã thực hiện và giới hạn còn lại được ghi tại [docs/TESTING.md](docs/TESTING.md). Mô phỏng viewport không thay thế thiết bị vật lý; không cam kết mọi trình duyệt hay thiết bị đều có trải nghiệm giống nhau.

Kết quả bàn giao: TypeScript, lint và production build đều đạt; **29 unit test + 81 E2E đạt**, 3 bài CDP touch bỏ qua đúng phạm vi trên Firefox/WebKit, không có test thất bại trong lượt xác nhận cuối. Có thể xem [ảnh desktop](docs/screenshots/chromium-desktop-light.png) và [ảnh điện thoại](docs/screenshots/chromium-phone-light.png).
