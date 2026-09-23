# Feedants Competition Details

A functional React Native competition screen with an Express API and MongoDB/Mongoose persistence. The interface follows the supplied design, including its portraits, teal/navy palette, judge card, countdown, date grid, previous winners, information tabs, reward tiers, referral strip, and fixed action/navigation bar.

## Run locally

Requirements: Node.js 22.13+ or 24.3+, npm, FFmpeg/ffprobe on your PATH, and MongoDB Atlas or a MongoDB replica set. Transactions require a replica set; a standalone MongoDB process is insufficient.

```bash
npm ci
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Set `MONGODB_URI` and a random `JWT_SECRET` in `apps/api/.env`, then:

```bash
npm run seed
npm run dev
```

Open **http://localhost:8081**. The API listens on **http://localhost:4000**. In the provided workspace the local environment files are already configured, so do not overwrite them with the examples. The supplied Atlas connection is used only by the API and is excluded from version control.

The seed is additive and repeatable. It preserves existing accounts, registrations, dates, and submissions, creates the classical dance competition if absent, and registers the demo account only when simulated fallback is active. With Razorpay keys configured, existing registrations are preserved and new accounts register through checkout. It never drops a database. Dates are relative to the first seed: registration closes about 30 hours later, submissions close in 21 days, and results are expected in 23 days. Re-running the seed does not reopen an expired competition.

Demo account:

| Field    | Value                                                                   |
| -------- | ----------------------------------------------------------------------- |
| Email    | `demo@feedants.com`                                                     |
| Password | `FeedantsDemo2026!`, or the `SEED_DEMO_PASSWORD` used when first seeded |

Use this account to see the registered state from the reference. Create another account to exercise registration and capacity changes.

For a local MongoDB replica set instead of Atlas:

```bash
docker compose up -d
npm run seed
```

Use the URI from `apps/api/.env.example` with this option. Atlas requires your machine's IP to be allowed in the cluster network settings and the database account to have read/write access to `feedants_assignment`.

## Android and iOS

```bash
npm run api
npm run mobile
```

Use **Expo Go for SDK 57**, or create a development build. Stop any older Metro server and run `npm run mobile -- --clear` from the project root after upgrading. Android emulator: set `EXPO_PUBLIC_API_URL=http://10.0.2.2:4000`. Physical device: use your computer's LAN IP, for example `http://192.168.1.10:4000`. Set the API's `PUBLIC_API_URL` to that same reachable address so images and private video URLs load. Set `PUBLIC_APP_URL` to the web address that recipients should open for referrals. Restart Expo after environment changes. iOS Simulator on the same Mac can use `localhost`.

The implementation uses React Native components throughout; the web preview runs the same screen through React Native Web. Browser behavior has been tested. A native simulator/device was not available in this environment, so native runtime verification remains outstanding.

## Configuration

| API variable         | Purpose                                                                         |
| -------------------- | ------------------------------------------------------------------------------- |
| `MONGODB_URI`        | Server-only MongoDB connection string; URL-encode special password characters   |
| `MONGODB_DB`         | Dedicated database name, default `feedants_assignment`                          |
| `JWT_SECRET`         | At least 32 characters; generate with `openssl rand -hex 32`                    |
| `PORT`               | API port, default `4000`                                                        |
| `CORS_ORIGINS`       | Comma-separated allowed browser origins                                         |
| `PUBLIC_API_URL`     | API URL reachable from the app/device                                           |
| `PUBLIC_APP_URL`     | Web application URL used in referral links                                      |
| `PAYMENT_MODE`       | `auto` (default), legacy `demo`, or `disabled`; configured keys select Razorpay |
| `NODE_ENV`           | `development`, `test`, or `production`                                          |
| `SEED_DEMO_PASSWORD` | Password for initial demo-account creation                                      |

