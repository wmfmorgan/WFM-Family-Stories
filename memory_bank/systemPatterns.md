# System Patterns & Architecture

## System Architecture

### Overall Architecture
Family Stories follows a **monolithic full-stack architecture** using Next.js:

```
┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   PostgreSQL    │
│                 │    │   Database      │
│ • Frontend UI   │◄──►│                 │
│ • API Routes    │    │ • Users         │
│ • Server Logic  │    │ • Families      │
│ • Auth          │    │ • Events        │
│ • File Storage  │    │ • Media         │
└─────────────────┘    └─────────────────┘
```

### Key Architectural Decisions

- **Full-Stack Monolith**: Single codebase for frontend, backend, and API reduces complexity
- **Database-First Design**: Schema-driven development with migrations
- **API-Centric**: All data access through well-defined API endpoints
- **Component-Driven UI**: Reusable components with clear separation of concerns

## Design Patterns

### Data Access Patterns

#### Repository Pattern
All database operations abstracted through repository classes:
```typescript
class EventRepository {
  async findByFamily(familyId: string): Promise<Event[]>
  async create(eventData: CreateEventData): Promise<Event>
  async update(id: string, updates: Partial<Event>): Promise<Event>
}
```

#### Service Layer Pattern
Business logic encapsulated in service classes:
```typescript
class EventService {
  constructor(private eventRepo: EventRepository) {}

  async createEvent(familyId: string, userId: string, data: CreateEventData) {
    // Validation, authorization, business rules
    return this.eventRepo.create({ ...data, familyId, createdBy: userId });
  }
}
```

### Component Patterns

#### Atomic Design
Components organized by complexity level:
- **Atoms**: Basic UI elements (Button, Input, Avatar)
- **Molecules**: Simple component combinations (FormField, EventCard)
- **Organisms**: Complex UI sections (EventForm, FamilyDashboard)
- **Pages**: Full page layouts with data fetching

#### Container/Presentational Pattern
Separation of data logic from presentation:
```typescript
// Container component (data & logic)
function EventListContainer() {
  const events = useEvents();
  const { createEvent } = useEventActions();

  return <EventList events={events} onCreate={createEvent} />;
}

// Presentational component (UI only)
function EventList({ events, onCreate }) {
  return (
    <div>
      {events.map(event => <EventCard key={event.id} event={event} />)}
      <Button onClick={onCreate}>Add Event</Button>
    </div>
  );
}
```

### State Management Patterns

#### Server State with SWR
Data fetching and caching using SWR:
```typescript
function useEvents(familyId: string) {
  return useSWR(`/api/families/${familyId}/events`, fetcher);
}
```

#### Local State with Zustand
Complex UI state managed with Zustand stores:
```typescript
interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activeView: 'timeline' | 'grid';
  setActiveView: (view: 'timeline' | 'grid') => void;
}
```

## Component Relationships

### Core Data Models

```
User
├── belongs to Family (many-to-one)
├── creates Events (one-to-many)
└── creates Comments (one-to-many)

Family
├── has Members (Users, many-to-many)
├── has Events (one-to-many)
└── has Settings (one-to-one)

Event
├── belongs to Family (many-to-one)
├── created by User (many-to-one)
├── has Media (one-to-many)
└── has Comments (one-to-many)

Media
├── belongs to Event (many-to-one)
└── uploaded by User (many-to-one)

Comment
├── belongs to Event (many-to-one)
└── written by User (many-to-one)
```

### API Route Structure

```
/api
├── /auth/*              # Authentication routes
├── /users/*             # User management
├── /families/*          # Family operations
│   ├── /[id]/events     # Family events
│   ├── /[id]/members    # Family members
│   └── /[id]/settings   # Family settings
├── /events/*            # Event CRUD
│   ├── /[id]/media      # Event media
│   └── /[id]/comments   # Event comments
└── /media/*             # Media upload/download
```

## Security Patterns

### Authentication & Authorization
- **JWT-based authentication** with NextAuth.js
- **Role-based access control** (Family Admin, Member, Guest)
- **API route protection** with middleware
- **Database-level security** with Row Level Security (RLS)

### Data Validation
- **Runtime validation** with Zod schemas
- **Type-safe APIs** with TypeScript
- **Input sanitization** on all user inputs
- **File upload validation** for media security

## Performance Patterns

### Data Fetching Strategy
- **Server-side rendering** for initial page loads
- **Static generation** for public content
- **Client-side hydration** for interactivity
- **Optimistic updates** for better UX

### Caching Strategy
- **Database query result caching**
- **API response caching** with SWR
- **Static asset optimization** with Next.js
- **Image optimization** with Next.js Image component

## Error Handling Patterns

### Global Error Boundary
React Error Boundary for UI errors:
```typescript
class ErrorBoundary extends Component {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(error, errorInfo);
  }
}
```

### API Error Handling
Consistent error responses with error codes and messages:
```typescript
// Success response
{ success: true, data: {...} }

// Error response
{ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } }
```

## File Organization

```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/         # Auth routes
│   ├── (dashboard)/    # Protected routes
│   └── api/            # API routes
├── components/         # React components
│   ├── ui/            # Reusable UI components
│   ├── forms/         # Form components
│   └── layout/        # Layout components
├── lib/               # Utility libraries
│   ├── db/           # Database utilities
│   ├── auth/         # Auth utilities
│   └── validation/   # Validation schemas
├── stores/           # Zustand stores
├── types/            # TypeScript definitions
└── utils/            # Helper functions