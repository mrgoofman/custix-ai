import { Link } from "@/i18n/navigation";

/** Brotkrumen Start / Ratgeber / (aktuelle Seite) – Gegenstück zur BreadcrumbList. */
export function Breadcrumb({
  home,
  guides,
  current,
}: {
  home: string;
  guides: string;
  current?: string;
}) {
  const sep = <span className="text-muted/60">/</span>;
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <li>
          <Link href="/" className="hover:text-navy transition-colors">
            {home}
          </Link>
        </li>
        <li aria-hidden>{sep}</li>
        <li>
          {current ? (
            <Link href="/ratgeber" className="hover:text-navy transition-colors">
              {guides}
            </Link>
          ) : (
            <span aria-current="page" className="text-navy">
              {guides}
            </span>
          )}
        </li>
        {current ? (
          <>
            <li aria-hidden>{sep}</li>
            <li className="min-w-0">
              <span aria-current="page" className="text-navy line-clamp-1">
                {current}
              </span>
            </li>
          </>
        ) : null}
      </ol>
    </nav>
  );
}
