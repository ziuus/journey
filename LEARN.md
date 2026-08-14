# Learn: Journey - Privacy-Focused Goal Tracking Engine

## Overview
Journey is a privacy-focused, immersive goal tracking engine with a cinematic HUD, interactive tree view, and dynamic AI integration. Built with modern web technologies for personal productivity and focus.

## What You'll Learn

### 1. Project Structure & Architecture
- Monorepo organization
- Modern web stack (Next.js 16, React 19, TypeScript, Tailwind CSS v4)
- Database schema design (SQLite)
- API routing patterns

### 2. Core Features Implementation
- **Cinematic HUD**: CSS animations, glassmorphism, dynamic theming
- **Interactive Tree View**: Recursive rendering, drag-and-drop, state management
- **AI Integration**: Dynamic AI-powered goal suggestions and analysis
- **Privacy-First Design**: Client-side processing, local storage, no telemetry

### 3. Technical Skills
- **Next.js 16 App Router**: Server components, route handlers, middleware
- **React 19**: Concurrent features, hooks, state management
- **TypeScript**: Type-safe development, generic types, utility types
- **Tailwind CSS v4**: Custom config, plugin development, dark mode
- **SQLite**: Database operations, migrations, query optimization
- **AI Integration**: API client implementation, error handling, fallbacks

## Step-by-Step Build Guide

### Step 1: Setup & Installation
```bash
# Clone the repository
git clone https://github.com/ziuus/journey.git
cd journey

# Install dependencies
npm install

# Run development server
npm run dev
```

### Step 2: Project Structure
```
journey/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with theme provider
│   ├── page.tsx           # Main dashboard
│   ├── goals/             # Goals page
│   └── settings/          # Settings page
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   ├── goals/             # Goal-specific components
│   └── layout/            # Layout components
├── lib/                   # Utility functions
├── database/              # Database schema and migrations
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

### Step 3: Database Setup
```bash
# Run database migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### Step 4: Configure AI Integration
1. Create `.env.local` with your AI provider credentials
2. Configure API endpoints in `lib/ai-config.ts`
3. Test AI integration with sample goals

### Step 5: Build & Deploy
```bash
# Build for production
npm run build

# Start production server
npm start
```

## Key Implementation Details

### Cinematic HUD Design
- Uses CSS backdrop-filter for glassmorphism
- Animated gradients and transitions
- Responsive layout with mobile-first approach
- Dark mode by default with theme switching

### Interactive Tree View
- Recursive component rendering for nested goals
- State management with React Context
- Drag-and-drop functionality
- Smooth animations for expand/collapse

### Privacy-First Architecture
- All data stored locally (no cloud sync)
- Client-side AI processing
- No analytics or telemetry
- Option to export/import data

## Testing & Validation

### Run Tests
```bash
npm test
npm run test:coverage
```

### Code Quality
```bash
npm run lint
npm run type-check
```

## Common Tasks

### Add a New Goal Type
1. Create type definition in `types/goal.ts`
2. Add database schema in `database/schema.sql`
3. Create UI component in `components/goals/`
4. Update routing in `app/`

### Customize Theme
Edit `tailwind.config.ts` for colors, fonts, and spacing.

### Add New AI Features
1. Create AI service in `lib/ai/`
2. Add API route in `app/api/`
3. Update UI components to consume new endpoints

## Troubleshooting

### Database Connection Issues
- Check `.env.local` for database URL
- Ensure SQLite file has proper permissions
- Run migrations: `npm run db:migrate`

### Build Failures
- Clear cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run type-check`

## Contributing
See `CONTRIBUTING.md` for contribution guidelines.

## License
MIT License - See LICENSE file for details.
