/** Local dev — disable browser cache for Blossom so script ?v= bumps take effect */
module.exports = {
  server: {
    baseDir: '.',
    middleware: [
      function blossomNoCache(req, res, next) {
        if (req.url && /\/blossom(\/|$)/.test(req.url.split('?')[0])) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
        next();
      },
    ],
  },
  port: 3000,
  notify: false,
  ui: false,
  files: ['**/*'],
};