
export interface UserPreferences {
  songs: string;
  artists: string;
  genres: string;
}

export interface Song {
  title: string;
  artist: string;
  source: 'User 1' | 'User 2' | 'Both';
}

export interface Playlist {
  playlistName: string;
  songs: Song[];
}

export enum AppStage {
    INPUT = 'INPUT',
    TASTER_RESULT = 'TASTER_RESULT',
    FULL_PLAYLIST = 'FULL_PLAYLIST'
}
