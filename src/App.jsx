import React, { useEffect, useState } from "react";

const API_URL = "https://openlibrary.org/search.json";
const WIKIDATA_API_URL = "https://www.wikidata.org/w/api.php";
const PAGE_SIZE = 12;

function getCoverUrl(coverId) {
  return coverId
    ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
    : null;
}

function BookCard({ book, isFavorite, onToggleFavorite }) {
  const cover = getCoverUrl(book.cover_i);
  const title = book.title || "Untitled";
  const authors = book.author_name?.slice(0, 2).join(", ") || "Unknown author";
  const year = book.first_publish_year || "Year unknown";

  return (
    <article className="book-card">
      <div className="cover-wrap">
        {cover ? (
          <img className="cover" src={cover} alt={`Cover of ${title}`} />
        ) : (
          <div className="cover-placeholder"><span>📖</span><small>No cover available</small></div>
        )}
        <button
          className={`favorite-button ${isFavorite ? "saved" : ""}`}
          onClick={() => onToggleFavorite(book)}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          title={isFavorite ? "Remove favorite" : "Add favorite"}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      </div>
      <div className="book-info">
        <h3>{title}</h3>
        <p className="author">{authors}</p>
        <p className="year">First published: {year}</p>
        {book.edition_count != null && (
          <span className="book-key">{book.edition_count} editions</span>
        )}
      </div>
    </article>
  );
}

