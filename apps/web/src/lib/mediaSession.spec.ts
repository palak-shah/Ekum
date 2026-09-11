import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  acquireMediaStream,
  disposeMediaSession,
  mediaAccessErrorMessage,
  releaseMediaStream,
  resetMediaSessionForTests,
  streamHasLiveTrack,
} from './mediaSession';

function fakeTrack(kind: 'video' | 'audio', readyState: MediaStreamTrackState = 'live') {
  return {
    kind,
    readyState,
    enabled: true,
    stop: vi.fn(function (this: { readyState: MediaStreamTrackState }) {
      this.readyState = 'ended';
    }),
  } as unknown as MediaStreamTrack;
}

function fakeStream(tracks: MediaStreamTrack[]): MediaStream {
  return {
    getTracks: () => tracks,
    getVideoTracks: () => tracks.filter((t) => t.kind === 'video'),
    getAudioTracks: () => tracks.filter((t) => t.kind === 'audio'),
  } as unknown as MediaStream;
}

describe('streamHasLiveTrack', () => {
  it('detects live camera tracks', () => {
    const stream = fakeStream([fakeTrack('video', 'live')]);
    expect(streamHasLiveTrack(stream, 'camera')).toBe(true);
    expect(streamHasLiveTrack(stream, 'microphone')).toBe(false);
  });
});

describe('mediaAccessErrorMessage', () => {
  it('maps permission denial for mic', () => {
    expect(mediaAccessErrorMessage({ name: 'NotAllowedError' }, 'microphone')).toBe(
      'Allow microphone to send voice.',
    );
  });
});

describe('acquireMediaStream session reuse', () => {
  afterEach(() => {
    resetMediaSessionForTests();
    vi.unstubAllGlobals();
  });

  it('calls getUserMedia once then reuses the live stream', async () => {
    const track = fakeTrack('video');
    const stream = fakeStream([track]);
    const getUserMedia = vi.fn(async () => stream);
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia },
    });

    const first = await acquireMediaStream('camera', { video: true, audio: false });
    const second = await acquireMediaStream('camera', { video: true, audio: false });

    expect(first.ok && first.reused).toBe(false);
    expect(second.ok && second.reused).toBe(true);
    expect(getUserMedia).toHaveBeenCalledTimes(1);

    releaseMediaStream('camera');
    expect(track.enabled).toBe(false);

    const third = await acquireMediaStream('camera', { video: true, audio: false });
    expect(third.ok && third.reused).toBe(true);
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    if (third.ok) {
      expect(third.stream.getVideoTracks()[0]?.enabled).toBe(true);
    }

    disposeMediaSession('camera');
    expect(track.stop).toHaveBeenCalled();
  });

  it('soft-releases microphone without disabling tracks (Safari MediaRecorder)', async () => {
    const track = fakeTrack('audio');
    const stream = fakeStream([track]);
    const getUserMedia = vi.fn(async () => stream);
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia },
    });

    await acquireMediaStream('microphone', { audio: true });
    releaseMediaStream('microphone');
    expect(track.enabled).toBe(true);

    const again = await acquireMediaStream('microphone', { audio: true });
    expect(again.ok && again.reused).toBe(true);
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(track.enabled).toBe(true);
  });
});
