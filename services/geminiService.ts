import { GoogleGenAI, Type } from "@google/genai";
import { UserPreferences, Playlist } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const findSongsByArtist = async (artistName: string, onSongReceived: (song: string) => void): Promise<void> => {
    try {
        const prompt = `
You are an ultra-fast song lookup service. Your task is to provide a list of songs by the artist "${artistName}" as quickly as possible.

Instructions:
1.  IMMEDIATELY start streaming the most popular songs by "${artistName}". Do NOT wait to compile a full list.
2.  Prioritize speed above all else. Return the top 5-10 most famous songs first.
3.  After the most popular songs, you can stream other well-known tracks.
4.  Do NOT sort the list alphabetically. The order should be based on popularity/relevance to get results to the user instantly.
5.  Return ONLY the song titles, with each song on a new line. Do not add numbers, bullet points, JSON formatting, or any other text. Just a raw list of song titles separated by newlines.
`;
        const responseStream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        let buffer = '';
        for await (const chunk of responseStream) {
            buffer += chunk.text;
            let newlineIndex;
            while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                const song = buffer.substring(0, newlineIndex).trim();
                buffer = buffer.substring(newlineIndex + 1);
                if (song) {
                    onSongReceived(song);
                }
            }
        }
        // Process any remaining text in buffer after the stream closes
        if (buffer.trim()) {
            onSongReceived(buffer.trim());
        }
    } catch (error) {
        console.error("Error finding songs for artist:", error);
        throw new Error("Could not connect to the song search service.");
    }
};

const playlistSchema = {
    type: Type.OBJECT,
    properties: {
        playlistName: {
            type: Type.STRING,
            description: "A creative and catchy name for the playlist based on the listeners' tastes and the context.",
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
                        description: "Indicates who the song is for. Must be one of: 'Listener 1', 'Listener 2', or 'Both'.",
                    },
                },
                required: ["title", "artist", "source"],
            },
        },
    },
    required: ["playlistName", "songs"],
};


const buildPrompt = (user1: UserPreferences, user2: UserPreferences, context: string, size: 'taster' | 'full'): string => {
    // The user's songs string is semicolon-separated. Convert to comma-separated for better readability for the model.
    const formattedUser1Songs = user1.songs.replace(/;/g, ',');
    const formattedUser2Songs = user2.songs.replace(/;/g, ',');

    return `
You are SoundScout, a friendly and casual music expert who helps friends create collaborative playlists.

Your goal is to create a playlist based on the musical tastes of two listeners and a given context.

Listener 1's Preferences:
- Favorite Songs: ${formattedUser1Songs || 'Not provided'}
- Favorite Genres: ${user1.genres || 'Not provided'}

Listener 2's Preferences:
- Favorite Songs: ${formattedUser2Songs || 'Not provided'}
- Favorite Genres: ${user2.genres || 'Not provided'}

Playlist Context/Vibe: ${context}

Playlist Size Request: ${size === 'taster' ? 'A small taster playlist of 3-5 songs.' : 'A full playlist of 20-25 songs.'}

Please generate a playlist following these rules strictly:
1.  **Primary Goal: Find Common Ground**: Your main objective is to find songs that BOTH listeners will enjoy. The playlist should feel like a shared discovery, not a split list.
2.  **Maximize Overlap**: The listeners have provided songs with their artists (e.g., 'Song Title by Artist'). Heavily prioritize these songs, artists, and genres that both listeners like. If they both mention an artist, try to pick a song by that artist that fits the vibe. Tag these songs as "Both".
3.  **Create "Bridge" Songs**: If direct overlap is scarce, your most important task is to find "bridge" songs. These are tracks that sonically and thematically connect the tastes of Listener 1 and Listener 2. They might be from an artist neither mentioned but who is similar to artists they both like. These bridge songs should also be tagged as "Both", as they are intended for mutual enjoyment.
4.  **Sparingly Use Individual Picks**: Only include songs that appeal to just one listener if it's necessary to fill out the playlist or if a song perfectly fits the context and isn't too jarring for the other listener. These should be a minority of the tracks. When you do include them, tag them as "Listener 1" or "Listener 2".
5.  **Context is King**: The playlist's mood must strictly match the provided context ('${context}').
6.  **Create a Dynamic Flow**: Arrange the songs to create a smooth, enjoyable listening experience. Crucially, interleave tracks from 'Listener 1', 'Listener 2', and 'Both' to create a shuffled, collaborative feel. Avoid grouping songs from the same source together. Avoid abrupt changes in style.
7.  **Tagging**: Every song MUST be tagged with its source: "Listener 1", "Listener 2", or, most importantly, "Both".
8.  **CRITICAL: Verify Song Existence**: Every song you suggest MUST be a real, existing track by the specified artist. Before outputting the JSON, double-check that the song titles are accurate and can be found on major music platforms. Do not invent songs under any circumstances. This is the most important rule.

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