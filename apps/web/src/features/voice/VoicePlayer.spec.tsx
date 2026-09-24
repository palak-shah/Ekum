import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VoicePlayer } from './VoicePlayer';

class SilentAudio {
  controls = false;
  preload = '';
  src = '';
  paused = true;
  currentTime = 0;
  addEventListener() {}
  removeEventListener() {}
  pause() {}
  load() {}
  removeAttribute() {}
  setAttribute() {}
  play() {
    return Promise.resolve();
  }
}

describe('VoicePlayer (BM-10)', () => {
  it('does not mount a DOM audio element Android can restyle', () => {
    vi.stubGlobal('Audio', SilentAudio);
    const { container } = render(
      <VoicePlayer src="https://example.com/note.webm" durationMs={5000} />,
    );
    expect(container.querySelector('audio')).toBeNull();
    expect(screen.getByTestId('voice-play')).toBeInTheDocument();
    expect(screen.getByTestId('voice-progress')).toBeInTheDocument();
    expect(screen.getByText('0:05')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
