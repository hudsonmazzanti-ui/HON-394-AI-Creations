
import { Song } from '../types';
import { REDIRECT_URI } from '../spotify.config';

// --- PKCE Helpers ---

// Generate a random string for the code verifier
function generateCodeVerifier(length: number) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// Generate a code challenge from the verifier
async function generateCodeChallenge(codeVerifier: string) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}


// --- Spotify API Calls ---

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export async function redirectToAuthFlow(clientId: string) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("spotify_verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", REDIRECT_URI);
    params.append("scope", "playlist-modify-public playlist-modify-private");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}


export async function getAccessToken(clientId: string, code: string) {
    const verifier = localStorage.getItem("spotify_verifier");

    if (!verifier) {
        throw new Error("Spotify code verifier not found in local storage.");
    }

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", REDIRECT_URI);
    params.append("code_verifier", verifier);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });
    
    if (!result.ok) {
        const error = await result.json();
        throw new Error(`Failed to get token: ${error.error_description}`);
    }

    const { access_token } = await result.json();
    localStorage.setItem("spotify_access_token", access_token);
}

// Helper to make authenticated API calls
async function fetchSpotifyAPI(endpoint: string, method: string = 'GET', body?: any) {
    const token = localStorage.getItem('spotify_access_token');
    if (!token) {
        // This could redirect to auth flow again or throw
        throw new Error("Not authenticated with Spotify");
    }

    const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
    };

    if (body) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    if (!res.ok) {
        // Handle token expiration in a real app by refreshing the token
        const error = await res.json();
        throw new Error(`Spotify API Error: ${error.error.message}`);
    }
    
    if (res.status === 204 || res.status === 201) return null; // No content responses

    return res.json();
}

async function getCurrentUserId(): Promise<string> {
    const profile = await fetchSpotifyAPI('/me');
    return profile.id;
}

async function searchTrack(song: Song): Promise<string | null> {
    const query = `track:${song.title} artist:${song.artist}`;
    const params = new URLSearchParams({
        q: query,
        type: 'track',
        limit: '1'
    });
    const result = await fetchSpotifyAPI(`/search?${params.toString()}`);
    if (result.tracks.items.length > 0) {
        return result.tracks.items[0].uri;
    }
    return null;
}

async function createPlaylist(userId: string, name: string): Promise<any> {
    return await fetchSpotifyAPI(`/users/${userId}/playlists`, 'POST', {
        name,
        description: `Created by SoundScout for a collaborative session.`,
        public: true
    });
}

async function addTracksToPlaylist(playlistId: string, trackUris: string[]) {
    // Spotify API can only handle 100 tracks at a time
    await fetchSpotifyAPI(`/playlists/${playlistId}/tracks`, 'POST', {
        uris: trackUris.slice(0, 100)
    });
}

// --- Main Export Orchestrator ---

export const exportPlaylistToSpotify = async (songs: Song[], playlistName: string) => {
    try {
        const userId = await getCurrentUserId();
        
        // 1. Search for all tracks and get their URIs
        console.log("Searching for tracks...");
        const trackUriPromises = songs.map(song => searchTrack(song));
        const trackUris = (await Promise.all(trackUriPromises)).filter((uri): uri is string => uri !== null);
        
        if (trackUris.length === 0) {
            throw new Error("Could not find any of the songs on Spotify.");
        }

        console.log(`Found ${trackUris.length}/${songs.length} tracks.`);

        // 2. Create the playlist
        console.log("Creating playlist...");
        const newPlaylist = await createPlaylist(userId, playlistName);

        // 3. Add tracks to the playlist
        console.log("Adding tracks to playlist...");
        await addTracksToPlaylist(newPlaylist.id, trackUris);
        
        console.log("Playlist created successfully!");
        return newPlaylist;

    } catch (error) {
        console.error("Failed to export playlist:", error);
        throw error; // Re-throw to be caught by the UI
    }
}
