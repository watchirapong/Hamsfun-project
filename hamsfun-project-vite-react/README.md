# Hamsfun Project - Vite + React

This is a **Vite + React** version of the Hamsfun project, converted from Next.js.

## Features

- ✅ **100% JavaScript** - No TypeScript
- ✅ **Vite** - Fast build tool and dev server
- ✅ **React Router** - Client-side routing
- ✅ **All Features Working** - Complete functionality preserved
- ✅ **Performance Optimized** - OOP patterns, caching, memoization

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment File

Create a `.env` file in the root directory:

```env
# Backend API URL
VITE_BACKEND_URL=https://api.questcity.cloud

# App URL (for redirects)
VITE_APP_URL=http://localhost:3000

# Socket.io URL (optional)
VITE_SOCKET_URL=https://api.questcity.cloud

# Socket.io Path (optional)
VITE_SOCKET_PATH=/hamster-world-api/socket.io
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

### 5. Preview Production Build

```bash
npm run preview
```

## Project Structure

```
hamsfun-project-vite-react/
├── src/
│   ├── pages/           # Page components
│   │   ├── HomePage.jsx
│   │   └── AuthHandoverPage.jsx
│   ├── components/      # React components
│   ├── hooks/           # Custom React hooks
│   ├── handlers/        # Event handlers
│   ├── services/        # Services
│   ├── lib/             # Library code
│   ├── utils/            # Utilities
│   ├── App.jsx          # Main app with routing
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── index.html           # HTML entry point
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies
```

## Key Differences from Next.js

### Routing
- **Next.js**: File-based routing (`src/app/page.jsx`)
- **Vite**: React Router (`src/pages/HomePage.jsx`)

### Environment Variables
- **Next.js**: `process.env.NEXT_PUBLIC_*`
- **Vite**: `import.meta.env.VITE_*`

### Font Loading
- **Next.js**: `next/font/google`
- **Vite**: CSS imports in `index.html`

### Entry Point
- **Next.js**: `src/app/layout.jsx` + `src/app/page.jsx`
- **Vite**: `index.html` → `src/main.jsx` → `src/App.jsx`

## Dependencies

### Runtime
- `react` - React library
- `react-dom` - React DOM
- `react-router-dom` - Routing
- `lucide-react` - Icons
- `mongoose` - MongoDB ODM
- `react-cookie` - Cookie management
- `socket.io-client` - WebSocket client

### Development
- `vite` - Build tool
- `@vitejs/plugin-react` - React plugin for Vite
- `tailwindcss` - CSS framework
- `postcss` - CSS processor
- `autoprefixer` - CSS autoprefixer

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Notes

- All TypeScript files have been removed
- All Next.js specific code has been converted
- Environment variables use `VITE_` prefix
- Routing uses React Router instead of Next.js App Router

## Troubleshooting

### Environment Variables Not Working
- Make sure variables start with `VITE_` prefix
- Restart the dev server after changing `.env`
- Variables are only available in client-side code

### Routing Issues
- Make sure `BrowserRouter` wraps your app in `main.jsx`
- Use `useNavigate()` instead of Next.js `useRouter()`
- Use `useSearchParams()` from `react-router-dom`

## Support

For issues or questions, refer to:
- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)

