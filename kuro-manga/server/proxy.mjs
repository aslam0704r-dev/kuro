const hosts = ['mangaread.org', 'mgeko.cc', 'imgsrv5.com', 'api.mangaupdates.com', 'cdn.mangaupdates.com', 'mangakatana.com', 'mangapill.com', 'cdn.readdetectiveconan.com', 'webtoons.com', 'webtoon-phinf.pstatic.net', 'swebtoon-phinf.pstatic.net', 'kitsu.io', 'media.kitsu.app', 'weebcentral.com', 'planeptune.us', 'compsci88.com', 'uploads.mangadex.org'];

export function permitted(url) {
  return url.protocol === 'https:' && !url.username && !url.password &&
    (!url.port || url.port === '443') &&
    hosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`));
}


// The former arbitrary provider proxy bypassed rating admission. All manga
// metadata and artwork now go through the mandatory catalogue service.
export async function proxy(req,res) {
 res.writeHead(403,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
 res.end('Strict content rules require an approved manga. Use KURO catalogue delivery.');
}
