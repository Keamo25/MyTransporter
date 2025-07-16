# LogiFlow - Logistics Management Platform

## Overview

LogiFlow is a comprehensive logistics management platform that connects clients, drivers, and administrators in a bidding-based transport request system. The application features role-based authentication, real-time bid management, and administrative oversight capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **Users**: Store user profiles with role-based access (client, driver, admin)
- **Transport Requests**: Client-created shipment requests with pickup/delivery details
- **Bids**: Driver proposals for transport requests with pricing
- **Sessions**: Secure session storage for authentication

## Data Flow

### Authentication Flow
1. User accesses the landing page
2. Clicks "Sign In" which redirects to `/api/login`
3. Replit Auth handles OAuth flow
4. User profile is created/updated in the database
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