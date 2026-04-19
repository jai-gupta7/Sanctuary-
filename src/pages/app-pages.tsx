import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { Button, ButtonLink, Card, EmptyState, Field, InlineNotice, Input, LoadingBlock, PageHeader, Select, Stat, Textarea } from "../components/ui";
import { adminApi, applicationsApi, conversationsApi, listingsApi, notificationsApi, uploadsApi, usersApi, verificationApi } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import type { CurrentUserPayload, ListingDetailPayload, ListingRecord, NotificationRecord, VerificationRecord } from "../lib/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value?: string) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function reasonPrompt(label: string) {
  return window.prompt(label)?.trim() || "";
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

const listingSchema = z.object({
  listingType: z.enum(["replacement", "flatmate_needed", "full_flat"]),
  title: z.string().min(3),
  description: z.string().min(10),
  rent: z.number().min(0),
  deposit: z.number().min(0),
  locationText: z.string().min(2),
  moveInDate: z.string().min(1),
  status: z.enum(["draft", "active", "paused", "filled", "archived"]),
  genderPreference: z.string().optional(),
  occupationPreference: z.string().optional(),
  smokingAllowed: z.boolean().optional(),
  drinkingAllowed: z.boolean().optional()
});

const verificationSchema = z.object({
  documentType: z.string().min(2)
});

