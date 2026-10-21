# Kiểm thử và phạm vi hỗ trợ

Ngày kiểm tra: **21/10/2026, Asia/Saigon**. Mã nguồn chạy tại `C:\VibeCode\profolio`.

## Kết quả lượt xác nhận cuối

- `npm run typecheck`: đạt.
- `npm run lint`: đạt, không có warning (chạy với `--max-warnings=0`).
- `npm test`: **29/29 test đạt**, 2 file.
- `npm run build`: đạt; Next.js tạo production build và prerender trang chính thành công.
- `npx playwright test`: **81 test đạt, 3 test bỏ qua có chủ đích, 0 thất bại**, thời gian khoảng 2 phút. Ba trường hợp bỏ qua là CDP touch trên Firefox desktop, WebKit desktop và WebKit phone, do CDP chỉ dùng được với Chromium.
- Axe không phát hiện vi phạm trong những trang/trạng thái và tập quy tắc đã kiểm tra; đây không phải chứng nhận accessibility toàn diện.

Lượt cuối chạy liên tục `npm run check` rồi E2E trên bản build đó, không bật retry để che lỗi. Các số trên không cộng những lần thử nghiệm và sửa lỗi trước đó.

## Môi trường

- Windows, Node.js 24.18.1, npm 11.16.0.
- Next.js 16.4.2, React 19.3.1, Tailwind CSS 4.3.3, TypeScript strict với `noUncheckedIndexedAccess`.
- Playwright 1.64.1; Chromium 156.0.8078.4 (revision 1248), Firefox 157.0 (1555), WebKit 27.2 (2370).
- E2E chạy trên **production build**, dùng `next start`, không chỉ dev server.

## Các cấu hình đã chạy

- Chromium desktop: 1440×1024 CSS px.
- Firefox desktop: 1440×1024 CSS px.
- WebKit desktop: 1440×1024 CSS px.
- Chromium, cấu hình giả lập iPad Mini: 768×1024 CSS px.
- Chromium, cấu hình giả lập Pixel 7: 412×839 CSS px.
- WebKit, cấu hình giả lập iPhone 13: 390×664 CSS px.
- Kiểm tra bổ sung trên Chromium: 320×568, 844×390 (ngang), 1024×768; thay đổi giữa 1440×1024 và 390×650 trong khi giữ trang/form.

Đây là trình duyệt headless thật với viewport/thiết bị **mô phỏng**, không phải thử nghiệm trên iPad/iPhone/Android vật lý. WebKit trên Windows không đồng nghĩa đã kiểm thử bản Safari thương mại trên macOS/iOS.

## Nội dung kiểm thử

### Logic thuần — 29 test

Hai file `tests/unit/book-machine.test.ts` và `tests/unit/contact.test.ts` kiểm tra:

- Giới hạn đầu/cuối trong chế độ 1/2 trang, số trang lẻ, giữ chính xác trang lẻ khi đổi chế độ.
- Theo dõi trang bên phải đang đọc; chuyển mục cùng spread không tạo animation.
- Khóa 100 lệnh chồng nhau, chỉ commit một lần; chuỗi 1.000 transaction với điều hướng/hủy/resize giữ invariant.
- Hủy drag/resize và mở khóa cho thao tác tiếp theo.
- Phân loại ngang/dọc, ngưỡng khoảng cách, flick nhanh, kéo ngược và cử động nhỏ không đủ ý định.
- Validation trống, khoảng trắng, quá dài, email không hợp lệ.
- Payload chỉ chứa đúng ba template variables, trim dữ liệu và sử dụng chính xác cấu hình được cung cấp.
- Thiếu cấu hình, HTTP 400/429/500, mất mạng, timeout 20 giây; không gọi mạng khi dữ liệu không hợp lệ.

### E2E trong trình duyệt

`tests/e2e/portfolio.spec.ts` kiểm tra trên cả sáu cấu hình:

- Dữ liệu gốc, ảnh/font tải thành công, liên kết nguyên trạng và thông báo trang dự án trống.
- Nút trước/sau đi đúng thứ tự và dừng tại biên; burst 8 lần nhấn trong cùng một lượt không lật trùng.
- Phím trái/phải, không lật khi đang nhập liệu/chọn văn bản; bản nháp form còn nguyên sau khi lật đi và quay lại.
- Transform thay đổi trong lúc kéo; kéo ngắn hủy; thả ngoài vùng sách vẫn hoàn tất.
- Pointer cancel, mất capture, thay đổi kích thước thực của sách, không kẹt sau đó.
- Giữ chính xác trang liên hệ và vị trí cuộn khi chuyển giữa 1/2 trang.
- Form có lỗi từng trường, giữ nội dung sau thất bại, khóa gửi đang xử lý, ngăn submit lặp và chỉ xóa khi thành công.
- Hiển thị đơn giản, reduced motion, sáng/tối và khôi phục tùy chọn sau reload.
- Tất cả trang có vùng cuộn; nội dung dài không tạo tràn ngang; form vẫn gửi được khi nhập 4.500 ký tự.
- Axe WCAG 2 A/AA và 2.1 AA ở trang đầu, nội dung, form sáng và form tối.
- Chụp giao diện sáng/tối/liên hệ cho desktop, tablet, điện thoại.

