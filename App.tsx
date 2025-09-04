
import React, { useState, useCallback } from 'react';
import { UserPreferences, Playlist, AppStage } from './types';
import { generatePlaylist } from './services/geminiService';
import UserInput from './components/UserInput';
import PlaylistDisplay from './components/PlaylistDisplay';
import Loader from './components/Loader';
import { MusicIcon } from './components/icons';

const App: React.FC = () => {
  const [user1Prefs, setUser1Prefs] = useState<UserPreferences>({ songs: '', artists: '', genres: '' });
  const [user2Prefs, setUser2Prefs] = useState<UserPreferences>({ songs: '', artists: '', genres: '' });
  const [context, setContext] = useState('');
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<AppStage>(AppStage.INPUT);

  const handleGenerate = useCallback(async (size: 'taster' | 'full') => {
    setIsLoading(true);
    setError(null);
    setPlaylist(null);

    try {
      const result = await generatePlaylist(user1Prefs, user2Prefs, context, size);
      setPlaylist(result);
      if (size === 'taster') {
        setStage(AppStage.TASTER_RESULT);
      } else {
        setStage(AppStage.FULL_PLAYLIST);
      }
    } catch (err) {
      setError(err instanceof Error ? `Failed to generate playlist: ${err.message}` : 'An unknown error occurred.');
      setStage(AppStage.INPUT);
    } finally {
      setIsLoading(false);
    }
  }, [user1Prefs, user2Prefs, context]);

  const resetApp = () => {
    setUser1Prefs({ songs: '', artists: '', genres: '' });
    setUser2Prefs({ songs: '', artists: '', genres: '' });
    setContext('');
    setPlaylist(null);
    setError(null);
    setStage(AppStage.INPUT);
  };

  const isFormValid = 
    (user1Prefs.songs || user1Prefs.artists || user1Prefs.genres) &&
    (user2Prefs.songs || user2Prefs.artists || user2Prefs.genres) &&
    context;

  return (
    <div className="min-h-screen bg-slate-900 text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4">
            <MusicIcon className="w-10 h-10 text-cyan-400" />
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-transparent bg-clip-text">
              SoundScout
            </h1>
          </div>
          <p className="mt-2 text-lg text-slate-400">
            Create collaborative playlists from your shared musical tastes.
          </p>
        </header>

        <main>
          {stage === AppStage.INPUT && (
            <div className="bg-slate-800/50 rounded-2xl shadow-lg p-6 backdrop-blur-sm border border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                <UserInput title="User 1" prefs={user1Prefs} setPrefs={setUser1Prefs} />
                <UserInput title="User 2" prefs={user2Prefs} setPrefs={setUser2Prefs} />
              </div>

              <div>
                <label htmlFor="context" className="block text-lg font-semibold mb-2 text-cyan-300">Playlist Vibe</label>
                <input
                  id="context"
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g., Chill study session, Road trip, Party..."
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 focus:ring-2 focus:ring-cyan-400 focus:outline-none transition"
                />
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={() => handleGenerate('taster')}
                  disabled={!isFormValid || isLoading}
                  className="bg-cyan-500 text-white font-bold py-3 px-8 rounded-full hover:bg-cyan-400 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/20"
                >
                  {isLoading ? <Loader /> : 'Generate Taster Playlist'}
                </button>
              </div>
            </div>
          )}

          {isLoading && stage !== AppStage.INPUT && (
            <div className="text-center p-8">
              <Loader />
              <p className="mt-4 text-slate-400">Scouting for the perfect vibes...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center">
              <p>{error}</p>
              <button onClick={resetApp} className="mt-2 text-sm underline hover:text-white">Try again</button>
            </div>
          )}

          {playlist && (stage === AppStage.TASTER_RESULT || stage === AppStage.FULL_PLAYLIST) && (
            <div className="animate-fade-in">
              <PlaylistDisplay playlist={playlist} />

              {stage === AppStage.TASTER_RESULT && (
                <div className="mt-8 text-center bg-slate-800/50 rounded-2xl shadow-lg p-6 border border-slate-700">
                  <h3 className="text-2xl font-bold mb-4">Like what you hear?</h3>
                  <p className="text-slate-400 mb-6">Let's create a full playlist for you.</p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => handleGenerate('full')}
                      disabled={isLoading}
                      className="bg-fuchsia-500 text-white font-bold py-3 px-8 rounded-full hover:bg-fuchsia-400 disabled:bg-slate-600 transition-transform transform hover:scale-105 shadow-lg shadow-fuchsia-500/20"
                    >
                      {isLoading ? <Loader /> : "Let's Go!"}
                    </button>
                     <button
                      onClick={resetApp}
                      className="bg-slate-700 text-white font-bold py-3 px-8 rounded-full hover:bg-slate-600 transition-transform transform hover:scale-105"
                    >
                      Start Over
                    </button>
                  </div>
                </div>
              )}
              {stage === AppStage.FULL_PLAYLIST && (
                  <div className="mt-8 text-center">
                       <button
                      onClick={resetApp}
                      className="bg-cyan-500 text-white font-bold py-3 px-8 rounded-full hover:bg-cyan-400 transition-transform transform hover:scale-105 shadow-lg shadow-cyan-500/20"
                    >
                      Create Another Playlist
                    </button>
                  </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
