# YNAB API Reference — Transactions

Base URL: `https://api.ynab.com/v1`

## Authentication

All requests require a personal access token in the `Authorization` header:
```
Authorization: Bearer <token>
```

## Endpoints

### List Accounts
`GET /budgets/{budget_id}/accounts`

Returns all accounts in a budget. Response:
```json
{
  "data": {
    "accounts": [
      { "id": "uuid", "name": "Chase Freedom Unlimited", "type": "creditCard", "closed": false },
      { "id": "uuid", "name": "BofA Checking", "type": "checking", "closed": false }
    ]
  }
}
```

### List Categories
`GET /budgets/{budget_id}/categories`

Returns category groups with their categories. Response:
```json
{
  "data": {
    "category_groups": [
      {
        "name": "Frequent",
        "categories": [
          { "id": "uuid", "name": "Groceries" },
          { "id": "uuid", "name": "Dining Out" }
        ]
      }
    ]
  }
}
```

### Create Transactions (bulk)
`POST /budgets/{budget_id}/transactions`

Request body:
```json
{
  "transactions": [
    {
      "account_id": "uuid",
      "date": "2024-01-15",
      "amount": -45670,
      "payee_name": "Trader Joe's",
      "memo": "Weekly groceries",
      "category_id": "uuid",
      "import_id": "YNAB:-45670:2024-01-15:1",
      "cleared": "cleared"
    }
  ]
}
```

Response:
```json
{
  "data": {
    "transaction_ids": ["uuid1", "uuid2"],
    "duplicate_import_ids": ["YNAB:-45670:2024-01-15:1"]
  }
}
```

## Transaction Fields

| Field        | Type   | Required | Description                                      |
|-------------|--------|----------|--------------------------------------------------|
| account_id  | string | yes      | UUID of the YNAB account                         |
| date        | string | yes      | ISO 8601 date: `YYYY-MM-DD`                      |
| amount      | int    | yes      | Milliunits: dollars × 1000. Negative = outflow   |
| payee_name  | string | no       | Payee display name (max 100 chars)               |
| memo        | string | no       | Transaction memo (max 200 chars)                 |
| category_id | string | no       | UUID of category. Omit to leave uncategorized     |
| import_id   | string | no       | Dedup key (max 36 chars). Duplicates are skipped  |
| cleared     | string | no       | `"cleared"`, `"uncleared"`, or `"reconciled"`    |

## Amount Convention

- **Outflow** (spending): negative milliunits. $45.67 spent → `-45670`
- **Inflow** (income/refund): positive milliunits. $100.00 received → `100000`
- Conversion: `milliunits = dollars × 1000`

## import_id for Deduplication

Format: `YNAB:{milliunit_amount}:{iso_date}:{occurrence}`

- Same import_id = YNAB skips the transaction (server-side dedup)
- `occurrence` starts at 1, increments for same amount + same date
- Example: two $10 charges on 2024-01-15 →
  - `YNAB:-10000:2024-01-15:1`
  - `YNAB:-10000:2024-01-15:2`

## Rate Limits

- 200 requests per hour per access token
- Rate-limited responses return HTTP 429
