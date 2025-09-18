import React, { useState, useMemo } from 'react';
import { UserPreferences, SongWithArtist } from '../types';
import { findSongsByArtist } from '../services/geminiService';
import { UserIcon, MusicNoteIcon, MusicIcon, XIcon } from './icons';

interface UserInputProps {
  title: string;
  prefs: UserPreferences;
  setPrefs: React.Dispatch<React.SetStateAction<UserPreferences>>;
}

const POPULAR_GENRES = [
  'Pop', 'Rock', 'Hip-hop', 'R&B', 'Electronic', 'Indie', 'Jazz',
  'Classical', 'Country', 'Metal', 'Folk', 'Reggae', 'K-Pop',
  'Alternative', 'Punk', 'Funk', 'Soul', 'Blues', 'Latin', 'Dance', 
  'House', 'Techno', 'Drum & Bass', 'Ambient', 'Soundtrack', 'Drill', 
  'Grime', 'Trap', 'Garage', 'Psychedelic Rock', 'Grunge', 'Synthpop', 'World',
  'Disco', 'Lo-fi', 'Shoegaze', 'Post-Punk'
] as const;


// Helper to parse the prefs string into an array of objects
const parseSongs = (songsStr: string): SongWithArtist[] => {
    if (!songsStr) return [];
    return songsStr.split(';').map(s => { // Using semicolon as a more robust separator
        const parts = s.trim().split(' by ');
        if (parts.length < 2) return null; // malformed
        const artist = parts.pop()!;
        const title = parts.join(' by ');
        return { title, artist };
    }).filter((s): s is SongWithArtist => s !== null);
};

// Helper to format the array back into a string
const formatSongs = (songs: SongWithArtist[]): string => {
    return songs.map(s => `${s.title.trim()} by ${s.artist.trim()}`).join('; '); // Using semicolon
};


