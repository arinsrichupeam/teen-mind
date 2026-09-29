/** Shared LIFF page background. Use `blur` on screens that previously used BG_TEEN_MIND_16-9_2.
 *  Pinned to the viewport (`fixed`) so tall scrollable pages don't stretch/crop the 16:9 art.
 */
export function LiffPageBg({ blur = false }: { blur?: boolean }) {
  return (
    <div
      aria-hidden
      className={
        blur
          ? "pointer-events-none fixed inset-0 -z-10 overflow-hidden blur-[2px] scale-105"
          : "pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      }
    >
      <picture className="block h-full w-full">
        <source srcSet="/image/BG_TEEN_MIND_16-9.webp" type="image/webp" />
        <img
          alt=""
          className="h-full w-full object-cover object-center"
          decoding="async"
          fetchPriority="low"
          src="/image/BG_TEEN_MIND_16-9.jpg"
        />
      </picture>
    </div>
  );
}
