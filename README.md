# TruthLens AI

> **Detect. Understand. Verify.**
> 
> *"Don't just ask whether media is fake. Ask why you should trust it."*

TruthLens AI is a GenAI-powered media verification platform engineered to help individuals, journalists, and researchers inspect potentially AI-generated or manipulated images, audio, and video, understand empirical signal evidence, and verify real-world context before trusting or sharing media.

---

## Core Philosophy

```
DETECT ───► UNDERSTAND ───► VERIFY
```

1. **DETECT**: Uncover measurable physical, acoustic, and compression indicators across images, audio tracks, and video frames.
2. **UNDERSTAND**: Synthesize findings into plain-language explanations answering what was detected, why it matters, and what it does *not* prove.
3. **VERIFY**: Ground media in source domain credibility, publication timelines, genuine reverse-search endpoints, and practical verification checklists.

> **Ethical AI Disclaimer**: TruthLens AI provides experimental media analysis and verification guidance. Its indicators do not prove that media is authentic or AI-generated. Always verify important information with reliable sources.

---

## Key Features

### 1. Multi-Modal Client-Side Forensics
- **Image Forensics** (`JPG`, `JPEG`, `PNG`, `WEBP`):
  - Spatial noise consistency across image quadrants
  - Luminance distribution & RMS contrast
  - RGB channel discrepancy & dynamic range clipping
  - Binary header inspection (camera EXIF markers, PNG text parameters, diffusion chunks)
  - Experimental recompression difference (conservatively weighted)
  - Factual dimensions (dimensions alone never increase risk)
- **Audio Forensics** (`MP3`, `WAV`, `M4A`, `OGG`):
  - Web Audio API waveform decoding & dynamics
  - RMS level, peak amplitude & crest factor (dB)
  - Premature high-frequency brickwall cutoff detection (e.g. vocoder constraints)
  - Conversational pause and silence ratio distribution
  - Digital clipping and zero-crossing rate variance
- **Video Forensics** (`MP4`, `MOV`, `WEBM`):
  - Temporal multi-frame timeline sampling (< 12 frames for optimal memory)
  - Inter-frame pixel difference (MAD) and transition cut detection
  - Temporal luminance flicker variance across continuous sequences
  - High-frequency edge sharpness consistency ratio

### 2. GenAI & Local Heuristic Explanation Layer
- **5-Point Structured Synthesis**:
  1. What was detected
  2. Why the indicators matter
  3. What the indicators do NOT prove
  4. Confidence & measurement limitations
  5. What the user should verify next
- **Provider Abstraction**:
  - **Local Forensic Synthesizer (Default)**: 100% offline, deterministic, rule-based synthesis strictly grounded in measured data.
  - **Google Gemini 1.5 Flash (Optional)**: Can be activated with `VITE_GEMINI_API_KEY` or entered directly in the UI settings drawer for live natural language generation. No keys are ever stored on servers.

### 3. Source & Provenance Verification
- URL validation and HTTPS protocol security check
- Domain categorization (Established News, Social Media, Stock Library, Image Host)
- CORS-guarded remote header inspection
- 1-click external reverse-search queries (Google Lens, TinEye, Bing Visual Search)
- Interactive 6-step empirical verification checklist

### 4. Interactive Results Dashboard
- Overall assessment badge (Low Indicator Level, Moderate Risk Indicators, Elevated Risk Indicators, Inconclusive)
- Heuristic Indicator Index (0–100 calibrated score)
- Filterable detected indicator cards with technical context and limitation notes
- Expandable raw forensic telemetry view
- "Analyze Another Media" reset flow and one-click summary clipboard export

### 5. Privacy & Zero-Cloud Retention
- All media files are inspected directly within the user's browser using HTML5 Canvas, FileReader, and Web Audio API.
- Zero server uploads, zero cloud storage, zero tracking cookies.

---

## Technical Stack

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom glassmorphism, glowing badges, and responsive layouts
- **Icons**: Lucide React
- **Build Tool**: Vite 6 (Ultra-fast, lightweight bundle: ~330 KB uncompressed, ~93 KB gzipped)
- **APIs**: Native Web Audio API, HTML5 Canvas 2D, HTML5 Video, Fetch API, Optional Google Gemini REST API

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation
```bash
npm install
```
*(On Windows PowerShell, run `npm.cmd install`)*

### Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build & Type Check
```bash
npm run build
```
Generates an optimized, error-free production build in `dist/`.

---

## Optional Gemini API Configuration

To enable live Google Gemini 1.5 Flash natural language explanations:

1. Create a `.env` file in the project root:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
2. Or simply paste your API key inside the interactive "Optional Gemini API Key" drawer directly on the results dashboard during demo evaluations.

*Note: TruthLens works completely offline without an API key using its built-in rule-based forensic synthesizer.*

---

## License

Built for responsible synthetic media verification. Licensed under the MIT License.
