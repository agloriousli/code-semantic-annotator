# Architecture & Design

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Next.js)               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  CodeInput   │──│ page.tsx     │──│ CodeDisplay      │  │
│  │  Component   │  │ (Main Page)  │  │ Component        │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                           │                      │           │
│                           │                      │           │
│  ┌──────────────┐  ┌──────▼──────┐  ┌───────────▼──────┐  │
│  │Semantic      │  │API Client    │  │MeaningPopover    │  │
│  │Sidebar       │  │(fetch)       │  │Component         │  │
│  │Component     │  └──────┬───────┘  └──────────────────┘  │
│  └──────────────┘         │                                  │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                   ┌────────▼────────┐
                   │  /api/analyze   │
                   │  (API Route)    │
                   └────────┬────────┘
                            │
                   ┌────────▼────────────┐
                   │ Gemini API Client   │
                   │  (@google/gen...)   │
                   └────────┬────────────┘
                            │
                   ┌────────▼────────────┐
                   │  Google Gemini API  │
                   │  (Google Cloud)     │
                   └─────────────────────┘
```

## Data Flow

### 1. User Analysis Request

```
User Input (Code + Language)
    ↓
[CodeInput.tsx]
    ↓
POST /api/analyze
    ↓
[Gemini Prompt with bottom-up instructions]
    ↓
Google Gemini 2.0 Flash LLM
    ↓
[Recursive Semantic Decomposition]
    ↓
[JSON: SemanticTree with all nodes]
    ↓
Frontend receives and displays
```

### 2. Interactive Exploration

```
User clicks semantic block
    ↓
[CodeDisplay.tsx]
    ↓
onSelectNode callback
    ↓
State update (selectedNodeId)
    ↓
[MeaningPopover.tsx] renders
    ↓
Sidebar highlights corresponding node
    ↓
User sees: General & Contextual meanings
```

## Component Architecture

### CodeInput.tsx
- **Role**: Code entry point
- **Responsibilities**:
  - Text area for C++ code input
  - Form submission handling
  - Loading state management
  - Default example code

### CodeDisplay.tsx
- **Role**: Visual semantic representation
- **Responsibilities**:
  - Renders code with overlaid semantic blocks
  - Color-codes by token type
  - Handles click/hover interactions
  - Manages popover visibility
  - Collects all nodes from tree into flat array for rendering

### SemanticSidebar.tsx
- **Role**: Hierarchical tree navigation
- **Responsibilities**:
  - Recursive rendering of semantic tree (top-down)
  - Shows general + contextual meanings for each node
  - Selects nodes when clicked
  - Visual feedback for selected node
  - Nested indentation for hierarchy

### MeaningPopover.tsx
- **Role**: Detailed meaning display
- **Responsibilities**:
  - Shows selected node details
  - Displays both meanings
  - Handles click-outside to close
  - Adjusts position to prevent overflow
  - Shows child node count

## Type System

### SemanticNode
```typescript
{
  id: string;                           // Unique identifier
  code: string;                         // Code fragment
  startPos: number;                     // Start index in root code
  endPos: number;                       // End index in root code
  generalMeaning: string;              // Language semantics
  contextualMeaning: string;           // Role in this code
  nodeType: 'elementary' | 'composite';
  tokenType?: 'identifier' | 'literal' | 'operator' | 'keyword' | 'delimiter';
  children: SemanticNode[];            // Child nodes
}
```

### SemanticTree
```typescript
{
  root: SemanticNode;                  // Root of entire code
  plainEnglishTranslation: string;    // Full program translation
  language: string;                    // Programming language
}
```

## API Endpoint Design

### POST /api/analyze

**Request:**
```json
{
  "code": "int x = 5;",
  "language": "C++"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "root": { /* SemanticNode */ },
    "plainEnglishTranslation": "Declare and initialize...",
    "language": "C++"
  }
}
```

## Semantic Decomposition Algorithm (Gemini-Powered)

### Step 1: Tokenization
- Break code into lexical tokens
- Identify token type: keyword, identifier, literal, operator, delimiter

### Step 2: Bottom-Up Explanation
```
Elementary Units (tokens):
  int  → keyword that declares integer type
  x    → identifier for variable name
  =    → assignment operator
  5    → integer literal

