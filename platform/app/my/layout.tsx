import Link from "next/link";

export default function MyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <nav className="bottomNav" aria-label="My ApuDa navigation">
        <Link href="/my"><span>⌂</span><small>오늘</small></Link>
        <Link href="/my/record" className="recordNav"><span>＋</span><small>기록</small></Link>
        <Link href="/my/timeline"><span>↗</span><small>건강</small></Link>
        <Link href="/my/ai"><span>✦</span><small>ApuDa AI</small></Link>
        <Link href="/onboarding"><span>MY</span><small>프로필</small></Link>
      </nav>
    </>
  );
}
