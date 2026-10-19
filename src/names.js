// Lời chúc riêng cho từng người (giữ nguyên cách viết).
export const WISHES = {
  'Anh Thư': 'Chúc Thư 20/10 luôn tràn đầy sức khỏe và xynh xắn, vũng bước trên mọi con đường mà mình đi cũng như là luôn gặt hái được trái ngọt quả vàng trên con đường mình đi nhóe',
  'Như Ý': 'Chúc Như Ý 20/10 luôn xynh xắn và cá tinh nhé, tui khoái cái phong cách cá tính của bà lắm á, với lại chúc bà đạt được thành công trong tương lai đặc biệt là đạt được ielts 7-8. nhóe',
  'Phương Trang': 'Chúc Phương Trang 20/10 luôn xynh đẹp, dui tươi và đạt được những mục tiêu mà mình mong muốn nhé, nhớ đậu bằng lái xe nha fen. Với hông tiêu cực và lun tích cực dui dẻ hông khóc nữa nhe.',
  'Tú': 'Chúc Tú 20/10 luôn xynh đẹp và khỏe khắn nhé, chúc bà có hạnh phúc với hồng hài nhi của bà và thành công đạt được nhìu thành tích và đạt được mọi mục đích mà mình đề ra nhé',
}

// Lời chúc chung ở nút "Lời chúc từ tụi tui", mỗi dòng một đoạn.
export const FROM_US = `Minh Nghĩa, Minh Huy: chúc mấy bẹn luôn xynh gái, phát tài phát lộc, tiền vào như nước tiền ra như cà phê phin.
Hoàng Nam: chúc mấy bà lun dui dẻ, ngày càng xynh đẹp nhe.
Toàn: chúc các bạn nữ 1 ngày 20/10 vui vẻ. Mỗi ngừi đều mạnh khoẻ và đẹp hơn theo cách riêng của mỗi ngườiiiii.
ĐẶC BIỆT: SỚM SINH QUÝ TỬ.`

const normalize = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
    .toLowerCase().trim().replace(/\s+/g, ' ')

// Trả về tên chuẩn nếu khớp một trong 4 tên, không phân biệt hoa/thường/dấu.
export const findPerson = (input) =>
  Object.keys(WISHES).find((name) => normalize(name) === normalize(input)) ?? null
