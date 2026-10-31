// Local work talks to the local relay; the published site talks to the HTTPS relay.
// Production: the endpoint of your own service, without a trailing slash.
export const apiBase = ['127.0.0.1', 'localhost'].includes(globalThis.location?.hostname)
  ? 'http://127.0.0.1:3101'
  : 'https://43.160.228.109';
