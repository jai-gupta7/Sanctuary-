import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { listingsApi } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { ListingRecord } from "../lib/types";

type ProblemCard = {
  icon: string;
  title: string;
  copy: string;
};

type JourneyStep = {
  icon: string;
  title: string;
  copy: string;
};

type TrustCard = {
  icon: string;
  title: string;
  copy: string;
};

type PreviewListing = {
  id?: string;
  title: string;
  locality: string;
  rent: string;
  moveIn: string;
  image?: string | null;
  match: string;
  vibe: string;
  chips: string[];
};

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCUyx2Eoyu8jRJAAklfzt6jMTm7ZqgNOZYcJhRpc9E5YPmiicmuI5TdHIxvge-6dlsWn-l3P5yfYh0pZJg8Ll_X9LYvLfZywwCkR2uZQONmGw-5OgW5W-A7qexsy6Ek-M-SVKio8NLoE4LgS5E_ysfKjZwfkCc3HjGvzoIf5F-uIv7CMLQXdYiy3CiEXFlzCkaj9AxYdWC-OHp_H0CEgxFltWeG1ogCDquSyI4Goc8GO4ycgLfz9xT8iXf4IgbvwokTr7Vg3y6p-j0";

const fallbackImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAlgo5L3GTTMQr6-2CwlHA-rnME9Oks3iuFbsfYSoYBYZwCIMlWWRJqy7VgRDFNk4LiTF6aC_3tJ0ONrvwG8R9XIwJ5e4F7-BvRfZ0HVXFyxBtYxwBF3HL6dtkARFAacPjWiV9zxlaKbwsfh9PZYTEdu6N8djxyRhoDz2my5P9N-0pO4OP7XVQsTaC73PiGbIXWGHqlgqCApe2JPWSau80fbxN7quoJYLIgCiuWYDEr702fWCvkZ6YGgXMOKTXr9jAq8utst-eu-bs",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAqv-BmiMLsrXspTl0ohbaMDz5qRQs3HwluuNRIWBZuzeXdIfnyjv1LkgioNKnk_LLlYHuyFz5epFUdXFsAuOFmiLosodU-WHJftRdLj7OEwgB19qHItCx1d4CMPKudSq3DVx75L1yM1XORTisraopfxWlJPXbxCrdEesYOufSeeXdrrXFCW2uH5Y2YzJ9oBa6HKdcFMSbNNzrrJB6u6IrUH2yRBVQiIePBoacpr9W8MBVbuKVXSoauGch_Lu2IWebflKu8DEWvSq0",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuABcMIYWK-ePA6cODyBmICQw-FbftiNvoCU2BzcF2H6fpprZXREWKj6SD3UuBi76Tv862_i7x9kofOt-qB8r5_R7dQkiu-4QBMQPZ_bt642yjHcAb_VMfr58iCQYGb35SEuz5jg3fzABCwobQXoUa6Kd4SEyFN60AIOCm643Di05Fu2IpAyyGg75TSNARkv3vcDa78BlksxlQvOabu6mLB0qe4pWwJ9N0m3RaAkaZWr9FeZwwXfwcPmfQtCY4IwFTYyI3L2jeOdjXg"
];

const problemCards: ProblemCard[] = [
  {
    icon: "image_not_supported",
    title: "Listings lack context",
    copy: "Photos of empty rooms don't tell you how people actually live or if your routines clash."
  },
  {
    icon: "forum",
    title: "WhatsApp chaos",
    copy: "Endless unorganized chats, lost details, and ghosting make the search exhausting."
  },
  {
    icon: "timer",
    title: "Stressful replacements",
    copy: "Finding a reliable replacement when someone leaves is a high-pressure gamble."
  }
];

const journeySteps: JourneyStep[] = [
  {
    icon: "search",
    title: "Step 1",
    copy: "Browse structured listings"
  },
  {
    icon: "compare_arrows",
    title: "Step 2",
    copy: "Compare compatibility"
  },
  {
    icon: "edit_document",
    title: "Step 3",
    copy: "Apply with short intro"
  },
  {
    icon: "checklist",
    title: "Step 4",
    copy: "Owner shortlists serious applicants"
  },
  {
    icon: "lock_open",
    title: "Step 5",
    copy: "Contact unlocks only after acceptance"
  },
  {
    icon: "check_circle",
    title: "Step 6",
    copy: "Move forward with clarity"
  }
];

