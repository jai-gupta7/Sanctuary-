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
  return (
    <Card className="listing-summary-card">
      <div className="listing-summary-top">
        <Badge tone={listing.status === "active" ? "success" : "warning"}>{listing.status}</Badge>
        <span>{formatDate(listing.moveInDate)}</span>
      </div>
      <h3>{listing.title}</h3>
      <p>{listing.location}</p>
      <div className="listing-metrics">
        <strong>{formatCurrency(listing.rent)}</strong>
        <span>Deposit {formatCurrency(listing.deposit)}</span>
      </div>
      <ButtonLink className="full-width" to={`/listings/${listing.id}`} tone="secondary">
        View listing
      </ButtonLink>
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

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Public marketplace"
        title="Explore listings"
        description="Browse active shared-living options with trust-first listing details and clear move-in context."
        actions={<ButtonLink to="/auth/login">Sign in to interact</ButtonLink>}
      />

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
        <div className="card-grid">
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
    enabled: Boolean(id && listingQuery.data?.viewerContext?.isOwner)
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

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Listing detail"
        title={listing.title}
        description={`${listing.location} · Move-in ${formatDate(listing.moveInDate)}`}
        actions={
          listing.isOwner ? (
            <ButtonLink to={`/listings/${listing.id}/edit`} tone="secondary">
              Edit listing
            </ButtonLink>
          ) : (
            <ButtonLink to="/explore" tone="secondary">
              Back to explore
            </ButtonLink>
          )
        }
      />

      <div className="detail-grid">
        <Card className="detail-card">
          <div className="image-strip">
            {listing.images.length ? (
              listing.images.map((image) => (
                <div key={image} className="detail-image">
                  <img alt={listing.title} src={image} />
                </div>
              ))
            ) : (
              <div className="detail-image detail-image-placeholder">No images uploaded yet</div>
            )}
          </div>

          <div className="detail-section">
            <div className="listing-summary-top">
              <Badge tone={listing.status === "active" ? "success" : "warning"}>{listing.status}</Badge>
              {listing.listerVerified ? <Badge tone="primary">Verified lister</Badge> : <Badge tone="neutral">Verification pending</Badge>}
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
            <h3>Household context</h3>
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
          <Card>
            <h3>{listing.listerName}</h3>
            {listing.listerOccupation ? <p>{listing.listerOccupation}</p> : null}
            {listing.listerBio ? <p>{listing.listerBio}</p> : null}
          </Card>

          {listing.isOwner ? (
            <Card>
              <h3>Received applications</h3>
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
                <p>No applications yet.</p>
              )}
            </Card>
          ) : (
            <Card>
              <h3>Take the next step</h3>
              {!isAuthenticated ? (
                <>
                  <p>Sign in to apply, message the lister, and save your shared-living flow in one place.</p>
                  <ButtonLink to="/auth/login">Sign in to continue</ButtonLink>
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
                  <div className="stack-actions">
                    <Button
                      disabled={!currentUser?.eligibility.eligible || applyMutation.isPending}
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
          )}
        </div>
      </div>
    </div>
  );
}
