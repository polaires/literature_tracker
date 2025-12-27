// Help Center Content Data
// Tutorial sections and steps for the Getting Started guide

export interface HelpStep {
  id: string;
  title: string;
  content: string;
  tips?: string[];
  shortcuts?: string[];
}

export interface HelpSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  steps: HelpStep[];
}

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of IdeaGraph',
    icon: 'Rocket',
    steps: [
      {
        id: 'create-thesis',
        title: 'Create Your First Thesis',
        content: `IdeaGraph organizes your literature review around a central research question or thesis.

**To create a new thesis:**
1. From the home page, click the **"New Thesis"** button
2. Enter your research question or hypothesis
3. Optionally add a description to provide context
4. Click **Create** to start your literature review

Your thesis will appear on the home page, and you can click it to enter the workspace.`,
        tips: [
          'Keep your thesis title focused and specific - it helps guide your paper collection',
          'You can edit your thesis title and description later from the workspace',
        ],
      },
      {
        id: 'overview-views',
        title: 'Overview of Views',
        content: `IdeaGraph provides four different ways to visualize and work with your papers:

**List View** - A searchable, sortable list of all papers with filtering options. Best for managing metadata and bulk operations.

**Graph View** - An interactive knowledge graph showing connections between papers. Best for discovering relationships and patterns.

**Timeline View** - Papers arranged chronologically by publication year. Best for understanding research evolution.

**Arguments View** - Papers grouped by their thesis role (supports, contradicts, etc.) with extracted arguments. Best for building your narrative.

Switch between views using the tabs in the header.`,
        tips: [
          'Start in List View to add and organize papers, then switch to Graph View to explore connections',
        ],
        shortcuts: ['Cmd/Ctrl + 1-4 to switch views'],
      },
    ],
  },
  {
    id: 'adding-papers',
    title: 'Adding Papers',
    description: 'Learn how to add papers to your thesis',
    icon: 'FilePlus',
    steps: [
      {
        id: 'add-doi',
        title: 'Add by DOI',
        content: `The fastest way to add a paper is by its DOI (Digital Object Identifier).

**To add a paper by DOI:**
1. Click the **"Add"** button in the header
2. Select **"Add by DOI"**
3. Paste the DOI (e.g., 10.1038/nature12373)
4. Click **Add Paper**

IdeaGraph will automatically fetch the paper's metadata from Semantic Scholar, including title, authors, abstract, publication year, and citation count.`,
        tips: [
          'You can find a paper\'s DOI on the journal website or in Google Scholar',
          'DOIs are case-insensitive - both formats work',
        ],
        shortcuts: ['N or Cmd/Ctrl + N to open Add Paper'],
      },
      {
        id: 'semantic-search',
        title: 'Search Semantic Scholar',
        content: `Don't have a DOI? Search for papers directly within IdeaGraph.

**To search for papers:**
1. Click **"Add"** → **"Search Semantic Scholar"**
2. Enter keywords, author names, or paper titles
3. Browse the results and click **Add** on papers you want
4. Papers are automatically added to your thesis

The search uses Semantic Scholar's extensive database of academic papers.`,
        tips: [
          'Use specific keywords for better results',
          'You can search by author name: "author:Smith"',
          'Filter by year range if needed',
        ],
        shortcuts: ['Cmd/Ctrl + F to search within your thesis'],
      },
      {
        id: 'batch-import',
        title: 'Batch Import',
        content: `Import multiple papers at once using a list of DOIs.

**To batch import:**
1. Click **"Add"** → **"Batch Import DOIs"**
2. Paste a list of DOIs (one per line, or comma-separated)
3. Click **Import All**

IdeaGraph will fetch each paper's metadata and add them to your thesis. A progress indicator shows the import status.

You can also import from **BibTeX** or **RIS** bibliography files using the Data Manager.`,
        tips: [
          'Export DOIs from reference managers like Zotero or Mendeley',
          'The batch importer handles up to 100 DOIs at a time',
        ],
      },
    ],
  },
  {
    id: 'graph-visualization',
    title: 'Graph View & Visualization',
    description: 'Visualize connections between papers',
    icon: 'Network',
    steps: [
      {
        id: 'switch-to-graph',
        title: 'Accessing Graph View',
        content: `Graph View displays your papers as nodes in an interactive knowledge graph, with edges showing connections between them.

**To access Graph View:**
- Click the **"Graph"** tab in the header
- Or use the keyboard shortcut

In Graph View, each paper is represented as a colored circle:
- **Green** - Supports your thesis
- **Red** - Contradicts your thesis
- **Blue** - Methodology/methods paper
- **Gray** - Background/context
- **Purple** - Other

Edges (lines) between papers show explicit connections you've created.`,
        tips: [
          'Hover over a paper node to see its title and authors',
          'Click a paper to select it and see details in the sidebar',
        ],
        shortcuts: ['Cmd/Ctrl + G to switch to Graph View'],
      },
      {
        id: 'graph-interactions',
        title: 'Interacting with the Graph',
        content: `**Navigation:**
- **Pan** - Click and drag the background
- **Zoom** - Scroll wheel or use +/- buttons
- **Fit to View** - Click the expand button to see all papers

**Selection:**
- **Click** a paper to select it
- **Shift + Click** to add to selection
- **Shift + Drag** to box-select multiple papers

**Tool Modes:**
- **Pointer Mode** - Default, for selecting papers
- **Connect Mode** - Click two papers to create a connection
- **Focus Mode** - Click a paper to spotlight its connections
- **Discovery Mode** - Find similar papers to the selected one`,
        tips: [
          'Double-click a paper to open its details panel',
          'Right-click a paper for a context menu with more options',
        ],
      },
      {
        id: 'graph-layouts',
        title: 'Layout Options',
        content: `Choose different layout algorithms to arrange your papers:

**Force** - Physics-based layout where connected papers attract each other

**Similar** - Groups papers by content similarity (AI-powered)

**Timeline** - Arranges papers horizontally by publication year

**Regions** - Fixed zones for each thesis role

**Impact** - High-citation papers at the center

**Circle** - Papers arranged in a ring

Access layouts via the **Layout** button in the graph toolbar.`,
        tips: [
          'The "Similar" layout is great for discovering hidden relationships',
          'Use "Timeline" to see research evolution at a glance',
        ],
      },
      {
        id: 'graph-settings',
        title: 'Graph Appearance Settings',
        content: `Customize how the graph looks using the settings panel.

**To access settings:**
Click the **gear icon** in the graph toolbar.

**Available settings:**
- **Node size** - Fixed, or scale by citations/connections
- **Node labels** - Always show, on hover, or never
- **Edge width and opacity** - Adjust connection visibility
- **Presets** - Quick configurations:
  - *Presentation* - Large nodes for slides
  - *Dense* - Smaller nodes for large graphs
  - *Minimalist* - Clean, label-free view
  - *High Contrast* - Maximum visibility

Settings are saved automatically.`,
        tips: [
          'Use the "Presentation" preset when creating figures for papers',
          'The "Dense" preset works well for 50+ paper graphs',
        ],
      },
    ],
  },
  {
    id: 'screening',
    title: 'Screening Workflow',
    description: 'Review and filter papers systematically',
    icon: 'ClipboardCheck',
    steps: [
      {
        id: 'screening-intro',
        title: 'Understanding Screening',
        content: `Screening is the systematic process of reviewing papers to decide which ones to include in your literature review.

IdeaGraph tracks each paper's screening status:
- **Pending** - Not yet reviewed
- **Include** - Relevant to your thesis
- **Exclude** - Not relevant (with reason)
- **Maybe** - Needs further review

The screening count shows in the header as "X to screen" when you have pending papers.`,
        tips: [
          'Screen papers early to keep your collection focused',
          'Use "Maybe" for papers you want to revisit later',
        ],
      },
      {
        id: 'screening-panel',
        title: 'Using the Screening Panel',
        content: `**To start screening:**
1. Click the **"Screen"** button in the header (shows pending count)
2. The screening panel opens with the first pending paper

**For each paper:**
- Read the title and abstract
- Click **Include** if relevant
- Click **Exclude** if not relevant (select a reason)
- Click **Maybe** if uncertain

Use the arrow buttons or keyboard to navigate between papers.

The panel shows your progress and allows filtering to "Maybe only" for later review.`,
        tips: [
          'You can screen directly from the paper list by clicking the status badge',
          'Screening decisions are saved immediately',
        ],
        shortcuts: ['Arrow keys to navigate between papers'],
      },
      {
        id: 'exclusion-reasons',
        title: 'Exclusion Reasons',
        content: `When excluding a paper, document why for transparency and reproducibility.

**Built-in exclusion reasons:**
- Wrong topic / Not relevant
- Wrong study type
- Wrong population
- Duplicate
- Not accessible
- Language barrier
- Out of date range
- Low quality

You can also add custom notes explaining your decision.

This documentation is valuable when writing your methodology section.`,
        tips: [
          'Consistent exclusion reasons make your review more rigorous',
          'Export your screening decisions for PRISMA flow diagrams',
        ],
      },
    ],
  },
  {
    id: 'ai-features',
    title: 'AI Features',
    description: 'Get AI-powered suggestions and analysis',
    icon: 'Sparkles',
    steps: [
      {
        id: 'ai-setup',
        title: 'Using AI Features',
        content: `IdeaGraph provides AI features out of the box - no setup required! Simply sign in and start using AI-powered analysis.

**What's included:**
- Connection suggestions between papers
- Gap analysis for your literature
- Paper summarization and insights
- Argument extraction

**Optional: Use Your Own API Key**

If you prefer to use a different AI model or provider, you can configure your own API key:

1. Click the **sparkle icon** in the header to open AI Settings
2. Select your provider (Claude or OpenAI)
3. Enter your API key
4. Click **Save**

This is useful if you want to use a specific model version or have your own API quota.`,
        tips: [
          'AI features work immediately after signing in - no configuration needed',
          'Using your own API key is optional and only for advanced users',
        ],
      },
      {
        id: 'connection-suggestions',
        title: 'Connection Suggestions',
        content: `AI can suggest relationships between your papers automatically.

**How it works:**
1. When you add a new paper or select one in the sidebar
2. Click **"Suggest Connections"**
3. AI analyzes the paper against your existing collection
4. Suggested connections appear with confidence scores

**Connection types:**
- **Supports** - Paper provides evidence for another
- **Contradicts** - Papers have conflicting findings
- **Extends** - Paper builds upon another
- **Uses Method** - Paper applies methodology from another
- **Reviews** - Paper surveys or synthesizes others

Accept or dismiss suggestions with one click.`,
        tips: [
          'Review AI suggestions critically - they\'re not always correct',
          'High-confidence suggestions (>70%) are usually reliable',
        ],
      },
      {
        id: 'gap-analysis',
        title: 'Gap Analysis',
        content: `AI can identify gaps in your literature coverage.

**To run gap analysis:**
1. Open the **Synthesis Tools** menu
2. Select **"Gap Analysis"**
3. AI analyzes your collection and identifies:

**Gap types:**
- **Knowledge gaps** - Topics not covered
- **Methodological gaps** - Missing approaches
- **Population gaps** - Groups not studied
- **Temporal gaps** - Time periods missing
- **Geographic gaps** - Regions underrepresented

Each gap includes priority level and suggestions for addressing it.`,
        tips: [
          'Run gap analysis after adding 10+ papers for best results',
          'Gaps can guide your next literature search',
        ],
      },
    ],
  },
  {
    id: 'pdf-reader',
    title: 'PDF Reader & Annotations',
    description: 'Read and annotate PDFs with AI assistance',
    icon: 'BookOpen',
    steps: [
      {
        id: 'open-pdf',
        title: 'Opening PDFs',
        content: `IdeaGraph includes a built-in PDF reader for reading and annotating papers.

**To open a PDF:**
- Click the **"Read"** button in the header
- Upload a PDF file (up to 50MB)
- Or click the PDF icon next to any paper with an uploaded PDF

The reader opens in full-screen mode with your paper and an AI assistant sidebar.

**Uploading PDFs to papers:**
1. Select a paper in your thesis
2. In the detail panel, click **"Upload PDF"**
3. Select the PDF file
4. The PDF is stored locally with your thesis`,
        tips: [
          'PDFs are stored in your browser\'s local storage',
          'You can backup all PDFs using the Data Manager',
        ],
      },
      {
        id: 'annotations',
        title: 'Creating Annotations',
        content: `Highlight and annotate as you read.

**To highlight text:**
1. Select text in the PDF
2. Choose a highlight color from the popup
3. Optionally add a comment

**Highlight colors:**
- **Yellow** - General highlights
- **Green** - Key findings/results
- **Red** - Critical points/issues
- **Blue** - Methodology
- **Purple** - Theory/concepts
- **Orange** - Questions/follow-up

**To add area highlights:**
- Hold Alt/Option and drag to select a region
- Useful for figures and tables

View all annotations in the sidebar panel.`,
        tips: [
          'Color-code your highlights consistently across papers',
          'Annotations sync with your paper notes',
        ],
      },
      {
        id: 'pdf-ai-assistant',
        title: 'AI Assistant',
        content: `The AI assistant helps you understand the paper you're reading.

**Available features:**
- **Summarize** - Get a quick summary of the paper
- **Explain** - Ask for explanations of complex sections
- **Extract** - Pull out key findings, methods, or arguments
- **Question** - Ask specific questions about the content

**To use the assistant:**
1. Open the assistant panel (right sidebar)
2. Type your question or select a quick action
3. AI responds with context from the PDF

The assistant remembers the conversation context for follow-up questions.`,
        tips: [
          'Select text before asking to focus the AI on that section',
          'Ask the AI to compare findings with other papers in your thesis',
        ],
      },
    ],
  },
  {
    id: 'export',
    title: 'Export Options',
    description: 'Export your research data',
    icon: 'Download',
    steps: [
      {
        id: 'review-outline',
        title: 'Review Outline Export',
        content: `Generate a structured literature review outline from your thesis.

**To export a review outline:**
1. Open **Synthesis Tools** → **"Export Review Outline"**
2. Configure options:
   - Include/exclude themes
   - Include gap analysis
   - Choose citation style (APA, MLA, Chicago, IEEE)
   - Select format (Markdown, DOCX, LaTeX)
3. Click **Export**

The outline includes:
- Introduction with your thesis
- Sections organized by themes
- Paper summaries with citations
- Identified gaps
- Conclusion`,
        tips: [
          'Add themes and organize papers before exporting for best results',
          'The Markdown format works well with academic writing tools',
        ],
        shortcuts: ['Cmd/Ctrl + E to open Data Manager'],
      },
      {
        id: 'data-export',
        title: 'Data Export & Backup',
        content: `Export your thesis data for backup or sharing.

**Data Manager** (Cmd/Ctrl + E):
- **JSON Export** - Complete thesis data (papers, connections, themes, gaps)
- **CSV Export** - Paper list with metadata
- **PDF Backup** - ZIP file with all uploaded PDFs

**To restore from backup:**
1. Open Data Manager
2. Select **Import Data**
3. Choose your backup file
4. Resolve any conflicts if papers already exist

Your data is yours - export regularly to maintain backups.`,
        tips: [
          'Export before major changes as a checkpoint',
          'JSON exports can be imported into other IdeaGraph theses',
        ],
      },
      {
        id: 'synthesis-matrix',
        title: 'Synthesis Matrix',
        content: `Create a synthesis matrix to organize papers by themes.

**To use the synthesis matrix:**
1. Open **Synthesis Tools** → **"Synthesis Matrix"**
2. Create themes (columns) that represent key concepts
3. Assign papers to themes
4. Add notes about each paper's contribution to each theme

The matrix helps you:
- Identify which themes have strong/weak coverage
- Compare how different papers address the same topic
- Structure your literature review sections

Export the matrix as a table for your paper.`,
        tips: [
          'Themes often become sections in your literature review',
          'Use the matrix to identify patterns across papers',
        ],
      },
    ],
  },
];

