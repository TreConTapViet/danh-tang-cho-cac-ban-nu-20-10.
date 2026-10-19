// Mức đồ họa 0..2, cập nhật mỗi giây theo fps đo được.
// Dưới 30 fps 2 giây liền thì hạ một mức; từ 55 fps 5 giây liền thì nâng một mức.
// Đổi mức 3 lần (máy dao động quanh ngưỡng) thì giữ nguyên để khỏi nhấp nháy.
export function nextQuality(s, fps) {
  if (s.flips >= 3) return s
  const low = fps < 30 ? s.low + 1 : 0
  const high = fps >= 55 ? s.high + 1 : 0
  if (low >= 2 && s.q > 0) return { q: s.q - 1, low: 0, high: 0, flips: s.flips + 1 }
  if (high >= 5 && s.q < 2) return { q: s.q + 1, low: 0, high: 0, flips: s.flips + 1 }
  return { ...s, low, high }
}
