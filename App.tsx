
import React, { useState, useCallback, useEffect } from 'react';
import { UserPreferences, Playlist, AppStage } from './types';
import { generatePlaylist } from './services/geminiService';
import { getAccessToken, redirectToAuthFlow, exportPlaylistToSpotify } from './services/spotifyService';
import UserInput from './components/UserInput';
import PlaylistDisplay from './components/PlaylistDisplay';
import Loader from './components/Loader';
import { MusicIcon } from './components/icons';
import { CLIENT_ID } from './spotify.config';

const App: React.FC = () => {
  const [user1Prefs, setUser1Prefs] = useState<UserPreferences>({ songs: '', genres: '' });
  const [user2Prefs, setUser2Prefs] = useState<UserPreferences>({ songs: '', genres: '' });
  const [context, setContext] = useState('');
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<AppStage>(AppStage.INPUT_USER_1);

  // Spotify Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessUrl, setExportSuccessUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [spotifyAuthError, setSpotifyAuthError] = useState<string | null>(null);
  const [isSpotifyReady, setIsSpotifyReady] = useState(false);


  // Handle Spotify Auth Callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      setSpotifyAuthError("Spotify authentication failed. Please try again.");
      // Clean up URL
      window.history.pushState({}, document.title, window.location.pathname);
      return;
    }

    if (code) {
      // We have a code, let's exchange it for a token
      getAccessToken(CLIENT_ID, code)
        .then(() => {
          setIsSpotifyReady(true);
           // Clean up URL and remove code
          window.history.pushState({}, document.title, window.location.pathname);
        })
        .catch(err => {
          console.error(err);
          setSpotifyAuthError("Failed to get Spotify access token.");
        });
    } else {
        // Check if token already exists in local storage
        if (localStorage.getItem('spotify_access_token')) {
            setIsSpotifyReady(true);
        }
    }
  }, []);

  const handleGenerate = useCallback(async (size: 'taster' | 'full') => {
    setIsLoading(true);
    setError(null);
    setPlaylist(null);
    setExportSuccessUrl(null);
    setExportError(null);

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
    setExportSuccessUrl(null);
    setExportError(null);
    setSpotifyAuthError(null);
    setStage(AppStage.INPUT_USER_1);
  };

  const handleExportPlaylist = async () => {
    if (!playlist) return;
    
    setExportError(null);
    setExportSuccessUrl(null);

    if (!isSpotifyReady) {
        if (CLIENT_ID === "PASTE_YOUR_SPOTIFY_CLIENT_ID_HERE") {
             setExportError("Spotify Client ID is not configured. Please update spotify.config.ts");
             return;
        }
        await redirectToAuthFlow(CLIENT_ID);
        return;
    }

    setIsExporting(true);
    try {
        const spotifyPlaylist = await exportPlaylistToSpotify(playlist.songs, playlist.playlistName);
        setExportSuccessUrl(spotifyPlaylist.external_urls.spotify);
    } catch (err) {
        console.error(err);
        setExportError(err instanceof Error ? err.message : "An unknown error occurred during export.");
    } finally {
        setIsExporting(false);
    }
  };


  const isUser1FormValid = !!(user1Prefs.songs || user1Prefs.genres);
  const isFormValid =
    isUser1FormValid &&
    (user2Prefs.songs || user2Prefs.genres) &&
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
          {spotifyAuthError && (
             <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center mb-6">
               <p>{spotifyAuthError}</p>
             </div>
          )}
          {stage === AppStage.INPUT_USER_1 && (
            <div className="bg-slate-800/50 rounded-2xl shadow-lg p-6 backdrop-blur-sm border border-slate-700 animate-fade-in">
              <UserInput title="User 1" prefs={user1Prefs} setPrefs={setUser1Prefs} />
              <div className="mt-8 text-center">
                <button
                  onClick={() => setStage(AppStage.INPUT_USER_2)}
                  disabled={!isUser1FormValid}
                  className="bg-cyan-500 text-white font-bold py-3 px-8 rounded-full hover:bg-cyan-400 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/20"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {stage === AppStage.INPUT_USER_2 && (
            <div className="bg-slate-800/50 rounded-2xl shadow-lg p-6 backdrop-blur-sm border border-slate-700 animate-fade-in">
                <UserInput title="User 2" prefs={user2Prefs} setPrefs={setUser2Prefs} />
              <div className="mt-6">
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

              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center mt-6">
                  <p>{error}</p>
                </div>
              )}

              <div className="mt-8 flex justify-center items-center gap-4">
                 <button
                    onClick={() => setStage(AppStage.INPUT_USER_1)}
                    className="bg-slate-700 text-white font-bold py-3 px-8 rounded-full hover:bg-slate-600 transition-transform transform hover:scale-105"
                  >
                    Back
                  </button>
                <button
                  onClick={() => handleGenerate('taster')}
                  disabled={!isFormValid || isLoading}
                  className="bg-cyan-500 text-white font-bold py-3 px-8 rounded-full hover:bg-cyan-400 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/20"
                >
                  {isLoading ? <Loader size="sm" /> : 'Generate Taster Playlist'}
                </button>
              </div>
            </div>
          )}

          {isLoading && (stage !== AppStage.INPUT_USER_1 && stage !== AppStage.INPUT_USER_2) && (
            <div className="text-center p-8">
              <Loader />
              <p className="mt-4 text-slate-400">Scouting for the perfect vibes...</p>
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
                onExport={handleExportPlaylist}
                isExporting={isExporting}
                exportSuccessUrl={exportSuccessUrl}
                exportError={exportError}
              />

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
                      {isLoading ? <Loader size="sm" /> : "Let's Go!"}
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