// Get all sections flattened with their steps
export function getAllSteps(): { section: HelpSection; step: HelpStep }[] {
  const allSteps: { section: HelpSection; step: HelpStep }[] = [];
  for (const section of HELP_SECTIONS) {
    for (const step of section.steps) {
      allSteps.push({ section, step });
    }
  }
  return allSteps;
}

// Find section by ID
export function findSection(sectionId: string): HelpSection | undefined {
  return HELP_SECTIONS.find((s) => s.id === sectionId);
}

// Find step by section and step ID
export function findStep(
  sectionId: string,
  stepId: string
): { section: HelpSection; step: HelpStep } | undefined {
  const section = findSection(sectionId);
  if (!section) return undefined;
  const step = section.steps.find((s) => s.id === stepId);
  if (!step) return undefined;
  return { section, step };
}

// Get next/previous step
export function getAdjacentStep(
  sectionId: string,
  stepId: string,
  direction: 'next' | 'prev'
): { section: HelpSection; step: HelpStep } | undefined {
  const allSteps = getAllSteps();
  const currentIndex = allSteps.findIndex(
    (s) => s.section.id === sectionId && s.step.id === stepId
  );
  if (currentIndex === -1) return undefined;

  const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
  if (newIndex < 0 || newIndex >= allSteps.length) return undefined;

  return allSteps[newIndex];
}

// Search content
export function searchContent(query: string): { section: HelpSection; step: HelpStep }[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: { section: HelpSection; step: HelpStep }[] = [];

  for (const section of HELP_SECTIONS) {
    for (const step of section.steps) {
      if (
        step.title.toLowerCase().includes(q) ||
        step.content.toLowerCase().includes(q) ||
        section.title.toLowerCase().includes(q)
      ) {
        results.push({ section, step });
      }
    }
  }

  return results;
}
