// Static host for the ThinkWell AI site: serve prebuilt Vite output.
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
