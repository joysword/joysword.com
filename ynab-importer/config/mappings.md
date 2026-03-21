# Transaction Mappings

## Payee → Category

Map raw payee strings from bank CSVs to clean YNAB payee names and categories.
Patterns are matched case-insensitively against the raw payee string.

| Payee pattern (regex) | YNAB Payee     | YNAB Category              |
|-----------------------|----------------|-----------------------------|
| TRADER JOE.*          | Trader Joe's   | Groceries                   |
| WHOLE FOODS.*         | Whole Foods    | Groceries                   |
| SPOTIFY.*             | Spotify        | Subscriptions: Music        |
| NETFLIX.*             | Netflix        | Subscriptions: Streaming    |
| AMZN.*\|AMAZON.*      | Amazon         | Shopping                    |
| UBER\s+EATS.*        | Uber Eats      | Dining Out                  |
| UBER\s+TRIP.*        | Uber           | Transportation              |
| LYFT.*                | Lyft           | Transportation              |

## Source → Account

Map the bank/card source to the YNAB account name.
Used when `--bank` is specified or auto-detected.

| Bank ID       | YNAB Account Name        |
|---------------|--------------------------|
| chase         | Chase Freedom Unlimited   |
| bofa          | BofA Checking             |
| amex          | Amex Gold                 |
