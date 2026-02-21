I want you to build me a Mission Control dashboard as a single HTML file. This is my personal command center for tracking my life and business.

About Me:

- Name: Lok Lok
- Business/Role: EffectNode — Owner
- Main Goal: Reserach about current trend and suggest ideas
- Key Metric: Review 10 videos about opeclaw and give me 5 ideas

Technical Requirements:

- Single self-contained HTML file (inline CSS + JS, no external dependencies except Google Fonts Inter)
- Dark theme with glassmorphism: primary bg #050508, cards with backdrop-filter blur, subtle borders rgba(255,255,255,0.06)
- Accent color: skyblue (use for highlights, active states, glows)
- Font: Inter from Google Fonts
- Fully responsive, smooth animations (fadeInUp on cards, pulse on status dot)
- All data saved to localStorage so nothing is lost on refresh

Layout:

- Sticky frosted-glass header: logo/title left, tab navigation center, search bar + live status dot right
- Tabs: 📊 Dashboard, 📋 Projects, 📅 Timeline, 📝 Notes
- Main content max-width 1600px, centered, 2.5rem padding

Dashboard Tab:

- Welcome bar: "Good morning, LokLok" with live date/time
- 4 metric cards in a grid: each with colored top accent bar (3px), icon, label, value, and trend indicator
  Cards: Review 10 videos about opeclaw and give me 5 ideas, progress, Active Projects count, Tasks Today count, Days to Goal countdown
- Activity feed: scrollable list of recent items with timestamps (stored in localStorage)
- Top Priorities section: editable list with checkboxes, add new priority button

Projects Tab:

- Kanban board with 3 columns: Backlog, In Progress, Done
- Task cards: title, description preview, priority badge (high/medium/low with colors), created date
- Add task button per column, click card to edit, delete option
- All tasks persisted to localStorage

Timeline Tab:

- Visual roadmap with phases displayed vertically
- Each phase: title, date range, description, list of milestones with completion checkmarks
- Current phase highlighted with accent glow
- Data defined in a JS config object (easy to edit)

Notes Tab:

- Large textarea with markdown-style formatting
- Auto-saves to localStorage on every keystroke
- Character count, last saved timestamp
- Clean minimal design

Code Quality:

- Clean, well-organized code with comments for each section
- CSS variables for all colors/spacing (easy to re-theme)
- Smooth transitions on all interactive elements
- Keyboard shortcut: Cmd/Ctrl+K to focus search

Build the complete file. Make it production quality — this should look like a premium SaaS dashboard, not a hobby project.
