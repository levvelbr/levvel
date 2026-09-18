import { useEffect } from "react";

let activeLocks = 0;
let originalOverflow = "";
let originalDocumentOverflow = "";
let originalPaddingRight = "";

const getScrollbarWidth = () =>
  window.innerWidth - document.documentElement.clientWidth;

export const useBodyScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    if (!isLocked) {
      return;
    }

    if (activeLocks === 0) {
      originalOverflow = document.body.style.overflow;
      originalDocumentOverflow = document.documentElement.style.overflow;
      originalPaddingRight = document.body.style.paddingRight;

      const scrollbarWidth = getScrollbarWidth();

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    activeLocks += 1;

    return () => {
      activeLocks = Math.max(0, activeLocks - 1);

      if (activeLocks === 0) {
        document.body.style.overflow = originalOverflow;
        document.documentElement.style.overflow = originalDocumentOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      }
    };
  }, [isLocked]);
};

export default useBodyScrollLock;
