import { useState, useEffect, useRef } from 'react';
import './App.css';

/* --- Event data + helpers --- */

const EVENTS = [
  // 1859
  {
    id: '1859-carrington-main',
    year: '1859',
    date: 'September 1',
    title: 'Carrington Event (Main Storm)',
    shortDescription:
      'A powerful solar storm that disrupted telegraph systems worldwide.',
    summary: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Curabitur suscipit, urna et feugiat tincidunt, lacus nisl dictum diam, vitae facilisis arcu urna a nisi. Mauris vitae mi eget arcu varius imperdiet. Integer nec mauris at ipsum facilisis venenatis. Sed porta, turpis vitae tincidunt bibendum, purus ex luctus justo, non pharetra leo felis eget nibh.
Aliquam erat volutpat. Vivamus pretium, dui non bibendum ultrices, ipsum nisl vehicula eros, eget sodales sapien mi at tortor.`,
    impact: `Fusce porttitor, dolor id egestas interdum, turpis est dignissim augue, non placerat lorem neque id risus. Suspendisse potenti. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.
Duis vel lacinia massa, ac vestibulum metus. Aenean facilisis, nulla vitae egestas porttitor, nisi sem pharetra dui, sed bibendum nisl leo ut tortor. Maecenas interdum sapien ac condimentum feugiat.`,
  },
  {
    id: '1859-carrington-precursor',
    year: '1859',
    date: 'August 28',
    title: 'Precursor Solar Flare',
    shortDescription:
      'A strong flare observed days before the main Carrington Event.',
    summary: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer rhoncus, lacus ut porta accumsan, nisl nisl pretium justo, sed tincidunt est velit et sapien.`,
    impact: `Integer tincidunt, turpis sed venenatis accumsan, erat purus blandit sapien, vel volutpat ipsum urna eget sem.`,
  },

  // 1921
  {
    id: '1921-railway-main',
    year: '1921',
    date: 'May 14',
    title: 'Railway Geomagnetic Storm',
    shortDescription:
      'A major storm that disrupted telegraph and railway signaling.',
    summary: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Curabitur suscipit, urna et feugiat tincidunt, lacus nisl dictum diam, vitae facilisis arcu urna a nisi. Mauris vitae mi eget arcu varius imperdiet. Integer nec mauris at ipsum facilisis venenatis.
Sed a arcu et neque aliquet sodales. Etiam sollicitudin orci eget neque vulputate, sit amet convallis augue finibus.`,
    impact: `Fusce porttitor, dolor id egestas interdum, turpis est dignissim augue, non placerat lorem neque id risus.
Suspendisse potenti. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Praesent gravida, lacus at hendrerit iaculis, orci orci accumsan lacus, sed pulvinar erat risus nec velit.`,
  },
  {
    id: '1921-railway-aftermath',
    year: '1921',
    date: 'May 15',
    title: 'Rail Network Recovery Efforts',
    shortDescription:
      'Railway operators inspected lines and signaling systems after the storm.',
    summary: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras feugiat, nibh ac varius gravida, diam quam cursus enim, ac condimentum libero metus sit amet urna.`,
    impact: `Vestibulum eget arcu in lorem interdum fermentum. Maecenas pretium efficitur velit, et fermentum massa ornare at.`,
  },

  // 1935 extra test year
  {
    id: '1935-telegraph-storm',
    year: '1935',
    date: 'November 3',
    title: '1935 Telegraph Storm',
    shortDescription:
      'Geomagnetic storm that impacted telegraph and early radio links.',
    summary: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed consequat pretium orci vel interdum.`,
    impact: `Donec ultricies, magna in semper fermentum, lacus nunc finibus velit, at faucibus urna nulla id turpis.`,
  },

  // 1989
  {
    id: '1989-quebec-main',
    year: '1989',
    date: 'March 13',
    title: 'Québec Blackout',
    shortDescription:
      'A geomagnetic storm that caused a major power outage.',
    summary: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Aliquam erat volutpat. Nam vitae fermentum lacus.
Vivamus mollis, metus vitae faucibus posuere, justo dui laoreet ligula, id mattis magna tortor in mi.`,
    impact: `Morbi posuere augue interdum, molestie ipsum nec, pellentesque orci. Nam ac justo in lectus tempor pulvinar.
Aliquam non ipsum in libero rutrum lacinia. Phasellus volutpat orci vel ligula aliquet, at feugiat eros imperdiet.`,
  },
  {
    id: '1989-quebec-satellite',
    year: '1989',
    date: 'March 14',
    title: 'Satellite Anomalies',
    shortDescription:
      'Satellites reported sensor glitches and communication issues after the blackout.',
    summary: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec at magna non ex varius luctus.`,
    impact: `Sed a justo in lorem aliquam fringilla. Vestibulum bibendum urna risus, id tempus felis sodales sit amet.`,
  },

  // 2012
  {
    id: '2012-xflare-main',
    year: '2012',
    date: 'March 7',
    title: 'X-class Solar Flare',
    shortDescription:
      'A strong flare that affected satellites and radio signals.',
    summary: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Donec ornare arcu et consequat dapibus. Vestibulum tristique justo nec dolor tristique, quis interdum ipsum cursus.`,
    impact: `Integer tincidunt, turpis sed venenatis accumsan, erat purus blandit sapien, vel volutpat ipsum urna eget sem. Donec sit amet vehicula lectus, eget ornare risus.`,
  },
  {
    id: '2012-cme-near-miss',
    year: '2012',
    date: 'July 23',
    title: 'Near-Miss CME',
    shortDescription:
      'A massive coronal mass ejection that narrowly missed Earth.',
    summary: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae quam nec nisl fermentum tincidunt. Mauris blandit interdum velit, eu fringilla massa blandit sit amet.`,
    impact: `Ut porttitor, augue et gravida porta, neque lectus luctus eros, in feugiat magna ex et odio.`,
  },
];

/* helper to sort events within a year by month/day */

const MONTH_ORDER = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};

function parseMonthDay(str) {
  if (!str) return { monthIndex: 13, day: 0 };
  const parts = str.split(' ');
  const month = parts[0];
  const day = parseInt(parts[1], 10) || 0;
  return {
    monthIndex: MONTH_ORDER[month] || 13,
    day,
  };
}

function sortEventsByDate(events) {
  return [...events].sort((a, b) => {
    const aMD = parseMonthDay(a.date);
    const bMD = parseMonthDay(b.date);
    if (aMD.monthIndex !== bMD.monthIndex) {
      return aMD.monthIndex - bMD.monthIndex;
    }
    return aMD.day - bMD.day;
  });
}

/* list of years that have events, sorted numerically */
const YEARS = Array.from(new Set(EVENTS.map((e) => e.year))).sort(
  (a, b) => Number(a) - Number(b)
);

/* decade list based on YEARS */
const DECADES = Array.from(
  new Set(
    YEARS.map((y) => Math.floor(Number(y) / 10) * 10)
  )
).sort((a, b) => a - b);

/* === App === */

function App() {
  const [view, setView] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // search-related state
  const [yearQuery, setYearQuery] = useState('');
  const [scrollToYear, setScrollToYear] = useState(null);
  const [searchInfo, setSearchInfo] = useState('');
  const [searchError, setSearchError] = useState('');

  // auto-hide search notifications after 5 seconds
  useEffect(() => {
    if (!searchInfo && !searchError) return;
    const id = setTimeout(() => {
      setSearchInfo('');
      setSearchError('');
    }, 5000);

    return () => clearTimeout(id);
  }, [searchInfo, searchError]);

  // decade/year picker
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [pickerDecade, setPickerDecade] = useState(DECADES[0] || null);

  // refs for click-outside detection
  const menuButtonRef = useRef(null);
  const navDrawerRef = useRef(null);
  const yearSearchRef = useRef(null);

  // click-outside to close menu + year picker
  useEffect(() => {
    function handleDocumentClick(event) {
      const target = event.target;

      // Close nav menu when clicking outside MENU button + nav drawer
      if (menuOpen) {
        const menuBtnEl = menuButtonRef.current;
        const navEl = navDrawerRef.current;

        const clickInsideMenu =
          (menuBtnEl && menuBtnEl.contains(target)) ||
          (navEl && navEl.contains(target));

        if (!clickInsideMenu) {
          setMenuOpen(false);
        }
      }

      // Close year picker when clicking outside the year search area
      if (showYearPicker) {
        const yearSearchEl = yearSearchRef.current;
        const clickInsideYearSearch =
          yearSearchEl && yearSearchEl.contains(target);

        if (!clickInsideYearSearch) {
          setShowYearPicker(false);
        }
      }
    }

    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [menuOpen, showYearPicker]);

  const handleNavClick = (nextView) => {
    setView(nextView);
    setMenuOpen(false);
    if (nextView !== 'home') {
      setSelectedEvent(null);
    }
  };

  const openEventDetails = (event) => {
    setView('home'); // ensure we’re on the timeline
    setSelectedEvent(event);
  };

  const closeEventDetails = () => {
    setSelectedEvent(null);
  };

  const handleYearSearchSubmit = (e) => {
    e.preventDefault();

    const trimmed = (yearQuery || '').trim();

    // must be exactly 4 digits
    const isFourDigits = /^\d{4}$/.test(trimmed);

    if (!isFourDigits) {
      setSearchError(
        'Please enter a 4-digit year(for example, 1989).'
      );
      setSearchInfo('');
      setView('home');
      setMenuOpen(false);
      return;
    }

    setSearchError(''); // clear format error

    const num = parseInt(trimmed, 10);
    const targetYear = String(num);

    // find closest existing year
    let closest = YEARS[0];
    let hasExact = false;

    YEARS.forEach((y) => {
      if (y === targetYear) {
        hasExact = true;
        closest = y;
      }
    });

    if (!hasExact) {
      closest = YEARS.reduce((prev, curr) => {
        const diffPrev = Math.abs(Number(prev) - num);
        const diffCurr = Math.abs(Number(curr) - num);
        return diffCurr < diffPrev ? curr : prev;
      }, YEARS[0]);

      setSearchInfo(
        `No events for ${targetYear}. Showing closest year: ${closest}.`
      );
    } else {
      setSearchInfo('');
    }

    // switch to home view and ask HomeView to scroll to that year
    setView('home');
    setMenuOpen(false);
    setScrollToYear(closest);
  };

  const handleYearPickerSelect = (year) => {
    // when user clicks a year from the decade/year picker
    setYearQuery(String(year));
    setSearchError('');
    setSearchInfo('');
    setView('home');
    setMenuOpen(false);
    setScrollToYear(String(year));
    setShowYearPicker(false);
  };

  const renderView = () => {
    switch (view) {
      case 'birthday':
        return <BirthdayView />;
      case 'about':
        return <AboutView />;
      case 'live':
        return <LiveView />;
      case 'home':
      default:
        return (
          <HomeView
            onOpenEvent={openEventDetails}
            showScrollHints={!selectedEvent}
            scrollToYear={scrollToYear}
            onScrollToYearHandled={() => setScrollToYear(null)}
          />
        );
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <button
          ref={menuButtonRef}
          className={`menu-button ${menuOpen ? 'is-open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className="menu-icon">
            <span />
            <span />
            <span />
          </span>
          <span className="menu-text">MENU</span>
        </button>

        <button
          className="brand brand-button"
          onClick={() => handleNavClick('home')}
        >
          SOLAR EVENTS
        </button>

        {/* Year search in top-right */}
        <form
          ref={yearSearchRef}
          className="year-search"
          onSubmit={handleYearSearchSubmit}
          noValidate
        >
          <input
            type="text"
            name="year"
            className="year-search-input"
            placeholder="YEAR"
            inputMode="numeric"
            maxLength={4}
            value={yearQuery}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, '').slice(0,4);
              setYearQuery(e.target.value);
            }}
          />
          <button className="year-search-button" type="submit">
            Search
          </button>
          <button
            className="year-search-browse"
            type="button"
            onClick={() => setShowYearPicker((prev) => !prev)}
            aria-expanded={showYearPicker}
            title="Browse timeline years by decade"
          >
            Browse
          </button>

          {showYearPicker && (
            <div className="year-search-popover">
              <div className="year-search-popover-section">
                <div className="year-search-popover-label">Select decade</div>
                <div className="year-search-decade-list">
                  {DECADES.map((decade) => (
                    <button
                      key={decade}
                      type="button"
                      className={
                        'year-search-decade' +
                        (pickerDecade === decade ? ' is-active' : '')
                      }
                      onClick={() => setPickerDecade(decade)}
                    >
                      {decade}s
                    </button>
                  ))}
                </div>
              </div>

              <div className="year-search-popover-section">
                <div className="year-search-popover-label">Select year</div>
                <div className="year-search-year-list">
                  {YEARS.filter(
                    (y) => Math.floor(Number(y) / 10) * 10 === pickerDecade
                  ).map((y) => (
                    <button
                      key={y}
                      type="button"
                      className="year-search-year"
                      onClick={() => handleYearPickerSelect(y)}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </form>
      </header>

      {(searchInfo || searchError) && (
        <div
          className={
            'global-banner ' +
            (searchError ? 'global-banner--error' : 'global-banner--info')
          }
        >
          {searchError || searchInfo}
        </div>
      )}

      <nav
        ref={navDrawerRef}
        className={`nav-drawer ${menuOpen ? 'nav-drawer--open' : ''}`}
      >
        <button className="nav-item" onClick={() => handleNavClick('home')}>
          <span className="nav-icon">🏠</span>
          <span>Home</span>
        </button>
        <button className="nav-item" onClick={() => handleNavClick('live')}>
          <span className="nav-icon">📡</span>
          <span>Live Data</span>
        </button>
        <button
          className="nav-item"
          onClick={() => handleNavClick('birthday')}
        >
          <span className="nav-icon">🎂</span>
          <span>Events On My Birthday</span>
        </button>
        <button className="nav-item" onClick={() => handleNavClick('about')}>
          <span className="nav-icon">ℹ️</span>
          <span>About</span>
        </button>
      </nav>

      <main className={`main ${view === 'home' ? 'main--timeline' : ''}`}>
        {renderView()}
        {selectedEvent && (
          <EventDetailOverlay event={selectedEvent} onClose={closeEventDetails} />
        )}
      </main>

      <footer className="footer">
        © {new Date().getFullYear()} Solar Events • Prototype
      </footer>
    </div>
  );
}

/* --- Views --- */

/* Home / Timeline now grouped by year */

function HomeView({
  onOpenEvent,
  showScrollHints = true,
  scrollToYear,
  onScrollToYearHandled,
}) {
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [expandedYear, setExpandedYear] = useState(null);
  const railRef = useRef(null);
  const [hintWindowActive, setHintWindowActive] = useState(false);

  // group events by year
  const groupedByYear = EVENTS.reduce((acc, ev) => {
    if (!acc[ev.year]) acc[ev.year] = [];
    acc[ev.year].push(ev);
    return acc;
  }, {});

  const years = Object.keys(groupedByYear).sort(
    (a, b) => Number(a) - Number(b)
  );

  // Delay showing scroll hints, then hide them permanently after a while
  useEffect(() => {
    const delayMs = 1000;      // 1s before they appear
    const visibleMs = 8000;    // 8s total window (so they disappear ~7s after first show)
  
    const delayId = setTimeout(() => {
      setHintWindowActive(true);
    }, delayMs);
  
    const hideId = setTimeout(() => {
      setHintWindowActive(false);
    }, delayMs + visibleMs);
  
    return () => {
      clearTimeout(delayId);
      clearTimeout(hideId);
    };
  }, []);
  

  useEffect(() => {
    let timeoutId;

    const updateScrollState = () => {
      if (!railRef.current) {
        setCanScrollUp(false);
        setCanScrollDown(false);
        return;
      }

      const rows = railRef.current.querySelectorAll('.timeline-row');
      if (!rows.length) {
        setCanScrollUp(false);
        setCanScrollDown(false);
        return;
      }

      const firstRect = rows[0].getBoundingClientRect();
      const lastRect = rows[rows.length - 1].getBoundingClientRect();
      const vh = window.innerHeight;

      const firstFullyVisible = firstRect.top >= 0 && firstRect.bottom <= vh;
      const lastFullyVisible = lastRect.top >= 0 && lastRect.bottom <= vh;

      setCanScrollUp(!firstFullyVisible);
      setCanScrollDown(!lastFullyVisible);
    };

    const handleScroll = () => {
      setShowHints(false);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        updateScrollState();
        setShowHints(true);
      }, 600);
    };

    updateScrollState();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateScrollState);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollState);
      clearTimeout(timeoutId);
    };
  }, []);

  // when App asks us to scroll to a specific year
  useEffect(() => {
    if (!scrollToYear) return;
    const el = document.getElementById(`year-${scrollToYear}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setExpandedYear(scrollToYear);
    }
    if (onScrollToYearHandled) onScrollToYearHandled();
  }, [scrollToYear, onScrollToYearHandled]);

  const showTopHint =
    hintWindowActive && showScrollHints && showHints && canScrollUp;

  const showBottomHint =
    hintWindowActive && showScrollHints && showHints && canScrollDown;


  return (
    <section className="timeline-screen">
      <header className="timeline-header">
        <h1>Timeline</h1>
        <p>
          Scroll through key years and expand them to explore individual solar events.
        </p>
      </header>

      <div className="timeline-rail" ref={railRef}>
        {years.map((year) => (
          <TimelineYearRow
            key={year}
            year={year}
            events={groupedByYear[year]}
            isExpanded={expandedYear === year}
            onToggle={() =>
              setExpandedYear((prev) => (prev === year ? null : year))
            }
            onOpenEvent={onOpenEvent}
          />
        ))}
      </div>

      {showTopHint && (
        <div className="scroll-indicator scroll-indicator--top">
          <span className="scroll-arrow scroll-arrow--up">↑</span>
          <span>Scroll up for earlier years</span>
        </div>
      )}

      {showBottomHint && (
        <div className="scroll-indicator scroll-indicator--bottom">
          <span>Scroll to explore more years</span>
          <span className="scroll-arrow">↓</span>
        </div>
      )}
    </section>
  );
}

/* A single year row + its events */

function TimelineYearRow({ year, events, isExpanded, onToggle, onOpenEvent }) {
  const sortedEvents = sortEventsByDate(events);

  return (
    <div
      id={`year-${year}`}
      className={`timeline-row timeline-row--year ${
        isExpanded ? 'is-expanded' : ''
      }`}
    >
      <div className="timeline-dot" />
      <button className="timeline-year-header" onClick={onToggle}>
        <div className="timeline-year-text">
          {/* top line: year + count */}
          <div className="timeline-year-main">
            <div className="timeline-year">{year}</div>
            <div className="timeline-year-count">
              {sortedEvents.length} event{sortedEvents.length > 1 ? 's' : ''}
            </div>
          </div>

          {/* second line: helper text that changes when open/closed */}
          <div className="timeline-year-subtitle">
            {isExpanded ? 'Click To Close' : 'Click To View Events'}
          </div>
        </div>

        <span className="timeline-year-chevron">
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {isExpanded && (
        <div className="timeline-year-events">
          {sortedEvents.map((ev) => (
            <button
              key={ev.id}
              className="timeline-year-event"
              onClick={() => onOpenEvent(ev)}
            >
              <div className="timeline-year-event-date">{ev.date}</div>
              <div className="timeline-year-event-title">{ev.title}</div>
              <div className="timeline-year-event-description">
                {ev.shortDescription}
              </div>
              <div className="timeline-year-event-hint">
                CLICK FOR MORE DETAILS
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* Other views unchanged */

function BirthdayView() {
  return (
    <section className="panel">
      <h1>Events On My Birthday</h1>
      <p className="helper">
        Enter your birthday to find solar events that happened on that date.
      </p>
      <form className="birthday-form" onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          placeholder="MM/DD"
          className="input"
          aria-label="Birthday month and day"
        />
        <button className="primary">Search</button>
      </form>
      <div className="results helper">
        Results will appear here. (Later this will be AI-powered.)
      </div>
    </section>
  );
}

function AboutView() {
  return (
    <section className="panel">
      <h1>About This Project</h1>
      <p>
        The Solar Events Interactive Web Portal helps students explore how solar flares
        and geomagnetic storms affect communication systems and daily life.
      </p>

      <h2>Mission</h2>
      <p>
        Make space weather understandable and exciting for middle school students and
        curious learners of all ages.
      </p>

      <h2>Team</h2>
      <ul>
        <li>Okeefe Virgo — Backend &amp; Database</li>
        <li>Ronak Prajapati — Frontend &amp; Backend</li>
        <li>Umang Dalwadi — Frontend</li>
        <li>Prof. Margaret &amp; research team — Historical Data</li>
      </ul>
    </section>
  );
}

function LiveView() {
  return (
    <section className="panel">
      <h1>Live Data (Placeholder)</h1>
      <p className="helper">
        These values are static for now. Later, they’ll come from NASA/NOAA APIs.
      </p>
      <div className="cards">
        <div className="card">
          <h2>Latest Solar Flare</h2>
          <p>April 5th, 2024 — X1.2</p>
        </div>
        <div className="card">
          <h2>Geomagnetic Storms</h2>
          <p>G2 (Moderate)</p>
        </div>
        <div className="card">
          <h2>Solar Wind Speed</h2>
          <p>532 km/s</p>
        </div>
        <div className="card">
          <h2>Sunspot Number</h2>
          <p>79</p>
        </div>
      </div>
    </section>
  );
}

/* AdminView is currently unused, safe to delete later if you want */
function AdminView() {
  return (
    <section className="panel">
      <h1>Admin Portal (Prototype)</h1>
      <p className="helper">
        This will eventually let researchers add and edit events directly from the web.
      </p>
      <div className="admin-layout">
        <form className="admin-login" onSubmit={(e) => e.preventDefault()}>
          <h2>Login</h2>
          <label>
            <span>Username</span>
            <input className="input" />
          </label>
          <label>
            <span>Password</span>
            <input type="password" className="input" />
          </label>
          <button className="primary">Login</button>
        </form>

        <div className="admin-dashboard">
          <h2>Event Management</h2>
          <p className="helper">
            After login, this area will show a table of events with add/edit/delete
            actions.
          </p>
        </div>
      </div>
    </section>
  );
}

function EventDetailOverlay({ event, onClose }) {
  if (!event) return null;

  return (
    <div className="event-overlay-backdrop" onClick={onClose}>
      <div
        className="event-detail-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="event-detail-close"
          onClick={onClose}
          aria-label="Close details"
        >
          ✕
        </button>

        <h1 className="event-detail-title">
          {event.year} {event.title.includes(event.year) ? '' : event.title}
        </h1>

        <div className="event-detail-meta">
          <span>{event.date}</span>
        </div>

        <div className="event-detail-section">
          <h2>Event Summary:</h2>
          <div className="event-detail-scrollbox">
            <p>{event.summary}</p>
          </div>
        </div>

        <div className="event-detail-section">
          <h2>Impact on Communication:</h2>
          <div className="event-detail-scrollbox">
            <p>{event.impact}</p>
          </div>
        </div>

        <div className="event-detail-side-action">
          <button className="event-detail-circle-button">
            ▶
          </button>
          <span className="event-detail-circle-label">
            View Newspaper Articles
          </span>
        </div>

        <div className="event-detail-footer">
          <button className="event-detail-cta">Tell Me More</button>
        </div>
      </div>
    </div>
  );
}

export default App;
