---
description: 
globs: 
alwaysApply: false
---
# Project Structure Guide

## Main Directories

- **app/**: Contains Next.js app directory structure, including main pages and route segments.
  - `globals.css`: Global styles, includes Tailwind base, component, and utility layers, and CSS variables for theming.
  - `layout.tsx`: Root layout for the app.
  - `page.tsx`: Main landing page.
  - **portfolios/**: Portfolio-related routes, including dynamic `[id]` subroutes.
  - **securities/**: Security-related routes, including dynamic `[ticker]` subroutes.
  - **settings/**: User or app settings page.

- **components/**: Houses all React components, organized by feature and UI primitives.
  - **dashboard/**: Dashboard widgets (e.g., news, timeline, summary, recommendations).
  - **layout/**: Layout components like header and sidebar.
  - **portfolios/**: Portfolio-specific components (e.g., charts, calculators).
  - **securities/**: Security-specific components (e.g., history, charts, indicators).
  - **ui/**: Reusable UI primitives (e.g., button, card, dialog, form, table, etc.).
  - `mode-toggle.tsx`: Theme toggle component.
  - `theme-provider.tsx`: Theme context/provider.

- **hooks/**: Custom React hooks.
  - `use-toast.ts`: Toast notification logic.

- **lib/**: Utility functions and helpers.
  - `utils.ts`: Utility for merging Tailwind and class names.

## Configuration Files

- **package.json**: Lists dependencies (Next.js, Tailwind, Radix UI, etc.), scripts, and project metadata.
- **tsconfig.json**: TypeScript configuration, including path alias for `@/*` to project root.
- **next.config.js**: Next.js configuration (static export, ESLint, unoptimized images).
- **postcss.config.js**: PostCSS setup for Tailwind and Autoprefixer.
- **tailwind.config.ts**: Tailwind CSS configuration, custom themes, colors, animations, and plugin usage.
- **components.json**: UI component library configuration, including aliases for imports.

## TypeScript

- **next-env.d.ts**: Next.js TypeScript environment types. Do not edit manually.

## Aliases

- `@/components` → components/
- `@/lib/utils` → lib/utils.ts
- `@/components/ui` → components/ui/
- `@/lib` → lib/
- `@/hooks` → hooks/

## Styling

- Uses Tailwind CSS with custom configuration and theming.
- Global styles and CSS variables are defined in `app/globals.css`.

## Notes

- Dynamic routes for portfolios and securities are handled via `[id]` and `[ticker]` folders in `app/`.
- UI primitives in `components/ui/` are highly reusable and follow Radix UI patterns.
- The project is set up for static export (`output: 'export'` in Next.js config).
