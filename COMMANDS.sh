#!/bin/bash
# Semantic Code Explorer - Development Helper Commands

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Semantic Code Explorer - Development Commands              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print command header
print_command() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Setup
print_command "Setup & Installation"
echo "npm install              # Install all dependencies"
echo "cp .env.example .env    # Create environment file"
echo ""

# Development
print_command "Development"
echo "npm run dev             # Start dev server (http://localhost:3000)"
echo "npm run build           # Build for production"
echo "npm start               # Run production build"
echo "npm run lint            # Run ESLint checks"
echo ""

# Useful Info
print_command "Project Information"
echo "npm audit               # Check for security vulnerabilities"
echo "npm outdated            # Check for outdated packages"
echo ""

# Testing
print_command "Testing (when implemented)"
echo "npm test                # Run test suite"
echo "npm run test:watch      # Run tests in watch mode"
echo ""

# Common Tasks
echo -e "${GREEN}Quick Start:${NC}"
echo "1. npm install"
echo "2. cp .env.example .env && add your Gemini API key"
echo "3. npm run dev"
echo "4. Open http://localhost:3000"
echo ""

echo -e "${GREEN}File Structure:${NC}"
echo "app/                    # Application routes and layouts"
echo "  ├── api/analyze       # Semantic analysis API endpoint"
echo "  ├── page.tsx          # Main page"
echo "  └── layout.tsx        # Root layout"
echo ""
echo "components/             # React components"
echo "  ├── CodeInput.tsx     # Code input form"
echo "  ├── CodeDisplay.tsx   # Interactive code blocks"
echo "  ├── SemanticSidebar.tsx  # Semantic tree view"
echo "  └── MeaningPopover.tsx   # Meaning details popup"
echo ""
echo "types/                  # TypeScript type definitions"
echo "public/                 # Static files"
echo ""

echo -e "${GREEN}Documentation:${NC}"
echo "README.md               # Project overview"
echo "QUICKSTART.md           # Getting started guide"
echo "EXAMPLES.md             # C++ code examples"
echo "ARCHITECTURE.md         # Design & architecture"
echo "COMPLETION_SUMMARY.md   # Project status"
echo ""

# URLs
echo -e "${GREEN}Useful Links:${NC}"
echo "Local Dev:   http://localhost:3000"
echo "API:         http://localhost:3000/api/analyze"
echo "Gemini API:  https://makersuite.google.com/app/apikey"
echo "Docs:        https://nextjs.org/docs"
echo ""

print_command "Environment Setup"
echo "Required: Google Gemini API Key"
echo "Set in: .env (GEMINI_API_KEY=...)"
echo ""

print_command "Features"
echo "✓ Recursive semantic decomposition"
echo "✓ Interactive code blocks"
echo "✓ Hierarchical semantic tree"
echo "✓ General & contextual meanings"
echo "✓ Plain English translation"
echo "✓ Google Gemini AI integration"
echo ""

echo -e "${BLUE}Need help? Check out:${NC}"
echo "- QUICKSTART.md for setup instructions"
echo "- EXAMPLES.md for code snippets to try"
echo "- ARCHITECTURE.md for technical details"
