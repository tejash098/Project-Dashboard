import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GitHubIcon from "@mui/icons-material/GitHub";
import PageLayout from "../layouts/PageLayout";
import Card from "../components/ui/Card";
import { useToast } from "../hooks/useToast";
import { postFeedback } from "../services/api/feedback";
import {
  ICON_SIZE,
  ROUNDED,
  TYPOGRAPHY,
  WIDTH,
  A11Y,
} from "../config/constants";

/** Personal contact channels rendered in the left column. */
const CONTACT_LINKS = [
  {
    id: "email",
    icon: EmailIcon,
    label: "Email",
    value: "jaitej123@gmail.com",
    href: "mailto:jaitej123@gmail.com",
    external: false,
  },
  {
    id: "phone",
    icon: PhoneIcon,
    label: "Phone",
    value: "+91 9102577699",
    href: "tel:+919102577699",
    external: false,
  },
  {
    id: "linkedin",
    icon: LinkedInIcon,
    label: "LinkedIn",
    value: "tejash-singh",
    href: "https://www.linkedin.com/in/tejash-singh-892a15233/",
    external: true,
  },
  {
    id: "github",
    icon: GitHubIcon,
    label: "GitHub",
    value: "tejash098",
    href: "https://github.com/tejash098",
    external: true,
  },
];

/** EmailJS credentials — sourced from Vite env (public client-side values). */
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/** Shared input styling — kept as a static string for the Tailwind scanner. */
const INPUT_CLASS = `${WIDTH.FULL} ${ROUNDED.MD} border border-border bg-page-bg
  px-3 py-2 ${TYPOGRAPHY.TEXT_SM} text-text-primary
  placeholder:text-text-secondary ${A11Y.FOCUS_RING}`;

/** Initial (empty) state for the contact form fields. */
const EMPTY_FORM = { title: "", name: "", email: "", phone: "", message: "" };

/**
 * Contact page. A two-column layout: the left column lists personal contact
 * channels (email, phone, LinkedIn, GitHub) and the right column holds a
 * message form that delivers submissions via EmailJS. Result feedback is shown
 * through the global toast system.
 */
