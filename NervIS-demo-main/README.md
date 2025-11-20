## Lesson Library UI

Giao diện React được thiết kế theo Figma spec cho LessonLibraryPage với các thẻ InterviewAiCard, mô phỏng thư viện bài học luyện tập phỏng vấn (giải thuật, system design, hành vi...). Ứng dụng được dựng bằng [Vite](https://vitejs.dev/) + React chạy trên Node.js.

### Công nghệ chính

- React 18 + Vite 7 (HMR, ESBuild)
- CSS modules thuần (`src/components/InterviewAiCard.css`, `src/pages/LessonLibraryPage.css`)
- Google Fonts (Space Grotesk)

### Chạy dự án

```powershell
npm install
npm run dev
```

Sau khi `npm run dev`, Vite mở `http://localhost:5173`. Nhấn `Ctrl+C` để dừng.

### Build production

```powershell
npm run build
npm run preview   # xem thử gói build
```

### Cấu trúc nổi bật

- `src/pages/LessonLibraryPage.jsx`: Trang chính với hero, bộ lọc, grid các card.
- `src/components/InterviewAiCard.jsx`: Card tái sử dụng với icon tuỳ biến, rating, meta.
- `src/index.css`: Global token, typography.

Tuỳ biến thêm dữ liệu trong mảng `LESSONS` hoặc kết nối API thực tế để mở rộng.
