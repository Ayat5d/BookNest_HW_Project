# BookNest — React Book Finder

A beginner-friendly book discovery app built with **Vite + React**. It uses the Open Library Search API with Wikidata as a fallback and stores favorites in the browser's `localStorage`.

## Features

- Search books by title, author, or subject.
- Use Wikidata as a backup when Open Library is unavailable or has no matches.
- Display book covers, authors, first publication year, and edition count.
- Loading indicator while data is fetched.
- Error message if the API request fails.
- Pagination (12 results per page).
- Add/remove favorite books.
- Favorites remain saved after refreshing the browser using `localStorage`.
- Responsive layout for desktop and mobile.

## 1. Install the requirements

Install **Node.js (LTS)** from https://nodejs.org/. Then open VS Code.

Check that Node.js and npm are installed:

```bash
node -v
npm -v
```

## 2. Create a Vite + React project (demonstration commands)

If you were creating the project from scratch, run:

```bash
npm create vite@latest book-finder-react -- --template react
cd book-finder-react
npm install
```

This downloaded project already contains the Vite + React setup, so after extracting this ZIP, open the `book-finder-react` folder in VS Code and run:

```bash
npm install
npm run dev
```

Open the local URL printed in the terminal (usually `http://localhost:5173`).

### Use VS Code Go Live (Live Server)

Live Server serves static files, so build the app before using it:

```bash
npm run build
```

The workspace is configured to serve the generated `dist` folder when you click **Go Live**. Re-run the build after changing the app so the served files are up to date.

## 3. How the API works

The app sends a GET request to:

```text
https://openlibrary.org/search.json?q=the+alchemist&page=1&limit=12
```

- `q` is the search text.
- `page` selects the result page.
- `limit` controls the number of results.
- The API returns JSON. The app reads the `docs` array and displays each book.
- If Open Library is unavailable or returns no matches, the app searches Wikidata for book metadata instead.

Book cover images use:

```text
https://covers.openlibrary.org/b/id/COVER_ID-M.jpg
```

API documentation: https://openlibrary.org/developers/api

## 4. Important React concepts used

| Concept | Where / why it is used |
|---|---|
| Components | `App` and `BookCard` split the UI into reusable pieces. |
| `useState` | Stores search text, books, loading, error, page, and favorites. |
| `useEffect` | Fetches data when the search/page changes and saves favorites. |
| `fetch()` | Sends the API request. |
| `async/await` | Waits for the API response. |
| `map()` | Creates one `BookCard` for each book. |
| `localStorage` | Saves favorites in the browser. |
| `URLSearchParams` | Safely builds the API query string. |
| `AbortController` | Cancels an old request if a newer search starts. |

## 5. How favorites work

When the app starts, it reads `booknest-favorites` from `localStorage`. When a heart is clicked, React updates the favorites state. A `useEffect` watches that state and writes the updated list back to `localStorage` as JSON.

To test it: click a heart, open Favorites, refresh the page, and confirm the saved book is still there.

## 6. Upload to GitHub

1. Create a new **public** repository on https://github.com/.
2. In VS Code, open the project folder.
3. Open Terminal → New Terminal.
4. Run these commands (replace the URL with your own repository URL):

```bash
git init
git add .
git commit -m "Build BookNest React API app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/book-finder-react.git
git push -u origin main
```

If Git asks you to identify yourself, configure your name and email:

```bash
git config --global user.name "Your Name"
git config --global user.email "YOUR-EMAIL"
```

Do not upload the `node_modules` folder. It is excluded by `.gitignore`.

## 7. Presentation checklist

- [ ] Explain that Vite is the development/build tool and React builds the UI.
- [ ] Show `npm create vite@latest ... -- --template react`.
- [ ] Show `npm install` and `npm run dev`.
- [ ] Search for a book (try `Harry Potter` or `Atomic Habits`).
- [ ] Explain that `fetch()` gets JSON from Open Library.
- [ ] Show the loading indicator and explain the error handling.
- [ ] Add a favorite, open Favorites, refresh, and show it is still saved.
- [ ] Explain `useState`, `useEffect`, `map()`, and `localStorage`.

## 8. Example explanation for the teacher

"My project is BookNest, a book search application built with Vite and React. I used the Open Library Search API to retrieve book information. When a user submits a search, React updates the search state, and `useEffect` runs the fetch request. The API responds with JSON data, and I use `map()` to display each book through a reusable BookCard component. I added loading and error states to improve the user experience. Users can save books as favorites. I store those favorites in localStorage, so they remain available after refreshing the page."

## Troubleshooting

- **`npm` is not recognized:** Install Node.js LTS and restart VS Code.
- **No books load:** Check your internet connection and try again. Open Library is a public service, so it may occasionally be unavailable.
- **Favorites disappear:** Make sure browser storage is enabled and do not use private/incognito browsing for the demo.
- **Git push fails:** Check that the repository URL is correct and that you are signed in to GitHub.
