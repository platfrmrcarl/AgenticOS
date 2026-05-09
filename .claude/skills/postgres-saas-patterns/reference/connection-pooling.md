# Connection Pooling: Cloud Run + Cloud SQL Postgres

## The math

Postgres `max_connections` is typically 100-200 on Cloud SQL (varies by tier). Cloud Run scales horizontally — each instance has its own pool. Total connections = `instances × pool_size`.

```
total_connections = max_instances × max_pool_size_per_instance
total_connections + headroom_for_other_services < postgres_max_connections
```

## Recommended settings

For a typical Cloud SQL `db-custom-2-8192` (~200 max_connections):

| Service type | max_instances | pool_size | total |
|---|---|---|---|
| Next.js frontend | 20 | 3 | 60 |
| Python ADK agent service | 10 | 5 | 50 |
| Background workers | 5 | 5 | 25 |
| **Total** | | | **135** |
| **Headroom** | | | **65** |

Always leave headroom for migrations, admin connections, and traffic spikes.

## Drizzle (TypeScript) config

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres({
  host: process.env.DB_HOST,  // /cloudsql/PROJECT:REGION:INSTANCE for Unix socket
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 3,                  // ← key: tiny per-instance pool
  idle_timeout: 20,        // close idle connections after 20s
  max_lifetime: 60 * 30,   // recycle every 30 min
  prepare: false,          // disable for PgBouncer transaction pooling
});

export const db = drizzle(client);
```

## SQLAlchemy (Python) config

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

engine = create_async_engine(
    DATABASE_URL,
    pool_size=5,             # tiny per-instance pool
    max_overflow=2,          # tiny burst capacity
    pool_timeout=30,
    pool_recycle=1800,       # 30 minutes
    pool_pre_ping=True,      # detect dead connections from Cloud SQL restarts
)

AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
```

## Cloud SQL Auth Proxy (Unix socket)

In your Cloud Run service, mount the Cloud SQL connection:

```bash
gcloud run deploy SERVICE_NAME \
  --add-cloudsql-instances=PROJECT:REGION:INSTANCE \
  --set-env-vars="DB_HOST=/cloudsql/PROJECT:REGION:INSTANCE" \
  --set-env-vars="DB_NAME=platfrmr,DB_USER=app" \
  --set-secrets="DB_PASSWORD=db-password:latest"
```

The proxy auto-runs as a sidecar on Cloud Run when you use `--add-cloudsql-instances`.

## When to add PgBouncer

If you outgrow the simple math above (more than ~200 concurrent connections needed), put PgBouncer in front of Cloud SQL in **transaction pooling mode**:

- Apps connect to PgBouncer (effectively unlimited)
- PgBouncer maintains a small pool to actual Postgres
- Transaction pooling means connections are returned to the pool after each transaction, not each session

Caveats:
- Transaction pooling breaks `SET` statements that span queries, prepared statements (set `prepare: false`), and `LISTEN/NOTIFY`
- Adds an extra hop of latency

## Diagnosing connection issues

```sql
-- Current connections by application
SELECT application_name, state, count(*)
FROM pg_stat_activity
GROUP BY application_name, state
ORDER BY count(*) DESC;

-- Long-running queries (potential leak source)
SELECT pid, now() - query_start AS duration, state, query
FROM pg_stat_activity
WHERE state != 'idle' AND now() - query_start > interval '30 seconds'
ORDER BY duration DESC;

-- Idle in transaction (definitely a leak)
SELECT pid, now() - state_change AS idle_duration, query
FROM pg_stat_activity
WHERE state = 'idle in transaction'
ORDER BY idle_duration DESC;
```

If you see "idle in transaction" with long durations, you have a leak — code path that opens a transaction and doesn't commit/rollback.
