// Hoa anh đào vẽ trên một canvas: cánh rời và bông 5 cánh, vẽ sẵn thành sprite rồi mỗi khung hình chỉ drawImage.
// Mọi hiệu ứng bay (rơi nền, xoáy hai bên, tỏa ra, phun từ túi, đậu quanh lá thư) đều là hạt trong hệ này.

const TAU = Math.PI * 2
const rand = (a, b) => a + Math.random() * (b - a)
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
// [gốc cánh, giữa cánh, đầu cánh]
const PALETTE = [
  ['#ee8fae', '#fff2f7', '#f9bfd2'],
  ['#e47ba0', '#ffe9f1', '#f4a9c2'],
  ['#f4a5bf', '#fffafc', '#fbd5e2'],
  ['#df6f97', '#ffdfeb', '#f19bb8'],
  ['#f6b7cb', '#fff6f9', '#fcdde8'],
]
const REST_MAX = 70
const MAX_PARTS = 700

// Cánh anh đào hướng lên trên, tâm (0, 0), dài s: hai thùy tròn và vết khía nhỏ ở đầu cánh.
function petalPath(g, s) {
  g.beginPath()
  g.moveTo(0, s * 0.5)
  g.bezierCurveTo(-s * 0.56, s * 0.2, -s * 0.52, -s * 0.44, -s * 0.18, -s * 0.5)
  g.quadraticCurveTo(-s * 0.06, -s * 0.42, 0, -s * 0.34)
  g.quadraticCurveTo(s * 0.06, -s * 0.42, s * 0.18, -s * 0.5)
  g.bezierCurveTo(s * 0.52, -s * 0.44, s * 0.56, s * 0.2, 0, s * 0.5)
  g.closePath()
}

function paintPetal(g, s, [base, mid, tip]) {
  const fill = g.createLinearGradient(0, s * 0.5, 0, -s * 0.5)
  fill.addColorStop(0, base)
  fill.addColorStop(0.45, mid)
  fill.addColorStop(1, tip)
  petalPath(g, s)
  g.fillStyle = fill
  // Bóng đổ rất nhẹ dưới cánh cho có khối trên nền sáng.
  g.shadowColor = 'rgba(160,60,90,0.22)'
  g.shadowBlur = s * 0.06
  g.shadowOffsetY = s * 0.03
  g.fill()
  g.shadowColor = 'transparent'
  // Ánh sáng mềm phía trên cánh.
  const shine = g.createRadialGradient(-s * 0.12, -s * 0.12, 0, -s * 0.12, -s * 0.12, s * 0.45)
  shine.addColorStop(0, 'rgba(255,255,255,0.45)')
  shine.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = shine
  g.fill()
  // Gân cánh mờ từ gốc toả lên.
  g.strokeStyle = 'rgba(214,100,140,0.22)'
  g.lineWidth = Math.max(0.6, s * 0.012)
  for (const k of [-0.22, 0, 0.22]) {
    g.beginPath()
    g.moveTo(0, s * 0.44)
    g.quadraticCurveTo(k * s * 0.6, 0, k * s, -s * 0.3)
    g.stroke()
  }
  petalPath(g, s)
  g.strokeStyle = 'rgba(214,110,145,0.35)'
  g.lineWidth = Math.max(0.6, s * 0.015)
  g.stroke()
}

function canvasOf(size, draw) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  g.translate(size / 2, size / 2)
  draw(g)
  return c
}

const drawPetal = (colors) => canvasOf(64, (g) => paintPetal(g, 56, colors))

