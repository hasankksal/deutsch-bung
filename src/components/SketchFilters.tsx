// SVG filters that turn plain CSS borders into pencil lines: a little wobble (displacement by
// low-frequency noise) and graphite grain (high-frequency noise punching tiny gaps). Three seeds
// are swapped by the "boil" animation so lines tremble like frames of a hand-drawn film.

const SEEDS = [3, 11, 23];

export function SketchFilters() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" className="pointer-events-none absolute">
      <defs>
        {SEEDS.map((seed, i) => (
          <filter key={seed} id={`pencil-${i + 1}`} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="2" seed={seed} result="warp" />
            <feDisplacementMap in="SourceGraphic" in2="warp" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="wobbly" />
            <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="1" seed={seed + 40} result="grain" />
            <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.5 1.55" result="holes" />
            <feComposite in="wobbly" in2="holes" operator="in" />
          </filter>
        ))}
        {/* stronger, slower wobble for hatching over large areas */}
        <filter id="pencil-rough" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="7" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="6" xChannelSelector="R" yChannelSelector="G" result="wobbly" />
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="31" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.8 1.6" result="holes" />
          <feComposite in="wobbly" in2="holes" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}
