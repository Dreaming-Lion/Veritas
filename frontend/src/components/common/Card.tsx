/* =========================
 *  재사용 작은 컴포넌트들
 * ========================= */

export function Card({
  children,
  glossy,
}: {
  children: React.ReactNode;
  glossy?: boolean;
}) {
  return (
    <div className="relative rounded-3xl bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border border-white/70 shadow-[0_20px_40px_rgba(22,163,74,0.08),0_2px_8px_rgba(0,0,0,0.04)]">
      {glossy && (
        <div className="pointer-events-none absolute inset-x-3 -top-2 h-8 rounded-full bg-white/70 blur-md" />
      )}
      {children}
    </div>
  );
}

export function RoundThumb({
  src,
  size = "size-20",
  className = "",
}: {
  src: string;
  size?: string;
  className?: string;
}) {
  return (
    <div
      className={`${size} rounded-full overflow-hidden shadow-[0_12px_24px_rgba(22,163,74,0.18)] ring-2 ring-white/70 mx-auto ${className}`}
    >
      <img src={src} alt="썸네일" className="h-full w-full object-cover" />
    </div>
  );
}

export function FeatureCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="h-full flex flex-col items-center text-center p-4 sm:p-6 rounded-2xl border border-green-100/60 bg-white/90 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_16px_32px_rgba(22,163,74,0.15)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-300 cursor-pointer"
    >
      <img src={icon} alt="" className="mx-auto mb-3 h-10 w-10 sm:h-12 sm:w-12" />
      <h3 className="text-base sm:text-lg font-semibold text-green-700">{title}</h3>
      <p className="mt-1 text-sm sm:text-base text-gray-600">{children}</p>
    </div>
  );
}

export function Steps({
  items,
  className = "",
  badgeSize = "size-8",
  textSize = "text-base",
}: {
  items: string[];
  className?: string;
  badgeSize?: string;
  textSize?: string;
}) {
  return (
    <div className={`text-center ${className}`}>
      <ol className="inline-flex flex-col items-start gap-4 list-none p-0 m-0 max-w-[700px] text-gray-700 align-top">
        {items.map((t, idx) => (
          <li key={idx} className="flex items-center gap-2 sm:gap-3">
            <span
              className={`inline-flex ${badgeSize} items-center justify-center shrink-0 rounded-full text-white text-[12px] font-bold bg-gradient-to-b from-green-400 to-green-600 shadow-[0_6px_14px_rgba(22,163,74,0.25)] ring-1 ring-white/60`}
            >
              {idx + 1}
            </span>
            <span className={`${textSize}`}>{t}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Divider() {
  return <div className="my-6 sm:my-8 h-px bg-green-100/70" />;
}
