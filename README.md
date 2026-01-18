# Semantic Code Explorer

An interactive web application that performs recursive, bottom-up semantic decomposition of C++ code snippets using Google Gemini AI.

## Features

- **Recursive Semantic Analysis**: Bottom-up decomposition from tokens to full program
- **Interactive Code Blocks**: Click any semantic unit to see its meaning
- **Dual Meaning System**: 
  - General meaning (language-level semantics)
  - Contextual meaning (role in specific code)
- **Hierarchical Sidebar**: Tree view of all semantic units with bidirectional sync
- **Plain English Translation**: Literal translation of the entire code snippet
- **Color-Coded Tokens**: Visual distinction between keywords, identifiers, literals, operators, and delimiters

## Tech Stack

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini 2.0 Flash
- **Language Support**: C++ (extensible to other languages)

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## How to Use

1. **Enter Code**: Paste or type C++ code in the textarea (example provided)
2. **Analyze**: Click "Analyze Code" button
3. **Explore**: 
   - Click semantic blocks in the code view to see meanings
   - Browse the sidebar tree for hierarchical structure
   - Select items in sidebar to highlight corresponding code
4. **Read Translation**: View the plain English translation at the bottom

## Project Structure

```
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts          # Gemini API integration
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main page
│   └── globals.css               # Global styles
├── components/
│   ├── CodeInput.tsx             # Code input form
│   ├── CodeDisplay.tsx           # Interactive code renderer
│   ├── SemanticSidebar.tsx       # Hierarchical tree view
│   └── MeaningPopover.tsx        # Popup for meanings
├── types/
│   └── semantic.ts               # TypeScript type definitions
└── package.json
```

## How It Works

1. **Decomposition**: Code is recursively broken down to elementary lexical tokens
2. **Bottom-Up Analysis**: Starting from tokens, Gemini generates meanings for progressively larger units
3. **Dynamic Programming**: Child explanations are used when generating parent explanations
4. **Tree Structure**: Results stored as a tree/DAG for efficient querying
5. **Interactive UI**: React components render clickable semantic blocks with hover effects

## Semantic Analysis Algorithm

```
Step 1: Decompose code to elementary units (tokens)
Step 2: Explain each unit with:
        - General meaning (language-level)
        - Contextual meaning (in this code)
Step 3: Compose into larger units, repeat until full program
```

## Future Enhancements

- [ ] Multi-language support (Python, JavaScript, etc.)
- [ ] Drag-select for composite units
- [ ] Export semantic tree as JSON
- [ ] Save/share annotated snippets
- [ ] Better multiline code visualization
- [ ] Syntax highlighting integration

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
