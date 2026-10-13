export const SHOT03_FPS = 30;
export const SHOT03_DURATION_SECONDS = 53;
export const SHOT03_DURATION_FRAMES = SHOT03_FPS * SHOT03_DURATION_SECONDS;

const f = (seconds: number) => Math.round(seconds * SHOT03_FPS);

export const SHOT03 = {
  reaffirm: {
    request: f(2.0),
    payload: f(3.7),
    headers: f(5.4),
    context: f(7.8),
  },
  camera: {
    widenStart: f(11.2),
    widenEnd: f(34.0),
  },
  insight: {
    readyNotReceived: f(13.2),
    clientSide: f(20.6),
    spinner: f(24.5),
    disabled: f(27.4),
    network: f(34.0),
    gateway: f(39.4),
    balancer: f(41.2),
    auth: f(43.0),
    database: f(44.8),
    conclusion: f(50.2),
  },
} as const;
