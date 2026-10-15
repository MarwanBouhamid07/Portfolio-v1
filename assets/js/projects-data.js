/**
 * Projects Data Source
 * STRICT RULE: Using ONLY the 9 verified projects and exact descriptions.
 * Placeholder links: '#' with TODO comments. Empty links will hide the button per specification.
 */
const projectsData = [
  {
    id: "edumanager",
    title: "EduManager",
    category: "fullstack",
    categoryLabel: "Full-Stack / Backend",
    featured: true,
    image: "assets/projects/edumanager.svg",
    fallbackImage: "assets/projects/edumanager.jpg",
    description: "School management system to digitize school operations: student data organization, attendance tracking, better administrative efficiency.",
    detailedOverview: "EduManager addresses the daily challenges of educational administration by centralizing student profiles, tracking daily classroom attendance, and streamlining administrative record-keeping into a single structured web interface.",
    // Placeholder links - TODO: Add live demo and github repo URLs when available
    liveDemoUrl: "#",
    githubUrl: "#"
  },
  {
    id: "khidmati",
    title: "Khidmati Al-Raqmiya",
    category: "fullstack",
    categoryLabel: "Full-Stack / Backend",
    featured: true,
    image: "assets/projects/khidmati.svg",
    fallbackImage: "assets/projects/khidmati.jpg",
    description: "Arabic professional-services platform connecting users with local craftsmen via search categories and direct WhatsApp integration.",
    detailedOverview: "Khidmati Al-Raqmiya bridges local service providers and Moroccan clients. It features searchable trade categories and one-touch WhatsApp communication for rapid quotation and booking.",
    // Placeholder links - TODO: Add live demo and github repo URLs when available
    liveDemoUrl: "#",
    githubUrl: "#"
  },
  {
    id: "dark-neumorphic-calculator",
    title: "Dark-theme Neumorphic Calculator",
    category: "frontend",
    categoryLabel: "Frontend / UI",
    featured: false,
    image: "assets/projects/dark-neumorphic-calculator.svg",
    fallbackImage: "assets/projects/dark-neumorphic-calculator.jpg",
    description: "Modern web calculator using neumorphic design and JavaScript logic for accurate calculations.",
    detailedOverview: "Built with soft dark shadows, dual-tone light elevations, and precise JavaScript arithmetic logic handling decimal sequences, negative numbers, and standard algebraic operations.",
    // Placeholder links - TODO: Add live demo and github repo URLs when available
    liveDemoUrl: "#",
    githubUrl: "#"
  },
  {
    id: "weather-dashboard",
    title: "Weather Dashboard",
    category: "api",
    categoryLabel: "API-based",
    featured: true,
    image: "assets/projects/weather-dashboard.svg",
    fallbackImage: "assets/projects/weather-dashboard.jpg",
    description: "Real-time dashboard using the OpenWeatherMap API showing temperature, wind speed and pressure on an interactive map.",
    detailedOverview: "Communicates asynchronously with the OpenWeatherMap API to display live meteorological readings, including temperature, humidity, atmospheric pressure, and interactive geographical coordinates.",
    // Placeholder links - TODO: Add live demo and github repo URLs when available
    liveDemoUrl: "#",
    githubUrl: "#"
  },
  {
    id: "mystore-shopping",
    title: "MyStore Shopping Interface",
    category: "api",
    categoryLabel: "API-based",
    featured: false,
    image: "assets/projects/mystore.svg",
    fallbackImage: "assets/projects/mystore.jpg",
    description: "Functional e-commerce UI with dynamic product filtering, search, and an interactive star-rating system via a JSON API.",
    detailedOverview: "A client-side shopping catalog driven by a JSON API. Users can search products in real time, filter by price and category, and evaluate customer feedback with an interactive star-rating system.",
    // Placeholder links - TODO: Add live demo and github repo URLs when available
    liveDemoUrl: "#",
    githubUrl: "#"
  },
  {
    id: "multistep-registration",
    title: "Multi-step Registration Form",
    category: "frontend",
    categoryLabel: "Frontend / UI",
    featured: false,
    image: "assets/projects/multistep-registration.svg",
    fallbackImage: "assets/projects/multistep-registration.jpg",
    description: "Multi-step form with state management and real-time data validation.",
    detailedOverview: "Guides users through segmented registration phases with persistent client-side state, step progress indicators, and instant field-level validation feedback.",
    // Placeholder links - TODO: Add live demo and github repo URLs when available
    liveDemoUrl: "#",
    githubUrl: "#"
  },
  {
    id: "elzero-dashboard",
    title: "Elzero Admin Dashboard",
    category: "frontend",
    categoryLabel: "Frontend / UI",
    featured: false,
    image: "assets/projects/elzero-dashboard.svg",
    fallbackImage: "assets/projects/elzero-dashboard.jpg",
    description: "Complete admin panel with interactive widgets, progress bars and data visualization tools.",
    detailedOverview: "An enterprise-style admin dashboard featuring interactive analytical widgets, task management checklists, visual progress metrics, and responsive navigation layouts.",
    // Placeholder links - TODO: Add live demo and github repo URLs when available
    liveDemoUrl: "#",
    githubUrl: "#"
  },
  {
    id: "favorites-manager",
    title: "Favorites Manager Landing Page",
    category: "frontend",
    categoryLabel: "Frontend / UI",
    featured: false,
    image: "assets/projects/favorites-manager.svg",
    fallbackImage: "assets/projects/favorites-manager.jpg",
    description: "Clean landing page for a browser extension with optimized call-to-action sections.",
    detailedOverview: "Structured conversion-focused product landing page highlighting browser extension features, benefits, FAQ sections, and prominent installation action points.",
    // Placeholder links - TODO: Add live demo and github repo URLs when available
    liveDemoUrl: "#",
    githubUrl: "#"
  },
  {
    id: "blog-project",
    title: "Blog Project",
    category: "fullstack",
    categoryLabel: "Full-Stack / Backend",
    featured: false,
    image: "assets/projects/blog-project.svg",
    fallbackImage: "assets/projects/blog-project.jpg",
    description: "Content creation and management platform where users publish and categorize articles, focused on speed and UX.",
    detailedOverview: "A publishing web application engineered for rapid article authoring, taxonomy categorization, reader search, and fast content delivery.",
    // Placeholder links - TODO: Add live demo and github repo URLs when available
    liveDemoUrl: "#",
    githubUrl: "#"
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = projectsData;
} else {
  window.portfolioProjects = projectsData;
}