// Bông 5 cánh: cánh xoay quanh tâm, nhụy hồng đậm và các sợi nhị đầu vàng.
const drawBlossom = (colors) => canvasOf(96, (g) => {
  for (let i = 0; i < 5; i++) {
    g.save()
    g.rotate((i * TAU) / 5)
    g.translate(0, -21)
    paintPetal(g, 42, colors)
    g.restore()
  }
  const core = g.createRadialGradient(0, 0, 0, 0, 0, 12)
  core.addColorStop(0, '#d94f7f')
  core.addColorStop(1, 'rgba(247,163,191,0)')
  g.fillStyle = core
  g.beginPath()
  g.arc(0, 0, 12, 0, TAU)
  g.fill()
  for (let i = 0; i < 12; i++) {
    const a = (i * TAU) / 12 + rand(-0.1, 0.1)
    const r = rand(10, 17)
    g.strokeStyle = 'rgba(214,90,130,0.7)'
    g.lineWidth = 0.9
    g.beginPath()
    g.moveTo(0, 0)
    g.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    g.stroke()
    g.fillStyle = '#f3c35a'
    g.beginPath()
    g.arc(Math.cos(a) * r, Math.sin(a) * r, 1.6, 0, TAU)
    g.fill()
  }
})

// Bản nhòe dùng cho cánh ở rất gần hoặc rất xa (độ sâu trường ảnh). Trình duyệt không có ctx.filter thì dùng bản nét.
function withBlur(sharp) {
  const c = document.createElement('canvas')
  c.width = sharp.width
  c.height = sharp.height
  const g = c.getContext('2d')
  if (!('filter' in g)) return { sharp, blur: sharp }
  g.filter = `blur(${sharp.width / 24}px)`
  g.drawImage(sharp, 0, 0)
  return { sharp, blur: c }
}

// Điểm đậu sát mép lá thư: một phần cánh nằm khuất sau thư nên trông như rải quanh lá thư.
function around(r) {
  const e = Math.random()
  if (e < 0.3) return { x: rand(r.left, r.right), y: r.bottom + rand(-6, 18) }
  if (e < 0.5) return { x: rand(r.left, r.right), y: r.top - rand(-6, 16) }
  return Math.random() < 0.5
    ? { x: r.left - rand(-6, 22), y: rand(r.top, r.bottom) }
    : { x: r.right + rand(-6, 22), y: rand(r.top, r.bottom) }
}