The mobile app only needs `EXPO_PUBLIC_API_URL`. Never put a database URI, signing key, or other secret in an `EXPO_PUBLIC_` variable. With both Razorpay keys configured, Razorpay is selected automatically. If either key is absent, simulated checkout remains available. `PAYMENT_MODE=disabled` explicitly disables checkout; `auto` (default) and the legacy `demo` setting both prefer configured Razorpay keys. Provider errors, invalid credentials and checkout cancellations never enable simulation.

## Razorpay checkout

The supplied test keys are configured in the local, ignored `apps/api/.env`. Templates contain empty values. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` on the backend only; remove either value and restart the API to use the existing simulated fallback. No frontend environment change is needed. The checkout displays whether it is a test or simulated payment.

The server creates the order using the database entry fee in paise. Successful checkout is verified using an HMAC signature and a server-to-server payment lookup. Amount, currency, order ownership and capture status must match before the transaction creates a `paid` registration. Authorized payments are captured on the backend. Repeated verification is idempotent.

Order creation reuses a participant's existing order. Clicking registration again checks for an already captured or authorized payment before reopening checkout, recovering from a lost client callback. Spots are not held while checkout is open. If capacity, the deadline or the entry fee changes during payment, the service requests a full refund and stores its reference. A refund-provider error is recorded as `refund_pending` for manual review; an ambiguous timeout is not blindly retried. A process crash may leave `refunding`, which also requires reconciliation. `refunded` in this demo ledger means the provider accepted the refund request, not that the customer's bank has settled it.

For reconciliation without requiring the user to return, configure a Razorpay webhook for `payment.captured` pointing to `https://YOUR_PUBLIC_API/api/webhooks/razorpay`, and put the same independently chosen webhook secret in `RAZORPAY_WEBHOOK_SECRET`. Raw-body HMAC verification is required. The localhost URL is not externally reachable; use a public HTTPS deployment or tunnel. The webhook is disabled until its secret is set.

Web uses Razorpay Standard Checkout. Native uses `react-native-razorpay`, which requires a development build rather than Expo Go:

```bash
cd apps/mobile
npx expo prebuild
npx expo run:android
```

