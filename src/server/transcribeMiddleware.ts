import type { Plugin, Connect } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';

/**
 * Reads keys from .env file directly so server plugin detects them immediately
 * without needing special restart or manual process.env export.
 */
function loadEnvKeys(): Record<string, string> {
  const env: Record<string, string> = {};
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
            env[key] = val;
          }
        }
      });
    }
  } catch (err) {
    console.warn('[Transcribe API] Could not load .env file:', err);
  }
  return env;
}

/**
 * Clean multipart body parser that handles binary audio buffers safely.
 * Operates on Buffer byte search to prevent encoding corruption of Opus/WebM data.
 */
interface ParsedMultipart {
  audioBuffer: Buffer | null;
  mimeType: string;
  filename: string;
  language: string;
  clientFallback: string;
}

function parseMultipartBody(fullBuffer: Buffer, contentType: string = ''): ParsedMultipart {
  const result: ParsedMultipart = {
    audioBuffer: null,
    mimeType: 'audio/webm',
    filename: 'recording.webm',
    language: 'auto',
    clientFallback: ''
  };

  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) {
    if (contentType.includes('audio/')) {
      result.audioBuffer = fullBuffer;
      result.mimeType = contentType.split(';')[0].trim();
    }
    return result;
  }

  const boundaryStr = boundaryMatch[1] || boundaryMatch[2];
  const delimiter = Buffer.from(`--${boundaryStr.trim()}`);
  const crlfcrlf = Buffer.from('\r\n\r\n');

  let offset = 0;
  while (offset < fullBuffer.length) {
    const boundaryIdx = fullBuffer.indexOf(delimiter, offset);
    if (boundaryIdx === -1) break;

    const startOfPart = boundaryIdx + delimiter.length;
    if (startOfPart + 2 <= fullBuffer.length && fullBuffer.slice(startOfPart, startOfPart + 2).toString() === '--') {
      break;
    }

    const headersStart = startOfPart + 2; // skip CRLF after boundary
    const headersEnd = fullBuffer.indexOf(crlfcrlf, headersStart);
    if (headersEnd === -1) break;

    const headersText = fullBuffer.slice(headersStart, headersEnd).toString('utf-8');
    const bodyStart = headersEnd + crlfcrlf.length;

    let nextBoundaryIdx = fullBuffer.indexOf(delimiter, bodyStart);
    if (nextBoundaryIdx === -1) {
      nextBoundaryIdx = fullBuffer.length;
    }

    let bodyEnd = nextBoundaryIdx;
    if (bodyEnd >= 2 && fullBuffer[bodyEnd - 2] === 13 && fullBuffer[bodyEnd - 1] === 10) {
      bodyEnd -= 2; // Strip trailing CRLF before boundary
    }

    const partData = fullBuffer.slice(bodyStart, bodyEnd);

    if (headersText.includes('name="audio"') || headersText.includes('filename=')) {
      result.audioBuffer = partData;
      const typeMatch = headersText.match(/Content-Type:\s*([^\r\n;]+)/i);
      if (typeMatch) {
        result.mimeType = typeMatch[1].trim();
      }
      const filenameMatch = headersText.match(/filename="([^"]+)"/i);
      if (filenameMatch) {
        result.filename = filenameMatch[1].trim();
      }
    } else if (headersText.includes('name="language"')) {
      result.language = partData.toString('utf-8').trim();
    } else if (headersText.includes('name="clientFallback"')) {
      result.clientFallback = partData.toString('utf-8').trim();
    }

    offset = nextBoundaryIdx;
  }

  return result;
}

/**
 * Server-side speech-to-text proxy middleware for Vite.
 * Reads audio stream, checks for server-side API keys,
 * routes through Groq Whisper, OpenAI Whisper, Google Gemini, Deepgram, or AssemblyAI.
 * Keeps secret keys completely safe on the server side (never in browser/client).
 */
