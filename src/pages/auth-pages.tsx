import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";

import authFooterIllustration from "../assets/auth-footer-illustration.png";
import { useAuth } from "../lib/auth";
import { formatIndianPhoneDisplay, normalizeIndianPhone } from "../lib/phone";
import { useToast } from "../lib/toast";
import { Button, ButtonLink, Card, Field, InlineNotice, Input, PageHeader } from "../components/ui";

const requestOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid Indian mobile number")
    .max(20, "Enter a valid Indian mobile number")
    .transform((value, context) => {
      const normalized = normalizeIndianPhone(value);
      if (!normalized) {
        context.addIssue({
          code: "custom",
          message: "Enter a valid Indian mobile number"
        });
        return z.NEVER;
      }
      return normalized;
    })
});

const verifyOtpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits")
});

type RequestOtpValues = z.infer<typeof requestOtpSchema>;
type VerifyOtpValues = z.infer<typeof verifyOtpSchema>;

function formatPhoneInputValue(value: string) {
  const normalized = normalizeIndianPhone(value);
  if (!normalized) return value;
  const nationalNumber = normalized.slice(3);
  return `${nationalNumber.slice(0, 5)} ${nationalNumber.slice(5)}`;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, isLoading, requestOtp, pendingPhone } = useAuth();
  const { pushToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RequestOtpValues>({
    resolver: zodResolver(requestOtpSchema),
    defaultValues: {
      phone: pendingPhone ? formatPhoneInputValue(pendingPhone) : ""
    }
  });

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    void navigate(currentUser?.eligibility.eligible ? "/dashboard" : "/profile", { replace: true });
  }, [currentUser?.eligibility.eligible, isAuthenticated, isLoading, navigate]);

  return (
    <div className="auth-kin-page">
      <header className="auth-kin-header">
        <Link className="auth-kin-brand" to="/">
          Shared Living OS
        </Link>
        <span>Secure Verification</span>
      </header>

      <main className="auth-kin-main">
        <section className="auth-kin-shell" aria-labelledby="login-title">
          <div className="auth-kin-intro">
            <div className="auth-kin-icon" aria-hidden="true">
              <span className="material-symbols-outlined">verified_user</span>
            </div>
            <p>Phone verification</p>
            <h1 id="login-title">Start your shared living journey</h1>
            <span>Verify your number to connect with real people and avoid spam or fake listings.</span>
          </div>

          <div className="auth-kin-card">
            {pendingPhone ? (
              <InlineNotice tone="info">
                A recent OTP request for {formatIndianPhoneDisplay(pendingPhone)} is saved here. You can request a fresh code or
                continue to verification.
              </InlineNotice>
            ) : null}

            <form
              className="auth-kin-form"
              onSubmit={handleSubmit(async (values) => {
                try {
                  const result = await requestOtp(values.phone);
                  pushToast("OTP sent. Continue to verification.", "success");
                  if (result.devOtp) {
                    pushToast(`Dev OTP: ${result.devOtp}`, "info");
                  }
                  navigate("/auth/verify");
                } catch (error) {
                  const message = error instanceof Error ? error.message : "Unable to request OTP";
                  pushToast(message, "error");
                }
              })}
            >
              <div className="auth-kin-field">
                <label htmlFor="phone">Mobile Number</label>
                <div className={`auth-kin-phone-input${errors.phone ? " auth-kin-phone-input-error" : ""}`}>
                  <span>+91</span>
                  <input
                    id="phone"
                    inputMode="tel"
                    maxLength={11}
                    placeholder="00000 00000"
                    type="tel"
                    autoComplete="tel-national"
                    aria-invalid={errors.phone ? "true" : "false"}
                    {...register("phone")}
                  />
                </div>
                {errors.phone?.message ? (
                  <p className="auth-kin-error">{errors.phone.message}</p>
                ) : (
                  <p className="auth-kin-hint">
                    <span className="material-symbols-outlined" aria-hidden="true">
                      info
                    </span>
                    We'll send a one-time code to verify your number.
                  </p>
                )}
              </div>

              <div className="auth-kin-actions">
                <button className="auth-kin-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Sending OTP..." : "Continue with OTP"}
                  <span className="material-symbols-outlined" aria-hidden="true">
                    arrow_forward
                  </span>
                </button>
                <p>Next: Enter the verification code we send you.</p>
                {pendingPhone ? (
                  <Link className="auth-kin-secondary-link" to="/auth/verify">
                    Continue saved verification
                  </Link>
                ) : null}
                <Link className="auth-kin-explore" to="/explore">
                  Explore listings first
                </Link>
              </div>
            </form>

            <div className="auth-kin-trust">
              <article>
                <span className="material-symbols-outlined auth-kin-amber" aria-hidden="true">
                  shield
                </span>
                <p>No calls or unnecessary messages. Used only for verification and account security.</p>
              </article>
              <article>
                <span className="material-symbols-outlined" aria-hidden="true">
                  group
                </span>
                <p>This helps us maintain a trusted shared living community.</p>
              </article>
              <article className="auth-kin-muted-note">
                <span className="material-symbols-outlined" aria-hidden="true">
                  stay_primary_portrait
                </span>
                <p>You'll stay signed in on this device.</p>
              </article>
            </div>
          </div>

          <div className="auth-kin-illustration">
            <img src={authFooterIllustration} alt="Shared living buildings illustration" />
          </div>
        </section>
      </main>

      <footer className="auth-kin-footer">
        <Link className="auth-kin-brand" to="/">
          Shared Living OS
        </Link>
        <p>© 2026 Shared Living OS. Structured living for the modern professional.</p>
        <div>
          <Link to="/explore">Help Center</Link>
          <Link to="/">Terms</Link>
        </div>
      </footer>
    </div>
  );
}

