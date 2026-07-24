import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Gauge,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";

import { canManage, requireAppContext } from "@/lib/auth/context";

const metrics = [
  {
    label: "Practice completed",
    value: "24",
    detail: "12 this week",
    icon: CheckCircle2,
  },
  {
    label: "Evidence score",
    value: "72",
    detail: "+6 over 30 days",
    icon: TrendingUp,
  },
  {
    label: "Reps on track",
    value: "6 / 8",
    detail: "2 need attention",
    icon: Users,
  },
  {
    label: "Certification ready",
    value: "3",
    detail: "Awaiting validation",
    icon: Gauge,
  },
];

export default async function Dashboard() {
  const context = await requireAppContext();
  const manager = canManage(context.role);
  const firstName = context.user.displayName.split(" ")[0];

  if (!manager) {
    return (
      <>
        <header className="page-header">
          <div>
            <span className="eyebrow">Your readiness plan</span>
            <h1>Ready for your next conversation, {firstName}?</h1>
            <p className="page-lead">
              Practice the moments your manager assigned and keep building
              evidence across the skills that matter.
            </p>
          </div>
          <Link className="button" href="/app/practice">
            Start practice <ArrowRight size={16} />
          </Link>
        </header>
        <section className="panel action-hero">
          <span className="status-pill medium">Due Friday · Medium</span>
          <h2>Discovery: quantify business impact</h2>
          <p>
            Practice moving from workflow symptoms to measurable consequences
            with Jordan Lee, VP of Sales Operations.
          </p>
          <Link href="/app/practice/demo" className="button">
            Begin assigned drill
          </Link>
        </section>
      </>
    );
  }

  return (
    <>
      <header className="page-header">
        <div>
          <span className="eyebrow">Manager workspace</span>
          <h1>Good morning, {firstName}.</h1>
          <p className="page-lead">
            Three coaching decisions will have the biggest impact on readiness
            this week.
          </p>
        </div>
        <div className="header-actions">
          <Link className="button-secondary" href="/app/scenarios/new">
            New scenario
          </Link>
          <Link className="button" href="/app/assignments">
            Assign practice
          </Link>
        </div>
      </header>

      {context.demo && (
        <div className="demo-banner">
          <Sparkles size={16} />
          <span>
            <strong>Demonstration workspace.</strong> These metrics show the
            intended manager experience; completed hosted sessions use persistent
            data.
          </span>
        </div>
      )}

      <section className="metric-grid" aria-label="Team overview">
        {metrics.map(({ label, value, detail, icon: Icon }) => (
          <article className="metric-card" key={label}>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{detail}</small>
            </div>
            <div className="metric-icon">
              <Icon size={19} />
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <div className="space-y">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Coaching inbox</span>
              <h2>What needs your attention</h2>
            </div>
            <Link href="/app/team">View all <ChevronRight size={15} /></Link>
          </div>
          <article className="panel coaching-item urgent">
            <div className="priority-icon"><AlertTriangle size={20} /></div>
            <div>
              <div className="item-topline">
                <span className="status-pill urgent">High priority</span>
                <small>8 minutes ago</small>
              </div>
              <h3>Review an unsupported product claim</h3>
              <p>
                Maya positioned CRM replacement before investigating Jordan’s
                concern about administrative work. AI confidence: 62%.
              </p>
              <div className="evidence-preview">
                <strong>Transcript · S-06</strong>
                “Our platform replaces the manual work your CRM cannot handle.”
              </div>
            </div>
            <Link href="/app/sessions/demo" className="button-secondary">
              Review evidence
            </Link>
          </article>
          <article className="panel coaching-item">
            <div className="priority-icon teal"><Target size={20} /></div>
            <div>
              <div className="item-topline">
                <span className="status-pill medium">Team pattern</span>
                <small>6 reps affected</small>
              </div>
              <h3>Reps stop at symptoms instead of business impact</h3>
              <p>
                The team identifies workflow friction but misses decision,
                revenue, and operating consequences in 41% of attempts.
              </p>
            </div>
            <Link href="/app/assignments" className="button-secondary">
              Assign team drill
            </Link>
          </article>
          <article className="panel coaching-item">
            <div className="priority-icon green"><CheckCircle2 size={20} /></div>
            <div>
              <div className="item-topline">
                <span className="status-pill ready">Ready to validate</span>
                <small>3 reps</small>
              </div>
              <h3>Discovery certification evidence is complete</h3>
              <p>
                Three reps passed two different scenarios above 80 with no
                critical mistakes. Manager validation is the final step.
              </p>
            </div>
            <Link href="/app/analytics" className="button-secondary">
              Validate cohort
            </Link>
          </article>
        </div>

        <aside className="space-y">
          <section className="panel readiness-panel">
            <div className="section-heading compact">
              <div>
                <span className="eyebrow">Team readiness</span>
                <h2>This week</h2>
              </div>
              <span className="score-badge">74%</span>
            </div>
            <div className="readiness-bar"><span style={{ width: "74%" }} /></div>
            {[
              ["Opening and agenda", 86],
              ["Question quality", 78],
              ["Pain discovery", 73],
              ["Business impact", 54],
              ["Next-step control", 69],
            ].map(([skill, score]) => (
              <div className="skill-row" key={skill}>
                <span>{skill}</span>
                <div><i style={{ width: `${score}%` }} /></div>
                <strong>{score}</strong>
              </div>
            ))}
          </section>
          <section className="panel upcoming-panel">
            <span className="eyebrow">Upcoming</span>
            <h2>Manager cadence</h2>
            <div className="calendar-row">
              <CalendarClock size={19} />
              <span>
                <strong>Friday calibration</strong>
                Score one shared discovery transcript
              </span>
            </div>
            <Link href="/app/scorecards" className="text-link">
              Open calibration room <ArrowRight size={14} />
            </Link>
          </section>
        </aside>
      </section>
    </>
  );
}
