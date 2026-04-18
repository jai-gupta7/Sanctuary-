type Feature = {
  title: string;
  copy: string;
  icon: string;
};

type StoryCard = {
  title: string;
  copy: string;
};

const features: Feature[] = [
  {
    icon: "✓",
    title: "Verified Profiles",
    copy: "Talk to real people with stronger trust signals before you invest time or money."
  },
  {
    icon: "◎",
    title: "Smart Matching",
    copy: "Find people who fit your routines, habits, and house expectations, not just your budget."
  },
  {
    icon: "₹",
    title: "Secure Payments",
    copy: "Future-ready money flows help deposits and shared costs feel more visible and less awkward."
  },
  {
    icon: "⌂",
    title: "Easy Living Management",
    copy: "Move in with less confusion and keep the home coordinated once the decision is made."
  }
];

const painPoints: StoryCard[] = [
  {
    title: "Listings are scattered everywhere",
    copy: "You jump between group chats, brokers, stories, and outdated apps just to see what is actually available."
  },
  {
    title: "Trust is too thin",
    copy: "You are asked to make a life-impacting decision without enough confidence in who you are talking to."
  },
  {
    title: "Urgency ruins good decisions",
    copy: "When someone leaves a flat, speed takes over and compatibility becomes an afterthought."
  },
  {
    title: "Money creates stress fast",
    copy: "Deposits, rent timing, and shared expenses turn simple coordination into uncomfortable friction."
  }
];

const steps = [
  "Create your profile",
  "Browse matching homes",
  "Compare trust + fit",
  "Connect instantly",
  "Move in smoothly"
];

const cities = [
  {
    name: "Delhi NCR",
    stat: "Fast replacement demand",
    copy: "Ideal for high-churn neighborhoods where people need trusted options quickly."
  },
  {
    name: "Bengaluru",
    stat: "Strong shared-living density",
    copy: "Built for students and professionals navigating constant move-ins and flatmate changes."
  }
];

