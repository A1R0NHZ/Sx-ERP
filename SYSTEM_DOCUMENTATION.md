# Sx-ERP: Attendance Management System
## Full System Documentation

---

# 1. INTRODUCTION

## 1.1 Project Overview

Sx-ERP is a web-based Attendance Management System designed for academic institutions. It automates the process of recording, tracking, and reporting student attendance using GPS-based geolocation verification. The system eliminates manual attendance taking by requiring students to physically check in from within a defined classroom zone, ensuring attendance integrity.

The platform serves three distinct user roles — Students, Faculty, and Registrar — each with a tailored dashboard and set of capabilities. Built on a modern full-stack JavaScript architecture, it is accessible from any device with a browser and internet connection.

## 1.2 Problem Statement

Traditional attendance systems in academic institutions suffer from several critical issues:

- **Proxy attendance**: Students signing in on behalf of absent peers
- **Manual overhead**: Faculty spending class time on roll calls
- **Delayed reporting**: Attendance data not available in real time to administrators
- **No audit trail**: Lack of verifiable, timestamped records
- **Fragmented data**: Attendance stored in spreadsheets or paper registers with no central access

Sx-ERP addresses all of these by combining GPS geofencing, session duration tracking, and a centralised database with role-based access.

## 1.3 Objectives

- Provide GPS-verified, time-bounded attendance check-in for students
- Give faculty real-time visibility into class attendance
- Enable the registrar to manage users, timetables, and generate reports
- Automate notifications between students and faculty upon attendance events
- Support data export for institutional reporting (Excel/XLSX)

## 1.4 Scope

The system covers:

- User registration and authentication (Student, Faculty, Registrar)
- Timetable creation and management with multi-location support
- GPS-based student check-in and check-out with duration tracking
- Attendance record storage and retrieval
- Role-specific dashboards with analytics
- In-app notification system
- Attendance data export to Excel

Out of scope: Mobile native apps, biometric integration, LMS integration, payment modules.

## 1.5 Target Users

| Role | Description |
|------|-------------|
| Student | Checks in/out of classes, views personal attendance history and statistics |
| Faculty | Monitors class attendance, manages timetables, receives notifications |
| Registrar | Full administrative access — manages users, timetables, reports, and exports |

---

# 2. SYSTEM ANALYSIS & REQUIREMENTS SPECIFICATIONS

## 2.1 Existing System Analysis

Before Sx-ERP, attendance in most institutions was managed through:

- Paper-based roll calls or sign-in sheets
- Basic spreadsheet tracking with no real-time access
- No location verification — proxy attendance was trivially easy
- Manual compilation of reports at end of semester

These approaches are time-consuming, error-prone, and provide no mechanism for detecting fraudulent attendance.

## 2.2 Proposed System Advantages

| Feature | Traditional | Sx-ERP |
|---------|-------------|--------|
| Attendance method | Manual roll call | GPS-verified self check-in |
| Proxy prevention | None | Geofence + duration requirement |
| Real-time data | No | Yes |
| Reporting | Manual | Automated, exportable |
| Notifications | None | Automated in-app alerts |
| Access | Physical register | Web, any device |

## 2.3 Functional Requirements

### FR-01: Authentication
- The system shall allow users to register with name, email, password, and role
- The system shall authenticate users via email/password credentials
- The system shall maintain session state using JWT tokens
- The system shall redirect users to role-appropriate dashboards after login
- Passwords shall be stored as bcrypt hashes (cost factor 10)

### FR-02: Student Attendance
- Students shall be able to view today's scheduled classes
- Students shall initiate a check-in session for a specific timetable entry
- The system shall capture the student's GPS coordinates at check-in
- The system shall validate whether the student is within 20 metres of a registered class location
- The system shall track elapsed time during the session
- Students shall be able to end their session (check-out)
- The system shall mark attendance as PRESENT if: location was valid AND duration ≥ 45 minutes
- The system shall mark attendance as ABSENT otherwise
- Students shall view their full attendance history with per-subject statistics

### FR-03: Faculty
- Faculty shall view all attendance records for their classes
- Faculty shall view and manage their timetable entries
- Faculty shall receive in-app notifications when students record attendance
- Faculty shall mark notifications as read

