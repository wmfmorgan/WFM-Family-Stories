# Technical Context

## Technology Stack

### Frontend & Backend Framework
- **Next.js 14+**: Full-stack React framework chosen for:
  - Built-in API routes eliminate need for separate backend service
  - Excellent developer experience with App Router
  - Automatic code splitting and optimization
  - Server-side rendering for better SEO and performance
  - Strong TypeScript support

### Programming Language
- **TypeScript**: For both frontend and backend code
  - Type safety reduces runtime errors
  - Better IDE support and developer productivity
  - Self-documenting code through types
  - Easier refactoring and maintenance

### Database
- **PostgreSQL**: Relational database selected for:
  - Strong data consistency for family relationships and event data
  - Excellent JSON support for flexible content storage
  - ACID compliance for reliable data operations
  - Good performance for read-heavy collaborative applications
  - Mature tooling and ecosystem

### Styling
- **Tailwind CSS**: Utility-first CSS framework because:
  - Rapid UI development without context switching
  - Consistent design system through utilities
  - Responsive design built-in
  - Small bundle size with purging
  - Excellent with component-based architectures

### Deployment Platform
- **Render.com**: Cloud platform chosen for:
  - Managed PostgreSQL databases
  - Automatic HTTPS certificates
  - Environment variable management
  - Free tier for development
  - Good Next.js integration
  - Pay-as-you-go scaling

## Development Setup

### Local Development
- **Docker & Docker Compose** required for consistent development environment
- Node.js 18+ containerized via Docker
- PostgreSQL database running in Docker container
- npm or yarn for package management (inside containers)
- Environment variables managed via Docker Compose

### Key Dependencies
- **Database**: `pg` (PostgreSQL client), `drizzle-orm` (query builder)
- **Authentication**: NextAuth.js (flexible auth solution)
- **UI Components**: Radix UI (accessible primitives)
- **Forms**: React Hook Form (performance-focused forms)
- **State Management**: Zustand (lightweight, scalable)

## Technical Constraints

- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Mobile First**: Responsive design prioritizing mobile experience
- **Performance Budget**: <3s initial page load, <1s subsequent navigation
- **Accessibility**: WCAG 2.1 AA compliance
- **Security**: HTTPS everywhere, secure auth, input validation

## Tool Usage Patterns

- **Version Control**: Git with GitHub for collaboration
- **Code Quality**: ESLint + Prettier for consistency
- **Testing**: Jest + React Testing Library for unit tests
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Documentation**: Memory Bank system for project knowledge
- **Communication**: Issues and PRs for feature discussions

## Development Workflow

1. Feature branches for development
2. Pull requests with code review
3. Automated testing on PR creation
4. Manual testing before merge
5. Automatic deployment to staging on merge
6. Production deployment after approval