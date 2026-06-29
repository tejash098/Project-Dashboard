import LaunchIcon from "@mui/icons-material/Launch";
import DownloadIcon from "@mui/icons-material/Download";
import PageLayout from "../layouts/PageLayout";
import Card from "../components/ui/Card";
// Bundled certificate PDFs — Vite resolves each to a served asset URL.
import nbpdclCert from "../assets/NBPDCL_cert.pdf";
import btechCert from "../assets/BTECH_cert.pdf";
import class12Cert from "../assets/CLASS12_cert.pdf";
import class10Cert from "../assets/CLASS10_cert.pdf";
// Bundled résumé — downloaded by the header "Download CV" button.
import tejashCV from "../assets/Tejash_CV.pdf";
import { cloudinary, CLOUDINARY_ASSETS } from "../config/cloudinary";
import {
  GRID,
  SPACING,
  TYPOGRAPHY,
  ROUNDED,
  BORDER,
  A11Y,
  ICON_SIZE,
} from "../config/constants";

/** Cloudinary transform applied to every logo for a small, optimized asset. */
const LOGO_TX = "f_auto,q_auto,w_96,h_96,c_fit";

/** Build a transformed Cloudinary logo URL from a hosted asset's path. */
const logo = (versionPath) => cloudinary(versionPath, LOGO_TX);

/** Google Drive logo shown next to certificates that link to a Drive copy. */
const DRIVE_LOGO = cloudinary(CLOUDINARY_ASSETS.driveLogo);

/** Bold first-person greeting that opens the career objective. */
const GREETING = "Hi there, I'm Tejash Kumar Singh.";

/** Short, punchy career objective shown at the top of the page. */
const CAREER_OBJECTIVE =
  "I am into full-stack development, interested in the MERN stack and cloud " +
  "integrations. I build responsive React interfaces, reliable Express/MongoDB " +
  "APIs, and serverless workflows on Azure Functions that connect third-party " +
  "apps through OAuth2, queues, and Redis. A fast learner who writes clean, " +
  "maintainable code and enjoys turning real problems into working products.";

/**
 * Education history, newest first. Each entry renders one card with the
 * institution logo, qualification, the year + score, and certificate links.
 * `url` is a bundled PDF opened by the View button; `driveUrl` adds a Google
 * Drive icon-link beside it.
 * @type {Array<{ id: number, degree: string, institute: string, board: string, year: string, score: string, logo: string, url: string, driveUrl: string }>}
 */
const EDUCATION = [
  {
    id: 1,
    degree: "B.Tech — Computer Science & Engineering",
    institute: "SMIT, Sikkim",
    board: "Sikkim Manipal University",
    year: "2025",
    score: "7.5 CGPA",
    logo: logo(CLOUDINARY_ASSETS.smitLogo),
    url: btechCert, // bundled PDF → opened by the View button
    driveUrl:
      "https://drive.google.com/file/d/17NpWHszl7qDZDWH9_zt3DdK7dlvLP8tB/view?usp=drive_link",
  },
  {
    id: 2,
    degree: "Class XII (CBSE)",
    institute: "The Aryan International School",
    board: "CBSE",
    year: "2021",
    score: "90%",
    logo: logo(CLOUDINARY_ASSETS.aryanLogo),
    url: class12Cert, // bundled PDF → opened by the View button
    driveUrl:
      "https://drive.google.com/file/d/1xB4dWYE5_9g0MWozwszFYX6weyghUTtp/view?usp=drive_link",
  },
  {
    id: 3,
    degree: "Class X (CBSE)",
    institute: "The Aryan International School",
    board: "CBSE",
    year: "2019",
    score: "89.2%",
    logo: logo(CLOUDINARY_ASSETS.aryanLogo),
    url: class10Cert, // bundled PDF → opened by the View button
    driveUrl:
      "https://drive.google.com/file/d/1V0fUI6FRUmgYWwJB8ifTyDVS7Y8A3Ws9/view?usp=sharing",
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
    logo: logo(CLOUDINARY_ASSETS.projetlyLogo),
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
    logo: logo(CLOUDINARY_ASSETS.nbpdclLogo),
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
 * Action row for a qualification/certificate: a primary "View" link (bundled
 * PDF or external URL) plus an optional Google Drive icon-link. The View control
 * renders as a disabled placeholder until a `url` is supplied. Shared by the
 * Education and Certifications sections.
 * @param {Object} props
 * @param {string} props.url - PDF/external URL for View; empty string => disabled.
 * @param {string} [props.driveUrl] - Optional Google Drive copy of the document.
 * @param {string} props.label - Accessible name used in the Drive link aria-label.
 */
const CertActions = ({ url, driveUrl, label }) => (
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
        aria-label={`Open ${label} in Google Drive`}
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
      actions={
        // Downloads the bundled résumé directly (download attr forces a save).
        // Styled to match the docs "Copy page" button (outlined, accent hover).
        <a
          href={tejashCV}
          download="Tejash_CV.pdf"
          className={`inline-flex items-center gap-1.5 ${ROUNDED.MD} border ${BORDER.DEFAULT}
            px-3 py-1.5 ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary
            hover:bg-accent-subtle hover:text-accent ${A11Y.FOCUS_RING}`}
        >
          <DownloadIcon sx={{ fontSize: ICON_SIZE.SM }} />
          Download CV
        </a>
      }
    >
      {/* ── Career objective ── */}
      <section>
        <Card>
          <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary leading-relaxed`}>
            {/* Bold greeting leads into the objective copy. */}
            <strong className={`${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary`}>
              {GREETING}
            </strong>{" "}
            {CAREER_OBJECTIVE}
          </p>
        </Card>
      </section>

      {/* ── Education — one logo card per qualification ── */}
      <section className="mt-10">
        <SectionHeading>Education</SectionHeading>
        <div className={`${GRID.STATS} ${SPACING.GAP_4}`}>
          {EDUCATION.map(({ id, degree, institute, board, year, score, logo: src, url, driveUrl }) => (
            <Card key={id} className="h-full">
              {/* Full-height column so the actions pin to the card bottom. */}
              <div className="flex h-full flex-col">
                <div className="flex items-start gap-3 mb-2">
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
                {/* Certificate actions pinned to the card bottom, above a divider. */}
                <div className="mt-auto pt-3 border-t border-border">
                  <CertActions url={url} driveUrl={driveUrl} label={degree} />
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
                <CertActions url={url} driveUrl={driveUrl} label={title} />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </PageLayout>
  );
};

export default About;
