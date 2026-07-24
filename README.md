# Toleads PO Dashboard

Next.js accounting dashboard for purchases, salaries, sales, suppliers, other
expenses, reporting, and Excel data transfer.

## Production stack

- Next.js 16 App Router
- Better Auth authentication and authorization
- Prisma ORM
- Neon PostgreSQL
- Zod request validation
- ExcelJS imports and exports

The accounting data starts on **2026-07-01**. API validation rejects earlier
transaction dates, and every transaction must belong to an open accounting
period.

## Local setup

Use Node.js 22 as specified in `package.json`.

1. Copy `.env.example` to `.env.local`.
2. Create a Neon project and set its pooled connection string as `DATABASE_URL`.
3. Generate `BETTER_AUTH_SECRET` with `npx auth@latest secret`.
4. Temporarily set `BETTER_AUTH_DISABLE_SIGN_UP="false"` to create the first
   trusted account, set that user’s role to `admin` in Neon, then set sign-up
   back to `"true"`.
5. Install packages and initialize the database:

```bash
npm install
npm run db:generate
npm run db:deploy:local
npm run db:seed:local
npm run dev
```

`db:seed` creates the open accounting period beginning 1 July 2026.
Use the non-`local` database commands in deployment environments where
`DATABASE_URL` and `DIRECT_URL` are supplied by the platform.

For local UI work before Better Auth is configured, set
`ALLOW_INSECURE_LOCAL_DEV="true"`. Never enable this in production.

## Better Auth roles

The Better Auth `user.role` field accepts:

- `admin`: all operations, including soft deletion
- `accountant`: view, create, update, import and export
- `viewer`: read-only

The default authenticated role is `accountant`. Change roles through a trusted
database administration workflow. Public sign-up should remain disabled after
the initial account is created. API handlers repeat authorization at the point
where database data is accessed.

## API

| Endpoint | Supported operations |
| --- | --- |
| `/api/purchases` | GET, POST |
| `/api/purchases/[id]` | GET, PATCH, DELETE |
| `/api/salaries` | GET, POST |
| `/api/salaries/[id]` | GET, PATCH, DELETE |
| `/api/sales` | GET, POST |
| `/api/sales/[id]` | GET, PATCH, DELETE |
| `/api/expenses` | GET, POST |
| `/api/expenses/[id]` | GET, PATCH, DELETE |
| `/api/suppliers` | GET, POST |
| `/api/suppliers/[id]` | PATCH, DELETE |
| `/api/reports/summary` | GET |
| `/api/import/excel` | POST multipart form with `file` |
| `/api/export/excel` | GET |

List endpoints accept `page`, `pageSize`, `from`, `to`, `search`, and `shift`
where relevant. Deletes are soft deletes and require the `admin` role.

## Excel import

Upload the provided `Toleads_PO_Empty_Master_Template.xlsx` from the Data page.
The importer:

1. limits input to `.xlsx` files up to 10 MB;
2. validates every populated row before writing;
3. rejects dates before 1 July 2026;
4. checks duplicate external IDs within the workbook;
5. imports all valid sheets in one database transaction;
6. records the import batch and responsible Better Auth user.

If any row fails validation or a database constraint, no accounting rows from
that workbook are committed.

## Data integrity

- Monetary columns use PostgreSQL `DECIMAL`, not floating-point storage.
- Sales have one active entry per date and shift.
- Every mutation records the authenticated Better Auth user.
- Updates, deletes, and imports create audit-log entries.
- Soft-deleted rows are excluded from APIs and reports.
- The original PDF index remains separate from live accounting records.
