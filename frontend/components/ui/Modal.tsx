"use client";

import { useEffect } from "react";

type ModalProps = {
  onClose: () => void;
  children: React.ReactNode;
};

/** Dimmed full-screen overlay. Closes on Escape or a click on the backdrop. */
export default function Modal({ onClose, children }: ModalProps) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
    >
      {/* stopPropagation: clicks inside the content shouldn't reach the backdrop and close it */}
      <div onClick={(event) => event.stopPropagation()} className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
