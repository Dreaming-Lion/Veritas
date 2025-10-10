// src/components/auth/AuthDialogProvider.tsx
import React from "react";
import LoginSignupModal from "../../pages/LoginModal";

type Tab = "login" | "signup";

type Ctx = {
  open: (tab?: Tab) => void;
  close: () => void;
  isOpen: boolean;
  currentTab: Tab;
};

const AuthDialogContext = React.createContext<Ctx | null>(null);

export const AuthDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentTab, setCurrentTab] = React.useState<Tab>("login");

  const open = React.useCallback((tab: Tab = "login") => {
    setCurrentTab(tab);
    setIsOpen(true);
  }, []);

  const close = React.useCallback(() => setIsOpen(false), []);

  const value = React.useMemo(() => ({ open, close, isOpen, currentTab }), [open, close, isOpen, currentTab]);

  return (
    <AuthDialogContext.Provider value={value}>
      {children}
      <LoginSignupModal open={isOpen} onClose={close} initialTab={currentTab} />
    </AuthDialogContext.Provider>
  );
};

export const useAuthDialog = () => {
  const ctx = React.useContext(AuthDialogContext);
  if (!ctx) throw new Error("useAuthDialog must be used within AuthDialogProvider");
  return ctx;
};
