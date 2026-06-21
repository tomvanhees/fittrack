// store/__tests__/prefsStore.test.ts

import { accentPresetById, ACCENT_PRESETS, DEFAULT_ACCENT_ID } from '@/constants/colors';
import { resolveAccent, usePrefsStore } from '@/store/prefsStore';

describe('accent presets', () => {
  it('lost een geldig id op naar de bijbehorende preset', () => {
    const volt = accentPresetById('volt');
    expect(volt.id).toBe('volt');
    expect(volt.accent).toBe('#19E68C');
  });

  it('valt terug op de default bij een onbekend id', () => {
    const fallback = accentPresetById('bestaat-niet');
    expect(fallback.id).toBe(DEFAULT_ACCENT_ID);
    expect(fallback).toBe(ACCENT_PRESETS[0]);
  });

  it('resolveAccent gedraagt zich identiek', () => {
    expect(resolveAccent(undefined).id).toBe(DEFAULT_ACCENT_ID);
    expect(resolveAccent('hyper').partner).toBe('#22D3EE');
  });
});

describe('prefsStore', () => {
  it('start op de default en werkt bij via setAccent', () => {
    expect(usePrefsStore.getState().accentId).toBe(DEFAULT_ACCENT_ID);
    usePrefsStore.getState().setAccent('blaze');
    expect(usePrefsStore.getState().accentId).toBe('blaze');
    // herstel
    usePrefsStore.getState().setAccent(DEFAULT_ACCENT_ID);
  });
});