const UserInput: React.FC<UserInputProps> = ({ title, prefs, setPrefs }) => {
  // NEW State for the inverted flow
  const [artistInput, setArtistInput] = useState('');
  const [songList, setSongList] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedArtist, setSearchedArtist] = useState<string | null>(null);
  const [songFilter, setSongFilter] = useState('');
  const [manualSongInput, setManualSongInput] = useState('');

  // Memoize the parsed song list for rendering chips
  const addedSongs = useMemo(() => parseSongs(prefs.songs), [prefs.songs]);

  const resetArtistSearchState = () => {
    setArtistInput('');
    setSongList([]);
    setIsSearching(false);
    setSearchedArtist(null);
    setSongFilter('');
    setManualSongInput('');
  };
  
  const handleAddSong = (songTitle: string) => {
    if (!searchedArtist) return;
    const newSong: SongWithArtist = { title: songTitle, artist: searchedArtist };
    
    // Avoid adding duplicates
    const isAlreadyAdded = addedSongs.some(s => s.title.toLowerCase() === newSong.title.toLowerCase() && s.artist.toLowerCase() === newSong.artist.toLowerCase());
    if (isAlreadyAdded) return;

    const newSongs = [...addedSongs, newSong];
    setPrefs(p => ({ ...p, songs: formatSongs(newSongs) }));
  };

  const handleManualAdd = () => {
    if (!manualSongInput.trim() || !searchedArtist) return;
    handleAddSong(manualSongInput.trim());
    setManualSongInput('');
  }

  const handleRemoveSong = (index: number) => {
    const newSongs = addedSongs.filter((_, i) => i !== index);
    setPrefs(p => ({ ...p, songs: formatSongs(newSongs) }));
  };

  const handleSearchSongs = async () => {
    if (!artistInput.trim() || isSearching) return;
    setIsSearching(true);
    setSongList([]); // Reset song list
    setSongFilter(''); // Reset filter
    const artistName = artistInput.trim();
    setSearchedArtist(artistName);

    const onSongReceived = (songTitle: string) => {
        setSongList(prevList => {
            // Check for duplicates before adding
            if (prevList.map(s => s.toLowerCase()).includes(songTitle.toLowerCase())) {
                return prevList;
            }
            // Model is asked to provide sorted list, so we just append
            return [...prevList, songTitle];
        });
    };

    try {
        await findSongsByArtist(artistName, onSongReceived);
    } catch (error) {
        console.error("Failed to stream songs:", error);
        // You could add state to display an error to the user here
    } finally {
        setIsSearching(false);
    }
};
  
  // Filtered songs for display
  const filteredSongs = useMemo(() => {
    if (!songFilter) return songList;
    return songList.filter(song => 
        song.toLowerCase().includes(songFilter.toLowerCase())
    );
  }, [songList, songFilter]);

  // Memoize added songs for quick lookup to disable buttons
  const addedSongTitles = useMemo(() => {
    if (!searchedArtist) return new Set();
    return new Set(
        addedSongs
            .filter(s => s.artist.toLowerCase() === searchedArtist.toLowerCase())
            .map(s => s.title.toLowerCase())
    );
  }, [addedSongs, searchedArtist]);

  // Genre Logic
  const selectedGenres = useMemo(() => {
    return new Set(prefs.genres.split(',').map(g => g.trim()).filter(Boolean));
  }, [prefs.genres]);

  const handleGenreToggle = (genre: string) => {
    const newSelectedGenres = new Set(selectedGenres);
    if (newSelectedGenres.has(genre)) {
      newSelectedGenres.delete(genre);
    } else {
      newSelectedGenres.add(genre);
    }
    
    const allGenres = Array.from(newSelectedGenres).join(', ');
    setPrefs(prev => ({ ...prev, genres: allGenres }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2 text-cyan-400">
        <UserIcon className="w-6 h-6 text-cyan-400" />
        {title}
      </h2>

      {/* NEW SONG INPUT SECTION */}
      <div className="space-y-3">
        <label htmlFor={`${title}-artist-input`} className="block text-base font-semibold text-gray-300 flex items-center gap-2">
          <MusicNoteIcon className="w-5 h-5 text-gray-500" />
          Favorite Songs
        </label>
        
        {addedSongs.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2">
            {addedSongs.map((song, index) => (
              <div key={index} className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-full py-1 pl-3 pr-1 text-sm animate-fade-in">
                <span className="font-medium text-white">{song.title}</span>
                <span className="text-gray-400">- {song.artist}</span>
                <button onClick={() => handleRemoveSong(index)} className="bg-zinc-700 rounded-full p-0.5 hover:bg-red-500 group" aria-label={`Remove ${song.title}`}>
                  <XIcon className="w-3 h-3 text-gray-400 group-hover:text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Artist Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2">
          <div className="flex-grow">
            <input
              id={`${title}-artist-input`}
              type="text"
              value={artistInput}
              onChange={(e) => setArtistInput(e.target.value)}
              placeholder="Enter an artist's name..."
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchSongs(); }}}
              disabled={isSearching || !!searchedArtist}
            />
          </div>
          <button
            onClick={handleSearchSongs}
            disabled={!artistInput.trim() || isSearching || !!searchedArtist}
            className="w-full sm:w-auto bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-500 disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Find Songs'}
          </button>
          {searchedArtist && (
            <button
              onClick={resetArtistSearchState}
              className="w-full sm:w-auto bg-zinc-700 text-white font-bold py-2 px-4 rounded-md hover:bg-zinc-600 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Song List Display */}
        {searchedArtist && (
          <div className="p-4 bg-zinc-800/50 border border-blue-800/30 rounded-md mt-2 animate-fade-in">
            <p className="font-semibold text-gray-300 mb-3">
              Songs by "{searchedArtist}"
            </p>
            <div className="space-y-3">
              <input
                type="text"
                value={songFilter}
                onChange={(e) => setSongFilter(e.target.value)}
                placeholder="Search songs..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                autoFocus
              />
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {filteredSongs.map(songTitle => {
                  const isAdded = addedSongTitles.has(songTitle.toLowerCase());
                  return (
                    <button
                      key={songTitle}
                      onClick={() => handleAddSong(songTitle)}
                      disabled={isAdded}
                      className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isAdded
                          ? 'bg-zinc-700 text-gray-500 cursor-not-allowed'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                      }`}
                    >
                      {songTitle} {isAdded && '(Added)'}
                    </button>
                  );
                })}
                {isSearching && (
                  <div className="flex items-center justify-center p-2 text-sm text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                    Loading...
                  </div>
                )}
              </div>
               {filteredSongs.length === 0 && songFilter && !isSearching && (
                  <p className="text-sm text-gray-400 text-center py-2">No matching songs found.</p>
              )}
            </div>

            {!isSearching && songList.length === 0 && (
                <p className="text-sm text-gray-400 mt-2">
                    Couldn't find any songs for "{searchedArtist}". Please check the spelling or try another artist.
                </p>
            )}

            <div className="flex items-center gap-2 my-4">
              <hr className="flex-grow border-zinc-700" />
              <span className="text-xs text-gray-500">OR</span>
              <hr className="flex-grow border-zinc-700" />
            </div>

            <div className="space-y-2">
              <label htmlFor={`${title}-manual-song-input`} className="text-sm font-medium text-gray-300">
                Can't find a song? Add it manually.
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                  <input
                      id={`${title}-manual-song-input`}
                      type="text"
                      value={manualSongInput}
                      onChange={(e) => setManualSongInput(e.target.value)}
                      placeholder="Enter song title..."
                      className="flex-grow w-full bg-zinc-900 border border-zinc-700 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleManualAdd(); }}}
                  />
                  <button
                      onClick={handleManualAdd}
                      disabled={!manualSongInput.trim()}
                      className="w-full sm:w-auto bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-500 disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                      Add
                  </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* GENRE SECTION */}
      <div className="space-y-3">
        <div>
          <label className="block text-base font-semibold mb-2 text-gray-300 flex items-center gap-2">
            <MusicIcon className="w-5 h-5 text-gray-500" />
            Favorite Genres
          </label>
          <p className="text-sm text-gray-400">Select your favorite genres from the list below.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR_GENRES.map(genre => (
            <button
              key={genre}
              type="button"
              onClick={() => handleGenreToggle(genre)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors duration-200 ${
                selectedGenres.has(genre)
                  ? 'bg-blue-500 border-blue-400 text-white'
                  : 'bg-zinc-800/50 border-zinc-700 hover:bg-blue-950/70 hover:border-blue-700'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserInput;