import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { Homepage } from "../components/homepage";
import { Badge, Button, ButtonLink, Card, EmptyState, Field, InlineNotice, Input, LoadingBlock, PageHeader, Textarea } from "../components/ui";
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
    isOwner: Boolean(data.viewerContext?.isOwner)
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

  return (
    <div className="page-shell">
      <section className="marketplace-hero">
        <div className="marketplace-hero-copy">
          <span className="section-tag">Public marketplace</span>
          <h1 className="page-title marketplace-title">Explore listings</h1>
          <p className="page-description">
            Browse active shared-living options with trust-first context, clean pricing, and a smoother path from discovery to conversation.
          </p>
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
          <ButtonLink to="/auth/login">Sign in to interact</ButtonLink>
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
          <span>Best for: browsing active listings before you commit to onboarding.</span>
          <span>Tip: open a listing to review pricing, preferences, and lister context together.</span>
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
    mutationFn: ({ applicationId, nextStatus }: { applicationId: string; nextStatus: ApplicationVM["status"] }) => {
      if (nextStatus === "shortlisted") return applicationsApi.shortlist(applicationId);
      if (nextStatus === "accepted") return applicationsApi.accept(applicationId);
      return applicationsApi.reject(applicationId);
    },
    onSuccess: () => {
      pushToast("Application status updated.", "success");
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
  const existingApplication = myApplicationsQuery.data?.find((application) => application.listingId === id);

  return (
    <div className="page-shell">
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
                    <strong>Applicant {application.applicantId.slice(-6)}</strong>
                    <p>{application.message || "No intro message shared."}</p>
                    <Badge tone="neutral">{application.status}</Badge>
                  </div>
                  <div className="mini-actions">
                    <Button tone="secondary" onClick={() => applicationStatusMutation.mutate({ applicationId: application._id, nextStatus: "shortlisted" })} type="button">
                      Shortlist
                    </Button>
                    <Button onClick={() => applicationStatusMutation.mutate({ applicationId: application._id, nextStatus: "accepted" })} type="button">
                      Accept
                    </Button>
                    <Button tone="danger" onClick={() => applicationStatusMutation.mutate({ applicationId: application._id, nextStatus: "rejected" })} type="button">
                      Reject
                    </Button>
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
                  <InlineNotice tone="success">
                    You already applied to this listing. Track progress and next steps from your applications workspace.
                  </InlineNotice>
                  <div className="stack-list">
                    <div className="mini-listing">
                      <div>
                        <strong>Application status</strong>
                        <p>{existingApplication.message || "Your intro was submitted successfully."}</p>
                        <Badge tone="primary">{existingApplication.status}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="stack-actions">
                    <ButtonLink to="/applications">View my application</ButtonLink>
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
