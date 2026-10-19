import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { InertiaPlugin } from 'gsap/InertiaPlugin'
import { nextQuality } from './quality.js'
import { createSakura } from './sakura.js'

gsap.registerPlugin(Draggable, InertiaPlugin)

const BOUQUET = '/img/bouquet.webp'
const BOUQUET_HD = '/img/bouquet-hd.webp'
// depth: lớp càng gần (số lớn) càng trôi nhiều theo chuột và tiến lại gần nhanh hơn khi chuyển bước.
const EXTRAS = [
  { src: '/img/flower-big.webp', depth: 0.25, className: '-left-[8%] -top-[10%] w-[40vmin] opacity-70 blur-[3px]' },
  { src: '/img/flower-peony.webp', depth: 0.35, className: '-right-[5%] top-[10%] w-[26vmin] opacity-80 blur-[2px]' },
  { src: '/img/roses.webp', depth: 1.4, className: '-bottom-[10%] -right-[10%] w-[46vmin] blur-[5px]', front: true },
]
// Các vùng "sống" trên ảnh bó hoa (toạ độ % theo ảnh): c = tâm, r = bán kính elip, p = điểm xoay.
// bloom: bông hồng thở (phồng nhẹ, xoay rất ít quanh tâm); sway: cành nụ/cúc đung đưa quanh gốc cành.
const ALIVE = [
  { c: [48.8, 58.7], r: [9.5, 7] }, { c: [25.6, 54.9], r: [8, 6] }, { c: [38.8, 40.2], r: [9, 6.5] },
  { c: [37.5, 49.2], r: [7.5, 5.5] }, { c: [71.9, 48.7], r: [6.5, 5] }, { c: [76.9, 60], r: [6, 4.5] },
  { c: [56.9, 33.1], r: [7.5, 5.5] }, { c: [20.6, 42.6], r: [6, 5] },
  { c: [31.9, 29.8], r: [7, 6], p: [31.9, 36], sway: true }, { c: [53.8, 27.9], r: [6, 6], p: [52.5, 36], sway: true },
  { c: [71.9, 39.3], r: [6, 6], p: [65, 44.5], sway: true }, { c: [86, 60.5], r: [6, 9], p: [80, 65], sway: true },
  { c: [61, 63.4], r: [7, 6], p: [58.7, 68], sway: true }, { c: [41, 67], r: [7, 4], p: [41, 70], sway: true },
]
// Ô nhỏ chỉ chứa đúng vùng đó của ảnh (không phải bản sao cả ảnh) để tốn ít bộ nhớ đồ họa.
const alivePiece = ({ c: [cx, cy], r: [rx, ry], p = [cx, cy] }) => ({
  box: { left: `${cx - rx}%`, top: `${cy - ry}%`, width: `${2 * rx}%`, height: `${2 * ry}%` },
  img: { width: `${10000 / (2 * rx)}%`, left: `${(-(cx - rx) * 100) / (2 * rx)}%`, top: `${(-(cy - ry) * 100) / (2 * ry)}%` },
  origin: `${((p[0] - cx + rx) * 100) / (2 * rx)}% ${((p[1] - cy + ry) * 100) / (2 * ry)}%`,
})