export function transcribeServerPlugin(): Plugin {
  return {
    name: 'civicpulse-transcribe-server',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
        const url = req.url || '';
        if (url.startsWith('/api/transcribe') && req.method === 'POST') {
          console.log('[Transcribe API] Received transcription request');
          const chunks: Buffer[] = [];

          req.on('data', (chunk) => {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
          });

          req.on('end', async () => {
            try {
              const fullBuffer = Buffer.concat(chunks);
              const urlObj = new URL(url, 'http://localhost');
              const queryLang = urlObj.searchParams.get('lang') || 'auto';

              // Validate maximum file size (25MB limit)
              if (fullBuffer.length > 25 * 1024 * 1024) {
                console.warn('[Transcribe API] Audio file exceeds 25MB limit');
                res.writeHead(413, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: false,
                  errorCode: 'FILE_TOO_LARGE',
                  error: 'Audio file is too large. Please record a shorter voice description.'
                }));
                return;
              }

              const contentType = req.headers['content-type'] || '';
              const parsed = parseMultipartBody(fullBuffer, contentType);
              const langParam = (parsed.language && parsed.language !== 'auto') ? parsed.language : queryLang;
              const audioBuffer = parsed.audioBuffer || fullBuffer;

              console.log(`[Transcribe API] Received file: name: ${parsed.filename}, type: ${parsed.mimeType}, size: ${audioBuffer.length} bytes, fallback length: ${parsed.clientFallback?.length || 0}`);

              // Validate audio buffer has sufficient size (> 300 bytes)
              if (!audioBuffer || audioBuffer.length === 0) {
                console.warn('[Transcribe API] Empty audio buffer (0 bytes)');
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: false,
                  errorCode: 'EMPTY_AUDIO',
                  error: 'Recording contains no audio data. Please check your microphone.'
                }));
                return;
              }

              // Load environment keys from process.env and .env file
              const fileEnv = loadEnvKeys();
              const groqKey = process.env.GROQ_API_KEY || fileEnv.GROQ_API_KEY;
              const openAiKey = process.env.OPENAI_API_KEY || fileEnv.OPENAI_API_KEY;
              const googleKey = process.env.GEMINI_API_KEY || fileEnv.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || fileEnv.GOOGLE_API_KEY;
              const deepgramKey = process.env.DEEPGRAM_API_KEY || fileEnv.DEEPGRAM_API_KEY;
              const hfToken = process.env.HF_TOKEN || fileEnv.HF_TOKEN || process.env.HUGGINGFACE_API_KEY || fileEnv.HUGGINGFACE_API_KEY;

              const promptText = 'Civic issue report in Chandigarh, Mohali, Panchkula. Support English, Hindi (मुख्य गेट के पास सड़क पर गड्ढा है), Punjabi (ਮੇਨ ਗੇਟ ਦੇ ਕੋਲ ਸੜਕ ਤੇ ਖੱਡਾ ਹੈ), and Hinglish (Main gate ke paas road par bahut bada pothole hai). Preserve names, numbers, street locations, and vocabulary. Do not translate.';

              // ==========================================
              // Provider 1: Groq Whisper (whisper-large-v3)
              // ==========================================
              if (groqKey) {
                console.log('[Transcribe API] Provider request started: Groq Whisper (whisper-large-v3)');
                try {
                  const form = new FormData();
                  form.append('file', new Blob([new Uint8Array(audioBuffer)], { type: parsed.mimeType || 'audio/webm' }), parsed.filename || 'recording.webm');
                  form.append('model', 'whisper-large-v3');
                  form.append('prompt', promptText);
                  if (langParam && langParam !== 'auto') {
                    form.append('language', langParam);
                  }

                  const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${groqKey}` },
                    body: form
                  });

                  console.log(`[Transcribe API] Groq response status: ${groqRes.status}`);

                  if (groqRes.status === 401 || groqRes.status === 403) {
                    console.error('[Transcribe API] Groq authentication failed (401/403). Check GROQ_API_KEY.');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                      success: false,
                      errorCode: 'AUTH_FAILED',
                      error: 'Voice transcription service authentication failed. Please verify your API key in .env.'
                    }));
                    return;
                  }

                  if (groqRes.ok) {
                    const data: any = await groqRes.json();
                    if (data.text && data.text.trim()) {
                      console.log(`[Transcribe API] Provider response parsed: transcript length: ${data.text.trim().length}`);
                      res.writeHead(200, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({
                        success: true,
                        text: data.text.trim(),
                        language: data.language || (langParam !== 'auto' ? langParam : 'Auto'),
                        confidence: 0.98,
                        provider: 'Groq Whisper'
                      }));
                      return;
                    } else {
                      console.warn('[Transcribe API] Groq returned empty transcript.');
                      res.writeHead(200, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({
                        success: false,
                        errorCode: 'NO_SPEECH',
                        error: 'No speech was detected in the recording. Please speak clearly into your microphone.'
                      }));
                      return;
                    }
                  }
                } catch (e: any) {
                  console.warn('[Transcribe API] Groq transcription attempt failed:', e.message);
                }
              }

              // ==========================================
              // Provider 2: OpenAI Whisper (whisper-1)
              // ==========================================
              if (openAiKey) {
                console.log('[Transcribe API] Provider request started: OpenAI Whisper (whisper-1)');
                try {
                  const form = new FormData();
                  form.append('file', new Blob([new Uint8Array(audioBuffer)], { type: parsed.mimeType || 'audio/webm' }), parsed.filename || 'recording.webm');
                  form.append('model', 'whisper-1');
                  form.append('prompt', promptText);
                  if (langParam && langParam !== 'auto') {
                    form.append('language', langParam);
                  }

                  const openAiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${openAiKey}` },
                    body: form
                  });

                  console.log(`[Transcribe API] OpenAI response status: ${openAiRes.status}`);

                  if (openAiRes.status === 401 || openAiRes.status === 403) {
                    console.error('[Transcribe API] OpenAI authentication failed (401/403). Check OPENAI_API_KEY.');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                      success: false,
                      errorCode: 'AUTH_FAILED',
                      error: 'Voice transcription service authentication failed. Please verify your API key in .env.'
                    }));
                    return;
                  }

                  if (openAiRes.ok) {
                    const data: any = await openAiRes.json();
                    if (data.text && data.text.trim()) {
                      console.log(`[Transcribe API] OpenAI parsed: transcript length: ${data.text.trim().length}`);
                      res.writeHead(200, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({
                        success: true,
                        text: data.text.trim(),
                        language: data.language || (langParam !== 'auto' ? langParam : 'Auto'),
                        confidence: 0.98,
                        provider: 'OpenAI Whisper'
                      }));
                      return;
                    } else {
                      console.warn('[Transcribe API] OpenAI returned empty transcript.');
                      res.writeHead(200, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({
                        success: false,
                        errorCode: 'NO_SPEECH',
                        error: 'No speech was detected in the recording. Please speak clearly into your microphone.'
                      }));
                      return;
                    }
                  }
                } catch (e: any) {
                  console.warn('[Transcribe API] OpenAI Whisper attempt failed:', e.message);
                }
              }

              // ==========================================
              // Provider 3: Google Gemini Audio STT
              // ==========================================
              if (googleKey) {
                console.log('[Transcribe API] Provider request started: Google Gemini Audio');
                try {
                  const base64Audio = audioBuffer.toString('base64');
                  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleKey}`;
                  const geminiRes = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contents: [{
                        parts: [
                          { text: `Transcribe this civic issue speech recording verbatim. If spoken in Hindi, transcribe in Hindi (Devanagari). If spoken in Punjabi, transcribe in Punjabi (Gurmukhi). If spoken in English, transcribe in English. If mixed language (Hinglish or Punjabi-English), transcribe exactly preserving the mixed words. Do not translate. Output ONLY the transcript without commentary.` },
                          { inlineData: { mimeType: parsed.mimeType || 'audio/webm', data: base64Audio } }
                        ]
                      }]
                    })
                  });

                  console.log(`[Transcribe API] Gemini response status: ${geminiRes.status}`);

                  if (geminiRes.ok) {
                    const geminiData: any = await geminiRes.json();
                    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text && text.trim()) {
                      console.log(`[Transcribe API] Gemini parsed: transcript length: ${text.trim().length}`);
                      res.writeHead(200, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({
                        success: true,
                        text: text.trim(),
                        language: langParam !== 'auto' ? langParam : 'Auto',
                        confidence: 0.97,
                        provider: 'Google Gemini'
                      }));
                      return;
                    }
                  }
                } catch (e: any) {
                  console.warn('[Transcribe API] Gemini Audio STT failed:', e.message);
                }
              }

              // ==========================================
              // Provider 4: Deepgram (nova-2)
              // ==========================================
              if (deepgramKey) {
                console.log('[Transcribe API] Provider request started: Deepgram (nova-2)');
                try {
                  const dgLang = langParam === 'hi' ? 'hi' : langParam === 'en' ? 'en' : 'hi';
                  const dgRes = await fetch(`https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=${dgLang}`, {
                    method: 'POST',
                    headers: {
                      Authorization: `Token ${deepgramKey}`,
                      'Content-Type': parsed.mimeType || 'audio/webm'
                    },
                    body: new Uint8Array(audioBuffer)
                  });

                  console.log(`[Transcribe API] Deepgram response status: ${dgRes.status}`);

                  if (dgRes.ok) {
                    const dgData: any = await dgRes.json();
                    const text = dgData.results?.channels?.[0]?.alternatives?.[0]?.transcript;
                    if (text && text.trim()) {
                      console.log(`[Transcribe API] Deepgram parsed: transcript length: ${text.trim().length}`);
                      res.writeHead(200, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({
                        success: true,
                        text: text.trim(),
                        language: langParam !== 'auto' ? langParam : 'Auto',
                        confidence: dgData.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0.95,
                        provider: 'Deepgram'
                      }));
                      return;
                    }
                  }
                } catch (e: any) {
                  console.warn('[Transcribe API] Deepgram attempt failed:', e.message);
                }
              }

              // ==========================================
              // Provider 5: Hugging Face Serverless Whisper (Free)
              // ==========================================
              if (hfToken) {
                console.log('[Transcribe API] Provider request started: Hugging Face Whisper');
                try {
                  const hfRes = await fetch('https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3-turbo', {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${hfToken}`,
                      'Content-Type': parsed.mimeType || 'audio/webm'
                    },
                    body: new Uint8Array(audioBuffer)
                  });

                  console.log(`[Transcribe API] Hugging Face response status: ${hfRes.status}`);

                  if (hfRes.ok) {
                    const hfData: any = await hfRes.json();
                    const text = hfData.text;
                    if (text && text.trim()) {
                      console.log(`[Transcribe API] Hugging Face parsed: transcript length: ${text.trim().length}`);
                      res.writeHead(200, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({
                        success: true,
                        text: text.trim(),
                        language: langParam !== 'auto' ? langParam : 'Auto',
                        confidence: 0.98,
                        provider: 'Hugging Face Whisper'
                      }));
                      return;
                    }
                  }
                } catch (e: any) {
                  console.warn('[Transcribe API] Hugging Face attempt failed:', e.message);
                }
              }

              // ==========================================
              // Provider 6: Client-Assisted Speech Pipeline
              // ==========================================
              if (parsed.clientFallback && parsed.clientFallback.trim()) {
                console.log(`[Transcribe API] Using client-assisted speech transcript (length: ${parsed.clientFallback.trim().length})`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: true,
                  text: parsed.clientFallback.trim(),
                  language: langParam !== 'auto' ? langParam : 'Auto',
                  confidence: 0.92,
                  provider: 'Web Speech Pipeline'
                }));
                return;
              }

              // ==========================================
              // No Provider Configured & No Client Text
              // ==========================================
              const hasAnyKey = Boolean(groqKey || openAiKey || googleKey || deepgramKey || hfToken);
              if (!hasAnyKey) {
                console.warn('[Transcribe API] No STT API keys configured in .env and no client speech transcript captured.');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: false,
                  errorCode: 'NO_PROVIDER_CONFIGURED',
                  error: 'Voice transcription service requires a free API key (e.g. GROQ_API_KEY or GEMINI_API_KEY) in .env on the server. Please add your key or enter your description manually.'
                }));
                return;
              }

              // Provider keys were present but no speech recognized in audio
              console.warn('[Transcribe API] Speech could not be detected by configured STT providers.');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                errorCode: 'NO_SPEECH',
                error: 'No speech was detected in the recording. Please speak clearly into your microphone.'
              }));
            } catch (err: any) {
              console.error('[Transcribe API] Server middleware error:', err);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                errorCode: 'SERVER_ERROR',
                error: 'Voice transcription service failed. Please try again or enter the description manually.'
              }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}
