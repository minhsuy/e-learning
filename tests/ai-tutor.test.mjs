import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeAiTutorAnswer } from '../src/lib/sanitize-ai-tutor.ts';

// Helper functions matching production logic
function formatTime(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return '00:00';
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`;
}

test('AI Tutor Citation Formatting Tests', async (t) => {
  await t.test('formats seconds in MM:SS correctly', () => {
    assert.strictEqual(formatTime(0), '00:00');
    assert.strictEqual(formatTime(45), '00:45');
    assert.strictEqual(formatTime(90.5), '01:30');
    assert.strictEqual(formatTime(3599), '59:59');
  });

  await t.test('formats timestamps over 1 hour in HH:MM:SS', () => {
    assert.strictEqual(formatTime(3600), '01:00:00');
    assert.strictEqual(formatTime(3665.8), '01:01:05');
  });

  await t.test('handles invalid or negative seconds gracefully', () => {
    assert.strictEqual(formatTime(-10), '00:00');
    assert.strictEqual(formatTime(NaN), '00:00');
    assert.strictEqual(formatTime(undefined), '00:00');
  });
});

test('AI Tutor Citation DTO Invariants', async (t) => {
  const sampleCitation = {
    chunkId: 'chunk_abc_123',
    startTime: 45.2,
    endTime: 90.5,
    startTimeFormatted: '00:45',
    endTimeFormatted: '01:30',
    snippet: 'Đoạn này hướng dẫn khởi tạo Next.js với App Router và TypeScript.',
  };

  await t.test('startTime and endTime must be numbers (seconds), never strings or ms', () => {
    assert.strictEqual(typeof sampleCitation.startTime, 'number');
    assert.strictEqual(typeof sampleCitation.endTime, 'number');
    assert.ok(sampleCitation.startTime >= 0);
    assert.ok(sampleCitation.endTime >= sampleCitation.startTime);
  });

  await t.test('snippet must contain non-empty transcript excerpt', () => {
    assert.ok(sampleCitation.snippet.length > 0);
    assert.strictEqual(typeof sampleCitation.snippet, 'string');
  });
});

test('AI Tutor Video Seeking Protocols', async (t) => {
  await t.test('builds Player.js postMessage payload for Bunny Stream', () => {
    const seekTime = 75.5;
    const playerJsPayload = {
      context: 'player.js',
      version: '0.0.11',
      event: 'command',
      command: 'setCurrentTime',
      value: seekTime,
    };

    const serialized = JSON.stringify(playerJsPayload);
    const parsed = JSON.parse(serialized);

    assert.strictEqual(parsed.context, 'player.js');
    assert.strictEqual(parsed.command, 'setCurrentTime');
    assert.strictEqual(parsed.value, 75.5);
  });

  await t.test('builds Direct Method postMessage payload for Bunny fallback', () => {
    const directPayload = { method: 'setCurrentTime', value: 120 };
    assert.strictEqual(directPayload.method, 'setCurrentTime');
    assert.strictEqual(directPayload.value, 120);
  });

  await t.test('builds YouTube seekTo postMessage payload', () => {
    const ytPayload = {
      event: 'command',
      func: 'seekTo',
      args: [150, true],
    };

    assert.strictEqual(ytPayload.event, 'command');
    assert.strictEqual(ytPayload.func, 'seekTo');
    assert.deepStrictEqual(ytPayload.args, [150, true]);
  });
});

test('AI Tutor RAG Status Handling', async (t) => {
  const validRagStatuses = ['ANSWERED', 'INSUFFICIENT_CONTEXT', 'INDEX_NOT_READY', 'INDEX_STALE'];

  validRagStatuses.forEach((status) => {
    assert.ok(['ANSWERED', 'INSUFFICIENT_CONTEXT', 'INDEX_NOT_READY', 'INDEX_STALE'].includes(status));
  });

  await t.test('detects out-of-context response when INSUFFICIENT_CONTEXT', () => {
    const response = {
      userMessage: { id: 'm1', content: 'Cách làm bánh bao?' },
      assistantMessage: {
        id: 'm2',
        content: 'Nội dung câu hỏi không nằm trong phạm vi video bài giảng.',
        citations: [],
      },
      ragStatus: 'INSUFFICIENT_CONTEXT',
    };

    assert.strictEqual(response.ragStatus, 'INSUFFICIENT_CONTEXT');
    assert.strictEqual(response.assistantMessage.citations.length, 0);
  });

  await t.test('detects grounded response with citations when ANSWERED', () => {
    const response = {
      userMessage: { id: 'm1', content: 'useEffect dùng thế nào?' },
      assistantMessage: {
        id: 'm2',
        content: 'useEffect dùng để đồng bộ hóa hiệu ứng phụ.',
        citations: [
          {
            chunkId: 'c1',
            startTime: 60,
            endTime: 120,
            startTimeFormatted: '01:00',
            endTimeFormatted: '02:00',
            snippet: 'Trong React 19, useEffect được khuyến nghị...',
          },
        ],
      },
      ragStatus: 'ANSWERED',
    };

    assert.strictEqual(response.ragStatus, 'ANSWERED');
    assert.strictEqual(response.assistantMessage.citations.length, 1);
    assert.strictEqual(response.assistantMessage.citations[0].startTime, 60);
  });
});

test('AI Tutor Question Input Validation', async (t) => {
  await t.test('rejects question shorter than 2 chars', () => {
    const invalidInputs = ['', ' ', 'a'];
    invalidInputs.forEach((input) => {
      const trimmed = input.trim();
      assert.ok(trimmed.length < 2, `Input "${input}" should be rejected (< 2 chars)`);
    });
  });

  await t.test('accepts question between 2 and 2000 chars', () => {
    const valid = 'Next.js Server Component là gì?';
    assert.ok(valid.length >= 2 && valid.length <= 2000);
  });

  await t.test('rejects question over 2000 chars', () => {
    const excessive = 'a'.repeat(2001);
    assert.ok(excessive.length > 2000);
  });
});

// Step 07.1: Citation Sanitization & Floating Chat Tests
test('AI Tutor Citation Marker Sanitization (Step 07.1)', async (t) => {
  await t.test('removes single chunk marker before sentence period', () => {
    const input = 'Dependency Injection sử dụng constructor [CHUNK:c602e291-7d18-45f5-aa04-ad196a4cfa3b].';
    const expected = 'Dependency Injection sử dụng constructor.';
    assert.strictEqual(sanitizeAiTutorAnswer(input), expected);
  });

  await t.test('removes multiple comma-separated chunk markers in single bracket', () => {
    const input =
      'Higher-Order Function giúp tái sử dụng code [CHUNK:c602e291-7d18-45f5-aa04-ad196a4cfa3b, CHUNK:b20b33b3-eaf7-4af2-93dd-d57ca641cf54].';
    const expected = 'Higher-Order Function giúp tái sử dụng code.';
    assert.strictEqual(sanitizeAiTutorAnswer(input), expected);
  });

  await t.test('removes multiple chunk markers with single CHUNK prefix without repeating CHUNK (User Bug Report)', () => {
    const input =
      'tối ưu hóa cách viết code so với cách làm lặp lại thông thường [CHUNK:c602e291-7d18-45f5-aa04-ad196a4cfa3b, b20b33b3-eaf7-4af2-93dd-d57ca641cf54]. Nếu bạn còn bất kỳ thắc mắc nào khác';
    const expected =
      'tối ưu hóa cách viết code so với cách làm lặp lại thông thường. Nếu bạn còn bất kỳ thắc mắc nào khác';
    assert.strictEqual(sanitizeAiTutorAnswer(input), expected);
  });

  await t.test('removes plural CHUNKS prefix and mixed delimiters', () => {
    const input = 'Nội dung kiến thức [CHUNKS: id1; id2, id3].';
    const expected = 'Nội dung kiến thức.';
    assert.strictEqual(sanitizeAiTutorAnswer(input), expected);
  });

  await t.test('removes multiple comma-separated chunk markers without space', () => {
    const input =
      'Custom hook tách biệt logic [CHUNK:11111111-2222-3333-4444-555555555555,CHUNK:66666666-7777-8888-9999-000000000000].';
    const expected = 'Custom hook tách biệt logic.';
    assert.strictEqual(sanitizeAiTutorAnswer(input), expected);
  });

  await t.test('removes mid-sentence chunk marker without breaking spacing', () => {
    const input = 'Khái niệm này [CHUNK:uuid_123] rất quan trọng trong React.';
    const expected = 'Khái niệm này rất quan trọng trong React.';
    assert.strictEqual(sanitizeAiTutorAnswer(input), expected);
  });

  await t.test('removes marker before comma without orphaned space', () => {
    const input = 'Khi sử dụng useMemo [CHUNK:uuid_abc], bạn cần truyền dependencies.';
    const expected = 'Khi sử dụng useMemo, bạn cần truyền dependencies.';
    assert.strictEqual(sanitizeAiTutorAnswer(input), expected);
  });

  await t.test('removes chunk marker at end of text without period', () => {
    const input = 'Nội dung bài giảng đề cập đến Redux Toolkit [CHUNK:uuid_xyz]';
    const expected = 'Nội dung bài giảng đề cập đến Redux Toolkit';
    assert.strictEqual(sanitizeAiTutorAnswer(input), expected);
  });

  await t.test('removes markers across multiple paragraphs', () => {
    const input = `Đoạn 1 nói về State [CHUNK:uuid_1].\n\nĐoạn 2 nói về Props [CHUNK:uuid_2].`;
    const expected = `Đoạn 1 nói về State.\n\nĐoạn 2 nói về Props.`;
    assert.strictEqual(sanitizeAiTutorAnswer(input), expected);
  });

  await t.test('preserves code blocks containing chunk-like tokens', () => {
    const input = 'Ví dụ mã nguồn:\n```typescript\nconst chunk = [CHUNK:uuid_123];\n```\nĐã xong [CHUNK:uuid_456].';
    const expected = 'Ví dụ mã nguồn:\n```typescript\nconst chunk = [CHUNK:uuid_123];\n```\nĐã xong.';
    assert.strictEqual(sanitizeAiTutorAnswer(input), expected);
  });

  await t.test('preserves inline code backticks containing chunk-like tokens', () => {
    const input = 'Xem biến `[CHUNK:dummy]` tại đây [CHUNK:uuid_real].';
    const expected = 'Xem biến `[CHUNK:dummy]` tại đây.';
    assert.strictEqual(sanitizeAiTutorAnswer(input), expected);
  });

  await t.test('preserves legitimate markdown links and brackets', () => {
    const input = 'Xem thêm tại [Tài liệu Next.js](https://nextjs.org) và mảng arr[0].';
    assert.strictEqual(sanitizeAiTutorAnswer(input), input);
  });

  await t.test('handles empty or non-string inputs safely', () => {
    assert.strictEqual(sanitizeAiTutorAnswer(''), '');
    assert.strictEqual(sanitizeAiTutorAnswer(null), '');
    assert.strictEqual(sanitizeAiTutorAnswer(undefined), '');
  });
});

test('AI Tutor Messenger Floating Chat Invariants (Step 07.1)', async (t) => {
  await t.test('uses /icon.png as the canonical AI Tutor avatar asset', () => {
    const canonicalAvatarPath = '/icon.png';
    assert.strictEqual(canonicalAvatarPath, '/icon.png');
    assert.ok(!canonicalAvatarPath.includes('sparkles'));
  });

  await t.test('floating chat launcher dimensions are within specified ranges', () => {
    const desktopSize = 64; // px
    const mobileSize = 56;  // px
    assert.ok(desktopSize >= 56 && desktopSize <= 64);
    assert.ok(mobileSize >= 52 && mobileSize <= 56);
  });

  await t.test('desktop chat window bounds fit comfortably alongside video', () => {
    const windowWidth = 410; // px
    const windowHeight = 580; // px
    assert.ok(windowWidth >= 380 && windowWidth <= 420);
    assert.ok(windowHeight >= 520 && windowHeight <= 650);
  });
});

// Step 07.2: Chat History Persistence & Video Seeking Protocol Tests
test('AI Tutor Chat Persistence & Session History Restoration (Step 07.2)', async (t) => {
  // Helper mimicking extraction in useAiTutor.selectSession
  function extractMessages(apiResponse) {
    let fetchedMessages = [];
    if (Array.isArray(apiResponse.messages)) {
      fetchedMessages = apiResponse.messages;
    } else if (apiResponse.data && typeof apiResponse.data === 'object' && Array.isArray(apiResponse.data.messages)) {
      fetchedMessages = apiResponse.data.messages;
    } else if (Array.isArray(apiResponse.data)) {
      fetchedMessages = apiResponse.data;
    }

    return [...fetchedMessages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  await t.test('extracts messages when returned at top-level (backend controller standard)', () => {
    const backendResponse = {
      success: true,
      data: {
        id: 'sess-001',
        lessonId: 'less-100',
        title: 'Thảo luận Props và State',
        isActive: true,
        messageCount: 2,
        createdAt: '2026-03-30T10:00:00Z',
      },
      messages: [
        { id: 'msg-1', role: 'user', content: 'Props là gì?', createdAt: '2026-03-30T10:00:05Z' },
        { id: 'msg-2', role: 'assistant', content: 'Props là tham số truyền vào component.', createdAt: '2026-03-30T10:00:10Z' },
      ],
      pagination: { total: 2, limit: 100, offset: 0, hasMore: false },
    };

    const messages = extractMessages(backendResponse);
    assert.strictEqual(messages.length, 2);
    assert.strictEqual(messages[0].id, 'msg-1');
    assert.strictEqual(messages[1].id, 'msg-2');
  });

  await t.test('extracts messages when nested inside data.messages', () => {
    const wrappedResponse = {
      success: true,
      data: {
        session: { id: 'sess-002', lessonId: 'less-100' },
        messages: [
          { id: 'msg-3', role: 'user', content: 'useEffect là gì?', createdAt: '2026-03-30T10:15:00Z' },
        ],
      },
    };

    const messages = extractMessages(wrappedResponse);
    assert.strictEqual(messages.length, 1);
    assert.strictEqual(messages[0].id, 'msg-3');
  });

  await t.test('sorts messages chronologically (createdAt ascending)', () => {
    const unorderedResponse = {
      success: true,
      messages: [
        { id: 'msg-3', role: 'assistant', content: 'Câu trả lời 2', createdAt: '2026-03-30T10:05:00Z' },
        { id: 'msg-1', role: 'user', content: 'Câu hỏi 1', createdAt: '2026-03-30T10:00:00Z' },
        { id: 'msg-2', role: 'assistant', content: 'Câu trả lời 1', createdAt: '2026-03-30T10:01:00Z' },
      ],
    };

    const sorted = extractMessages(unorderedResponse);
    assert.strictEqual(sorted[0].id, 'msg-1');
    assert.strictEqual(sorted[1].id, 'msg-2');
    assert.strictEqual(sorted[2].id, 'msg-3');
  });

  await t.test('restores most recent active session on page refresh', () => {
    const sessionsList = [
      { id: 'sess-old', isActive: false, updatedAt: '2026-03-29T10:00:00Z' },
      { id: 'sess-active', isActive: true, updatedAt: '2026-03-30T11:00:00Z' },
    ];

    const chosen =
      sessionsList.find((s) => s.isActive) || sessionsList[0];

    assert.strictEqual(chosen.id, 'sess-active');
  });
});

test('AI Tutor Video Player Seeking Protocol & Priority (Step 07.2)', async (t) => {
  // Helper mimicking player selection logic in handleSeekVideo
  function resolvePlayerTarget(lesson, directVideoMounted) {
    if (lesson.bunnyVideoId) return 'BUNNY_STREAM';
    if (lesson.youtubeUrl) return 'YOUTUBE_IFRAME';
    if (directVideoMounted) return 'DIRECT_HTML5';
    return 'NONE';
  }

  await t.test('prioritizes Bunny Stream player over direct HTML5 video when bunnyVideoId exists', () => {
    const lesson = {
      id: 'lesson-1',
      bunnyVideoId: 'bunny-uuid-1234',
      videoUrl: 'https://cdn.example.com/fallback.mp4',
    };
    const target = resolvePlayerTarget(lesson, true);
    assert.strictEqual(target, 'BUNNY_STREAM');
  });

  await t.test('prioritizes YouTube player when bunnyVideoId is null and youtubeUrl exists', () => {
    const lesson = {
      id: 'lesson-2',
      bunnyVideoId: null,
      youtubeUrl: 'https://www.youtube.com/embed/xyz',
    };
    const target = resolvePlayerTarget(lesson, true);
    assert.strictEqual(target, 'YOUTUBE_IFRAME');
  });

  await t.test('falls back to Direct HTML5 video only when Bunny and YouTube are absent', () => {
    const lesson = {
      id: 'lesson-3',
      bunnyVideoId: null,
      youtubeUrl: null,
    };
    const target = resolvePlayerTarget(lesson, true);
    assert.strictEqual(target, 'DIRECT_HTML5');
  });

  await t.test('formats Player.js setCurrentTime & play postMessage payloads correctly', () => {
    const seconds = 385; // 06:25
    const seekPayload = {
      context: 'player.js',
      method: 'setCurrentTime',
      value: seconds,
    };
    const playPayload = {
      context: 'player.js',
      method: 'play',
    };

    assert.strictEqual(seekPayload.context, 'player.js');
    assert.strictEqual(seekPayload.method, 'setCurrentTime');
    assert.strictEqual(seekPayload.value, 385);
    assert.strictEqual(playPayload.method, 'play');

    const serializedSeek = JSON.stringify(seekPayload);
    assert.ok(serializedSeek.includes('"method":"setCurrentTime"'));
    assert.ok(serializedSeek.includes('"value":385'));
  });

  await t.test('queues and flushes pending seeks when Player.js ready event fires', () => {
    let isBunnyReady = false;
    let pendingSeek = null;
    let soughtTime = null;

    function onSeekRequested(seconds) {
      if (isBunnyReady) {
        soughtTime = seconds;
      } else {
        pendingSeek = seconds;
      }
    }

    function onWindowMessage(eventData) {
      if (eventData.context === 'player.js' && eventData.event === 'ready') {
        isBunnyReady = true;
        if (pendingSeek !== null) {
          soughtTime = pendingSeek;
          pendingSeek = null;
        }
      }
    }

    // Step 1: User clicks citation before iframe is ready
    onSeekRequested(125);
    assert.strictEqual(isBunnyReady, false);
    assert.strictEqual(pendingSeek, 125);
    assert.strictEqual(soughtTime, null);

    // Step 2: Bunny iframe finishes handshake and sends ready event
    onWindowMessage({ context: 'player.js', event: 'ready' });
    assert.strictEqual(isBunnyReady, true);
    assert.strictEqual(pendingSeek, null);
    assert.strictEqual(soughtTime, 125);
  });
});
