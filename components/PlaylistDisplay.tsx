import React from 'react';
import { Playlist, Song } from '../types';
import { UserIcon, UsersIcon, MusicNoteIcon } from './icons';

interface PlaylistDisplayProps {
  playlist: Playlist;
}

const getSourceTag = (source: Song['source']) => {
  switch (source) {
    case 'Listener 1':
      return {
        label: 'Listener 1',
        icon: <UserIcon className="w-4 h-4 text-cyan-400" />,
        color: 'bg-cyan-900/50 text-cyan-300 border-cyan-700/50',
      };
    case 'Listener 2':
      return {
        label: 'Listener 2',
        icon: <UserIcon className="w-4 h-4 text-blue-400" />,
        color: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
      };
    case 'Both':
      return {
        label: 'Both',
        icon: <UsersIcon className="w-4 h-4 text-indigo-400" />,
        color: 'bg-indigo-900/50 text-indigo-300 border-indigo-700/50',
      };
    default:
      return {
        label: '',
        icon: null,
        color: 'bg-zinc-800 text-gray-300',
      };
  }
};

const PlaylistDisplay: React.FC<PlaylistDisplayProps> = ({ playlist }) => {
  return (
    <div className="bg-zinc-900/50 rounded-2xl shadow-lg shadow-blue-500/20 p-6 border border-blue-800/30">
      <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
        {playlist.playlistName}
      </h2>
      <ul className="space-y-3">
        {playlist.songs.map((song, index) => {
          const tag = getSourceTag(song.source);
          return (
            <li
              key={index}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4 bg-zinc-800/50 rounded-lg hover:bg-blue-950/40 transition-colors duration-200"
            >
              <div className="flex items-center gap-4 flex-grow">
                <MusicNoteIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div>
                    <p className="font-semibold text-white">{song.title}</p>
                    <p className="text-sm text-gray-400">{song.artist}</p>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${tag.color} flex-shrink-0`}>
                {tag.icon}
                {tag.label}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PlaylistDisplay;