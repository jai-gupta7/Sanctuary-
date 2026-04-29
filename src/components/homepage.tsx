const phoneHero = "https://www.figma.com/api/mcp/asset/221fe505-3890-43af-b182-d168d4be2643";
const minimalScreen = "https://www.figma.com/api/mcp/asset/1da02a9b-5eca-483a-929a-81e0589991fd";
const expressionScreen = "https://www.figma.com/api/mcp/asset/7b77a2ab-dc85-4d31-912f-6e342b6baa70";
const feedScreen = "https://www.figma.com/api/mcp/asset/687fdf80-9e4e-4dcf-b593-7b68fc166432";
const createScreen = "https://www.figma.com/api/mcp/asset/283f0d38-a1e8-4b97-b425-4955a5e36bf3";
const detailScreen = "https://www.figma.com/api/mcp/asset/c1d6213e-9281-43fa-a65d-4e9dad6bdcbe";

const safetyList = [
  "Honest expression without fear of judgment",
  "Lower barrier to sharing vulnerable feelings",
  "Reduced fear of real-world consequences"
];

const riskList = [
  "Potential for toxic or triggering behavior",
  "Lack of accountability for harmful words",
  "Unsafe responses to vulnerable users"
];

const personas = [
  {
    icon: "voice_over_off",
    title: "Silent Strugglers",
    copy: "Users feeling overwhelmed but afraid to speak up in traditional social circles."
  },
  {
    icon: "favorite",
    title: "Empathetic Responders",
    copy: "Users who find healing in reading and quietly acknowledging others' pain."
  },
  {
    icon: "emergency",
    title: "Crisis Users",
    copy: "Individuals needing emotional release at moments when conventional support feels too far away."
  }
];

const principles = [
  {
    icon: "shield",
    title: "Safety over engagement",
    copy: "Prioritize emotional wellbeing over time spent in app."
  },
  {
    icon: "speed",
    title: "Reduce friction",
    copy: "Make it as easy as possible to express feelings quickly."
  },
  {
    icon: "volunteer_activism",
    title: "Empathy over validation",
    copy: "Remove likes; focus on feeling heard, not popular."
  },
  {
    icon: "visibility_off",
    title: "Guided anonymity",
    copy: "Structure inputs to prevent toxic free-text where possible."
  }
];

const solutionCards = [
  {
    image: feedScreen,
    title: "Feed \u2192 Discover",
    copy: "A curated, quiet stream of anonymous feelings.",
    featureTitle: "The Quiet Feed",
    points: ["Chronological only. Removes algorithm anxiety.", "High contrast. Ample whitespace."]
  },
  {
    image: createScreen,
    title: "Create \u2192 Express",
    copy: "Guided inputs to articulate complex emotions.",
    featureTitle: "Guided Expression",
    points: ["Pre-defined tags. Easy categorization.", "Soft inputs. Inviting text areas."]
  },
  {
    image: detailScreen,
    title: "Detail \u2192 Support",
    copy: "Focused reading view with limited, safe interaction.",
    featureTitle: "Holding Space",
    points: ["Immersive reading. Full screen focus.", "Support gestures. Safe interactions only."]
  }
];

