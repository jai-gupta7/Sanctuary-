type Feature = {
  title: string;
  copy: string;
  eyebrow: string;
};

type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

const features: Feature[] = [
  {
    eyebrow: "Trust Layer",
    title: "Verified Profiles",
    copy: "See who is real before you start a conversation. Built for confidence, not guesswork."
  },
  {
    eyebrow: "Fit Layer",
    title: "Smart Matching",
    copy: "Lifestyle signals like routines, cleanliness, and social energy help you avoid bad fit decisions."
  },
  {
    eyebrow: "Money Layer",
    title: "Secure Payments",
    copy: "Future-ready flows bring more clarity to deposits, rent, and shared money moments."
  },
  {
    eyebrow: "Ops Layer",
    title: "Easy Living Management",
    copy: "Move in with less chaos and keep the household coordinated after the decision is made."
  }
];

const steps = [
  "Create your profile",
  "Explore listings",
  "Connect with people",
  "Secure your spot",
  "Move in"
];

const testimonials: Testimonial[] = [
  {
    quote:
      "It finally feels like someone designed a flatmate platform for how shared living actually works in Indian cities.",
    name: "Rhea Sharma",
    role: "Product Designer, Bengaluru"
  },
  {
    quote:
      "The trust and compatibility angle is what makes this different. I would have used this immediately during my last move.",
    name: "Kabir Mehta",
    role: "Consultant, Delhi NCR"
  }
];

const problemPillars = [
  {
    title: "Scattered listings",
    copy: "WhatsApp groups, broker calls, random posts, and stale apps make discovery feel like a scavenger hunt."
  },
  {
    title: "Trust issues",
    copy: "You are expected to decide quickly with incomplete information and no real confidence in who you are talking to."
  },
  {
    title: "Last-minute compromises",
    copy: "When a flatmate leaves, urgency takes over and better choices get replaced by rushed ones."
  },
  {
    title: "Money stress",
    copy: "Deposits, rent timing, and shared expenses often turn the move-in into the most awkward part."
  }
];

