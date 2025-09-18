import React from 'react';
import { MusicNoteIcon } from './icons';

interface LoaderProps {
  size?: 'sm' | 'default';
}

const Loader: React.FC<LoaderProps> = ({ size = 'default' }) => {
  const sizeClasses = size === 'sm' 
    ? 'h-6 w-6' 
    : 'h-8 w-8';

  return (
    <div className="flex justify-center items-center">
      <MusicNoteIcon className={`animate-spin text-white ${sizeClasses}`} />
    </div>
  );
};

export default Loader;