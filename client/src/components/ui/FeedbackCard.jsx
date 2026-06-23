import { Link } from "react-router-dom";
import Card from "./Card";
import StatusBadge from "./StatusBadge";
import { formatDate } from "../../lib/formatters";
import { SPACING, TYPOGRAPHY } from "../../config/constants";

/** @typedef {import("../../services/api/feedback").Feedback} Feedback */

/**
 * Card summarizing a single feedback submission, modeled on ProjectCard. The
 * whole card links to the admin detail route (`/report/:f_id`). Shows the title,
 * status pill, a clamped message preview, and the sender + date.
 *
 * @param {Object}   props
 * @param {Feedback} props.feedback - Feedback item to render.
 */
const FeedbackCard = ({ feedback }) => {
  const { f_id, title, status, name, message, createdAt } = feedback;

  return (
    <Link to={`/report/${f_id}`} className="block">
      <Card className="h-full hover:border-accent">
        {/* ── Top row — title + status pill ── */}
        <div className="flex items-start justify-between gap-3">
          <h3
            className={`${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_SEMIBOLD}
              text-text-primary line-clamp-2`}
          >
            {title}
          </h3>
          <StatusBadge status={status} />
        </div>

        {/* ── Message preview — clamped to two lines ── */}
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mt-2 line-clamp-2`}>
          {message}
        </p>

        {/* ── Sender + date ── */}
        <p className={`${TYPOGRAPHY.TEXT_XS} text-text-secondary ${SPACING.MT_2}`}>
          {name} · {formatDate(createdAt)}
        </p>
      </Card>
    </Link>
  );
};

export default FeedbackCard;
