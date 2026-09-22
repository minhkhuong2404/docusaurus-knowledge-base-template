---
id: google-calendar
title: "Design a Calendar System Like Google Calendar"
sidebar_label: "41. Google Calendar"
description: "Staff-level breakdown of recurring calendar events (RFC 5545 iCalendar RRULE expansion), RSVP invitation state machines, timezone handling, and concurrent conflict detection."
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Calendar System Like Google Calendar

Google Calendar coordinates billions of meetings, appointments, and reminders across hundreds of millions of users and global timezones. The core architectural challenge lies in **modeling complex recurring events (e.g. "every second Tuesday of the month except holidays")** without denormalizing infinite database rows, handling Daylight Saving Time (DST) shifts smoothly, managing multi-participant RSVP state machines, and executing concurrent double-booking conflict detection.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Event Creation & Management**: Create, edit, and delete single and recurring events with title, description, location, and conference links.
2. **Complex Recurrence Rules (RRULE)**: Support recurring patterns (daily, weekly, monthly, custom rules conforming to RFC 5545).
3. **Event Exceptions**: Modify or delete a single instance of a recurring series ("only this instance") or truncate future instances ("this and all following").
4. **Invitations & RSVP State Machine**: Invite attendees; attendees receive notifications and respond with `ACCEPTED`, `DECLINED`, or `TENTATIVE`.
5. **Timezone & DST Awareness**: Correctly display event times across participants in different time zones and handle Daylight Saving Time transitions.
6. **Reminders & Push Notifications**: Schedule notifications 10 minutes prior to meeting start.

### Non-Functional Requirements
- **Sub-50ms Calendar View Rendering**: Fetching a monthly or weekly calendar view for a user must return in $< 50\text{ms}$.
- **Consistency**: No phantom events; updates to meetings must be visible immediately to all attendees.
- **Conflict Detection**: Detect overlapping meetings and room booking conflicts in real time.
- **Scale**: Support **500+ Million active users** storing **10+ Billion events**.

### Capacity Estimations & Sizing (5 Years)
- **Active Users**: 500 Million users.
- **Events per User**: Average 20 events/month $\implies 240\text{ events/user/year}$.
- **Total Events Stored (5 Years)**:
  $$500\text{M users} \times 240 \times 5\text{ years} = \mathbf{600\text{ Billion Event Records}}$$
- **Storage Calculations**:
  - Most recurring events are represented by a **single RRULE definition row**, not individual instances!
  - Assuming 2 Billion active recurring rule rows + 5 Billion single events:
  - Average record size: 500 bytes.
  - Storage required: $7\text{ Billion} \times 500\text{ bytes} \approx \mathbf{3.5\text{ Terabytes}}$ (readily manageable on modern sharded relational databases like Spanner or PostgreSQL).
- **Throughput Sizing**:
  - Read QPS (viewing calendar grids): Average 50,000 QPS, peaking at **150,000 QPS** on Monday mornings.
  - Write QPS (creating/updating events): Average 5,000 QPS, peaking at **20,000 QPS**.

---

## 2. The Set Up

### Defining Core Entities

```
┌────────────────────────────────────────────────────────┐
│                      EVENT_MASTER                      │
├──────────────────┬──────────────┬──────────────────────┤
│ event_id         │ UUID         │ PRIMARY KEY          │
│ calendar_id      │ UUID         │ Owner Calendar ID    │
│ title            │ VARCHAR(256) │ Event Title          │
│ start_time_utc   │ TIMESTAMP    │ Base Start Time      │
│ end_time_utc     │ TIMESTAMP    │ Base End Time        │
│ timezone_iana    │ VARCHAR(64)  │ "America/New_York"   │
│ is_recurring     │ BOOLEAN      │ Recurring Flag       │
│ rrule            │ VARCHAR(256) │ RFC 5545 Rule String │
│ conference_url   │ VARCHAR(512) │ Google Meet URL      │
│ version          │ INT          │ Optimistic Lock Rev  │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                     EVENT_EXCEPTION                    │
├──────────────────┬──────────────┬──────────────────────┤
│ exception_id     │ UUID         │ PRIMARY KEY          │
│ parent_event_id  │ UUID         │ FK to EVENT_MASTER   │
│ original_time_utc│ TIMESTAMP    │ Target Instance Date │
│ is_cancelled     │ BOOLEAN      │ True if Deleted      │
│ new_start_utc    │ TIMESTAMP    │ Rescheduled Start    │
│ new_end_utc      │ TIMESTAMP    │ Rescheduled End      │
│ custom_title     │ VARCHAR(256) │ Overridden Title     │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                    ATTENDEE_INVITE                     │
├──────────────────┬──────────────┬──────────────────────┤
│ invite_id        │ UUID         │ PRIMARY KEY          │
│ event_id         │ UUID         │ FK to EVENT_MASTER   │
│ user_id          │ UUID         │ Attendee User ID     │
│ rsvp_status      │ ENUM         │ NEEDS_ACTION, ACCEPT,│
│                  │              │ DECLINE, TENTATIVE   │
│ is_organizer     │ BOOLEAN      │ Meeting Host Flag    │
│ updated_at       │ TIMESTAMP    │ Response Timestamp   │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Create Recurring Event
```http
POST /api/v1/calendars/{calendar_id}/events
Content-Type: application/json
Authorization: Bearer <user_token>

