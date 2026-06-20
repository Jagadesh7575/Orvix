export const pageFade = {
  hidden: { opacity: 0, y: 5 },
  show: { opacity: 1, y: 0, transition: { duration: 0.15, ease: "easeOut" } }
};

export const listContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0
    }
  }
};

export const listItem = {
  hidden: { opacity: 0, y: 5 },
  show: { opacity: 1, y: 0, transition: { duration: 0.15, ease: "easeOut" } }
};

export const bottomSheet = {
  hidden: { opacity: 0, y: 40, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 25, stiffness: 200 } },
  exit: { opacity: 0, y: 30, scale: 0.98, transition: { duration: 0.15, ease: "easeIn" } }
};

export const chatBubbleEntry = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.15, ease: "easeOut" } }
};
