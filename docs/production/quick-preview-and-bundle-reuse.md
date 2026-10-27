# MediaOS quick previews and prebuilt Remotion bundle

This change is additive and preserves the production rendering code for LOCKED scenes.

The Remotion worker Dockerfile already executes `npm run build` during its Railway image build and includes the generated `/app/remotion-engine/build` folder. Previously `getServeUrl()` invoked `@remotion/bundler` again on the first render after a container restart. The worker now checks for the bundled `index.html` and passes that image-local folder directly to Remotion renderer. If missing, it falls back to the existing runtime bundler.

The API adds an opt-in `DRAFT` 960×540 H.264 output profile; `FAST_PREVIEW` remains 1280×720 and `REVIEW` remains full native resolution. No existing request defaults change. DRAFT currently renders the complete composition duration and is *not* a short frame-range preview; frame-range editing requires a separate contract and corresponding output-duration metadata.

Cache identity and locked render records remain unchanged. Do not remove `remotion-engine/**` from the backend's Railway watch patterns before implementing independent visual code fingerprinting. Confirm runtime logs show `Using prebuilt Remotion bundle` and complete one non-LOCKED composition after merging. The standalone isolated benchmark does not currently test this worker-specific optimization.