const Contact = () => {
  const { addToast } = useToast();

  const [form, setForm] = useState(EMPTY_FORM);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  // Ref to the native file input so it can be cleared on reset (file inputs are
  // uncontrolled — their value can't be driven from React state).
  const imageInputRef = useRef(null);

  /**
   * Update a single form field on input change.
   * @param {React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>} e - Change event.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Track the selected image file (or clear it when the picker is dismissed).
   * @param {React.ChangeEvent<HTMLInputElement>} e - File input change event.
   */
  const handleFileChange = (e) => {
    setImage(e.target.files?.[0] ?? null);
  };

  /**
   * Persist the submission, then notify by email. First posts the fields plus
   * any selected image to the feedback API — the server uploads the image to
   * Cloudinary and stores the record, returning its `imageUrl`. That URL is then
   * forwarded to EmailJS alongside the message. On success resets the form (and
   * file input) and shows a success toast; on failure surfaces an error toast
   * and keeps the entered values so the user can retry.
   * @param {React.FormEvent} e - The form submit event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guard against a missing/misconfigured .env so the failure is obvious.
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      console.error("[Contact] EmailJS env vars are not configured.");
      addToast({ type: "error", message: "Email service is not configured." });
      return;
    }

    setLoading(true);
    try {
      // Send as multipart so the optional image rides along as a real file.
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("message", form.message);
      if (image) formData.append("image", image);

      // Persist + upload first so EmailJS can carry the resulting Cloudinary URL.
      const saved = await postFeedback(formData);

      // Template variable names must match those defined in the EmailJS template.
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_title: form.title,
          from_name: form.name,
          from_email: form.email,
          from_phone: form.phone,
          message: form.message,
          image_url: saved?.imageUrl ?? "",
        },
        { publicKey: EMAILJS_PUBLIC_KEY },
      );

      addToast({ type: "success", message: "Message sent — thank you!" });
      // Clear so the next message starts fresh — including the file input.
      setForm(EMPTY_FORM);
      setImage(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
    } catch (err) {
      const message = err?.text || err?.message || "Failed to send message.";
      console.warn(`[Contact] send failed: ${message}`);
      addToast({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Contact"
      subtitle="Get in touch — I'd love to hear from you"
    >
      {/* ── Two columns: contact details (left) + message form (right) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ── Left — heading, description, and contact channels ── */}
        <div>
          <h2
            className={`${TYPOGRAPHY.TEXT_2XL} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary`}
          >
            Let's connect!
          </h2>
          <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mt-2`}>
            Have a question, an opportunity, or just want to say hello? Use the
            form to send me a message, or reach me directly through any of the
            channels below.
          </p>

          {/* Contact rows — each is a link (mailto / tel / external profile). */}
          <ul className="flex flex-col gap-4 mt-8">
            {CONTACT_LINKS.map(({ id, icon: Icon, label, value, href, external }) => (
              <li key={id}>
                <a
                  href={href}
                  // External profiles open in a new tab safely.
                  {...(external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="flex items-center gap-3 group"
                >
                  <span
                    className={`flex items-center justify-center ${ROUNDED.MD}
                      bg-accent-subtle text-accent p-2 transition-colors duration-200`}
                  >
                    <Icon sx={{ fontSize: ICON_SIZE.MD }} />
                  </span>
                  <span className="flex flex-col">
                    <span className={`${TYPOGRAPHY.TEXT_XS} text-text-secondary`}>
                      {label}
                    </span>
                    <span
                      className={`${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM}
                        text-text-primary group-hover:text-accent transition-colors duration-200`}
                    >
                      {value}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Right — message form inside a Card ── */}
        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Title — short subject; shown in the admin Report list. */}
            <label className="flex flex-col gap-1">
              <span className={`${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary`}>
                Title
              </span>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className={INPUT_CLASS}
                placeholder="What's this about?"
              />
            </label>

            {/* Name */}
            <label className="flex flex-col gap-1">
              <span className={`${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary`}>
                Name
              </span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
                className={INPUT_CLASS}
                placeholder="Your name"
              />
            </label>

            {/* Email */}
            <label className="flex flex-col gap-1">
              <span className={`${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary`}>
                Email
              </span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className={INPUT_CLASS}
                placeholder="you@example.com"
              />
            </label>

            {/* Phone */}
            <label className="flex flex-col gap-1">
              <span className={`${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary`}>
                Phone number
              </span>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
                className={INPUT_CLASS}
                placeholder="Optional"
              />
            </label>

            {/* Message */}
            <label className="flex flex-col gap-1">
              <span className={`${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary`}>
                Message
              </span>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={5}
                className={`${INPUT_CLASS} resize-y`}
                placeholder="How can I help?"
              />
            </label>

            {/* Image — optional; uploaded to Cloudinary by the server on submit. */}
            <label className="flex flex-col gap-1">
              <span className={`${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary`}>
                Image (optional)
              </span>
              <input
                type="file"
                name="image"
                accept="image/*"
                ref={imageInputRef}
                onChange={handleFileChange}
                className={`${INPUT_CLASS} ${TYPOGRAPHY.TEXT_SM} text-text-secondary
                  file:mr-3 file:rounded file:border-0 file:bg-accent
                  file:px-3 file:py-1 file:text-white file:cursor-pointer`}
              />
            </label>

            {/* Submit — disabled while a request is in flight. */}
            <button
              type="submit"
              disabled={loading}
              className={`${WIDTH.FULL} ${ROUNDED.MD} bg-accent px-3 py-2
                ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM} text-white
                hover:opacity-90 disabled:opacity-60 ${A11Y.FOCUS_RING}`}
            >
              {loading ? "Sending…" : "Send Message"}
            </button>
          </form>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Contact;
