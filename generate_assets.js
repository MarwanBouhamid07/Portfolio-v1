const fs = require('fs');
const path = require('path');

const projects = [
  {
    filename: 'edumanager.svg',
    title: 'EduManager',
    subtitle: 'School Management & Student Records',
    tag: 'Full-Stack / Backend',
    themeColor: '#3b82f6',
    accentColor: '#60a5fa',
    icon: `<path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" fill="#3b82f6"/>`,
    details: ['Student Roster & Attendance Matrix', 'Administrative Workflow Automation', 'Secure Academic Records Engine']
  },
  {
    filename: 'khidmati.svg',
    title: 'Khidmati Al-Raqmiya',
    subtitle: 'Moroccan Craftsmen & Services Platform',
    tag: 'Full-Stack / Backend',
    themeColor: '#10b981',
    accentColor: '#34d399',
    icon: `<path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.6 14L15.3 15.3C14.3 14.3 13 13.8 11.5 13.8C8.5 13.8 6 16.3 6 19.3H4C4 15.2 7.4 11.8 11.5 11.8C13.6 11.8 15.4 12.6 16.6 14Z" fill="#10b981"/>`,
    details: ['Verified Trades & Artisan Directory', 'Dynamic WhatsApp Direct Connection', 'Bilingual City & Category Search']
  },
  {
    filename: 'dark-neumorphic-calculator.svg',
    title: 'Dark Neumorphic Calculator',
    subtitle: 'Soft Dark Shadows & JS Arithmetic',
    tag: 'Frontend / UI',
    themeColor: '#8b5cf6',
    accentColor: '#a78bfa',
    icon: `<rect x="4" y="2" width="16" height="20" rx="2" fill="none" stroke="#8b5cf6" stroke-width="2"/><line x1="8" y1="6" x2="16" y2="6" stroke="#8b5cf6" stroke-width="2"/><circle cx="8" cy="11" r="1" fill="#8b5cf6"/><circle cx="12" cy="11" r="1" fill="#8b5cf6"/><circle cx="16" cy="11" r="1" fill="#8b5cf6"/><circle cx="8" cy="15" r="1" fill="#8b5cf6"/><circle cx="12" cy="15" r="1" fill="#8b5cf6"/><circle cx="16" cy="15" r="1" fill="#8b5cf6"/>`,
    details: ['Neumorphic Dual-Shadow Inset Elevations', 'Floating Point Math Precision Engine', 'Responsive Keyboard & Touch Controls']
  },
  {
    filename: 'weather-dashboard.svg',
    title: 'Weather Dashboard',
    subtitle: 'OpenWeatherMap Real-time Telemetry',
    tag: 'API-based',
    themeColor: '#0ea5e9',
    accentColor: '#38bdf8',
    icon: `<path d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04Z" fill="#0ea5e9"/>`,
    details: ['Real-time Temperature & Wind Speed', 'Atmospheric Pressure Mapping', 'Interactive Geolocation Search']
  },
  {
    filename: 'mystore.svg',
    title: 'MyStore Shopping Interface',
    subtitle: 'Dynamic E-Commerce & Rating API',
    tag: 'API-based',
    themeColor: '#f59e0b',
    accentColor: '#fbbf24',
    icon: `<path d="M7 18C5.9 18 5.01 18.9 5.01 20C5.01 21.1 5.9 22 7 22C8.1 22 9 21.1 9 20C9 18.9 8.1 18 7 18ZM1 2V4H3L6.6 11.59L5.25 14.04C5.09 14.32 5 14.65 5 15C5 16.1 5.9 17 7 17H19V15H7.42C7.28 15 7.17 14.89 7.17 14.75L7.2 14.63L8.1 13H15.55C16.3 13 16.96 12.59 17.3 11.97L20.88 5.48C20.96 5.34 21 5.17 21 5C21 4.45 20.55 4 20 4H5.21L4.27 2H1ZM17 18C15.9 18 15.01 18.9 15.01 20C15.01 21.1 15.9 22 17 22C18.1 22 19 21.1 19 20C19 18.9 18.1 18 17 18Z" fill="#f59e0b"/>`,
    details: ['Live Instant Search & Price Filters', 'Interactive 5-Star Rating Feedback', 'JSON Asynchronous Catalog Loader']
  },
  {
    filename: 'multistep-registration.svg',
    title: 'Multi-step Registration',
    subtitle: 'Validated Multi-Phase User Onboarding',
    tag: 'Frontend / UI',
    themeColor: '#06b6d4',
    accentColor: '#22d3ee',
    icon: `<path d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.89 20.1 3 19 3ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="#06b6d4"/>`,
    details: ['Real-Time Form Field Sanitization', 'Segmented Phase State Management', 'Visual Step Indicators & Summary']
  },
  {
    filename: 'elzero-dashboard.svg',
    title: 'Elzero Admin Dashboard',
    subtitle: 'Comprehensive Metrics & Management UI',
    tag: 'Frontend / UI',
    themeColor: '#ec4899',
    accentColor: '#f472b6',
    icon: `<path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="#ec4899"/>`,
    details: ['Live Analytical Data Charts', 'Interactive Project Progress Trackers', 'Task Management & Activity Stream']
  },
  {
    filename: 'favorites-manager.svg',
    title: 'Favorites Manager',
    subtitle: 'Browser Extension Landing & CTA',
    tag: 'Frontend / UI',
    themeColor: '#14b8a6',
    accentColor: '#2dd4bf',
    icon: `<path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" fill="#14b8a6"/>`,
    details: ['Conversion-Engineered Hero & CTAs', 'Feature Comparison Matrix', 'Fast Accessible Static Structure']
  },
  {
    filename: 'blog-project.svg',
    title: 'Blog Project',
    subtitle: 'Fast Publishing & Content Taxonomy',
    tag: 'Full-Stack / Backend',
    themeColor: '#6366f1',
    accentColor: '#818cf8',
    icon: `<path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM14 17H7V15H14V17ZM17 13H7V11H17V13ZM17 9H7V7H17V9Z" fill="#6366f1"/>`,
    details: ['Categorized Editorial Article Engine', 'Optimized UX with Instant Loading', 'Clean Authoring & Reader Workflow']
  }
];

