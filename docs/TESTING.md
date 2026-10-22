# Kiểm thử và phạm vi hỗ trợ

Ngày kiểm tra: **22/10/2026, Asia/Saigon**. Mã nguồn chạy tại `C:\VibeCode\profolio`.

## Kết quả lượt xác nhận cuối

- `npm run typecheck`: đạt.
- `npm run lint`: đạt, không có warning (chạy với `--max-warnings=0`).
- `npm test`: **34/34 test đạt**, 2 file.
- `npm run build`: đạt; Next.js tạo production build và prerender trang chính thành công.
- `npx playwright test`: **123 test đạt, 3 test bỏ qua có chủ đích, 0 thất bại**, không bật retry trong lượt xác nhận cuối. Ba trường hợp bỏ qua là CDP touch trên Firefox desktop, WebKit desktop và WebKit phone, do CDP chỉ dùng được với Chromium.
- Axe không phát hiện vi phạm trong những trang/trạng thái và tập quy tắc đã kiểm tra; đây không phải chứng nhận accessibility toàn diện.

Report cuối xác nhận 126 trường hợp trên production build: 123 đạt, 3 bỏ qua, 0 thất bại. Các số trên không cộng những lần thử nghiệm trước đó hoặc 9 lượt kiểm tra Firefox lặp lại. Logic kéo toàn trang đã nằm trong bản build chạy E2E. Thay đổi cấu hình cuối chỉ bổ sung `allowedDevOrigins: ["127.0.0.1"]` cho dev server; đã kiểm tra riêng bằng Chromium rằng cả `localhost:3000` và `127.0.0.1:3000` khởi tạo sách, kéo từ ảnh sang trang kế tiếp và không có lỗi console. `npm run check` được chạy lại sau thay đổi cấu hình và bài test dùng Clock.

## Môi trường

- Windows, Node.js 24.18.1, npm 11.16.0.
- Next.js 16.4.2, React 19.3.1, Tailwind CSS 4.3.3, TypeScript strict với `noUncheckedIndexedAccess`.
- Playwright 1.64.1; Chromium 156.0.8078.4 (revision 1248), Firefox 157.0 (1555), WebKit 27.2 (2370).
- E2E chạy trên **production build**, dùng `next start` tại `127.0.0.1:3100`, không tái sử dụng dev server ở cổng 3000.

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

### Nhạc nền, đĩa Halloween và lá rơi

`tests/e2e/ambience.spec.ts` gồm 6 tình huống chạy trên 6 cấu hình trình duyệt:

- Ảnh nền trả đúng JPEG, đĩa bí ngô hiển thị, có nhãn/focus bàn phím; lớp lá không bắt pointer, mũi tên sách vẫn bấm được và không tràn ngang ở 320 px.
- Khi lựa chọn đang là tạm dừng, không tải MP3. HTTP Range trả 206 và đúng 1.024 byte được yêu cầu. Kiểm tra SHA-256 xác nhận cả ảnh và MP3 trong `public/` giống nguyên bản người dùng cung cấp.
- Phát MP3 thật bằng Enter, xác nhận `currentTime` tăng; pause giữ thời điểm và góc đĩa, resume tiếp tục thời gian cũ; lựa chọn pause còn sau reload. Có kiểm tra thuộc tính loop và âm lượng khác 0. Đây là kiểm tra bằng API media, chưa đánh giá chất lượng âm thanh bằng tai/loa thật.
- Giả lập `NotAllowedError` ở lần tự phát đầu: đĩa dừng, không báo lỗi tải và bấm nút vẫn phát được MP3 thật.
- Giữ lại Promise của lần `play()` đầu, hủy rồi cho Promise hoàn tất muộn; nhạc không tự bật lại. Bấm liên tục trong một lượt vẫn kết thúc ở trạng thái dừng. Phần độ trễ này được giả lập ở API media, không phải phép đo mạng chậm thật.
- Dùng đường dẫn MP3 không tồn tại để tạo lỗi tải thật, sau đó khôi phục đường dẫn đúng: thông báo lỗi, dừng cả audio lẫn đĩa và phát lại thành công. Cách này kiểm tra cả WebKit, nơi media request không đi qua `page.route()` ổn định trong môi trường Windows này.
- Reduced motion ẩn lá và bỏ animation đĩa, giữ nút phát/tạm dừng hoạt động.

