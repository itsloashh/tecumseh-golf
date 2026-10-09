import Link from "next/link";

export default function NotFound() {
  return (
    <main className="dimples grid min-h-dvh place-items-center px-6 text-center text-cream">
      <div>
        <img src="/brand/mascot-white.png" alt="" width={340} height={420} className="mx-auto w-24" />
        <p className="label mt-6 text-flag">404 · Out of bounds</p>
        <h1 className="display display-i mt-3 text-[3.6rem] leading-[0.86] sm:text-[5rem]">That one went in the water.</h1>
        <p className="mx-auto mt-4 max-w-sm text-cream/75">We couldn't find that page. Take a drop and try again.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-flag">Back to the clubhouse</Link>
          <Link href="/shop" className="btn btn-ghost-dark">Shop</Link>
        </div>
      </div>
    </main>
  );
}
