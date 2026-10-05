import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden cf-paper-pattern">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgb(15_110_86_/_16%),transparent_42%),linear-gradient(180deg,#f7f3eb_0%,#efe8da_48%,#f7f3eb_100%)]" />
      <div className="cf-hero-orb pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgb(15_110_86_/_22%),transparent_70%)] blur-2xl" />
      <div className="cf-hero-drift pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgb(196_92_38_/_18%),transparent_70%)] blur-2xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-10">
        <header className="flex items-center justify-between gap-4">
          <p className="font-display text-lg font-semibold tracking-tight text-ink">
            CreatorForge
          </p>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-muted transition hover:text-accent"
          >
            Open workspace
          </Link>
        </header>

        <section className="flex flex-1 flex-col justify-center py-16 sm:py-20">
          <p className="cf-fade-up font-display text-5xl leading-[0.95] tracking-tight text-ink sm:text-7xl md:text-8xl">
            CreatorForge
          </p>
          <h1 className="cf-fade-up-delay mt-6 max-w-2xl font-display text-3xl leading-tight text-ink sm:text-4xl">
            Forge ideas into publish-ready creator assets.
          </h1>
          <p className="cf-fade-up-delay-2 mt-5 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
            Generate content ideas, coding prompts, and Roblox game plans in one
            calm workspace built for makers.
          </p>
          <div className="cf-fade-up-delay-2 mt-10 flex flex-wrap items-center gap-3">
            <Link href="/dashboard">
              <Button size="lg">Enter dashboard</Button>
            </Link>
            <Link href="/dashboard/tools">
              <Button size="lg" variant="secondary">
                Browse tools
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
