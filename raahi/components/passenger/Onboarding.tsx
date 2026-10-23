"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, UserRound, Users } from "lucide-react";
import type { Act } from "@/lib/client";
import type { Gender } from "@/lib/shared";
import { PhoneLogin } from "../auth/PhoneLogin";
import { Button, FlowLayout, Logo, StepHeading, TopBar } from "../ui";

type Step = "welcome" | "login" | "name" | "age" | "gender" | "women";

const GENDERS: { id: Gender; label: string }[] = [
  { id: "F", label: "Woman" },
  { id: "M", label: "Man" },
  { id: "X", label: "Non-binary" },
  { id: "U", label: "Prefer not to say" },
];

/** Welcome → phone → OTP → name → age → gender → (Women-Only verification). */
export function PassengerOnboarding({ act, onDone }: { act: Act; onDone: (id: number) => void }) {
  const [step, setStep] = useState<Step>("welcome");
  const [phone, setPhone] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [newId, setNewId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const ageNum = Number(age);
  const ageError = age !== "" && (ageNum < 18 || ageNum > 100);

  if (step === "welcome") return <Welcome onStart={() => setStep("login")} />;

  if (step === "login") {
    return (
      <PhoneLogin
        role="passenger"
        act={act}
        title="What’s your phone number?"
        subtitle="New or returning, we’ll get you in with a quick code."
        onBack={() => setStep("welcome")}
        onVerified={(r) => {
          if (r.id) onDone(r.id);
          else {
            setPhone(r.phone);
            setStep("name");
          }
        }}
      />
    );
  }

  if (step === "name") {
    return (
      <FlowLayout
        top={<TopBar onBack={() => setStep("login")} step={1} total={3} />}
        footer={
          <Button size="lg" disabled={first.trim().length < 2} onClick={() => setStep("age")}>
            Next <ArrowRight size={18} />
          </Button>
        }
      >
        <StepHeading title="What’s your name?" subtitle="Your driver only sees your first name." />
        <div className="space-y-3">
          <Field label="First name" value={first} onChange={setFirst} autoFocus autoComplete="given-name" />
          <Field label="Last name (optional)" value={last} onChange={setLast} autoComplete="family-name" />
        </div>
      </FlowLayout>
    );
  }

  if (step === "age") {
    return (
      <FlowLayout
        top={<TopBar onBack={() => setStep("name")} step={2} total={3} />}
        footer={
          <Button size="lg" disabled={!age || ageError} onClick={() => setStep("gender")}>
            Next <ArrowRight size={18} />
          </Button>
        }
      >
        <StepHeading title={`Hi ${first.trim()}! How old are you?`} subtitle="Raahi is for riders aged 18 and above." />
        <div className="flex items-end gap-3">
          <input
            autoFocus
            inputMode="numeric"
            placeholder="21"
            value={age}
            onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))}
            className={`w-32 rounded-2xl border-2 bg-white px-4 py-3 text-center text-4xl font-extrabold outline-none ${
              ageError ? "border-red-500" : "border-ink"
            }`}
          />
          <span className="pb-4 text-lg font-semibold text-black/50">years</span>
        </div>
        {ageError && (
          <p className="mt-3 text-sm text-red-600">
            {ageNum < 18 ? "Sorry, Raahi is only for riders 18 and above for now." : "Please check your age."}
          </p>
        )}
      </FlowLayout>
    );
  }

  if (step === "gender") {
    const register = async () => {
      setBusy(true);
      const name = `${first.trim()} ${last.trim()}`.trim();
      const r = await act<{ id: number }>("registerPassenger", { phone, name, age: ageNum, gender });
      setBusy(false);
      if (!r.ok || !r.data) return;
      setNewId(r.data.id);
      if (gender === "F") setStep("women");
      else onDone(r.data.id);
    };
    return (
      <FlowLayout
        top={<TopBar onBack={() => setStep("age")} step={3} total={3} />}
        footer={
          <Button size="lg" disabled={!gender || busy} onClick={register}>
            {busy ? "Creating your account…" : "Create account"} <ArrowRight size={18} />
          </Button>
        }
      >
        <StepHeading
          title="How do you identify?"
          subtitle="This only decides if you can book Women-Only rides. It’s never shown to other riders or drivers."
        />
        <div className="grid gap-2">
          {GENDERS.map((g) => (
            <button
              key={g.id}
              onClick={() => setGender(g.id)}
              className={`flex items-center justify-between rounded-2xl border-2 bg-white px-4 py-4 text-left font-semibold transition ${
                gender === g.id ? "border-ink" : "border-black/10 hover:border-black/25"
              }`}
            >
              {g.label}
              <span
                className={`grid size-6 place-items-center rounded-full border-2 ${
                  gender === g.id ? "border-ink bg-ink text-brand" : "border-black/20"
                }`}
              >
                {gender === g.id && <Check size={14} strokeWidth={3} />}
              </span>
            </button>
          ))}
        </div>
      </FlowLayout>
    );
  }

  // Women-Only verification (optional)
  const verify = async () => {
    setBusy(true);
    const r = await act("verifyWomen", { passengerId: newId });
    setBusy(false);
    if (r.ok) onDone(newId!);
  };
  return (
    <FlowLayout
      footer={
        <div className="space-y-2">
          <Button variant="lime" size="lg" disabled={busy} onClick={verify}>
            <ShieldCheck size={18} /> {busy ? "Verifying…" : "Verify now (demo)"}
          </Button>
          <Button variant="ghost" size="lg" onClick={() => onDone(newId!)}>
            Maybe later
          </Button>
        </div>
      }
    >
      <div className="animate-pop mt-10 grid size-16 place-items-center rounded-3xl bg-fuchsia-100 text-fuchsia-800">
        <ShieldCheck size={32} />
      </div>
      <StepHeading
        title="Unlock Women-Only rides"
        subtitle="A one-time check (in the real app, through DigiLocker ID). In this demo, one tap verifies you."
      />
      <ul className="space-y-3 text-sm">
        {[
          [UserRound, "Verified women drivers only"],
          [Users, "Shared rides only with other verified women"],
          [ShieldCheck, "Never switched to Standard without your say"],
        ].map(([Icon, text]) => {
          const I = Icon as typeof UserRound;
          return (
            <li key={text as string} className="flex items-center gap-3 rounded-2xl bg-white p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink text-brand">
                <I size={17} />
              </span>
              {text as string}
            </li>
          );
        })}
      </ul>
    </FlowLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  autoFocus,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block rounded-2xl border-2 border-black/10 bg-white px-4 pt-2 pb-2.5 focus-within:border-ink">
      <span className="text-xs font-semibold text-black/50">{label}</span>
      <input
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        value={value}
        maxLength={30}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full bg-transparent text-lg font-semibold outline-none"
      />
    </label>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="stripes relative flex min-h-dvh flex-col overflow-hidden bg-ink text-white">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-8 pb-6 md:max-w-lg md:justify-center">
        <Logo dark />
        {/* A little route drawing: pickup dot → drop square */}
        <svg viewBox="0 0 300 200" className="animate-rise mx-auto my-10 w-full max-w-xs" aria-hidden>
          <path
            d="M40 160 C 90 40, 200 190, 260 50"
            stroke="#d4f639"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="2 14"
          />
          <circle cx="40" cy="160" r="14" fill="#d4f639" stroke="#151618" strokeWidth="6" />
          <rect x="246" y="36" width="28" height="28" rx="6" fill="#fff" stroke="#151618" strokeWidth="6" />
        </svg>
        <div className="mt-auto md:mt-0">
          <h1 className="text-4xl leading-[1.1] font-extrabold tracking-tight">
            Your daily commute,
            <br />
            <span className="text-brand">handled.</span>
          </h1>
          <p className="mt-4 text-white/65">
            Book your college or office ride once for the month. If your driver can’t come, we send a verified backup.
          </p>
          <Button variant="lime" size="lg" className="mt-8" onClick={onStart}>
            Get started <ArrowRight size={18} />
          </Button>
          <p className="mt-4 text-center text-sm text-white/50">
            Drive with us?{" "}
            <Link href="/driver" className="font-semibold text-white underline underline-offset-4">
              Open the driver app
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
