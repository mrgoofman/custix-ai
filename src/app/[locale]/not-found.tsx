import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-6xl font-heading font-bold text-trust-blue mb-4">
        404
      </h1>
      <p className="text-xl text-slate-text mb-2">
        Seite nicht gefunden / Page Not Found
      </p>
      <p className="text-muted mb-8">
        Die gesuchte Seite existiert nicht. / The page you&apos;re looking for
        doesn&apos;t exist.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="rounded-full bg-trust-blue px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Startseite / Home
        </Link>
        <Link
          href="/kontakt"
          className="rounded-full border border-trust-blue px-6 py-3 text-sm font-semibold text-trust-blue hover:bg-blue-50 transition-colors"
        >
          Kontakt / Contact
        </Link>
      </div>
    </div>
  );
}
