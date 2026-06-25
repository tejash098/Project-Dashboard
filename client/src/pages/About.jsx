import LaunchIcon from "@mui/icons-material/Launch";
import PageLayout from "../layouts/PageLayout";
import Card from "../components/ui/Card";
// Bundled certificate PDF — Vite resolves this to a served asset URL.
import nbpdclCert from "../assets/NBPDCL_cert.pdf";
import {
  GRID,
  SPACING,
  TYPOGRAPHY,
  ROUNDED,
  A11Y,
  ICON_SIZE,
} from "../config/constants";

/** Cloudinary transform applied to every logo for a small, optimized asset. */
const LOGO_TX = "f_auto,q_auto,w_96,h_96,c_fit";

/** Build a transformed Cloudinary logo URL from the asset's version + path. */
const logo = (versionPath) =>
  `https://res.cloudinary.com/dh6dcstn6/image/upload/${LOGO_TX}/${versionPath}`;

/** Google Drive logo shown next to certificates that link to a Drive copy. */
const DRIVE_LOGO =
  "https://res.cloudinary.com/dh6dcstn6/image/upload/v1782410487/drive-logo_jp749f.png";

/** Short, punchy career objective shown at the top of the page. */
const CAREER_OBJECTIVE =
  "Full-stack developer specializing in the MERN stack and cloud integrations. " +
  "I build responsive React interfaces, reliable Express/MongoDB APIs, and " +
  "serverless workflows on Azure Functions that connect third-party apps through " +
  "OAuth2, queues, and Redis. A fast learner who writes clean, maintainable code " +
  "and enjoys turning real problems into working products.";

/**
 * Education history, newest first. Each entry renders one card with the
 * institution logo, qualification, and the year + score.
 * @type {Array<{ id: number, degree: string, institute: string, board: string, year: string, score: string, logo: string }>}
 */
const EDUCATION = [
  {
    id: 1,
    degree: "B.Tech — Computer Science & Engineering",
    institute: "SMIT, Sikkim",
    board: "Sikkim Manipal University",
    year: "2025",
    score: "7.5 CGPA",
    logo: logo("v1782279218/smit-logo_n2x282.png"),
  },
  {
    id: 2,
    degree: "Class XII (CBSE)",
    institute: "The Aryan International School",
    board: "CBSE",
    year: "2021",
    score: "90%",
    logo: logo("v1782279304/aryan-logo_eilbdz.png"),
  },
  {
    id: 3,
    degree: "Class X (CBSE)",
    institute: "The Aryan International School",
    board: "CBSE",
    year: "2019",
    score: "89.2%",
    logo: logo("v1782279304/aryan-logo_eilbdz.png"),
  },
];

/**
 * Work experience, newest first. Each entry renders a full-width card with the
 * company logo, role, period, and a short description of the work.
 * @type {Array<{ id: number, role: string, org: string, period: string, logo: string, description: string }>}
 */
const EXPERIENCE = [
  {
    id: 1,
    role: "Software Engineer Intern",
    org: "Projetly",
    period: "Jan 2026 – Jun 2026",
    logo: logo("v1782279918/projetly-logo_rvjbfd.png"),
    description:
      "Built serverless integration backends on Azure Functions with MongoDB, " +
      "developing third-party app connectors that authenticate via OAuth2 and " +
      "process work asynchronously using message queues and Redis. Integrated " +
      "platforms including Salesforce, Zapier, and Make to automate cross-app " +
      "data flows.",
  },
  {
    id: 2,
    role: "Web Development Intern",
    org: "NBPDCL, Patna",
    period: "Jan 2025 – May 2025",
    logo: logo("v1782279369/nbpdcl-logo_iybmae.jpg"),
    description:
      "Worked on a city-wide survey management system built with React, Express, " +
      "and MongoDB — a dashboard for collecting field survey data and managing " +
      "verification and approval workflows across city zones.",
  },
];

/**
 * Certifications. `url` activates the View button (a bundled PDF or external
 * link); leave it empty to keep the button disabled until a link exists.
 * `driveUrl` optionally adds a Google Drive icon-link beside the View button.
 * @type {Array<{ id: number, title: string, issuer: string, url: string, driveUrl?: string }>}
 */
const CERTIFICATIONS = [
  {
    id: 1,
    title: "Internship Completion Certificate — NBPDCL",
    issuer: "2025",
    url: nbpdclCert, // bundled PDF → opened by the View button
    driveUrl:
      "https://drive.google.com/file/d/1L-DmHZCmSznxEb_1EHNVI6sNEcVXAWPe/view?usp=drive_link",
  },
  {
    id: 2,
    title: "Projetly Internship Certificate",
    issuer: "2026",
    url: "",
  },
];

