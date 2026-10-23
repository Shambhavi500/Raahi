"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, MessageSquare } from "lucide-react";
import type { Act } from "@/lib/client";
import type { Role } from "@/lib/shared";
import { Button, FlowLayout, StepHeading, TopBar } from "../ui";

const fmtPhone = (d: string) => (d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d);

/** Phone number → OTP, shared by passenger, driver and operator apps. */
export function PhoneLogin({
  role,
  act,
  title,
  subtitle,
  demoPhones,
  onVerified,
  onBack,
  aside,
}: {
  role: Role;
  act: Act;
  title: string;
  subtitle: string;
  demoPhones?: { label: string; phone: string }[];
  onVerified: (r: { phone: string; id: number | null }) => void;
  onBack?: () => void;
  aside?: ReactNode;
}) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (step === "otp") codeRef.current?.focus();
  }, [step]);

  const send = async (p = phone) => {
    setBusy(true);
    const r = await act<{ phone: string; code: string }>("requestOtp", { phone: p, role });
    setBusy(false);
    if (r.ok && r.data) {
      setDemoCode(r.data.code);
      setCode("");
      setStep("otp");
      setResendIn(20);
    }
  };

  const verify = async (c: string) => {
    setBusy(true);
    const r = await act<{ phone: string; id: number | null }>("verifyOtp", { phone, role, code: c });
    setBusy(false);
    if (r.ok && r.data) onVerified(r.data);
    else setCode("");
  };

  const onCode = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    setCode(digits);
    if (digits.length === 4) verify(digits);
  };

  if (step === "phone") {
    return (
      <FlowLayout
        aside={aside}
        top={<TopBar onBack={onBack} />}
        footer={
          <Button variant="dark" size="lg" disabled={phone.length !== 10 || busy} onClick={() => send()}>
            {busy ? "Sending code…" : "Continue"} <ArrowRight size={18} />
          </Button>
        }
      >
        <StepHeading title={title} subtitle={subtitle} />
        <label className="flex items-center gap-2 rounded-2xl border-2 border-ink bg-white px-4 py-3">
          <span className="font-semibold text-black/60">+91</span>
          <span className="h-6 w-px bg-black/15" />
          <input
            autoFocus
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98765 43210"
            value={fmtPhone(phone)}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            onKeyDown={(e) => e.key === "Enter" && phone.length === 10 && send()}
            className="w-full min-w-0 bg-transparent text-xl font-semibold tracking-wide outline-none placeholder:text-black/25"
          />
        </label>
        <p className="mt-3 text-xs text-black/45">We’ll text you a 4-digit code to confirm it’s you.</p>

        {demoPhones && (
          <div className="mt-6">
            <p className="text-xs font-bold tracking-wider text-black/45 uppercase">Demo accounts</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {demoPhones.map((d) => (
                <button
                  key={d.phone}
                  onClick={() => setPhone(d.phone)}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                    phone === d.phone ? "border-ink bg-ink text-white" : "border-black/15 bg-white"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </FlowLayout>
    );
  }

  return (
    <FlowLayout aside={aside} top={<TopBar onBack={() => setStep("phone")} />}>
      <StepHeading title="Enter the code" subtitle={<>Sent to +91 {fmtPhone(phone)}</>} />

      {/* One real input under four boxes, so paste and SMS autofill both work. */}
      <label className="relative block">
        <input
          ref={codeRef}
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => onCode(e.target.value)}
          className="absolute inset-0 opacity-0"
          aria-label="4-digit code"
        />
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`grid h-16 place-items-center rounded-2xl border-2 bg-white text-2xl font-bold ${
                code.length === i ? "border-ink" : "border-black/10"
              }`}
            >
              {code[i] ?? ""}
            </div>
          ))}
        </div>
      </label>

      {demoCode && (
        <div className="animate-rise mt-6 flex items-center gap-3 rounded-2xl bg-ink p-4 text-white">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-ink">
            <MessageSquare size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold tracking-wider text-white/50 uppercase">Demo SMS · now</p>
            <p className="text-sm">
              Your Raahi code is <b className="text-brand">{demoCode}</b>
            </p>
          </div>
          <Button variant="lime" size="sm" onClick={() => onCode(demoCode)} disabled={busy}>
            Fill
          </Button>
        </div>
      )}

      <div className="mt-6 text-sm">
        {resendIn > 0 ? (
          <span className="text-black/45">Resend code in {resendIn}s</span>
        ) : (
          <button className="font-semibold underline underline-offset-4" onClick={() => send()}>
            Resend code
          </button>
        )}
      </div>
    </FlowLayout>
  );
}
