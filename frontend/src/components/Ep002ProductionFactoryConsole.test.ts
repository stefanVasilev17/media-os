import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {Ep002VerifiedPreviewRenderStage} from './Ep002ProductionFactoryConsole';

describe('EP002 production render stage',()=>{
  it('shows SHOT01 first in the same render stage as SHOT02 to SHOT11',()=>{
    const html=renderToStaticMarkup(createElement(Ep002VerifiedPreviewRenderStage,{refreshToken:0}));
    expect(html).toContain('Remotion Scene Blueprint · SHOT01');
    expect(html).toContain('Remotion Scene Blueprint · SHOT01 — Render video');
    expect(html).toContain('Checking…');
    expect(html).toContain('SHOT02 — 1080p Voice-Synced Preview');
    expect(html).toContain('SHOT11');
    expect(html.indexOf('Remotion Scene Blueprint · SHOT01'))
      .toBeLessThan(html.indexOf('SHOT02 — 1080p Voice-Synced Preview'));
    expect(html).toMatch(/<details[^>]*open/);
  });
});
