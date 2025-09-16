
import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'default';
}

const Loader: React.FC<LoaderProps> = ({ size = 'default' }) => {
  const sizeClasses = size === 'sm' 
    ? 'h-5 w-5 border-b-2' 
    : 'h-6 w-6 border-b-2';

  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full border-white ${sizeClasses}`}></div>
    </div>
  );
};

export default Loader;