Các bài media chạy tuần tự trong từng cấu hình để tránh nhiều audio context của cùng trình duyệt headless tranh tài nguyên. Các bài sách chọn trạng thái nhạc tạm dừng trước khi mở trang để không tải lặp file 84 MB. Trace giữ DOM/thao tác/source và ảnh khi lỗi, bỏ screencast liên tục vì mã hóa nền ảnh có lá chuyển động trên ba worker làm chậm bộ kiểm thử. Không tắt lá hoặc chuyển động sách trong những bài kiểm thử giao diện thông thường.

### Logic thuần — 34 test

Hai file `tests/unit/book-machine.test.ts` và `tests/unit/contact.test.ts` kiểm tra:

- Giới hạn đầu/cuối của sách hai trang, số trang lẻ, vị trí ban đầu ở cặp bìa trước/giới thiệu.
- Theo dõi trang bên phải đang đọc; chuyển mục cùng spread không tạo animation.
- Khóa 100 lệnh chồng nhau, chỉ commit một lần; chuỗi 1.000 transaction với điều hướng/hủy giữ invariant.
- Hủy drag/resize và mở khóa cho thao tác tiếp theo.
- Phân loại ngang/dọc, ngưỡng khoảng cách, flick nhanh, kéo ngược và cử động nhỏ không đủ ý định.
- Đường lật nhiều tờ xuôi/ngược qua từng cặp trang, cùng cặp trang, giới hạn đích ở hai bìa.
- Validation trống, khoảng trắng, quá dài, email không hợp lệ; nội dung đúng 1 và 5.000 ký tự đều hợp lệ.
- Payload chỉ chứa đúng ba template variables, trim dữ liệu và sử dụng chính xác cấu hình được cung cấp.
- Thiếu cấu hình, HTTP 400/429/500, mất mạng, timeout 20 giây; không gọi mạng khi dữ liệu không hợp lệ.

### E2E trong trình duyệt

`tests/e2e/portfolio.spec.ts` kiểm tra trên cả sáu cấu hình:

- Dữ liệu gốc, ảnh/font tải thành công, liên kết theo dữ liệu chủ project đã cập nhật và thông báo trang dự án trống.
- Nút trước/sau đi đúng thứ tự và dừng tại biên; burst 8 lần nhấn trong cùng một lượt không lật trùng.
- Phím trái/phải, không lật khi đang nhập liệu/chọn văn bản; bản nháp form còn nguyên sau khi lật đi và quay lại.
- Transform thay đổi trong lúc kéo; kéo ngắn hủy; thả ngoài vùng sách vẫn hoàn tất.
- Pointer cancel, mất capture, thay đổi kích thước thực của sách, không kẹt sau đó.
- Giữ cặp Liên hệ/bìa sau, bản nháp và vị trí cuộn khi đổi kích thước desktop/điện thoại. Form được tăng chiều cao trong test để kiểm tra cuộn với nội dung dài.
- Form có lỗi từng trường, giữ nội dung sau thất bại, khóa gửi đang xử lý, ngăn submit lặp và chỉ xóa khi thành công.
- Reduced motion, sáng/tối và khôi phục theme sau reload; không còn nút đổi chế độ hiển thị.
- Tất cả trang có vùng cuộn; nội dung dài không tạo tràn ngang; form vẫn gửi được khi nhập 4.500 ký tự.
- Axe WCAG 2 A/AA và 2.1 AA ở trang đầu, nội dung, form sáng và form tối.
- Chụp giao diện sáng/tối/liên hệ cho desktop, tablet, điện thoại.

Touch được phát qua CDP trong Chromium để kiểm tra hành vi cuộn dọc và vuốt ngang của trình duyệt. Bài CDP touch được bỏ qua có chủ đích ở Firefox/WebKit vì giao thức này chỉ có trên Chromium. Các bài pointer, giao diện và form khác vẫn chạy trên Firefox/WebKit.

`tests/e2e/compact-book.spec.ts` bổ sung trên cả sáu cấu hình:

