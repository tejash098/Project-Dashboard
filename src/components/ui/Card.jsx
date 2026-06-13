import { ROUNDED, TRANSITION, BORDER } from "../../config/constants";

const Card = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-surface border ${BORDER.DEFAULT}
        ${ROUNDED.LG} p-5 ${TRANSITION.COLORS_SLOW} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
