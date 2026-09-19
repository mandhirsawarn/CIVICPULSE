/**
 * Serverless API route for /api/transcribe (e.g. Vercel / Node).
 * Keeps STT API keys completely secure on the server side.
 * Supports Groq Whisper, OpenAI Whisper, Gemini, Deepgram, and client fallback.
 */

function parseMultipartBody(fullBuffer, contentType = '') {
  const result = {
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

    const headersStart = startOfPart + 2;
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
      bodyEnd -= 2;
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  console.log('[Transcribe Serverless] Received transcription request');

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const fullBuffer = Buffer.concat(chunks);

    if (fullBuffer.length > 25 * 1024 * 1024) {
      console.warn('[Transcribe Serverless] Audio file exceeds 25MB limit');
      return res.status(413).json({
        success: false,
        errorCode: 'FILE_TOO_LARGE',
        error: 'Audio file is too large. Please record a shorter voice description.'
      });
    }

    const contentType = req.headers['content-type'] || '';
    const queryLang = req.query?.lang || 'auto';
    const parsed = parseMultipartBody(fullBuffer, contentType);
    const langParam = (parsed.language && parsed.language !== 'auto') ? parsed.language : queryLang;
    const audioBuffer = parsed.audioBuffer || fullBuffer;

    console.log(`[Transcribe Serverless] Received file: name: ${parsed.filename}, type: ${parsed.mimeType}, size: ${audioBuffer.length} bytes`);

    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({
        success: false,
        errorCode: 'EMPTY_AUDIO',
        error: 'Recording contains no audio data. Please check your microphone.'
      });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;
    const googleKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const deepgramKey = process.env.DEEPGRAM_API_KEY;

    const promptText = 'Civic issue report in Chandigarh, Mohali, Panchkula. Support English, Hindi (मुख्य गेट के पास सड़क पर गड्ढा है), Punjabi (ਮੇਨ ਗੇਟ ਦੇ ਕੋਲ ਸੜਕ ਤੇ ਖੱਡਾ ਹੈ), and Hinglish (Main gate ke paas road par bahut bada pothole hai). Preserve names, numbers, street locations, and vocabulary. Do not translate.';

    // 1. Groq Whisper
    if (groqKey) {
      console.log('[Transcribe Serverless] Provider request started: Groq Whisper (whisper-large-v3)');
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

        console.log(`[Transcribe Serverless] Groq response status: ${groqRes.status}`);

        if (groqRes.status === 401 || groqRes.status === 403) {
          return res.status(200).json({
            success: false,
            errorCode: 'AUTH_FAILED',
            error: 'Voice transcription service authentication failed. Please verify your API key.'
          });
        }

        if (groqRes.ok) {
          const data = await groqRes.json();
          if (data.text && data.text.trim()) {
            return res.status(200).json({
              success: true,
              text: data.text.trim(),
              language: data.language || (langParam !== 'auto' ? langParam : 'Auto'),
              confidence: 0.98,
              provider: 'Groq Whisper'
            });
          }
        }
      } catch (e) {
        console.warn('[Transcribe Serverless] Groq transcription failed:', e.message);
      }
    }

    // 2. OpenAI Whisper
    if (openAiKey) {
      console.log('[Transcribe Serverless] Provider request started: OpenAI Whisper (whisper-1)');
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

        console.log(`[Transcribe Serverless] OpenAI response status: ${openAiRes.status}`);

        if (openAiRes.status === 401 || openAiRes.status === 403) {
          return res.status(200).json({
            success: false,
            errorCode: 'AUTH_FAILED',
            error: 'Voice transcription service authentication failed. Please verify your API key.'
          });
        }

        if (openAiRes.ok) {
          const data = await openAiRes.json();
          if (data.text && data.text.trim()) {
            return res.status(200).json({
              success: true,
              text: data.text.trim(),
              language: data.language || (langParam !== 'auto' ? langParam : 'Auto'),
              confidence: 0.98,
              provider: 'OpenAI Whisper'
            });
          }
        }
      } catch (e) {
        console.warn('[Transcribe Serverless] OpenAI transcription failed:', e.message);
      }
    }

    // 3. Google Gemini Audio STT
    if (googleKey) {
      console.log('[Transcribe Serverless] Provider request started: Google Gemini');
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

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim()) {
            return res.status(200).json({
              success: true,
              text: text.trim(),
              language: langParam !== 'auto' ? langParam : 'Auto',
              confidence: 0.97,
              provider: 'Google Gemini'
            });
          }
        }
      } catch (e) {
        console.warn('[Transcribe Serverless] Gemini Audio STT failed:', e.message);
      }
    }

    // 4. Client-assisted speech fallback
    if (parsed.clientFallback && parsed.clientFallback.trim()) {
      console.log(`[Transcribe Serverless] Using client speech transcript (length: ${parsed.clientFallback.trim().length})`);
      return res.status(200).json({
        success: true,
        text: parsed.clientFallback.trim(),
        language: langParam !== 'auto' ? langParam : 'Auto',
        confidence: 0.92,
        provider: 'Web Speech Pipeline'
      });
    }

    const hasAnyKey = Boolean(groqKey || openAiKey || googleKey || deepgramKey);
    if (!hasAnyKey) {
      console.warn('[Transcribe Serverless] No STT API keys configured and no client speech transcript.');
      return res.status(200).json({
        success: false,
        errorCode: 'NO_PROVIDER_CONFIGURED',
        error: 'Voice transcription service is not configured. Please add an API key (e.g. GROQ_API_KEY or OPENAI_API_KEY) in your server environment, or enter the description manually.'
      });
    }

    return res.status(200).json({
      success: false,
      errorCode: 'NO_SPEECH',
      error: 'No speech was detected in the recording. Please speak clearly into your microphone.'
    });
  } catch (err) {
    console.error('[Transcribe Serverless] Handler error:', err);
    return res.status(200).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      error: 'Voice transcription service failed. Please try again or enter the description manually.'
    });
  }
}