export default function App() {
  const [query, setQuery] = useState("the alchemist");
  const [submittedQuery, setSubmittedQuery] = useState("the alchemist");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [dataSource, setDataSource] = useState("Open Library");
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("booknest-favorites")) || [];
    } catch {
      return [];
    }
  });

  // Save favorites whenever the favorites list changes.
  useEffect(() => {
    localStorage.setItem("booknest-favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Fetch books when the search term or page changes.
  useEffect(() => {
    if (!submittedQuery.trim()) return;

    const controller = new AbortController();
    const openLibraryController = new AbortController();
    const openLibraryTimeout = setTimeout(() => openLibraryController.abort(), 8000);

    async function fetchBooks() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          q: submittedQuery,
          page: String(page),
          limit: String(PAGE_SIZE),
          fields: "key,title,author_name,first_publish_year,cover_i,edition_count"
        });
        const response = await fetch(`${API_URL}?${params}`, {
          signal: openLibraryController.signal
        });

        if (!response.ok) {
          throw new Error("The book service could not complete your request.");
        }

        const data = await response.json();
        if (!Array.isArray(data.docs) || data.docs.length === 0) {
          throw new Error("Open Library returned no results.");
        }
        setBooks(data.docs);
        setTotalResults(data.numFound || 0);
        setDataSource("Open Library");
      } catch {
        clearTimeout(openLibraryTimeout);
        if (controller.signal.aborted) return;

        try {
          const fallbackParams = new URLSearchParams({
            action: "wbsearchentities",
            search: submittedQuery,
            language: "en",
            format: "json",
            limit: String(PAGE_SIZE),
            origin: "*"
          });
          const fallbackResponse = await fetch(
            `${WIKIDATA_API_URL}?${fallbackParams}`,
            { signal: controller.signal }
          );
          if (!fallbackResponse.ok) {
            throw new Error(`Wikidata returned HTTP ${fallbackResponse.status}.`);
          }

          const fallbackData = await fallbackResponse.json();
          const fallbackBooks = (Array.isArray(fallbackData.search) ? fallbackData.search : [])
            .filter((item) =>
              /\b(book|novel|written work|autobiography|memoir|textbook|literary work)\b/i.test(
                item.description || ""
              ) && !/\bedition\b/i.test(item.description || "")
            )
            .map((item) => {
              const description = item.description || "";
              const author = description.match(
                /(?:written work|book|novel|autobiography|memoir|textbook|literary work) by (.+)$/i
              )?.[1];
              const year = description.match(/\b(?:18|19|20)\d{2}\b/)?.[0];

              return {
                key: `wikidata:${item.id}`,
                title: item.label || "Untitled",
                author_name: author ? [author] : [],
                first_publish_year: year ? Number(year) : null,
                edition_count: null
              };
            });

          setBooks(fallbackBooks);
          setTotalResults(fallbackBooks.length);
          setDataSource("Wikidata");
        } catch (wikidataError) {
          if (controller.signal.aborted) return;
          const message = wikidataError instanceof Error
            ? wikidataError.message
            : "Unknown backup search error.";
          setError(`Open Library is unavailable and the backup search failed. ${message}`);
          setBooks([]);
        }
      } finally {
        clearTimeout(openLibraryTimeout);
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchBooks();
    return () => {
      controller.abort();
      openLibraryController.abort();
    };
  }, [submittedQuery, page, retryCount]);

  function handleSearch(event) {
    event.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;
    setShowFavorites(false);
    setPage(1);
    setSubmittedQuery(cleanQuery);
  }

  function toggleFavorite(book) {
    setFavorites((current) => {
      const alreadySaved = current.some((item) => item.key === book.key);
      return alreadySaved
        ? current.filter((item) => item.key !== book.key)
        : [...current, book];
    });
  }

  const visibleBooks = showFavorites ? favorites : books;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={() => { setShowFavorites(false); setPage(1); }}>
          <span className="brand-icon">B</span> BookNest
        </a>
        <span className="top-note">A little place for big stories</span>
      </header>

      <section className="hero">
        <div className="eyebrow"><span></span> OPEN LIBRARY DISCOVERY</div>
        <h1>Find your next<br /><em>great read.</em></h1>
        <p className="hero-copy">Search millions of books, explore new authors, and keep your favorite stories close.</p>

        <form className="search-form" onSubmit={handleSearch}>
          <span className="search-icon">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, author, or subject..."
            aria-label="Search books"
          />
          <button type="submit" disabled={!query.trim()}>Search books <span>→</span></button>
        </form>
        <p className="api-credit">
          Book data from{" "}
          <a
            href={dataSource === "Wikidata" ? "https://www.wikidata.org/" : "https://openlibrary.org/"}
            target="_blank"
            rel="noreferrer"
          >
            {dataSource}
          </a>
        </p>
      </section>

      <section className="library-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">YOUR PERSONAL LIBRARY</p>
            <h2>{showFavorites ? "Your favorites" : "Explore books"}</h2>
          </div>
          <div className="view-controls">
            <button className={!showFavorites ? "view-tab active" : "view-tab"} onClick={() => setShowFavorites(false)}>Discover</button>
            <button className={showFavorites ? "view-tab active" : "view-tab"} onClick={() => setShowFavorites(true)}>
              Favorites <span className="count">{favorites.length}</span>
            </button>
          </div>
        </div>

        {!showFavorites && !loading && !error && (
          <p className="result-line">
            Showing results for <strong>“{submittedQuery}”</strong>
            {totalResults ? <span> · {totalResults.toLocaleString()} books found</span> : null}
          </p>
        )}

        {loading && (
          <div className="status-box"><div className="spinner"></div><strong>Finding your books...</strong><p>Searching book catalogs</p></div>
        )}

        {!loading && error && (
          <div className="status-box error-box"><span className="status-emoji">⚠️</span><strong>We couldn't load the books.</strong><p>{error}</p><button onClick={() => setRetryCount((count) => count + 1)}>Try again</button></div>
        )}

        {!loading && !error && visibleBooks.length === 0 && (
          <div className="status-box"><span className="status-emoji">📚</span><strong>{showFavorites ? "No favorites yet" : "No books found"}</strong><p>{showFavorites ? "Tap the heart on any book to save it here." : "Try another title, author, or subject."}</p></div>
        )}

        {!loading && !error && visibleBooks.length > 0 && (
          <div className="book-grid">
            {visibleBooks.map((book) => (
              <BookCard
                key={book.key}
                book={book}
                isFavorite={favorites.some((item) => item.key === book.key)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}

        {!showFavorites && !loading && !error && books.length > 0 && totalPages > 1 && (
          <div className="pagination">
            <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>← Previous</button>
            <span>Page <strong>{page}</strong> of {totalPages.toLocaleString()}</span>
            <button onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>Next →</button>
          </div>
        )}
      </section>

      <footer>
        <span>BookNest <span className="footer-dot">•</span> Made for curious minds</span>
        <span>Book data from {dataSource}</span>
      </footer>
    </main>
  );
}
