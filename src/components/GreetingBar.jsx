import React from "react";
import { useUser } from '../contexts/UserContext';
import { useTranslation } from '../contexts/LanguageContext';

const GreetingBar = () => {
  const { user } = useUser();
  const { t } = useTranslation();

  if (!user.isLoggedIn) {
    return null;
  }

  return (
    <div
      className="w-full px-5 py-2.5 text-xs font-medium flex justify-center bg-transparent text-foreground transition-colors duration-300 z-[998]"
    >
      <div
        className="
          max-w-6xl w-full flex items-center justify-end
          lg:justify-end md:justify-center
        "
      >
        <span className="text-xs sm:text-[11px] text-neutral-500 font-medium">
          {t?.greetingBar?.hello || 'Hello'},{" "}
          <strong className="text-primary font-bold">
            {user.firstName || "User"}
          </strong>
          !
        </span>
      </div>
    </div>
  );
};

export default GreetingBar;