import React, { useState, useCallback, useEffect } from 'react';
import { UserPreferences, Playlist, AppStage } from './types';
import { generatePlaylist } from './services/geminiService';
import UserInput from './components/UserInput';
import PlaylistDisplay from './components/PlaylistDisplay';
import Loader from './components/Loader';
import { MusicIcon } from './components/icons';

const App: React.FC = () => {
  const [user1Prefs, setUser1Prefs] = useState<UserPreferences>({ songs: '', genres: '' });
  const [user2Prefs, setUser2Prefs] = useState<UserPreferences>({ songs: '', genres: '' });
  const [context, setContext] = useState('');
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<AppStage>(AppStage.INPUT_USER_1);

  const loadingMessages = [
    'Scouting for the perfect vibes...',
    'Analyzing your musical tastes...',
    'Finding hidden gems...',
    'Crafting your unique playlist...',
    'Almost there...',
  ];
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    // Only cycle messages during the main playlist generation loading screen
    if (isLoading && stage !== AppStage.INPUT_USER_1 && stage !== AppStage.INPUT_USER_2) {
      setCurrentMessageIndex(0); // Reset on start
      interval = setInterval(() => {
        setCurrentMessageIndex(prevIndex => (prevIndex + 1) % loadingMessages.length);
      }, 2500); // Change message every 2.5 seconds
    }
    return () => {
        if (interval) {
            clearInterval(interval);
        }
    };
  }, [isLoading, stage]);

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
      setStage(AppStage.INPUT_USER_2);
    } finally {
      setIsLoading(false);
    }
  }, [user1Prefs, user2Prefs, context]);

  const resetApp = () => {
    setUser1Prefs({ songs: '', genres: '' });
    setUser2Prefs({ songs: '', genres: '' });
    setContext('');
    setPlaylist(null);
    setError(null);
    setStage(AppStage.INPUT_USER_1);
  };

  const isUser1FormValid = !!(user1Prefs.songs || user1Prefs.genres);
  const isFormValid =
    isUser1FormValid &&
    (user2Prefs.songs || user2Prefs.genres) &&
    context;

  const showLoadingAnimation = isLoading && stage !== AppStage.INPUT_USER_1 && stage !== AppStage.INPUT_USER_2;

  return (
    <div className="relative min-h-screen bg-black text-gray-200 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 -translate-x-1/2 -translate-y-1/2">
            <div className={`w-full h-full bg-cyan-500/10 rounded-full filter blur-3xl opacity-50 transition-transform,opacity duration-1000 ${showLoadingAnimation ? 'animate-pulse-glow' : ''}`}></div>
        </div>
        <div className="absolute bottom-0 right-0 w-96 h-96 translate-x-1/2 translate-y-1/2">
            <div className={`w-full h-full bg-blue-500/10 rounded-full filter blur-3xl opacity-50 transition-transform,opacity duration-1000 ${showLoadingAnimation ? 'animate-pulse-glow' : ''}`} style={{ animationDelay: '3s' }}></div>
        </div>
      </div>
      <div className="relative z-10 max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4">
            <MusicIcon className="w-10 h-10 text-cyan-400" />
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
              SoundScout
            </h1>
          </div>
          <p className="mt-2 text-lg text-gray-400">
            Create collaborative playlists from your shared musical tastes.
          </p>
        </header>

        <main>
          {stage === AppStage.INPUT_USER_1 && (
            <div className="bg-zinc-900/50 rounded-2xl shadow-lg shadow-blue-500/20 p-6 backdrop-blur-sm border border-blue-800/30 animate-fade-in">
              <UserInput title="Listener 1" prefs={user1Prefs} setPrefs={setUser1Prefs} />
              <div className="mt-8 text-center">
                <button
                  onClick={() => setStage(AppStage.INPUT_USER_2)}
                  disabled={!isUser1FormValid}
                  className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-full hover:bg-cyan-500 disabled:bg-zinc-700 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-600/30"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {stage === AppStage.INPUT_USER_2 && (
            <div className="bg-zinc-900/50 rounded-2xl shadow-lg shadow-blue-500/20 p-6 backdrop-blur-sm border border-blue-800/30 animate-fade-in">
                <UserInput title="Listener 2" prefs={user2Prefs} setPrefs={setUser2Prefs} />
              <div className="mt-6">
                <label htmlFor="context" className="block text-lg font-semibold mb-2 text-cyan-300">Playlist Vibe</label>
                <input
                  id="context"
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g., Chill study session, Road trip, Party..."
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                />
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center mt-6">
                  <p>{error}</p>
                </div>
              )}

              <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                 <button
                    onClick={() => setStage(AppStage.INPUT_USER_1)}
                    className="w-full sm:w-auto bg-zinc-800 text-white font-bold py-3 px-8 rounded-full hover:bg-zinc-700 transition-transform transform hover:scale-105"
                  >
                    Back
                  </button>
                <button
                  onClick={() => handleGenerate('taster')}
                  disabled={!isFormValid || isLoading}
                  className="w-full sm:w-auto bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-600/20"
                >
                  {isLoading ? <Loader size="sm" /> : 'Generate Taster Playlist'}
                </button>
              </div>
            </div>
          )}

          {showLoadingAnimation && (
            <div className="text-center p-8">
              <Loader />
              <p key={currentMessageIndex} className="mt-4 text-gray-400 animate-fade-in-text">
                {loadingMessages[currentMessageIndex]}
              </p>
            </div>
          )}

          {error && stage !== AppStage.INPUT_USER_2 && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center">
              <p>{error}</p>
              <button onClick={resetApp} className="mt-2 text-sm underline hover:text-white">Start Over</button>
            </div>
          )}

          {playlist && (stage === AppStage.TASTER_RESULT || stage === AppStage.FULL_PLAYLIST) && (
            <div className="animate-fade-in">
              <PlaylistDisplay
                playlist={playlist}
              />

              {stage === AppStage.TASTER_RESULT && (
                <div className="mt-8 text-center bg-zinc-900/50 rounded-2xl shadow-lg shadow-blue-500/20 p-6 border border-blue-800/30">
                  <h3 className="text-2xl font-bold mb-4">Like what you hear?</h3>
                  <p className="text-gray-400 mb-6">Let's create a full playlist for you.</p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button
                      onClick={() => handleGenerate('full')}
                      disabled={isLoading}
                      className="w-full sm:w-auto bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-500 disabled:bg-zinc-700 transition-transform transform hover:scale-105 shadow-lg shadow-blue-600/20"
                    >
                      {isLoading ? <Loader size="sm" /> : "Let's Go!"}
                    </button>
                     <button
                      onClick={resetApp}
                      className="w-full sm:w-auto bg-zinc-800 text-white font-bold py-3 px-8 rounded-full hover:bg-zinc-700 transition-transform transform hover:scale-105"
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
                      className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-500 transition-transform transform hover:scale-105 shadow-lg shadow-blue-600/20"
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