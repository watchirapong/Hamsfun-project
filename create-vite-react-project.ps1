# PowerShell script to create Vite + React project from Next.js project
$sourceDir = "hamsfun-project-js-only"
$targetDir = "hamsfun-project-vite-react"

Write-Host "=== Creating Vite + React Project ===" -ForegroundColor Cyan
Write-Host ""

# Remove target if exists
if (Test-Path $targetDir) {
    Remove-Item $targetDir -Recurse -Force
    Write-Host "Removed existing folder: $targetDir" -ForegroundColor Yellow
}

# Create target directory structure
New-Item -ItemType Directory -Path $targetDir | Out-Null
New-Item -ItemType Directory -Path (Join-Path $targetDir "src") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $targetDir "src\components") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $targetDir "src\hooks") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $targetDir "src\lib") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $targetDir "src\utils") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $targetDir "src\services") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $targetDir "src\handlers") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $targetDir "src\pages") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $targetDir "public") | Out-Null
Write-Host "Created folder structure: $targetDir" -ForegroundColor Green
Write-Host ""

# Copy all JavaScript/JSX files from src (excluding app directory)
Write-Host "Copying source files..." -ForegroundColor Yellow
$srcFiles = Get-ChildItem -Path (Join-Path $sourceDir "src") -Recurse -File | Where-Object {
    $_.Extension -eq ".js" -or $_.Extension -eq ".jsx" -or $_.Name -eq "globals.css"
}

foreach ($file in $srcFiles) {
    $relativePath = $file.FullName.Replace((Join-Path $sourceDir "src") + "\", "")
    $targetPath = Join-Path $targetDir "src\$relativePath"
    $targetDirPath = Split-Path $targetPath -Parent
    
    if (-not (Test-Path $targetDirPath)) {
        New-Item -ItemType Directory -Path $targetDirPath -Force | Out-Null
    }
    
    Copy-Item $file.FullName -Destination $targetPath -Force
    Write-Host "  Copied: $relativePath" -ForegroundColor Gray
}
Write-Host "✅ Source files copied" -ForegroundColor Green
Write-Host ""

# Copy public directory
Write-Host "Copying public directory..." -ForegroundColor Yellow
Copy-Item (Join-Path $sourceDir "public") -Destination $targetDir -Recurse -Force
Write-Host "✅ public directory copied" -ForegroundColor Green
Write-Host ""

# Copy CSS file
Write-Host "Copying CSS file..." -ForegroundColor Yellow
if (Test-Path (Join-Path $sourceDir "src\app\globals.css")) {
    Copy-Item (Join-Path $sourceDir "src\app\globals.css") -Destination (Join-Path $targetDir "src\index.css") -Force
    Write-Host "✅ CSS file copied (globals.css -> index.css)" -ForegroundColor Green
}
Write-Host ""

# Create package.json for Vite + React
Write-Host "Creating package.json (Vite + React)..." -ForegroundColor Yellow
$packageJson = @{
    name = "hamsfun-project-vite-react"
    version = "0.1.0"
    type = "module"
    private = $true
    scripts = @{
        dev = "vite"
        build = "vite build"
        preview = "vite preview"
    }
    dependencies = @{
        "react" = "^18.3.1"
        "react-dom" = "^18.3.1"
        "react-router-dom" = "^6.26.0"
        "lucide-react" = "^0.554.0"
        "mongoose" = "^8.19.3"
        "react-cookie" = "^8.0.1"
        "socket.io-client" = "^4.8.1"
    }
    devDependencies = @{
        "@vitejs/plugin-react" = "^4.3.1"
        "autoprefixer" = "^10.4.19"
        "postcss" = "^8.4.38"
        "tailwindcss" = "^3.4.4"
        "vite" = "^5.4.0"
    }
}

$packageJson | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $targetDir "package.json")
Write-Host "✅ package.json created" -ForegroundColor Green
Write-Host ""

# Create vite.config.js
Write-Host "Creating vite.config.js..." -ForegroundColor Yellow
$viteConfig = @"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
})
"@
$viteConfig | Set-Content (Join-Path $targetDir "vite.config.js")
Write-Host "✅ vite.config.js created" -ForegroundColor Green
Write-Host ""

# Create index.html
Write-Host "Creating index.html..." -ForegroundColor Yellow
$indexHtml = @"
<!doctype html>
<html lang="en" class="h-full">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hamstellar - anyone can be anything</title>
    <script>
      (function() {
        try {
          var savedTheme = localStorage.getItem('app_theme');
          var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (savedTheme === 'dark' || (!savedTheme && systemTheme)) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
          }
        } catch (e) {}
      })();
    </script>
  </head>
  <body class="h-full m-0 p-0">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
"@
$indexHtml | Set-Content (Join-Path $targetDir "index.html")
Write-Host "✅ index.html created" -ForegroundColor Green
Write-Host ""

# Create main.jsx
Write-Host "Creating main.jsx..." -ForegroundColor Yellow
$mainJsx = @"
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
"@
$mainJsx | Set-Content (Join-Path $targetDir "src\main.jsx")
Write-Host "✅ main.jsx created" -ForegroundColor Green
Write-Host ""

# Create App.jsx (will convert Next.js page.jsx)
Write-Host "Creating App.jsx..." -ForegroundColor Yellow
$appJsx = @"
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import AuthHandoverPage from './pages/AuthHandoverPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth/handover" element={<AuthHandoverPage />} />
    </Routes>
  )
}

export default App
"@
$appJsx | Set-Content (Join-Path $targetDir "src\App.jsx")
Write-Host "✅ App.jsx created" -ForegroundColor Green
Write-Host ""

# Copy tailwind.config.js and postcss.config.js
Write-Host "Copying config files..." -ForegroundColor Yellow
if (Test-Path (Join-Path $sourceDir "tailwind.config.js")) {
    Copy-Item (Join-Path $sourceDir "tailwind.config.js") -Destination (Join-Path $targetDir "tailwind.config.js") -Force
    Write-Host "  Copied: tailwind.config.js" -ForegroundColor Gray
}
if (Test-Path (Join-Path $sourceDir "postcss.config.js")) {
    Copy-Item (Join-Path $sourceDir "postcss.config.js") -Destination (Join-Path $targetDir "postcss.config.js") -Force
    Write-Host "  Copied: postcss.config.js" -ForegroundColor Gray
}
Write-Host "✅ Config files copied" -ForegroundColor Green
Write-Host ""

# Create .gitignore
Write-Host "Creating .gitignore..." -ForegroundColor Yellow
$gitignore = @"
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
"@
$gitignore | Set-Content (Join-Path $targetDir ".gitignore")
Write-Host "✅ .gitignore created" -ForegroundColor Green
Write-Host ""

Write-Host "=== Project Structure Created! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Convert Next.js pages to React Router pages" -ForegroundColor Yellow
Write-Host "  2. Replace Next.js APIs (useRouter, useSearchParams) with React Router" -ForegroundColor Yellow
Write-Host "  3. Replace next/font with regular font loading" -ForegroundColor Yellow
Write-Host "  4. Update all imports" -ForegroundColor Yellow
Write-Host "  5. cd $targetDir" -ForegroundColor Cyan
Write-Host "  6. npm install" -ForegroundColor Cyan
Write-Host "  7. npm run dev" -ForegroundColor Cyan
Write-Host ""

