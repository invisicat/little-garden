import React from "react";
import { motion, useDragControls, useReducedMotion } from "motion/react";

type Props = {
  /** class for the panel itself — ".sheet …" or ".card" */
  className: string;
  label: string;
  onClose: () => void;
  children: React.ReactNode;
};

/**
 * A bottom sheet that drifts up on a soft spring and can be flung away with a
 * downward drag. Dragging is started only from the grip handle, so the panel's
 * own scrolling stays untouched. Backdrop tap and the panel's own buttons still
 * close it; the drag is pure sugar on top.
 *
 * Entrance/exit are owned here (via motion), so the panels no longer carry the
 * CSS `rise` animation — wrap each usage in <AnimatePresence> for the exit.
 */
export function DraggableSheet({ className, label, onClose, children }: Props) {
  const reduce = useReducedMotion();
  const controls = useDragControls();

  return (
    <motion.div
      className="sheet-backdrop"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 0.82, 0.28, 1] }}
    >
      <motion.div
        className={className}
        role="dialog"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        initial={reduce ? { opacity: 0 } : { y: "100%" }}
        animate={reduce ? { opacity: 1 } : { y: 0 }}
        exit={reduce ? { opacity: 0 } : { y: "104%" }}
        transition={{ type: "spring", stiffness: 300, damping: 33, mass: 0.9 }}
        drag={reduce ? false : "y"}
        dragControls={controls}
        dragListener={false}
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0.18, bottom: 0.9 }}
        dragSnapToOrigin
        onDragEnd={(_, info) => {
          if (info.offset.y > 130 || info.velocity.y > 720) onClose();
        }}
      >
        <div
          className="sheet__grip"
          aria-hidden="true"
          onPointerDown={(e) => {
            if (!reduce) controls.start(e);
          }}
          style={{ touchAction: "none", cursor: "grab" }}
        />
        {children}
      </motion.div>
    </motion.div>
  );
}
