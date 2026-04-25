import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { ListingFormWizard } from "../components/listing-form-wizard";
import { MapPicker } from "../components/map-picker";
import { MapPreview } from "../components/map-preview";
import { Badge, Button, ButtonLink, Card, EmptyState, Field, InlineNotice, Input, LoadingBlock, Modal, PageHeader, Select, Stat, Tabs, Textarea } from "../components/ui";
import { adminApi, applicationsApi, conversationsApi, listingsApi, notificationsApi, uploadsApi, usersApi, verificationApi } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import type { AdminVerificationReview, CurrentUserPayload, ListingDetailPayload, ListingRecord, NotificationRecord, VerificationRecord } from "../lib/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value?: string) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function formatDateTime(value?: string) {
  if (!value) return "Just now";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function applicationStatusTone(status: "applied" | "shortlisted" | "accepted" | "rejected") {
  if (status === "accepted") return "success";
  if (status === "shortlisted") return "primary";
  if (status === "rejected") return "danger";
  return "neutral";
}

function applicationNoticeTone(status: "applied" | "shortlisted" | "accepted" | "rejected") {
  if (status === "accepted") return "success";
  if (status === "shortlisted") return "info";
  if (status === "rejected") return "danger";
  return "info";
}

function AdminWorkspaceNav() {
  const location = useLocation();
  const items = [
    { label: "Listings", to: "/admin/listings" },
    { label: "Verifications", to: "/admin/verifications" },
    { label: "Users", to: "/admin/users" }
  ];

  return (
    <div className="admin-nav">
      {items.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <Link key={item.to} className={`admin-nav-link${isActive ? " admin-nav-link-active" : ""}`} to={item.to}>
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

const profileSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  age: z.number().min(18, "Age must be 18+").max(100, "Enter a realistic age"),
  gender: z.string().min(1, "Select a value"),
  occupation: z.string().min(2, "Enter your occupation"),
  bio: z.string().max(1000, "Keep the bio concise").optional(),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  profileImageUrl: z.string().optional()
});

const verificationSchema = z.object({
  documentType: z.enum(["aadhaar", "passport", "driving_license", "voter_id"]),
  nameOnDocument: z.string().trim().min(3, "Enter the full name shown on the document").max(160),
  documentNumberLast4: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{4}$/, "Enter the last 4 characters from the document number")
});

type ProfileValues = z.infer<typeof profileSchema>;
type VerificationValues = z.infer<typeof verificationSchema>;

function useRefreshCurrentUserQuery() {
  const { refreshCurrentUser, currentUser } = useAuth();

  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      await refreshCurrentUser();
      return currentUser;
    },
    enabled: false
  });
}

