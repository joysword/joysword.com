# My Transaction Mapping Preferences

## Payees & Categories
- Trader Joe's, Whole Foods → category: Groceries
- Spotify → category: Subscriptions: Music
- Netflix → category: Subscriptions: Streaming
- Amazon, AMZN → payee: Amazon, category: Shopping
- Uber Eats → category: Dining Out
- Uber trips, Lyft → category: Transportation

## Account Mapping
CSVs come from transaction channels (Apple Pay, bank exports, PayPal, etc.),
not necessarily from a single account. Each row usually has a column indicating
which card or payment method was used. Map those to my YNAB accounts:

- "Chase Freedom", "Chase Freedom Unlimited" → account: "Chase Freedom Unlimited"
- "BofA Checking", "Bank of America" → account: "BofA Checking"
- "Amex Gold", "American Express Gold" → account: "Amex Gold"
- "Apple Card" → account: "Apple Card"

If the CSV has no per-row account column (e.g., a single-card statement),
use the file name or header info to determine the account.

## Notes
- Charges appear as negative amounts in some CSVs but positive in others
- If you're unsure about a category, leave it blank
- A single CSV from Apple Pay or PayPal may contain transactions across
  multiple cards — always check the per-row card/method column