function App() {
  return (
    <div className="page-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <a className="brand" href="#hero" aria-label="Shared Living OS home">
          <span className="brand-mark">S</span>
          <span className="brand-copy">
            <strong>Shared Living OS</strong>
            <small>Trust-first shared living</small>
          </span>
        </a>

        <nav className="topnav" aria-label="Primary">
          <a href="#problem">Why it matters</a>
          <a href="#solution">How it works</a>
          <a href="#cities">Cities</a>
          <a href="#cta">Get started</a>
        </nav>

        <a className="button button-ghost nav-cta" href="#cta">
          Explore now
        </a>
      </header>

      <main>
        <section className="hero section" id="hero">
          <div className="hero-copy reveal">
            <p className="eyebrow">Shared living, without the chaos</p>
            <h1>Find the right flatmates. Not just any flat.</h1>
            <p className="hero-text">
              Verified people. Better matches. No chaos during move-ins. Shared
              Living OS turns a stressful housing decision into a clear, trusted
              path forward.
            </p>

            <div className="hero-actions">
              <a className="button button-primary" href="#cta">
                Find Flatmates
              </a>
              <a className="button button-secondary" href="#cta">
                List Your Room
              </a>
            </div>

            <div className="hero-trustbar">
              <div>
                <strong>500+</strong>
                <span>early users already exploring the idea</span>
              </div>
              <div>
                <strong>Delhi NCR + Bengaluru</strong>
                <span>city-first launch focus</span>
              </div>
            </div>
          </div>

          <div className="hero-visual reveal">
            <div className="hero-card skyline-card">
              <div className="mini-badge">Verified move-in journey</div>
              <div className="city-lights">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="visual-grid">
                <article className="visual-panel warm-panel">
                  <p className="panel-kicker">Best match</p>
                  <h2>92% fit</h2>
                  <p>
                    Similar schedules, clean-home habits, and compatible social
                    energy.
                  </p>
                </article>
                <article className="visual-panel outline-panel">
                  <p className="panel-kicker">Trust signal</p>
                  <ul>
                    <li>Government ID verified</li>
                    <li>Work profile confirmed</li>
                    <li>Deposit flow visibility</li>
                  </ul>
                </article>
              </div>
              <div className="ticker">
                <span>Move-in clarity</span>
                <span>Real people</span>
                <span>Less compromise</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section section-problem" id="problem">
          <div className="section-heading reveal">
            <p className="eyebrow">The problem feels familiar</p>
            <h2>Looking for a flatmate should not feel like crisis management.</h2>
            <p>
              Most people are not struggling because they cannot find a room.
              They are struggling because the whole process is fragmented,
              urgent, and full of uncertainty.
            </p>
          </div>

          <div className="problem-grid">
            {problemPillars.map((pillar, index) => (
              <article className="problem-card reveal" key={pillar.title}>
                <span className="problem-icon" aria-hidden="true">
                  0{index + 1}
                </span>
                <h3>{pillar.title}</h3>
                <p>{pillar.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section solution-section" id="solution">
          <div className="solution-copy reveal">
            <p className="eyebrow">A better operating system for shared living</p>
            <h2>We bring structure to the moments that usually go wrong.</h2>
            <p>
              Shared Living OS combines trusted discovery, compatibility
              intelligence, and financial clarity into one calmer experience.
              That means fewer compromises, faster confidence, and smoother
              move-ins.
            </p>
            <div className="solution-list">
              <div>
                <strong>Discovery</strong>
                <span>Clean listings with real context, not noisy guesswork.</span>
              </div>
              <div>
                <strong>Matching</strong>
                <span>Compatibility goes beyond budget and location.</span>
              </div>
              <div>
                <strong>Trust</strong>
                <span>Verified identities help you decide with confidence.</span>
              </div>
              <div>
                <strong>Financial clarity</strong>
                <span>Future-ready flows reduce awkward money friction.</span>
              </div>
            </div>
          </div>

          <div className="solution-visual reveal">
            <div className="metric-stack">
              <article className="metric-card">
                <p>Discovery score</p>
                <strong>Clearer</strong>
                <span>Listings with context, intent, and household signals.</span>
              </article>
              <article className="metric-card highlight-card">
                <p>Decision quality</p>
                <strong>Higher trust</strong>
                <span>Fewer rushed tradeoffs when the basics are visible.</span>
              </article>
              <article className="metric-card">
                <p>Move-in experience</p>
                <strong>Smoother</strong>
                <span>Money, people, and timing feel coordinated from day one.</span>
              </article>
            </div>
          </div>
        </section>

        <section className="section features-section">
          <div className="section-heading reveal">
            <p className="eyebrow">Feature highlights</p>
            <h2>The value should be obvious in seconds.</h2>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card reveal" key={feature.title}>
                <p className="feature-eyebrow">{feature.eyebrow}</p>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section how-section">
          <div className="section-heading reveal">
            <p className="eyebrow">How it works</p>
            <h2>Simple enough to understand fast. Structured enough to trust.</h2>
          </div>

          <div className="stepper" aria-label="How it works steps">
            {steps.map((step, index) => (
              <div className="step-item reveal" key={step}>
                <span className="step-index">0{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section social-section">
          <div className="section-heading reveal">
            <p className="eyebrow">Social proof</p>
            <h2>Trust builds faster when people can see momentum.</h2>
          </div>

          <div className="social-proof-grid">
            <article className="stat-card reveal">
              <strong>500+</strong>
              <span>users already interested in a more trusted shared-living journey</span>
            </article>

            {testimonials.map((testimonial) => (
              <article className="testimonial-card reveal" key={testimonial.name}>
                <p className="quote">“{testimonial.quote}”</p>
                <div className="testimonial-meta">
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.role}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section city-section" id="cities">
          <div className="section-heading reveal">
            <p className="eyebrow">City focus</p>
            <h2>Launching where shared living is urgent, fast, and full of friction.</h2>
          </div>

          <div className="city-grid">
            <article className="city-card reveal">
              <p className="city-label">Live now</p>
              <h3>Delhi NCR</h3>
              <p>
                For people navigating quick replacements, dense rental demand,
                and stressful move-in timelines.
              </p>
            </article>
            <article className="city-card reveal">
              <p className="city-label">Live now</p>
              <h3>Bengaluru</h3>
              <p>
                For students and professionals who need trusted discovery in a
                city with constant flatmate churn.
              </p>
            </article>
          </div>
        </section>

        <section className="section final-cta" id="cta">
          <div className="cta-panel reveal">
            <p className="eyebrow">Ready when you are</p>
            <h2>Stop compromising on your living situation.</h2>
            <p>
              Start with better people, better signals, and a smoother path to
              move in. Explore listings or list your room in minutes.
            </p>
            <div className="hero-actions centered-actions">
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

      <footer className="footer">
        <div>
          <strong>Shared Living OS</strong>
          <p>Built for people who want a calmer way to find home with others.</p>
        </div>
        <div className="footer-links">
          <a href="/">About</a>
          <a href="/">Contact</a>
          <a href="/">Privacy Policy</a>
          <a href="/">Instagram</a>
        </div>
      </footer>

      <div className="mobile-sticky-cta">
        <a className="button button-primary" href="#cta">
          Find Flatmates
        </a>
      </div>
    </div>
  );
}

export default App;
