# Quick Start Guide

## 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your API key

## 2. Configure Environment

```bash
# Create environment file
cp .env.example .env

# Add your API key to .env
echo "GEMINI_API_KEY=paste_your_key_here" >> .env
```

Or manually edit `.env`:
```
GEMINI_API_KEY=your_actual_key_here
```

## 3. Install & Run

```bash
# Install dependencies (already done)
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 4. Test with Example Code

The app comes with an example factorial function:

```cpp
int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
```

1. Click **Analyze Code**
2. Wait for Gemini to decompose the code
3. Click semantic blocks to see meanings
4. Browse the sidebar to explore the semantic tree

## 5. Try Your Own Code

Replace the example with any C++ code snippet and click Analyze!

## Troubleshooting

**Error: GEMINI_API_KEY is not defined**
- Make sure `.env` file exists with your API key
- Restart the dev server after creating/updating `.env`

**Error: Failed to parse semantic analysis response**
- Check your API key is valid
- Ensure you have API quota remaining
- Try a simpler code snippet

**Blocks not displaying correctly**
- Currently optimized for single-line to short multiline code
- For longer code, functionality is preserved but visualization may need layout adjustment

## Project Structure

```
semantic-code-explorer/
├── app/
│   ├── api/analyze/route.ts      ← Gemini API integration
│   ├── layout.tsx                 ← Root layout
│   ├── page.tsx                   ← Main page
│   └── globals.css
├── components/
│   ├── CodeInput.tsx              ← Input form
│   ├── CodeDisplay.tsx            ← Interactive blocks
│   ├── SemanticSidebar.tsx        ← Tree view
│   └── MeaningPopover.tsx         ← Meaning popup
├── types/
│   └── semantic.ts                ← TypeScript types
└── package.json
```

## Development

**Start dev server:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
npm start
```

**Run linter:**
```bash
npm run lint
```

## Next Steps

- Analyze different types of C++ code
- Extend to support other languages by modifying the API prompt
- Explore the semantic tree structure in the browser DevTools
- Check the plain English translation for accuracy

Enjoy exploring code semantically! 🚀
