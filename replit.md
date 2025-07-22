# MyTransporter - Logistics Management Platform

## Overview

MyTransporter is a comprehensive logistics management platform that connects clients, drivers, and administrators in a bidding-based transport request system. The application features role-based authentication, real-time bid management, and administrative oversight capabilities.

**Application Slogan:** "We transport at your financial convenience"

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**Client and Driver Profile Sections (July 22, 2025)**
- Added comprehensive profile sections for both clients and drivers
- Implemented tabbed interface in client dashboard (Transport Requests | My Profile)
- Implemented tabbed interface in driver dashboard (Dashboard | My Profile)
- Client profiles show contact info, request activity metrics, and recent request history
- Driver profiles show contact info, performance metrics, vehicle information, and bid history
- Enhanced UI with professional styling and responsive design
- Added "View Profile" functionality to bid section in admin dashboard for driver profiles
- Created secure backend endpoint for driver profile data access

**Profile Editability and Currency System Update (July 22, 2025)**
- Made profile sections editable for both clients and drivers
- Added form fields for personal information (first name, last name, phone number)
- Added vehicle information editing capability for drivers
- Email fields are disabled as they serve as unique identifiers
- Changed entire system currency from USD ($) to South African Rand (R)
- Updated all currency displays across client dashboard, driver dashboard, admin dashboard, and bid modal
- Fixed input validation warnings with proper defaultValue usage
- Enhanced user experience with professional form styling and update buttons

**Driver Profile Viewing Feature (July 22, 2025)**
- Added "View Profile" functionality to bid section in admin dashboard
- Implemented comprehensive driver profile modal with professional design
- Profile displays driver name, rating, contact information, and experience
- Added recent performance metrics (completed jobs, on-time delivery percentage)
- Included vehicle information section with truck details and capacity
- Enhanced UI to match application design standards

**Request Reassignment and Tracking Features (July 22, 2025)**
- Added request reassignment functionality for admin users
- Implemented comprehensive request tracking with status updates
- Added Track and Reassign buttons for assigned/in-progress requests
- Created modal interfaces for tracking progress and reassigning drivers
- Status update options: Start Journey, Mark Complete, Cancel Request
- Reassignment feature removes current driver and reopens for new bidding
- Added backend endpoints for /reassign and /status updates with proper validation

**Admin User Registration Feature (July 22, 2025)**
- Added comprehensive user registration section to admin dashboard
- Implemented tabbed interface for admin portal (Request Management | User Registration)
- Added role-based registration form with proper access controls
- Admin role option is only visible to administrators, hidden from clients and drivers
- Form includes validation for email, password, names, and account type selection
- Registration form integrates with existing authentication system

**Application Rebranding (July 22, 2025)**
- Changed application name from "LogiFlow" to "MyTransporter"
- Added application slogan: "We transport at your financial convenience"
- Updated branding across all pages: landing, login, register, and dashboard pages
- Fixed bidding system validation errors for proper amount and date handling
- Resolved TypeScript errors in dashboard components with proper array type checking

**Authentication System Overhaul (July 16, 2025)**
- Replaced Replit Auth with email/password authentication
- Implemented SHA-256 password hashing for security
- Updated user schema to use integer IDs instead of string IDs
- Created login and registration pages with form validation
- Added session management with PostgreSQL session store
- Updated all database references to use integer user IDs
- Created test users for development: admin@test.com, client@test.com, driver@test.com (password: test123)
- Fixed authentication query client configuration to prevent infinite loading states
- Verified authentication flow works correctly with proper session management

## System Architecture

### Full-Stack Architecture
- **Frontend**: React with TypeScript using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state management

### Monorepo Structure
The project follows a monorepo pattern with three main directories:
- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Shared types and schemas used by both frontend and backend

## Key Components

### Frontend Architecture
- **Router**: wouter for client-side routing
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Built-in fetch with TanStack Query for caching and state management

### Backend Architecture
- **API Layer**: Express.js with TypeScript
- **Database Layer**: Drizzle ORM with PostgreSQL
- **Authentication**: Passport.js with OpenID Connect strategy
- **Session Management**: Express sessions with PostgreSQL session store
- **Middleware**: Custom logging and error handling middleware

### Database Schema
- **Users**: Store user profiles with role-based access (client, driver, admin) and hashed passwords
- **Transport Requests**: Client-created shipment requests with pickup/delivery details
- **Bids**: Driver proposals for transport requests with pricing
- **Sessions**: Secure session storage for authentication

## Data Flow

### Authentication Flow
1. User accesses the landing page
2. Clicks "Sign In" to go to login page or "Get Started" to register
3. User enters email and password credentials
4. Password is hashed using SHA-256 and validated against database
5. Session is established and user is redirected to role-appropriate dashboard

### Transport Request Flow
1. Client creates transport request through the dashboard
2. Request is stored in database with "pending" status
3. Drivers can view available requests and submit bids
4. Client reviews bids and selects a driver
5. Request status updates to "assigned" and driver is notified
6. Progress tracking through status updates (in_progress, completed)

### Bid Management Flow
1. Drivers view available transport requests
2. Submit bids with pricing and messages
3. Clients review all bids for their requests
4. Selection process updates bid status (accepted/rejected)
5. Accepted bids trigger request assignment

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments
- **drizzle-orm**: Type-safe database ORM with PostgreSQL support
- **express**: Web framework for the API server
- **passport**: Authentication middleware
- **openid-client**: OpenID Connect client for Replit Auth

### UI Dependencies
- **@radix-ui/***: Accessible UI component primitives
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling with validation
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight React router

### Development Dependencies
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development Environment
- Uses Vite development server with HMR
- Express server runs on separate port with proxy configuration
- Environment variables for database connection and session secrets
- Replit-specific development banner and error overlay

### Production Build
- Frontend builds to static files in `dist/public`
- Backend bundles with esbuild to `dist/index.js`
- Single server serves both API and static files
- Database migrations handled through Drizzle Kit

### Database Management
- Drizzle Kit for schema migrations
- PostgreSQL database with connection pooling
- Session storage in dedicated sessions table
- Schema versioning through migration files

### Security Considerations
- Secure session management with httpOnly cookies
- Role-based access control throughout the application
- Input validation using Zod schemas
- CSRF protection through session management
- Environment-based configuration for sensitive data

### Performance Optimizations
- TanStack Query for efficient data fetching and caching
- Optimistic updates for better user experience
- Lazy loading of dashboard components
- Efficient database queries with proper indexing
- Static asset optimization through Vite build process