- Kích thước sách tối đa 944×560 CSS px (phần giấy), tên nằm một dòng không tràn, bỏ tab số và các câu trang trí được yêu cầu.
- Luôn hiển thị đúng hai trang trên cả sáu cấu hình. Trang giới thiệu ở phải bìa trước, liên hệ ở trái bìa sau; giấy trắng trong cả sáng/tối.
- Không còn trang Kết nối; bìa không có footer giấy trắng, pseudo-element mép giấy toàn chiều rộng đã bị xóa. Bộ đếm kết thúc ở 06/06, không tính bìa là nội dung.
- Ghi nhận từng tờ animation khi nhảy từ giới thiệu đến liên hệ và ngược lại, xác minh đúng thứ tự; input chen ngang không đổi đích.
- Hủy bằng Escape hoặc resize ở giữa chuỗi giữ tờ đã hoàn tất; thao tác tiếp theo vẫn đúng. Bài này dùng Playwright Clock giữ chính xác giữa hai tờ, tránh độ trễ truyền lệnh tới Firefox khiến cả chuỗi chạy xong trước khi phím Escape được gửi. Các bài kéo/vuốt khác chạy animation với thời gian thực.
- Form từ chối nội dung toàn khoảng trắng; chấp nhận và gửi đúng 1 hoặc 5.000 ký tự bằng request giả lập.

`tests/e2e/resilience.spec.ts` bổ sung trên Chromium:

- Màn hình 320 px và màn hình ngang thấp: cuộn tới được nút gửi, không tràn ngang.
- Tắt JavaScript: vẫn đọc được cả 8 trang theo chiều dọc.
- Bút mô phỏng qua CDP: kéo từ giữa trang, đảo hướng hủy, kéo hoàn tất.
- Escape/mất focus cửa sổ hủy animation; lần điều hướng tiếp theo vẫn đúng.
- Mô phỏng localStorage không khả dụng; điều hướng và theme vẫn dùng được.
- Đo chiều rộng tài liệu **giữa lúc lật ngược** trên điện thoại, không chỉ sau khi animation kết thúc.

`tests/e2e/full-page-drag.spec.ts` kiểm tra thêm trên cả sáu cấu hình:

- Kéo chuột bắt đầu từ chữ trên bìa, đoạn giới thiệu, ảnh đại diện, khoảng trống và chân trang; kiểm tra chuyển động trước khi thả, rồi xác nhận đúng trang đích.
- Giữ Shift và kéo chọn chữ thật bằng chuột; nhấp đúp chọn từ. Kiểm tra vị trí sau khi font tải xong, không tạo vùng chọn giả bằng JavaScript để thay cho thao tác chuột.
- Vùng chữ đã chọn không khóa lần kéo mới trên bìa; phím điều hướng vẫn nhường cho thao tác chọn chữ.
- Kéo ngắn từ giữa đoạn văn hủy đúng; link Liên hệ vẫn mở đúng trang; kéo chọn chữ trong textarea không lật sách hoặc làm mất nội dung.

## Các vấn đề đã phát hiện và sửa

- Touch implicit capture: sự kiện `lostpointercapture` ở phần tử gốc khi chuyển capture lên sách không còn bị hiểu nhầm là hủy gesture.
- Giới hạn kéo chuột/bút ở mép khiến thao tác từ nội dung không phản hồi: đã bỏ điều kiện này và xóa các lớp bắt kéo ở mép. Bìa, chữ, ảnh, khoảng trống và chân trang đều nhận kéo; các điều khiển tương tác và thanh cuộn được giữ riêng.
- HTML drag-and-drop của ảnh/chữ đã chọn có thể lấy mất pointer stream: ngăn dragstart trong thao tác lật, chỉ tắt chọn chữ khi đã xác nhận kéo ngang. Shift-kéo và nhấp đúp/ba vẫn dành cho chọn văn bản.
- Firefox cần điểm bắt đầu vùng chọn khi Shift-kéo trên tài liệu chưa có caret: tạo caret tại điểm nhấn, sau đó để trình duyệt mở rộng vùng chọn. Không giả lập nội dung được chọn.
- Firefox có thể giữ native mouse selection capture sau khi thu nhỏ viewport rồi thả chuột bên ngoài viewport mới, khiến lần bấm tiếp theo đi sai phần tử. Mousedown đơn của thao tác lật không khởi tạo native selection capture; Shift-kéo và nhấp đúp vẫn hoạt động. Các bài chọn chữ, hủy gesture/resize và hủy chuỗi được chạy lặp 3 lần trên Firefox (9/9 đạt).
- Resize không làm thay đổi hình học sách: không hủy lật vì sự kiện resize dư; resize làm đổi kích thước thật vẫn hủy và giữ anchor. Bài kiểm thử resize kiểm tra đúng thay đổi hình học thật.
- Mũi tên ở màn hình ngang 844 px từng nhô ra 5 px: giữ đủ khoảng trống hai bên sách. Kiểm thử cả trạng thái tĩnh và trong lúc lật.
- Lớp trang trí mép giấy chạy ngang cả cuốn sách gây dải trắng dưới bìa: đã bỏ. Hai bìa dùng chung component và không render footer nội dung.
- Trình duyệt có thể xếp hàng sự kiện scroll sau thao tác đổi trang/resize: hook chụp trực tiếp vị trí cuộn trước khi ẩn trang hoặc hủy chuyển động, giữ vị trí cả trên WebKit.
- Test mất pointer capture lấy pointer ID thật từ sự kiện và chờ trình duyệt xử lý chuyển capture, không giả định ID luôn là 1. Hai bài hủy kéo/giữ cuộn đã chạy lặp 3 lần trên Firefox desktop và WebKit phone (12/12 đạt), ngoài bộ tổng hợp.

