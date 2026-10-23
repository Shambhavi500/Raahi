import Link from "next/link";
import { ArrowUpRight, Building2, Car, MonitorSmartphone, UserRound } from "lucide-react";
import ResetDemo from "@/components/ResetDemo";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-5 py-6 sm:px-8 sm:py-10">
      <header className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-ink text-brand">
            <Car size={19} />
          </span>
          <span className="text-xl font-extrabold tracking-tight">Raahi</span>
        </span>
        <ResetDemo className="bg-black/5 hover:bg-black/10" />
      </header>

      <section className="mt-10 sm:mt-14">
        <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
          Your daily commute,
          <br />
          <span className="rounded-xl bg-ink px-2 text-brand">handled.</span>
        </h1>
        <p className="mt-4 max-w-xl text-black/60 sm:text-lg">
          Subscribe to your college or office ride once. A verified fleet confirms every trip, and if your driver can’t
          come, a verified backup is sent automatically.
        </p>
      </section>

      {/* Two giant choices: ride or drive */}
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <Link
          href="/passenger"
          className="group relative flex min-h-52 flex-col justify-between rounded-[34px] bg-brand p-6 transition active:scale-[0.99] sm:min-h-60"
        >
          <span className="grid size-14 place-items-center rounded-2xl bg-ink text-brand">
            <UserRound size={26} />
          </span>
          <span>
            <span className="block text-2xl font-extrabold sm:text-3xl">Ride with Raahi</span>
            <span className="mt-1 block text-sm text-ink/70">Book your daily commute for the month</span>
          </span>
          <ArrowUpRight className="absolute top-6 right-6 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" size={28} />
        </Link>
        <Link
          href="/driver"
          className="stripes group relative flex min-h-52 flex-col justify-between rounded-[34px] bg-ink p-6 text-white transition active:scale-[0.99] sm:min-h-60"
        >
          <span className="grid size-14 place-items-center rounded-2xl bg-brand text-ink">
            <Car size={26} />
          </span>
          <span>
            <span className="block text-2xl font-extrabold sm:text-3xl">Drive with Raahi</span>
            <span className="mt-1 block text-sm text-white/60">See your rides and keep your schedule</span>
          </span>
          <ArrowUpRight className="absolute top-6 right-6 text-brand transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" size={28} />
        </Link>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2">
        <Link href="/operator" className="flex items-center gap-3 rounded-3xl border border-black/10 bg-white p-4 hover:border-black/25">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-black/5">
            <Building2 size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">Fleet operator console</span>
            <span className="block text-xs text-black/50">Confirm plans, assign drivers, watch dispatch</span>
          </span>
          <ArrowUpRight size={18} className="shrink-0" />
        </Link>
        <Link href="/demo" className="flex items-center gap-3 rounded-3xl border border-black/10 bg-white p-4 hover:border-black/25">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-black/5">
            <MonitorSmartphone size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">Demo: all three apps side by side</span>
            <span className="block text-xs text-black/50">Passenger, operator and driver on one screen</span>
          </span>
          <ArrowUpRight size={18} className="shrink-0" />
        </Link>
      </section>

      <footer className="mt-auto pt-10 text-xs text-black/40">Pilot · Pune · Runs fully on this computer</footer>
    </div>
  );
}
