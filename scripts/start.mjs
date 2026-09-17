// The production start on a platform that builds with Railpack (CranL, ADR-025 amended):
// the standalone server bound to every interface on the platform's port. Docker sets
// HOSTNAME to the container id, which Next would bind to instead of 0.0.0.0.
process.env['HOSTNAME'] = '0.0.0.0';
process.env['PORT'] ??= '3000';
await import('../.next/standalone/server.js');
