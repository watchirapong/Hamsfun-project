# PowerShell script to create a clean JavaScript-only project
$sourceDir = "."
$targetDir = "hamsfun-project-js-only"

Write-Host "=== Creating JavaScript-Only Project ===" -ForegroundColor Cyan
Write-Host ""

# Remove target if exists
if (Test-Path $targetDir) {
    Remove-Item $targetDir -Recurse -Force
    Write-Host "Removed existing folder: $targetDir" -ForegroundColor Yellow
}

# Create target directory
New-Item -ItemType Directory -Path $targetDir | Out-Null
Write-Host "Created folder: $targetDir" -ForegroundColor Green
Write-Host ""

# Function to copy directory recursively, excluding TypeScript files
function Copy-JSOnly {
    param($Source, $Target)
    
    if (-not (Test-Path $Source)) {
        return
    }
    
    New-Item -ItemType Directory -Path $Target -Force | Out-Null
    
    Get-ChildItem -Path $Source -File | Where-Object {
        $ext = $_.Extension
        $ext -ne ".ts" -and $ext -ne ".tsx" -and $_.Name -ne "next-env.d.ts"
    } | ForEach-Object {
        Copy-Item $_.FullName -Destination $Target -Force
        Write-Host "  Copied: $($_.Name)" -ForegroundColor Gray
    }
    
    Get-ChildItem -Path $Source -Directory | Where-Object {
        $_.Name -ne "node_modules" -and $_.Name -ne ".next" -and $_.Name -ne "types"
    } | ForEach-Object {
        Copy-JSOnly $_.FullName (Join-Path $Target $_.Name)
    }
}

# Copy src directory (JavaScript files only)
Write-Host "Copying src directory (JS/JSX only)..." -ForegroundColor Yellow
Copy-JSOnly "src" (Join-Path $targetDir "src")
Write-Host "✅ src directory copied" -ForegroundColor Green
Write-Host ""

# Copy public directory
Write-Host "Copying public directory..." -ForegroundColor Yellow
Copy-Item "public" -Destination $targetDir -Recurse -Force
Write-Host "✅ public directory copied" -ForegroundColor Green
Write-Host ""

# Copy config files
Write-Host "Copying configuration files..." -ForegroundColor Yellow
$configFiles = @(
    "next.config.js",
    "tailwind.config.js",
    "postcss.config.js",
    "jsconfig.json"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Copy-Item $file -Destination $targetDir -Force
        Write-Host "  Copied: $file" -ForegroundColor Gray
    }
}

# Create clean package.json (without TypeScript)
Write-Host "Creating package.json (JavaScript only)..." -ForegroundColor Yellow
$packageJson = @{
    name = "hamsfun-project-js-only"
    version = "0.1.0"
    private = $true
    scripts = @{
        dev = "next dev"
        build = "next build"
        start = "next start"
    }
    dependencies = @{
        "lucide-react" = "^0.554.0"
        "mongoose" = "^8.19.3"
        "next" = "^14.2.5"
        "react" = "^18.3.1"
        "react-cookie" = "^8.0.1"
        "react-dom" = "^18.3.1"
        "socket.io-client" = "^4.8.1"
    }
    devDependencies = @{
        autoprefixer = "^10.4.19"
        postcss = "^8.4.38"
        tailwindcss = "^3.4.4"
    }
}

$packageJson | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $targetDir "package.json")
Write-Host "✅ package.json created" -ForegroundColor Green
Write-Host ""

# Create .gitignore
Write-Host "Creating .gitignore..." -ForegroundColor Yellow
$gitignore = @"
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
"@
$gitignore | Set-Content (Join-Path $targetDir ".gitignore")
Write-Host "✅ .gitignore created" -ForegroundColor Green
Write-Host ""

# Update jsconfig.json to exclude TypeScript
Write-Host "Updating jsconfig.json..." -ForegroundColor Yellow
$jsconfigPath = Join-Path $targetDir "jsconfig.json"
if (Test-Path $jsconfigPath) {
    $jsconfig = Get-Content $jsconfigPath | ConvertFrom-Json
    $jsconfig.include = @("src/**/*.js", "src/**/*.jsx")
    $jsconfig | ConvertTo-Json -Depth 10 | Set-Content $jsconfigPath
    Write-Host "✅ jsconfig.json updated (TypeScript excluded)" -ForegroundColor Green
}
Write-Host ""

# Create README
Write-Host "Creating README.md..." -ForegroundColor Yellow
$readme = @"
# Hamsfun Project - JavaScript Only

This is a clean JavaScript-only version of the Hamsfun project.

## Features

- ✅ 100% JavaScript (no TypeScript)
- ✅ React JS
- ✅ Next.js framework
- ✅ All features working

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run development server:
\`\`\`bash
npm run dev
\`\`\`

3. Build for production:
\`\`\`bash
npm run build
\`\`\`

4. Start production server:
\`\`\`bash
npm run start
\`\`\`

## Project Structure

- \`src/app/\` - Next.js App Router (pages and layouts)
- \`src/components/\` - React components
- \`src/hooks/\` - Custom React hooks
- \`src/utils/\` - Utility functions
- \`src/lib/\` - Library code
- \`public/\` - Static assets

## No TypeScript

This project uses only JavaScript:
- All files are \`.js\` or \`.jsx\`
- No TypeScript dependencies
- No type definitions needed
- Works perfectly with React and Next.js
"@
$readme | Set-Content (Join-Path $targetDir "README.md")
Write-Host "✅ README.md created" -ForegroundColor Green
Write-Host ""

Write-Host "=== Project Created Successfully! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. cd $targetDir" -ForegroundColor Yellow
Write-Host "  2. npm install" -ForegroundColor Yellow
Write-Host "  3. npm run dev" -ForegroundColor Yellow
Write-Host ""