// Bó hoa theo bước: bình thường, nhập tên, phóng to để ngắm/xoay, lùi lại sau lá thư.
// Bố cục dựng sẵn ở cỡ phóng to (ZOOM) rồi thu nhỏ lại: trình duyệt vẽ ảnh theo cỡ bố cục,
// nên lúc phóng to hoa vẫn nét đúng độ phân giải thay vì bị kéo giãn mờ.
const ZOOM = 1.75
const BOUQUET_SCALE = [1, 1, ZOOM, 1.05].map((s) => s / ZOOM)
// Hoa anh đào theo mức đồ họa 0..2.
const AMBIENT = [25, 80, 150]
const CURL_EVERY = [2.4, 0.9, 0.45] // giây giữa hai chùm xoáy ở mỗi bên
const CURL_SIZE = [2, 3, 4]
const SIDE_BURST = [30, 60, 100]
const SPRAY = [30, 60, 110]
const DPR = [1, 1.5, 2]
const rand = gsap.utils.random
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Backdrop({ step, bloom, bursts, letterRef }) {
  const root = useRef(null)
  const mainLayer = useRef(null)
  const bouquet = useRef(null)
  const sheen = useRef(null)
  const bag = useRef(null)
  const sakura = useRef(null)
  const quality = useRef(2)
  const stepNow = useRef(0)
  const tilt = useRef(4)
  const sway = useRef(null)

  useEffect(() => {
    const html = document.documentElement
    const sk = (sakura.current = createSakura(root.current.querySelector('canvas')))
    let perf = { q: matchMedia('(pointer: coarse)').matches ? 1 : 2, low: 0, high: 0, flips: 0 }
    let frames = 0
    let elapsed = 0
    const apply = () => {
      html.dataset.quality = quality.current = perf.q
      sk.resize(Math.min(devicePixelRatio, DPR[perf.q]))
      sk.setAmbient(reduced ? 0 : AMBIENT[perf.q])
    }
    apply()
    sk.fill()
    const resize = () => sk.resize(Math.min(devicePixelRatio, DPR[perf.q]))
    addEventListener('resize', resize)

    const tick = (time, deltaMs) => {
      // Khung hình trên 1 giây là do đổi tab/máy ngủ, không tính vào fps (máy yếu thật vẫn dưới mức này).
      if (deltaMs > 1000) frames = elapsed = 0
      else { frames++; elapsed += deltaMs }
      if (elapsed >= 1000) {
        const q = perf.q
        perf = nextQuality(perf, (frames * 1000) / elapsed)
        frames = elapsed = 0
        if (perf.q !== q) apply()
      }
      // Khi lá thư đang mở, cánh hoa rơi tới mép trên thì trượt sang hai bên thay vì rơi qua thư.
      const letter = stepNow.current === 3 && letterRef.current?.getBoundingClientRect()
      sk.frame(time, Math.min(deltaMs, 100) / 1000, letter)
    }
    gsap.ticker.add(tick)
    gsap.set(bag.current, { yPercent: 110 })

    // Hoa anh đào xoáy ra liên tục từ hai bên, nhịp nhanh/chậm theo mức đồ họa.
    let spawner
    const spawn = () => {
      if (!reduced) { sk.curl(true, CURL_SIZE[quality.current]); sk.curl(false, CURL_SIZE[quality.current]) }
      spawner = gsap.delayedCall(CURL_EVERY[quality.current] * rand(0.7, 1.3), spawn)
    }
    spawn()

    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const layers = gsap.utils.toArray('[data-depth]', root.current)
      const intro = { autoAlpha: 0, duration: 2, ease: 'power3.out' }
      gsap.from(gsap.utils.toArray('[data-depth] > *', root.current).filter((el) => el !== bouquet.current), { ...intro, scale: 0.9, stagger: 0.12 })
      gsap.from(bouquet.current, { ...intro, scale: BOUQUET_SCALE[0] * 0.9 })
      sway.current = gsap.fromTo(bouquet.current, { rotation: -1.2 }, { rotation: 1.2, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      // Ảnh vẫn là ảnh chụp thật, nhưng từng bông thở và từng cành rung nhẹ như đang sống.
      gsap.utils.toArray('[data-alive]', root.current).forEach((el) => {
        const swaying = el.dataset.alive === 'sway'
        const a = swaying ? rand(2.5, 4) : rand(0.8, 1.8)
        gsap.fromTo(el, { rotation: -a, scale: 1 }, {
          rotation: a, scale: swaying ? 1 : 1.035, duration: swaying ? rand(1.6, 2.8) : rand(2.4, 4),
          ease: 'sine.inOut', yoyo: true, repeat: -1, delay: rand(0, 2),
        })
      })
      const movers = layers.map((el) => ({
        depth: +el.dataset.depth,
        x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3' }),
        y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3' }),
      }))
      const tiltX = gsap.quickTo(mainLayer.current, 'rotationX', { duration: 0.8, ease: 'power3' })
      const tiltY = gsap.quickTo(mainLayer.current, 'rotationY', { duration: 0.8, ease: 'power3' })
      const lightX = gsap.quickSetter(sheen.current, '--lx', '%')
      const lightY = gsap.quickSetter(sheen.current, '--ly', '%')
      const onMove = (e) => {
        const px = e.clientX / innerWidth - 0.5
        const py = e.clientY / innerHeight - 0.5
        for (const m of movers) { m.x(px * 60 * m.depth); m.y(py * 40 * m.depth) }
        tiltY(px * tilt.current * 2)
        tiltX(-py * tilt.current * 2)
        lightX((px + 0.5) * 100)
        lightY((py + 0.5) * 100)
        sk.pointer(e.clientX, e.clientY)
      }
      addEventListener('pointermove', onMove)
      return () => removeEventListener('pointermove', onMove)
    })

    return () => {
      gsap.ticker.remove(tick)
      spawner.kill()
      removeEventListener('resize', resize)
      mm.revert()
    }
  }, [letterRef])

  // Mỗi bước "máy quay" tiến vào trong: lớp trang trí càng gần tiến càng nhanh; bó hoa phóng to theo bước.
  useEffect(() => {
    stepNow.current = step
    const d = reduced ? 0 : 1
    gsap.utils.toArray('[data-extra]', root.current).forEach((el) => {
      gsap.to(el, { z: Math.min(step, 2) * 200 * el.dataset.depth, duration: 1.6 * d, ease: 'power3.inOut' })
    })
    gsap.to(bouquet.current, { scale: BOUQUET_SCALE[step], duration: 1.8 * d, ease: 'power3.inOut' })
    if (step === 1) new Image().src = BOUQUET_HD // tải trước bản HD trong lúc người dùng nhập tên
    if (step !== 2) return

    // Bước ngắm hoa: đổi sang ảnh HD (cùng tỉ lệ nên không lệch), kéo để xoay có quán tính, nghiêng mạnh hơn.
    const img = new Image()
    img.onload = () => bouquet.current?.querySelectorAll('img').forEach((i) => { i.src = BOUQUET_HD })
    img.src = BOUQUET_HD
    tilt.current = 10
    sway.current?.pause()
    const el = bouquet.current
    el.style.pointerEvents = 'auto'
    const [drag] = Draggable.create(el, { type: 'rotation', inertia: true, cursor: 'grab', activeCursor: 'grabbing' })
    return () => {
      drag.kill()
      el.style.pointerEvents = ''
      tilt.current = 4
      gsap.to(el, { rotation: 0, duration: 1.2 * d, ease: 'power2.out', onComplete: () => sway.current?.restart() })
    }
  }, [step])

  // Nhập đúng tên: hoa anh đào tỏa ra từ hai bên.
  useEffect(() => {
    if (bloom && !reduced) sakura.current.burstSides(SIDE_BURST[quality.current])
  }, [bloom])

  // Mỗi lần mở một lá thư: cánh hoa bung ra sau thư; túi trồi lên (lần đầu), rung nhẹ rồi phun hoa anh đào.
  useEffect(() => {
    if (!bursts) return
    const tl = gsap.timeline()
    if (bursts === 1) tl.set(bag.current, { autoAlpha: 1 }).to(bag.current, { yPercent: 0, duration: reduced ? 0 : 1.2, ease: 'back.out(1.4)' })
    tl.to(bag.current.firstChild, { rotation: 2, duration: 0.08, yoyo: true, repeat: 7, transformOrigin: '30% 100%' })
      .add(() => {
        if (reduced) return
        const r = letterRef.current.getBoundingClientRect()
        sakura.current.burstFrom((r.left + r.right) / 2, (r.top + r.bottom) / 2, SIDE_BURST[quality.current] / 2)
        sakura.current.spray(bag.current.getBoundingClientRect(), r, SPRAY[quality.current])
      }, '-=0.4')
  }, [bursts, letterRef])

  const extra = (l) => (
    <div key={l.src} data-depth={l.depth} data-extra className={`extra absolute ${l.className}`}>
      <img src={l.src} alt="" className="w-full" />
    </div>
  )

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_40%,#fbe4e4_0%,#f7ede2_55%,#eedfcc_100%)] [perspective:1000px]">
      {EXTRAS.filter((l) => !l.front).map(extra)}
      <div ref={mainLayer} data-depth="0.6" className="absolute inset-0 flex items-center justify-center">
        {/* Bóng đổ mềm phía dưới, vẽ riêng nên không xoay theo bó hoa. */}
        <div className="absolute h-[62vh] w-[52vh] max-w-[80vw] translate-y-[5vh] rounded-full bg-[radial-gradient(closest-side,rgb(74_29_43/0.28),transparent)]" />
        <div ref={bouquet} className="relative shrink-0" style={{ transform: `scale(${BOUQUET_SCALE[0]})`, transformOrigin: '50% 45%' }}>
          <img src={BOUQUET} alt="" className="block max-h-[147vh] max-w-[161vw] drop-shadow-[0_3px_5px_rgba(74,29,43,0.3)]" />
          {ALIVE.map((a) => {
            const { box, img, origin } = alivePiece(a)
            return (
              <div key={a.c.join()} data-alive={a.sway ? 'sway' : 'bloom'} className="extra absolute overflow-hidden" style={{
                ...box, transformOrigin: origin,
                maskImage: 'radial-gradient(closest-side, #000 55%, transparent)', WebkitMaskImage: 'radial-gradient(closest-side, #000 55%, transparent)',
              }}>
                <img src={BOUQUET} alt="" className="absolute max-w-none" style={img} />
              </div>
            )
          })}
          {/* Ánh sáng lướt theo chuột, chỉ phủ trên phần bó hoa (mask theo chính ảnh). */}
          <div
            ref={sheen}
            className="extra absolute inset-0 mix-blend-soft-light"
            style={{
              maskImage: `url(${BOUQUET})`, maskSize: '100% 100%',
              WebkitMaskImage: `url(${BOUQUET})`, WebkitMaskSize: '100% 100%',
              background: 'radial-gradient(circle at var(--lx, 50%) var(--ly, 30%), rgb(255 255 255 / 0.85), transparent 45%)',
            }}
          />
        </div>
      </div>
      {/* Hoa anh đào: một canvas cho mọi hiệu ứng bay. */}
      <canvas className="absolute inset-0 size-full" />
      {EXTRAS.filter((l) => l.front).map(extra)}
      {/* Chỉ miệng túi: ảnh gốc bị cắt ở mép trái và dưới nên áp sát góc màn hình. */}
      <div ref={bag} className="invisible absolute bottom-0 left-0 w-[44vmin] min-w-44">
        <img src="/img/bag.webp" alt="" className="w-full" />
      </div>
    </div>
  )
}
