import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { Homepage } from "../components/homepage";
import { MapPreview } from "../components/map-preview";
import { Badge, Button, ButtonLink, Card, EmptyState, Field, InlineNotice, Input, LoadingBlock, Modal, PageHeader, Textarea } from "../components/ui";
import { applicationsApi, conversationsApi, listingsApi } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import type { ApplicationVM, ListingCardVM, ListingDetailPayload, ListingDetailVM } from "../lib/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function applicationStatusTone(status: ApplicationVM["status"]) {
  if (status === "accepted") return "success";
  if (status === "shortlisted") return "primary";
  if (status === "rejected") return "danger";
  return "neutral";
}

function applicationNoticeTone(status: ApplicationVM["status"]) {
  if (status === "accepted") return "success";
  if (status === "shortlisted") return "info";
  if (status === "rejected") return "danger";
  return "info";
}

function mapListingCard(listing: ListingCardVM | any): ListingCardVM {
  return {
    id: listing._id ?? listing.id,
    title: listing.title,
    location: listing.locationText ?? listing.location,
    rent: listing.rent,
    deposit: listing.deposit,
    moveInDate: listing.moveInDate,
    status: listing.status
  };
}

function mapListingDetail(data: ListingDetailPayload): ListingDetailVM {
  const preferences = [
    data.preference?.genderPreference ? `Gender preference: ${data.preference.genderPreference}` : null,
    data.preference?.occupationPreference ? `Occupation preference: ${data.preference.occupationPreference}` : null,
    data.preference?.smokingAllowed ? "Smoking allowed" : "Non-smoking household",
    data.preference?.drinkingAllowed ? "Drinking allowed" : "No drinking preference declared"
  ].filter(Boolean) as string[];

  return {
    id: data.listing._id,
    title: data.listing.title,
    description: data.listing.description,
    location: data.listing.locationText,
    rent: data.listing.rent,
    deposit: data.listing.deposit,
    moveInDate: data.listing.moveInDate,
    status: data.listing.status,
    images: data.images.map((image) => image.imageUrl),
    listerName: data.listerProfile?.fullName || "Listing owner",
    listerOccupation: data.listerProfile?.occupation,
    listerBio: data.listerProfile?.bio,
    listerVerified: data.listerVerificationStatus === "verified",
    preferences,
    isOwner: Boolean(data.viewerContext?.isOwner),
    listerPhone: data.listerContact?.phone,
    listerEmail: data.listerContact?.email,
    exactAddress: data.listerContact?.exactAddress ?? null,
    navigationUrl: data.listerContact?.navigationUrl ?? null,
    latitude: data.listing.latitude,
    longitude: data.listing.longitude,
    hasAcceptedAccess: Boolean(data.viewerContext?.hasAcceptedAccess)
  };
}

function ListingSummaryCard({ listing }: { listing: ListingCardVM }) {
  const moveInLabel = formatDate(listing.moveInDate);

  return (
    <Card className="listing-summary-card">
      <div className="listing-card-visual">
        <div className="listing-summary-top">
          <Badge tone={listing.status === "active" ? "success" : "warning"}>{listing.status}</Badge>
          <span>{moveInLabel}</span>
        </div>
        <div className="listing-card-overlay">
          <span className="listing-card-label">Shared living</span>
          <strong>{listing.location}</strong>
        </div>
      </div>

      <div className="listing-card-body">
        <div className="listing-card-copy">
          <h3>{listing.title}</h3>
          <p>Trust-first move-in context with clear pricing and a structured next step.</p>
        </div>

        <div className="listing-price-row">
          <div>
            <span>Monthly rent</span>
            <strong>{formatCurrency(listing.rent)}</strong>
          </div>
          <div>
            <span>Deposit</span>
            <strong>{formatCurrency(listing.deposit)}</strong>
          </div>
        </div>

        <div className="listing-trust-row">
          <Badge tone="neutral">Move-in {moveInLabel}</Badge>
          <Badge tone="primary">Marketplace verified flow</Badge>
        </div>

        <ButtonLink className="full-width" to={`/listings/${listing.id}`} tone="secondary">
          View listing
        </ButtonLink>
      </div>
    </Card>
  );
}

export function HomePage() {
  return <Homepage />;
}