function generateProjectSVG(p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <linearGradient id="bg_${p.filename.replace('.svg','')}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0f1d"/>
      <stop offset="60%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="bar_${p.filename.replace('.svg','')}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${p.themeColor}"/>
      <stop offset="100%" stop-color="${p.accentColor}"/>
    </linearGradient>
    <pattern id="grid_${p.filename.replace('.svg','')}" width="25" height="25" patternUnits="userSpaceOnUse">
      <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#1e293b" stroke-width="0.7"/>
    </pattern>
    <filter id="glow_${p.filename.replace('.svg','')}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="800" height="500" rx="16" fill="url(#bg_${p.filename.replace('.svg','')})"/>
  <rect width="800" height="500" rx="16" fill="url(#grid_${p.filename.replace('.svg','')})" opacity="0.4"/>

  <!-- Top Window Header Bar -->
  <rect x="0" y="0" width="800" height="48" rx="16" fill="#0f172a" opacity="0.8"/>
  <rect x="0" y="32" width="800" height="16" fill="#0f172a" opacity="0.8"/>
  <circle cx="28" cy="24" r="6" fill="#ef4444"/>
  <circle cx="48" cy="24" r="6" fill="#f59e0b"/>
  <circle cx="68" cy="24" r="6" fill="#10b981"/>
  
  <text x="400" y="29" fill="#94a3b8" font-family="'JetBrains Mono', monospace" font-size="13" text-anchor="middle">portfolio@marwan ~ /projects/${p.filename.replace('.svg','')}</text>

  <!-- Ambient Glow in Center -->
  <circle cx="400" cy="270" r="140" fill="${p.themeColor}" opacity="0.08" filter="url(#glow_${p.filename.replace('.svg','')})"/>

  <!-- Main Card Content Window -->
  <g transform="translate(60, 80)">
    <!-- Window Frame -->
    <rect width="680" height="360" rx="12" fill="#0d1424" stroke="#1e293b" stroke-width="1.5"/>
    
    <!-- Top accent border line -->
    <rect x="0" y="0" width="680" height="3" fill="url(#bar_${p.filename.replace('.svg','')})"/>

    <!-- Category Pill -->
    <rect x="36" y="32" width="160" height="28" rx="14" fill="${p.themeColor}" fill-opacity="0.12" stroke="${p.themeColor}" stroke-opacity="0.4"/>
    <text x="116" y="50" fill="${p.accentColor}" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="600" text-anchor="middle">${p.tag.toUpperCase()}</text>

    <!-- Icon Box -->
    <rect x="580" y="32" width="56" height="56" rx="10" fill="#131d33" stroke="#25324d" stroke-width="1"/>
    <g transform="translate(596, 48) scale(1)">
      ${p.icon}
    </g>

    <!-- Project Title -->
    <text x="36" y="105" fill="#f8fafc" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="30" font-weight="700">${p.title}</text>
    
    <!-- Subtitle / Concept -->
    <text x="36" y="135" fill="#94a3b8" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="15">${p.subtitle}</text>

    <!-- Divider -->
    <line x1="36" y1="165" x2="644" y2="165" stroke="#1e293b" stroke-width="1"/>

    <!-- Key Highlights / Architecture points -->
    <g transform="translate(36, 195)">
      <circle cx="6" cy="6" r="3" fill="${p.themeColor}"/>
      <text x="22" y="10" fill="#cbd5e1" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="14">${p.details[0]}</text>
      
      <circle cx="6" cy="42" r="3" fill="${p.themeColor}"/>
      <text x="22" y="46" fill="#cbd5e1" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="14">${p.details[1]}</text>
      
      <circle cx="6" cy="78" r="3" fill="${p.themeColor}"/>
      <text x="22" y="82" fill="#cbd5e1" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="14">${p.details[2]}</text>
    </g>

    <!-- Interactive Badge Bottom -->
    <rect x="36" y="305" width="130" height="30" rx="6" fill="#1e293b" stroke="#334155"/>
    <text x="101" y="324" fill="#38bdf8" font-family="'JetBrains Mono', monospace" font-size="12" text-anchor="middle">&lt;code /&gt; Preview</text>
  </g>
</svg>`;
}

// Generate all projects
projects.forEach(p => {
  const filePath = path.join(__dirname, 'assets', 'projects', p.filename);
  fs.writeFileSync(filePath, generateProjectSVG(p), 'utf8');
  console.log('Created project SVG:', p.filename);
});

// Generate Certificate SVG
const certSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620" width="100%" height="100%">
  <defs>
    <linearGradient id="certBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a101f"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#050814"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00f0ff"/>
      <stop offset="50%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>

  <!-- Border & Canvas -->
  <rect width="900" height="620" rx="16" fill="url(#certBg)"/>
  <rect x="24" y="24" width="852" height="572" rx="12" fill="none" stroke="url(#gold)" stroke-width="2" opacity="0.8"/>
  <rect x="34" y="34" width="832" height="552" rx="8" fill="none" stroke="#1e293b" stroke-width="1"/>

  <!-- Corner Decors -->
  <circle cx="50" cy="50" r="6" fill="#00f0ff"/>
  <circle cx="850" cy="50" r="6" fill="#00f0ff"/>
  <circle cx="50" cy="570" r="6" fill="#00f0ff"/>
  <circle cx="850" cy="570" r="6" fill="#00f0ff"/>

  <!-- Header -->
  <text x="450" y="110" fill="#00f0ff" font-family="'JetBrains Mono', monospace" font-size="14" letter-spacing="4" text-anchor="middle">CERTIFICATE OF ACHIEVEMENT</text>
  <text x="450" y="180" fill="#ffffff" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="34" font-weight="800" text-anchor="middle">Work smarter with AI</text>

  <!-- Subtitle -->
  <text x="450" y="230" fill="#94a3b8" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="18" text-anchor="middle">This verifies that</text>

  <!-- Name -->
  <text x="450" y="295" fill="url(#gold)" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="38" font-weight="900" text-anchor="middle" letter-spacing="1">MARWAN BOUHAMID</text>

  <!-- Line -->
  <line x1="280" y1="320" x2="620" y2="320" stroke="#334155" stroke-width="1.5"/>

  <!-- Description -->
  <text x="450" y="365" fill="#cbd5e1" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="16" text-anchor="middle">has successfully mastered foundational AI tools, workflows, and productivity enhancement</text>
  <text x="450" y="395" fill="#94a3b8" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="15" text-anchor="middle">for modern software development and engineering solutions.</text>

  <!-- Badge Emblem -->
  <g transform="translate(450, 480)">
    <circle cx="0" cy="0" r="42" fill="#0f172a" stroke="url(#gold)" stroke-width="2"/>
    <text x="0" y="-8" fill="#00f0ff" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" text-anchor="middle">VERIFIED</text>
    <text x="0" y="14" fill="#ffffff" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">AI SKILLS</text>
  </g>

  <!-- Issuer and Date -->
  <text x="120" y="520" fill="#64748b" font-family="'JetBrains Mono', monospace" font-size="13">STATUS: ISSUED &amp; VERIFIED</text>
  <text x="780" y="520" fill="#64748b" font-family="'JetBrains Mono', monospace" font-size="13" text-anchor="end">YEAR: 2025</text>
</svg>`;

fs.writeFileSync(path.join(__dirname, 'assets', 'certificates', 'work-smarter-with-ai.svg'), certSVG, 'utf8');
console.log('Created certificate SVG');

// Generate placeholder PDF for CV
const cvNote = `%PDF-1.4
% Marwan Bouhamid - Full-Stack Web Developer CV Placeholder
% TODO: Replace with real Marwan_Bouhamid_CV.pdf when provided
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 120 >>
stream
BT
/F1 20 Tf
100 700 Td
(Marwan Bouhamid - Full-Stack Web Developer CV) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000109 00000 n 
0000000160 00000 n 
0000000219 00000 n 
0000000336 00000 n 
0000000508 00000 n 
trailer
<< /Root 1 0 R /Size 6 >>
startxref
577
%%EOF`;

fs.writeFileSync(path.join(__dirname, 'assets', 'Marwan_Bouhamid_CV.pdf'), cvNote, 'utf8');
console.log('Created placeholder CV PDF');
