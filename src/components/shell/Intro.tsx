/**
 * Logo intro — pure CSS (no JavaScript needed, so it can never hang): the mascot pops in,
 * a ball rolls to his feet, the wordmark wipes in, then the green curtain lifts away.
 * Plays once per browser-tab visit; skipped for reduced-motion users (see globals.css).
 */
export function Intro() {
  return (
    <div id="intro" aria-hidden>
      <div className="intro-stage">
        <div className="intro-mark">
          <span className="intro-sun" />
          <img src="/brand/mascot-white.png" alt="" width={340} height={420} className="intro-mascot" />
          <span className="intro-ball" />
        </div>
        <img src="/brand/wordmark-white.png" alt="" width={445} height={34} className="intro-word" />
        <span className="intro-rule" />
      </div>
    </div>
  );
}
