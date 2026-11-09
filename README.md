# MStudent — app iOS & Android (Expo)

App điện thoại gọi backend FastAPI; mọi agent chạy trên server, app không chứa API key.

| Màn hình | Làm gì |
|---|---|
| 💬 Trợ lý | Chat với agent; agent tự gọi tool (xem việc, thêm thông báo, đánh dấu xong, bản tin); bấm để xem từng lần gọi tool |
| ✅ Việc | Danh sách nhóm theo hạn (Quá hạn / Hôm nay / Ngày mai / Tuần này / Sau đó) + bản tin; nút ＋ Thêm |
| 🗓️ Lịch | Dải 7 ngày, chấm đỏ = có việc gấp; nhấn giữ một việc để dời hạn |
| ⚙️ Cài đặt | Địa chỉ server, token, bật/tắt nhắc việc trên máy, gửi thông báo thử, nạp dữ liệu demo |
| Chia sẻ | Zalo (hoặc app khác) → Chia sẻ → MStudent → agent phân tích ngay, hiện các agent đã chạy |

## Chạy thử nhanh (Expo Go — không cần build)

```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://<IP-máy-bạn>:8000 npx expo start
```

Quét QR bằng app **Expo Go** (iPhone hoặc Android). Điện thoại và máy tính phải cùng Wi-Fi, backend chạy
`uvicorn app.main:app --host 0.0.0.0`. Trong Expo Go có đủ chat, việc, lịch, **nhắc việc trên máy**;
chỉ thiếu "Chia sẻ từ Zalo" (cần native module, xem bên dưới).

Simulator iOS dùng `http://localhost:8000`, Android emulator dùng `http://10.0.2.2:8000` — đổi trong tab Cài đặt.

## Build có Share Extension (nhận chia sẻ từ Zalo)

`expo-share-intent` là native module nên cần development build hoặc bản build thật:

```bash
# Trên Mac có Xcode / Android Studio
npx expo prebuild --clean
npx expo run:ios        # hoặc: npx expo run:android

# Hoặc build trên cloud, không cần Xcode (tài khoản Expo miễn phí)
npx eas-cli@latest build --profile development --platform all
```

Không commit thư mục `ios/` và `android/` (đã có trong .gitignore). Bundle id/package: `vn.muoibuon.mstudent`.

## Kiểm tra

```bash
npm test              # logic ngày giờ + kế hoạch nhắc việc (node:test, không cần simulator)
npm run typecheck     # tsc --noEmit
npx expo lint
```

## Cấu trúc

```
app/
  _layout.tsx         StoreProvider + ShareIntentProvider; có nội dung chia sẻ → mở /share
  +native-intent.tsx  link mstudent://dataUrl=… (iOS Share Extension) → /share
  (tabs)/             index (Trợ lý) · tasks (Việc) · calendar (Lịch) · settings (Cài đặt)
  share.tsx           nhận chia sẻ / dán tay → POST /api/ingest → hiện kết quả + trace
lib/
  api.ts              client gọi backend (Bearer token nếu có)
  store.tsx           cài đặt (AsyncStorage) + danh sách việc + tự đồng bộ nhắc việc
  notifications.ts    expo-notifications: xin quyền, đặt/huỷ local notification
  reminders.ts        logic thuần: việc → danh sách mốc nhắc (≤ 60, iOS giới hạn 64)
  dates.ts            ngày giờ theo +07:00, không phụ thuộc múi giờ máy
components/ui.tsx     Card, Button, Chip, TaskRow…
constants/theme.ts    bảng màu sáng/tối
```

## Nhắc việc hoạt động thế nào

Backend tính sẵn các mốc nhắc cho mỗi việc (3 ngày, 1 ngày, 2 giờ trước hạn; thi thêm 7 ngày). Mỗi lần app tải
danh sách việc, nó đặt lại **thông báo trên máy** theo các mốc đó (cộng thêm mốc đúng giờ hạn). Đến giờ, máy tự
hiện thông báo — không cần server push, không cần mạng. Mở app lại thì lịch nhắc được đồng bộ theo việc mới nhất.
