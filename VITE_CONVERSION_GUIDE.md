# Vite + React Conversion Guide

## Conversion Steps Required

### 1. Environment Variables
- `process.env.NEXT_PUBLIC_*` → `import.meta.env.VITE_*`
- Update all references in code

### 2. Next.js APIs to Replace
- `useRouter()` from `next/navigation` → `useNavigate()` from `react-router-dom`
- `useSearchParams()` from `next/navigation` → `useSearchParams()` from `react-router-dom`
- `next/font/google` → Regular CSS font imports

### 3. File Structure Changes
- `src/app/page.jsx` → `src/pages/HomePage.jsx`
- `src/app/auth/handover/page.jsx` → `src/pages/AuthHandoverPage.jsx`
- Remove `src/app/layout.jsx` (merge into App.jsx)
- Create `src/App.jsx` with React Router
- Create `src/main.jsx` as entry point

### 4. Remove Next.js Specific Code
- Remove `'use client'` directives
- Remove `export const metadata`
- Remove Next.js layout wrapper

### 5. Update Imports
- All `@/` imports should work with Vite alias
- Update font loading

## Files to Create/Modify

1. `vite.config.js` - Vite configuration with path alias
2. `index.html` - HTML entry point
3. `src/main.jsx` - React entry point
4. `src/App.jsx` - Main app with React Router
5. `src/pages/HomePage.jsx` - Converted from page.jsx
6. `src/pages/AuthHandoverPage.jsx` - Converted from auth/handover/page.jsx
7. `package.json` - Vite dependencies
8. Update all environment variable references

