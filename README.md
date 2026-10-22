# The Portfolio Book · Pham Thanh An

Portfolio sách 3D hoàn chỉnh bằng **Next.js App Router, React, TypeScript strict và Tailwind CSS**. Nội dung được đọc trực tiếp từ [website gốc](https://www.anpham2kx.io.vn/) ngày 21/10/2026; bản đối chiếu nằm tại [reference/CONTENT-AUDIT.md](reference/CONTENT-AUDIT.md).

Giao diện giấy trắng, bìa nâu đen và font Manrope/Lora tự lưu trữ, trên nền ngôi làng Halloween do chủ project cung cấp. Sách luôn mở **hai trang trên desktop, tablet và điện thoại**. Cặp đầu: bìa trước bên trái, giới thiệu bên phải. Cặp cuối: liên hệ bên trái, bìa sau bên phải. Điện thoại thu nhỏ sách, typography và khoảng cách; nội dung dài cuộn trong từng trang, trình duyệt vẫn cho phép pinch zoom. Tên nằm trên một dòng; các nút chuyển nhanh ở trang giới thiệu. Chế độ tối giảm độ sáng nền và đổi nút bên ngoài, giấy vẫn trắng.

**Lưu ý về nội dung:** website gốc chưa có dự án, chỉ có tiêu đề DỰ ÁN. Trang dự án được giữ và nêu rõ điều này. Không thêm dự án, CV hoặc thông tin cá nhân giả. Các liên kết trong dữ liệu hiện tại bao gồm Telegram `https://t.me/anpham2kx` và GitHub `https://github.com/anpham2kx` do chủ project cập nhật sau lần đối chiếu nguồn.

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

Kiểm tra họ tên 2–100 ký tự, email hợp lệ tối đa 254 ký tự, nội dung 1–5.000 ký tự sau khi trim. Lỗi gắn với từng trường; focus chuyển đến trường lỗi đầu tiên. Ref khóa ngay trước request ngăn gửi trùng; fieldset bị khóa trong khi gửi. Chỉ reset khi HTTP thành công. Lỗi mạng, timeout, HTTP 429 và các lỗi HTTP khác đều giữ dữ liệu. Timeout 20 giây báo chưa xác nhận được kết quả; không tự gửi lại vì email có thể đã được dịch vụ nhận.

Kiểm thử tự động giả lập response của EmailJS và kiểm tra payload; không gửi email thật. Việc giao thư, hạn mức, allowlist và cấu hình template ở tài khoản cần được kiểm tra trên môi trường triển khai.

## Nhạc nền và không khí Halloween

- Ảnh nền: `public/images/Background_Halloween_Cozy_Cottage.jpg`, bản sao nguyên vẹn của file được cung cấp (1280×720, khoảng 179 KB).
- Nhạc: `public/audio/autumn-halloween.mp3`, bản sao nguyên vẹn của MP3 được cung cấp, đổi sang tên URL ngắn. File khoảng **84 MB**; giữ `preload="none"` và để trình duyệt tải khi phát, hỗ trợ HTTP Range. Khi đưa lên hosting, cần phục vụ cả thư mục `public/audio`; có thể thay file cùng đường dẫn để đổi nhạc.
- Đĩa vinyl ở góc trái dưới có nhãn bí ngô và dơi vẽ bằng SVG/CSS, không tải thêm hình từ bên ngoài. Bấm hoặc nhấn Enter/Space để phát/tạm dừng. Đĩa chỉ xoay khi audio đang phát; dừng giữ nguyên góc quay. Nhạc lặp, âm lượng khởi tạo 35%, phát tiếp từ thời điểm đã dừng.
- Trang thử tự phát một lần. Nếu trình duyệt chặn autoplay có âm thanh, đĩa giữ trạng thái dừng và người đọc bấm đĩa để bắt đầu. Lựa chọn tạm dừng được nhớ trong `sessionStorage` của tab; không tự bật lại sau reload khi đã chọn dừng. Nhạc vẫn hoạt động nếu storage bị chặn. Lỗi tải có thông báo và cho phép bấm thử lại.
- Lá vàng/cam rơi chậm, đung đưa và xoay bằng CSS: tối đa 20 lá, 12 ở màn hình ≤760 px và 8 ở ≤480 px. Lớp lá nằm phía sau sách, không bắt pointer và không gây render React theo từng frame. Tab ẩn tạm dừng chuyển động lá. `prefers-reduced-motion` ẩn lá và bỏ quay đĩa; nhạc vẫn bật/tắt bình thường.

Không xem được [video tham khảo YouTube](https://www.youtube.com/live/vuPhCSunt5U) trong môi trường làm việc (trang xem trả HTTP 429). Hiệu ứng lá được dựng theo mô tả và tông màu ảnh cung cấp, chưa đối chiếu trực tiếp chuyển động trong video.

## Cấu trúc file

```text
src/
  app/
    layout.tsx              # Server layout, metadata, khởi tạo theme, fallback không JS
    page.tsx                # Server page ghép nền, sách và nút nhạc
    globals.css             # Tailwind, token sáng/tối, layout giấy, hiệu ứng 3D
  data/portfolio.ts         # Dữ liệu đã đối chiếu, liên kết, chỉ mục chương
  components/
    book-pages.tsx          # Server Components dựng 2 bìa + 6 trang nội dung
    book.tsx                # Client shell: điều hướng và theme
    contact-form.tsx        # Client form: validation, khóa gửi, trạng thái
    autumn-background.tsx   # Server Component: nền và SVG lá tĩnh, CSS animate
    background-music.tsx    # Client audio: autoplay, play/pause/retry, đĩa Halloween
    icon.tsx                # Icon Lucide dùng chung
  hooks/use-book.ts         # Pointer, keyboard, RAF, resize, capture, điều phối DOM
  lib/
    book-machine.ts         # Logic thuần: trang, đường lật nhiều tờ, lock, ngưỡng kéo
    contact.ts              # Validation + transport EmailJS
public/
  images/avatar.webp       # Ảnh gốc được tối ưu, 640×960
  images/Background_Halloween_Cozy_Cottage.jpg # Nền do chủ project cung cấp
  audio/autumn-halloween.mp3 # MP3 gốc do chủ project cung cấp
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

`book-machine.ts` là nguồn trạng thái duy nhất: `anchor` là trang đang đọc, mỗi cặp luôn gồm hai trang, `phase` là `idle → dragging/settling → idle`. `begin()` khóa đồng bộ nên thao tác nhanh không tạo nhiều transaction chồng nhau. Input mới trong khi đang chuyển bị bỏ qua có chủ đích; không xếp hàng thao tác bấm lặp. Với một lệnh chuyển nhanh, `turnPath()` tạo đường đi qua từng trang/cặp trang ở giữa, rồi hook chạy tuần tự các tờ trong cùng một khóa điều hướng. Nút điều hướng bị disabled đúng lúc và tại biên đầu/cuối.

Một lần nhảy xa dùng khoảng 320 ms/tờ, lần lật đơn khoảng 480 ms. Ví dụ đi từ trang giới thiệu đến liên hệ trên desktop lật ba tờ; đến dự án, các trang trung gian xuất hiện trên hai mặt tờ giấy. Chỉ focus trang đích sau khi xong cả chuỗi. Hủy/resize xóa phần chuỗi chưa chạy và giữ trang đã lật xong gần nhất. `prefers-reduced-motion` hoàn tất ngay.

`ResizeObserver` theo dõi kích thước thực của sách để hủy thao tác đang diễn ra nếu hình học thay đổi. Trang đang focus/chạm/cuộn được ghi nhận vào `anchor`; resize giữ nguyên cặp trang và dữ liệu form. Không còn logic chuyển sang một trang. Resize, pointercancel, mất capture thật, Escape, mất focus cửa sổ và tab bị ẩn đều hủy transaction về vị trí ổn định. RAF cũ được vô hiệu bằng generation token.

Pointer Events thống nhất chuột/cảm ứng/bút. Kéo ngang từ bìa, chữ, ảnh, khoảng trống hoặc chân trang đều lật được sách; không cần kéo ở mép. Giữ **Shift và kéo** hoặc nhấp đúp/ba để chọn văn bản bằng hành vi gốc của trình duyệt. Không bắt đầu lật từ link, button, field, label, contenteditable hay thanh cuộn. Các modifier Ctrl/Alt/Meta cũng giữ thao tác gốc. Một vùng chữ đã chọn không khóa thao tác kéo mới trên sách.

Ngưỡng nhận thao tác là 10 px với tỷ lệ ngang/dọc 1,25; `touch-action: pan-y pinch-zoom` giữ cuộn dọc và pinch zoom. Mousedown đơn dành cho kéo lật, nhấp đúp/ba hoặc giữ Shift dành cho chọn chữ; cách tách này tránh native mouse capture bị giữ sau resize trên Firefox. Khi đã xác nhận kéo ngang, CSS tắt chọn chữ và capture chuyển sang phần tử sách ổn định. HTML drag-and-drop của ảnh không được lấy mất pointer stream. Sự kiện mất implicit capture từ phần tử cũ trên cảm ứng được bỏ qua đúng cách; click phát sinh sau một lần kéo được chặn để không kích hoạt nhầm nội dung bên dưới.

Trong lúc kéo, chỉ cập nhật transform của một lớp lật bằng `requestAnimationFrame`; không set React state mỗi pointermove. Hoàn tất khi vượt 32% đường kéo hoặc flick cùng hướng nhanh hơn 0,55 px/ms với tối thiểu 24 px. Flick ngược nhanh hơn 0,35 px/ms hủy lật; vận tốc quá 100 ms không còn được dùng. Có thể kéo ngược về đầu để hủy.

Các trang thật được mount một lần. Trang không hiển thị dùng `hidden` và `inert`. Animation dùng bản sao DOM inert/aria-hidden, đã bỏ ID; không tạo thêm React form hoặc gửi request. Nhờ vậy dữ liệu form và vị trí cuộn được giữ qua các lần lật. Các phần nội dung dài có vùng cuộn riêng trong giấy và footer cố định; không cắt bỏ nội dung để ép vừa trang.

## Hiệu năng và accessibility

- Server Components cho dữ liệu/nội dung/nền tĩnh; Client Components cho tương tác sách, form và audio. Nội dung vẫn có trong HTML ban đầu.
- Ảnh gốc 1.964.030 byte được chuyển thành WebP 49.194 byte, sau đó `next/image` cung cấp ảnh theo kích thước hiển thị. Font tự lưu trữ với `font-display: swap`, không gọi Google Fonts khi người đọc mở trang.
- Hiệu ứng lật dùng CSS 3D; không có bộ chọn chế độ hiển thị hay tùy chọn CPU/localStorage cho hiệu ứng. Không WebGL. Lá và đĩa animate bằng CSS transform/opacity; không có vòng render React theo frame. Một lớp lật được tạo khi cần rồi hủy; trạng thái kéo không render lại toàn sách theo frame.
- `prefers-reduced-motion` bỏ animation tự chạy/settle, lá rơi và quay đĩa; pointer drag vẫn bám tay. Không có spinner quay khi giảm chuyển động.
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

Hoặc `npm run check` để chạy TypeScript, lint, unit test và build theo thứ tự. E2E tự mở production server riêng trên `127.0.0.1:3100`; chạy build trước. Cổng 3100 cần trống. Test không tái sử dụng dev server trên cổng 3000. HTML report nằm ở `playwright-report/index.html`; trace chỉ giữ khi thất bại. Bộ test đọc cấu hình EmailJS ở `.env.local`; các bài contract mong đợi đúng các ID đã cung cấp.

Nếu npm bỏ sót native optional dependency của Vitest trên Windows, chạy lại `npm install --include=optional`; không cần xóa mã nguồn hay thay đổi bảo mật máy.

Phạm vi đã thực hiện và giới hạn còn lại được ghi tại [docs/TESTING.md](docs/TESTING.md). Mô phỏng viewport không thay thế thiết bị vật lý; không cam kết mọi trình duyệt hay thiết bị đều có trải nghiệm giống nhau.

Bản cập nhật đạt TypeScript, lint, production build, **34 unit test và 105 E2E**; 3 bài CDP touch bỏ qua đúng phạm vi. Chi tiết tại [docs/TESTING.md](docs/TESTING.md). Có thể xem [ảnh desktop](docs/screenshots/chromium-desktop-light.png) và [ảnh điện thoại](docs/screenshots/chromium-phone-light.png).