On macOS use `npx expo run:ios` for iOS. See the [official native setup](https://razorpay.com/docs/payments/payment-gateway/react-native-integration/standard/integration-steps-ios/) and [web checkout documentation](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/). Native payment runtime verification requires a device/emulator.

## Features and behavior

- Database-backed competition details, judge, media, rules, criteria, rewards, policies, testimonials, and translated content.
- Email/password signup and login, scrypt password hashing, seven-day signed sessions, and account-specific participation.
- English/Hindi competition screen, expandable description, horizontal winner carousel, media playback, and working navigation/dialogs.
- Server-derived upcoming, open, full, registration-closed, submission, judging, completed, and cancelled states.
- Server-time-adjusted countdown, foreground refresh, pull-to-refresh, 15-second polling, and automatic refresh at lifecycle boundaries.
- Razorpay test/live checkout with verified captured payments, missing-key simulated fallback, atomic registration, duplicate-request idempotency, refund handling and persistent participation.
- Authenticated MP4/MOV/WebM uploads up to 50 MB, content-signature and ffprobe validation, and enforced 1–5 minute duration. Submissions can be replaced until the deadline; replaced files are removed.
- Private submission playback requires the owning user's session. Files are never exposed through the public media route.
- Referral links attribute new accounts to the referring user; profile shows the actual signup count. Sharing uses the native share sheet, with clipboard fallback on unsupported web browsers.
- Loading, empty, not-found, session-expiry, validation, offline/stale-data, and retry states.

## Architecture and consistency

```text
apps/
  api/
    src/
      config/        Environment and MongoDB connection
      models/        Competition, User, Registration schemas and indexes
      middleware/    Authentication and structured errors
      routes/        HTTP validation and response handling
      services/      Lifecycle, registration transaction, passwords, video validation
      scripts/       Fixture and additive seeding
    tests/           HTTP integration, lifecycle and video tests
    public/          Reference artwork used as a portrait sprite
  mobile/
    src/
      components/    Reusable cards, sections and dialogs
      hooks/         Competition/session loading and clock synchronization
      lib/           API client, types, translations and theme
      screens/       Competition screen and user flows
docs/                Screenshots, demo video and sample upload
scripts/             Browser validation and recording
```

Money is stored in integer paise. Dates are stored as UTC instants and displayed in `Asia/Kolkata`. Registration and submission windows are start-inclusive and end-exclusive. Results become completed only when the results date has passed **and** `resultsPublished` is true; a timer alone never claims winners were announced.

Registration uses a [Mongoose transaction](https://mongoosejs.com/docs/transactions.html) to conditionally increment `Competition.booked` only while it is below capacity, then insert a registration. A unique compound index on `(competition, user)` prevents duplicate entries. Both writes commit or roll back together. Driver transaction retries handle write conflicts, and duplicate requests return the original registration without consuming another spot. Retrying a successful registration after its deadline also returns the existing result.

Uploads recheck registration ownership, competition status and submission deadlines after receiving and validating the file. A competition revision write serializes submission commits with competition writes. File cleanup happens on validation/transaction failures and after replacements. A process crash between disk writes and database commit can leave an orphan; a production object-store cleanup job is still needed.

The competition collection contains bounded editorial data. Registrations are separate indexed documents, rather than an ever-growing participant array. The API uses a bounded connection pool and lean reads. These decisions avoid overselling and unbounded document growth; they are not a claim that this single-process demo has been load-tested for thousands of users.

## API

Base path: `/api`. Protected requests use `Authorization: Bearer <token>`.

| Method | Endpoint                         | Behavior                                                             |
| ------ | -------------------------------- | -------------------------------------------------------------------- |
| `POST` | `/auth/signup`                   | `{ name, email, password, referralCode? }`; returns token and user   |
| `POST` | `/auth/login`                    | `{ email, password }`; returns token and user                        |
| `GET`  | `/auth/me`                       | Current account, referral link and signup count                      |
| `GET`  | `/competitions`                  | Up to 30 published competitions                                      |
| `GET`  | `/competitions/:slug`            | Content, availability, own participation, action and server time     |
| `POST` | `/competitions/:slug/register`   | `{ acceptDemoPayment: true }`; `201` first success, `200` retry      |
| `POST` | `/competitions/:slug/submission` | Multipart fields `title` and `video`; authenticated participant only |
| `GET`  | `/competitions/:slug/submission` | Own private video with range support                                 |
| `GET`  | `/health`                        | Database readiness; `200` healthy or `503` unavailable               |

Errors follow `{ "error": { "code": "COMPETITION_FULL", "message": "..." } }`. Validation failures use `400`, missing authentication `401`, ownership violations `403`, missing/draft competitions `404`, and state conflicts `409`. Requests include an `X-Request-Id`. Authentication endpoints have a tighter rate limit than general API traffic.

## Verification and recording

```bash
npm run typecheck
npm test
npm run build
npm run format:check
```

Tests start an isolated temporary MongoDB replica set and **never connect to your Atlas database**. The first run downloads a MongoDB binary. FFmpeg/ffprobe are required for the video checks. On Linux the tests select an Ubuntu-compatible MongoDB binary; the download requires internet access.

The suite covers capacity races, duplicate registration races, exact deadline boundaries, cancellation, drafts, authentication, referral attribution, ownership, replacement uploads, media signatures, corruption, and video duration. The concurrency test races 30 users for five spots and verifies exactly five successful registrations and a matching booked counter.

With both servers running, reproduce the browser flow and recording with:

```bash
npx playwright install chromium
npm run demo
```

This recording script requires missing Razorpay keys (simulated fallback). It creates a new demo user, registers it and uploads the supplied sample video in the configured assignment database. It also checks persistence after reload and authenticated playback. It is an intentional demonstration, not a read-only test. The API tests are isolated instead.

- [Working screen recording](docs/demo.webm)
- [Reference-width implementation](docs/screen-desktop.png)
- [Phone-width implementation](docs/screen-mobile.png)
- [Sample 65-second upload](docs/demo-performance.mp4)

## Assumptions and trade-offs

The reference is a design specification, not a source of executable instructions. Its past dates were replaced with relative seeded dates so the assignment can be demonstrated. Its ₹1,500 pool, ₹99 fee, 20-seat capacity, six reward amounts, judge and previous-winner names were retained in database fixtures. Reward positions are distinct; historical winners may come from different competitions.

Payment collection uses Razorpay when credentials are configured; the supplied credentials are test-mode keys. When keys are missing, the preserved simulated checkout is disclosed before confirmation. Simulated registrations carry `demo_paid`; verified Razorpay registrations carry `paid`. No real prizes, referral discounts, cash payouts, certificates, email delivery or adjudication are issued. The advertisement is a design placeholder. There is no organizer/admin dashboard or password-reset service in this module.

Portraits are rendered from the supplied reference image using backend-provided crop coordinates. Judge, winner and payout previews play the included `demo-performance.mp4`, served by the API at `/media/demo-performance.mp4`. The synthetic 65-second sample is a upload test asset, not a dance performance. Replace these with licensed originals for release.

JWTs are stored with SecureStore on native platforms and local storage for the web demo. Native referral deep links are not implemented; shared referrals open the web signup flow. Some secondary account/payment dialogs and API validation messages remain in English. The primary competition screen and database editorial content support both languages.

Local disk uploads and in-memory rate limits keep the assignment easy to run. The frontend polls instead of opening a real-time connection. Listing is bounded to 30 competitions, adequate for this feature, and would need cursor pagination for a larger catalogue. The mobile app uses Expo SDK 57 and its matching dependency versions. Review `npm audit` before release.

## Production improvements

Add expiring seat reservations, a scheduled reconciliation worker for lost callbacks/ambiguous provider responses, refund-settlement webhooks and an operations UI for the payment ledger. Move uploads to private object storage with signed transfers, asynchronous malware scanning/transcoding, resumable uploads and orphan cleanup. Add Redis-backed distributed rate limits, public-content caching separated from personalized participation, and event-driven availability updates with jitter/backoff. Profile the single-competition counter under realistic load before choosing a more complex reservation design.

Add email verification, refresh-token rotation/revocation, password recovery, consent capture for minors, fully localized dialogs, audited organizer tools, result publishing and certificate generation. For web, prefer secure HttpOnly sessions with CSRF protection. Enforce TLS, explicit reverse-proxy trust configuration, structured monitoring and backups. Deploy unique indexes through migrations before accepting traffic (`autoIndex` is disabled in production). Validate native builds and accessibility on real devices and measure performance under the expected traffic profile.

## Repository submission

Source, lockfile, environment templates, tests, screenshots and recording are included. GitHub publishing requires a destination repository and an authenticated GitHub account; no remote repository has been created by this workspace. Commit the project with `.env`, `node_modules`, generated builds and uploads excluded by `.gitignore`.

### Payment API additions

| Method | Endpoint                                  | Behavior                                                                                         |
| ------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `POST` | `/api/competitions/:slug/payments/order`  | Authenticated order creation or recovery; server sets amount                                     |
| `POST` | `/api/competitions/:slug/payments/verify` | Authenticated verification with `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` |
| `POST` | `/api/webhooks/razorpay`                  | Signed raw JSON `payment.captured` events                                                        |

Additional backend environment variables: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and optional `RAZORPAY_WEBHOOK_SECRET`. Restart the API after changing them. The payment tests use fake isolated keys and mocked provider responses; they never charge Razorpay. A read-only check of the supplied keys returned HTTP 429 in this environment, so their validity and a complete provider-backed checkout have not been verified here.