### FR-04: Registrar
- The registrar shall manage all user accounts (view list)
- The registrar shall create timetable entries with up to 5 class locations per entry
- The registrar shall view all attendance records across all students and classes
- The registrar shall export attendance data to Excel (XLSX format)
- The registrar shall view system-wide analytics (attendance rate, totals)

### FR-05: Timetable Management
- Timetables shall store subject name, day of week, start/end time, and faculty assignment
- Each timetable entry shall support up to 5 GPS locations (for multi-room classes)
- Locations shall store latitude, longitude, and an optional label

### FR-06: Notifications
- The system shall automatically create a notification to the faculty member when a student is marked PRESENT
- Users shall see unread notification count in the header
- Notifications shall be fetched every 30 seconds (polling)
- Users shall be able to mark individual notifications as read

## 2.4 Non-Functional Requirements

### NFR-01: Performance
- API responses shall complete within 2 seconds under normal load
- Dashboard data shall load via parallel API calls to minimise wait time
- Database queries shall use indexed fields (email unique, composite unique on attendance)

### NFR-02: Security
- All API routes shall verify session authentication before processing
- Role-based access control shall be enforced server-side on every endpoint
- Passwords shall never be returned in API responses
- JWT secrets shall be stored in environment variables, never in code

### NFR-03: Usability
- The UI shall be responsive and functional on mobile and desktop
- Loading states (skeleton screens) shall be shown while data fetches
- Error messages shall be clear and actionable

### NFR-04: Reliability
- Attendance records shall use a composite unique constraint to prevent duplicate entries per student per class per day
- Database connections shall use a singleton pattern to prevent connection pool exhaustion in development

### NFR-05: Maintainability
- The codebase shall use TypeScript throughout for type safety
- Database schema shall be managed via Prisma migrations
- Environment configuration shall be externalised via `.env`

## 2.5 Use Case Summary

```
[Student]
  → Login
  → View Today's Classes
  → Start Attendance Tracking (GPS check-in)
  → End Session (check-out)
  → View Attendance History
  → View Profile

[Faculty]
  → Login
  → View Attendance Records
  → View My Classes / Timetable
  → View & Mark Notifications

[Registrar]
  → Login
  → Manage Users (view)
  → Create Timetable Entries
  → View All Attendance
  → Export Attendance (XLSX)
  → View Reports / Analytics
```

## 2.6 Data Requirements

The system manages the following core data entities:

- **User**: Identity, credentials, role, optional student/faculty ID
- **Timetable**: Class schedule with subject, timing, faculty, and locations
- **ClassLocation**: GPS coordinates associated with a timetable entry
- **Attendance**: Per-student, per-class, per-day record with status and timing
- **Notification**: Message from one user to another with read state

---

# 3. SYSTEM ARCHITECTURE

## 3.1 Architecture Overview

