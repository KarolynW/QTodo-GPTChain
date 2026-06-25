import { useEffect, useRef } from 'react'

// The matrix rain: because every terminal-themed app is legally required
// to include it. We checked. It's in the spec. Section 4.2: "Obligatory Cyberpunk Imagery."
//
// Characters: Katakana + some Latin, because The Matrix used a mix and we're
// nothing if not thorough about our intellectual plagiarism.
const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF'

export default function MatrixRain({ width = 600, height = 90, className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    // jsdom (test environment) doesn't implement canvas. Bail out gracefully.
    // The matrix rain is purely decorative; a test suite doesn't need decoration.
    if (!ctx) return

    const FONT_SIZE = 13
    const cols = Math.floor(canvas.width / FONT_SIZE)

    // Each column starts at a random height so it doesn't look like a waterfall
    // that just got turned on. Nature's random. Ours is seedable. We chose random.
    const drops = Array.from({ length: cols }, () => Math.floor(Math.random() * -50))

    // Each column gets a speed between 0.3 and 1.0 ticks per frame.
    // Slowness is a feature. It builds suspense before your grocery list timestamp.
    const speeds = Array.from({ length: cols }, () => 0.3 + Math.random() * 0.7)
    const fractional = new Float32Array(cols)

    const draw = () => {
      // Semi-transparent black overlay creates the fading trail effect.
      // This is literally just CSS opacity on a black rectangle, but it
      // sounds better when called "persistence of vision simulation."
      ctx.fillStyle = 'rgba(0, 0, 0, 0.07)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = `${FONT_SIZE}px monospace`

      for (let i = 0; i < cols; i++) {
        fractional[i] += speeds[i]
        if (fractional[i] < 1) continue
        fractional[i] -= 1

        const char = CHARS[Math.floor(Math.random() * CHARS.length)]
        const x = i * FONT_SIZE
        const y = drops[i] * FONT_SIZE

        // The leading character is bright white; trailing chars fade to green.
        // This matches the movie. This is the only thing that matches the movie.
        const isLeader = drops[i] >= 0 && Math.random() > 0.7
        ctx.fillStyle = isLeader ? '#ccffcc' : `rgba(0, 200, 60, ${0.4 + Math.random() * 0.6})`
        ctx.fillText(char, x, y)

        if (y > canvas.height && Math.random() > 0.97) {
          drops[i] = Math.floor(Math.random() * -20)
        }
        drops[i]++
      }
    }

    const id = setInterval(draw, 45)
    return () => clearInterval(id)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`opacity-30 ${className}`}
      aria-hidden="true"
    />
  )
}