/** Shared section heading. */
const SectionHeading = ({ children }) => (
  <h2
    className={`${TYPOGRAPHY.TEXT_2XL} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary mb-4`}
  >
    {children}
  </h2>
);

/**
 * Logo badge — normalizes the mixed-aspect institution/company logos inside a
 * fixed, bordered box so cards stay aligned.
 * @param {Object} props
 * @param {string} props.src - Transformed logo URL.
 * @param {string} props.alt - Accessible name of the institution/company.
 */
const LogoBadge = ({ src, alt }) => (
  <img
    src={src}
    alt={alt}
    width={48}
    height={48}
    loading="lazy"
    className={`h-12 w-12 shrink-0 ${ROUNDED.MD} object-contain
      bg-page-bg border border-border p-1`}
  />
);

/**
 * About Me page — a public profile page with a career objective plus
 * Education, Experience, and Certifications sections rendered from local data.
 */
const About = () => {
  return (
    <PageLayout
      title="About Me"
      subtitle="Get to know me, my background, and my work"
    >
      {/* ── Career objective ── */}
      <section>
        <Card>
          <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary leading-relaxed`}>
            {CAREER_OBJECTIVE}
          </p>
        </Card>
      </section>

      {/* ── Education — one logo card per qualification ── */}
      <section className="mt-10">
        <SectionHeading>Education</SectionHeading>
        <div className={`${GRID.STATS} ${SPACING.GAP_4}`}>
          {EDUCATION.map(({ id, degree, institute, board, year, score, logo: src }) => (
            <Card key={id} className="h-full">
              <div className="flex items-start gap-3">
                <LogoBadge src={src} alt={institute} />
                <div className="min-w-0">
                  <h3
                    className={`${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary`}
                  >
                    {degree}
                  </h3>
                  <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mt-0.5`}>
                    {institute}
                  </p>
                  <p className={`${TYPOGRAPHY.TEXT_XS} text-text-secondary`}>
                    {board}
                  </p>
                  {/* Year + score, set apart as a muted footnote. */}
                  <p className={`${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM} text-accent mt-2`}>
                    {year} · {score}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Experience — stacked cards, newest first ── */}
      <section className="mt-10">
        <SectionHeading>Experience</SectionHeading>
        <div className="flex flex-col gap-4">
          {EXPERIENCE.map(({ id, role, org, period, logo: src, description }) => (
            <Card key={id}>
              <div className="flex items-start gap-4">
                <LogoBadge src={src} alt={org} />
                <div className="min-w-0">
                  {/* Role + org on the left, period on the right when there's room. */}
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <h3
                      className={`${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary`}
                    >
                      {role} — {org}
                    </h3>
                    <span className={`${TYPOGRAPHY.TEXT_XS} text-text-secondary`}>
                      {period}
                    </span>
                  </div>
                  <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mt-2 leading-relaxed`}>
                    {description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Certifications — each with a View link (URL added later) ── */}
      <section className="mt-10">
        <SectionHeading>Certifications</SectionHeading>
        <div className="flex flex-col gap-3">
          {CERTIFICATIONS.map(({ id, title, issuer, url, driveUrl }) => (
            <Card key={id}>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3
                    className={`${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary`}
                  >
                    {title}
                  </h3>
                  <p className={`${TYPOGRAPHY.TEXT_XS} text-text-secondary mt-0.5`}>
                    {issuer}
                  </p>
                </div>
                {/* Actions: View (PDF/link) + an optional Google Drive icon-link. */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Active link when a URL is present; disabled placeholder until then. */}
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 ${ROUNDED.MD}
                        bg-accent px-3 py-1.5 ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM}
                        text-white hover:opacity-90 ${A11Y.FOCUS_RING}`}
                    >
                      <LaunchIcon sx={{ fontSize: ICON_SIZE.SM }} />
                      View
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      title="Certificate link coming soon"
                      className={`inline-flex items-center gap-1 ${ROUNDED.MD}
                        border border-border px-3 py-1.5 ${TYPOGRAPHY.TEXT_SM}
                        ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary opacity-60
                        cursor-not-allowed`}
                    >
                      <LaunchIcon sx={{ fontSize: ICON_SIZE.SM }} />
                      View
                    </button>
                  )}
                  {/* Google Drive copy of the certificate, when available. */}
                  {driveUrl && (
                    <a
                      href={driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in Google Drive"
                      aria-label={`Open ${title} in Google Drive`}
                      className={`inline-flex items-center ${ROUNDED.MD} border border-border
                        p-1.5 hover:opacity-90 ${A11Y.FOCUS_RING}`}
                    >
                      <img
                        src={DRIVE_LOGO}
                        alt=""
                        width={ICON_SIZE.MD}
                        height={ICON_SIZE.MD}
                        loading="lazy"
                        className="object-contain"
                      />
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </PageLayout>
  );
};

export default About;
