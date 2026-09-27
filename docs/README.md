# Questionnaire API - Bruno Collection

This folder is a ready-to-use [Bruno](https://www.usebruno.com/) collection.

## How to Use

1. Open **Bruno**.
2. Click **Open Collection** and select this `docs` folder.
3. Select the **Local** environment (configured to `http://localhost:3000`).
4. Execute any of the requests!

---

### Collection Requests

#### 1. Questions API
| Request | Method | Endpoint | Description |
|---|---|---|---|
| `Health Check` | `GET` | `/health` | Server status and uptime |
| `List Questions` | `GET` | `/api/questions` | List questions with pagination |
| `Filter by Category` | `GET` | `/api/questions?category=JavaScript` | Filter by category |
| `Filter by Difficulty` | `GET` | `/api/questions?difficulty=easy` | Filter by difficulty level |
| `Get Question by ID` | `GET` | `/api/questions/:id` | Get question without answer key |
| `Answer Question - Correct` | `POST` | `/api/questions/:id/answer` | Test correct answer submission |
| `Answer Question - Incorrect` | `POST` | `/api/questions/:id/answer` | Test incorrect answer feedback |
| `Error - Question Not Found` | `GET` | `/api/questions/:id` | Tests 404 handling |
| `Error - Invalid Option` | `POST` | `/api/questions/:id/answer` | Tests 422 validation |

#### 2. User & Participation Flow
| Request | Method | Endpoint | Description |
|---|---|---|---|
| `Create User` | `POST` | `/api/users` | Register or find user by email |
| `Start Participation` | `POST` | `/api/participations/start` | Start a quiz session for a user |
| `Answer in Participation` | `POST` | `/api/participations/:id/answer` | Answer a question in the session |
| `Finish Participation` | `POST` | `/api/participations/:id/finish` | Queue the session for finalization (**202**) |
| `Get Participation Details` | `GET` | `/api/participations/:id` | Get full participation summary |
| `Readiness Check` | `GET` | `/health/ready` | Redis status, worker status, queue depth |

---

### Answering is write-behind

Answers are **not** written to PostgreSQL as they arrive — they are staged in
Redis, and `Finish Participation` hands them to a BullMQ queue that the API
drains in the background.

Two consequences when using this collection:

1. `Finish Participation` returns **202 Accepted** with `status: "processing"`,
   not the final score. It returns 200 only when the participation was already
   completed.
2. To read the score, poll `Get Participation Details` until `status` becomes
   `"completed"`. Typically one poll — the worker drains in well under a second.

While a participation is in flight, `Get Participation Details` is served from
Redis and reports a live running score; once completed it is served from
PostgreSQL.