export function ExplorePage() {
  const { isAuthenticated, currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [minRent, setMinRent] = useState(searchParams.get("minRent") ?? "");
  const [maxRent, setMaxRent] = useState(searchParams.get("maxRent") ?? "");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", "24");
    if (location) params.set("location", location);
    if (minRent) params.set("minRent", minRent);
    if (maxRent) params.set("maxRent", maxRent);
    return params;
  }, [location, maxRent, minRent]);

  const listingsQuery = useQuery({
    queryKey: ["listings", query.toString()],
    queryFn: () => listingsApi.list(query)
  });

  const listingCount = listingsQuery.data?.items.length ?? 0;
  const heroEyebrow = isAuthenticated ? "Marketplace workspace" : "Public marketplace";
  const heroCopy = isAuthenticated
    ? "Explore active listings as part of your live product workflow. Compare trust signals, pricing, and next steps without leaving the app shell."
    : "Browse active shared-living options with trust-first context, clean pricing, and a smoother path from discovery to conversation.";
  const helperCopy = isAuthenticated
    ? "Best for: comparing live options while you actively manage applications and chats."
    : "Best for: browsing active listings before you commit to onboarding.";
  const helperTip = isAuthenticated
    ? "Tip: open a listing to review trust context, accepted access, and the next action available to you."
    : "Tip: open a listing to review pricing, preferences, and lister context together.";

  return (
    <div className="page-shell">
      <section className="marketplace-hero">
        <div className="marketplace-hero-copy">
          <span className="section-tag">{heroEyebrow}</span>
          <h1 className="page-title marketplace-title">Explore listings</h1>
          <p className="page-description">{heroCopy}</p>
        </div>
        <div className="marketplace-hero-panel">
          <div className="marketplace-stat-grid">
            <article>
              <span>Live listings</span>
              <strong>{listingCount || "Fresh"}</strong>
            </article>
            <article>
              <span>Market tone</span>
              <strong>Trust first</strong>
            </article>
          </div>
          {isAuthenticated ? (
            <ButtonLink to={currentUser?.user.role === "admin" ? "/admin/listings" : "/my-listings"}>
              {currentUser?.user.role === "admin" ? "Review listings" : "Manage my listings"}
            </ButtonLink>
          ) : (
            <ButtonLink to="/auth/login">Sign in to interact</ButtonLink>
          )}
        </div>
      </section>

      <Card className="filter-card">
        <form
          className="filters-grid"
          onSubmit={(event) => {
            event.preventDefault();
            setSearchParams(query);
          }}
        >
          <Field label="Location">
            <Input placeholder="Bengaluru, Delhi NCR, Koramangala..." value={location} onChange={(event) => setLocation(event.target.value)} />
          </Field>
          <Field label="Min rent">
            <Input inputMode="numeric" placeholder="10000" value={minRent} onChange={(event) => setMinRent(event.target.value)} />
          </Field>
          <Field label="Max rent">
            <Input inputMode="numeric" placeholder="30000" value={maxRent} onChange={(event) => setMaxRent(event.target.value)} />
          </Field>
          <div className="row-actions">
            <Button type="submit">Apply filters</Button>
          </div>
        </form>
        <div className="filter-helper-row">
          <span>{helperCopy}</span>
          <span>{helperTip}</span>
        </div>
      </Card>

      {listingsQuery.isLoading ? <LoadingBlock label="Loading listings..." /> : null}

      {listingsQuery.isError ? (
        <EmptyState
          title="We couldn't load listings right now"
          copy="The marketplace is having trouble responding. Try again to refresh the latest listings."
          action={
            <Button onClick={() => void listingsQuery.refetch()} type="button">
              Retry listings
            </Button>
          }
        />
      ) : null}

      {!listingsQuery.isError && listingsQuery.data?.items.length ? (
        <div className="listing-grid">
          {listingsQuery.data.items.map((listing) => (
            <ListingSummaryCard key={listing._id} listing={mapListingCard(listing)} />
          ))}
        </div>
      ) : null}

      {!listingsQuery.isLoading && !listingsQuery.isError && !listingsQuery.data?.items.length ? (
        <EmptyState
          title="No listings match this filter yet"
          copy="Try a wider location or rent range. As more listers publish, the public marketplace will fill out here."
        />
      ) : null}
    </div>
  );
}