type ProfileValues = z.infer<typeof profileSchema>;
type ListingValues = z.infer<typeof listingSchema>;
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
            <ButtonLink to="/verification">Open verification</ButtonLink>
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
        </Card>

        <Card>
          <form
            className="form-grid"
            onSubmit={handleSubmit(async (values) => {
              try {
                let profileImageUrl = values.profileImageUrl;

                if (photoFile) {
                  profileImageUrl = await uploadsApi.mockUpload(photoFile, "profile_photo", "profile");
                }

                await usersApi.updateMe({
                  ...values,
                  profileImageUrl
                });

                await refreshCurrentUser();
                await queryClient.invalidateQueries({ queryKey: ["current-user"] });
                pushToast("Profile updated.", "success");
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
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const verificationQuery = useQuery({
    queryKey: ["my-verification"],
    queryFn: () => verificationApi.getMine()
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<VerificationValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      documentType: "government_id"
    }
  });

  const status = verificationQuery.data?.status ?? "not_submitted";

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Verification"
        title="KYC-lite verification"
        description="Submit a simple identity document to unlock verified trust badges across profiles and listings."
      />

      <div className="detail-grid">
        <Card>
          <h3>Current status</h3>
          <p>Status: {status}</p>
          <p>Submitted: {formatDate(verificationQuery.data?.createdAt)}</p>
          {verificationQuery.data?.rejectionReason ? <InlineNotice tone="danger">{verificationQuery.data.rejectionReason}</InlineNotice> : null}
          {status === "verified" ? <InlineNotice tone="success">Your profile is verified.</InlineNotice> : null}
          {status === "pending" ? <InlineNotice tone="info">Your submission is awaiting admin review.</InlineNotice> : null}
        </Card>

        <Card>
          <form
            className="form-grid"
            onSubmit={handleSubmit(async (values) => {
              if (!documentFile) {
                pushToast("Choose a document file first.", "error");
                return;
              }

              try {
                const documentUrl = await uploadsApi.mockUpload(documentFile, "kyc_document", "verification");
                await verificationApi.submit({
                  documentType: values.documentType,
                  documentUrl
                });
                await queryClient.invalidateQueries({ queryKey: ["my-verification"] });
                pushToast("Verification submitted.", "success");
              } catch (error) {
                pushToast(error instanceof Error ? error.message : "Unable to submit verification", "error");
              }
            })}
          >
            <Field label="Document type" error={errors.documentType?.message}>
              <Select {...register("documentType")}>
                <option value="government_id">Government ID</option>
                <option value="passport">Passport</option>
                <option value="driver_license">Driver's license</option>
              </Select>
            </Field>
            <Field label="Document file">
              <Input type="file" accept="image/*,application/pdf" onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)} />
            </Field>
            <Button type="submit" disabled={isSubmitting || status === "pending"}>
              {isSubmitting ? "Submitting..." : status === "pending" ? "Submission pending" : "Submit verification"}
            </Button>
          </form>
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

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Owner workspace"
        title="My listings"
        description="Drafts, active listings, and owner-side controls all live here."
        actions={<ButtonLink to="/listings/new">Create listing</ButtonLink>}
      />

      {listingsQuery.isLoading ? <LoadingBlock label="Loading your listings..." /> : null}

      {listingsQuery.data?.length ? (
        <div className="card-grid">
          {listingsQuery.data.map((listing) => (
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
      ) : null}

      {!listingsQuery.isLoading && !listingsQuery.data?.length ? (
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
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { pushToast } = useToast();
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const listingQuery = useQuery({
    queryKey: ["listing-editor", id],
    queryFn: () => listingsApi.get(id!, true),
    enabled: Boolean(id)
  });

  const existingImageUrls = listingQuery.data?.images.map((image) => image.imageUrl) ?? [];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ListingValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      listingType: "flatmate_needed",
      title: "",
      description: "",
      rent: 0,
      deposit: 0,
      locationText: "",
      moveInDate: "",
      status: "draft",
      genderPreference: "",
      occupationPreference: "",
      smokingAllowed: false,
      drinkingAllowed: false
    }
  });

  useEffect(() => {
    if (!listingQuery.data) return;

    reset({
      listingType: listingQuery.data.listing.listingType,
      title: listingQuery.data.listing.title,
      description: listingQuery.data.listing.description,
      rent: listingQuery.data.listing.rent,
      deposit: listingQuery.data.listing.deposit,
      locationText: listingQuery.data.listing.locationText,
      moveInDate: listingQuery.data.listing.moveInDate.slice(0, 10),
      status: listingQuery.data.listing.status,
      genderPreference: listingQuery.data.preference?.genderPreference ?? "",
      occupationPreference: listingQuery.data.preference?.occupationPreference ?? "",
      smokingAllowed: listingQuery.data.preference?.smokingAllowed ?? false,
      drinkingAllowed: listingQuery.data.preference?.drinkingAllowed ?? false
    });
  }, [listingQuery.data, reset]);

  const selectedStatus = watch("status");
  const prospectiveImageCount = imageFiles.length || existingImageUrls.length;

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow={id ? "Edit listing" : "Create listing"}
        title={id ? "Update your listing" : "Create a new listing"}
        description="Drafts are low pressure. Publishing is blocked until the backend requirements are actually met."
      />

      {selectedStatus === "active" && !currentUser?.eligibility.eligible ? (
        <InlineNotice tone="warning">
          Publishing requires an interaction-ready profile before the backend will accept an active listing.
        </InlineNotice>
      ) : null}
      {selectedStatus === "active" && prospectiveImageCount < 3 ? (
        <InlineNotice tone="warning">Publishing also requires at least 3 images.</InlineNotice>
      ) : null}

      <Card>
        <form
          className="form-grid"
          onSubmit={handleSubmit(async (values) => {
            try {
              const uploadedImageUrls =
                imageFiles.length > 0
                  ? await Promise.all(imageFiles.map((file) => uploadsApi.mockUpload(file, "listing_image", "listing", id)))
                  : existingImageUrls;

              const payload = {
                ...values,
                moveInDate: values.moveInDate,
                imageUrls: uploadedImageUrls
              };

              if (id) {
                await listingsApi.update(id, payload);
              } else {
                await listingsApi.create(payload);
              }

              await queryClient.invalidateQueries({ queryKey: ["my-listings"] });
              await queryClient.invalidateQueries({ queryKey: ["listings"] });
              pushToast(id ? "Listing updated." : "Listing created.", "success");
              navigate("/my-listings");
            } catch (error) {
              pushToast(error instanceof Error ? error.message : "Unable to save listing", "error");
            }
          })}
        >
          <Field label="Listing type" error={errors.listingType?.message}>
            <Select {...register("listingType")}>
              <option value="flatmate_needed">Flatmate needed</option>
              <option value="replacement">Replacement</option>
              <option value="full_flat">Full flat</option>
            </Select>
          </Field>
          <Field label="Title" error={errors.title?.message}>
            <Input {...register("title")} />
          </Field>
          <Field label="Description" error={errors.description?.message}>
            <Textarea rows={5} {...register("description")} />
          </Field>
            <Field label="Rent" error={errors.rent?.message}>
            <Input inputMode="numeric" {...register("rent", { valueAsNumber: true })} />
          </Field>
          <Field label="Deposit" error={errors.deposit?.message}>
            <Input inputMode="numeric" {...register("deposit", { valueAsNumber: true })} />
          </Field>
          <Field label="Location" error={errors.locationText?.message}>
            <Input {...register("locationText")} />
          </Field>
          <Field label="Move-in date" error={errors.moveInDate?.message}>
            <Input type="date" {...register("moveInDate")} />
          </Field>
          <Field label="Target status" error={errors.status?.message}>
            <Select {...register("status")}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="filled">Filled</option>
              <option value="archived">Archived</option>
            </Select>
          </Field>
          <Field label="Gender preference">
            <Input placeholder="Any, female, male..." {...register("genderPreference")} />
          </Field>
          <Field label="Occupation preference">
            <Input placeholder="Working professional, student..." {...register("occupationPreference")} />
          </Field>
          <Field label="Listing images">
            <Input type="file" accept="image/*" multiple onChange={(event) => setImageFiles(Array.from(event.target.files ?? []))} />
          </Field>
          <div className="row-actions">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : id ? "Save changes" : "Create listing"}
            </Button>
            <ButtonLink to="/my-listings" tone="secondary">
              Cancel
            </ButtonLink>
          </div>
        </form>
      </Card>
    </div>
  );
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
                <strong>Listing {application.listingId.slice(-6)}</strong>
                <p>{application.message || "No intro message attached."}</p>
              </div>
              <div>
                <span>{application.status}</span>
                <p>{formatDate(application.createdAt)}</p>
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
                <strong>Conversation {conversation._id.slice(-6)}</strong>
                <p>Updated {formatDate(conversation.updatedAt)}</p>
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
  const messagesQuery = useQuery({
    queryKey: ["conversation-messages", id],
    queryFn: () => conversationsApi.getMessages(id),
    enabled: Boolean(id),
    refetchInterval: 5000
  });

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
        title={`Conversation ${id.slice(-6)}`}
        description="REST polling is active on this thread. New messages refresh every few seconds."
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
  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => adminApi.users()
  });

  const flagMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.flagUser(id, reason),
    onSuccess: () => {
      pushToast("User flagged.", "success");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
  });

  const deactivateMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.deactivateUser(id, reason),
    onSuccess: () => {
      pushToast("User deactivated.", "success");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
  });

  return (
    <div className="page-shell">
      <PageHeader eyebrow="Admin" title="Users" description="Trust operations for user review, flagging, and deactivation." />
      <div className="stack-list">
        {usersQuery.data?.map((user) => (
          <Card key={user._id} className="mini-listing">
            <div>
              <strong>{user.phone}</strong>
              <p>{user.email || "No email added yet"}</p>
              <p>Role: {user.role}</p>
            </div>
            <div className="mini-actions">
              <Button
                tone="secondary"
                onClick={() => {
                  const reason = reasonPrompt("Reason for flagging this user");
                  if (!reason) return;
                  flagMutation.mutate({ id: user._id, reason });
                }}
                type="button"
              >
                Flag
              </Button>
              <Button
                tone="danger"
                onClick={() => {
                  const reason = reasonPrompt("Reason for deactivating this user");
                  if (!reason) return;
                  deactivateMutation.mutate({ id: user._id, reason });
                }}
                type="button"
              >
                Deactivate
              </Button>
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
  const listingsQuery = useQuery({
    queryKey: ["admin-listings"],
    queryFn: () => listingsApi.adminList()
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: "pause" | "archive"; reason: string }) =>
      action === "pause" ? listingsApi.pause(id, reason) : listingsApi.adminArchive(id, reason),
    onSuccess: () => {
      pushToast("Listing moderation saved.", "success");
      void queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
    }
  });

  return (
    <div className="page-shell">
      <PageHeader eyebrow="Admin" title="Listings" description="Pause or archive problematic listings without deleting operational history." />
      <div className="stack-list">
        {listingsQuery.data?.map((listing: ListingRecord) => (
          <Card key={listing._id} className="mini-listing">
            <div>
              <strong>{listing.title}</strong>
              <p>{listing.locationText}</p>
              <p>Status: {listing.status}</p>
            </div>
            <div className="mini-actions">
              <Button
                tone="secondary"
                onClick={() => {
                  const reason = reasonPrompt("Reason for pausing this listing");
                  if (!reason) return;
                  moderateMutation.mutate({ id: listing._id, action: "pause", reason });
                }}
                type="button"
              >
                Pause
              </Button>
              <Button
                tone="danger"
                onClick={() => {
                  const reason = reasonPrompt("Reason for archiving this listing");
                  if (!reason) return;
                  moderateMutation.mutate({ id: listing._id, action: "archive", reason });
                }}
                type="button"
              >
                Archive
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AdminVerificationsPage() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
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
      void queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
    }
  });

  return (
    <div className="page-shell">
      <PageHeader eyebrow="Admin" title="Verifications" description="Approve or reject KYC-lite trust submissions." />
      <div className="stack-list">
        {verificationsQuery.data?.map((verification: VerificationRecord) => (
          <Card key={verification._id} className="mini-listing">
            <div>
              <strong>User {verification.userId.slice(-6)}</strong>
              <p>{verification.documentType}</p>
              <p>Status: {verification.status}</p>
            </div>
            <div className="mini-actions">
              <Button onClick={() => approveMutation.mutate(verification._id)} type="button">
                Approve
              </Button>
              <Button
                tone="danger"
                onClick={() => {
                  const reason = reasonPrompt("Reason for rejecting verification");
                  if (!reason) return;
                  rejectMutation.mutate({ id: verification._id, reason });
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