Touch được phát qua CDP trong Chromium để kiểm tra hành vi cuộn dọc và vuốt ngang của trình duyệt. Bài CDP touch được bỏ qua có chủ đích ở Firefox/WebKit vì giao thức này chỉ có trên Chromium. Các bài pointer, giao diện và form khác vẫn chạy trên Firefox/WebKit.

`tests/e2e/resilience.spec.ts` bổ sung trên Chromium:

- Màn hình 320 px và màn hình ngang thấp: cuộn tới được nút gửi, không tràn ngang.
- Tắt JavaScript: vẫn đọc được cả 8 trang theo chiều dọc.
- Bút mô phỏng qua CDP: kéo, đảo hướng hủy, kéo hoàn tất.
- Escape/mất focus cửa sổ hủy animation; lần điều hướng tiếp theo vẫn đúng.
- Mô phỏng không hỗ trợ CSS 3D và localStorage không khả dụng; điều hướng và theme vẫn dùng được.
- Đo chiều rộng tài liệu **giữa lúc lật ngược** trên điện thoại, không chỉ sau khi animation kết thúc.

## Các vấn đề đã phát hiện và sửa

- Touch implicit capture: sự kiện `lostpointercapture` ở phần tử gốc khi chuyển capture lên sách không còn bị hiểu nhầm là hủy gesture.
- WebKit tự chọn chữ khi kéo mép sách: ngăn default chỉ ở mép kéo chuột/bút và tắt chọn chữ trong gesture đã được xác nhận; việc chọn văn bản bình thường vẫn giữ nguyên.
- Resize không làm thay đổi hình học sách: không hủy lật vì sự kiện resize dư; resize làm đổi kích thước thật vẫn hủy và giữ anchor. Bài kiểm thử resize kiểm tra đúng thay đổi hình học thật.
- Trang lật ngược ở chế độ một trang từng tạo tràn ngang trong frame trung gian: lớp animation được clip trong khuôn trang.

## Ảnh và kiểm tra trực quan

Ảnh nằm trong [screenshots](screenshots/). Đã xem ảnh desktop sáng, desktop form tối, tablet sáng, phone sáng, phone form tối và form ở 320 px. Các test chụp thêm những cấu hình còn lại.

- [Desktop sáng](screenshots/chromium-desktop-light.png)
- [Desktop tối](screenshots/chromium-desktop-dark.png)
- [Tablet sáng](screenshots/chromium-tablet-light.png)
- [Điện thoại sáng](screenshots/chromium-phone-light.png)
- [Form trên điện thoại](screenshots/chromium-phone-contact.png)
- [Màn hình nhỏ 320 px](screenshots/compact-320x568.png)

Vùng nội dung dài cuộn độc lập bên trong giấy; footer hiển thị “Đọc tiếp” nếu còn nội dung phía dưới. Một ảnh chụp có thể chỉ hiển thị phần đang cuộn tới, không có nghĩa phần còn lại bị loại bỏ.

## Giới hạn còn lại

- Không gửi email thật. Mock đã xác minh request, trạng thái và cách giữ/xóa dữ liệu; chưa xác minh inbox, hạn mức tài khoản, domain allowlist, spam filter hoặc giao thư của EmailJS.
- Chưa thử trên thiết bị vật lý, màn hình cảm ứng/bút thật, Safari thật, Samsung Internet hay trình duyệt cũ. Touch/bút là sự kiện phát bằng giao thức của trình duyệt.
- Chưa kiểm thử thủ công NVDA/VoiceOver/TalkBack, bàn phím ảo/IME tiếng Việt trên điện thoại thật, pinch zoom đa điểm và các công nghệ hỗ trợ kết hợp. Axe không chứng minh tuân thủ toàn bộ WCAG.
- Chưa benchmark FPS, nhiệt độ, pin hoặc Lighthouse trên thiết bị cấu hình thấp/mạng yếu. Không cam kết 60 FPS hay hỗ trợ tuyệt đối mọi thiết bị. Nút chế độ đơn giản là lựa chọn chủ động khi hiệu ứng không phù hợp.
- Kiểm thử thả ngoài **vùng sách trong cửa sổ trình duyệt**; mất focus/tab ẩn được xử lý hủy. Không chứng minh mọi hành vi cấp hệ điều hành khi kéo ra ngoài toàn bộ cửa sổ trên mọi nền tảng.
- Nội dung học vấn/GPA/tín chỉ là dữ liệu nguồn tại ngày đọc, không tự xác minh tính cập nhật. Telegram nguồn là link chung; không tự đoán tài khoản. Nguồn chưa có dự án hay file CV thật.
- Project đã chạy production local, chưa triển khai lên hosting/domain mới.

## Tái chạy

```bash
npm ci --include=optional
cp .env.example .env.local
npm run check
npx playwright install chromium firefox webkit
npm run test:e2e
```

Trên PowerShell dùng `npm.cmd`, `npx.cmd`, `Copy-Item` như README. Trong môi trường sandbox Windows của phiên làm việc, Chromium chạy được trong sandbox nhưng Firefox và teardown tiến trình bị giới hạn; bộ E2E cuối đã chạy với quyền tạo tiến trình được môi trường cho phép. Không thay đổi thiết lập bảo mật máy.

HTML report chi tiết được tạo tại `playwright-report/index.html` (gitignored). Lệnh `npx playwright show-report` mở report; trace được lưu khi có thất bại. Ngày/phiên bản/kích thước ở tài liệu này là phạm vi kiểm thử cụ thể, không phải tuyên bố hỗ trợ mọi phiên bản.
