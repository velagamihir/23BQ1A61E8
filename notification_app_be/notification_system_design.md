# Stage 1

## Notification System API Design

This document outlines the REST API for the notification feature. It covers what actions are supported, how the endpoints look, and how real-time delivery works.

---

## Core Actions

- Get all notifications for the logged-in user
- Get a single notification by ID
- Mark one notification as read
- Mark all notifications as read
- Delete a notification

---

## Base URL

/api/v1/notifications

All requests require an Authorization header with a Bearer token.

---

## Endpoints

### Get All Notifications

GET /api/v1/notifications

Optional query params: read (true/false), page, limit

Returns a list of notifications and basic pagination info.

### Get One Notification

GET /api/v1/notifications/:id

Returns the full notification object or a 404 if it doesn't exist.

### Mark One as Read

PATCH /api/v1/notifications/:id/read

No body needed. Returns the updated notification.

### Mark All as Read

PATCH /api/v1/notifications/read-all

Marks everything as read and returns how many were updated.

### Delete a Notification

DELETE /api/v1/notifications/:id

Removes the notification and confirms deletion.

---

## Notification Object Fields

- id — unique identifier
- userId — who the notification belongs to
- type — one of: info, warning, success, error
- title — short heading
- body — the full message
- read — true or false
- createdAt — ISO timestamp

---

## Real-Time Notifications

We use Server-Sent Events (SSE) for live delivery. It's a simple one-way stream from server to client, no WebSocket overhead needed.

Endpoint: GET /api/v1/notifications/stream

The client connects using the browser's EventSource API and listens for "notification" events. Each event contains the notification object as JSON. The front end can then parse it and update the UI immediately.

---

## Errors

All errors follow the same shape: a success field set to false, a human-readable message, and a short error code. Standard HTTP status codes apply (400, 401, 403, 404, 500).

---

# Stage 2

## Database Choice

PostgreSQL is a better choice here. Notifications have a fixed, predictable structure — a clear set of fields that don't really change per record. A relational database fits that well. PostgreSQL also handles indexing well, supports ACID transactions (so marking something as read doesn't get lost), and scales reasonably for this kind of workload. PSQL is also very easy to setup with NodeJS environment and works exceptionally well with structured data. NoSQL like MongoDB can also be used here, but the usage is not needed considering the setup complexity of the mongodb.

---

## DB Schema

Table: notifications

- id — UUID, primary key
- user_id — UUID, foreign key referencing the users table, not null
- type — VARCHAR(20), one of info, warning, success, error
- title — VARCHAR(255), not null
- body — TEXT, not null
- read — BOOLEAN, default false
- created_at — TIMESTAMP, default current timestamp

Index on user_id since almost every query filters by it.
Index on read so filtering unread notifications is fast.

---

## Scaling Problems and Solutions

The notifications table will get large fast, especially for apps with many users. Queries like "get all unread notifications for user X" will slow down. The fix here is partitioning the table by user_id or by created_at (monthly partitions work well). This keeps each partition small and queries fast.

Old notifications pile up and most users never go back to read them. Archiving or deleting notifications older than 90 days keeps the table lean. A background job can handle this on a schedule.

Read/write patterns are uneven. Reads are far more frequent than writes. Adding a read replica for SELECT queries takes load off the primary database.

If the app grows to millions of users, caching unread counts per user in Redis avoids hitting the database on every page load.

---

## Queries

Get all notifications for a user:

SELECT \* FROM notifications WHERE user_id = 'user_123' ORDER BY created_at DESC LIMIT 20 OFFSET 0;

Get only unread notifications:

SELECT \* FROM notifications WHERE user_id = 'user_123' AND read = false ORDER BY created_at DESC;

Get a single notification:

SELECT \* FROM notifications WHERE id = 'notif_01' AND user_id = 'user_123';

Mark one notification as read:

UPDATE notifications SET read = true WHERE id = 'notif_01' AND user_id = 'user_123';

Mark all notifications as read:

UPDATE notifications SET read = true WHERE user_id = 'user_123' AND read = false;

Delete a notification:

DELETE FROM notifications WHERE id = 'notif_01' AND user_id = 'user_123';

Insert a new notification (server-side when an event occurs):

INSERT INTO notifications (id, user_id, type, title, body) VALUES ('notif_99', 'user_123', 'info', 'New message', 'You have a new message from Alex.');

Count unread notifications (for badges/indicators):

SELECT COUNT(\*) FROM notifications WHERE user_id = 'user_123' AND read = false;

# Stage 3

## Analysis of Current Query

Current Query:

```sql
SELECT *
FROM notifications
WHERE studentID = 1042
AND isRead = false
ORDER BY createdAt DESC;
```