const trustCards: TrustCard[] = [
  {
    icon: "phonelink_lock",
    title: "Phone OTP Login",
    copy: "Real numbers only to eliminate spam accounts."
  },
  {
    icon: "verified",
    title: "Verified Indicators",
    copy: "Clear signals when profiles have completed verification checks."
  },
  {
    icon: "chat_bubble_off",
    title: "No Random Chats",
    copy: "Structured applications replace chaotic and unsolicited messaging."
  },
  {
    icon: "key",
    title: "Contact Unlock",
    copy: "Location and contact details are only revealed after accepting an application."
  },
  {
    icon: "assignment_ind",
    title: "Profile Completion",
    copy: "Mandatory fields ensure everyone provides enough context."
  },
  {
    icon: "admin_panel_settings",
    title: "Admin Moderation",
    copy: "Active review to maintain quality and community standards."
  }
];

const fallbackListings: PreviewListing[] = [
  {
    title: "Modern Master Bedroom",
    locality: "Koramangala",
    rent: "INR 28,000",
    moveIn: "Immediate",
    image: fallbackImages[0],
    match: "92% Match",
    vibe: "Quiet working professionals",
    chips: ["Quiet", "Vegetarian"]
  },
  {
    title: "Spacious Room in 3BHK",
    locality: "Indiranagar",
    rent: "INR 32,000",
    moveIn: "Nov 1",
    image: fallbackImages[1],
    match: "88% Match",
    vibe: "Social but weekday-focused",
    chips: ["Social", "WFH Friendly"]
  },
  {
    title: "Cozy Room for Female",
    locality: "HSR Layout",
    rent: "INR 22,000",
    moveIn: "Oct 15",
    image: fallbackImages[2],
    match: "85% Match",
    vibe: "Quiet working professionals",
    chips: ["Early sleeper", "No parties"]
  }
];

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
    month: "short"
  }).format(new Date(value));
}

function mapListingPreview(listing: ListingRecord, index: number): PreviewListing {
  const chips = [
    listing.compatibilityProfile?.socialVibe,
    listing.compatibilityProfile?.wfhFriendly,
    listing.compatibilityProfile?.cleanlinessLevel,
    listing.idealFlatmateProfile?.preferredPersonality
  ]
    .filter(Boolean)
    .slice(0, 2)
    .map((chip) => String(chip).replace(/_/g, " "));

  return {
    id: listing._id,
    title: listing.title,
    locality: listing.propertyDetails?.city || listing.locationText,
    rent: formatCurrency(listing.rent),
    moveIn: formatDate(listing.moveInDate),
    image: listing.coverImageUrl || fallbackImages[index % fallbackImages.length],
    match: `${92 - index * 4}% Match`,
    vibe: listing.idealFlatmateProfile?.bestSuitedFor || "Compatibility details included",
    chips: chips.length ? chips : ["Structured", "Verified flow"]
  };
}

function Icon({ name }: { name: string }) {
  return (
    <span className="material-symbols-outlined" aria-hidden="true">
      {name}
    </span>
  );
}

