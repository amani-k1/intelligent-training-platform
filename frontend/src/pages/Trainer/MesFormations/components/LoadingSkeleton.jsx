// src/pages/Trainer/MesFormations/components/LoadingSkeleton.jsx
import React from 'react';

export const LoadingSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl h-[450px] border border-slate-100 dark:border-slate-700">
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-t-3xl"></div>
          <div className="p-6 space-y-4">
             <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
             <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
             <div className="grid grid-cols-2 gap-4 py-4">
                <div className="h-10 bg-slate-50 dark:bg-slate-900 rounded"></div>
                <div className="h-10 bg-slate-50 dark:bg-slate-900 rounded"></div>
             </div>
             <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full w-full"></div>
             <div className="h-12 bg-slate-50 dark:bg-slate-900 rounded-xl w-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
