import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Backdrop from './Backdrop.jsx'
import { FROM_US, WISHES, findPerson } from './names.js'

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const d = reduced ? 0 : 1
// Các bước chồng lên nhau ở giữa (cùng một ô lưới), chỉ bước hiện tại hiện ra.
const VIEW = 'invisible col-start-1 row-start-1 opacity-0'

// Tách từng chữ để lời chúc hiện ra dần như đang được viết.
const words = (text = '') => text.split('\n').map((line, l) => (
  <span key={l} className="block not-first:mt-3">
    {line.split(' ').map((w, i) => <span key={i} className="word inline-block">{w}&nbsp;</span>)}
  </span>
))
const writeLetter = (tl, letter, onDone) => tl
  .from(letter.querySelectorAll('.word'), { autoAlpha: 0, y: 14, filter: 'blur(6px)', stagger: 0.07 * d, duration: 0.7 * d, ease: 'power2.out' })
  .add(onDone)

export default function App() {
  const [name, setName] = useState('')
  const [wrong, setWrong] = useState(0)
  const [person, setPerson] = useState(null)
  const [step, setStep] = useState(0)
  const [ours, setOurs] = useState(false)
  const [bursts, setBursts] = useState(0)
  const view0 = useRef(null)
  const view1 = useRef(null)
  const view2 = useRef(null)
  const view3 = useRef(null)
  const input = useRef(null)
  const envelope = useRef(null)
  const flap = useRef(null)
  const letter = useRef(null)
  const oursButton = useRef(null)
  const shown = useRef(0)

  // Chuyển bước: cảnh cũ lao qua người xem rồi tan, cảnh mới từ sâu bên trong tiến ra.
  useLayoutEffect(() => {
    const views = [view0, view1, view2, view3].map((v) => v.current)
    const from = views[shown.current]
    const to = views[step]
    shown.current = step
    const tl = gsap.timeline()
    if (from !== to) tl.to(from, { scale: 1.3, autoAlpha: 0, filter: 'blur(12px)', duration: 0.8 * d, ease: 'power2.in' })
    // Lá thư thì rút ra từ phong bì ở phía dưới.
    const enter = step === 3 ? { y: '35vh', scale: 0.4, rotationX: 40 } : { scale: 0.75 }
    tl.fromTo(to, { ...enter, autoAlpha: 0, filter: 'blur(12px)' }, {
      y: 0, scale: 1, rotationX: 0, autoAlpha: 1, filter: 'blur(0px)', clearProps: 'filter',
      transformPerspective: 900, duration: 1.2 * d, ease: 'power3.out',
    }, from !== to ? '-=0.2' : 0.3 * d)
    if (step === 1) tl.add(() => input.current.focus())
    if (step === 2) tl.fromTo(envelope.current, { y: 160, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: d, ease: 'back.out(1.5)' }, `+=${3 * d}`)
    if (step === 3) {
      writeLetter(tl, letter.current, () => setBursts((b) => b + 1))
        .fromTo(oursButton.current, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6 * d })
    }
    return () => tl.kill()
  }, [step])

  // Lời chúc chung: lá thư lật sang trang mới rồi lại được viết ra, túi lại phun hoa.
  useLayoutEffect(() => {
    if (!ours) return
    const tl = gsap.timeline()
    tl.fromTo(letter.current, { rotationY: -90 }, { rotationY: 0, transformPerspective: 900, duration: 0.45 * d, ease: 'power2.out' })
    writeLetter(tl, letter.current, () => setBursts((b) => b + 1))
    return () => tl.kill()
  }, [ours])

  const submit = (e) => {
    e.preventDefault()
    const found = findPerson(name)
    setWrong(found ? 0 : wrong + 1)
    if (found) { setPerson(found); setStep(2) }
  }

  const openLetter = () => gsap.timeline({ onComplete: () => setStep(3) })
    .to(flap.current, { rotationX: 180, duration: 0.6 * d, ease: 'power2.inOut' })
    .to(envelope.current, { y: 30, autoAlpha: 0, duration: 0.5 * d }, '+=0.1')

  const openOurs = () => gsap.timeline({ onComplete: () => setOurs(true) })
    .to(oursButton.current, { autoAlpha: 0, duration: 0.3 * d })
    .to(letter.current, { rotationY: 90, transformPerspective: 900, duration: 0.45 * d, ease: 'power2.in' })

  return (
    <>
      <Backdrop step={step} bloom={!!person} bursts={bursts} letterRef={letter} />

      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 text-wine md:px-12">
        <span className="font-display text-lg italic">20 · 10</span>
        <span className="font-body text-sm tracking-[0.3em]">— 0{step + 1} / 04</span>
      </header>

      {/* Nội dung nằm giữa, nhích lên trên một chút để lộ phần dưới bó hoa. Phần trống để chuột/tay chạm tới bó hoa. */}
      <main className="pointer-events-none fixed inset-0 z-10 grid place-items-center overflow-hidden px-5 pt-16 pb-[12vh]">
        <div ref={view0} className={`${VIEW} glass pointer-events-auto w-full max-w-2xl text-center`}>
          <p className="eyebrow">Ngày Phụ nữ Việt Nam</p>
          <h1 className="font-display text-5xl leading-[1.05] text-balance text-wine italic md:text-7xl">
            Chúc các bạn nữ
            <span className="block text-7xl text-rose-deep not-italic md:text-8xl">20/10</span>
            vui vẻ
          </h1>
          <p className="mt-5 font-body text-xl text-wine/80 md:text-2xl">
            Một bó hồng dành tặng những người phụ nữ tuyệt vời.
          </p>
          <button type="button" onClick={() => setStep(1)} className="btn mt-8">Bắt đầu</button>
        </div>

        <form ref={view1} onSubmit={submit} className={`${VIEW} glass pointer-events-auto w-full max-w-md text-center`}>
          <p className="eyebrow">— 02</p>
          <h2 className="font-display text-3xl text-wine italic md:text-4xl">Bạn là ai nhỉ?</h2>
          <label htmlFor="name" className="mt-6 block font-body text-lg text-wine/80">
            Nhập đầy đủ tên của bạn
          </label>
          <input
            ref={input}
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
            placeholder="Tên của bạn"
            className="mt-2 w-full border-b-2 border-wine/30 bg-transparent py-2 text-center font-display text-2xl text-wine outline-none placeholder:text-wine/40 focus:border-rose-deep"
          />
          {wrong > 0 && (
            <p key={wrong} role="alert" className="mt-4 animate-shake font-display text-2xl text-rose-deep italic">
              Hông phải rùi, nhập lại đy
            </p>
          )}
          <button className="btn mt-8 w-full">Mở thiệp</button>
        </form>

        <div ref={view2} className={`${VIEW} flex size-full flex-col items-center justify-between`}>
          <p className="rounded-full border border-white/70 bg-white/25 px-5 py-2 font-body text-lg tracking-wide text-wine backdrop-blur-sm">
            Kéo để xoay bó hoa ✿
          </p>
          <button ref={envelope} type="button" onClick={openLetter} className="pointer-events-auto invisible flex flex-col items-center gap-3 opacity-0">
            <span className="envelope">
              <span ref={flap} className="flap" />
              <span className="seal">20·10</span>
              <span className="absolute inset-x-0 bottom-3 font-script text-3xl text-wine">Gửi {person}</span>
            </span>
            <span className="animate-pulse-soft rounded-full border border-white/70 bg-white/45 px-5 py-1.5 font-body text-base tracking-[0.2em] text-wine uppercase backdrop-blur-sm">
              Chạm để mở thư
            </span>
          </button>
        </div>

        <div ref={view3} className={`${VIEW} pointer-events-auto flex w-full max-w-2xl flex-col items-center`}>
          <article ref={letter} className="paper w-full text-center">
            <p className="eyebrow">{ours ? '— Từ tụi tui' : '— Gửi riêng'}</p>
            <h2 className="font-script text-5xl leading-tight text-balance text-rose-deep md:text-7xl">{ours ? 'Lời chúc từ tụi tui' : person}</h2>
            <p className={`mt-4 leading-snug text-wine ${ours ? "font-['Times_New_Roman',Times,serif] text-lg md:text-2xl" : 'font-body text-xl md:text-3xl'}`}>
              {words(ours ? FROM_US : WISHES[person])}
            </p>
            <p className="mt-6 font-script text-3xl text-wine/70">20 · 10</p>
          </article>
          <button ref={oursButton} type="button" onClick={openOurs} className="btn invisible mt-6 opacity-0">
            Lời chúc từ tụi tui
          </button>
        </div>
      </main>
    </>
  )
}
