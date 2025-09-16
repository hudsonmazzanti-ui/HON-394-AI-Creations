
// IMPORTANT: You must register an app on the Spotify Developer Dashboard
// to get your own client ID.
// https://developer.spotify.com/dashboard/

export const CLIENT_ID = "PASTE_YOUR_SPOTIFY_CLIENT_ID_HERE";

// The redirect URI must be added to the "Redirect URIs" in your app's settings
// on the Spotify Developer Dashboard. For local development or the deployed app,
// this will dynamically use the current page's origin.
export const REDIRECT_URI = window.location.origin + window.location.pathname;