function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#hero" aria-label="Shared Living OS homepage">
          <span className="brand-badge">S</span>
          <span className="brand-text">
            <strong>Shared Living OS</strong>
            <small>Find your people, faster</small>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="Primary">
          <a href="#problem">Problem</a>
          <a href="#solution">Solution</a>
          <a href="#features">Features</a>
          <a href="#cta">Get Started</a>
        </nav>

        <div className="header-actions">
          <a className="button button-secondary" href="#cta">
            List Your Room
          </a>
          <a className="button button-primary desktop-primary" href="#cta">
            Find Flatmates
          </a>
        </div>
      </header>

      <main>
        <section className="hero-section" id="hero">
          <div className="hero-copy">
            <div className="eyebrow-row">
              <span className="eyebrow-badge">Verified shared-living platform</span>
              <span className="eyebrow-note">Delhi NCR + Bengaluru</span>
            </div>

            <h1>Find the right flatmates. Not just any flat.</h1>
            <p className="hero-subcopy">
              Verified people. Better matches. No chaos during move-ins. Shared
              Living OS is designed to make shared living feel like a smart
              decision, not a rushed compromise.
            </p>

            <div className="hero-buttons">
              <a className="button button-primary" href="#cta">
                Find Flatmates
              </a>
              <a className="button button-tertiary" href="#solution">
                See how it works
              </a>
            </div>

            <div className="hero-stats">
              <article>
                <strong>500+</strong>
                <span>users exploring smarter shared living</span>
              </article>
              <article>
                <strong>92% fit</strong>
                <span>sample compatibility snapshot</span>
              </article>
              <article>
                <strong>No broker chaos</strong>
                <span>clearer decisions from day one</span>
              </article>
            </div>
          </div>

          <div className="hero-product">
            <div className="product-card phone-shell">
              <div className="phone-top">
                <span className="phone-pill">Best match today</span>
                <span className="phone-time">8 min ago</span>
              </div>

              <div className="listing-card">
                <div className="listing-image">
                  <div className="listing-chip">Verified household</div>
                  <div className="listing-chip alt-chip">Immediate move-in</div>
                </div>

                <div className="listing-details">
                  <div>
                    <h2>Koramangala 3BHK</h2>
                    <p>2 working professionals · Fully furnished · ₹17k/month</p>
                  </div>

                  <div className="match-meter">
                    <div className="meter-head">
                      <strong>92% compatibility</strong>
                      <span>Excellent fit</span>
                    </div>
                    <div className="meter-bar">
                      <span />
                    </div>
                  </div>

                  <div className="signal-grid">
                    <div>
                      <strong>Trust</strong>
                      <span>ID + work verified</span>
                    </div>
                    <div>
                      <strong>Lifestyle</strong>
                      <span>Clean home, early sleepers</span>
                    </div>
                    <div>
                      <strong>Money</strong>
                      <span>Deposit visibility</span>
                    </div>
                    <div>
                      <strong>Decision</strong>
                      <span>Chat before shortlist</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mini-panels">
                <article>
                  <strong>3</strong>
                  <span>good matches nearby</span>
                </article>
                <article>
                  <strong>Verified</strong>
                  <span>profiles highlighted first</span>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="problem-section section-block" id="problem">
          <div className="section-intro">
            <span className="section-tag">The problem</span>
            <h2>The process is messy long before the move-in happens.</h2>
            <p>
              Shared living breaks down because discovery, trust, compatibility,
              and money are all handled in separate places. People do not need
              more listings. They need a better system.
            </p>
          </div>

          <div className="story-grid">
            {painPoints.map((item, index) => (
              <article className="story-card" key={item.title}>
                <span className="story-index">0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="solution-section section-block" id="solution">
          <div className="section-intro compact-intro">
            <span className="section-tag">The solution</span>
            <h2>A homepage that immediately explains the product value.</h2>
            <p>
              Shared Living OS makes the full decision journey feel clear. You
              can discover homes, compare fit, verify people, and move forward
              with better confidence.
            </p>
          </div>

          <div className="solution-layout">
            <div className="solution-stack">
              <article className="solution-card">
                <strong>Discovery</strong>
                <p>Explore listings with household context instead of fragmented noise.</p>
              </article>
              <article className="solution-card">
                <strong>Matching</strong>
                <p>See compatibility built around lifestyle, routine, and expectations.</p>
              </article>
              <article className="solution-card">
                <strong>Trust</strong>
                <p>Verified identities reduce uncertainty before the first serious conversation.</p>
              </article>
              <article className="solution-card">
                <strong>Financial clarity</strong>
                <p>Future-ready flows reduce confusion around deposits and shared money moments.</p>
              </article>
            </div>

            <div className="dashboard-card">
              <div className="dashboard-top">
                <strong>Why users convert</strong>
                <span>because the value is obvious fast</span>
              </div>
              <div className="dashboard-grid">
                <article>
                  <strong>Clear fit</strong>
                  <p>Compatibility before commitment</p>
                </article>
                <article>
                  <strong>Real trust</strong>
                  <p>Verified people, visible signals</p>
                </article>
                <article>
                  <strong>Faster choice</strong>
                  <p>Less panic, better decisions</p>
                </article>
                <article>
                  <strong>Smoother move-in</strong>
                  <p>Money and logistics feel coordinated</p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="features-section section-block" id="features">
          <div className="section-intro compact-intro">
            <span className="section-tag">Feature highlights</span>
            <h2>Everything on the page should answer: why try this now?</h2>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <span className="feature-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="how-section section-block">
          <div className="section-intro compact-intro">
            <span className="section-tag">How it works</span>
            <h2>Simple enough to understand in one scroll.</h2>
          </div>

          <div className="steps-row">
            {steps.map((step, index) => (
              <article className="step-card" key={step}>
                <span className="step-number">0{index + 1}</span>
                <p>{step}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="proof-section section-block">
          <div className="proof-highlight">
            <span className="section-tag">Social proof</span>
            <h2>Built to feel trustworthy before the first click.</h2>
            <p>
              A strong homepage should reduce hesitation fast. The trust cues,
              product framing, and repeated calls to action all push the user
              from curiosity to action.
            </p>
          </div>

          <div className="proof-cards">
            <article className="proof-card large-proof">
              <strong>500+ users</strong>
              <span>already exploring better shared-living decisions</span>
            </article>
            <article className="proof-card">
              <p>
                “This feels like a real product, not just another listing page.”
              </p>
              <strong>Early user feedback</strong>
            </article>
            <article className="proof-card">
              <p>
                “The trust and fit story is what makes the idea instantly compelling.”
              </p>
              <strong>Launch audience insight</strong>
            </article>
          </div>
        </section>

        <section className="cities-section section-block" id="cities">
          <div className="section-intro compact-intro">
            <span className="section-tag">City focus</span>
            <h2>Starting where shared living is high-stakes and high-frequency.</h2>
          </div>

          <div className="city-grid">
            {cities.map((city) => (
              <article className="city-card" key={city.name}>
                <span className="city-stat">{city.stat}</span>
                <h3>{city.name}</h3>
                <p>{city.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-section section-block" id="cta">
          <div className="cta-card">
            <span className="section-tag">Final CTA</span>
            <h2>Stop compromising on your living situation.</h2>
            <p>
              Try a product built for clearer discovery, stronger trust, and
              faster confidence. Explore the platform or list your room now.
            </p>
            <div className="hero-buttons centered-buttons">
              <a className="button button-primary" href="/">
                Find Flatmates
              </a>
              <a className="button button-secondary" href="/">
                List Your Room
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div>
          <strong>Shared Living OS</strong>
          <p>Built to make shared living decisions feel smarter from the first scroll.</p>
        </div>
        <div className="footer-nav">
          <a href="/">About</a>
          <a href="/">Contact</a>
          <a href="/">Privacy Policy</a>
          <a href="/">Social</a>
        </div>
      </footer>

      <div className="mobile-cta">
        <a className="button button-primary" href="#cta">
          Find Flatmates
        </a>
      </div>
    </div>
  );
}

export default App;