export function VerifyPage() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, isLoading, pendingPhone, requestOtp, setPendingPhone, verifyOtp } = useAuth();
  const { pushToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<VerifyOtpValues>({
    resolver: zodResolver(verifyOtpSchema)
  });

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    void navigate(currentUser?.eligibility.eligible ? "/dashboard" : "/profile", { replace: true });
  }, [currentUser?.eligibility.eligible, isAuthenticated, isLoading, navigate]);

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <PageHeader
          eyebrow="Verify OTP"
          title="Enter the code"
          description={pendingPhone ? `We sent a code to ${formatIndianPhoneDisplay(pendingPhone)}.` : "Request an OTP first, then come back here to verify it."}
        />

        {!pendingPhone ? (
          <InlineNotice tone="warning">
            There is no pending phone number in this browser session. Request a fresh OTP to continue.
          </InlineNotice>
        ) : null}

        <form
          className="form-grid"
          onSubmit={handleSubmit(async (values) => {
            if (!pendingPhone) {
              pushToast("Request an OTP before verifying.", "error");
              return;
            }

            try {
              const me = await verifyOtp(pendingPhone, values.otp);
              pushToast("You are signed in.", "success");
              navigate(me.eligibility.eligible ? "/dashboard" : "/profile");
            } catch (error) {
              const message = error instanceof Error ? error.message : "Unable to verify OTP";
              pushToast(message, "error");
            }
          })}
        >
          <Field
            label="OTP"
            hint="Enter the 6-digit OTP. If the code has expired, request a new one."
            error={errors.otp?.message}
          >
            <Input inputMode="numeric" maxLength={6} placeholder="123456" {...register("otp")} />
          </Field>

          <div className="row-actions">
            <Button type="submit" disabled={isSubmitting || !pendingPhone}>
              {isSubmitting ? "Verifying..." : "Verify OTP"}
            </Button>
            <Button
              tone="tertiary"
              type="button"
              onClick={() => {
                setPendingPhone("");
                void navigate("/auth/login");
              }}
            >
              Change number
            </Button>
            <Button
              tone="secondary"
              type="button"
              onClick={() => {
                if (!pendingPhone) {
                  pushToast("Request an OTP first.", "error");
                  return;
                }

                void requestOtp(pendingPhone)
                  .then((result) => {
                    pushToast(result.devOtp ? `New dev OTP: ${result.devOtp}` : "OTP resent", "info");
                  })
                  .catch((error: unknown) => {
                    const message = error instanceof Error ? error.message : "Unable to resend OTP";
                    pushToast(message, "error");
                  });
              }}
            >
              Resend OTP
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