Sx-ERP follows a **monolithic full-stack architecture** using Next.js 16, which co-locates the frontend (React) and backend (API Routes) in a single deployable application. The data layer is a PostgreSQL database accessed via Prisma ORM with the `@prisma/adapter-pg` driver.

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
│  React 19 + Next.js App Router + TailwindCSS v4         │
│  next-auth (session) · react-leaflet (maps)             │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────────┐
│                  Next.js Server                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  App Router (src/app)                            │   │
│  │  ├── /login, /signup          (UI pages)         │   │
│  │  ├── /dashboard/student/**    (Student UI)       │   │
│  │  ├── /dashboard/faculty/**    (Faculty UI)       │   │
│  │  ├── /dashboard/registrar/**  (Registrar UI)     │   │
│  │  └── /api/**                  (REST API Routes)  │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Lib Layer (src/lib)                             │   │
│  │  ├── auth.ts    (NextAuth config + JWT)          │   │
│  │  ├── prisma.ts  (Prisma singleton client)        │   │
│  │  └── geo.ts     (Haversine distance calculation) │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │ TCP (pg driver)
┌────────────────────▼────────────────────────────────────┐
│              PostgreSQL Database (Supabase)              │
│  Users · Timetables · ClassLocations                    │
│  Attendance · Notifications                             │
└─────────────────────────────────────────────────────────┘
```

## 3.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 16.2.3 | Full-stack React framework |
| Language | TypeScript | ^5 | Type-safe development |
| UI Library | React | 19.2.4 | Component-based UI |
| Styling | TailwindCSS | ^4 | Utility-first CSS |
| Authentication | NextAuth.js | 5.0.0-beta.30 | Session management, JWT |
| ORM | Prisma | ^7.7.0 | Database schema + queries |
| Database | PostgreSQL | — | Relational data store |
| DB Hosting | Supabase | — | Managed PostgreSQL |
| DB Driver | @prisma/adapter-pg | ^7.7.0 | Native pg adapter |
| Maps | React-Leaflet | ^5.0.0 | Interactive map UI |
| Password Hashing | bcryptjs | ^3.0.3 | Secure credential storage |
| Excel Export | xlsx | ^0.18.5 | XLSX file generation |
| Date Utilities | date-fns | ^4.1.0 | Date formatting |

## 3.3 Directory Structure

```
attendance-erp/
├── prisma/
│   ├── schema.prisma          # Database schema (models, enums, relations)
│   ├── seed.ts                # Database seeding script
│   └── migrations/            # SQL migration history
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── attendance/
│   │   │   │   ├── route.ts       # GET attendance records
│   │   │   │   ├── checkin/       # POST check-in with GPS
│   │   │   │   ├── checkout/      # POST check-out + status resolution
│   │   │   │   └── export/        # GET XLSX export
│   │   │   ├── auth/
│   │   │   │   ├── register/      # POST user registration
│   │   │   │   └── [...nextauth]/ # NextAuth handler
│   │   │   ├── notifications/     # GET/PATCH notifications
│   │   │   ├── timetable/         # GET/POST timetables
│   │   │   └── users/             # GET users (registrar only)
│   │   ├── dashboard/
│   │   │   ├── student/           # Student pages
│   │   │   ├── faculty/           # Faculty pages
│   │   │   └── registrar/         # Registrar pages
│   │   ├── login/                 # Login page
│   │   ├── signup/                # Registration page
│   │   ├── layout.tsx             # Root layout + SessionProvider
│   │   └── page.tsx               # Root redirect by role
│   ├── components/
│   │   ├── DashboardLayout.tsx    # Sidebar + header shell
│   │   ├── GeoTracker.tsx         # GPS check-in/out widget
│   │   ├── AttendanceTable.tsx    # Reusable attendance data table
│   │   ├── NotificationBell.tsx   # Header notification dropdown
│   │   ├── LocationPicker.tsx     # Map-based location selector
│   │   ├── StatCard.tsx           # Metric display card
│   │   └── PageSkeleton.tsx       # Loading placeholder
│   └── lib/
│       ├── auth.ts                # NextAuth configuration
│       ├── prisma.ts              # Prisma client singleton
│       └── geo.ts                 # Haversine formula + constants
└── public/                        # Static assets
```

## 3.4 Database Schema

The database consists of five models with the following relationships:

```
User (1) ──────────────── (N) Attendance
User (1) ──────────────── (N) Timetable [as faculty]
User (1) ──────────────── (N) Notification [as sender]
User (1) ──────────────── (N) Notification [as recipient]
Timetable (1) ─────────── (N) ClassLocation
Timetable (1) ─────────── (N) Attendance
```

### User Model
```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String                        // bcrypt hash
  role      Role                          // STUDENT | FACULTY | REGISTRAR
  studentId String?  @unique              // e.g. "STU001"
  facultyId String?  @unique              // e.g. "FAC001"
  createdAt DateTime @default(now())
}
```

### Timetable Model
```prisma
model Timetable {
  id        String   @id @default(cuid())
  subject   String
  dayOfWeek Int                           // 0=Sun, 1=Mon ... 6=Sat
  startTime String                        // "08:00"
  endTime   String                        // "09:30"
  facultyId String
  locations ClassLocation[]               // up to 5 GPS points
}
```

### Attendance Model
```prisma
model Attendance {
  id              String           @id @default(cuid())
  studentId       String
  timetableId     String
  date            DateTime         @db.Date
  status          AttendanceStatus // PRESENT | ABSENT | IN_PROGRESS
  entryTime       DateTime?
  exitTime        DateTime?
  durationMinutes Int              @default(0)
  locationValid   Boolean          @default(false)

  @@unique([studentId, timetableId, date])  // prevents duplicates
}
```

## 3.5 Authentication Architecture

Authentication uses **NextAuth.js v5** with the **Credentials provider** and **JWT session strategy**:

1. User submits email + password via the login form
2. `authorize()` callback queries the database and verifies the bcrypt hash
3. On success, a JWT is issued containing `id`, `name`, `email`, and `role`
4. The `jwt` callback embeds `role` into the token; the `session` callback exposes `id` and `role` on `session.user`
5. All API routes call `auth()` to retrieve the session and enforce role-based access

```
Login Form → signIn("credentials") → authorize() → bcrypt.compare()
    → JWT issued { sub: id, role: STUDENT|FACULTY|REGISTRAR }
    → session.user.id + session.user.role available server-side and client-side
```

## 3.6 Geolocation Architecture

The GPS attendance system uses the browser's **Geolocation API** combined with a server-side **Haversine distance calculation**:

```
Student clicks "Start Tracking"
    → navigator.geolocation.watchPosition() begins
    → On each position update → POST /api/attendance/checkin
        → Server: isWithinRadius(userLat, userLon, classLocations)
        → Haversine formula calculates distance to each registered location
        → locationValid = any location within 20 metres
        → Attendance record upserted with locationValid flag

Student clicks "End Session"
    → navigator.geolocation.clearWatch()
    → POST /api/attendance/checkout
        → durationMinutes = (exitTime - entryTime) / 60000
        → status = PRESENT if (durationMinutes ≥ 45 AND locationValid)
        → status = ABSENT otherwise
        → Notification created for faculty if PRESENT
```

### Haversine Formula Implementation
```typescript
// Earth radius = 6,371,000 metres
// Converts lat/lon differences to arc distance
const R = 6371000;
const dLat = toRad(lat2 - lat1);
const dLon = toRad(lon2 - lon1);
const a = sin(dLat/2)² + cos(lat1) * cos(lat2) * sin(dLon/2)²
distance = R * 2 * atan2(√a, √(1-a))
```

Constants: `GEO_RADIUS_METERS = 20`, `MIN_DURATION_MINUTES = 45`

## 3.7 API Architecture

All API routes follow REST conventions and are located under `/src/app/api/`:

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/register` | No | Any | Create new user account |
| GET | `/api/attendance` | Yes | All | Fetch attendance records (scoped by role) |
| POST | `/api/attendance/checkin` | Yes | STUDENT | GPS check-in for a class |
| POST | `/api/attendance/checkout` | Yes | STUDENT | End session, resolve status |
| GET | `/api/attendance/export` | Yes | FACULTY, REGISTRAR | Download XLSX file |
| GET | `/api/timetable` | Yes | All | List all timetables |
| POST | `/api/timetable` | Yes | FACULTY, REGISTRAR | Create timetable entry |
| GET | `/api/notifications` | Yes | All | Fetch user's notifications |
| PATCH | `/api/notifications` | Yes | All | Mark notification as read |
| GET | `/api/users` | Yes | REGISTRAR | List all users |

## 3.8 Frontend Architecture

The frontend uses Next.js **App Router** with React Server and Client Components:

- Pages marked `"use client"` use React hooks (`useState`, `useEffect`) and the `useSession` hook from NextAuth
- Role-based routing is enforced client-side via `useEffect` redirects and server-side via API middleware
- The `DashboardLayout` component provides the persistent sidebar navigation, header, and notification bell for all dashboard pages
- Navigation items are dynamically rendered based on `session.user.role`
- Data fetching uses `Promise.all()` for parallel requests to minimise load time
- Loading states use the `PageSkeleton` component

---

# 4. SYSTEM IMPLEMENTATION

## 4.1 Development Environment Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase recommended)
- npm or yarn

### Installation
```bash
cd attendance-erp
npm install
```

### Environment Configuration (`.env`)
```env
DATABASE_URL=postgresql://user:password@host:port/dbname?pgbouncer=true
DIRECT_URL=postgresql://user:password@host:port/dbname
AUTH_SECRET=your-random-secret-string
NEXTAUTH_URL=http://localhost:3000
```

`DATABASE_URL` uses PgBouncer (connection pooling) for runtime queries.  
`DIRECT_URL` is the direct connection used by Prisma migrations and the seed script.

### Database Setup
```bash
# Apply migrations
npx prisma migrate deploy

# Seed with demo data
npx prisma db seed
```

### Run Development Server
```bash
npm run dev
```

## 4.2 Key Implementation Details

### 4.2.1 Prisma Client Singleton

To prevent connection pool exhaustion during Next.js hot reloads in development, the Prisma client is stored on the global object:

```typescript
// src/lib/prisma.ts
function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter, log: ["error"] });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### 4.2.2 Check-in Flow

The check-in endpoint uses `upsert` to handle repeated GPS position updates gracefully — if the student moves in and out of the zone, the record is updated rather than duplicated:

```typescript
// Composite unique key prevents duplicate records
const attendance = await prisma.attendance.upsert({
  where: { studentId_timetableId_date: { studentId, timetableId, date: today } },
  create: { studentId, timetableId, date: today, status: "IN_PROGRESS",
            entryTime: locationValid ? new Date() : null, locationValid },
  update: { locationValid, entryTime: locationValid ? new Date() : undefined },
});
```

### 4.2.3 Check-out and Status Resolution

```typescript
// checkout/route.ts
const durationMinutes = Math.floor(
  (exitTime.getTime() - record.entryTime.getTime()) / 60000
);
const status =
  durationMinutes >= MIN_DURATION_MINUTES && record.locationValid
    ? "PRESENT"
    : "ABSENT";
```

After resolving status, a notification is automatically sent to the faculty member if the student is marked PRESENT.

### 4.2.4 GeoTracker Component

The `GeoTracker` component manages the full client-side attendance session lifecycle:

- Uses `watchPosition` (continuous tracking) rather than `getCurrentPosition` (one-shot)
- Maintains a timer with `setInterval` to display elapsed time
- Shows a progress bar toward the 45-minute threshold
- Displays real-time location validity feedback
- Cleans up watchers and timers on component unmount

### 4.2.5 Excel Export

The export endpoint uses the `xlsx` library to generate an in-memory workbook and stream it as a binary response:

```typescript
const ws = XLSX.utils.json_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Attendance");
const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

return new NextResponse(buffer, {
  headers: {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="attendance_${Date.now()}.xlsx"`,
  },
});
```

### 4.2.6 Notification Polling

The `NotificationBell` component polls the notifications API every 30 seconds using `setInterval`, providing near-real-time updates without requiring WebSockets:

```typescript
useEffect(() => {
  load();
  const t = setInterval(load, 30000);
  return () => clearInterval(t);
}, []);
```

## 4.3 Seed Data

The seed script (`prisma/seed.ts`) populates the database with realistic demo data:

| Entity | Count | Details |
|--------|-------|---------|
| Registrar | 1 | registrar@erp.com / admin123 |
| Faculty | 3 | faculty@erp.com / faculty123 (+ 2 more) |
| Students | 8 | student@erp.com / student123 (+ 7 more) |
| Timetables | 5 | Mathematics, Physics, CS, Chemistry, English |
| Attendance Records | ~variable | 14 days of history, ~80% present rate |
| Notifications | 6 | Mix of read/unread across roles |

Timetable entries use Kuala Lumpur area coordinates (lat ~3.139, lon ~101.687) and are scheduled relative to the current day so today's classes always appear.

## 4.4 Role-Based Access Control

Access control is enforced at two levels:

**API Level (server-side)** — every route checks the session role:
```typescript
const user = session?.user as any;
if (!user || user.role !== "REGISTRAR") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

**UI Level (client-side)** — dashboard pages redirect if role doesn't match:
```typescript
useEffect(() => {
  if (status === "authenticated" && user?.role !== "STUDENT") router.push("/");
}, [status, session]);
```

The root page (`/`) reads the session role and redirects to the appropriate dashboard:
- STUDENT → `/dashboard/student`
- FACULTY → `/dashboard/faculty`
- REGISTRAR → `/dashboard/registrar`

## 4.5 Dashboard Features by Role

### Student Dashboard
- Attendance rate percentage with colour coding (green ≥75%, red <75%)
- Present / Absent / Today's class counts
- Per-subject attendance breakdown with progress bars
- Recent activity feed (last 5 records)
- Today's Classes page with GeoTracker widget per class
- Full attendance history with filtering
- Profile page showing personal details

### Faculty Dashboard
- My Classes count, total unique students, present today, unread alerts
- Quick navigation to Attendance, Classes, Notifications
- Recent attendance feed showing student names and subjects
- Classes page listing all timetable entries with location details
- Notifications page with read/unread management

### Registrar Dashboard
- System-wide attendance rate, total records, student count, faculty count
- Present/Absent split
- Quick navigation to all management sections
- Users page listing all registered accounts with roles
- Timetable management with LocationPicker map interface
- Attendance view with full student/subject data
- Reports page with analytics
- One-click XLSX export

---

# 5. CONCLUSION

## 5.1 Summary

Sx-ERP successfully delivers a complete, production-ready attendance management system for academic institutions. The system replaces manual, fraud-prone attendance processes with a GPS-verified, time-bounded digital solution that provides real-time data to all stakeholders.

The core innovation is the dual-condition attendance validation: a student must be physically present within 20 metres of the registered classroom AND remain there for at least 45 minutes to be marked PRESENT. This effectively eliminates proxy attendance while being practical for real classroom environments.

## 5.2 Key Achievements

The system delivers on all stated objectives:

- GPS geofencing with Haversine distance calculation prevents proxy attendance
- Three distinct role-based dashboards provide appropriate views for each user type
- Automated notifications keep faculty informed without manual effort
- Excel export enables institutional reporting workflows
- The modern tech stack (Next.js 16, React 19, Prisma 7, PostgreSQL) ensures performance and maintainability
- Responsive design works on both desktop and mobile devices

## 5.3 Technical Highlights

- **Zero-duplication guarantee**: The composite unique constraint `[studentId, timetableId, date]` on the Attendance model, combined with `upsert` in the check-in API, ensures exactly one record per student per class per day regardless of how many GPS updates are received
- **Singleton Prisma client**: Prevents connection pool exhaustion in Next.js development hot-reload cycles
- **Parallel data fetching**: All dashboard pages use `Promise.all()` to fetch multiple data sources concurrently, minimising perceived load time
- **Stateless JWT sessions**: No server-side session storage required, enabling horizontal scaling

## 5.4 Limitations

- **GPS accuracy dependency**: Indoor GPS accuracy can vary; the 20-metre radius may need tuning per institution
- **Browser geolocation requirement**: Students must grant location permissions; the system cannot function without it
- **No offline support**: Requires active internet connection throughout the attendance session
- **Polling-based notifications**: 30-second polling is not true real-time; WebSockets would improve this
- **No password reset flow**: Currently no mechanism for users to recover forgotten passwords

## 5.5 Future Enhancements

- **Push notifications** via Web Push API or WebSockets for instant alerts
- **Password reset** via email (SMTP integration)
- **Bulk user import** via CSV upload for the registrar
- **Attendance analytics** with charts (bar/line graphs per subject/week)
- **Mobile PWA** with offline check-in queuing
- **Biometric integration** as a secondary verification layer
- **LMS integration** (Moodle, Canvas) for grade correlation
- **Automated absence alerts** emailed to students below the 75% threshold

## 5.6 Conclusion

Sx-ERP demonstrates that a small, focused technology stack — Next.js, Prisma, PostgreSQL, and the browser Geolocation API — is sufficient to build a robust, secure, and user-friendly attendance management system. The architecture is clean, the codebase is maintainable, and the system is ready for deployment to a real academic institution with minimal configuration.

---

*Document generated for Sx-ERP Attendance Management System*  
*Stack: Next.js 16 · React 19 · TypeScript · Prisma 7 · PostgreSQL · TailwindCSS 4*