export function createSakura(canvas) {
  const ctx = canvas.getContext('2d')
  const petals = PALETTE.map((c) => withBlur(drawPetal(c)))
  const blossoms = PALETTE.slice(0, 3).map((c) => withBlur(drawBlossom(c)))
  const parts = []
  const resting = []
  let W = innerWidth
  let H = innerHeight
  let dpr = 1
  let ambient = 0
  let px = -1e4
  let py = -1e4
  let mx = 0

  // Màn hình hẹp thì cánh nhỏ lại một chút.
  const scale = () => Math.min(1, 0.6 + W / 2400)

  function make(x, y, blossomChance, props) {
    if (parts.length >= MAX_PARTS) return null
    // Độ sâu z: nhiều cánh ở xa (nhỏ), ít cánh ở gần (to, nhòe).
    const z = 0.55 + Math.random() ** 1.25 * 1.1
    const blossom = Math.random() < blossomChance
    const p = {
      x, y, vx: 0, vy: 0, z, blossom,
      sprite: pick(blossom ? blossoms : petals),
      size: (blossom ? rand(25, 39) : rand(15, 24)) * z * scale(),
      rot: rand(0, TAU), spin: rand(-1.6, 1.6), fx: rand(1.2, 3.2), fy: rand(0.6, 1.6), ph: rand(0, TAU),
      fall: rand(38, 70) * (0.6 + z * 0.5), sway: rand(15, 40), mode: 'fall', age: 0,
      ...props,
    }
    parts.push(p)
    return p
  }

  // Gió nền nhẹ cộng các cơn gió mạnh thỉnh thoảng thổi qua.
  const gust = (t) => 18 + 30 * Math.sin(t * 0.21) + 55 * Math.max(0, Math.sin(t * 0.53)) ** 3 * Math.sin(t * 0.11 + 1)

  function wake(p, dx, dy, d) {
    p.mode = 'fall'
    p.vx = (dx / d) * rand(250, 450)
    p.vy = -rand(120, 260)
    p.spin = rand(-4, 4)
    const i = resting.indexOf(p)
    if (i >= 0) resting.splice(i, 1)
  }

  function step(p, t, dt, obstacle, wind) {
    p.age += dt
    const dx = p.x - px
    const dy = p.y - py
    const d = Math.hypot(dx, dy) || 1

    if (p.mode === 'rest') {
      if (d < 70) wake(p, dx, dy, d) // chạm tay/chuột vào thì cánh bị thổi bay lên
      return
    }
    if (p.mode === 'curl') {
      // Bay theo hướng xoay dần: vòng cung xoắn lại, chỉ trong dải hai bên màn hình.
      const band = Math.max(0.12 * W, (W - 700) / 2 - 30)
      p.heading += p.curl * dt
      if (p.left ? p.x > band && Math.cos(p.heading) > 0 : p.x < W - band && Math.cos(p.heading) < 0) p.heading += (p.left ? -3 : 3) * dt
      p.speed *= 1 - 0.12 * dt
      p.curl *= 1 + 0.08 * dt
      p.vx = Math.cos(p.heading) * p.speed + wind * 0.3
      p.vy = Math.sin(p.heading) * p.speed
      if (p.age > p.life) p.mode = 'fall'
    } else if (p.mode === 'home') {
      // Lượn về điểm đậu quanh lá thư rồi nằm yên.
      const k = Math.min(1, 2.5 * dt)
      p.x += (p.tx - p.x) * k
      p.y += (p.ty - p.y) * k
      p.spin *= 1 - Math.min(1, 2 * dt)
      p.rot += p.spin * dt
      if (Math.abs(p.tx - p.x) + Math.abs(p.ty - p.y) < 2) {
        p.mode = 'rest'
        resting.push(p)
        if (resting.length > REST_MAX) { const old = resting[0]; wake(old, rand(-1, 1), -1, 1) }
      }
      return
    } else {
      // Rơi: vận tốc dần về gió + đung đưa, tốc độ rơi theo độ sâu; vận tốc ban đầu lớn (khi bung ra) tự chậm lại.
      const k = Math.min(1, 1.4 * dt)
      p.vx += (wind * (0.5 + p.z * 0.4) + Math.sin(t * 0.9 + p.ph) * p.sway - p.vx) * k
      p.vy += (p.fall - p.vy) * k
      if (d < 120) {
        // Chuột/tay đi qua: cánh bị đẩy ra và xoáy theo.
        const f = (1 - d / 120) * 1400 * dt
        p.vx += (dx / d) * f - (dy / d) * f * 0.6
        p.vy += (dy / d) * f + (dx / d) * f * 0.6
      }
      if (obstacle && p.x > obstacle.left - 10 && p.x < obstacle.right + 10 && p.y > obstacle.top - 40 && p.y < obstacle.bottom) {
        p.vx += (p.x < (obstacle.left + obstacle.right) / 2 ? -1 : 1) * 700 * dt // trượt sang hai bên lá thư
      }
      if (p.target && p.age > p.homeAt) { p.mode = 'home'; p.tx = p.target.x; p.ty = p.target.y }
    }
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.rot += p.spin * dt * (1 + Math.abs(p.vx) / 300)
  }

  function draw(p, t) {
    const rest = p.mode === 'rest' || p.mode === 'home'
    // Lật cánh như đang xoay trong không khí; khi đậu thì nằm gần như phẳng, chỉ rung rất nhẹ.
    const sx = rest ? 1 : Math.cos(t * p.fx + p.ph)
    const sy = rest ? 0.9 : 0.55 + 0.45 * Math.abs(Math.sin(t * p.fy + p.ph))
    const rot = rest ? p.rot + Math.sin(t * 1.3 + p.ph) * 0.06 : p.rot
    const blurry = p.z > 1.35 || p.z < 0.62
    ctx.globalAlpha = (p.z < 0.62 ? 0.6 : 0.95) * (0.75 + 0.25 * Math.abs(sx))
    const x = p.x + mx * 40 * (p.z - 1) // lệch theo chuột: cánh gần lệch nhiều hơn cánh xa
    const c = Math.cos(rot)
    const s = Math.sin(rot)
    ctx.setTransform(dpr * c * sx, dpr * s * sx, -dpr * s * sy, dpr * c * sy, dpr * x, dpr * p.y)
    ctx.drawImage(blurry ? p.sprite.blur : p.sprite.sharp, -p.size / 2, -p.size / 2, p.size, p.size)
  }

  return {
    resize(nextDpr) {
      W = innerWidth
      H = innerHeight
      dpr = nextDpr
      canvas.width = W * dpr
      canvas.height = H * dpr
    },
    setAmbient(n) { ambient = n },
    // Lấp đầy màn hình ngay lúc vào trang.
    fill() { for (let i = 0; i < ambient; i++) make(rand(0, W), rand(-0.3 * H, H), 0.15, { ambient: true }) },
    pointer(x, y) { px = x; py = y; mx = x / W - 0.5 },

    // Một chùm cánh xoáy ra từ mép trái/phải.
    curl(left, n) {
      const y = rand(0.5, 1) * H
      const heading = rand(-1.3, -0.8)
      for (let i = 0; i < n; i++) {
        make(left ? -15 - i * 12 : W + 15 + i * 12, y + i * 14, 0.25, {
          mode: 'curl', left, heading: (left ? heading : Math.PI - heading) + rand(-0.12, 0.12),
          speed: rand(110, 170), curl: (left ? -1 : 1) * rand(0.9, 1.6), life: rand(4, 7),
        })
      }
    },
    // Hoa anh đào tỏa ra từ hai bên.
    burstSides(n) {
      for (let i = 0; i < n; i++) {
        const left = i % 2 === 0
        make(left ? -10 : W + 10, rand(0.3, 0.85) * H, 0.3, { vx: (left ? 1 : -1) * rand(350, 850), vy: rand(-520, -80), spin: rand(-5, 5) })
      }
    },
    // Bung ra theo mọi hướng từ một điểm.
    burstFrom(x, y, n) {
      for (let i = 0; i < n; i++) {
        const a = rand(0, TAU)
        const v = rand(200, 650)
        make(x + rand(-30, 30), y + rand(-30, 30), 0.3, { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 150, spin: rand(-5, 5) })
      }
    },
    // Túi phun hoa: bay vút lên, một nửa lượn về đậu quanh lá thư, nửa còn lại rơi xuống né lá thư.
    spray(bag, letter, n) {
      for (let i = 0; i < n; i++) {
        const a = rand(-1.95, -0.9)
        const v = rand(550, 950)
        const settle = i % 2 === 0
        make(bag.left + bag.width * rand(0.25, 0.7), bag.top + bag.height * 0.55, 0.4, {
          vx: Math.cos(a) * v, vy: Math.sin(a) * v, spin: rand(-6, 6),
          ...(settle && { target: around(letter), homeAt: rand(0.7, 1.2) }),
        })
      }
    },

    frame(t, dt, obstacle) {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const wind = gust(t)
      let amb = 0
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]
        step(p, t, dt, obstacle, wind)
        const gone = p.y > H + 60 || p.x < -140 || p.x > W + 140 || p.y < -H
        if (gone && p.mode !== 'curl') { parts[i] = parts[parts.length - 1]; parts.pop(); continue }
        if (gone && p.age > 2) { parts[i] = parts[parts.length - 1]; parts.pop(); continue }
        if (p.ambient) amb++
      }
      for (let i = amb; i < Math.min(ambient, amb + 3); i++) make(rand(-40, W + 40), rand(-60, -10), 0.15, { ambient: true })
      // Vẽ cánh xa trước, cánh gần sau để chồng lớp đúng chiều sâu.
      for (const p of parts) if (p.z < 1) draw(p, t)
      for (const p of parts) if (p.z >= 1) draw(p, t)
      ctx.globalAlpha = 1
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    },
  }
}
