# Form & Field

**An e-commerce portfolio demo, rebuilt from my original full-stack bootcamp project.**

A Vue storefront and Express API with a persistent PostgreSQL catalog. Browse, search, filter, and sort products; open product details; manage the catalog; and keep a shopping bag in your browser.

![Form & Field desktop catalog](docs/screenshots/catalog-desktop.png)

## What works

- Reactive product loading with loading, error, retry, and empty states.
- Instant search across product names, descriptions, and categories.
- Category filters and price/name sorting.
- Product details in a keyboard-accessible native dialog, including Escape-to-close and focus restoration.
- Product creation, editing, and confirmed deletion; changes appear in the catalog immediately.
- Validation in the form and API, including non-negative prices and whole-number stock quantities.
- Product images from URLs, bundled illustrations, and a fallback for missing/broken images.
- A browser-persisted shopping bag with quantity controls, stock limits, removal, and subtotal.
- Bag prices and stock are refreshed from the API when opening the bag.
- Responsive desktop and mobile layouts.

This is a **local portfolio demo**. It does not process payments, place orders, reserve inventory, or provide authentication. Catalog-management endpoints are unauthenticated; add authentication and authorization before making them publicly accessible.

## Run locally

### Requirements

- **Node.js 24.15+** recommended. The package engines also support Node 22.12+, but npm 12 requires Node 22.22.2+, 24.15+, or 26+.
- **npm 12.2.0**, used for the verified clean installs.
- No separate PostgreSQL or Elasticsearch installation is needed for the default local mode.

The dependencies were updated to the latest stable npm releases available on **October 15, 2026**. Lockfiles preserve the exact versions used for verification.

If your installed npm is older, run the commands below as `npx npm@12.2.0 ci`, `npx npm@12.2.0 start`, etc.

### 1. Clone and configure

```sh
git clone https://github.com/aahmetmeliksah/e-commerce1.git
cd e-commerce1
```

Copy `server/.env.example` to `server/.env`.

PowerShell:

```powershell
Copy-Item server/.env.example server/.env
```

macOS/Linux:

```sh
cp server/.env.example server/.env
```

The example enables `SEED_DEMO=true`, which inserts eight sample products **only when the catalog is empty**. Set it to `false` to start an empty catalog. Seeding never overwrites existing products.

### 2. Start the API

In the first terminal:

```sh
cd server
npm ci
npm start
```

API: **http://127.0.0.1:5000**
Health check: **http://127.0.0.1:5000/health**

The database schema is initialized before the API starts. Local data persists in `server/data/`, which is excluded from Git. Run one API process per embedded database directory. Back up data before upgrading PGlite across PostgreSQL major versions; an old data directory may require a dump/restore.

### 3. Start the storefront

In a second terminal, from the repository root:

```sh
cd client
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. The Vite development server forwards `/api` requests to the API on port 5000. Port 5173 is strict: an occupied port produces an error rather than silently changing the URL.

`npm run serve` remains an alias for `npm run dev`.

## Configuration

| Setting | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5000` | API port; the API binds to the local loopback interface |
| `DATA_DIR` | `server/data` | Persistent embedded PostgreSQL directory |
| `SEED_DEMO` | `false` in code; `true` in the example | Seed sample products when the catalog is empty |
| `DB_CONNECTION_STRING` | Unset | Use an existing PostgreSQL server instead of PGlite |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed origin for direct browser-to-API requests |
| `VITE_API_URL` | `/api` | Frontend API base URL, set at build time |

Server settings live in `server/.env`. Frontend settings can be placed in `client/.env.local`; see `client/.env.example`. Restart the relevant process after changing settings. If you change the API port, update the target in `client/vite.config.mjs` too.

### External PostgreSQL

Create a database and set this in `server/.env`:

```dotenv
DB_CONNECTION_STRING=postgresql://user:password@localhost:5432/ecommerce
SEED_DEMO=false
```

The schema in `server/db/schema.sql` is applied at startup. The API uses parameterized SQL through `pg` in this mode. Embedded PostgreSQL is the mode exercised by the automated integration test; an external PostgreSQL server was not available for this verification.

## Stack

