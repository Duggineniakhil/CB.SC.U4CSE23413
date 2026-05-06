# Notification System Design

## Stage 1
### REST API Structure

**Endpoints:**
1. `GET /api/v1/notifications`
   - **Action:** Fetch notifications for the authenticated student.
   - **Headers:** `Authorization: Bearer <token>`
   - **Response Structure:**
     ```json
     {
       "success": true,
       "data": [
         {
           "id": "uuid",
           "type": "Placement | Event | Result",
           "message": "string",
           "isRead": boolean,
           "createdAt": "timestamp"
         }
       ]
     }
     ```

2. `PATCH /api/v1/notifications/:id/read`
   - **Action:** Mark a specific notification as read.
   - **Headers:** `Authorization: Bearer <token>`
   - **Request Structure:** Empty body.
   - **Response Structure:** `{"success": true, "message": "Marked as read"}`

**Real-time Notification Mechanism:**
To ensure real-time updates for Placements, Events, and Results without continuously polling the server, we will use Server-Sent Events (SSE) or WebSockets. WebSockets allow bi-directional communication, so when the server creates a new notification, it pushes the payload immediately to the connected client.

## Stage 2
### Storage Layer

**Database Choice:** PostgreSQL
**Why:** Notifications have a well-defined, structured schema. PostgreSQL handles relational data perfectly, offers strong ACID compliance (crucial for ensuring users don't miss important updates like placements), and supports JSONB if we need flexible metadata.

**DB Schema:**
- **Table: Notifications**
  - `id` (UUID, Primary Key)
  - `student_id` (UUID, Foreign Key)
  - `type` (Enum: Placement, Event, Result)
  - `message` (Text)
  - `is_read` (Boolean, Default: false)
  - `created_at` (Timestamp, Default: now())

**Scaling Problems:**
As the system scales (e.g., sending out results to all students simultaneously), the database will experience high write loads, leading to write contention and slower read queries for students loading their dashboards.

**Scaling Solutions:**
1. **Read Replicas:** Route `GET` requests to replica databases to take the load off the primary DB.
2. **Partitioning:** Partition the Notifications table by `created_at` (e.g., monthly) so queries on recent notifications scan smaller datasets.

**SQL Queries (from Stage 1):**
- Fetch: `SELECT * FROM notifications WHERE student_id = ? ORDER BY created_at DESC LIMIT 50;`
- Update: `UPDATE notifications SET is_read = true WHERE id = ? AND student_id = ?;`

## Stage 3
### Query Performance Analysis

**Existing Query:**
`SELECT * FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt ASC;`

**Is it accurate?** No, notifications should typically be ordered by `createdAt DESC` to show the most recent ones first. Ordering by ASC shows the oldest unread notifications first.
**Why is it slow?** With 5,000,000 rows, a sequential scan might be performed if there are no indexes. Filtering by `studentID`, then `isRead`, and sorting by `createdAt` requires sorting a large dataset in memory or scanning the whole table.
**What changes would improve performance?** Add a composite index on `(studentID, isRead, createdAt DESC)`. This allows the DB to instantly locate the rows for the student, filter the unread ones, and retrieve them already in the sorted order.
**Computation cost:** Without an index, it's O(N) where N is the total number of notifications. With a B-Tree composite index, it becomes O(log N).
**Should indexes be added on every column?** No. Indexes take up storage space and slow down write operations (`INSERT`, `UPDATE`, `DELETE`) because the index must be updated every time. We should only index columns used in `WHERE`, `JOIN`, or `ORDER BY` clauses.

**Query (Placement last 7 days):**
```sql
SELECT DISTINCT studentID 
FROM notifications 
WHERE type = 'Placement' AND createdAt >= NOW() - INTERVAL '7 days';
```

## Stage 4
### Performance Optimization

**Problem:** Notifications are fetched on every page load, overloading the DB.
**Solutions & Tradeoffs:**
1. **Caching Layer (Redis):** Cache the recent notifications for each student in Redis.
   - *Tradeoff:* Requires cache invalidation logic when new notifications arrive. Memory usage increases.
2. **Pagination/Cursor-based loading:** Only fetch the first 20 notifications, and load more only when the user scrolls.
   - *Tradeoff:* Adds slight complexity to the API and frontend logic.
3. **WebSockets (Push over Pull):** Instead of fetching on load, the client keeps a persistent connection and the server pushes new events.
   - *Tradeoff:* Managing many open connections requires more RAM on the server and load balancing (e.g., Redis Pub/Sub for distributed WebSockets).

## Stage 5
### Notify All Reliability

**Shortcomings of Existing Pseudocode:**
1. **Synchronous Execution:** A simple `for` loop over 50,000 students running sequentially will take a very long time, blocking the thread and likely timing out the HTTP request.
2. **Partial Failure:** If `send_email(student_id)` fails midway (e.g., at student 25,000), the loop crashes. The remaining 25,000 students get nothing, and retrying is hard without duplicating emails.

**How to redesign reliably:**
Use an asynchronous Task Queue / Message Broker (like RabbitMQ, Kafka, or AWS SQS). The HTTP request just publishes an event ("Send Notification to All"), and worker services process it in the background.

**Should DB save and email happen together?**
No, saving to the DB should happen first to ensure durability. Then, an event should be dispatched to send the email. If the email service goes down, the database record still exists, and the email can be retried later.

**Improved Pseudocode:**
```python
function notify_all(student_ids: array, message: string):
    # Step 1: Bulk insert into DB (fast)
    bulk_save_to_db(student_ids, message)
    
    # Step 2: Push jobs to a message queue for async processing
    for student_id in student_ids:
        enqueue_task("send_notification", {"student_id": student_id, "message": message})

# In a background worker process:
function process_task(task):
    try:
        send_email(task.student_id, task.message)
        push_to_app(task.student_id, task.message)
    except Error:
        retry_task(task)
```