## Ảnh và kiểm tra trực quan

Ảnh nằm trong [screenshots](screenshots/). Đã xem ảnh desktop sáng, desktop form tối, tablet sáng, phone sáng, phone form tối và form ở 320 px. Các test chụp thêm những cấu hình còn lại.

- [Desktop sáng](screenshots/chromium-desktop-light.png)
- [Desktop tối](screenshots/chromium-desktop-dark.png)
- [Tablet sáng](screenshots/chromium-tablet-light.png)
- [Điện thoại sáng](screenshots/chromium-phone-light.png)
- [Form trên điện thoại](screenshots/chromium-phone-contact.png)
- [Màn hình nhỏ 320 px](screenshots/compact-320x568.png)

Vùng nội dung dài cuộn độc lập bên trong giấy; footer hiển thị mũi tên xuống nếu còn nội dung phía dưới. Một ảnh chụp có thể chỉ hiển thị phần đang cuộn tới, không có nghĩa phần còn lại bị loại bỏ.

## Giới hạn còn lại

- Không xem được video YouTube tham khảo (HTTP 429); hiệu ứng lá dựa trên mô tả và ảnh được cung cấp, chưa đối chiếu từng chuyển động với video.
- Chính sách autoplay có âm thanh phụ thuộc trình duyệt và quyền của người đọc. Nếu bị chặn, cần bấm đĩa để bắt đầu. Chưa thử các tình huống cuộc gọi/khóa màn hình/Bluetooth hoặc chế độ tiết kiệm dữ liệu trên điện thoại thật. MP3 gốc khoảng 84 MB; chưa đo trải nghiệm trên mạng di động yếu.
- Không gửi email thật. Mock đã xác minh request, trạng thái và cách giữ/xóa dữ liệu; chưa xác minh inbox, hạn mức tài khoản, domain allowlist, spam filter hoặc giao thư của EmailJS.
- Chưa thử trên thiết bị vật lý, màn hình cảm ứng/bút thật, Safari thật, Samsung Internet hay trình duyệt cũ. Touch/bút là sự kiện phát bằng giao thức của trình duyệt.
- Điện thoại vẫn hiển thị hai trang theo yêu cầu nên chữ và trường nhập nhỏ hơn; chưa xác minh tự động zoom khi focus input trên Safari iOS thật.
- Chưa kiểm thử thủ công NVDA/VoiceOver/TalkBack, bàn phím ảo/IME tiếng Việt trên điện thoại thật, pinch zoom đa điểm và các công nghệ hỗ trợ kết hợp. Axe không chứng minh tuân thủ toàn bộ WCAG.
- Chưa benchmark FPS, nhiệt độ, pin hoặc Lighthouse trên thiết bị cấu hình thấp/mạng yếu. Không cam kết 60 FPS hay hỗ trợ tuyệt đối mọi thiết bị. Trình duyệt cần hỗ trợ CSS 3D; chế độ giảm chuyển động của hệ điều hành vẫn được tôn trọng.
- Kiểm thử thả ngoài **vùng sách trong cửa sổ trình duyệt**; mất focus/tab ẩn được xử lý hủy. Không chứng minh mọi hành vi cấp hệ điều hành khi kéo ra ngoài toàn bộ cửa sổ trên mọi nền tảng.
- Nội dung học vấn/GPA/tín chỉ là dữ liệu nguồn tại ngày đọc, không tự xác minh tính cập nhật. Telegram/GitHub hiện dùng URL do chủ project cập nhật trong dữ liệu. Nguồn chưa có dự án hay file CV thật.
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
