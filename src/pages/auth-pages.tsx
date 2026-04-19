import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { Button, ButtonLink, Card, Field, InlineNotice, Input, PageHeader } from "../components/ui";

const requestOtpSchema = z.object({
  phone: z.string().min(8, "Enter a valid phone number").max(20, "Enter a valid phone number")
});

const verifyOtpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits")
});

type RequestOtpValues = z.infer<typeof requestOtpSchema>;
type VerifyOtpValues = z.infer<typeof verifyOtpSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { requestOtp, pendingPhone } = useAuth();
  const { pushToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RequestOtpValues>({
    resolver: zodResolver(requestOtpSchema),
    defaultValues: {
      phone: pendingPhone
    }
  });

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <PageHeader
          eyebrow="Phone OTP login"
          title="Sign in to Shared Living OS"
          description="Use your phone number to start the MVP flow. We’ll use OTP verification and then restore your account session."
        />

        <form
          className="form-grid"
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
          <Field
            label="Phone number"
            hint="Use the same number you’ll use for sign-in and future sessions."
            error={errors.phone?.message}
          >
            <Input placeholder="+91 99999 99999" {...register("phone")} />
          </Field>

          <div className="row-actions">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending OTP..." : "Request OTP"}
            </Button>
            <ButtonLink to="/explore" tone="secondary">
              Explore first
            </ButtonLink>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function VerifyPage() {
  const navigate = useNavigate();
  const { pendingPhone, requestOtp, verifyOtp } = useAuth();
  const { pushToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<VerifyOtpValues>({
    resolver: zodResolver(verifyOtpSchema)
  });

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <PageHeader
          eyebrow="Verify OTP"
          title="Enter the code"
          description={pendingPhone ? `We sent a code to ${pendingPhone}.` : "Request an OTP first, then come back here to verify it."}
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
