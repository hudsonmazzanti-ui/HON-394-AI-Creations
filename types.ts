
export interface UserPreferences {
  songs: string;
  genres: string;
}

export interface SongWithArtist {
  title: string;
  artist: string;
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
    INPUT_USER_1 = 'INPUT_USER_1',
    INPUT_USER_2 = 'INPUT_USER_2',
    TASTER_RESULT = 'TASTER_RESULT',
    FULL_PLAYLIST = 'FULL_PLAYLIST'
}