{
  "title": "Weekly Engineering Standup",
  "start_time": "2026-10-01T09:00:00",
  "end_time": "2026-10-01T09:30:00",
  "timezone": "America/Los_Angeles",
  "rrule": "FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20270101T000000Z",
  "attendees": ["alice@company.com", "bob@company.com"]
}
```
**Response (`201 Created`)**:
```json
{
  "event_id": "9b1a8-4210-...",
  "rrule": "FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20270101T000000Z",
  "status": "CONFIRMED"
}
```

#### 2. Get Calendar Events for Date Range (View Range)
```http
GET /api/v1/calendars/me/events?start=2026-10-01T00:00:00Z&end=2026-10-31T23:59:59Z
```
**Response (`200 OK`)**:
```json
{
  "events": [
    {
      "event_id": "9b1a8-...",
      "instance_id": "9b1a8-20261002T090000Z",
      "title": "Weekly Engineering Standup",
      "start": "2026-10-02T16:00:00Z",
      "end": "2026-10-02T16:30:00Z",
      "is_recurring_instance": true,
      "rsvp_status": "ACCEPTED"
    }
  ]
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="job-scheduler" title="Google Calendar Recurring Events & Distributed Invitation Architecture" />

### Walkthrough of Core Flows

#### 1. Fetching Calendar Views (Dynamic RRULE Expansion)
1. User opens the Calendar app in Month View (e.g. October 2026).
2. The client requests all events falling between `2026-10-01` and `2026-10-31`.
3. The **Calendar Service**:
   - Queries the **Primary Database** for single events whose `[start_time, end_time]` overlaps the requested window.
   - Queries for all recurring event series (`EVENT_MASTER`) whose lifetime intersects the requested window.
   - Fetches all `EVENT_EXCEPTION` records associated with those recurring series.
4. **On-the-Fly Expansion Engine**:
   - Runs an in-memory RFC 5545 generator (e.g. libical / Google RRule parser) for each recurring rule, generating occurrence timestamps inside the 31-day window.
   - Applies exceptions (replaces rescheduled instances, deletes cancelled instances).
   - Converts UTC timestamps into the user’s requested display timezone.
5. Returns the consolidated list of occurrences in $< 30\text{ms}$.

#### 2. The Invitation & RSVP Flow
1. When an organizer creates a meeting with 5 attendees, the system creates 1 `EVENT_MASTER` row and 5 `ATTENDEE_INVITE` rows in a single database transaction.
2. An event is published to **Apache Kafka** (`MeetingInvitedEvent`).
3. Downstream workers:
   - Dispatch interactive email notifications with RSVP buttons.
   - Send push notifications to mobile devices.
   - Automatically display the event tentatively on the attendees' calendars (`status: NEEDS_ACTION`).
4. When an attendee clicks "Accept", an atomic update modifies `rsvp_status = ACCEPTED` on their invite record, broadcasting the updated status to all active attendees via WebSockets.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Modeling Recurring Events (Why Never Pre-Generate Infinite Instances)
Should we generate physical database rows for every occurrence of a daily meeting for the next 10 years?

```
┌────────────────────────────────────────────────────────┐
│         PRE-EXPANSION VS DYNAMIC ON-THE-FLY EXPANSION  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Option A: Pre-Expand into Physical Rows               │
│  • A daily meeting for 5 years = 1,825 database rows.  │
│  • Modifying the meeting time requires updating 1,825  │
│    rows in a single massive database transaction.      │
│  • Infinite recurring meetings crash database storage! │
│                                                        │
│  Option B: Store Rule + Dynamic Expansion (Selected)   │
│  • Exactly ONE row stored in EVENT_MASTER:             │
│    "FREQ=DAILY;INTERVAL=1"                             │
│  • Modifying the series takes ONE row update!          │
│  • Instances are computed on-the-fly in RAM only for   │
│    the 30-day window the user is currently viewing.   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Deep Dive 2: Handling Event Exceptions & Series Splitting
What happens when a user clicks: *"Change time for this and all following events"*?

```
Original Event Series (ID: E1):
[Mon 9am] ──► [Tue 9am] ──► [Wed 9am] ──► [Thu 9am] ──► [Fri 9am]
                                ▲
                                │ User changes Thursday to 10am ("This and following")

The Split Sequence:
1. Update E1 RRULE: Add `UNTIL = Wednesday 23:59:59Z`.
   (E1 now strictly covers Mon, Tue, Wed).
2. Create New Event Series (ID: E2):
   Start Time = Thursday 10:00:00Z.
   RRULE: Copy original recurrence rules.
3. Both series link via `original_parent_id = E1` for audit history.
```
- **"Only this instance" Exception**: Stored as a single row in `EVENT_EXCEPTION` referencing `(parent_event_id, original_start_date)`. The generator overrides that single occurrence during on-the-fly rendering.

### Deep Dive 3: Timezone Math & Daylight Saving Time (DST) Bugs
Why is storing events purely in UTC a catastrophic trap for calendar systems?

- **The DST Shift Trap**:
  - A user in New York creates a daily meeting for `"9:00 AM New York time"`.
  - In summer (EDT), 9:00 AM is `13:00 UTC`.
  - In winter (EST), 9:00 AM is `14:00 UTC`.
  - If the database stores only `13:00 UTC`, when DST changes in November, the meeting will suddenly ring at **8:00 AM New York time**, enraging the user!
- **The Solution**: Store three distinct pieces of metadata:
  1. `start_time_local`: `09:00:00` (wall-clock time).
  2. `timezone_iana`: `"America/New_York"` (exact IANA Timezone Database string, not a static offset like `-05:00`).
  3. `start_time_utc`: Calculated based on the specific date's DST rules.
  When the recurrence engine evaluates an occurrence on November 15, it consults the IANA Olson database to calculate `14:00 UTC`, preserving the local wall-clock meeting at 9:00 AM sharp.

### Deep Dive 4: Concurrent Double-Booking Prevention (Room Reservation)
How do we guarantee that two users cannot book the same conference room simultaneously?

```sql
-- Atomic Check-and-Insert with Row Locking
BEGIN TRANSACTION;

-- Lock overlapping confirmed room bookings
SELECT id FROM room_bookings 
WHERE room_id = :room_id 
  AND status = 'CONFIRMED'
  AND (start_time < :requested_end AND end_time > :requested_start)
FOR UPDATE;

-- If rows returned > 0, abort transaction: CONFLICT!
-- Otherwise, insert:
INSERT INTO room_bookings (room_id, event_id, start_time, end_time, status)
VALUES (:room_id, :event_id, :requested_start, :requested_end, 'CONFIRMED');

COMMIT;
```
- **Distributed Redis Lock Fallback**: Alternatively, an in-memory distributed lock can be acquired on `lock:room:{room_id}:{date_bucket}` using Redlock or Redis Lua script to serialize bookings before touching the database.

---

## 5. Architectural Trade-Off Matrix

| Design Alternative | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Recurrence Modeling** | Pre-generate all physical rows | Store RFC 5545 RRULE + Dynamic Expand | **Dynamic RRULE Expansion**: Slashes database storage by 99%; updating series takes 1 query instead of thousands. |
| **Time Representation** | Pure UTC Timestamps | Wall-clock Local Time + IANA Timezone ID | **Local Time + IANA Timezone**: Prevents meetings from shifting by 1 hour during Daylight Saving Time (DST) transitions. |
| **Calendar Storage Engine** | Document Store (MongoDB) | Globally Distributed SQL (Spanner/Postgres) | **Relational SQL**: Strict ACID transactions required for room booking concurrency and multi-attendee RSVP state consistency. |
| **Notification Scheduling** | Crontab scanning entire DB every min | Hierarchical Timing Wheel / Delayed Queue | **Timing Wheel / Kafka Delay**: Memory-efficient $O(1)$ timer dispatch; eliminates massive database full-table polling sweeps. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Clarifies functional requirements for single vs recurring events.
- Designs relational schemas for events, attendees, and RSVP statuses.
- Explains why time zones must be considered when storing event start times.

### Senior (L5 / IC5)
- Explains why pre-expanding infinite recurring events into physical database rows is an anti-pattern.
- Details dynamic RFC 5545 RRULE expansion and exception handling ("this instance" vs "this and all following").
- Formulates correct timezone handling using IANA timezone identifiers to survive DST transitions.
- Designs optimistic and pessimistic locking mechanisms to prevent double-booking meeting rooms.

### Staff+ (L6 / Principal)
- Evaluates multi-tenant calendar integration across enterprise federations (e.g. Google Calendar syncing with Microsoft Exchange/Outlook over CalDAV).
- Designs distributed notification pipelines using hierarchical timing wheels to dispatch millions of reminders per minute without thundering herd effects.
- Formulates multi-region active-active database replication strategies with cross-region conflict resolution.
- Evaluates smart scheduling algorithms (finding free meeting slots across 50 busy participants in $< 100\text{ms}$).