| Layer | Libraries |
| --- | --- |
| UI | Vue 3.5.44, Vue Router 5.4.0 |
| Development/build | Vite 8.3.4, Vue plugin 6.0.10 |
| API | Express 5.3.0, Joi 18.2.9, Helmet 8.3.0, CORS 2.8.6 |
| Data | PGlite 0.5.10 locally; pg 8.23.1 for external PostgreSQL |
| Configuration | dotenv 18.0.8 |
| Tests | Node.js built-in test runner; browser flows verified with Playwright CLI |

The old Vue CLI, native `node-sass`, Bootstrap/jQuery integration, and disconnected Elasticsearch code were removed. Search uses the catalog's SQL query on the API and immediate filtering of the loaded catalog in the UI.

Product illustrations are original SVG assets bundled in `client/public/images/`. Google Fonts provides DM Sans and Manrope, with local font fallbacks when unavailable.

## API

All product endpoints return JSON except successful deletion.

| Method | Route | Result |
| --- | --- | --- |
| GET | `/health` | Database health |
| GET | `/products?q=lamp` | Product list, optionally searched |
| GET | `/products/:id` | Single product |
| POST | `/products` | Create product (`201`) |
| PUT | `/products/:id` | Replace product fields |
| DELETE | `/products/:id` | Delete product (`204`) |
| POST | `/addproduct` | Compatibility alias for creation |
| POST | `/search` | Compatibility search; accepts `{"q":"lamp"}` or `{"data":{"searchInput":"lamp"}}` |

Create/update body:

```json
{
  "product_name": "Ceramic Serving Bowl",
  "product_description": "A handmade ceramic bowl for daily use.",
  "category_name": "Kitchen",
  "category_id": 7,
  "price": 32.5,
  "quantity": 3,
  "img_url": ""
}
```

`img_url` accepts HTTP/HTTPS URLs, bundled `/images/name.svg` paths, or an empty string. The application loads external images in the browser; it does not download them on the server. Image uploads are not implemented.

Malformed input returns `400`; missing products return `404`; unexpected failures return `500` with a readable message.

## Verification

API integration test:

```sh
cd server
npm test
```

It creates an isolated temporary database and verifies seeding, CRUD, search, invalid inputs, missing IDs, persistence after reopening the database, and repeated deletion. It does not use your local catalog.

Production build:

```sh
cd client
npm run build
```

This writes `client/dist/`. `npm run preview` previews those files; configure `VITE_API_URL` to an accessible API URL before building, because the development proxy is not part of the production build. A real deployment also needs SPA route fallback and authenticated catalog management.

Checked on Windows with Node 24.15.0 and npm 12.2.0:

- Clean `npm ci` installs for client and server.
- API integration test and production frontend build passed.
- `npm outdated` reported no outdated direct dependencies.
- `npm audit` reported **zero known vulnerabilities** in both packages at verification time.
- Browser checks passed for loading, search/no results, categories, sorting, sold-out products, dialog dismissal, bag quantity/subtotal/persistence/removal, creation, editing, and cancelled/confirmed deletion.
- Simulated catalog failures, retry, empty catalogs, invalid prices, and failed saves preserving form input were checked.
- Mobile layout checked at 390 × 844 with no horizontal overflow.

## Screenshots

Captured from the running local app on October 15, 2026.

<details>
<summary>Product details and shopping bag</summary>

![Product detail dialog](docs/screenshots/product-details.png)

![Shopping bag](docs/screenshots/bag-desktop.png)

</details>

<details>
<summary>Add-product form</summary>

![Add product with live preview](docs/screenshots/add-product.png)

</details>

<details>
<summary>Mobile views</summary>

<img src="docs/screenshots/catalog-mobile.png" alt="Mobile catalog" width="300" />
<img src="docs/screenshots/details-mobile.png" alt="Mobile product detail dialog" width="300" />

</details>

## What was repaired

The original project could not start from a clean checkout: a logger module and database setup were missing, and the frontend's native Sass dependency failed on the current Node runtime. Product loading used a non-reactive import-time request; search was disconnected; product updates contained invalid SQL; creation mixed service and response handling; and deletion did not refresh the catalog.

The rebuild fixes those flows, consolidates the API error handling, replaces the placeholder bag page, and adds a consistent responsive interface. The original bootcamp project remains available in Git history.