Expressions:
  x = 5        → assignment expression
  
Statements:
  int x = 5;   → variable declaration statement

Program:
  Full code    → complete C++ program snippet
```

### Step 3: Context Integration
- At each level, explain what the unit MEANS (general)
- And what it DOES in this specific code (contextual)

## Color Coding

| Token Type | Color | Hex |
|-----------|-------|-----|
| Keyword | Purple | `#E9D5FF` border `#9F7AEA` |
| Identifier | Blue | `#DBEAFE` border `#3B82F6` |
| Literal | Green | `#DCFCE7` border `#22C55E` |
| Operator | Yellow | `#FEF3C7` border `#EAB308` |
| Delimiter | Gray | `#F3F4F6` border `#D1D5DB` |
| Composite | Indigo | `#E0E7FF` border `#818CF8` |

## File Organization

```
app/
  ├── api/analyze/route.ts       ← API endpoint
  ├── layout.tsx                  ← Root layout
  ├── page.tsx                    ← Main page
  └── globals.css                 ← Global styles

components/
  ├── CodeInput.tsx               ← Code input form
  ├── CodeDisplay.tsx             ← Interactive blocks
  ├── SemanticSidebar.tsx         ← Tree view
  └── MeaningPopover.tsx          ← Meaning popup

types/
  └── semantic.ts                 ← Type definitions

Configuration:
  ├── package.json                ← Dependencies
  ├── tsconfig.json               ← TypeScript config
  ├── next.config.ts              ← Next.js config
  ├── tailwind.config.ts          ← Tailwind config
  └── postcss.config.mjs          ← PostCSS config
```

## Key Design Decisions

### 1. Bottom-Up Rendering
- Collect all nodes into flat array
- Sort by size (largest first)
- Render with CSS z-index for proper layering
- Allows small tokens to be clickable on top of larger units

### 2. Gemini as Semantic Engine
- LLM understands programming language semantics
- Can explain intent, not just syntax
- Handles complex constructs naturally
- Provides contextual meaning automatically

### 3. Tree vs. DAG
- Currently implemented as tree (no shared nodes)
- Could extend to DAG for code with multiple references
- Tree simplifies traversal and UI rendering

### 4. Position-Based Selection
- Uses character position ranges (startPos, endPos)
- Allows precise mapping from UI to semantic units
- Supports hierarchical overlap detection

## Performance Considerations

- **API Calls**: One request per code snippet (amortized)
- **Rendering**: Tree is rendered recursively (small overhead for typical code)
- **Memory**: Entire tree held in React state (fine for code snippets)
- **UI Responsiveness**: All UI operations are client-side (instant feedback)

## Future Extensibility

### Multi-Language Support
```typescript
// Modify this prompt based on language
const prompt = buildSemanticAnalysisPrompt(code, language);
```

### Advanced Visualizations
- Syntax highlighting integration
- Control flow graph overlay
- Variable scope visualization
- Call graph for functions

### Export Functionality
- JSON tree export
- HTML documentation generation
- Markdown translation export

### Collaborative Features
- Share semantic trees via URL
- Compare decompositions
- Annotate with custom meanings

## Testing Strategy

1. **Unit Tests**: Component rendering with mock data
2. **Integration Tests**: API endpoint with real Gemini
3. **End-to-End Tests**: Full workflow with browser automation
4. **Manual Testing**: Various C++ code patterns

## Security Considerations

- API key stored in environment variables
- No user data persistence
- Input validation on code submission
- Safe JSON parsing with error handling
