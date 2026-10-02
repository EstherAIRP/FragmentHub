import Link from "next/link";

export function AppNav() {
  return (
    <header className="appNav">
      <div className="appNavInner">
        <Link className="brand" href="/">
          <span className="brandMark">F</span>
          <span>
            <strong>FragmentHub</strong>
            <small>Private fragment workspace</small>
          </span>
        </Link>

        <nav className="navLinks" aria-label="主要導覽">
          <Link href="/">總覽</Link>
          <Link href="/fragments">Fragments</Link>
          <Link href="/fragments/new">新增</Link>
        </nav>
      </div>
    </header>
  );
}
