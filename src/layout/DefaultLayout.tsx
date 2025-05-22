import React, { useState, ReactNode, useEffect } from "react";
import axios from "axios";

const DefaultLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      <main>
        <div className="">{children}</div>
      </main>
    </div>
  );
};

export default DefaultLayout;
