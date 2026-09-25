import type { Application } from '@splinetool/runtime';
import type { RuntimeObject } from '../lib/runtimeSceneProof';

type RuntimeStatus = { tone: 'neutral' | 'working' | 'success' | 'error'; text: string };

type EpisodeSceneCompositorProps = {
  app: Application | null;
  objects: RuntimeObject[];
  ready: boolean;
  selectedUuid: string;
  currentZoom: number;
  sceneRevision: number;
  recording: boolean;
  onStartRecording: (fileBase: string) => boolean;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStatus: (status: RuntimeStatus) => void;
};

export function EpisodeSceneCompositor(props: EpisodeSceneCompositorProps) {
  void props;
  return null;
}
