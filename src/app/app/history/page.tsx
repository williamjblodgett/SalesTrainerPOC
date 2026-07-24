import Link from "next/link";

export default function HistoryPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <span className="eyebrow">Practice history</span>
          <h1>Your completed conversations.</h1>
          <p className="page-lead">
            Revisit transcript evidence, improvements, and assigned follow-up
            drills.
          </p>
        </div>
      </header>
      <section className="panel empty-state">
        <h2>Your first completed session will appear here.</h2>
        <p>Start the Northstar discovery scenario to create a scorecard.</p>
        <Link href="/app/practice/demo" className="button">
          Start practice
        </Link>
      </section>
    </>
  );
}
