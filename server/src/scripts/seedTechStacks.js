import mongoose from "mongoose";
import connectDB from "../config/db.js";
import TechStack from "../models/TechStack.js";
import { generate16DigitId } from "../utils/generateId.js";

/**
 * Predefined tech-stack catalog (~92 entries) spanning every picker category.
 * Each entry is `{ name, category }`; a `list_id` is generated at insert time.
 */
const TECH_STACKS = [
  // ── frontend ──
  { name: "React", category: "frontend" },
  { name: "Vue", category: "frontend" },
  { name: "Angular", category: "frontend" },
  { name: "Svelte", category: "frontend" },
  { name: "SvelteKit", category: "frontend" },
  { name: "Next.js", category: "frontend" },
  { name: "Nuxt", category: "frontend" },
  { name: "SolidJS", category: "frontend" },
  { name: "Astro", category: "frontend" },
  { name: "Tailwind CSS", category: "frontend" },
  { name: "Redux", category: "frontend" },
  { name: "TanStack Query", category: "frontend" },
  { name: "Vite", category: "frontend" },
  { name: "TypeScript", category: "frontend" },
  { name: "JavaScript", category: "frontend" },
  { name: "HTML5", category: "frontend" },
  { name: "CSS3", category: "frontend" },

  // ── backend ──
  { name: "Node.js", category: "backend" },
  { name: "Express", category: "backend" },
  { name: "NestJS", category: "backend" },
  { name: "Django", category: "backend" },
  { name: "Flask", category: "backend" },
  { name: "FastAPI", category: "backend" },
  { name: "Spring Boot", category: "backend" },
  { name: "Ruby on Rails", category: "backend" },
  { name: "Laravel", category: "backend" },
  { name: "ASP.NET Core", category: "backend" },
  { name: "GraphQL", category: "backend" },
  { name: "gRPC", category: "backend" },
  { name: "Go", category: "backend" },
  { name: "Rust", category: "backend" },

  // ── fullstack ──
  { name: "MERN", category: "fullstack" },
  { name: "MEAN", category: "fullstack" },
  { name: "T3 Stack", category: "fullstack" },
  { name: "Remix", category: "fullstack" },
  { name: "RedwoodJS", category: "fullstack" },
  { name: "Blitz.js", category: "fullstack" },
  { name: "Meteor", category: "fullstack" },
  { name: "Phoenix", category: "fullstack" },

  // ── cloud ──
  { name: "AWS", category: "cloud" },
  { name: "Azure", category: "cloud" },
  { name: "Google Cloud", category: "cloud" },
  { name: "Vercel", category: "cloud" },
  { name: "Netlify", category: "cloud" },
  { name: "Docker", category: "cloud" },
  { name: "Kubernetes", category: "cloud" },
  { name: "Terraform", category: "cloud" },
  { name: "Cloudflare", category: "cloud" },
  { name: "Heroku", category: "cloud" },
  { name: "DigitalOcean", category: "cloud" },
  { name: "Firebase", category: "cloud" },
  { name: "Supabase", category: "cloud" },
  { name: "Render", category: "cloud" },

  // ── AI ──
  { name: "OpenAI API", category: "AI" },
  { name: "Anthropic Claude", category: "AI" },
  { name: "LangChain", category: "AI" },
  { name: "Hugging Face", category: "AI" },
  { name: "PyTorch", category: "AI" },
  { name: "TensorFlow", category: "AI" },
  { name: "scikit-learn", category: "AI" },
  { name: "Pandas", category: "AI" },
  { name: "NumPy", category: "AI" },
  { name: "Ollama", category: "AI" },
  { name: "Pinecone", category: "AI" },
  { name: "LlamaIndex", category: "AI" },

  // ── cybersec ──
  { name: "OWASP ZAP", category: "cybersec" },
  { name: "Burp Suite", category: "cybersec" },
  { name: "Metasploit", category: "cybersec" },
  { name: "Nmap", category: "cybersec" },
  { name: "Wireshark", category: "cybersec" },
  { name: "Snyk", category: "cybersec" },
  { name: "HashiCorp Vault", category: "cybersec" },
  { name: "JWT", category: "cybersec" },
  { name: "OAuth2", category: "cybersec" },
  { name: "bcrypt", category: "cybersec" },

  // ── testing ──
  { name: "Jest", category: "testing" },
  { name: "Vitest", category: "testing" },
  { name: "Mocha", category: "testing" },
  { name: "Cypress", category: "testing" },
  { name: "Playwright", category: "testing" },
  { name: "Testing Library", category: "testing" },
  { name: "Selenium", category: "testing" },
  { name: "Supertest", category: "testing" },
  { name: "Postman", category: "testing" },
  { name: "k6", category: "testing" },
  { name: "Pytest", category: "testing" },
  { name: "JUnit", category: "testing" },

  // ── others ──
  { name: "Git", category: "others" },
  { name: "GitHub Actions", category: "others" },
  { name: "Jira", category: "others" },
  { name: "Figma", category: "others" },
  { name: "Storybook", category: "others" },
  { name: "Webpack", category: "others" },
];

/**
 * Idempotently seed the tech-stack catalog. Connects to the DB, inserts the
 * predefined list only when the collection is empty, then disconnects. Safe to
 * run repeatedly — re-runs after the first are a no-op.
 * @returns {Promise<void>}
 */
const seedTechStacks = async () => {
  await connectDB();

  const existing = await TechStack.countDocuments();
  if (existing > 0) {
    console.log(`[seed:techstacks] already seeded (${existing}); inserted none`);
    await mongoose.disconnect();
    return;
  }

  const docs = TECH_STACKS.map((t) => ({ ...t, list_id: generate16DigitId() }));
  await TechStack.insertMany(docs);
  console.log(`[seed:techstacks] inserted ${docs.length} tech entries`);

  await mongoose.disconnect();
};

seedTechStacks()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed:techstacks] failed:", err);
    process.exit(1);
  });
