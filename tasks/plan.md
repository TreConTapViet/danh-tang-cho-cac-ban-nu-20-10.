# Kế hoạch: bó hoa ảnh thật + GSAP

Tham khảo: Contra Project Calculator (cuộn theo bước, nền cố định phía sau), Naya Studio (hoa động theo cuộn).

## Đã chốt
- React + Tailwind + GSAP (ScrollTrigger). Bỏ hẳn three.js.
- Nền: ảnh bó hoa thật đã tách nền (Unsplash, giấy phép cho dùng, sửa, không cần ghi nguồn), 4 lớp có chiều sâu:
  bó chính (ảnh số 4, gói giấy kraft), 2 lớp phía sau mờ, 1 lớp phía trước mờ.
- Chuyển động: các lớp trôi theo chuột và cuộn với tốc độ khác nhau, bó hoa đung đưa, nở (phóng to) khi nhập đúng tên, cánh hoa bung ra.
- Cánh hoa rơi vẽ trên canvas 2D, có gió và lật.
- Tiêu đề, ô nhập, lời chúc ở giữa trang trong thẻ kính mờ kiểu iOS, nhích lên trên một chút.
- 3 bước cuộn, 4 tên hợp lệ, câu báo sai "Sai òi, thử lại đi ní hì hì".
- Tự giảm đồ họa dưới 30 fps: hạ độ mờ kính, bớt cánh hoa, ẩn lớp phụ (`src/quality.js`).
