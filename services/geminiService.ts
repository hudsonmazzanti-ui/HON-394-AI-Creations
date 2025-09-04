
import { GoogleGenAI, Type } from "@google/genai";
import { UserPreferences, Playlist } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const playlistSchema = {
    type: Type.OBJECT,
    properties: {
        playlistName: {
            type: Type.STRING,
            description: "A creative and catchy name for the playlist based on the users' tastes and the context.",
        },
        songs: {
            type: Type.ARRAY,
            description: "The list of songs in the playlist.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    artist: { type: Type.STRING },
                    source: {
                        type: Type.STRING,
                        description: "Indicates who the song is for. Must be one of: 'User 1', 'User 2', or 'Both'.",
                    },
                },
                required: ["title", "artist", "source"],
            },
        },
    },
    required: ["playlistName", "songs"],
};


const buildPrompt = (user1: UserPreferences, user2: UserPreferences, context: string, size: 'taster' | 'full'): string => {
    return `
You are SoundScout, a friendly and casual music expert who helps friends create collaborative playlists.

Your goal is to create a playlist based on the musical tastes of two users and a given context.

User 1's Preferences:
- Favorite Songs: ${user1.songs || 'Not provided'}
- Favorite Artists: ${user1.artists || 'Not provided'}
- Favorite Genres: ${user1.genres || 'Not provided'}

User 2's Preferences:
- Favorite Songs: ${user2.songs || 'Not provided'}
- Favorite Artists: ${user2.artists || 'Not provided'}
- Favorite Genres: ${user2.genres || 'Not provided'}

Playlist Context/Vibe: ${context}

Playlist Size Request: ${size === 'taster' ? 'A small taster playlist of 3-5 songs.' : 'A full playlist of 20-25 songs.'}

Please generate a playlist following these rules strictly:
1.  **Balance & Fairness**: Represent both users equally. If one user provided more input, don't let them dominate. The final playlist should feel like a true collaboration.
2.  **Prioritize Overlap**: Start with songs/artists/genres that both users like. This is the foundation of the playlist. Tag these as "Both".
3.  **Bridge Gaps**: If there's no direct overlap, find similar tracks that bridge their tastes. Use audio features like mood, tempo, and energy to find common ground.
4.  **Individual Tastes**: After covering overlap, include songs that are specific to each user. Tag these as "User 1" or "User 2".
5.  **Context is Key**: The playlist's mood must match the provided context ('${context}'). A 'study' playlist should be chill, a 'party' playlist should be high-energy.
6.  **Flow is Everything**: Order the songs to create a smooth listening experience. Start with shared songs to set a common vibe, alternate between User 1 and User 2's picks, and use bridging tracks to transition smoothly between different styles.
7.  **Tagging**: Each song in the playlist MUST be tagged with its source: "User 1", "User 2", or "Both".

Generate the playlist in the specified JSON format. Do not include any introductory text, markdown formatting, or explanations, just the raw JSON object.
`;
};

export const generatePlaylist = async (
    user1: UserPreferences,
    user2: UserPreferences,
    context: string,
    size: 'taster' | 'full'
): Promise<Playlist> => {
    try {
        const prompt = buildPrompt(user1, user2, context, size);
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: playlistSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const playlistData = JSON.parse(jsonText);
        
        // Basic validation
        if (!playlistData.playlistName || !Array.isArray(playlistData.songs)) {
            throw new Error("Invalid playlist format received from API.");
        }

        return playlistData as Playlist;

    } catch (error) {
        console.error("Error generating playlist:", error);
        throw new Error("Could not connect to the playlist generation service. Please try again later.");
    }
};