export function DashboardPage() {
  const { currentUser } = useAuth();
  const listingsQuery = useQuery({
    queryKey: ["my-listings"],
    queryFn: () => listingsApi.mine()
  });
  const applicationsQuery = useQuery({
    queryKey: ["my-applications"],
    queryFn: () => applicationsApi.mine()
  });
  const notificationsQuery = useQuery({
    queryKey: ["notifications-preview"],
    queryFn: () => notificationsApi.list(1, 5)
  });

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome${currentUser?.profile?.fullName ? `, ${currentUser.profile.fullName}` : ""}`}
        description="Your trust state, listing pipeline, applications, and communication all live here."
        actions={<ButtonLink to="/listings/new">Create listing</ButtonLink>}
      />

      <div className="stat-grid">
        <Stat label="Profile completion" value={`${currentUser?.profile?.profileCompletionScore ?? 0}%`} />
        <Stat label="Interaction status" value={currentUser?.eligibility.eligible ? "Eligible" : "Needs setup"} />
        <Stat label="My listings" value={String(listingsQuery.data?.length ?? 0)} />
        <Stat label="Applications" value={String(applicationsQuery.data?.length ?? 0)} />
      </div>

      <div className="detail-grid">
        <Card>
          <h3>Account trust state</h3>
          <p>Verification: {currentUser?.verification?.status ?? "not_submitted"}</p>
          <p>Role: {currentUser?.user.role ?? "user"}</p>
          {!currentUser?.eligibility.eligible ? (
            <InlineNotice tone="warning">
              Finish your profile and add a profile photo before applying, publishing, or chatting.
            </InlineNotice>
          ) : null}
          <div className="stack-actions">
            <ButtonLink to="/profile" tone="secondary">
              Complete profile
            </ButtonLink>
            {currentUser?.verification?.status === "verified" ? (
              <ButtonLink to="/explore">Explore listings</ButtonLink>
            ) : currentUser?.verification?.status === "pending" ? (
              <ButtonLink to="/verification">Review verification status</ButtonLink>
            ) : (
              <ButtonLink to="/verification">Start verification</ButtonLink>
            )}
          </div>
        </Card>

        <Card>
          <h3>Latest notifications</h3>
          {notificationsQuery.data?.items.length ? (
            <div className="stack-list">
              {notificationsQuery.data.items.map((notification) => (
                <div key={notification._id} className="mini-listing">
                  <div>
                    <strong>{notification.title}</strong>
                    <p>{notification.body}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No notifications yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, refreshCurrentUser } = useAuth();
  const { pushToast } = useToast();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: currentUser?.profile?.fullName ?? "",
      age: currentUser?.profile?.age ?? 21,
      gender: currentUser?.profile?.gender ?? "",
      occupation: currentUser?.profile?.occupation ?? "",
      bio: currentUser?.profile?.bio ?? "",
      email: currentUser?.user.email ?? "",
      profileImageUrl: currentUser?.profile?.profileImageUrl ?? ""
    }
  });

  useEffect(() => {
    reset({
      fullName: currentUser?.profile?.fullName ?? "",
      age: currentUser?.profile?.age ?? 21,
      gender: currentUser?.profile?.gender ?? "",
      occupation: currentUser?.profile?.occupation ?? "",
      bio: currentUser?.profile?.bio ?? "",
      email: currentUser?.user.email ?? "",
      profileImageUrl: currentUser?.profile?.profileImageUrl ?? ""
    });
  }, [currentUser, reset]);

  const missingSteps = [
    !(currentUser?.profile?.fullName ?? "").trim() ? "add your full name" : null,
    !currentUser?.profile?.occupation ? "add your occupation" : null,
    !currentUser?.profile?.gender ? "select your gender preference" : null,
    !currentUser?.eligibility.hasPhoto ? "upload a profile photo" : null,
    (currentUser?.eligibility.score ?? 0) < 70 ? "raise your profile completion above 70%" : null
  ].filter(Boolean) as string[];

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Onboarding and profile"
        title="Profile setup"
        description="This screen controls profile completion, eligibility, and the trust signals that unlock applications, chat, and listing publishing."
      />

      <div className="detail-grid">
        <Card>
          <h3>Current profile state</h3>
          <p>Completion score: {currentUser?.profile?.profileCompletionScore ?? 0}%</p>
          <p>Has photo: {currentUser?.eligibility.hasPhoto ? "Yes" : "No"}</p>
          <p>Eligible to interact: {currentUser?.eligibility.eligible ? "Yes" : "No"}</p>
          {!currentUser?.eligibility.eligible ? (
            <InlineNotice tone="warning">
              The backend requires a strong completion score and a profile image before core marketplace actions unlock.
            </InlineNotice>
          ) : (
            <InlineNotice tone="success">Your account is interaction-ready.</InlineNotice>
          )}
          {!currentUser?.eligibility.eligible && missingSteps.length ? (
            <InlineNotice tone="info">
              Next to unlock marketplace actions: {missingSteps.join(", ")}.
            </InlineNotice>
          ) : null}
          {currentUser?.eligibility.eligible ? (
            <div className="stack-actions">
              <ButtonLink to="/listings/new">Create your first listing</ButtonLink>
              <ButtonLink to="/explore" tone="secondary">
                Explore listings
              </ButtonLink>
            </div>
          ) : null}
        </Card>

        <Card>
          <form
            className="form-grid"
            onSubmit={handleSubmit(async (values) => {
              try {
                let profileImageUrl = values.profileImageUrl;

                if (photoFile) {
                  profileImageUrl = await uploadsApi.uploadFile(photoFile, "profile_photo", "profile");
                }

                const updatedUser = await usersApi.updateMe({
                  ...values,
                  profileImageUrl
                });

                await refreshCurrentUser();
                await queryClient.invalidateQueries({ queryKey: ["current-user"] });
                setPhotoFile(null);

                if (updatedUser.eligibility.eligible) {
                  pushToast("Profile updated. Your account is ready, so we’re taking you to the dashboard.", "success");
                  navigate("/dashboard");
                  return;
                }

                const remainingSteps = [
                  !updatedUser.profile?.fullName ? "full name" : null,
                  !updatedUser.profile?.occupation ? "occupation" : null,
                  !updatedUser.profile?.gender ? "gender" : null,
                  !updatedUser.eligibility.hasPhoto ? "profile photo" : null,
                  updatedUser.eligibility.score < 70 ? "completion score above 70%" : null
                ].filter(Boolean);

                pushToast(
                  remainingSteps.length
                    ? `Profile saved. Still needed: ${remainingSteps.join(", ")}.`
                    : "Profile updated.",
                  "success"
                );
              } catch (error) {
                pushToast(error instanceof Error ? error.message : "Unable to update profile", "error");
              }
            })}
          >
            <Field label="Full name" error={errors.fullName?.message}>
              <Input {...register("fullName")} />
            </Field>
            <Field label="Age" error={errors.age?.message}>
              <Input inputMode="numeric" {...register("age", { valueAsNumber: true })} />
            </Field>
            <Field label="Gender" error={errors.gender?.message}>
              <Select {...register("gender")}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non_binary">Non-binary</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </Select>
            </Field>
            <Field label="Occupation" error={errors.occupation?.message}>
              <Input {...register("occupation")} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" {...register("email")} />
            </Field>
            <Field label="Bio" error={errors.bio?.message}>
              <Textarea rows={4} {...register("bio")} />
            </Field>
            <Field label="Profile photo">
              <Input type="file" accept="image/*" onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)} />
            </Field>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save profile"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export function VerificationPage() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [frontDocumentFile, setFrontDocumentFile] = useState<File | null>(null);
  const [backDocumentFile, setBackDocumentFile] = useState<File | null>(null);
  const verificationQuery = useQuery({
    queryKey: ["my-verification"],
    queryFn: () => verificationApi.getMine()
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch
  } = useForm<VerificationValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      documentType: "aadhaar",
      nameOnDocument: "",
      documentNumberLast4: ""
    }
  });
  const documentType = watch("documentType");
  const needsBackUpload = documentType === "aadhaar" || documentType === "driving_license" || documentType === "voter_id";

  const status = verificationQuery.data?.status ?? "not_submitted";
  const resubmissionAllowedAt = verificationQuery.data?.resubmissionAllowedAt;
  const isRejectedCooldownActive =
    status === "rejected" && Boolean(resubmissionAllowedAt) && new Date(resubmissionAllowedAt as string) > new Date();
  const isFormLocked = status === "pending" || status === "verified" || isRejectedCooldownActive;

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Verification"
        title="Identity verification"
        description="Submit a supported Indian identity document so admins can review your profile more seriously before unlocking verified trust badges."
      />

      <div className="detail-grid">
        <Card>
          <h3>Current status</h3>
          <p>Status: {status}</p>
          <p>Submitted: {formatDate(verificationQuery.data?.createdAt)}</p>
          {verificationQuery.data?.documentType ? <p>Document: {formatVerificationDocumentLabel(verificationQuery.data.documentType)}</p> : null}
          {verificationQuery.data?.nameOnDocument ? <p>Name on document: {verificationQuery.data.nameOnDocument}</p> : null}
          {verificationQuery.data?.documentNumberLast4 ? <p>ID ending: •••• {verificationQuery.data.documentNumberLast4}</p> : null}
          {verificationQuery.data?.rejectionReason ? <InlineNotice tone="danger">{verificationQuery.data.rejectionReason}</InlineNotice> : null}
          {status === "verified" ? <InlineNotice tone="success">Your profile is verified.</InlineNotice> : null}
          {status === "pending" ? <InlineNotice tone="info">Your submission is awaiting admin review.</InlineNotice> : null}
          {isRejectedCooldownActive ? (
            <InlineNotice tone="warning">
              Verification remains rejected for 15 days after review. You can submit again after {formatDate(resubmissionAllowedAt)}.
            </InlineNotice>
          ) : null}
          {status === "verified" ? (
            <InlineNotice tone="info">
              Verification is complete, so no further document upload is needed right now.
            </InlineNotice>
          ) : null}
        </Card>

        <Card>
          {status === "verified" ? (
            <div className="form-grid">
              <InlineNotice tone="success">
                Your verification has already been approved. This submission form is now locked to avoid duplicate uploads.
              </InlineNotice>
              <ButtonLink to="/dashboard">Back to dashboard</ButtonLink>
            </div>
          ) : (
            <form
              className="form-grid"
              onSubmit={handleSubmit(async (values) => {
                if (!frontDocumentFile) {
                  pushToast("Upload the front side of the document first.", "error");
                  return;
                }

                if (needsBackUpload && !backDocumentFile) {
                  pushToast("Upload the back side of the document for this ID type.", "error");
                  return;
                }

                try {
                  const documentFrontUrl = await uploadsApi.uploadFile(frontDocumentFile, "kyc_document", "verification");
                  const documentBackUrl = backDocumentFile
                    ? await uploadsApi.uploadFile(backDocumentFile, "kyc_document", "verification")
                    : undefined;
                  await verificationApi.submit({
                    documentType: values.documentType,
                    nameOnDocument: values.nameOnDocument.trim(),
                    documentNumberLast4: values.documentNumberLast4.trim().toUpperCase(),
                    documentFrontUrl,
                    documentBackUrl
                  });
                  await queryClient.invalidateQueries({ queryKey: ["my-verification"] });
                  pushToast("Verification submitted.", "success");
                } catch (error) {
                  pushToast(error instanceof Error ? error.message : "Unable to submit verification", "error");
                }
              })}
            >
              <Field label="Document type" error={errors.documentType?.message}>
                <Select {...register("documentType")} disabled={isFormLocked}>
                  <option value="aadhaar">Aadhaar card</option>
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving licence</option>
                  <option value="voter_id">Voter ID</option>
                </Select>
              </Field>
              <Field
                label="Full name on document"
                hint="Enter the name exactly as it appears on the ID you are uploading."
                error={errors.nameOnDocument?.message}
              >
                <Input disabled={isFormLocked} placeholder="As shown on your ID" {...register("nameOnDocument")} />
              </Field>
              <Field
                label="Document number (last 4)"
                hint="For privacy, only enter the last 4 visible characters from the document number."
                error={errors.documentNumberLast4?.message}
              >
                <Input disabled={isFormLocked} maxLength={4} placeholder="A123" {...register("documentNumberLast4")} />
              </Field>
              <InlineNotice tone="info">
                Supported documents for this MVP are Aadhaar, passport, driving licence, and voter ID. Aadhaar, driving licence, and voter ID need both front and back uploads.
              </InlineNotice>
              <Field label="Front side document file">
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  disabled={isFormLocked}
                  onChange={(event) => setFrontDocumentFile(event.target.files?.[0] ?? null)}
                />
              </Field>
              {needsBackUpload ? (
                <Field label="Back side document file">
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    disabled={isFormLocked}
                    onChange={(event) => setBackDocumentFile(event.target.files?.[0] ?? null)}
                  />
                </Field>
              ) : null}
              <Button type="submit" disabled={isSubmitting || isFormLocked}>
                {isSubmitting
                  ? "Submitting..."
                  : status === "pending"
                    ? "Submission pending"
                    : isRejectedCooldownActive
                      ? "Resubmission locked"
                      : "Submit verification"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

export function MyListingsPage() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const listingsQuery = useQuery({
    queryKey: ["my-listings"],
    queryFn: () => listingsApi.mine()
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => listingsApi.archive(id),
    onSuccess: () => {
      pushToast("Listing archived.", "success");
      void queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    },
    onError: (error) => {
      pushToast(error instanceof Error ? error.message : "Unable to archive listing", "error");
    }
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => listingsApi.restore(id),
    onSuccess: () => {
      pushToast("Listing restored.", "success");
      void queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
    onError: (error) => {
      pushToast(error instanceof Error ? error.message : "Unable to restore listing", "error");
    }
  });

  const activeListings = listingsQuery.data?.filter((listing) => !listing.isDeleted) ?? [];
  const archivedListings = listingsQuery.data?.filter((listing) => listing.isDeleted || listing.status === "archived") ?? [];

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Owner workspace"
        title="My listings"
        description="Active, draft, and archived listings all stay visible here so owners can manage lifecycle without losing access."
        actions={<ButtonLink to="/listings/new">Create listing</ButtonLink>}
      />

      {listingsQuery.isLoading ? <LoadingBlock label="Loading your listings..." /> : null}

      {activeListings.length ? (
        <div className="stack-list">
          <div className="section-heading-row">
            <h3>Current listings</h3>
            <span>{activeListings.length} visible in workspace</span>
          </div>
          <div className="card-grid">
            {activeListings.map((listing) => (
              <Card key={listing._id} className="listing-summary-card">
                <div className="listing-summary-top">
                  <span>{listing.status}</span>
                  <span>{formatDate(listing.moveInDate)}</span>
                </div>
                <h3>{listing.title}</h3>
                <p>{listing.locationText}</p>
                <div className="listing-metrics">
                  <strong>{formatCurrency(listing.rent)}</strong>
                  <span>{formatCurrency(listing.deposit)} deposit</span>
                </div>
                <div className="mini-actions">
                  <ButtonLink tone="secondary" to={`/listings/${listing._id}`}>
                    View
                  </ButtonLink>
                  <ButtonLink tone="secondary" to={`/listings/${listing._id}/edit`}>
                    Edit
                  </ButtonLink>
                  <Button tone="danger" onClick={() => archiveMutation.mutate(listing._id)} type="button">
                    Archive
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {archivedListings.length ? (
        <div className="stack-list">
          <div className="section-heading-row">
            <h3>Archived listings</h3>
            <span>Hidden from the public marketplace, still recoverable by you</span>
          </div>
          <div className="card-grid">
            {archivedListings.map((listing) => (
              <Card key={listing._id} className="listing-summary-card archived-listing-card">
                <div className="listing-summary-top">
                  <span>{listing.status}</span>
                  <span>{listing.deletedAt ? `Archived ${formatDate(listing.deletedAt)}` : formatDate(listing.moveInDate)}</span>
                </div>
                <h3>{listing.title}</h3>
                <p>{listing.locationText}</p>
                <div className="listing-metrics">
                  <strong>{formatCurrency(listing.rent)}</strong>
                  <span>{formatCurrency(listing.deposit)} deposit</span>
                </div>
                <div className="mini-actions">
                  <ButtonLink tone="secondary" to={`/listings/${listing._id}`}>
                    View
                  </ButtonLink>
                  <Button tone="secondary" onClick={() => restoreMutation.mutate(listing._id)} type="button">
                    Restore
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {!listingsQuery.isLoading && !activeListings.length && !archivedListings.length ? (
        <EmptyState
          title="No listings yet"
          copy="Create your first draft to start testing the lister workflow."
          action={<ButtonLink to="/listings/new">Create a listing</ButtonLink>}
        />
      ) : null}
    </div>
  );
}

export function ListingEditorPage() {
  return <ListingFormWizard />;
}

export function ApplicationsPage() {
  const applicationsQuery = useQuery({
    queryKey: ["my-applications"],
    queryFn: () => applicationsApi.mine()
  });

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Seeker flow"
        title="My applications"
        description="Track every listing you have applied to and see how the owner responds."
      />

      {applicationsQuery.isLoading ? <LoadingBlock label="Loading applications..." /> : null}

      {applicationsQuery.data?.length ? (
        <div className="stack-list">
          {applicationsQuery.data.map((application) => (
            <Card key={application._id} className="mini-listing">
              <div>
                <strong>{application.listingTitle || `Listing ${application.listingId.slice(-6)}`}</strong>
                <p>{application.message || "No intro message attached."}</p>
                {application.status === "accepted" ? (
                  <div className="stack-list">
                    <strong>Owner contact</strong>
                    <p>{application.ownerContact?.fullName ? `Owner: ${application.ownerContact.fullName}` : "Owner name not available yet"}</p>
                    <p>{application.ownerContact?.phone ? `Phone: ${application.ownerContact.phone}` : "Phone not added yet"}</p>
                    <p>{application.ownerContact?.email ? `Email: ${application.ownerContact.email}` : "Email not added yet"}</p>
                    <p>{application.ownerContact?.exactAddress ? `Property address: ${application.ownerContact.exactAddress}` : "Property address not added yet"}</p>
                  </div>
                ) : null}
                {application.status === "rejected" ? (
                  <div className="stack-list">
                    <strong>Owner feedback</strong>
                    <p>{application.rejectionReason || "No rejection reason shared yet."}</p>
                  </div>
                ) : null}
                <InlineNotice tone={applicationNoticeTone(application.status)}>
                  {application.status === "accepted"
                    ? "The owner accepted your request. Their contact details are now unlocked below."
                    : application.status === "shortlisted"
                      ? "You are shortlisted. Stay active in chat and keep an eye on follow-ups."
                      : application.status === "rejected"
                        ? "This request was declined. You can explore other listings and apply again elsewhere."
                        : "Your application is in the owner's review queue."}
                </InlineNotice>
              </div>
              <div>
                <span>{application.status}</span>
                <p>{formatDate(application.createdAt)}</p>
                <div className="mini-actions">
                  {application.status === "accepted" && application.ownerContact?.phone ? (
                    <a className="button button-secondary" href={`tel:${application.ownerContact.phone}`}>
                      Call owner
                    </a>
                  ) : null}
                  {application.status === "accepted" && application.ownerContact?.email ? (
                    <a className="button button-secondary" href={`mailto:${application.ownerContact.email}`}>
                      Email owner
                    </a>
                  ) : null}
                  <ButtonLink to={`/listings/${application.listingId}`} tone="secondary">
                    {application.status === "accepted" ? "Open property handoff" : "View listing"}
                  </ButtonLink>
                </div>
                {application.status === "accepted" ? (
                  <MapPreview
                    latitude={application.ownerContact?.latitude}
                    longitude={application.ownerContact?.longitude}
                    label="Property map view"
                  />
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {!applicationsQuery.isLoading && !applicationsQuery.data?.length ? (
        <EmptyState title="No applications yet" copy="Apply from listing detail pages to start your candidate pipeline." />
      ) : null}
    </div>
  );
}

export function ConversationsPage() {
  const conversationsQuery = useQuery({
    queryKey: ["conversations"],
    queryFn: () => conversationsApi.list(),
    refetchInterval: 8000
  });

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Chat"
        title="Conversations"
        description="MVP 1 uses polling-based conversation history so communication still feels dependable without live sockets."
      />

      {conversationsQuery.isLoading ? <LoadingBlock label="Loading conversations..." /> : null}

      {conversationsQuery.data?.length ? (
        <div className="stack-list">
          {conversationsQuery.data.map((conversation) => (
            <Card key={conversation._id} className="mini-listing">
              <div>
                <div className="section-heading-row">
                  <strong>{conversation.participant?.fullName || conversation.participant?.phone || `Conversation ${conversation._id.slice(-6)}`}</strong>
                  {conversation.unread ? <span>Unread</span> : null}
                </div>
                <p>
                  {conversation.latestMessage?.message
                    ? `"${conversation.latestMessage.message}"`
                    : "No messages yet. Open the thread to start the conversation."}
                </p>
                <p>
                  {conversation.participant?.occupation ? `${conversation.participant.occupation} · ` : ""}
                  Updated {formatDateTime(conversation.latestMessage?.createdAt || conversation.updatedAt)}
                </p>
              </div>
              <ButtonLink to={`/conversations/${conversation._id}`} tone="secondary">
                Open thread
              </ButtonLink>
            </Card>
          ))}
        </div>
      ) : null}

      {!conversationsQuery.isLoading && !conversationsQuery.data?.length ? (
        <EmptyState title="No conversations yet" copy="Start a chat from a listing detail page after your profile is eligible." />
      ) : null}
    </div>
  );
}

export function ConversationDetailPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { pushToast } = useToast();
  const [message, setMessage] = useState("");
  const conversationsQuery = useQuery({
    queryKey: ["conversations"],
    queryFn: () => conversationsApi.list(),
    refetchInterval: 8000
  });
  const messagesQuery = useQuery({
    queryKey: ["conversation-messages", id],
    queryFn: () => conversationsApi.getMessages(id),
    enabled: Boolean(id),
    refetchInterval: 5000
  });

  const conversation = conversationsQuery.data?.find((item) => item._id === id);
  const conversationTitle = conversation?.participant?.fullName || conversation?.participant?.phone || `Conversation ${id.slice(-6)}`;
  const conversationDescription = conversation?.participant?.occupation
    ? `Conversation with ${conversationTitle}. ${conversation.participant.occupation} · REST polling refreshes new messages every few seconds.`
    : `Conversation with ${conversationTitle}. REST polling refreshes new messages every few seconds.`;

  useEffect(() => {
    const lastMessageId = messagesQuery.data?.items[messagesQuery.data.items.length - 1]?._id;
    if (!lastMessageId) return;
    void conversationsApi.markRead(id, lastMessageId);
  }, [id, messagesQuery.data]);

  const sendMutation = useMutation({
    mutationFn: () => conversationsApi.sendMessage(id, message),
    onSuccess: async () => {
      setMessage("");
      pushToast("Message sent.", "success");
      await queryClient.invalidateQueries({ queryKey: ["conversation-messages", id] });
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => {
      pushToast(error instanceof Error ? error.message : "Unable to send message", "error");
    }
  });

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Conversation thread"
        title={conversationTitle}
        description={conversationDescription}
      />

      <Card className="chat-card">
        <div className="message-list">
          {messagesQuery.data?.items.length ? (
            messagesQuery.data.items.map((item) => (
              <div key={item._id} className={`message-bubble${item.senderId === currentUser?.user._id ? " message-bubble-self" : ""}`}>
                <span>{item.message}</span>
                <small>{formatDate(item.createdAt)}</small>
              </div>
            ))
          ) : (
            <p>No messages yet.</p>
          )}
        </div>
        <div className="chat-compose">
          <Textarea rows={3} placeholder="Type your message..." value={message} onChange={(event) => setMessage(event.target.value)} />
          <Button disabled={!message.trim() || sendMutation.isPending} onClick={() => sendMutation.mutate()} type="button">
            {sendMutation.isPending ? "Sending..." : "Send message"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list()
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      pushToast("All notifications marked read.", "success");
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Notification center"
        title="Notifications"
        description="Every important backend event is persisted here first, even before push notifications exist."
        actions={
          <Button tone="secondary" onClick={() => markAllMutation.mutate()} type="button">
            Mark all read
          </Button>
        }
      />

      {notificationsQuery.data?.items.length ? (
        <div className="stack-list">
          {notificationsQuery.data.items.map((notification: NotificationRecord) => (
            <Card key={notification._id} className="mini-listing">
              <div>
                <strong>{notification.title}</strong>
                <p>{notification.body}</p>
                <small>{formatDate(notification.createdAt)}</small>
              </div>
              {!notification.isRead ? (
                <Button tone="secondary" onClick={() => markReadMutation.mutate(notification._id)} type="button">
                  Mark read
                </Button>
              ) : (
                <span>Read</span>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No notifications yet" copy="Messages, application changes, verification updates, and moderation events will appear here." />
      )}
    </div>
  );
}

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [userModerationModal, setUserModerationModal] = useState<{
    id: string;
    label: string;
    action: "flag" | "deactivate" | "activate";
  } | null>(null);
  const [userModerationReasonDraft, setUserModerationReasonDraft] = useState("");
  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => adminApi.users()
  });

  const flagMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.flagUser(id, reason),
    onSuccess: () => {
      pushToast("User flagged.", "success");
      setUserModerationModal(null);
      setUserModerationReasonDraft("");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
  });

  const unflagMutation = useMutation({
    mutationFn: (id: string) => adminApi.unflagUser(id),
    onSuccess: () => {
      pushToast("User unflagged.", "success");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      pushToast(error instanceof Error ? error.message : "Unable to unflag user", "error");
    }
  });

  const deactivateMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.deactivateUser(id, reason),
    onSuccess: () => {
      pushToast("User deactivated.", "success");
      setUserModerationModal(null);
      setUserModerationReasonDraft("");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
  });

  const activateMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.activateUser(id, reason),
    onSuccess: () => {
      pushToast("User activated.", "success");
      setUserModerationModal(null);
      setUserModerationReasonDraft("");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
  });

  const isUserModerationPending = flagMutation.isPending || unflagMutation.isPending || deactivateMutation.isPending || activateMutation.isPending;

  return (
    <div className="page-shell">
      <Modal
        open={Boolean(userModerationModal)}
        title={
          userModerationModal?.action === "deactivate"
            ? "Deactivate user"
            : userModerationModal?.action === "activate"
              ? "Activate user"
              : "Flag user"
        }
        onClose={() => {
          if (isUserModerationPending) return;
          setUserModerationModal(null);
          setUserModerationReasonDraft("");
        }}
      >
        <div className="stack-list rejection-modal-content">
          <InlineNotice
            tone={
              userModerationModal?.action === "deactivate"
                ? "danger"
                : userModerationModal?.action === "activate"
                  ? "success"
                  : "warning"
            }
          >
            {userModerationModal?.action === "deactivate"
              ? "Deactivate only when the user should lose access to marketplace actions. Deactivation clears any flag because this is now the stronger moderation state."
              : userModerationModal?.action === "activate"
                ? "Activation restores account access and clears the previous moderation note. Record why this account is safe to restore."
                : "Flag keeps the active user usable but marks the account for trust review. Inactive users do not need flags because deactivation already blocks access."}
          </InlineNotice>
          <Field label="Moderation reason" hint={userModerationModal ? `User: ${userModerationModal.label}` : undefined}>
            <Textarea
              rows={4}
              placeholder="Example: Suspicious profile details or repeated marketplace reports."
              value={userModerationReasonDraft}
              onChange={(event) => setUserModerationReasonDraft(event.target.value)}
            />
          </Field>
          <div className="row-actions">
            <Button
              tone={userModerationModal?.action === "deactivate" ? "danger" : "secondary"}
              type="button"
              disabled={isUserModerationPending || userModerationReasonDraft.trim().length < 5 || !userModerationModal}
              onClick={() => {
                if (!userModerationModal) return;
                const payload = {
                  id: userModerationModal.id,
                  reason: userModerationReasonDraft.trim()
                };
                if (userModerationModal.action === "deactivate") {
                  deactivateMutation.mutate(payload);
                  return;
                }
                if (userModerationModal.action === "activate") {
                  activateMutation.mutate(payload);
                  return;
                }
                flagMutation.mutate(payload);
              }}
            >
              {isUserModerationPending
                ? "Saving..."
                : userModerationModal?.action === "deactivate"
                  ? "Confirm deactivation"
                  : userModerationModal?.action === "activate"
                    ? "Confirm activation"
                  : "Confirm flag"}
            </Button>
            <Button
              tone="secondary"
              type="button"
              disabled={isUserModerationPending}
              onClick={() => {
                setUserModerationModal(null);
                setUserModerationReasonDraft("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
      <PageHeader eyebrow="Admin" title="Users" description="Trust operations for user review, flagging, and deactivation." />
      <AdminWorkspaceNav />
      <div className="stack-list">
        {usersQuery.data?.map((user) => (
          <Card key={user._id} className="mini-listing">
            <div>
              <div className="section-heading-row">
                <div className="admin-user-heading">
                  {user.profileContext?.profileImageUrl ? (
                    <img className="admin-user-avatar" alt={user.profileContext.fullName || user.phone} src={user.profileContext.profileImageUrl} />
                  ) : (
                    <div className="admin-user-avatar admin-user-avatar-fallback">
                      {(user.profileContext?.fullName || user.phone).slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <strong>{user.profileContext?.fullName || user.phone}</strong>
                    <p>{user.phone}</p>
                  </div>
                </div>
                <div className="admin-listing-badges">
                  <Badge tone={user.isActive === false ? "danger" : "success"}>
                    {user.isActive === false ? "Inactive" : "Active"}
                  </Badge>
                  {user.isFlagged ? <Badge tone="warning">Flagged</Badge> : null}
                  <Badge tone={user.verificationStatus === "verified" ? "primary" : "neutral"}>
                    {user.verificationStatus === "verified" ? "Verified" : user.verificationStatus || "not_submitted"}
                  </Badge>
                </div>
              </div>
              <p>{user.email || "No email added yet"}</p>
              <p>Role: {user.role}</p>
              <div className="admin-listing-meta-grid">
                <div>
                  <span>Completion</span>
                  <strong>{user.profileContext?.profileCompletionScore ?? 0}%</strong>
                </div>
                <div>
                  <span>Age</span>
                  <strong>{user.profileContext?.age ?? "Not added"}</strong>
                </div>
                <div>
                  <span>Gender</span>
                  <strong>{user.profileContext?.gender || "Not added"}</strong>
                </div>
                <div>
                  <span>Occupation</span>
                  <strong>{user.profileContext?.occupation || "Not added"}</strong>
                </div>
                <div>
                  <span>Joined</span>
                  <strong>{formatDate(user.createdAt)}</strong>
                </div>
                <div>
                  <span>Last login</span>
                  <strong>{formatDate(user.lastLoginAt)}</strong>
                </div>
              </div>
              {user.profileContext?.bio ? (
                <InlineNotice tone="info">Bio: {user.profileContext.bio}</InlineNotice>
              ) : (
                <InlineNotice tone="warning">Profile bio is not completed yet.</InlineNotice>
              )}
              {user.verificationContext?.status === "rejected" ? (
                <InlineNotice tone="danger">
                  Verification rejected
                  {user.verificationContext.rejectionReason ? `: ${user.verificationContext.rejectionReason}` : "."}
                  {user.verificationContext.resubmissionAllowedAt
                    ? ` Resubmission opens after ${formatDate(user.verificationContext.resubmissionAllowedAt)}.`
                    : ""}
                </InlineNotice>
              ) : null}
              {user.flagReason ? (
                <InlineNotice tone={user.isActive === false ? "danger" : "warning"}>
                  Moderation note: {user.flagReason}
                </InlineNotice>
              ) : null}
            </div>
            <div className="mini-actions">
              {user.isActive === false ? (
                <Button
                  tone="secondary"
                  disabled={isUserModerationPending}
                  onClick={() => {
                    setUserModerationModal({
                      id: user._id,
                      label: user.email || user.phone,
                      action: "activate"
                    });
                    setUserModerationReasonDraft("");
                  }}
                  type="button"
                >
                  {activateMutation.isPending ? "Activating..." : "Activate"}
                </Button>
              ) : (
                <>
                  <Button
                    tone="secondary"
                    disabled={isUserModerationPending}
                    onClick={() => {
                      setUserModerationModal({
                        id: user._id,
                        label: user.email || user.phone,
                        action: "flag"
                      });
                      setUserModerationReasonDraft("");
                    }}
                    type="button"
                  >
                    {user.isFlagged ? "Update flag" : "Flag"}
                  </Button>
                  {user.isFlagged ? (
                    <Button
                      tone="secondary"
                      disabled={isUserModerationPending}
                      onClick={() => unflagMutation.mutate(user._id)}
                      type="button"
                    >
                      {unflagMutation.isPending ? "Unflagging..." : "Unflag"}
                    </Button>
                  ) : null}
                  <Button
                    tone="danger"
                    disabled={isUserModerationPending}
                    onClick={() => {
                      setUserModerationModal({
                        id: user._id,
                        label: user.email || user.phone,
                        action: "deactivate"
                      });
                      setUserModerationReasonDraft("");
                    }}
                    type="button"
                  >
                    Deactivate
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AdminListingsPage() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [listingFilter, setListingFilter] = useState<"active" | "paused" | "removed">("active");
  const [moderationModal, setModerationModal] = useState<{
    id: string;
    title: string;
    action: "pause" | "archive";
  } | null>(null);
  const [moderationReasonDraft, setModerationReasonDraft] = useState("");
  const listingsQuery = useQuery({
    queryKey: ["admin-listings"],
    queryFn: () => listingsApi.adminList()
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: "pause" | "archive"; reason: string }) =>
      action === "pause" ? listingsApi.pause(id, reason) : listingsApi.adminArchive(id, reason),
    onSuccess: () => {
      pushToast("Listing moderation saved.", "success");
      setModerationModal(null);
      setModerationReasonDraft("");
      void queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
    }
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => listingsApi.adminRestore(id),
    onSuccess: () => {
      pushToast("Listing restored to the marketplace review flow.", "success");
      void queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
    }
  });

  const reliveMutation = useMutation({
    mutationFn: (id: string) => listingsApi.adminRelive(id),
    onSuccess: () => {
      pushToast("Listing is live in the marketplace again.", "success");
      void queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
    }
  });

  const filteredListings =
    listingsQuery.data?.filter((listing) => {
      if (listingFilter === "removed") return listing.isDeleted || listing.status === "archived";
      if (listingFilter === "paused") return listing.status === "paused" && !listing.isDeleted;
      return listing.status === "active" && !listing.isDeleted;
    }) ?? [];

  const activeCount = listingsQuery.data?.filter((listing) => listing.status === "active" && !listing.isDeleted).length ?? 0;
  const pausedCount = listingsQuery.data?.filter((listing) => listing.status === "paused" && !listing.isDeleted).length ?? 0;
  const removedCount = listingsQuery.data?.filter((listing) => listing.isDeleted || listing.status === "archived").length ?? 0;

  return (
    <div className="page-shell">
      <Modal
        open={Boolean(moderationModal)}
        title={moderationModal?.action === "archive" ? "Remove from marketplace" : "Pause listing"}
        onClose={() => {
          if (moderateMutation.isPending) return;
          setModerationModal(null);
          setModerationReasonDraft("");
        }}
      >
        <div className="stack-list rejection-modal-content">
          <InlineNotice tone={moderationModal?.action === "archive" ? "danger" : "warning"}>
            {moderationModal?.action === "archive"
              ? "Removing from marketplace hides the listing from live operations while preserving moderation history. Record a clear reason first."
              : "Pause temporarily removes the listing from live discovery. Record why you are pausing it."}
          </InlineNotice>
          <Field label="Moderation reason" hint={moderationModal ? `Listing: ${moderationModal.title}` : undefined}>
            <Textarea
              rows={4}
              placeholder="Example: The listing photos do not match the description and need review."
              value={moderationReasonDraft}
              onChange={(event) => setModerationReasonDraft(event.target.value)}
            />
          </Field>
          <div className="row-actions">
            <Button
              tone={moderationModal?.action === "archive" ? "danger" : "secondary"}
              type="button"
              disabled={moderateMutation.isPending || moderationReasonDraft.trim().length < 5 || !moderationModal}
              onClick={() => {
                if (!moderationModal) return;
                moderateMutation.mutate({
                  id: moderationModal.id,
                  action: moderationModal.action,
                  reason: moderationReasonDraft.trim()
                });
              }}
            >
              {moderateMutation.isPending
                ? "Saving..."
                : moderationModal?.action === "archive"
                  ? "Confirm removal"
                  : "Confirm pause"}
            </Button>
            <Button
              tone="secondary"
              type="button"
              disabled={moderateMutation.isPending}
              onClick={() => {
                setModerationModal(null);
                setModerationReasonDraft("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <PageHeader eyebrow="Admin" title="Listings" description="Pause or remove problematic listings from the marketplace without deleting moderation history." />
      <AdminWorkspaceNav />
      <div className="admin-filter-row">
        <Tabs
          value={listingFilter}
          onChange={(value: string) => setListingFilter(value as "active" | "paused" | "removed")}
          items={[
            { label: `Active (${activeCount})`, value: "active" },
            { label: `Paused (${pausedCount})`, value: "paused" },
            { label: `Removed (${removedCount})`, value: "removed" }
          ]}
        />
      </div>
      {listingFilter === "removed" ? (
        <InlineNotice tone="warning">
          Removed listings stay recoverable for 30 days. After that, the backend permanently flushes them from storage.
        </InlineNotice>
      ) : null}
      <div className="stack-list">
        {filteredListings.map((listing: ListingRecord) => (
          <Card key={listing._id} className="admin-listing-card">
            <div className="admin-listing-media">
              {listing.coverImageUrl ? (
                <img alt={listing.title} src={listing.coverImageUrl} />
              ) : (
                <div className="admin-listing-media-fallback">No image</div>
              )}
            </div>

            <div className="admin-listing-main">
              <div className="section-heading-row">
                <div>
                  <strong>{listing.title}</strong>
                  <p>{listing.locationText}</p>
                </div>
                <div className="admin-listing-badges">
                  <Badge
                    tone={
                      listing.status === "active"
                        ? "success"
                        : listing.status === "paused"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {listing.isDeleted ? "removed" : listing.status}
                  </Badge>
                  <Badge tone={listing.ownerContext?.verificationStatus === "verified" ? "primary" : "neutral"}>
                    {listing.ownerContext?.verificationStatus === "verified" ? "Verified lister" : "Verification pending"}
                  </Badge>
                </div>
              </div>

              <div className="admin-listing-meta-grid">
                <div>
                  <span>Listing type</span>
                  <strong>{String(listing.listingType).replace(/_/g, " ")}</strong>
                </div>
                <div>
                  <span>Rent</span>
                  <strong>{formatCurrency(listing.rent)}</strong>
                </div>
                <div>
                  <span>Deposit</span>
                  <strong>{formatCurrency(listing.deposit)}</strong>
                </div>
                <div>
                  <span>Move-in</span>
                  <strong>{formatDate(listing.moveInDate)}</strong>
                </div>
                <div>
                  <span>Created</span>
                  <strong>{formatDate(listing.createdAt)}</strong>
                </div>
                <div>
                  <span>Updated</span>
                  <strong>{formatDate(listing.updatedAt)}</strong>
                </div>
              </div>

              <div className="admin-owner-context">
                <strong>{listing.ownerContext?.fullName || "Owner profile incomplete"}</strong>
                <p>{listing.ownerContext?.occupation || "Occupation not added"}</p>
                <p>{listing.ownerContext?.phone || "Phone not available"}</p>
                <p>{listing.ownerContext?.email || "Email not available"}</p>
              </div>

              <div className="mini-actions">
                <ButtonLink to={`/listings/${listing._id}`} tone="secondary">
                  View listing
                </ButtonLink>
                {!listing.isDeleted ? (
                  <>
                    {listing.status === "paused" ? (
                      <Button
                        tone="secondary"
                        disabled={reliveMutation.isPending}
                        onClick={() => reliveMutation.mutate(listing._id)}
                        type="button"
                      >
                        {reliveMutation.isPending ? "Re-living..." : "Re-live"}
                      </Button>
                    ) : (
                      <Button
                        tone="secondary"
                        onClick={() => {
                          setModerationModal({
                            id: listing._id,
                            title: listing.title,
                            action: "pause"
                          });
                          setModerationReasonDraft("");
                        }}
                        type="button"
                      >
                        Pause
                      </Button>
                    )}
                    <Button
                      tone="danger"
                      onClick={() => {
                        setModerationModal({
                          id: listing._id,
                          title: listing.title,
                          action: "archive"
                        });
                        setModerationReasonDraft("");
                      }}
                      type="button"
                    >
                      Remove from marketplace
                    </Button>
                  </>
                ) : (
                  <>
                    <span>Removed from live moderation queue. Auto-flushes after 30 days unless restored.</span>
                    <Button
                      tone="secondary"
                      disabled={restoreMutation.isPending}
                      onClick={() => restoreMutation.mutate(listing._id)}
                      type="button"
                    >
                      {restoreMutation.isPending ? "Restoring..." : "Restore"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
        {!filteredListings.length ? (
          <EmptyState
            title={`No ${listingFilter} listings right now`}
            copy={
              listingFilter === "active"
                ? "Live listings that need admin review will appear here."
                : listingFilter === "paused"
                  ? "Paused listings remain here until an admin decides on the next moderation step."
                  : "Removed listings are preserved here as moderation history."
            }
          />
        ) : null}
      </div>
    </div>
  );
}

export function AdminVerificationsPage() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [verificationRejectModal, setVerificationRejectModal] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [verificationRejectReasonDraft, setVerificationRejectReasonDraft] = useState("");
  const verificationsQuery = useQuery({
    queryKey: ["admin-verifications"],
    queryFn: () => verificationApi.adminList()
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => verificationApi.approve(id),
    onSuccess: () => {
      pushToast("Verification approved.", "success");
      void queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => verificationApi.reject(id, reason),
    onSuccess: () => {
      pushToast("Verification rejected.", "success");
      setVerificationRejectModal(null);
      setVerificationRejectReasonDraft("");
      void queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
    }
  });

  return (
    <div className="page-shell">
      <Modal
        open={Boolean(verificationRejectModal)}
        title="Reject verification"
        onClose={() => {
          if (rejectMutation.isPending) return;
          setVerificationRejectModal(null);
          setVerificationRejectReasonDraft("");
        }}
      >
        <div className="stack-list rejection-modal-content">
          <InlineNotice tone="danger">
            Rejecting verification sends the user back to a rejected state. Add a clear reason so they know what to correct.
          </InlineNotice>
          <Field label="Rejection reason" hint={verificationRejectModal ? `Submission: ${verificationRejectModal.label}` : undefined}>
            <Textarea
              rows={4}
              placeholder="Example: Uploaded document is unreadable. Please submit a clearer photo."
              value={verificationRejectReasonDraft}
              onChange={(event) => setVerificationRejectReasonDraft(event.target.value)}
            />
          </Field>
          <div className="row-actions">
            <Button
              tone="danger"
              type="button"
              disabled={rejectMutation.isPending || verificationRejectReasonDraft.trim().length < 5 || !verificationRejectModal}
              onClick={() => {
                if (!verificationRejectModal) return;
                rejectMutation.mutate({
                  id: verificationRejectModal.id,
                  reason: verificationRejectReasonDraft.trim()
                });
              }}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Confirm rejection"}
            </Button>
            <Button
              tone="secondary"
              type="button"
              disabled={rejectMutation.isPending}
              onClick={() => {
                setVerificationRejectModal(null);
                setVerificationRejectReasonDraft("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
      <PageHeader eyebrow="Admin" title="Verifications" description="Approve or reject KYC-lite trust submissions." />
      <AdminWorkspaceNav />
      <div className="stack-list">
        {verificationsQuery.data?.map((verification: AdminVerificationReview) => (
          <Card key={verification._id} className="mini-listing">
            <div>
              <strong>{verification.reviewerContext?.fullName || `User ${verification.userId.slice(-6)}`}</strong>
              <p>{verification.reviewerContext?.phone || "Phone not available"}</p>
              {verification.reviewerContext?.occupation ? <p>{verification.reviewerContext.occupation}</p> : null}
              <p>Document: {formatVerificationDocumentLabel(verification.documentType)}</p>
              <p>Name on ID: {verification.nameOnDocument}</p>
              <p>ID ending: •••• {verification.documentNumberLast4}</p>
              <p>Status: {verification.status}</p>
              <p>Submitted: {formatDate(verification.createdAt)}</p>
              <div className="mini-actions">
                <a
                  className="button button-secondary"
                  href={verification.documentFrontUrl || verification.documentUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open front
                </a>
                {verification.documentBackUrl ? (
                  <a className="button button-secondary" href={verification.documentBackUrl} target="_blank" rel="noreferrer">
                    Open back
                  </a>
                ) : null}
              </div>
            </div>
            <div className="mini-actions">
              <Button onClick={() => approveMutation.mutate(verification._id)} type="button">
                Approve
              </Button>
              <Button
                tone="danger"
                onClick={() => {
                  setVerificationRejectModal({
                    id: verification._id,
                    label: verification.reviewerContext?.fullName || verification.reviewerContext?.phone || `User ${verification.userId.slice(-6)}`
                  });
                  setVerificationRejectReasonDraft("");
                }}
                type="button"
              >
                Reject
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function formatVerificationDocumentLabel(documentType: VerificationRecord["documentType"]): string {
  switch (documentType) {
    case "aadhaar":
      return "Aadhaar card";
    case "passport":
      return "Passport";
    case "driving_license":
      return "Driving licence";
    case "voter_id":
      return "Voter ID";
    default:
      return documentType;
  }
}
