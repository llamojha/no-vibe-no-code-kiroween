/**
 * Decodes a base64 string into a Uint8Array.
 * @param base64 The base64 encoded string.
 * @returns A Uint8Array of the decoded data.
 */
export const decodeBase64 = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Decodes raw PCM audio data into an AudioBuffer for playback.
 * The Gemini TTS API returns raw audio data, not a complete file like .wav or .mp3.
 * @param data The raw audio data as a Uint8Array.
 * @param ctx The AudioContext to use for creating the buffer.
 * @param sampleRate The sample rate of the audio (e.g., 24000 for gemini-2.5-flash-preview-tts).
 * @param numChannels The number of audio channels (e.g., 1 for mono).
 * @returns A promise that resolves with the decoded AudioBuffer.
 */
export const decodePcmToAudioBuffer = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel += 1) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i += 1) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }

  return buffer;
};

/**
 * Attempts to decode an encoded audio file (e.g., WAV/MP3/OGG) using the browser's
 * built-in `decodeAudioData`. Returns null if decoding fails.
 */
export const tryDecodeWithAudioContext = async (
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer | null> => {
  try {
    const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    // Safari's decodeAudioData supports Promise in modern versions; fall back to callback if needed
    const decoded: AudioBuffer = await new Promise((resolve, reject) => {
      try {
        // @ts-expect-error — decodeAudioData has both promise and callback overloads across browsers
        const maybePromise = ctx.decodeAudioData(arrayBuffer, resolve, reject);
        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise.then(resolve).catch(reject);
        }
      } catch (err) {
        reject(err);
      }
    });
    return decoded;
  } catch {
    return null;
  }
};
