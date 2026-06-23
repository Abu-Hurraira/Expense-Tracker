# Expense Tracker

A full-stack personal finance tracker built with **React**, **ASP.NET Core Web API**, and **SQL Server**. Designed for localhost deployment as a final-year CS project.

## Features

- **Dashboard** — Balance, income/expense summary, trend charts, recent transactions
- **Transactions** — CRUD with search, filters, tags, pagination, file attachment paths
- **Categories** — Income/expense categories with colors and FontAwesome icons
- **Budgets** — Monthly budgets with progress bars and overspending alerts
- **Accounts** — Cash, Bank, Wallet accounts with internal transfers
- **Reports** — Monthly reports with category breakdown and daily spending charts
- **Calendar** — Daily spending heatmap with transaction drill-down
- **Goals** — Savings goals with contribution tracking
- **Notifications** — In-app budget and recurring transaction alerts
- **Export** — CSV, Excel, and monthly report downloads
- **Settings** — Currency (PKR default), dark/light theme, data reset
- **Auth** — JWT login/register with password hashing and session timeout

## Architecture

```
Controller → Service → Repository → SQL Server
```

- **ExpenseTracker.API** — Controllers, services, JWT middleware
- **ExpenseTracker.Core** — Entities, DTOs, interfaces
- **ExpenseTracker.Infrastructure** — EF Core DbContext, repositories
- **frontend** — React SPA with Recharts

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download) (or .NET 8+)
- [Node.js 18+](https://nodejs.org/)
- [SQL Server](https://www.microsoft.com/sql-server) (LocalDB or Express)

## Setup

### 1. Database

Run the schema script against your local SQL Server instance:

```sql
-- Open in SSMS or sqlcmd
database/ExpenseTrackerDB.sql
```

Or let EF Core create tables automatically on first API run (`EnsureCreated`).

Update the connection string in `backend/ExpenseTracker.API/appsettings.json` if needed:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=ExpenseTrackerDB;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

For SQL Server LocalDB:

```
Server=(localdb)\\mssqllocaldb;Database=ExpenseTrackerDB;Trusted_Connection=True;TrustServerCertificate=True;
```

### 2. Backend API

```bash
cd backend/ExpenseTracker.API
dotnet run
```

API runs at **http://localhost:5000**

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:5173**

## Default Usage

1. Open http://localhost:5173
2. Click **Register** to create an account
3. Default categories (Food, Transport, Bills, Salary, etc.) and accounts (Cash, Bank, Wallet) are seeded automatically
4. Start adding transactions from the Dashboard or Transactions page

## API Endpoints

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Dashboard | `GET /api/dashboard/summary` |
| Transactions | `GET/POST/PUT/DELETE /api/transactions` (paginated) |
| Categories | `GET/POST/PUT/DELETE /api/categories` |
| Budgets | `GET/POST/PUT/DELETE /api/budgets` |
| Accounts | `GET/POST /api/accounts`, `POST /api/accounts/transfer` |
| Reports | `GET /api/reports/monthly` |
| Calendar | `GET /api/calendar` |
| Goals | `GET/POST /api/goals`, `POST /api/goals/{id}/contribute` |
| Notifications | `GET /api/notifications`, `PUT /api/notifications/{id}/read` |
| Export | `GET /api/export/transactions/csv`, `/excel`, `/report/excel` |
| Settings | `PUT /api/settings`, `DELETE /api/settings/reset` |

All endpoints except auth require `Authorization: Bearer <token>` header.

## Performance

- Server-side pagination and filtering for transactions
- Dashboard summary cached in memory (2-minute TTL)
- SQL indexes on `UserId`, `TransactionDate`, `CategoryId`
- Async/await throughout the backend

## Project Structure

```
Tracker/
├── database/ExpenseTrackerDB.sql
├── backend/
│   ├── ExpenseTracker.API/
│   ├── ExpenseTracker.Core/
│   └── ExpenseTracker.Infrastructure/
└── frontend/
    └── src/
        ├── api/
        ├── components/
        ├── context/
        └── pages/
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Recharts, Axios |
| Backend | ASP.NET Core 10, EF Core, JWT Bearer |
| Database | SQL Server |
| Export | ClosedXML (Excel), CSV |

## License

Educational project — free to use and modify.