export function ListingDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, currentUser } = useAuth();
  const { pushToast } = useToast();
  const [applicationMessage, setApplicationMessage] = useState("");
  const [rejectModalState, setRejectModalState] = useState<{
    applicationId: string;
    prompt: string;
  } | null>(null);
  const [rejectionReasonDraft, setRejectionReasonDraft] = useState("");

  const listingQuery = useQuery({
    queryKey: ["listing", id, isAuthenticated],
    queryFn: () => listingsApi.get(id, isAuthenticated),
    enabled: Boolean(id)
  });

  const ownerApplicationsQuery = useQuery({
    queryKey: ["listing-applications", id],
    queryFn: () => applicationsApi.forListing(id),
    enabled: Boolean(id && listingQuery.data?.viewerContext?.isOwner),
    refetchInterval: listingQuery.data?.viewerContext?.isOwner ? 5000 : false,
    refetchOnWindowFocus: true
  });

  const myApplicationsQuery = useQuery({
    queryKey: ["my-applications"],
    queryFn: () => applicationsApi.mine(),
    enabled: Boolean(id && isAuthenticated && !listingQuery.data?.viewerContext?.isOwner),
    refetchOnWindowFocus: true
  });

  const applyMutation = useMutation({
    mutationFn: () => applicationsApi.apply(id, applicationMessage),
    onSuccess: () => {
      pushToast("Application submitted.", "success");
      setApplicationMessage("");
      void queryClient.invalidateQueries({ queryKey: ["my-applications"] });
    },
    onError: (error) => {
      pushToast(error instanceof Error ? error.message : "Unable to apply", "error");
    }
  });

  const createConversationMutation = useMutation({
    mutationFn: (participantId: string) => conversationsApi.create(participantId),
    onSuccess: (conversation) => {
      pushToast("Conversation opened.", "success");
      navigate(`/conversations/${conversation._id}`);
    },
    onError: (error) => {
      pushToast(error instanceof Error ? error.message : "Unable to start chat", "error");
    }
  });

  const applicationStatusMutation = useMutation({
    mutationFn: ({
      applicationId,
      nextStatus,
      rejectionReason
    }: {
      applicationId: string;
      nextStatus: ApplicationVM["status"];
      rejectionReason?: string;
    }) => {
      if (nextStatus === "shortlisted") return applicationsApi.shortlist(applicationId);
      if (nextStatus === "accepted") return applicationsApi.accept(applicationId);
      if (!rejectionReason?.trim()) {
        throw new Error("Add a short reason before rejecting this application.");
      }
      return applicationsApi.reject(applicationId, rejectionReason);
    },
    onSuccess: () => {
      pushToast("Application status updated.", "success");
      setRejectModalState(null);
      setRejectionReasonDraft("");
      void queryClient.invalidateQueries({ queryKey: ["listing-applications", id] });
    },
    onError: (error) => {
      pushToast(error instanceof Error ? error.message : "Unable to update application", "error");
    }
  });

  if (listingQuery.isLoading) {
    return <LoadingBlock label="Loading listing..." />;
  }

  if (listingQuery.isError) {
    return (
      <EmptyState
        title="We couldn't load this listing"
        copy="The listing detail is unavailable right now. Try again or return to the marketplace."
        action={
          <div className="row-actions">
            <Button onClick={() => void listingQuery.refetch()} type="button">
              Retry listing
            </Button>
            <ButtonLink to="/explore" tone="secondary">
              Back to explore
            </ButtonLink>
          </div>
        }
      />
    );
  }

  if (!listingQuery.data) {
    return (
      <EmptyState
        title="Listing not found"
        copy="This listing may have been removed or is no longer available."
        action={
          <ButtonLink to="/explore" tone="secondary">
            Back to explore
          </ButtonLink>
        }
      />
    );
  }

  const listing = mapListingDetail(listingQuery.data);
  const primaryImage = listing.images[0];
  const secondaryImages = listing.images.slice(1);
  const trimmedApplicationMessage = applicationMessage.trim();
  const trimmedRejectionReason = rejectionReasonDraft.trim();
  const existingApplication = myApplicationsQuery.data?.find((application) => application.listingId === id);

  return (
    <div className="page-shell">
      <Modal
        open={Boolean(rejectModalState)}
        title="Reject application"
        onClose={() => {
          if (applicationStatusMutation.isPending) return;
          setRejectModalState(null);
          setRejectionReasonDraft("");
        }}
      >
        <div className="stack-list rejection-modal-content">
          <InlineNotice tone="warning">
            Record a clear reason so the applicant understands the outcome and your review history stays useful.
          </InlineNotice>
          <Field label="Reason for rejection" hint={rejectModalState?.prompt}>
            <Textarea
              rows={4}
              placeholder="Example: We’re prioritizing applicants who can move in this week."
              value={rejectionReasonDraft}
              onChange={(event) => setRejectionReasonDraft(event.target.value)}
            />
          </Field>
          <div className="row-actions">
            <Button
              tone="danger"
              type="button"
              disabled={applicationStatusMutation.isPending || trimmedRejectionReason.length < 5 || !rejectModalState}
              onClick={() => {
                if (!rejectModalState) return;
                applicationStatusMutation.mutate({
                  applicationId: rejectModalState.applicationId,
                  nextStatus: "rejected",
                  rejectionReason: trimmedRejectionReason
                });
              }}
            >
              {applicationStatusMutation.isPending ? "Rejecting..." : "Confirm rejection"}
            </Button>
            <Button
              tone="secondary"
              type="button"
              disabled={applicationStatusMutation.isPending}
              onClick={() => {
                setRejectModalState(null);
                setRejectionReasonDraft("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <section className="listing-detail-hero">
        <div className="listing-detail-copy">
          <div className="listing-detail-badges">
            <Badge tone={listing.status === "active" ? "success" : "warning"}>{listing.status}</Badge>
            {listing.listerVerified ? <Badge tone="primary">Verified lister</Badge> : <Badge tone="neutral">Verification pending</Badge>}
          </div>
          <h1 className="page-title listing-detail-title">{listing.title}</h1>
          <p className="page-description">
            {listing.location} · Move-in {formatDate(listing.moveInDate)}
          </p>
          <div className="listing-hero-metrics">
            <article>
              <span>Rent</span>
              <strong>{formatCurrency(listing.rent)}</strong>
            </article>
            <article>
              <span>Deposit</span>
              <strong>{formatCurrency(listing.deposit)}</strong>
            </article>
            <article>
              <span>Best used for</span>
              <strong>{listing.isOwner ? "Owner control" : "Seeker decision"}</strong>
            </article>
          </div>
        </div>
        <div className="listing-detail-actions">
          {listing.isOwner ? (
            <ButtonLink to={`/listings/${listing.id}/edit`} tone="secondary">
              Edit listing
            </ButtonLink>
          ) : (
            <ButtonLink to="/explore" tone="secondary">
              Back to explore
            </ButtonLink>
          )}
        </div>
      </section>

      {listing.isOwner ? (
        <Card className="owner-review-card">
          <div className="section-heading-row">
            <div>
              <span className="section-tag">Owner review queue</span>
              <h3>Received applications</h3>
            </div>
            <Badge tone="neutral">{ownerApplicationsQuery.data?.length ?? 0} in pipeline</Badge>
          </div>
          {ownerApplicationsQuery.data?.length ? (
            <div className="stack-list">
              {ownerApplicationsQuery.data.map((application) => (
                <div key={application._id} className="mini-listing">
                  <div>
                    <strong>{application.applicantContact?.fullName || `Applicant ${application.applicantId.slice(-6)}`}</strong>
                    <p>{application.message || "No intro message shared."}</p>
                    <Badge tone={applicationStatusTone(application.status)}>{application.status}</Badge>
                    {application.status === "accepted" ? (
                      <div className="stack-list">
                        <p>{application.applicantContact?.phone ? `Phone: ${application.applicantContact.phone}` : "Phone not added yet"}</p>
                        <p>{application.applicantContact?.email ? `Email: ${application.applicantContact.email}` : "Email not added yet"}</p>
                      </div>
                    ) : null}
                  </div>
                  <div className="mini-actions">
                    {application.status === "applied" ? (
                      <>
                        <Button tone="secondary" onClick={() => applicationStatusMutation.mutate({ applicationId: application._id, nextStatus: "shortlisted" })} type="button">
                          Shortlist
                        </Button>
                        <Button onClick={() => applicationStatusMutation.mutate({ applicationId: application._id, nextStatus: "accepted" })} type="button">
                          Accept
                        </Button>
                        <Button
                          tone="danger"
                          onClick={() => {
                            setRejectModalState({
                              applicationId: application._id,
                              prompt: "Share why this applicant is not moving forward."
                            });
                            setRejectionReasonDraft("");
                          }}
                          type="button"
                        >
                          Reject
                        </Button>
                      </>
                    ) : null}
                    {application.status === "shortlisted" ? (
                      <>
                        <Button onClick={() => applicationStatusMutation.mutate({ applicationId: application._id, nextStatus: "accepted" })} type="button">
                          Accept
                        </Button>
                        <Button
                          tone="danger"
                          onClick={() => {
                            setRejectModalState({
                              applicationId: application._id,
                              prompt: "Share why this shortlisted applicant is no longer moving forward."
                            });
                            setRejectionReasonDraft("");
                          }}
                          type="button"
                        >
                          Reject
                        </Button>
                      </>
                    ) : null}
                    {application.status === "accepted" ? (
                      <>
                        {application.applicantContact?.phone ? (
                          <a className="button button-secondary" href={`tel:${application.applicantContact.phone}`}>
                            Call applicant
                          </a>
                        ) : null}
                        {application.applicantContact?.email ? (
                          <a className="button button-secondary" href={`mailto:${application.applicantContact.email}`}>
                            Email applicant
                          </a>
                        ) : null}
                        <Button
                          tone="secondary"
                          disabled={createConversationMutation.isPending}
                          onClick={() => createConversationMutation.mutate(application.applicantId)}
                          type="button"
                        >
                          Continue in chat
                        </Button>
                      </>
                    ) : null}
                    {application.status === "rejected" ? (
                      <div className="stack-list">
                        <span>Decision recorded</span>
                        <p>{application.rejectionReason ? `Reason: ${application.rejectionReason}` : "No rejection reason recorded."}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No applications yet. Once seekers apply, you’ll review them here and move the strongest fit forward.</p>
          )}
        </Card>
      ) : null}

      <div className="detail-grid">
        <Card className="detail-card">
          <div className="listing-gallery">
            {primaryImage ? (
              <div className="detail-image detail-image-primary">
                <img alt={listing.title} src={primaryImage} />
              </div>
            ) : (
              <div className="detail-image detail-image-placeholder detail-image-primary">No images uploaded yet</div>
            )}

            {secondaryImages.length ? (
              <div className="image-strip">
                {secondaryImages.map((image) => (
                  <div key={image} className="detail-image detail-image-secondary">
                    <img alt={listing.title} src={image} />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="detail-section">
            <div className="section-heading-row">
              <h3>Why this listing feels credible</h3>
              <Badge tone="neutral">Move-in clarity</Badge>
            </div>
            <p>{listing.description}</p>
            <div className="detail-metrics">
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
            </div>
          </div>

          <div className="detail-section">
            <div className="section-heading-row">
              <h3>Household context</h3>
              <Badge tone="primary">Preference summary</Badge>
            </div>
            <ul className="chip-list">
              {listing.preferences.map((preference) => (
                <li key={preference}>
                  <Badge tone="neutral">{preference}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <div className="side-stack">
          <Card className="identity-card">
            <span className="section-tag">Lister profile</span>
            <h3>{listing.listerName}</h3>
            {listing.listerOccupation ? <p className="identity-role">{listing.listerOccupation}</p> : null}
            {listing.listerBio ? <p>{listing.listerBio}</p> : <p>Profile details will help you decide if the household dynamic feels right.</p>}
            <div className="identity-trust-row">
              {listing.listerVerified ? <Badge tone="primary">Verified</Badge> : <Badge tone="neutral">Verification pending</Badge>}
              <Badge tone="neutral">{listing.isOwner ? "Your listing" : "Public profile view"}</Badge>
            </div>
          </Card>

          {!listing.isOwner ? (
            <Card className="action-card">
              <span className="section-tag">Next step</span>
              <h3>Take the next step</h3>
              {!isAuthenticated ? (
                <>
                  <p>Sign in to apply, message the lister, and save your shared-living flow in one place.</p>
                  <ButtonLink to="/auth/login">Sign in to continue</ButtonLink>
                </>
              ) : existingApplication ? (
                <>
                  <InlineNotice tone={applicationNoticeTone(existingApplication.status)}>
                    {existingApplication.status === "accepted"
                      ? "Your request was accepted. Continue with the lister in chat or review the accepted application details."
                      : existingApplication.status === "shortlisted"
                        ? "The lister shortlisted your request. Stay responsive and keep the conversation active."
                        : existingApplication.status === "rejected"
                          ? "This request was declined. Review your application history and explore other listings."
                          : "You already applied to this listing. Track progress and next steps from your applications workspace."}
                  </InlineNotice>
                  <div className="stack-list">
                    <div className="mini-listing">
                      <div>
                        <strong>Application status</strong>
                        <p>{existingApplication.message || "Your intro was submitted successfully."}</p>
                        <Badge tone={applicationStatusTone(existingApplication.status)}>{existingApplication.status}</Badge>
                        {existingApplication.status === "rejected" ? (
                          <p>{existingApplication.rejectionReason ? `Reason: ${existingApplication.rejectionReason}` : "No rejection reason shared yet."}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="stack-actions">
                    {existingApplication.status !== "accepted" ? (
                      <ButtonLink to="/applications">View my application</ButtonLink>
                    ) : null}
                    {existingApplication.status !== "rejected" ? (
                      <Button
                        tone="secondary"
                        disabled={!currentUser?.eligibility.eligible || createConversationMutation.isPending}
                        onClick={() => createConversationMutation.mutate(listingQuery.data.listing.createdBy)}
                        type="button"
                      >
                        {existingApplication.status === "accepted" ? "Continue in chat" : "Start chat"}
                      </Button>
                    ) : null}
                  </div>
                  {existingApplication.status === "accepted" && listing.hasAcceptedAccess ? (
                    <div className="stack-list">
                      <div className="mini-listing">
                        <div>
                          <strong>Owner contact unlocked</strong>
                          <p>{listing.listerPhone ? `Phone: ${listing.listerPhone}` : "Phone not added yet"}</p>
                          <p>{listing.listerEmail ? `Email: ${listing.listerEmail}` : "Email not added yet"}</p>
                          <p>{listing.exactAddress ? `Property address: ${listing.exactAddress}` : "Property address not added yet"}</p>
                        </div>
                        <MapPreview latitude={listing.latitude} longitude={listing.longitude} label="Property map view" />
                        <div className="mini-actions">
                          {listing.listerPhone ? (
                            <a className="button button-secondary" href={`tel:${listing.listerPhone}`}>
                              Call owner
                            </a>
                          ) : null}
                          {listing.listerEmail ? (
                            <a className="button button-secondary" href={`mailto:${listing.listerEmail}`}>
                              Email owner
                            </a>
                          ) : null}
                          {listing.navigationUrl ? (
                            <a className="button" href={listing.navigationUrl} target="_blank" rel="noreferrer">
                              Navigate to property
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  {!currentUser?.eligibility.eligible ? (
                    <InlineNotice tone="warning">
                      Complete your profile and add a profile image before applying or starting chat.
                    </InlineNotice>
                  ) : null}
                  <Field label="Intro message">
                    <Textarea
                      placeholder="Tell the lister why this looks like a fit for your move."
                      value={applicationMessage}
                      onChange={(event) => setApplicationMessage(event.target.value)}
                    />
                  </Field>
                  <InlineNotice tone="info">
                    Add a short intro message so the lister understands your intent before you join their review queue.
                  </InlineNotice>
                  <div className="stack-actions">
                    <Button
                      disabled={!currentUser?.eligibility.eligible || applyMutation.isPending || trimmedApplicationMessage.length < 10}
                      onClick={() => applyMutation.mutate()}
                      type="button"
                    >
                      {applyMutation.isPending ? "Applying..." : "Apply to listing"}
                    </Button>
                    <Button
                      tone="secondary"
                      disabled={!currentUser?.eligibility.eligible || createConversationMutation.isPending}
                      onClick={() => createConversationMutation.mutate(listingQuery.data.listing.createdBy)}
                      type="button"
                    >
                      Start chat
                    </Button>
                  </div>
                </>
              )}
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