export function Homepage() {
  const { isAuthenticated } = useAuth();
  const createListingTo = isAuthenticated ? "/listings/new" : "/auth/login";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);

  const closeMobileMenu = useCallback(() => {
    setDrawerClosing(true);
    setTimeout(() => {
      setMobileMenuOpen(false);
      setDrawerClosing(false);
    }, 200);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const previewQuery = useQuery({
    queryKey: ["homepage-listing-preview"],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "3");
      return listingsApi.list(params);
    },
    staleTime: 60_000,
    retry: false
  });

  const liveListings = previewQuery.data?.items.slice(0, 3).map(mapListingPreview) ?? [];
  const listings = liveListings.length ? liveListings : fallbackListings;

  return (
    <div className="kin-home">
      <header className="kin-nav">
        <Link className="kin-logo" to="/">
          Shared Living OS
        </Link>
        <nav className="kin-nav-links" aria-label="Primary">
          <Link className="kin-nav-active" to="/explore">
            Explore
          </Link>
          <Link to={createListingTo}>List a Home</Link>
        </nav>
        <Link className="kin-login" to={isAuthenticated ? "/dashboard" : "/auth/login"}>
          {isAuthenticated ? "Dashboard" : "Login"}
        </Link>
        <button
          className="kin-mobile-menu-btn"
          aria-label="Open menu"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Icon name="menu" />
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="kin-mobile-drawer" {...(drawerClosing ? { "data-closing": "" } : {})}>
          <div className="kin-drawer-header">
            <span className="kin-logo">Shared Living OS</span>
            <button className="kin-mobile-menu-btn" aria-label="Close menu" onClick={closeMobileMenu}>
              <Icon name="close" />
            </button>
          </div>
          <nav className="kin-drawer-links" aria-label="Mobile navigation">
            <Link to="/explore" onClick={closeMobileMenu}>
              <Icon name="search" />
              Explore Listings
            </Link>
            <Link to={createListingTo} onClick={closeMobileMenu}>
              <Icon name="add_home" />
              List a Home
            </Link>
            <Link to={isAuthenticated ? "/dashboard" : "/auth/login"} onClick={closeMobileMenu}>
              <Icon name={isAuthenticated ? "dashboard" : "login"} />
              {isAuthenticated ? "Dashboard" : "Login"}
            </Link>
          </nav>
          <div className="kin-drawer-cta">
            <Link className="kin-btn kin-btn-primary" to="/explore" onClick={closeMobileMenu}>
              Explore Listings
            </Link>
          </div>
        </div>
      )}

      <main>
        <section className="kin-hero">
          <div className="kin-hero-copy">
            <h1>Find flatmates you'll actually live well with.</h1>
            <p>
              Structured matching, verified profiles, and guided move-in so you don't have to guess who you're living with.
            </p>
            <div className="kin-actions">
              <Link className="kin-btn kin-btn-primary" to="/explore">
                Explore Listings
              </Link>
              <Link className="kin-btn kin-btn-secondary" to={createListingTo}>
                Create Listing
              </Link>
            </div>
            <div className="kin-compat-pill">
              <Icon name="verified" />
              <span>92% compatibility based on lifestyle</span>
            </div>
            <small>Built for real-life compatibility, not just availability.</small>
          </div>

          <div className="kin-hero-media">
            <img alt="Modern shared apartment interior" src={heroImage} />
            <div className="kin-match-card">
              <div className="kin-match-score">92%</div>
              <div>
                <strong>Compatibility Match</strong>
                <span>Based on lifestyle preferences</span>
              </div>
            </div>
          </div>

          <div className="kin-hero-mobile-image">
            <img alt="Modern shared apartment interior" src={heroImage} />
            <div className="kin-match-card">
              <div className="kin-match-score">92%</div>
              <div>
                <strong>Compatibility Match</strong>
                <span>Based on lifestyle preferences</span>
              </div>
            </div>
          </div>
        </section>

        <section className="kin-quote-section">
          <p>
            "Shared living doesn't fail because of homes—it fails
            because of <em>mismatched people</em>, <em>unclear expectations</em>,
            and <em>rushed decisions</em>."
          </p>
        </section>

        <section className="kin-section kin-problems-section">
          <div className="kin-section-heading">
            <h2>The old way is broken.</h2>
          </div>
          <div className="kin-problem-grid">
            {problemCards.map((card) => (
              <article className="kin-info-card" key={card.title}>
                <Icon name={card.icon} />
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Mobile Featured Listing Card (shown only on mobile, between quote and How It Works) */}
        <section className="kin-mobile-featured">
          <div>
            <h2>Listings That Matter</h2>
            <p>Handpicked for your preference.</p>
          </div>
          <article className="kin-mobile-featured-card">
            <div className="kin-mobile-featured-image">
              <img alt="Sunny room in Indiranagar" src={fallbackImages[1]} />
              <span className="kin-mobile-featured-badge">
                <Icon name="bolt" />
                95% Match
              </span>
            </div>
            <div className="kin-mobile-featured-body">
              <div className="kin-mobile-featured-meta">
                <div>
                  <h3>Sunny Room in Indiranagar</h3>
                  <p>Quiet working professionals</p>
                </div>
                <div className="kin-mobile-featured-price">
                  <strong>₹22,000</strong>
                  <span>/ month</span>
                </div>
              </div>
              <div className="kin-mobile-featured-chips">
                <span className="kin-chip-green">Vegetarian</span>
                <span className="kin-chip-amber">Early Riser</span>
                <span className="kin-chip-neutral">No Pets</span>
              </div>
              <Link className="kin-btn kin-btn-primary kin-btn-full" to="/explore">
                View Full Compatibility
              </Link>
            </div>
          </article>
        </section>

        <section className="kin-section kin-work-section">
          <div className="kin-section-heading">
            <h2>How It Works</h2>
            <p>A structured path to finding your next home.</p>
          </div>
          <div className="kin-journey-wrap">
            <div className="kin-journey-line" />
            <div className="kin-journey">
              {journeySteps.map((step, index) => (
                <article className="kin-step" key={step.title}>
                  <div className={`kin-step-icon${index === 0 || index === journeySteps.length - 1 ? " kin-step-active" : ""}`}>
                    <Icon name={step.icon} />
                  </div>
                  <strong>{step.title}</strong>
                  <span>{step.copy}</span>
                </article>
              ))}
            </div>
          </div>
          <div className="kin-journey-mobile">
            {journeySteps.map((step, index) => (
              <div className="kin-jm-step" key={step.title}>
                <div className={`kin-jm-circle${index === 4 ? " kin-jm-circle-lock" : ""}`}>
                  {index === 4 ? (
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: "20px" }}>lock</span>
                  ) : (
                    <span className="kin-jm-num">{index + 1}</span>
                  )}
                </div>
                <div className="kin-jm-text">
                  <h4>{step.copy}</h4>
                  <p>{step.title === "Step 1" ? "Find homes that list rules and lifestyles clearly from day one."
                    : step.title === "Step 2" ? "See exactly where you align and where you might need to compromise."
                    : step.title === "Step 3" ? "Send a focused application that highlights your living habits."
                    : step.title === "Step 4" ? "No noise. Owners only review serious applicants who match the vibe."
                    : step.title === "Step 5" ? "Privacy first. Personal details are shared only after mutual interest."
                    : "The final handshake is easier when you've already verified the fit."}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="kin-listing-difference">
          <div>
            <h2>Listings that actually tell you what matters.</h2>
            <p>
              Better input leads to better matches. We capture the lifestyle details you need to know before moving in
              together.
            </p>
          </div>
          <article className="kin-feature-listing">
            <div className="kin-feature-top">
              <div>
                <h3>Sunny Room in Indiranagar</h3>
                <p>Move-in: Oct 1st - INR 25,000/mo</p>
              </div>
              <span>
                <Icon name="bolt" />
                95% Match
              </span>
            </div>
            <div className="kin-feature-grid">
              <div>
                <small>Flat vibe</small>
                <strong>Quiet working professionals</strong>
              </div>
              <div>
                <small>Household lifestyle</small>
                <div className="kin-chip-row">
                  <span>Quiet weekdays</span>
                  <span>WFH Friendly</span>
                </div>
              </div>
              <div>
                <small>Ideal flatmate</small>
                <div className="kin-chip-row">
                  <span>Early sleeper</span>
                  <span>Clean and tidy</span>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="kin-section kin-trust-section">
          <div className="kin-section-heading">
            <small>How trust works</small>
            <h2>Trust isn't assumed. It's structured.</h2>
            <p>
              Safety and privacy aren't afterthoughts. Our system ensures you only connect with serious, verified individuals.
            </p>
          </div>
          <div className="kin-trust-grid">
            {trustCards.map((card) => (
              <article className="kin-trust-card" key={card.title}>
                <Icon name={card.icon} />
                <div>
                  <h3>{card.title}</h3>
                  <p>{card.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="kin-replacement">
          <h2>Flatmate replacement, without last‑minute panic.</h2>
          <p>Structured applications, faster filtering, and better decisions when time matters.</p>
          <div className="kin-check-panel">
            <p>
              <Icon name="check_circle" />
              Structured applications mean less back-and-forth.
            </p>
            <p>
              <Icon name="check_circle" />
              Faster filtering to find people who actually match your vibe.
            </p>
            <p>
              <Icon name="check_circle" />
              Better decisions even under time pressure.
            </p>
          </div>
          <Link className="kin-learn-more" to="/explore">
            Learn more <Icon name="arrow_forward" />
          </Link>
        </section>

        <section className="kin-section kin-recently-section">
          <div className="kin-section-heading">
            <h2>Recently Listed</h2>
            <p>Discover homes curated for compatibility.</p>
          </div>
          {previewQuery.isError ? (
            <p className="kin-preview-note">Marketplace preview is taking a moment. You can still explore listings.</p>
          ) : null}
          <div className="kin-preview-grid">
            {listings.map((listing) => {
              const content = (
                <>
                  <div className="kin-preview-image">
                    {listing.image ? <img alt="" src={listing.image} /> : null}
                    <span>
                      <Icon name="bolt" />
                      {listing.match}
                    </span>
                  </div>
                  <div className="kin-preview-body">
                    <small>{listing.locality}</small>
                    <h3>{listing.title}</h3>
                    <p>{listing.vibe}</p>
                    <div className="kin-chip-row">
                      {listing.chips.map((chip) => (
                        <span key={chip}>{chip}</span>
                      ))}
                    </div>
                    <div className="kin-card-footer">
                      <strong>
                        {listing.rent} <small>/mo</small>
                      </strong>
                      <em>{listing.moveIn}</em>
                    </div>
                  </div>
                </>
              );

              return listing.id ? (
                <Link className="kin-preview-card" key={listing.id} to={`/listings/${listing.id}`}>
                  {content}
                </Link>
              ) : (
                <article className="kin-preview-card" key={listing.title}>
                  {content}
                </article>
              );
            })}
          </div>
        </section>

        <section className="kin-final-cta">
          <h2>Find your next flatmate—without the guesswork.</h2>
          <p>Browse compatible homes or list your space with clarity from day one.</p>
          <div className="kin-actions kin-actions-center">
            <Link className="kin-btn kin-btn-light" to="/explore">
              Explore Listings
              <Icon name="arrow_forward" />
            </Link>
            <Link className="kin-btn kin-btn-outline-light" to={createListingTo}>
              Create a Listing
              <Icon name="arrow_forward" />
            </Link>
          </div>
          <small>No spam. No random chats. Only relevant people who match your lifestyle.</small>
        </section>
      </main>

      <footer className="kin-footer">
        <div>
          <strong>Shared Living OS</strong>
          <p>Structured harmony for discerning professionals.</p>
        </div>
        <nav aria-label="Footer">
          <Link to="/">About</Link>
          <Link to="/explore">Safety</Link>
          <Link to="/">Community Rules</Link>
          <Link to="/">Privacy</Link>
          <Link to="/">Terms</Link>
        </nav>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="kin-bottom-nav" aria-label="Mobile tab bar">
        <Link to="/explore" className="kin-bottom-tab kin-bottom-tab-active">
          <Icon name="explore" />
          <span>Explore</span>
        </Link>
        <Link to="/dashboard" className="kin-bottom-tab">
          <Icon name="diversity_3" />
          <span>Matches</span>
        </Link>
        <Link to="/dashboard" className="kin-bottom-tab">
          <Icon name="chat_bubble" />
          <span>Messages</span>
        </Link>
        <Link to={isAuthenticated ? "/dashboard" : "/auth/login"} className="kin-bottom-tab">
          <Icon name="account_circle" />
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}
