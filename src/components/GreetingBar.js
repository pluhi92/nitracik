import React from "react";
import { useUser } from '../contexts/UserContext';

const GreetingBar = () => {
  const { user } = useUser();

  if (!user.isLoggedIn) {
    return null;
  }

  return (
    <div
      className={`
        w-full px-5 py-2 text-[12px] font-medium flex justify-center
        bg-background text-text transition-colors duration-300 z-[998]
        dark:bg-background dark:text-text
      `}
    >
      <div
        className={`
          max-w-[1200px] w-full flex items-center justify-end
          lg:justify-end md:justify-center
        `}
      >
        <span className="text-[12px] md:text-[11px] sm:text-[10px] text-gray-700 dark:text-gray-300">
          Hello,{" "}
          <strong className="text-secondary-600 font-bold">
            {user.firstName || "User"}
          </strong>
          !
        </span>
      </div>
    </div>
  );
};

export default GreetingBar;