function CheckList({ items, tone = "blue" }: { items: string[]; tone?: "blue" | "amber" }) {
  return (
    <ul className="sanctuary-list">
      {items.map((item) => (
        <li key={item} className={`sanctuary-list-item sanctuary-list-item-${tone}`}>
          <span aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function Homepage() {
  return (
    <div className="sanctuary-page" id="top">
      <a className="sanctuary-skip" href="#content">Skip to Content</a>
      <header className="sanctuary-nav">
        <a className="sanctuary-brand" href="#top">Sanctuary</a>
        <nav aria-label="Case study sections">
          <a href="#process">Process</a>
          <a href="#solution">Solution</a>
          <a href="#impact">Impact</a>
          <a href="#reflection">Reflection</a>
        </nav>
        <a className="sanctuary-contact" href="mailto:hello@sanctuary.example">Contact</a>
      </header>

      <main id="content">
        <section className="sanctuary-hero" aria-labelledby="sanctuary-title">
          <div className="sanctuary-hero-copy">
            <h1 id="sanctuary-title">Designing a safer way to say what cannot be said out loud</h1>
            <p>Sanctuary is an anonymous mental health platform that enables expression without social pressure.</p>
            <dl className="sanctuary-meta">
              <div>
                <dt>Role</dt>
                <dd>Product Designer</dd>
              </div>
              <div>
                <dt>Client</dt>
                <dd>Sanctuary Health</dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>April 2026</dd>
              </div>
            </dl>
          </div>
          <div className="sanctuary-hero-phone" aria-hidden="true">
            <img src={phoneHero} alt="" width="524" height="603" fetchPriority="high" />
          </div>
        </section>

        <section className="sanctuary-section sanctuary-problem" id="process">
          <div className="sanctuary-section-heading">
            <h2>The barrier is not access. The barrier is psychological safety.</h2>
          </div>
          <div className="sanctuary-two-up">
            <article>
              <h3>
                <span className="material-symbols-outlined sanctuary-heading-icon" aria-hidden="true">lock</span>
                What anonymity enables
              </h3>
              <CheckList items={safetyList} />
            </article>
            <article>
              <h3 className="sanctuary-amber">
                <span className="material-symbols-outlined sanctuary-heading-icon" aria-hidden="true">warning</span>
                Risks of anonymity
              </h3>
              <CheckList items={riskList} tone="amber" />
            </article>
          </div>
        </section>

        <section className="sanctuary-statement">
          <h2>"How might we design a space where users can express themselves without pressure, comparison, or judgment?"</h2>
        </section>

        <section className="sanctuary-section">
          <div className="sanctuary-section-heading">
            <h2>Who are we designing for?</h2>
          </div>
          <div className="sanctuary-personas">
            {personas.map((persona) => (
              <article key={persona.title}>
                <span className="material-symbols-outlined sanctuary-persona-icon" aria-hidden="true">{persona.icon}</span>
                <h3>{persona.title}</h3>
                <p>{persona.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="sanctuary-section sanctuary-principles">
          <h2>Design Principles</h2>
          <div className="sanctuary-principle-grid">
            {principles.map((principle) => (
              <article key={principle.title}>
                <span className="material-symbols-outlined" aria-hidden="true">{principle.icon}</span>
                <h3>{principle.title}</h3>
                <p>{principle.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="sanctuary-section sanctuary-directions">
          <div className="sanctuary-section-heading">
            <h2>Exploring two directions</h2>
          </div>
          <div className="sanctuary-direction-grid">
            <article>
              <h3>Version A: Minimal Calm</h3>
              <p>Reduce stimulation and make the experience feel private, muted, and slow.</p>
              <div className="sanctuary-screen-frame">
                <img src={minimalScreen} alt="Minimal calm UI direction" width="321" height="585" loading="lazy" />
              </div>
            </article>
            <article className="sanctuary-direction-selected">
              <span className="sanctuary-direction-badge">Selected Direction</span>
              <h3>Version B: Controlled Expression</h3>
              <p>Allow emotional range, but keep response and feedback patterns safe.</p>
              <div className="sanctuary-screen-frame">
                <img src={expressionScreen} alt="Controlled expression UI direction" width="321" height="585" loading="lazy" />
              </div>
            </article>
          </div>
          <p className="sanctuary-insight">
            <span className="material-symbols-outlined" aria-hidden="true">lightbulb</span>
            <span><strong>Insight:</strong> Emotional expression can be introduced without increasing pressure.</span>
          </p>
        </section>

        <section className="sanctuary-section sanctuary-solution" id="solution">
          <div className="sanctuary-section-heading">
            <h2>The Solution</h2>
            <p>A three-pillar experience designed to safely hold space for vulnerability.</p>
          </div>
          <div className="sanctuary-solution-grid">
            {solutionCards.map((card) => (
              <article key={card.title}>
                <div className="sanctuary-solution-intro">
                  <h3>{card.title}</h3>
                  <p>{card.copy}</p>
                </div>
                <div className="sanctuary-solution-image">
                  <img src={card.image} alt={`${card.title} screen`} width="252" height="585" loading="lazy" />
                </div>
                <div className="sanctuary-solution-detail">
                  <h4>{card.featureTitle}</h4>
                  <ul>
                    {card.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="sanctuary-toolkit">
          <h2>Dismantling the Toolkit</h2>
          <p>To create true psychological safety, we removed everything that drives traditional engagement.</p>
          <div>
            <span>No Likes</span>
            <span>No Followers</span>
            <span>No Algorithms</span>
          </div>
        </section>

        <section className="sanctuary-section sanctuary-impact" id="impact">
          <article>
            <h2>Impact</h2>
            <div className="sanctuary-impact-list">
              <div>
                <h3>Reduced Pressure</h3>
                <p>Significant decrease in anxiety related to posting compared to traditional platforms.</p>
              </div>
              <div>
                <h3>Honest Expression</h3>
                <p>Deeper vulnerability and less performative behavior observed in user testing.</p>
              </div>
            </div>
          </article>
          <article id="reflection">
            <h2>Reflection</h2>
            <p>
              Designing Sanctuary required fundamentally unlearning the metrics of success prevalent in modern product design.
              When the goal shifts from maximize engagement to maximize emotional safety, every UI pattern must be questioned.
              This project proved that constraints can create a more profound and liberating user experience for those who need it most.
            </p>
          </article>
        </section>
      </main>

      <footer className="sanctuary-footer">
        <strong>Sanctuary</strong>
        <nav aria-label="Social links">
          <a href="https://www.linkedin.com" rel="noreferrer" target="_blank">LinkedIn</a>
          <a href="https://dribbble.com" rel="noreferrer" target="_blank">Dribbble</a>
          <a href="mailto:hello@sanctuary.example">Contact</a>
        </nav>
        <span>(c) 2024 Sanctuary. Designed with emotional safety in mind.</span>
      </footer>
    </div>
  );
}