### Why is it slow?

With 5,000,000 notifications, the database may perform a large table scan to find matching rows and then sort them. This increases query execution time as data grows.

### Recommended Improvement

Create a composite index:

```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications(studentID, isRead, createdAt DESC);
```

Benefits:

- Faster filtering by `studentID`
- Faster filtering by `isRead`
- Faster ordering by `createdAt`

### Computational Cost

Without index:

- Time Complexity: O(N)

With composite index:

- Time Complexity: O(log N)

---

## Should We Add Indexes on Every Column?

No.

Adding indexes on every column is not effective because:

- Increases storage usage
- Slows INSERT, UPDATE, and DELETE operations
- Many indexes may never be used
- Database optimizer may ignore unnecessary indexes

Indexes should only be added on frequently queried columns.

---

## Query: Students Who Received Placement Notifications in Last 7 Days

```sql
SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement'
AND createdAt >= NOW() - INTERVAL 7 DAY;
```

Recommended Index:

```sql
CREATE INDEX idx_notifications_type_date
ON notifications(notificationType, createdAt);
```

# Stage 4

## Problem

Notifications are fetched from the database on every page load for every student. As the number of students and notifications grows, this creates a large number of database queries and increases response time.

## Proposed Solutions

### 1. Caching

Store frequently accessed notifications in Redis.
Redis is used for caching, instead of retrieving the data from the DB everytime, which might increase the request hits to the DB everytime which might increase the load and decrease the retrieval speed.

Benefits:
- Reduces database load
- Faster response times
- Improves user experience

Tradeoff:
- Additional infrastructure required
- Cache invalidation must be handled properly

---

### 2. Pagination

Fetch notifications in smaller batches instead of loading all notifications. In this method we use dynamic loading, we only load a set of notifications in that page, after the user selects another page, we then load that set of notifications. This method might decrease load on the server by not loading all the notifications at once.

Example:

```http
GET /notifications?page=1&limit=20
```

Benefits:
- Less data transferred
- Faster queries

Tradeoff:
- Requires multiple requests for older notifications

---

### 4. Client-Side Caching

Store recently fetched notifications in the browser and refresh only when needed.

Benefits:
- Fewer API requests
- Faster page loads

Tradeoff:
- Data may become slightly stale, which means that once the data is stored in the client side cache, the main data in the DB might change/

---

## Recommended Architecture

- PostgreSQL for persistent storage
- Redis for caching unread notifications
- Pagination for notification history
- WebSockets for real-time updates

This approach significantly reduces database load while providing fast and scalable notification delivery.

# Stage 5
## What's Wrong With the Current Implementation
- The biggest problem is that it's a plain sequential loop. For 50,000 students, every student waits for the previous one to finish before anything happens. That means send_email, save_to_db, and push_to_app all run one by one, in order, for every single student. That's going to be extremely slow.
- There's also no error handling. If send_email fails on student 200, the loop either crashes and stops, or silently moves on. Either way, students 201 onwards might never get the email. There's no retry, no record of who failed, and no way to resume from where it broke.
- The three operations are tightly coupled too. Email, DB insert, and push notification all happen inside the same loop iteration with no separation. One failure has the potential to affect all three for that student.

## What to Do About the 200 Failed Students
- The failed student IDs need to be logged at the time of failure. Without that, there's no way to know who didn't get the email. Once you have the list, you reprocess just those 200 — not all 50,000 again.

- This is only possible if the system tracks failures. The current implementation doesn't do that at all, which is why logging who failed and why is a must-have.

## Should Saving to DB and Sending Email Happen Together
- No, they should not be done together.
- Saving the data in the DB happens in the local level, fast and reliable. Meaning that there are very few chances for the DB operations to fail. But, the sending the mails purely depends on the external API service and the internet connectivity to the server which is unreliable.
- The better approach is to always save to the database first. The DB is the source of truth. Email is just a delivery mechanism. If the email fails, the record is still in the database and can be retried later without any data loss.

## Redesigned Approach
- Instead of processing 50,000 students in a loop, push each student as a job into a message queue. Multiple workers then pull from that queue in parallel. This makes it fast and also gives you automatic retries on failure.
- Each worker handles one student at a time and follows this order: save to DB first, then send email, then push to app. If email fails, the job is retried. The DB insert is not rolled back. The push notification is best-effort and not critical.

## Revised Pseudocode
```python
function notify_all(student_ids: array, message: string):
for student_id in student_ids:
enqueue({ student_id, message })
function process_job(job):
save_to_db(job.student_id, job.message)
success = send_email(job.student_id, job.message)
if not success:
    log_failure(job.student_id, "email")
    retry_later(job)
    return

push_to_app(job.student_id, job.message)
```
