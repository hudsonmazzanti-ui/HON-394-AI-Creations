
import React from 'react';
import { Playlist, Song } from '../types';
import { UserIcon, UsersIcon, MusicNoteIcon, SpotifyIcon } from './icons';
import Loader from './Loader';

interface PlaylistDisplayProps {
  playlist: Playlist;
  onExport: () => void;
  isExporting: boolean;
  exportSuccessUrl: string | null;
  exportError: string | null;
}

const getSourceTag = (source: Song['source']) => {
  switch (source) {
    case 'User 1':
      return {
        label: 'User 1',
        icon: <UserIcon className="w-4 h-4 text-cyan-400" />,
        color: 'bg-cyan-900/50 text-cyan-300 border-cyan-700/50',
      };
    case 'User 2':
      return {
        label: 'User 2',
        icon: <UserIcon className="w-4 h-4 text-fuchsia-400" />,
        color: 'bg-fuchsia-900/50 text-fuchsia-300 border-fuchsia-700/50',
      };
    case 'Both':
      return {
        label: 'Both',
        icon: <UsersIcon className="w-4 h-4 text-green-400" />,
        color: 'bg-green-900/50 text-green-300 border-green-700/50',
      };
    default:
      return {
        label: '',
        icon: null,
        color: 'bg-slate-700 text-slate-300',
      };
  }
};

const PlaylistDisplay: React.FC<PlaylistDisplayProps> = ({ playlist, onExport, isExporting, exportSuccessUrl, exportError }) => {
  return (
    <>
      <div className="bg-slate-800/50 rounded-2xl shadow-lg p-6 border border-slate-700">
        <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-transparent bg-clip-text">
          {playlist.playlistName}
        </h2>
        <ul className="space-y-3">
          {playlist.songs.map((song, index) => {
            const tag = getSourceTag(song.source);
            return (
              <li
                key={index}
                className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors duration-200"
              >
                <div className="flex items-center gap-4">
                  <MusicNoteIcon className="w-5 h-5 text-slate-400" />
                  <div>
                      <p className="font-semibold text-white">{song.title}</p>
                      <p className="text-sm text-slate-400">{song.artist}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${tag.color}`}>
                  {tag.icon}
                  {tag.label}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-8 text-center bg-slate-800/50 rounded-2xl shadow-lg p-6 border border-slate-700">
        <h3 className="text-2xl font-bold mb-4">Export Playlist</h3>
        
        {exportSuccessUrl ? (
           <div className="space-y-4">
            <p className="text-green-400">Playlist successfully created on Spotify!</p>
             <a
              href={exportSuccessUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 text-white font-bold py-3 px-8 rounded-full hover:bg-green-400 transition-transform transform hover:scale-105 shadow-lg shadow-green-500/20"
            >
              <SpotifyIcon className="w-6 h-6" />
              Open in Spotify
            </a>
           </div>
        ) : (
            <button
                onClick={onExport}
                disabled={isExporting}
                className="inline-flex items-center justify-center gap-2 bg-[#1DB954] text-white font-bold py-3 px-8 rounded-full hover:bg-[#1ED760] disabled:bg-slate-600 disabled:cursor-not-allowed transition-transform transform hover:scale-105 shadow-lg shadow-green-500/20"
            >
                {isExporting ? (
                    <>
                        <Loader size="sm" />
                        <span>Exporting...</span>
                    </>
                ) : (
                    <>
                        <SpotifyIcon className="w-6 h-6" />
                        <span>Export to Spotify</span>
                    </>
                )}
            </button>
        )}

        {exportError && (
            <p className="mt-4 text-red-400 bg-red-900/50 border border-red-700 rounded-md p-3">
                {exportError}
            </p>
        )}
      </div>
    </>
  );
};

export default PlaylistDisplay;
