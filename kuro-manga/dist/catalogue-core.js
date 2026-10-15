(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // <define:__KURO_BOOTSTRAP_PROVIDERS__>
  var define_KURO_BOOTSTRAP_PROVIDERS_default;
  var init_define_KURO_BOOTSTRAP_PROVIDERS = __esm({
    "<define:__KURO_BOOTSTRAP_PROVIDERS__>"() {
      define_KURO_BOOTSTRAP_PROVIDERS_default = [{ id: "webtoon", name: "WEBTOON", adapter: "legacy", mode: "legacy", website: "https://www.webtoons.com/en/", language: "en", readable: false, defaultEnabled: false, available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "mangabaka", name: "MangaBaka", adapter: "metadata", mode: "metadata", website: "https://mangabaka.org/", language: "en", readable: false, defaultEnabled: false, available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "anilist", name: "AniList", adapter: "metadata", mode: "metadata", website: "https://anilist.co/", language: "en", readable: false, defaultEnabled: false, available: true, contentPolicy: { state: "eligible", reason: "supported-rating-contract", version: "strict-1" } }, { id: "kitsu", name: "Kitsu", adapter: "legacy", mode: "legacy", website: "https://kitsu.app/", language: "en", readable: false, defaultEnabled: false, available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "jikan", name: "Jikan", adapter: "metadata", mode: "metadata", website: "https://jikan.moe/", language: "en", readable: false, defaultEnabled: false, available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "mangaupdates", name: "MangaUpdates", adapter: "legacy", mode: "legacy", website: "https://www.mangaupdates.com/", language: "en", readable: false, defaultEnabled: false, available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "shikimori", name: "Shikimori", adapter: "metadata", mode: "metadata", website: "https://shikimori.io/", language: "en", readable: false, defaultEnabled: false, available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "mangadex", name: "MangaDex", adapter: "legacy", mode: "legacy", website: "https://mangadex.org/", language: "en", readable: true, defaultEnabled: false, available: true, contentPolicy: { state: "eligible", reason: "supported-rating-contract", version: "strict-1" } }, { id: "mangakatana", name: "MangaKatana", adapter: "legacy", mode: "legacy", website: "https://mangakatana.com/", language: "en", readable: true, defaultEnabled: false, available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "mangapill", name: "MangaPill", adapter: "legacy", mode: "legacy", website: "https://mangapill.com/", language: "en", readable: true, defaultEnabled: false, available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "mangaread", name: "MangaRead", adapter: "legacy", mode: "legacy", website: "https://www.mangaread.org/", language: "en", readable: true, defaultEnabled: false, available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "mgeko", name: "Mgeko", adapter: "legacy", mode: "legacy", website: "https://www.mgeko.cc/", language: "en", readable: true, defaultEnabled: false, available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "manhuaplus", name: "ManhuaPlus", adapter: "madara", mode: "reader", website: "https://manhuaplus.com/", language: "en", readable: true, defaultEnabled: true, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "manhuatop", name: "ManhuaTop", adapter: "madara", mode: "reader", website: "https://manhuatop.org/", language: "en", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "weebcentral", name: "WeebCentral", adapter: "legacy", mode: "legacy", website: "https://weebcentral.com/", language: "en", readable: true, defaultEnabled: false, available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "kingofshojo", name: "King of Shojo", adapter: "themesia", mode: "reader", website: "https://kingofshojo.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "toonily", name: "Toonily", adapter: "madara", mode: "reader", website: "https://toonily.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "asurascans", name: "Asura Scans", adapter: "asura", mode: "reader", website: "https://asurascans.com/", language: "en", readable: true, defaultEnabled: true, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "arenascan", name: "Arena Scan", adapter: "themesia", mode: "reader", website: "https://arenascan.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "UNKNOWN", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "dynasty", name: "Dynasty Scans", adapter: "dynasty", mode: "reader", website: "https://dynasty-scans.com/", language: "en", readable: true, defaultEnabled: false, available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "thunderscans", name: "Thunder Scans", adapter: "themesia", mode: "reader", website: "https://en-thunderscans.com/", language: "en", readable: true, defaultEnabled: true, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "flamecomics", name: "Flame Comics", adapter: "flame", mode: "reader", website: "https://flamecomics.xyz/", language: "en", readable: true, defaultEnabled: true, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "galaxydegenscans", name: "GalaxyDegenScans", adapter: "madara", mode: "reader", website: "https://gdscans.com/", language: "en", readable: true, defaultEnabled: true, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "guya", name: "Guya.moe", adapter: "guya", mode: "reader", website: "https://guya.cubari.moe/", language: "en", readable: true, defaultEnabled: true, available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "lagoonscans", name: "Lagoon Scans", adapter: "themesia", mode: "reader", website: "https://lagoonscans.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "lhtranslation", name: "LHTranslation", adapter: "madara", mode: "reader", website: "https://lhtranslation.net/", language: "en", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "madarascans", name: "Madara Scans", adapter: "themesia", mode: "reader", website: "https://madarascans.net/", language: "en", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "ravenscans", name: "Raven Scans", adapter: "themesia", mode: "reader", website: "https://ravenscans.org/", language: "en", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "rokaricomics", name: "Rokari Comics", adapter: "themesia", mode: "reader", website: "https://rokaricomics.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "sanascans", name: "Sana Scans", adapter: "iken", mode: "reader", website: "https://sanascans.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "tritiniascans", name: "Tritinia Scans", adapter: "madara", mode: "reader", website: "https://tritinia.org/", language: "en", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "vortexscans", name: "Vortex Scans", adapter: "iken", mode: "reader", website: "https://vortexscans.org/", language: "en", readable: true, defaultEnabled: true, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "ksgroup", name: "KS Group", adapter: "madara", mode: "reader", website: "https://ksgroupscans.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "UNKNOWN", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "kenscans", name: "Kenscans", adapter: "iken", mode: "reader", website: "https://kencomics.com/", language: "en", readable: true, defaultEnabled: true, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "anisascans", name: "Anisa Scans", adapter: "madara", mode: "reader", website: "https://anisascans.in/", language: "en", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "asterscans", name: "Aster Scans", adapter: "themesia", mode: "reader", website: "https://asterscans.com/", language: "en", readable: true, defaultEnabled: true, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "3asq", name: "3asq", adapter: "madara", mode: "reader", website: "https://3asq.online/", language: "ar", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "azoramoon", name: "AzoraMoon", adapter: "iken", mode: "reader", website: "https://azorafly.com/", language: "ar", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "tortuga", name: "Tortuga \xC7eviri", adapter: "madara", mode: "reader", website: "https://tortugaceviri.com/", language: "tr", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "aarlas", name: "Aarlas", adapter: "blogger", mode: "reader", website: "https://www.arlas.online/", language: "id", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "akazascans", name: "Akaza Scans", adapter: "themesia", mode: "reader", website: "https://akazascans.org/", language: "en", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "anikiga", name: "Anikiga", adapter: "madara", mode: "reader", website: "https://anikiga.com/", language: "tr", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "apcomics", name: "AP Comics", adapter: "madara", mode: "reader", website: "https://apcomics.org/", language: "en", readable: true, defaultEnabled: false, contentWarning: "NSFW", available: false, contentPolicy: { state: "blocked", reason: "adult-source", version: "strict-1" } }, { id: "apollcomics", name: "ApollComics", adapter: "madara", mode: "reader", website: "https://apollcomics.es/", language: "es", readable: true, defaultEnabled: false, contentWarning: "NSFW", available: false, contentPolicy: { state: "blocked", reason: "adult-source", version: "strict-1" } }, { id: "arbxcomix", name: "ArbxComix", adapter: "madara", mode: "reader", website: "https://arbxcomix.com/", language: "ar", readable: true, defaultEnabled: false, contentWarning: "NSFW", available: false, contentPolicy: { state: "blocked", reason: "adult-source", version: "strict-1" } }, { id: "borutoexplorer", name: "Boruto Explorer", adapter: "madara", mode: "reader", website: "https://leitor.borutoexplorer.com.br/", language: "pt-BR", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "bymichiscan", name: "Bymichi Scan", adapter: "themesia", mode: "reader", website: "https://bymichiby.com/", language: "es", readable: true, defaultEnabled: false, contentWarning: "NSFW", available: false, contentPolicy: { state: "blocked", reason: "adult-source", version: "strict-1" } }, { id: "cafecomyaoi", name: "Caf\xE9 com Yaoi", adapter: "madara", mode: "reader", website: "https://cafecomyaoi.com.br/", language: "pt-BR", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "cocomic", name: "Cocomic", adapter: "madara", mode: "reader", website: "https://cocomic.co/", language: "en", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "cucumbermanga", name: "Cucumber Manga", adapter: "madara", mode: "reader", website: "https://cucumbermanga.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "NSFW", available: false, contentPolicy: { state: "blocked", reason: "adult-source", version: "strict-1" } }, { id: "darkroomfansub", name: "Dark Room Fansub", adapter: "blogger", mode: "reader", website: "https://lector-darkroomfansub.blogspot.com/", language: "es", readable: true, defaultEnabled: false, contentWarning: "NSFW", available: false, contentPolicy: { state: "blocked", reason: "adult-source", version: "strict-1" } }, { id: "datgarscan", name: "Dat-Gar Scan", adapter: "blogger", mode: "reader", website: "https://datgarscanlation.blogspot.com/", language: "es", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "decadencescans", name: "Decadence Scans", adapter: "madara", mode: "reader", website: "https://reader.decadencescans.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "euphoriascan", name: "Euphoria Scan", adapter: "madara", mode: "reader", website: "https://euphoriascan.com/", language: "pt-BR", readable: true, defaultEnabled: false, contentWarning: "NSFW", available: false, contentPolicy: { state: "blocked", reason: "adult-source", version: "strict-1" } }, { id: "gakamangas", name: "GakaMangas", adapter: "madara", mode: "reader", website: "https://gakamangas.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "gedecomix", name: "GEDE Comix", adapter: "madara", mode: "reader", website: "https://gedecomix.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "NSFW", available: false, contentPolicy: { state: "blocked", reason: "adult-source", version: "strict-1" } }, { id: "houseofotakus", name: "House Of Otakus", adapter: "madara", mode: "reader", website: "https://houseofotakusv2.xyz/", language: "es", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "inkapk", name: "Inkapk", adapter: "madara", mode: "reader", website: "https://inkapk.net/", language: "pt-BR", readable: true, defaultEnabled: false, contentWarning: "NSFW", available: false, contentPolicy: { state: "blocked", reason: "adult-source", version: "strict-1" } }, { id: "isekaikomik", name: "IsekaiKomik", adapter: "themesia", mode: "reader", website: "https://ch1.isekaikomik.site/", language: "id", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "izanamiscans", name: "Izanami Scans", adapter: "themesia", mode: "reader", website: "https://izanamiscans.my.id/", language: "id", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "kanzenin", name: "Kanzenin", adapter: "themesia", mode: "reader", website: "https://kanzenin.info/", language: "id", readable: true, defaultEnabled: false, contentWarning: "NSFW", available: false, contentPolicy: { state: "blocked", reason: "adult-source", version: "strict-1" } }, { id: "kazokuden", name: "Kazoku Den", adapter: "madara", mode: "reader", website: "https://www.kazokuden.com/", language: "es", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "kmansin09", name: "Kmansin09", adapter: "madara", mode: "reader", website: "https://kmansin09.top/", language: "ja", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "koreliscans", name: "Koreli Scans", adapter: "themesia", mode: "reader", website: "https://www.nabicix.com/", language: "tr", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "lelmanga", name: "Lelmanga", adapter: "themesia", mode: "reader", website: "https://www.lelmanga.com/", language: "fr", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "lepoytl", name: "LepoyTL", adapter: "blogger", mode: "reader", website: "https://www.lepoytl.my.id/", language: "id", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "lilymanga", name: "Lily Manga", adapter: "madara", mode: "reader", website: "https://lilymanga.net/", language: "en", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "mangadistrict", name: "Manga District", adapter: "madara", mode: "reader", website: "https://mangadistrict.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "mangaeclipse", name: "Manga Eclipse", adapter: "madara", mode: "reader", website: "https://mangaeclipse.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "mangalivreto", name: "Manga Livre.to", adapter: "madara", mode: "reader", website: "https://mangalivre.to/", language: "pt-BR", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "mangatrend", name: "Manga Trend", adapter: "themesia", mode: "reader", website: "https://mangatrend.org/", language: "en", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "mangacrazy", name: "MangaCrazy", adapter: "madara", mode: "reader", website: "https://mangacrazy.net/", language: "en", readable: true, defaultEnabled: false, contentWarning: "NSFW", available: false, contentPolicy: { state: "blocked", reason: "adult-source", version: "strict-1" } }, { id: "mangaowliounoriginal", name: "MangaOwl.io (unoriginal)", adapter: "madara", mode: "reader", website: "https://mangaowl.io/", language: "en", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "mangawow", name: "MangaWOW", adapter: "madara", mode: "reader", website: "https://mangawow.org/", language: "tr", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "mangayy", name: "MangaYY", adapter: "madara", mode: "reader", website: "https://mangayy.org/", language: "en", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "manhuanext", name: "Manhuanext", adapter: "madara", mode: "reader", website: "https://manhuanext.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "manhwadesu", name: "ManhwaDesu", adapter: "themesia", mode: "reader", website: "https://manhwadesu.wiki/", language: "id", readable: true, defaultEnabled: false, contentWarning: "NSFW", available: false, contentPolicy: { state: "blocked", reason: "adult-source", version: "strict-1" } }, { id: "manhwahubto", name: "ManhwaHub.to", adapter: "madara", mode: "reader", website: "https://manhwahub.to/", language: "en", readable: true, defaultEnabled: false, contentWarning: "NSFW", available: false, contentPolicy: { state: "blocked", reason: "adult-source", version: "strict-1" } }, { id: "manhwanex", name: "ManhwaNex", adapter: "madara", mode: "reader", website: "https://manhwanex.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "manhwatop", name: "Manhwatop", adapter: "madara", mode: "reader", website: "https://manhwatop.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "mhscans", name: "MHScans", adapter: "madara", mode: "reader", website: "https://mhscans.com/", language: "es", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "miauscan", name: "Miau Scan", adapter: "themesia", mode: "reader", website: "https://leemiau.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "monopolyscan", name: "Monopoly Scan", adapter: "madara", mode: "reader", website: "https://monopolymanhua.com/", language: "es", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "moondaisyscans", name: "Moon Daisy Scans", adapter: "themesia", mode: "reader", website: "https://moondaisyscans.pro/", language: "tr", readable: true, defaultEnabled: false, contentWarning: "NSFW", available: false, contentPolicy: { state: "blocked", reason: "adult-source", version: "strict-1" } }, { id: "ngomikunoriginal", name: "Ngomik (unoriginal)", adapter: "themesia", mode: "reader", website: "https://02.ngomik.cc/", language: "id", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "ninjascan", name: "Ninja Scan", adapter: "madara", mode: "reader", website: "https://ninjacomics.xyz/", language: "pt-BR", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "noromax", name: "Noromax", adapter: "themesia", mode: "reader", website: "https://noromax02.my.id/", language: "id", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "nyxscans", name: "Nyx Scans", adapter: "iken", mode: "reader", website: "https://nyxscans.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "octopusmanga", name: "OctopusManga", adapter: "madara", mode: "reader", website: "https://octopusmanga.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "NSFW", available: false, contentPolicy: { state: "blocked", reason: "adult-source", version: "strict-1" } }, { id: "orchisasia", name: "Orchisasia", adapter: "madara", mode: "reader", website: "https://www.orchisasia.org/", language: "en", readable: true, defaultEnabled: false, contentWarning: "NSFW", available: false, contentPolicy: { state: "blocked", reason: "adult-source", version: "strict-1" } }, { id: "orionscans", name: "Orion Scans", adapter: "iken", mode: "reader", website: "https://orion-scans.com/", language: "en", readable: true, defaultEnabled: true, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "pantheonscan", name: "Pantheon Scan", adapter: "madara", mode: "reader", website: "https://pantheon-scan.com/", language: "fr", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "paritehaber", name: "Paritehaber", adapter: "madara", mode: "reader", website: "https://www.paritehaber.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "NSFW", available: false, contentPolicy: { state: "blocked", reason: "adult-source", version: "strict-1" } }, { id: "petrotechsociety", name: "Petrotechsociety", adapter: "madara", mode: "reader", website: "https://www.petrotechsociety.org/", language: "en", readable: true, defaultEnabled: false, contentWarning: "NSFW", available: false, contentPolicy: { state: "blocked", reason: "adult-source", version: "strict-1" } }, { id: "rackus", name: "Rackus", adapter: "themesia", mode: "reader", website: "https://rackusreads.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "ragnarokscanlation", name: "Ragnarok Scanlation", adapter: "madara", mode: "reader", website: "https://ragnarokscanlation.org/", language: "es", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "renascans", name: "Renascans", adapter: "iken", mode: "reader", website: "https://renascans.net/", language: "en", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "s2manga", name: "S2Manga", adapter: "madara", mode: "reader", website: "https://s2read.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "seraphicdeviltry", name: "SeraphicDeviltry", adapter: "madara", mode: "reader", website: "https://seraphic-deviltry.com/", language: "en", readable: true, defaultEnabled: false, contentWarning: "NSFW", available: false, contentPolicy: { state: "blocked", reason: "adult-source", version: "strict-1" } }, { id: "shadowceviri", name: "Shadow \xC7eviri", adapter: "blogger", mode: "reader", website: "https://shadowceviri.blogspot.com/", language: "tr", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "shijiescans", name: "Shijie Scans", adapter: "themesia", mode: "reader", website: "https://shijiescans.com/", language: "tr", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "shinobiscans", name: "Shinobi Scans", adapter: "madara", mode: "reader", website: "https://shinobiscans.com/", language: "it", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "shiyurasub", name: "ShiyuraSub", adapter: "blogger", mode: "reader", website: "https://shiyurasub.blogspot.com/", language: "id", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "siikomik", name: "Siikomik", adapter: "madara", mode: "reader", website: "https://siikomik.id/", language: "id", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "singmanga", name: "Singmanga", adapter: "themesia", mode: "reader", website: "https://www.sing-manga.com/", language: "th", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "sodsaime", name: "Sodsaime", adapter: "themesia", mode: "reader", website: "https://www.xn--l3c0azab5a2gta.com/", language: "th", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "speedmanga", name: "Speed Manga", adapter: "themesia", mode: "reader", website: "https://speed-manga.net/", language: "th", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "topmanhua", name: "Top Manhua", adapter: "madara", mode: "reader", website: "https://mangatop.org/", language: "en", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "tsundokutraducoes", name: "Tsundoku Tradu\xE7\xF5es", adapter: "themesia", mode: "reader", website: "https://tsundoku.com.br/", language: "pt-BR", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "undertranslations", name: "UnderTranslations", adapter: "themesia", mode: "reader", website: "https://undertranslations.com/", language: "es", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "xsanomanga", name: "XSano Manga", adapter: "blogger", mode: "reader", website: "https://www.xsano-manga.com/", language: "ar", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "yaoihub", name: "Yaoihub", adapter: "madara", mode: "reader", website: "https://yaoihub.org/", language: "en", readable: true, defaultEnabled: false, contentWarning: "NSFW", available: false, contentPolicy: { state: "blocked", reason: "adult-source", version: "strict-1" } }, { id: "yokai", name: "Yokai", adapter: "blogger", mode: "reader", website: "https://yokai-team.blogspot.com/", language: "ar", readable: true, defaultEnabled: false, contentWarning: "SAFE", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "yurimoonsub", name: "Yuri Moon Sub", adapter: "blogger", mode: "reader", website: "https://yurimoonsub.blogspot.com/", language: "ar", readable: true, defaultEnabled: false, contentWarning: "NSFW", available: false, contentPolicy: { state: "blocked", reason: "adult-source", version: "strict-1" } }, { id: "yurionline", name: "Yuri-Online", adapter: "madara", mode: "reader", website: "https://yuri-online.com/", language: "es", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }, { id: "zinmanga", name: "Zinmanga", adapter: "madara", mode: "reader", website: "https://mangazin.org/", language: "en", readable: true, defaultEnabled: false, contentWarning: "MIXED", available: false, contentPolicy: { state: "restricted", reason: "no-supported-positive-rating", version: "strict-1" } }];
    }
  });

  // client/local/model.mjs
  function fileKind(name = "") {
    return IMAGE_EXT.test(name) ? "image" : /\.pdf$/i.test(name) ? "pdf" : archiveExt.test(name) ? "archive" : "unsupported";
  }
  function cleanTitle(value = "") {
    const name = String(value).trim().split(/[\\/]/).pop().replace(/\.(?:tar\.(?:gz|bz2|xz)|cbz|zip|cbr|rar|cb7|7z|cbt|tar|epub|tgz|tbz2?|txz|pdf|jpe?g|png|webp|gif|bmp|avif)$/i, "");
    return [...name.replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, " ").replace(/\s+/g, " ").trim()].slice(0, 120).join("") || "My manga";
  }
  function cleanDisplayTitle(value = "") {
    return [...String(value).replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, " ").replace(/\s+/g, " ").trim()].slice(0, 120).join("") || "My manga";
  }
  function validateInput(files) {
    if (!files.length) throw new Error("Choose a comic file or some image pages.");
    if (files.some((f) => /\.(?:part\d+|vol\d+)\.(?:rar|cbr|zip|cbz|7z|cb7)$|\.(?:rar|cbr|zip|cbz|7z|cb7)\.\d{3}$/i.test(f.name))) throw new Error("Multipart comic archives are not supported. Combine the volumes into one complete archive first.");
    if (files.length > LIMITS.pages) throw new Error("Import up to 600 pages at a time.");
    if (files.some((f) => !Number.isSafeInteger(f.size) || f.size <= 0) || files.reduce((n, f) => n + f.size, 0) > LIMITS.input) throw new Error("Choose files with a combined size of 150 MiB or less.");
    const kinds = files.map((f) => fileKind(f.name));
    if (kinds.some((x) => x === "unsupported")) throw new Error("This file type is not supported. Choose a comic archive, PDF, or JPEG, PNG, WebP, GIF, BMP or AVIF pages.");
    if (files.length > 1 && kinds.some((x) => x !== "image")) throw new Error("Choose one comic archive or PDF at a time, or select multiple image pages.");
    if (kinds[0] === "image" && files.some((f) => f.size > LIMITS.pageBytes)) throw new Error("Each image page must be 12 MiB or less.");
    return kinds[0];
  }
  function validateDimensions(width, height) {
    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) throw new Error("This page has invalid dimensions.");
    if (width > LIMITS.dimension || height > LIMITS.dimension || width * height > LIMITS.pixels) throw new Error("This image is too large: use at most 32 million pixels and 16,384 pixels per side.");
  }
  function imageType(bytes) {
    const b = new Uint8Array(bytes), v = new DataView(b.buffer, b.byteOffset, b.byteLength);
    if (b.length < 12) throw new Error("This page has a damaged or unsupported image signature.");
    if (str(b, 0, 4) === "\x89PNG") {
      if (str(b, 4, 4) !== "\r\n\n" || b.length < 45 || str(b, 12, 4) !== "IHDR" || str(b, b.length - 8, 4) !== "IEND") throw new Error("This PNG page is damaged or truncated.");
      validateDimensions(v.getUint32(16), v.getUint32(20));
      return "image/png";
    }
    if (b[0] === 255 && b[1] === 216 && b[2] === 255) {
      if (b[b.length - 2] !== 255 || b[b.length - 1] !== 217) throw new Error("This JPEG page is damaged or truncated.");
      let p = 2;
      while (p + 4 < b.length) {
        if (b[p++] !== 255) throw new Error("This JPEG frame is damaged.");
        while (b[p] === 255) p++;
        const marker = b[p++];
        if (marker === 217 || marker === 218) break;
        if (marker === 1 || marker >= 208 && marker <= 215) continue;
        const length = v.getUint16(p);
        if (length < 2 || p + length > b.length) throw new Error("This JPEG frame is truncated.");
        if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker)) {
          if (length < 8) throw new Error("This JPEG frame is damaged.");
          validateDimensions(v.getUint16(p + 5), v.getUint16(p + 3));
          return "image/jpeg";
        }
        p += length;
      }
      throw new Error("This JPEG has no valid image dimensions.");
    }
    if (str(b, 0, 4) === "RIFF" && str(b, 8, 4) === "WEBP") {
      if (v.getUint32(4, true) + 8 !== b.length) throw new Error("This WebP page is damaged or truncated.");
      if (str(b, 12, 4) === "VP8X" && b.length >= 30) validateDimensions(1 + b[24] + (b[25] << 8) + (b[26] << 16), 1 + b[27] + (b[28] << 8) + (b[29] << 16));
      if (str(b, 12, 4) === "VP8 " && b.length >= 30 && str(b, 23, 3) === "\x9D*") validateDimensions(v.getUint16(26, true) & 16383, v.getUint16(28, true) & 16383);
      if (str(b, 12, 4) === "VP8L" && b.length >= 25 && b[20] === 47) validateDimensions(1 + (v.getUint32(21, true) & 16383), 1 + (v.getUint32(21, true) >>> 14 & 16383));
      return "image/webp";
    }
    if (["GIF87a", "GIF89a"].includes(str(b, 0, 6))) {
      if (b[b.length - 1] !== 59) throw new Error("This GIF page is damaged or truncated.");
      validateDimensions(v.getUint16(6, true), v.getUint16(8, true));
      return "image/gif";
    }
    if (str(b, 0, 2) === "BM" && b.length >= 54) {
      if (v.getUint32(2, true) !== b.length) throw new Error("This BMP page is damaged or truncated.");
      validateDimensions(v.getInt32(18, true), Math.abs(v.getInt32(22, true)));
      return "image/bmp";
    }
    if (str(b, 4, 4) === "ftyp" && /avif|avis/.test(str(b, 8, Math.min(32, b.length - 8)))) {
      let dimensions = false;
      for (let i = 4; i <= b.length - 16; i++) if (str(b, i, 4) === "ispe" && v.getUint32(i - 4) >= 20 && i - 4 + v.getUint32(i - 4) <= b.length) {
        validateDimensions(v.getUint32(i + 8), v.getUint32(i + 12));
        dimensions = true;
      }
      if (!dimensions) throw new Error("This AVIF has no supported image dimensions.");
      return "image/avif";
    }
    throw new Error("This page has an unsupported image signature. SVG and executable content cannot be imported.");
  }
  async function digest(data) {
    return [...new Uint8Array(await crypto.subtle.digest("SHA-256", data))].map((x) => x.toString(16).padStart(2, "0")).join("");
  }
  async function bookIdentity(hashes) {
    return "local-" + await digest(new TextEncoder().encode("KURO-device-book-v1\n" + hashes.join("\n")));
  }
  function importError(error) {
    if (error?.name === "AbortError") return "Import cancelled. No book was added.";
    if (["QuotaExceededError", "NS_ERROR_DOM_QUOTA_REACHED"].includes(error?.name)) return "Your device does not have enough browser storage. Delete a device book or free some space and try again.";
    return error?.message || "This file could not be imported. Try another copy.";
  }
  function abortCheck(signal) {
    if (signal?.aborted) throw new DOMException("Import cancelled", "AbortError");
  }
  var LIMITS, IMAGE_EXT, archiveExt, collator, pageCompare, str, isLocalId, chapterId;
  var init_model = __esm({
    "client/local/model.mjs"() {
      init_define_KURO_BOOTSTRAP_PROVIDERS();
      LIMITS = Object.freeze({ input: 150 * 1024 * 1024, expanded: 200 * 1024 * 1024, pageBytes: 12 * 1024 * 1024, pages: 600, entries: 2e3, pixels: 32e6, dimension: 16384, stored: 1024 * 1024 * 1024, books: 200 });
      IMAGE_EXT = /\.(?:jpe?g|png|webp|gif|bmp|avif)$/i;
      archiveExt = /\.(?:cbz|zip|cbr|rar|cb7|7z|cbt|tar|epub|tgz|tbz2?|txz|tar\.(?:gz|bz2|xz))$/i;
      collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
      pageCompare = (a, b) => collator.compare(a, b) || a.localeCompare(b, "en");
      str = (b, a, n) => String.fromCharCode(...b.subarray(a, a + n));
      isLocalId = (id) => /^local-[a-f0-9]{64}$/.test(id || "");
      chapterId = (id) => id + "-chapter-1";
    }
  });

  // client/local/images.mjs
  var images_exports = {};
  __export(images_exports, {
    canvasBlob: () => canvasBlob,
    coverFor: () => coverFor,
    decodeImage: () => decodeImage,
    validatedPage: () => validatedPage
  });
  async function decodeImage(blob, signal) {
    abortCheck(signal);
    const url = URL.createObjectURL(blob), image = new Image();
    try {
      await new Promise((resolve, reject) => {
        const abort = () => reject(new DOMException("Import cancelled", "AbortError"));
        const timer = setTimeout(() => reject(new Error("Image decoding took too long. Try a smaller page.")), 15e3);
        const done = (fn) => () => {
          clearTimeout(timer);
          signal?.removeEventListener("abort", abort);
          fn();
        };
        image.onload = done(resolve);
        image.onerror = done(() => reject(new Error("An image page is damaged or cannot be decoded on this device.")));
        signal?.addEventListener("abort", abort, { once: true });
        image.src = url;
      });
      abortCheck(signal);
      validateDimensions(image.naturalWidth, image.naturalHeight);
      return image;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  async function validatedPage(page, signal) {
    const bytes = await page.blob.arrayBuffer();
    abortCheck(signal);
    const type = imageType(bytes), blob = new Blob([bytes], { type });
    const image = await decodeImage(blob, signal);
    return { ...page, blob, width: image.naturalWidth, height: image.naturalHeight, hash: await digest(bytes) };
  }
  async function coverFor(page, signal) {
    const image = await decodeImage(page.blob, signal), canvas = document.createElement("canvas");
    const ratio = Math.min(1, 480 / image.naturalWidth, 720 / image.naturalHeight);
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await canvasBlob(canvas);
    canvas.width = canvas.height = 1;
    return blob;
  }
  var canvasBlob;
  var init_images = __esm({
    "client/local/images.mjs"() {
      init_define_KURO_BOOTSTRAP_PROVIDERS();
      init_model();
      canvasBlob = (canvas, type = "image/webp", quality = 0.94) => new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("This device could not convert the page image.")), type, quality));
    }
  });

  // client/catalogue-core.mjs
  init_define_KURO_BOOTSTRAP_PROVIDERS();

  // dist/catalogue-runtime.mjs
  init_define_KURO_BOOTSTRAP_PROVIDERS();

  // dist/catalogue-model.mjs
  init_define_KURO_BOOTSTRAP_PROVIDERS();
  var titleKey = (value) => String(value || "").normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}+]+/gu, " ").trim();
  var editionPart = (row) => String(row.title || "").normalize("NFKC").toLowerCase().match(/\b(part|season|vol(?:ume)?|book)\s*([0-9ivx]+)/)?.slice(1).join(":") || "";
  var identities = (row) => new Set((row.identityKeys || []).filter((x) => typeof x === "string" && /^[a-z][a-z0-9]*:[a-zA-Z0-9_-]{1,160}$/.test(x)));
  function conflicts(a, b) {
    const sharedEdition = [...a].some((id) => b.has(id) && id.startsWith("mdx:"));
    const sharedWork = [...a].some((id) => b.has(id) && /^(?:mal|anilist|kitsu|mu):/.test(id));
    const left = /* @__PURE__ */ new Map();
    for (const id of a) {
      const [provider, value] = id.split(":");
      const s = left.get(provider) || /* @__PURE__ */ new Set();
      s.add(value);
      left.set(provider, s);
    }
    for (const id of b) {
      const [provider, value] = id.split(":");
      if (provider === "mdx" && (sharedEdition || sharedWork)) continue;
      if (left.has(provider) && !left.get(provider).has(value)) return true;
    }
    return false;
  }
  function groupSeries(items, group = true) {
    const distinct = [...new Map(items.filter((x) => x && typeof x.id === "string" && typeof x.title === "string").map((x) => [x.id, x])).values()];
    if (!group) return distinct.map((row) => ({ primary: row, editions: [row] }));
    const groups = [], keyIndex = /* @__PURE__ */ new Map(), titleIndex = /* @__PURE__ */ new Map(), order = new Map(distinct.map((row, i) => [row.id, i]));
    const root = (g) => {
      let r = g;
      while (r.parent) r = r.parent;
      while (g.parent && g.parent !== r) {
        const next = g.parent;
        g.parent = r;
        g = next;
      }
      return r;
    };
    const indexed = (index, key, g) => {
      const set = index.get(key) || /* @__PURE__ */ new Set();
      set.add(g);
      index.set(key, set);
    };
    const authorTitle = (row) => titleKey(row.author) + "\0" + titleKey(row.title);
    function compatible(a, b) {
      if (conflicts(a.keys, b.keys) || conflicts(b.keys, a.keys)) return false;
      const parts = new Set([...a.editions, ...b.editions].map(editionPart).filter(Boolean));
      if (parts.size > 1) return false;
      if ([...a.keys].some((key) => b.keys.has(key))) return true;
      if (a.editions.some((x) => b.editions.some((y) => y.sourceId === x.sourceId)) || a.keys.size && b.keys.size) return false;
      return a.editions.some((x) => titleKey(x.author) && b.editions.some((y) => authorTitle(x) === authorTitle(y)));
    }
    function candidates(g) {
      const found = /* @__PURE__ */ new Set();
      for (const key of g.keys) for (const other of keyIndex.get(key) || []) found.add(root(other));
      for (const row of g.editions) if (titleKey(row.author)) for (const other of titleIndex.get(authorTitle(row)) || []) found.add(root(other));
      return [...found].filter((other) => other !== g).sort((a, b) => a.index - b.index);
    }
    for (const [index, row] of distinct.entries()) {
      let found = { index, editions: [row], keys: identities(row) };
      groups.push(found);
      let merged;
      do {
        merged = false;
        for (const other of candidates(found)) if (compatible(found, other)) {
          const keep = found.index < other.index ? found : other, drop = keep === found ? other : found;
          drop.parent = keep;
          keep.editions.push(...drop.editions);
          for (const key of drop.keys) keep.keys.add(key);
          found = keep;
          merged = true;
        }
      } while (merged);
      for (const key of found.keys) indexed(keyIndex, key, found);
      for (const edition of found.editions) if (titleKey(edition.author)) indexed(titleIndex, authorTitle(edition), found);
    }
    return groups.filter((g) => !g.parent).sort((a, b) => a.index - b.index).map((g) => {
      const editions = g.editions.sort((a, b) => order.get(a.id) - order.get(b.id)), primary = editions.find((x) => !x.catalogueOnly && !x.publisherUrl) || editions[0];
      return { primary, editions };
    });
  }
  function uniqueChapters(items) {
    return [...new Map(items.filter((x) => x && typeof x.id === "string" && Number.isFinite(x.chapterNumber)).map((x) => [x.id, x])).values()];
  }
  function validNewIdentity(id, provider, registered) {
    return /^[a-z0-9]{1,40}$/.test(provider) && registered.includes(provider) && typeof id === "string" && id.startsWith(provider + "-") && /^[a-zA-Z0-9_~.-]{1,900}$/.test(id.slice(provider.length + 1)) && !id.slice(provider.length + 1).includes("..");
  }

  // dist/catalogue-runtime.mjs
  var wrapped = /* @__PURE__ */ new WeakSet();
  function checkedManifest(manifest, id, origin) {
    if (!manifest?.verified || manifest.validation !== "complete-chapter" || manifest.validatedPages !== manifest.pages?.length || manifest.pageCount !== manifest.pages?.length || manifest.chapterId !== id || !Array.isArray(manifest.pages) || !manifest.pages.length || manifest.pages.some((page) => {
      try {
        const url = new URL(page.url);
        return url.origin !== origin || url.pathname !== "/api/catalogue/page" || !url.searchParams.get("ticket");
      } catch {
        return true;
      }
    })) throw new Error("Chapter did not return a server verified page manifest. Retry later.");
    return manifest;
  }
  function installAdapters(manager, registry, { request, origin }) {
    const registered = [];
    for (const p of registry.providers.filter((p2) => p2.adapter && p2.adapter !== "legacy")) {
      if (manager.get(p.id)) continue;
      const call = (action, params = {}) => request(p.id, action, params);
      manager.register({
        id: p.id,
        name: p.name + (p.readable ? "" : " \xB7 Catalogue"),
        version: "1.0.0",
        color: "#E7B978",
        capabilities: {
          search: true,
          readable: p.readable,
          popular: ["madara", "themesia", "keyoapp", "flame", "asura", "iken", "mangabox"].includes(p.adapter),
          latest: p.readable,
          trending: false,
          genres: false,
          requiresReferer: false,
          languages: [p.language || "en"],
          originFilter: false
        },
        getBaseUrl: () => p.website,
        getSortOptions: () => ["RELEVANCE", "LATEST", "POPULAR"],
        search: async (q, page, filters) => (await call("search", { q, page, filters })).items,
        searchPage: (q, page, filters) => call("search", { q, page, filters }),
        getPopular: async (page) => (await call("popular", { page })).items,
        getLatestUpdates: async (page) => (await call("latest", { page })).items,
        getTrending: async () => [],
        getMangaDetails: (id) => call("details", { id }),
        getChapterList: (id) => p.readable ? call("chapters", { id }) : Promise.resolve([]),
        getChapterPages: async (id) => checkedManifest(await call("pages", { id }), id, origin)
      });
      registered.push(p.id);
    }
    for (const adapter of manager.all()) {
      if (wrapped.has(adapter) || adapter.capabilities.readable === false) continue;
      if (registry.providers.some((p) => p.id === adapter.id && p.adapter && p.adapter !== "legacy")) {
        wrapped.add(adapter);
        continue;
      }
      adapter.getChapterPages = async (id) => checkedManifest(await request(adapter.id, "pages", { id }), id, origin);
      wrapped.add(adapter);
    }
    return registered;
  }
  function installIdentity(runtime, registered) {
    const module = runtime(1706), original = module.validIdentity;
    module.validIdentity = (id, provider) => original(id, provider) || validNewIdentity(id, provider, registered);
  }

  // client/local/runtime.mjs
  init_define_KURO_BOOTSTRAP_PROVIDERS();

  // client/local/store.mjs
  init_define_KURO_BOOTSTRAP_PROVIDERS();
  init_model();

  // client/local/content.mjs
  init_define_KURO_BOOTSTRAP_PROVIDERS();

  // client/local/reviewed-content.mjs
  init_define_KURO_BOOTSTRAP_PROVIDERS();
  var reviewedDeviceBooks = Object.freeze([Object.freeze({
    title: "A Quiet World",
    reviewedAt: "2026-10-14",
    review: "All three pages visually inspected; original KURO device-import demo.",
    pageHashes: Object.freeze([
      "afd90c5ca22ba7a5e9ba2f7ca564c19d34e07e17406907123933ec6579ecc834",
      "868bb09975ca19562c2b6bb21f6b6927ef0e42add57a872361af6688a06eaeac",
      "a42ffc9d361724d104b22de50f539ffedda878f87dc6e552d80f7e34fe4e3f8f"
    ])
  })]);

  // client/content-policy.mjs
  init_define_KURO_BOOTSTRAP_PROVIDERS();

  // client/content-denylist.mjs
  init_define_KURO_BOOTSTRAP_PROVIDERS();
  var blockedMangaIds = Object.freeze([]);
  var blockedChapterIds = Object.freeze([]);
  var blockedProviderIds = Object.freeze([]);

  // client/content-policy.mjs
  var CONTENT_POLICY_VERSION = "strict-1";
  var CONTENT_MESSAGE = "KURO hides adult, suggestive and unverified manga. This title is not approved under the strict content rules.";
  var RATING_TTL_MS = 3e4;
  var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  var normalize = (value) => String(value || "").normalize("NFKC").replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, "").toLowerCase().replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
  function forbiddenLabel(value) {
    const text = normalize(value);
    if (["adult cast", "young adult fiction", "mature protagonist"].includes(text)) return false;
    return /^(?:adult|mature|nsfw|explicit|suggestive|ecchi|hentai|erotica|porn(?:ographic|ography)?|smut|nudity|sexual content|sexual violence|sexual abuse|sexual exploitation|sex|hardcore|softcore|r\s*(?:18|19)\s*\+?|(?:18|19)\s*\+|adults? only)(?:\s|$)/.test(text) || /(?:^|\b)(?:hentai|erotica|pornographic|pornography|smut|ecchi|nsfw|explicit sexual content|sexual violence|sexual abuse|sexual exploitation|nudity|18\s*\+|19\s*\+)(?:\b|$)/.test(text) || /成人向|成人漫画|成人漫畫|十八禁|18禁|色情|エロ漫画|성인|청소년이용불가|للبالغين|إباحي|اباحي/.test(text);
  }
  var labelDenied = (value) => {
    const text = normalize(value);
    if (["adult cast", "young adult fiction", "mature protagonist"].includes(text)) return false;
    return forbiddenLabel(text);
  };
  function forbiddenText(value) {
    return /(?:\b(?:hentai|pornographic|pornography|erotica|smut|ecchi|nsfw)\b|\b(?:18|19)\s*\+|成人向|十八禁|18禁|色情|청소년이용불가)/.test(normalize(value));
  }
  var decision = (allowed, reason, evidence) => ({ allowed, reason, version: CONTENT_POLICY_VERSION, ...evidence ? { evidence } : {} });
  var names = (value) => value && typeof value === "object" && !Array.isArray(value) ? Object.values(value).filter((v) => typeof v === "string") : [];
  var blockedIdentity = (provider, id, chapter) => blockedProviderIds.includes(provider) || blockedMangaIds.includes(String(id).toLowerCase()) || !!chapter && blockedChapterIds.includes(String(chapter).toLowerCase());
  function classifyMangaDex(raw) {
    const a = raw?.attributes;
    if (raw?.type !== "manga" || !UUID.test(raw?.id || "") || !a || a.contentRating !== "safe" || !Array.isArray(a.tags) || !names(a.title).some((x) => normalize(x)) || a.altTitles !== void 0 && !Array.isArray(a.altTitles) || raw.relationships !== void 0 && !Array.isArray(raw.relationships)) return decision(false, "unverified-or-mature-rating");
    if (blockedIdentity("mangadex", "mangadex-" + raw.id.toLowerCase())) return decision(false, "moderation-block");
    if (a.tags.some((tag) => !tag?.attributes || !names(tag.attributes.name).some((name) => normalize(name)) || names(tag.attributes.name).some(labelDenied))) return decision(false, "restricted-content-tag");
    if ([...names(a.title), ...(a.altTitles || []).flatMap(names), ...names(a.description)].some(forbiddenText)) return decision(false, "restricted-content-description");
    return decision(true, "safe-rating", "mangadex:contentRating=safe");
  }
  function providerContentPolicy(provider) {
    if (blockedProviderIds.includes(provider.id)) return { state: "blocked", reason: "moderation-block", version: CONTENT_POLICY_VERSION };
    if (normalize(provider.contentWarning) === "nsfw" || forbiddenText(provider.name) || forbiddenText(provider.id)) return { state: "blocked", reason: "adult-source", version: CONTENT_POLICY_VERSION };
    if (["mangadex", "anilist"].includes(provider.id)) return { state: "eligible", reason: "supported-rating-contract", version: CONTENT_POLICY_VERSION };
    return { state: "restricted", reason: "no-supported-positive-rating", version: CONTENT_POLICY_VERSION };
  }
  function policyProvider(provider) {
    const contentPolicy = providerContentPolicy(provider);
    return { ...provider, contentPolicy, available: contentPolicy.state === "eligible" && provider.available !== false };
  }

  // client/local/content.mjs
  init_model();
  function reviewedHashes(hashes) {
    if (!Array.isArray(hashes) || hashes.some((h) => typeof h !== "string" || !/^[a-f0-9]{64}$/.test(h))) return void 0;
    return reviewedDeviceBooks.find((book) => book.pageHashes.length === hashes.length && [book.pageHashes, [...book.pageHashes].reverse()].some((list) => list.every((hash, i) => hash === hashes[i])));
  }
  async function reviewedIdentity(id) {
    for (const book of reviewedDeviceBooks) for (const list of [book.pageHashes, [...book.pageHashes].reverse()]) if (id === await bookIdentity(list)) return true;
    return false;
  }
  async function admitDevicePages(pages, { signal } = {}) {
    if (!Array.isArray(pages) || !pages.length || pages.length > LIMITS.pages) throw new Error(CONTENT_MESSAGE);
    const hashes = [];
    for (const page of pages) {
      abortCheck(signal);
      if (!(page?.blob instanceof Blob) || !page.blob.size || page.blob.size > LIMITS.pageBytes) throw new Error(CONTENT_MESSAGE);
      const hash = await digest(await page.blob.arrayBuffer());
      if (page.hash !== void 0 && page.hash !== hash) throw new Error("These device files no longer match their reviewed content.");
      hashes.push(hash);
    }
    const reviewed = reviewedHashes(hashes);
    if (!reviewed) throw new Error("Strict content rules: this device comic has not been reviewed. No preview or book was added.");
    abortCheck(signal);
    return { reviewed, hashes, id: await bookIdentity(hashes) };
  }
  function approvedTitle(title, fallback) {
    if (forbiddenText(title)) throw new Error("Choose a title that follows KURO\u2019s strict content rules.");
    return title || fallback;
  }

  // client/local/store.mjs
  init_images();
  var DATABASE = "kuro-device-manga-v1";
  function createDeviceStore(indexedDB = globalThis.indexedDB) {
    let opened;
    const open = () => {
      if (opened) return opened;
      if (!indexedDB) return Promise.reject(new Error("Device storage is unavailable in this browser. Allow website storage and reload KURO."));
      opened = new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE, 1);
        let settled = false;
        const timer = setTimeout(() => {
          settled = true;
          reject(new Error("Device storage is blocked by another tab. Close that tab and reload KURO."));
        }, 1e4);
        request.onupgradeneeded = () => {
          const db = request.result;
          db.createObjectStore("books", { keyPath: "id" });
          db.createObjectStore("pages", { keyPath: ["bookId", "index"] });
        };
        request.onerror = () => {
          clearTimeout(timer);
          reject(new Error("Device storage could not open. Allow website storage and reload KURO."));
        };
        request.onsuccess = () => {
          clearTimeout(timer);
          if (settled) {
            request.result.close();
            return;
          }
          const db = request.result;
          db.onversionchange = () => {
            db.close();
            opened = void 0;
          };
          resolve(db);
        };
      }).catch((error) => {
        opened = void 0;
        throw error;
      });
      return opened;
    };
    async function read(store, method, key) {
      const db = await open();
      return new Promise((resolve, reject) => {
        const request = db.transaction(store).objectStore(store)[method](key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return {
      list: () => read("books", "getAll"),
      get: (id) => read("books", "get", id),
      pages: (id) => read("pages", "getAll", IDBKeyRange.bound([id, 0], [id, LIMITS.pages])),
      async save(prepared, { title, signal } = {}) {
        abortCheck(signal);
        if (!prepared?.pages?.length || prepared.pages.length > LIMITS.pages || prepared.size > LIMITS.expanded) throw new Error("The prepared comic exceeds the allowed size.");
        const approval = await admitDevicePages(prepared.pages, { signal }), id = approval.id, cover = await coverFor(prepared.pages[0], signal), safeTitle = approvedTitle(cleanDisplayTitle(title || prepared.title), approval.reviewed.title);
        abortCheck(signal);
        const db = await open();
        abortCheck(signal);
        return new Promise((resolve, reject) => {
          const tx = db.transaction(["books", "pages"], "readwrite"), books = tx.objectStore("books"), pages = tx.objectStore("pages");
          let result, error;
          const abort = () => {
            error = new DOMException("Import cancelled", "AbortError");
            try {
              tx.abort();
            } catch {
            }
          };
          signal?.addEventListener("abort", abort, { once: true });
          tx.oncomplete = () => {
            signal?.removeEventListener("abort", abort);
            resolve(result);
          };
          tx.onabort = () => {
            signal?.removeEventListener("abort", abort);
            reject(error || tx.error || new Error("The comic could not be saved. No partial book was added."));
          };
          tx.onerror = () => {
            error = tx.error;
          };
          const request = books.get(id);
          request.onsuccess = () => {
            if (request.result) {
              result = { book: request.result, duplicate: true };
              return;
            }
            const list = books.getAll();
            list.onsuccess = () => {
              if (list.result.length >= LIMITS.books || list.result.reduce((n, b) => n + b.size, 0) + prepared.size > LIMITS.stored) {
                error = new Error("Device manga storage is full (200 books / 1 GiB). Delete a device book first.");
                tx.abort();
                return;
              }
              const book = { id, title: safeTitle, format: prepared.format, pageCount: prepared.pages.length, size: prepared.size, createdAt: Date.now(), cover };
              books.add(book);
              prepared.pages.forEach((p, index) => pages.add({ bookId: id, index, blob: p.blob, width: p.width, height: p.height, hash: p.hash, name: p.name }));
              result = { book, duplicate: false };
            };
          };
        });
      },
      async delete(id) {
        if (!isLocalId(id)) throw new Error("Invalid device book.");
        const db = await open();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(["books", "pages"], "readwrite");
          tx.objectStore("books").delete(id);
          tx.objectStore("pages").delete(IDBKeyRange.bound([id, 0], [id, LIMITS.pages]));
          tx.oncomplete = () => resolve();
          tx.onabort = () => reject(tx.error || new Error("Device files could not be deleted."));
          tx.onerror = () => {
          };
        });
      },
      async close() {
        if (opened) (await opened).close();
        opened = void 0;
      }
    };
  }

  // client/local/runtime.mjs
  init_model();
  init_images();
  function createLocalRuntime() {
    const db = createDeviceStore(), listeners = /* @__PURE__ */ new Set(), covers = /* @__PURE__ */ new Map(), pageUrls = /* @__PURE__ */ new Map(), deleted = /* @__PURE__ */ new Set();
    let library, requireRuntime, books = [], error = "", revision = 0, queryClient, loading = true, hiddenCount = 0;
    const channel = typeof BroadcastChannel === "function" ? new BroadcastChannel("kuro-device-books-v1") : null;
    function emit() {
      revision++;
      for (const fn of listeners) fn();
    }
    const book = (id) => books.find((b) => b.id === id);
    function mergeHistory(history) {
      const storage = requireRuntime(894), persisted = storage.readJson(storage.STORAGE_KEYS.history, []), merged = /* @__PURE__ */ new Map();
      for (const row of [...Array.isArray(persisted) ? persisted : [], ...history.getState().entries]) {
        const old = merged.get(row.chapterId);
        if (!old || (row.readAt || 0) >= (old.readAt || 0)) merged.set(row.chapterId, row);
      }
      history.setState({ entries: [...merged.values()].sort((a, b) => (b.readAt || 0) - (a.readAt || 0)).slice(0, 300) });
    }
    function cover(record2) {
      const approved = book(record2?.id);
      if (!approved) throw new Error(CONTENT_MESSAGE);
      let value = covers.get(approved.id);
      if (!value) {
        value = URL.createObjectURL(approved.cover);
        covers.set(approved.id, value);
      }
      return value;
    }
    function manga(record2) {
      return { id: record2.id, sourceId: "local", title: record2.title, description: "Imported " + record2.format + " \xB7 " + record2.pageCount + " pages. Stored on this browser/device; no file upload.", coverUrl: cover(record2), status: "COMPLETED", genres: [], author: "", local: true };
    }
    const chapters = (record2) => [{ id: chapterId(record2.id), mangaId: record2.id, sourceId: "local", title: "Imported comic", chapterNumber: 1, publishDate: record2.createdAt, pageCount: record2.pageCount }];
    async function checkedRecord(value) {
      if (!value || !isLocalId(value.id) || !await reviewedIdentity(value.id)) throw new Error(CONTENT_MESSAGE);
      const rows = await db.pages(value.id);
      if (rows.length !== value.pageCount || rows.some((p, i) => p.index !== i)) throw new Error(CONTENT_MESSAGE);
      const approval = await admitDevicePages(rows);
      if (approval.id !== value.id) throw new Error(CONTENT_MESSAGE);
      return { ...value, title: typeof value.title !== "string" || !value.title.trim() || forbiddenText(value.title) ? approval.reviewed.title : cleanDisplayTitle(value.title), format: /^[A-Z0-9.]{1,12}$/.test(value.format) || value.format === "Images" ? value.format : "Comic", cover: await coverFor(rows[0]) };
    }
    async function record(id) {
      if (!isLocalId(id)) throw new Error("This device book link is invalid.");
      const value = await checkedRecord(await db.get(id));
      if (!book(id)) {
        books.push(value);
        emit();
      }
      return value;
    }
    function addToLibrary(record2) {
      library.persist?.rehydrate?.();
      repair();
      deleted.delete(record2.id);
      const row = manga(record2), current = library.getState().entries[record2.id];
      if (current) library.setState((state) => ({ entries: { ...state.entries, [record2.id]: { ...current, ...row, chapters: chapters(record2) } } }));
      else {
        library.getState().add(row, "UNREAD");
        library.getState().setChapters(record2.id, chapters(record2));
      }
    }
    function repair() {
      if (!library) return;
      const available = new Map(books.map((b) => [b.id, b]));
      let changed = false;
      const entries = { ...library.getState().entries };
      for (const [id, row] of Object.entries(entries)) {
        const b = available.get(id);
        if (!b) continue;
        const url = cover(b);
        if (row.coverUrl !== url) {
          entries[id] = { ...row, ...manga(b), chapters: chapters(b) };
          changed = true;
        }
      }
      if (changed) library.setState({ entries });
      const history = requireRuntime?.(1602).useHistoryStore;
      if (history) {
        let updated = false;
        const rows = history.getState().entries.map((row) => {
          const b = available.get(row.mangaId);
          if (!b) return row;
          const url = cover(b);
          if (row.coverUrl === url) return row;
          updated = true;
          return { ...row, coverUrl: url };
        });
        if (updated) history.setState({ entries: rows });
      }
    }
    async function refresh() {
      try {
        const rows = await db.list(), approved = [];
        for (const row of rows) try {
          approved.push(await checkedRecord(row));
        } catch {
        }
        books = approved.sort((a, b) => b.createdAt - a.createdAt);
        hiddenCount = rows.length - approved.length;
        for (const [id, url] of covers) if (!book(id)) {
          URL.revokeObjectURL(url);
          covers.delete(id);
          for (const value of pageUrls.get(id) || []) URL.revokeObjectURL(value);
          pageUrls.delete(id);
          evict(id);
        }
        error = "";
        library?.persist?.rehydrate?.();
        repair();
      } catch (e) {
        error = e.message;
      } finally {
        loading = false;
        emit();
      }
    }
    function evict(id) {
      queryClient?.removeQueries({ predicate: (q) => q.queryKey?.some((v) => v === id || v === chapterId(id)) });
    }
    function releasePages() {
      for (const urls of pageUrls.values()) urls.forEach(URL.revokeObjectURL);
      pageUrls.clear();
      queryClient?.removeQueries({ predicate: (q) => q.queryKey?.[0] === "pages" && String(q.queryKey[1]).startsWith("local-") });
    }
    const adapter = {
      id: "local",
      name: "On this device",
      version: "1.0.0",
      color: "#E7B978",
      capabilities: { readable: true, search: false, popular: false, latest: false, trending: false, genres: false, languages: [], originFilter: false, requiresReferer: false },
      getBaseUrl: () => location.origin,
      getSortOptions: () => [],
      search: async () => [],
      searchPage: async () => ({ items: [] }),
      getPopular: async () => [],
      getLatestUpdates: async () => [],
      getTrending: async () => [],
      getMangaDetails: async (id) => manga(await record(id)),
      getChapterList: async (id) => chapters(await record(id)),
      getChapterPages: async (id) => {
        const value = id.match(/^(local-[a-f0-9]{64})-chapter-1$/);
        if (!value) throw new Error("Invalid device chapter.");
        const b = await record(value[1]);
        const rows = await db.pages(b.id);
        if (rows.length !== b.pageCount || rows.some((p, i) => p.index !== i || !(p.blob instanceof Blob) || p.blob.size < 1 || p.blob.size > LIMITS.pageBytes)) throw new Error("Some device pages are missing. Delete this imported copy and import the file again.");
        const approval = await admitDevicePages(rows);
        if (approval.id !== b.id) throw new Error(CONTENT_MESSAGE);
        let urls = pageUrls.get(b.id);
        if (!urls) {
          urls = rows.map((p) => URL.createObjectURL(p.blob));
          pageUrls.set(b.id, urls);
        }
        return { chapterId: id, verified: true, validation: "device", pages: rows.map((p, i) => ({ index: i, url: urls[i], width: p.width, height: p.height })), credits: [] };
      }
    };
    async function syncMessage(message) {
      if (!isLocalId(message?.id)) return;
      const value = await db.get(message.id);
      await refresh();
      if (value && message.operation === "add") addToLibrary(value);
      else if (!value) cleanState(message.id);
    }
    channel && (channel.onmessage = (e) => syncMessage(e.data).catch(() => {
    }));
    function cleanState(id) {
      deleted.add(id);
      evict(id);
      library?.persist?.rehydrate?.();
      library?.getState().remove(id);
      const history = requireRuntime?.(1602).useHistoryStore;
      if (history) {
        mergeHistory(history);
        history.getState().removeForManga(id);
        history.getState().flush();
      }
      const collections = requireRuntime?.(1662).useCollectionStore;
      collections?.persist?.rehydrate?.();
      for (const shelf of collections?.getState().collections || []) if (shelf.ids.includes(id)) collections.getState().remove(shelf.id, [id]);
      if (location.pathname.includes("/reader/" + chapterId(id))) requireRuntime?.(11).router.replace("/library");
      for (const url2 of pageUrls.get(id) || []) URL.revokeObjectURL(url2);
      pageUrls.delete(id);
      const url = covers.get(id);
      if (url) URL.revokeObjectURL(url);
      covers.delete(id);
    }
    const runtime = {
      adapter,
      db,
      subscribe: (fn) => {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
      getSnapshot: () => revision,
      get books() {
        return books;
      },
      get hiddenCount() {
        return hiddenCount;
      },
      get error() {
        return error;
      },
      get loading() {
        return loading;
      },
      manga,
      chapters,
      cover,
      mayRecord: (id) => !!book(id) && !deleted.has(id),
      mergeHistory,
      ownsUrl: (value) => [...covers.values(), ...[...pageUrls.values()].flat()].includes(value),
      async approval(id, identity) {
        if (identity && identity !== chapterId(id)) throw new Error(CONTENT_MESSAGE);
        return record(id);
      },
      normalizeHistory: (row) => {
        const b = book(row.mangaId);
        return b ? { ...row, coverUrl: cover(b) } : row;
      },
      connect(store, require2) {
        if (library) return;
        library = store;
        requireRuntime = require2;
        queryClient = require2(1596).queryClient;
        const original = library.persist.getOptions().partialize;
        library.persist.setOptions({ partialize: (state) => {
          const value = original(state);
          return { ...value, entries: Object.fromEntries(Object.entries(value.entries).map(([id, row]) => [id, row.sourceId === "local" ? { ...row, coverUrl: "" } : row])) };
        } });
        library.persist?.onFinishHydration?.(repair);
        refresh();
        library.subscribe(() => emit());
        window.addEventListener("popstate", () => {
          if (!location.pathname.startsWith("/reader/")) releasePages();
        });
        window.addEventListener("kuro:active-chapter-changed", (e) => {
          if (!String(e.detail).startsWith("local-")) releasePages();
        });
        let path = location.pathname;
        setInterval(() => {
          if (path !== location.pathname) {
            path = location.pathname;
            if (!path.startsWith("/reader/")) releasePages();
          }
        }, 800);
        window.addEventListener("pagehide", (e) => {
          if (!e.persisted) releasePages();
        });
      },
      async save(prepared, options) {
        await admitDevicePages(prepared.pages, { signal: options?.signal });
        const result = await db.save(prepared, options);
        await refresh();
        const approved = book(result.book.id);
        if (!approved) throw new Error(CONTENT_MESSAGE);
        addToLibrary(approved);
        channel?.postMessage({ id: approved.id, operation: "add" });
        return { ...result, book: approved };
      },
      async add(id) {
        const b = await record(id);
        addToLibrary(b);
        channel?.postMessage({ id, operation: "add" });
        emit();
      },
      async delete(id) {
        await db.delete(id);
        cleanState(id);
        await refresh();
        channel?.postMessage({ id, operation: "delete" });
      },
      inLibrary: (id) => !!library?.getState().entries[id],
      async read(id) {
        const b = await record(id), row = manga(b), chapter = chapters(b)[0], codec = requireRuntime(1601);
        codec.rememberManga(row);
        codec.rememberChapter(chapter);
        if (library.getState().entries[id]?.readingStatus === "UNREAD") {
          library.persist?.rehydrate?.();
          repair();
          library.getState().setReadingStatus(id, "READING");
        }
        requireRuntime(11).router.navigate({ pathname: "/reader/[chapterId]", params: { ...codec.encodeReader(row, chapter), chapterId: chapter.id } });
      },
      refresh
    };
    return runtime;
  }

  // client/local/ui.mjs
  init_define_KURO_BOOTSTRAP_PROVIDERS();

  // client/local/importer.mjs
  init_define_KURO_BOOTSTRAP_PROVIDERS();
  init_model();

  // client/local/archive.mjs
  init_define_KURO_BOOTSTRAP_PROVIDERS();
  init_model();
  function extractArchive(file, { signal, onProgress = () => {
  } } = {}) {
    abortCheck(signal);
    return new Promise((resolve, reject) => {
      const worker = new Worker("/local-archive-worker.js", { type: "module" });
      let done = false;
      const finish = (error, pages) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
        worker.terminate();
        error ? reject(error) : resolve(pages);
      };
      const abort = () => finish(new DOMException("Import cancelled", "AbortError"));
      const timer = setTimeout(() => finish(new Error("Archive extraction took too long. Split this comic into smaller files.")), 9e4);
      signal?.addEventListener("abort", abort, { once: true });
      worker.onerror = () => finish(new Error("Archive tools could not load. Reload KURO and try again."));
      worker.onmessage = ({ data }) => {
        if (data.kind === "progress") onProgress(data.message);
        else if (data.kind === "done") finish(null, { pages: data.pages, metadata: data.metadata });
        else if (data.kind === "error") finish(new Error(data.message));
      };
      if (file.size > LIMITS.input) finish(new Error("Choose a comic file of 150 MiB or less."));
      else worker.postMessage({ file });
    });
  }

  // client/local/pdf.mjs
  init_define_KURO_BOOTSTRAP_PROVIDERS();
  init_model();
  init_images();
  async function pdfPages(file, { signal, onProgress = () => {
  } } = {}) {
    abortCheck(signal);
    const data = new Uint8Array(await file.arrayBuffer());
    if (!new TextDecoder("latin1").decode(data.subarray(0, 1024)).includes("%PDF-")) throw new Error("This file does not contain a valid PDF signature.");
    const pdfjs = await import(
      /* @vite-ignore */
      "/vendor/local/pdf.mjs"
    );
    pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/local/pdf.worker.mjs";
    const worker = new Worker("/local-pdf-worker.mjs", { type: "module" });
    let imageWarning = false;
    worker.addEventListener("message", (e) => {
      if (e.data?.reason?.message || e.data?.targetName === "kuro-pdf-validation" && e.data.kind === "image-warning") imageWarning = true;
    });
    try {
      await new Promise((resolve, reject) => {
        const ready = (e) => {
          if (e.data?.targetName === "kuro-pdf-validation" && e.data.kind === "ready") finish();
        };
        const abort2 = () => finish(new DOMException("Import cancelled", "AbortError"));
        const fail = () => finish(new Error("PDF tools could not load. Reload KURO and try again."));
        const timer2 = setTimeout(fail, 2e4);
        function finish(error) {
          clearTimeout(timer2);
          worker.removeEventListener("message", ready);
          worker.removeEventListener("error", fail);
          signal?.removeEventListener("abort", abort2);
          error ? reject(error) : resolve();
        }
        worker.addEventListener("message", ready);
        worker.addEventListener("error", fail, { once: true });
        signal?.addEventListener("abort", abort2, { once: true });
        if (signal?.aborted) abort2();
      });
    } catch (error) {
      worker.terminate();
      throw error;
    }
    const pdfWorker = new pdfjs.PDFWorker({ port: worker });
    const loading = pdfjs.getDocument({
      data,
      stopAtErrors: true,
      isEvalSupported: false,
      enableXfa: false,
      disableWorkerRendering: true,
      worker: pdfWorker,
      maxImageSize: LIMITS.pixels,
      canvasMaxAreaInBytes: 32e6,
      cMapUrl: "/vendor/local/cmaps/",
      standardFontDataUrl: "/vendor/local/standard_fonts/",
      wasmUrl: "/vendor/local/wasm/"
    });
    let document2, renderTask, timedOut = false;
    const abort = () => {
      renderTask?.cancel();
      loading.destroy().catch(() => {
      });
    };
    const timer = setTimeout(() => {
      timedOut = true;
      abort();
    }, 18e4);
    signal?.addEventListener("abort", abort, { once: true });
    loading.onPassword = () => {
      loading.destroy().catch(() => {
      });
    };
    try {
      document2 = await loading.promise;
      abortCheck(signal);
      if (document2.numPages > LIMITS.pages) throw new Error("Import up to 600 PDF pages at a time.");
      const pages = [];
      let total = 0;
      for (let n = 1; n <= document2.numPages; n++) {
        abortCheck(signal);
        onProgress("Preparing PDF page " + n + " of " + document2.numPages);
        const page = await document2.getPage(n), original = page.getViewport({ scale: 1 });
        if (!Number.isFinite(original.width) || !Number.isFinite(original.height) || original.width <= 0 || original.height <= 0) throw new Error("This PDF has an invalid page size.");
        const scale = Math.min(2, 1800 / original.width, 2600 / original.height, Math.sqrt(8e6 / (original.width * original.height))), viewport = page.getViewport({ scale });
        const canvas = window.document.createElement("canvas");
        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));
        try {
          onProgress("Checking PDF page " + n + " of " + document2.numPages);
          const operations = await page.getOperatorList({ annotationMode: pdfjs.AnnotationMode.DISABLE });
          if (imageWarning) throw new Error("Page " + n + " contains a damaged, missing or oversized image.");
          onProgress("Rendering PDF page " + n + " of " + document2.numPages);
          renderTask = page.render({ canvasContext: canvas.getContext("2d"), viewport, annotationMode: pdfjs.AnnotationMode.DISABLE, background: "rgb(255,255,255)" });
          await renderTask.promise;
          abortCheck(signal);
          const external = /* @__PURE__ */ new Set([pdfjs.OPS.paintImageXObject, pdfjs.OPS.paintImageXObjectRepeat]);
          for (let i = 0; i < operations.fnArray.length; i++) if (external.has(operations.fnArray[i])) {
            const [id, width, height] = operations.argsArray[i], objects = String(id).startsWith("g_") ? page.commonObjs : page.objs;
            const image = await new Promise((resolve) => objects.get(id, resolve));
            if (!image) throw new Error("Page " + n + " contains a damaged or missing image.");
            if (image.width && image.height) validateDimensions(image.width, image.height);
            else if (Number.isInteger(width) && Number.isInteger(height)) validateDimensions(width, height);
          }
          if (imageWarning) throw new Error("Page " + n + " contains an image that could not be decoded safely.");
          const blob = await canvasBlob(canvas);
          total += blob.size;
          if (total > LIMITS.expanded || blob.size > LIMITS.pageBytes) throw new Error("The PDF pages exceed the allowed import size.");
          pages.push({ name: String(n).padStart(4, "0") + ".webp", blob });
        } finally {
          canvas.width = canvas.height = 1;
          renderTask = void 0;
          page.cleanup();
        }
      }
      return pages;
    } catch (error) {
      abortCheck(signal);
      if (timedOut) throw new Error("PDF conversion took too long. Split it into smaller comics.");
      if (/password|destroyed/i.test(error.message)) throw new Error("Password-protected PDFs are not supported. Export an unlocked copy first.");
      throw new Error("PDF import failed: " + error.message);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      let cleanupTimer;
      await Promise.race([loading.destroy().catch(() => {
      }), new Promise((resolve) => {
        cleanupTimer = setTimeout(resolve, 300);
      })]);
      clearTimeout(cleanupTimer);
      pdfWorker.destroy();
      worker.terminate();
    }
  }

  // client/local/importer.mjs
  init_images();

  // client/local/epub.mjs
  init_define_KURO_BOOTSTRAP_PROVIDERS();
  function epubPages({ pages, metadata }) {
    const parse = (value) => {
      if (!value) throw new Error("This EPUB is missing its reading-order metadata.");
      if (/<!ENTITY/i.test(value)) throw new Error("EPUB entity declarations are not supported.");
      const doc2 = new DOMParser().parseFromString(value, "application/xml");
      if (doc2.querySelector("parsererror")) throw new Error("The EPUB reading-order metadata is damaged.");
      return doc2;
    };
    const elements = (doc2, name) => [...doc2.getElementsByTagNameNS("*", name)];
    const resolve = (href, base) => {
      const u = new URL(href, "https://epub.invalid/" + base);
      if (u.origin !== "https://epub.invalid" || u.search) throw new Error("This EPUB references a page outside the comic file.");
      return decodeURIComponent(u.pathname.slice(1));
    };
    const container = parse(metadata["META-INF/container.xml"]), opf = elements(container, "rootfile")[0]?.getAttribute("full-path");
    if (!opf || !metadata[opf]) throw new Error("This EPUB is missing its content manifest.");
    const doc = parse(metadata[opf]), manifest = new Map(elements(doc, "item").map((item) => [item.getAttribute("id"), resolve(item.getAttribute("href") || "", opf)]));
    const images = new Map(pages.map((page) => [page.name, page])), ordered = [];
    const add = (name) => {
      const image = images.get(name);
      if (!image) throw new Error("A comic page referenced by this EPUB is missing or unsupported.");
      if (ordered.length >= 600) throw new Error("Import up to 600 EPUB pages at a time.");
      ordered.push(image);
    };
    for (const item of elements(doc, "itemref")) {
      if (item.getAttribute("linear") === "no") continue;
      const name = manifest.get(item.getAttribute("idref"));
      if (!name) throw new Error("This EPUB has a damaged reading order.");
      if (images.has(name)) {
        add(name);
        continue;
      }
      const page = parse(metadata[name]);
      for (const image of [...page.getElementsByTagName("*")].filter((node) => ["img", "image"].includes(node.localName))) {
        const href = image.getAttribute("src") || image.getAttribute("href") || image.getAttributeNS("http://www.w3.org/1999/xlink", "href");
        if (href) add(resolve(href, name));
      }
    }
    if (!ordered.length) throw new Error("No comic images were found in the EPUB reading order. Text-only EPUBs are not supported.");
    return ordered;
  }

  // client/local/importer.mjs
  async function prepareImport(files, { signal, onProgress = () => {
  } } = {}) {
    if (!globalThis.crypto?.subtle) throw new Error("Open KURO over HTTPS (or localhost) to import files securely on this device.");
    files = Array.from(files);
    const kind = validateInput(files);
    abortCheck(signal);
    let raw, epub = false;
    if (kind === "archive") {
      const archive = await extractArchive(files[0], { signal, onProgress });
      epub = /\.epub$/i.test(files[0].name);
      raw = epub ? epubPages(archive) : archive.pages;
    } else raw = kind === "pdf" ? await pdfPages(files[0], { signal, onProgress }) : files.map((file) => ({ name: file.webkitRelativePath || file.name, blob: file }));
    if (!epub) raw.sort((a, b) => pageCompare(a.name, b.name));
    const pages = [];
    let size = 0;
    for (const page of raw) {
      abortCheck(signal);
      size += page.blob.size;
      if (size > LIMITS.expanded) throw new Error("These pages exceed the 200 MiB import limit.");
      onProgress("Checking page " + (pages.length + 1) + " of " + raw.length);
      try {
        pages.push(await validatedPage(page, signal));
      } catch (error) {
        if (error.name === "AbortError") throw error;
        throw new Error(cleanTitle(page.name) + ": " + error.message);
      }
    }
    abortCheck(signal);
    const approval = await admitDevicePages(pages, { signal });
    const cover = await coverFor(pages[0], signal);
    abortCheck(signal);
    const folder = files[0].webkitRelativePath?.split("/")[0];
    return { title: approvedTitle(cleanTitle(folder || (kind === "image" && files.length > 1 ? approval.reviewed.title : files[0].name)), approval.reviewed.title), format: kind === "image" ? "Images" : files[0].name.split(".").pop().toUpperCase(), pages, cover, size };
  }

  // client/local/ui.mjs
  init_model();
  var accept = ".cbz,.zip,.cbr,.rar,.cb7,.7z,.cbt,.tar,.tgz,.tar.gz,.tar.bz2,.tar.xz,.epub,.pdf,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif";
  function libraryExtension(React, Original, runtime) {
    const h = React.createElement;
    const size = (n) => n < 1024 * 1024 ? (n / 1024).toFixed(0) + " KiB" : (n / 1024 / 1024).toFixed(1) + " MiB";
    function ImportDialog({ onClose }) {
      React.useSyncExternalStore(runtime.subscribe, runtime.getSnapshot);
      const ref = React.useRef(), fileRef = React.useRef(), folderRef = React.useRef(), controller = React.useRef();
      const [draft, setDraft] = React.useState(), [title, setTitle] = React.useState(""), [busy, setBusy] = React.useState(""), [progress, setProgress] = React.useState(""), [error, setError] = React.useState(""), [result, setResult] = React.useState(), [confirm, setConfirm] = React.useState(""), [drag, setDrag] = React.useState(false), [reverse, setReverse] = React.useState(false), [cover, setCover] = React.useState("");
      React.useEffect(() => {
        const previous = document.activeElement;
        ref.current.showModal?.();
        if (!ref.current.open) ref.current.setAttribute("open", "");
        fileRef.current?.parentElement.querySelector("button")?.focus();
        return () => {
          controller.current?.abort();
          if (previous?.isConnected) previous.focus({ preventScroll: true });
        };
      }, []);
      React.useEffect(() => {
        if (!draft) return;
        const url = URL.createObjectURL(reverse ? draft.pages[draft.pages.length - 1].blob : draft.cover);
        setCover(url);
        return () => URL.revokeObjectURL(url);
      }, [draft, reverse]);
      const close = () => {
        if (busy === "save") return;
        controller.current?.abort();
        onClose();
      };
      async function choose(files) {
        if (busy || !files?.length) return;
        const current = new AbortController();
        controller.current?.abort();
        controller.current = current;
        setBusy("prepare");
        setProgress("Opening your comic\u2026");
        setError("");
        setDraft(void 0);
        setResult(void 0);
        setReverse(false);
        try {
          const prepared = await prepareImport(files, { signal: current.signal, onProgress: setProgress });
          if (current.signal.aborted) return;
          setDraft(prepared);
          setTitle(prepared.title);
        } catch (e) {
          if (!current.signal.aborted) setError(importError(e));
        } finally {
          if (controller.current === current) setBusy("");
        }
      }
      async function save() {
        if (!draft || busy) return;
        setBusy("save");
        setError("");
        setProgress("Saving to this device\u2026");
        const current = new AbortController();
        controller.current = current;
        try {
          const prepared = reverse ? { ...draft, pages: [...draft.pages].reverse(), cover: await (await Promise.resolve().then(() => (init_images(), images_exports))).coverFor(draft.pages[draft.pages.length - 1], current.signal) } : draft;
          const saved = await runtime.save(prepared, { title, signal: current.signal });
          setResult(saved);
          setDraft(void 0);
          setProgress("");
        } catch (e) {
          setError(importError(e));
        } finally {
          setBusy("");
        }
      }
      async function action(fn) {
        setError("");
        try {
          await fn();
        } catch (e) {
          setError(importError(e));
        }
      }
      const button = (text, props = {}) => h("button", { type: "button", ...props }, text);
      const bookRows = runtime.books.map((book) => h(
        "li",
        { key: book.id, className: "kuro-local-book" },
        h("img", { src: runtime.cover(book), alt: "", width: 42, height: 60 }),
        h("div", { className: "kuro-local-book-info" }, h("strong", {}, book.title), h("small", {}, book.pageCount + " pages \xB7 " + book.format + " \xB7 " + size(book.size))),
        h("div", { className: "kuro-local-book-actions" }, confirm === book.id ? h(React.Fragment, {}, h("span", {}, "Delete browser copy and progress?"), button("Delete copy", { className: "kuro-local-danger", onClick: () => action(async () => {
          await runtime.delete(book.id);
          setConfirm("");
        }) }), button("Keep", { onClick: () => setConfirm("") })) : h(React.Fragment, {}, button("Read", { disabled: !!busy, onClick: () => action(async () => {
          await runtime.read(book.id);
          onClose();
        }) }), !runtime.inLibrary(book.id) ? button("Add to library", { disabled: !!busy, "aria-label": "Add " + book.title + " to library", onClick: () => action(() => runtime.add(book.id)) }) : null, button("Delete files", { disabled: !!busy, "aria-label": "Delete device files for " + book.title, onClick: () => setConfirm(book.id) })))
      ));
      return h(
        "dialog",
        { ref, id: "kuro-local-dialog", "aria-labelledby": "kuro-local-dialog-title", "aria-describedby": "kuro-local-note", className: "kuro-local-dialog", onCancel: (e) => {
          e.preventDefault();
          close();
        }, onClose: close },
        h("header", { className: "kuro-local-dialog-header" }, h("div", {}, h("p", { className: "kuro-local-eyebrow" }, "YOUR FILES / YOUR STORIES"), h("h2", { id: "kuro-local-dialog-title" }, "Import manga")), button("\xD7", { className: "kuro-local-close", "aria-label": "Close import", disabled: busy === "save", onClick: close })),
        h("p", { id: "kuro-local-note", className: "kuro-local-note" }, "Only reviewed comics can be imported under KURO\u2019s strict content rules. Unreviewed files are refused before preview. Files stay on this browser/device and are never uploaded."),
        h(
          "section",
          { className: "kuro-local-drop" + (drag ? " is-dragging" : ""), "aria-label": "Choose manga files", onDragOver: (e) => {
            e.preventDefault();
            if (!busy) setDrag(true);
          }, onDragLeave: () => setDrag(false), onDrop: (e) => {
            e.preventDefault();
            setDrag(false);
            choose(e.dataTransfer.files);
          } },
          h("span", { className: "kuro-local-file-icon", "aria-hidden": true }, "\u21A5"),
          h("strong", {}, "A new story, from your device."),
          h("p", {}, "Drop one comic or PDF here, or choose image pages."),
          h("input", { ref: fileRef, id: "kuro-local-files", type: "file", accept, multiple: true, hidden: true, onChange: (e) => {
            choose(e.target.files);
            e.target.value = "";
          }, "aria-label": "Manga files" }),
          h("input", { ref: folderRef, id: "kuro-local-folder", type: "file", accept, multiple: true, webkitdirectory: "", hidden: true, onChange: (e) => {
            const files = Array.from(e.target.files).filter((f) => /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(f.name) && !(f.webkitRelativePath || f.name).split("/").some((s) => s.startsWith(".") || s === "__MACOSX"));
            choose(files);
            e.target.value = "";
          }, "aria-label": "Manga image folder" }),
          h("div", { className: "kuro-local-choices" }, button("Choose files", { className: "kuro-local-primary", disabled: !!busy || runtime.loading || !!runtime.error, onClick: () => fileRef.current.click() }), button("Choose image folder", { disabled: !!busy || runtime.loading || !!runtime.error, onClick: () => folderRef.current.click() })),
          h("small", {}, "CBZ / ZIP \xB7 CBR / RAR \xB7 CB7 / 7z \xB7 CBT / TAR \xB7 PDF \xB7 image EPUB \xB7 image pages"),
          h("small", {}, "150 MiB input \xB7 600 pages \xB7 12 MiB per image. One comic per import.")
        ),
        busy ? h("div", { className: "kuro-local-progress", role: "status", "aria-live": "polite" }, h("span", { className: "kuro-local-spinner", "aria-hidden": true }), h("span", {}, progress), busy === "prepare" ? button("Cancel import", { onClick: () => {
          controller.current?.abort();
          setBusy("");
          setProgress("");
          setError("Import cancelled. No book was added.");
        } }) : null) : null,
        error || runtime.error ? h("p", { className: "kuro-local-error", role: "alert" }, error || runtime.error) : null,
        draft ? h(
          "section",
          { className: "kuro-local-draft", "aria-label": "Comic preview" },
          h("img", { src: cover, alt: "First page preview" }),
          h(
            "div",
            {},
            h("label", { htmlFor: "kuro-local-title" }, "Manga title"),
            h("input", { id: "kuro-local-title", value: title, maxLength: 120, disabled: !!busy, onChange: (e) => setTitle(e.target.value), "aria-label": "Manga title" }),
            h("p", {}, draft.pages.length + " pages \xB7 " + draft.format + " \xB7 " + size(draft.size)),
            h("label", { className: "kuro-local-order" }, h("input", { type: "checkbox", checked: reverse, disabled: !!busy, onChange: (e) => setReverse(e.target.checked) }), "Reverse page order"),
            h("small", {}, "Page order: " + (reverse ? [...draft.pages].reverse() : draft.pages).slice(0, 3).map((p) => p.name).join(" \u2192 ")),
            button("Add to library", { className: "kuro-local-primary", disabled: !!busy || !title.trim(), onClick: save })
          )
        ) : null,
        result ? h("section", { id: "kuro-local-result", className: "kuro-local-result", role: "status" }, h("strong", {}, result.duplicate ? "Already imported \u2014 ready in your library." : "Added to your library."), h("p", {}, result.book.title + " \xB7 " + result.book.pageCount + " pages. Your progress is saved on this device."), h("div", { className: "kuro-local-choices" }, button("Read now", { className: "kuro-local-primary", onClick: () => action(async () => {
          await runtime.read(result.book.id);
          onClose();
        }) }), button("Back to library", { onClick: close }))) : null,
        h(
          "section",
          { className: "kuro-local-device-files", "aria-label": "Manga stored on this device" },
          h("div", { className: "kuro-local-section-heading" }, h("h3", {}, "On this device"), h("span", {}, runtime.books.length + " comics")),
          runtime.loading ? h("p", { role: "status" }, "Opening device storage\u2026") : bookRows.length ? h("ul", {}, bookRows) : h("p", {}, "Approved device manga will appear here and in your Library."),
          runtime.hiddenCount ? h("p", { className: "kuro-content-notice" }, runtime.hiddenCount + " unverified device comic" + (runtime.hiddenCount === 1 ? " is" : "s are") + " hidden. Stored files are preserved.") : null,
          h("small", {}, "Deleting files removes KURO\u2019s browser copy and reading progress. Your original file on the device stays intact. Clearing website data also deletes these copies.")
        )
      );
    }
    function Controls() {
      React.useSyncExternalStore(runtime.subscribe, runtime.getSnapshot);
      const [open, setOpen] = React.useState(false);
      return h(
        "div",
        { className: "kuro-local-toolbar", id: "kuro-local-toolbar" },
        h("button", { type: "button", className: "kuro-local-import-button", onClick: () => setOpen(true) }, h("span", { "aria-hidden": true }, "\uFF0B"), "Import manga"),
        runtime.books.length ? h("button", { type: "button", className: "kuro-local-files-button", onClick: () => setOpen(true) }, "Device files \xB7 " + runtime.books.length) : h("span", { className: "kuro-local-device-caption" }, "Reviewed files only"),
        open ? h(ImportDialog, { onClose: () => setOpen(false) }) : null
      );
    }
    return function LibraryWithImport(props) {
      const tree = Original(props);
      if (!React.isValidElement(tree)) return tree;
      const children = React.Children.toArray(tree.props.children), header = children[0];
      if (!React.isValidElement(header)) return tree;
      const inside = React.Children.toArray(header.props.children);
      inside.splice(2, 0, h(Controls, { key: "kuro-local-controls" }));
      inside.push(h("p", { key: "strict-content-rule", className: "kuro-content-notice" }, "Strict content rules: adult, suggestive and unverified titles are hidden. Saved entries and files are preserved."));
      children[0] = React.cloneElement(header, {}, inside);
      return React.cloneElement(tree, {}, children);
    };
  }

  // client/mobile-artwork.mjs
  init_define_KURO_BOOTSTRAP_PROVIDERS();
  function mobileCoverCandidates(value) {
    try {
      const original = new URL(value);
      if (!["https:", "http:", "blob:"].includes(original.protocol) || original.username || original.password) return [];
      const full = new URL(original.href);
      if (full.hostname === "uploads.mangadex.org") full.pathname = full.pathname.replace(/\.(256|512)\.jpg$/, "");
      else if (full.pathname.startsWith("/wp-content/uploads/") && !full.search) full.pathname = full.pathname.replace(/-\d{2,4}x\d{2,4}(?=\.(jpe?g|png|webp)$)/i, "");
      else if (full.hostname.endsWith(".compsci88.com") || full.hostname.endsWith(".planeptune.us")) full.pathname = full.pathname.replace("/cover/small/", "/cover/normal/");
      return [.../* @__PURE__ */ new Set([full.href, original.href])];
    } catch {
      return [];
    }
  }
  function artworkExtension(React, Original, dimensions, resolveSource) {
    const h = React.createElement;
    function MobileArtwork({ uri, title }) {
      const candidates = React.useMemo(() => mobileCoverCandidates(uri), [uri]);
      const [index, setIndex] = React.useState(0), [failed, setFailed] = React.useState(false);
      React.useEffect(() => {
        setIndex(0);
        setFailed(false);
      }, [uri]);
      const value = candidates[Math.min(index, candidates.length - 1)], source = value ? resolveSource(value) : void 0;
      return h(
        "div",
        { "data-testid": "quality-artwork", className: "kuro-mobile-artwork" },
        h("div", { "data-testid": "premium-hero-art", className: "kuro-mobile-artwork-image" }, source && !failed ? h("img", {
          key: value,
          src: source.uri,
          alt: title + " cinematic artwork",
          loading: "eager",
          decoding: "async",
          fetchPriority: "high",
          referrerPolicy: "no-referrer",
          onError: () => {
            if (index < candidates.length - 1) setIndex(index + 1);
            else setFailed(true);
          }
        }) : h("span", { className: "kuro-mobile-artwork-fallback", "aria-label": "Artwork unavailable" }, "KURO /"))
      );
    }
    return function ResponsiveArtwork(props) {
      const { width } = dimensions();
      return width < 700 && !props.detail ? h(MobileArtwork, props) : h(Original, props);
    };
  }

  // client/content-runtime.mjs
  init_define_KURO_BOOTSTRAP_PROVIDERS();
  var keyOf = (source, id, chapter = "") => source + "|" + id + "|" + chapter;
  var coverUrl = (source, id) => location.origin + "/api/catalogue/cover?provider=" + encodeURIComponent(source) + "&id=" + encodeURIComponent(id);
  var EMPTY_IMAGE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  function createContentRuntime(local) {
    const approvals = /* @__PURE__ */ new Map(), pending = /* @__PURE__ */ new Map(), listeners = /* @__PURE__ */ new Set(), queue = [], queued = /* @__PURE__ */ new Set(), projections = /* @__PURE__ */ new WeakMap();
    let revision = 0, workers = 0;
    let readableCheck, readableCached, readableChapter;
    const emit = () => {
      revision++;
      for (const fn of listeners) fn();
    };
    const valid = (row) => row?.expires > Date.now() && row.allowed;
    function current(source, id, chapter = "") {
      if (blockedIdentity(source, id, chapter)) return;
      const row = approvals.get(keyOf(source, id, chapter));
      return valid(row) ? row : void 0;
    }
    function remember(manga, chapter) {
      const checkedAt = manga?.contentApproval?.checkedAt;
      if (!["mangadex", "anilist"].includes(manga?.sourceId) || blockedIdentity(manga.sourceId, manga.id, chapter?.id) || manga.contentApproval?.version !== CONTENT_POLICY_VERSION || !Number.isFinite(checkedAt) || checkedAt > Date.now() + 5e3 || checkedAt + RATING_TTL_MS <= Date.now()) return;
      const row = { allowed: true, manga: { ...manga, coverUrl: coverUrl(manga.sourceId, manga.id) }, chapter, expires: checkedAt + RATING_TTL_MS };
      approvals.set(keyOf(manga.sourceId, manga.id), row);
      if (chapter) approvals.set(keyOf(manga.sourceId, manga.id, chapter.id), row);
      while (approvals.size > 2400) approvals.delete(approvals.keys().next().value);
      emit();
      return row;
    }
    async function verify(manga, chapter, force = false) {
      const source = manga?.sourceId, id = manga?.id, identity = typeof chapter === "string" ? chapter : chapter?.id, key = keyOf(source, id, identity);
      if (source === "local") {
        const allowed = await local?.approval(id, identity);
        if (!allowed) throw new Error(CONTENT_MESSAGE);
        return { allowed: true, manga: local.manga(allowed), ...identity ? { chapter: local.chapters(allowed)[0] } : {} };
      }
      if (providerContentPolicy({ id: source }).state !== "eligible" || blockedIdentity(source, id, identity)) throw new Error(CONTENT_MESSAGE);
      if (!force) {
        const hit = current(source, id, identity);
        if (hit) return hit;
      }
      if (pending.has(key)) return pending.get(key);
      const task = (async () => {
        const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15e3);
        try {
          const q = new URLSearchParams({ provider: source, id });
          if (identity) q.set("chapter", identity);
          const response = await fetch("/api/catalogue/content/check?" + q, { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" }, signal: controller.signal }), data = await response.json();
          if (!response.ok || data.allowed !== true || data.policyVersion !== CONTENT_POLICY_VERSION || data.manga?.id !== id || data.manga?.sourceId !== source || identity && data.chapter?.id !== identity) throw new Error(CONTENT_MESSAGE);
          const row = remember(data.manga, data.chapter);
          if (!row) throw new Error("Content approval expired. Retry when the source is available.");
          return row;
        } catch (error) {
          approvals.set(key, { allowed: false, expires: Date.now() + RATING_TTL_MS });
          if (!identity) approvals.delete(keyOf(source, id));
          emit();
          throw error;
        } finally {
          clearTimeout(timer);
        }
      })();
      pending.set(key, task);
      try {
        return await task;
      } finally {
        pending.delete(key);
      }
    }
    function enqueue(manga, chapter) {
      if (providerContentPolicy({ id: manga.sourceId }).state !== "eligible" || blockedIdentity(manga.sourceId, manga.id, chapter)) return;
      const key = keyOf(manga.sourceId, manga.id, chapter);
      if (current(manga.sourceId, manga.id, chapter) && readableCached?.(manga.id) || queued.has(key) || approvals.get(key)?.allowed === false && approvals.get(key)?.expires > Date.now()) return;
      queued.add(key);
      queue.push({ manga, chapter, key });
      pump();
    }
    function pump() {
      while (workers < 2 && queue.length) {
        workers++;
        const { manga, chapter, key } = queue.shift();
        verify(manga, chapter).then(() => readableCheck?.(manga)).catch(() => {
        }).finally(() => {
          queued.delete(key);
          workers--;
          emit();
          pump();
        });
      }
    }
    function project(state, kind) {
      const previous = projections.get(state);
      if (previous?.revision === revision && previous.kind === kind) return previous.state;
      const entries = kind === "library" ? Object.values(state.entries) : state.entries || [], visible = [];
      for (const item of entries) {
        const id = kind === "library" ? item.id : item.mangaId, source = item.sourceId, chapter = kind === "history" ? item.chapterId : void 0;
        if (source === "local") {
          const book = local?.books.find((b) => b.id === id);
          if (book) {
            const manga = local.manga(book);
            visible.push(kind === "library" ? { ...item, ...manga, chapters: local.chapters(book) } : { ...item, mangaTitle: manga.title, coverUrl: manga.coverUrl, chapterTitle: "Imported comic" });
          }
          continue;
        }
        const approved = current(source, id, chapter);
        if (approved && readableCached?.(id)?.ready) {
          const manga = approved.manga;
          visible.push(kind === "library" ? { ...item, ...manga, chapters: (item.chapters || []).filter((c) => !forbiddenText(c.title)).map((c) => ({ ...c, title: "Chapter " + c.chapterNumber })) } : { ...item, mangaTitle: manga.title, coverUrl: manga.coverUrl, chapterTitle: approved.chapter?.title || "Chapter " + item.chapterNumber });
        } else queueMicrotask(() => enqueue({ id, sourceId: source }, chapter));
      }
      const result = { ...state, entries: kind === "library" ? Object.fromEntries(groupSeries(visible, true).map((g) => [g.primary.id, g.primary])) : visible };
      projections.set(state, { revision, kind, state: result });
      return result;
    }
    function wrapStore(React, original, kind) {
      function safeStore(selector = (value) => value) {
        React.useSyncExternalStore(api.subscribe, api.getSnapshot);
        return original((state) => selector(project(state, kind)));
      }
      Object.assign(safeStore, original);
      safeStore.getVisibleState = () => project(original.getState(), kind);
      return safeStore;
    }
    function resolveImage(value) {
      try {
        const url = new URL(value, location.origin);
        if (url.protocol === "blob:") return local?.ownsUrl(value) ? { uri: value } : { uri: EMPTY_IMAGE };
        if (url.protocol === "data:") return { uri: EMPTY_IMAGE };
        if (url.origin === location.origin) {
          if (url.pathname.startsWith("/assets/") || ["/api/profile/avatar", "/api/catalogue/page", "/api/catalogue/cover"].includes(url.pathname)) return { uri: url.href };
          return { uri: EMPTY_IMAGE };
        }
        const match = url.hostname === "uploads.mangadex.org" && /^\/covers\/([^/]+)\//.exec(url.pathname);
        if (match && UUID.test(match[1])) return { uri: coverUrl("mangadex", "mangadex-" + match[1].toLowerCase()) };
      } catch {
      }
      return { uri: EMPTY_IMAGE };
    }
    function route(React, require2, reader) {
      const h = React.createElement, router = require2(11), codec = require2(1601), Screen = reader ? require2(1723).ReaderScreen : require2(1707).MangaDetailScreen;
      return function ContentGuard() {
        const params = router.useLocalSearchParams(), identity = Array.isArray(params.chapterId) ? params.chapterId[0] : params.chapterId, decoded = reader ? codec.decodeReader(params, identity || "") : { manga: codec.decodeManga(params) }, manga = decoded.manga, chapter = reader ? decoded.chapter?.id : void 0;
        const key = keyOf(manga?.sourceId, manga?.id, chapter), [result, setResult] = React.useState({ key: "", pending: true });
        React.useEffect(() => {
          let alive = true;
          setResult({ key, pending: true });
          const check = () => verify(manga, chapter, true).then(async (data) => {
            if (reader) await readableChapter?.(data.manga, chapter);
            else {
              const proof = await readableCheck?.(data.manga);
              if (!proof?.ready) throw new Error("No complete readable chapter has been verified.");
            }
            if (alive) setResult({ key, data });
          }).catch(() => {
            if (alive) setResult({ key, error: true });
          });
          check();
          const timer = setInterval(check, RATING_TTL_MS), visible = () => {
            if (!document.hidden) check();
          };
          document.addEventListener("visibilitychange", visible);
          return () => {
            alive = false;
            clearInterval(timer);
            document.removeEventListener("visibilitychange", visible);
          };
        }, [key]);
        if (result.key !== key || result.pending) return h("main", { className: "kuro-content-state", role: "status" }, h("span", {}, "KURO /"), h("h1", {}, "Checking the complete chapter\u2026"), h("p", {}, "KURO checks the content rating and every page before opening a story. Long chapters may take a moment."));
        if (result.error) return h("main", { className: "kuro-content-state", role: "alert" }, h("span", {}, "KURO STORY CHECK"), h("h1", {}, "This title is unavailable"), h("p", {}, CONTENT_MESSAGE + " A complete readable chapter must also be verified."), h("button", { type: "button", onClick: () => router.router.replace("/library") }, "Back to library"));
        return h(Screen, { manga: result.data.manga, ...reader ? { chapter: result.data.chapter, readingMode: ["WEBTOON", "LTR", "RTL"].includes(params.readingMode) ? params.readingMode : void 0 } : {} });
      };
    }
    const api = { verify, current, remember, wrapStore, resolveImage, route, subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    }, getSnapshot: () => revision, project, changed: emit, configureReadability: (check, cached, chapter) => {
      readableCheck = check;
      readableCached = cached;
      readableChapter = chapter;
    } };
    if (typeof window !== "undefined") {
      local?.subscribe(emit);
      setInterval(() => {
        for (const [key, row] of approvals) if (row.expires <= Date.now()) approvals.delete(key);
        emit();
      }, RATING_TTL_MS);
    }
    return api;
  }

  // client/email-auth.mjs
  init_define_KURO_BOOTSTRAP_PROVIDERS();
  function emailAuthExtension(id, api, require2) {
    const React = require2(15), h = React.createElement, Text = require2(202).default, View = require2(123).default;
    const { useAccountStore } = require2(1386), { AuthField, AuthButton } = require2(1701), { styles } = require2(1699), { cinema } = require2(1379), { router } = require2(11);
    if (id === 1700) {
      let CredentialForm = function({ mode = "login" }) {
        const account = useAccountStore(), signup = mode === "signup", emailOnly = mode === "recovery" || mode === "verification";
        const [method, setMethod] = React.useState("password"), [name2, setName] = React.useState(""), [email, setEmail] = React.useState(""), [secret, setSecret] = React.useState("");
        const disabled = !account.configured || account.busy;
        const navigate = (next) => {
          useAccountStore.setState({ error: "", message: "" });
          router.replace({ pathname: "/account", params: { mode: next } });
        };
        async function submit() {
          if (signup && (secret.length < 12 || name2.trim().length < 2 || name2.trim().length > 60)) {
            useAccountStore.setState({ error: "Use a 2\u201360 character name and a password of at least 12 characters." });
            return;
          }
          const action = signup ? "signup" : mode === "recovery" ? "recovery" : mode === "verification" ? "verification" : method === "password" ? "login" : "otp";
          if (await account.act(action, { name: name2, email, password: secret, channel: "email", address: email })) setSecret("");
        }
        const button = (label, onPress, props = {}) => h(AuthButton, { key: label, label, onPress, ...props });
        return h(
          React.Fragment,
          null,
          !signup && !emailOnly ? h(View, { accessibilityRole: "tablist", style: { flexDirection: "row", gap: 6, marginTop: 20 } }, ...["password", "email"].map((value) => h(require2(1382).PressableScale, { key: value, accessibilityRole: "tab", accessibilityState: { selected: method === value }, accessibilityLabel: value === "password" ? "Password login" : "Email OTP login", onPress: () => {
            setMethod(value);
            setSecret("");
          }, style: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: method === value ? cinema.amber : "#544634", backgroundColor: method === value ? "#362619" : "#171410", alignItems: "center" } }, h(Text, { style: { color: cinema.paper, fontSize: 11 } }, value === "password" ? "PASSWORD" : "EMAIL OTP")))) : null,
          signup ? h(AuthField, { label: "Display name", value: name2, onChange: setName, hint: "Your name" }) : null,
          h(AuthField, { label: "Email address", kind: "email", value: email, onChange: setEmail, hint: "you@example.com" }),
          signup || !emailOnly && method === "password" ? h(AuthField, { label: "Password", kind: "password", value: secret, onChange: setSecret, hint: "At least 12 characters" }) : null,
          !signup && !emailOnly && method === "email" ? h(Text, { style: styles.privacy }, "Use a one-time code sent to your email to sign in or create an account.") : null,
          button(signup ? "Create account" : emailOnly || method === "email" ? "Send verification code" : "Sign in", submit, { disabled, busy: account.busy }),
          !signup && !emailOnly ? h(React.Fragment, null, button("Continue with Google", () => account.act("google"), { disabled, secondary: true }), h(View, { style: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap" } }, button("Forgot password?", () => navigate("recovery"), { secondary: true }), button("Verify email", () => navigate("verification"), { secondary: true }))) : null,
          button(signup || emailOnly ? "Back to sign in" : "New here? Create an account", () => navigate(signup || emailOnly ? "login" : "signup"), { secondary: true }),
          button("Continue as a guest", () => router.replace("/"), { secondary: true }),
          h(Text, { style: styles.privacy }, "Sign in with your verified email or Google account. Library and reading progress remain on this device.")
        );
      };
      return { ...api, CredentialForm };
    }
    const copies = /* @__PURE__ */ new Map([
      ["Connect a Supabase project and configure email, SMS and Google providers to activate these options. No code has been sent and no account has been created.", "Connect a Supabase project and configure email and Google sign-in to activate these options. No code has been sent and no account has been created."],
      ["Verification confirms control of an email or phone\u2014not a person\u2019s real-world identity. Your library is still device-local.", "Your email is verified. Your library and reading progress remain on this device."]
    ]);
    const rewrite = (node) => {
      if (typeof node === "string") return copies.get(node) || node;
      if (Array.isArray(node)) return node.map(rewrite);
      if (!React.isValidElement(node)) return node;
      return React.cloneElement(node, {}, rewrite(node.props.children));
    };
    const name = id === 1703 ? "AccountPanel" : "AuthScreen", Original = api[name];
    return { ...api, [name]: function EmailAccountScreen(props) {
      return rewrite(Original(props));
    } };
  }

  // client/listing-queue.mjs
  init_define_KURO_BOOTSTRAP_PROVIDERS();
  function createListingQueue({ step, clock = Date.now, isVisible = () => true, retryMs = 600, maxJobs = 2400 }) {
    const jobs = /* @__PURE__ */ new Map(), waiting = [], queued = /* @__PURE__ */ new Set();
    let active = 0, timer, scheduled = false, disposed = false;
    const enqueue = (job) => {
      if (!queued.has(job.id)) {
        queued.add(job.id);
        waiting.push(job.id);
      }
    };
    function schedule() {
      if (disposed || scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        pump();
      });
    }
    function pump() {
      clearTimeout(timer);
      timer = void 0;
      if (disposed || !isVisible()) return;
      let earliest = Infinity, remaining = waiting.length;
      while (active < 2 && remaining-- > 0 && waiting.length) {
        const id = waiting.shift();
        queued.delete(id);
        const job = jobs.get(id);
        if (!job || !job.owners.size || job.running) continue;
        if (job.retryAt > clock()) {
          earliest = Math.min(earliest, job.retryAt);
          enqueue(job);
          continue;
        }
        job.running = true;
        active++;
        Promise.resolve().then(() => step(job.row)).catch((error) => ({ pending: true, retryAt: clock() + 3e4, error: error.message })).then((value) => {
          if (disposed) return;
          for (const listener of [...job.owners.values()]) try {
            listener(job.row, value);
          } catch {
          }
          if (value?.pending || value?.obsolete) {
            job.retryAt = Math.max(clock() + retryMs, Number.isFinite(value.retryAt) ? value.retryAt : 0);
            if (job.owners.size) enqueue(job);
          }
        }).finally(() => {
          job.running = false;
          active--;
          if (!job.owners.size && !queued.has(job.id)) jobs.delete(job.id);
          schedule();
        });
      }
      if (active < 2 && earliest < Infinity) {
        timer = setTimeout(schedule, Math.max(1, earliest - clock()));
        timer.unref?.();
      }
    }
    return {
      watch(rows, listener) {
        if (disposed) return () => {
        };
        const owner = /* @__PURE__ */ Symbol(), owned = [];
        for (const row of rows) {
          if (typeof row?.id !== "string") continue;
          let job = jobs.get(row.id);
          if (!job) {
            if (jobs.size >= maxJobs) continue;
            job = { id: row.id, row, owners: /* @__PURE__ */ new Map(), retryAt: 0, running: false };
            jobs.set(row.id, job);
          } else job.row = row;
          job.owners.set(owner, listener);
          owned.push(job);
          if (!job.running) enqueue(job);
        }
        schedule();
        return () => {
          for (const job of owned) {
            job.owners.delete(owner);
            if (!job.owners.size && !job.running) {
              jobs.delete(job.id);
              queued.delete(job.id);
            }
          }
          schedule();
        };
      },
      resume: schedule,
      dispose() {
        disposed = true;
        clearTimeout(timer);
        waiting.length = 0;
        queued.clear();
        for (const job of jobs.values()) job.owners.clear();
        jobs.clear();
      }
    };
  }

  // client/progressive-discovery.mjs
  init_define_KURO_BOOTSTRAP_PROVIDERS();
  function progressiveDiscovery(require2) {
    const React = require2(15), { useQueries, useQueryClient } = require2(1548), { sourceManager } = require2(789), { mergePages } = require2(870), { fetchDiscoveryPage } = require2(1598), { relevanceScore } = require2(791), { useEnabledSources } = require2(1595);
    return function useDiscovery(query, filters, enabled = true) {
      const chosen = useEnabledSources(), client = useQueryClient(), ids = chosen.filter((id) => {
        const source = sourceManager.get(id);
        return !!source && (!filters.sourceId || filters.sourceId === id) && (!filters.readableOnly || source.capabilities.readable !== false) && (!filters.publisherOnly || source.capabilities.publisher) && (!filters.kind || filters.kind === "ALL" || source.capabilities.originFilter !== false) && (!filters.kind || !source.capabilities.supportedKinds || source.capabilities.supportedKinds.includes(filters.kind));
      });
      const text = query.trim(), filterKey = JSON.stringify(filters), key = JSON.stringify([text, ids, filterKey]), initial = ids.map((sourceId) => ({ sourceId, page: 1 }));
      const [state, setState] = React.useState(() => ({ key, cursors: initial })), cursors = state.key === key ? state.cursors : initial;
      const queries = useQueries({ queries: cursors.map((cursor) => ({ queryKey: ["discovery-v2", text, filterKey, cursor.sourceId, cursor.page, cursor.token || ""], enabled: enabled && ids.length > 0, staleTime: 3e5, retry: false, queryFn: () => fetchDiscoveryPage(query, filters, [cursor]) })) });
      const fingerprint = queries.map((row) => [row.dataUpdatedAt, row.status, row.fetchStatus].join(":")).join("|");
      const pages = React.useMemo(() => queries.flatMap((row) => row.data ? [row.data] : []), [fingerprint, key]);
      const items = React.useMemo(() => {
        const rows = mergePages(pages);
        if (text && filters.sort === "RELEVANCE") {
          const score = (row) => Math.max(...[row.title, ...row.altTitles || []].map((title) => relevanceScore(text, title)));
          rows.sort((a, b) => score(b) - score(a) || relevanceScore(text, b.title) - relevanceScore(text, a.title) || Number(!!a.catalogueOnly) - Number(!!b.catalogueOnly));
        }
        return rows;
      }, [pages, key]);
      const reports = React.useMemo(() => [...new Map(pages.flatMap((page) => page.reports || []).map((row) => [row.sourceId, row])).values()], [pages]);
      const planned = new Set(cursors.map((cursor) => cursor.sourceId + "|" + cursor.page + "|" + (cursor.token || ""))), latest = /* @__PURE__ */ new Map();
      cursors.forEach((cursor, index) => {
        if (queries[index]?.data) latest.set(cursor.sourceId, queries[index].data);
      });
      const next = [...latest.values()].flatMap((page) => page.next || []).filter((cursor) => cursor.page <= 25 && !planned.has(cursor.sourceId + "|" + cursor.page + "|" + (cursor.token || "")));
      const isFetching = queries.some((row) => row.isFetching), isPending = enabled && queries.some((row) => row.isPending), isError = queries.length > 0 && queries.every((row) => row.isError);
      const refetch = () => Promise.all(queries.map((row) => row.refetch()));
      return {
        items,
        reports,
        sourceCount: ids.length,
        data: pages.length ? { pages, pageParams: cursors } : void 0,
        isLoading: !pages.length && isPending,
        isPending: !pages.length && isPending,
        isFetching,
        isRefetching: isFetching && pages.length > 0,
        isError,
        error: queries.find((row) => row.error)?.error,
        isSuccess: pages.length > 0,
        status: pages.length ? "success" : isError ? "error" : "pending",
        hasNextPage: next.length > 0,
        isFetchingNextPage: queries.some((row, index) => cursors[index].page > 1 && row.isFetching),
        fetchNextPage: () => {
          setState((previous) => {
            const current = previous.key === key ? previous.cursors : initial;
            const seen = new Set(current.map((cursor) => cursor.sourceId + "|" + cursor.page + "|" + (cursor.token || "")));
            return { key, cursors: [...current, ...next.filter((cursor) => !seen.has(cursor.sourceId + "|" + cursor.page + "|" + (cursor.token || "")))] };
          });
          return Promise.resolve();
        },
        refetch,
        retrySources: () => {
          setState({ key, cursors: initial });
          return client.resetQueries({ queryKey: ["discovery-v2", text, filterKey] });
        }
      };
    };
  }

  // client/catalogue-http.mjs
  init_define_KURO_BOOTSTRAP_PROVIDERS();
  function retryDate(value, clock = Date.now) {
    const now = clock(), seconds = Number(value), date = Number.isFinite(seconds) && seconds > 0 ? now + seconds * 1e3 : Date.parse(value);
    return Math.max(now + 1e3, Math.min(now + 36e5, Number.isFinite(date) ? date : now + 6e4));
  }
  function createCatalogueHttp(original, resolveUrl, { clock = Date.now, getRetryAt = () => 0, onBackoff = () => {
  } } = {}) {
    const cache = /* @__PURE__ */ new Map(), inflight = /* @__PURE__ */ new Map();
    let failure;
    const applies = (value) => {
      try {
        const url = new URL(value);
        return url.origin === "https://api.mangadex.org" && !url.username && !url.password;
      } catch {
        return false;
      }
    };
    function responseError(response) {
      const error = new Error("Source request failed (HTTP " + response.status + ").");
      error.status = response.status;
      if (response.status === 429 || response.status === 503) error.retryAt = retryDate(response.headers?.get("Retry-After"), clock);
      return error;
    }
    async function requestText(url, options = {}) {
      if (!applies(url)) return original.requestText(url, options);
      const method = options.method || "GET", key = method + ":" + url, hit = cache.get(key);
      if (method === "GET" && options.ttlMs !== 0 && hit?.expires > clock()) return hit.value;
      const retryAt = Math.max(failure?.retryAt || 0, getRetryAt());
      if (retryAt > clock()) {
        const error = new Error(failure?.message || "Source rate limit reached. Retry later.");
        error.status = failure?.status || 429;
        error.retryAt = retryAt;
        throw error;
      }
      if (method === "GET" && inflight.has(key)) return inflight.get(key);
      const task = (async () => {
        const controller = new AbortController();
        let timedOut = false;
        const abort = () => controller.abort(), timer = setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, Math.max(1, Math.min(25e3, Number(options.timeoutMs) || 12e3)));
        options.signal?.addEventListener("abort", abort, { once: true });
        if (options.signal?.aborted) controller.abort();
        try {
          const response = await fetch(resolveUrl(url), { method, headers: options.headers, body: options.body, credentials: "same-origin", cache: "no-store", signal: controller.signal });
          if (!response.ok) throw responseError(response);
          const value = await response.text();
          if (method === "GET" && options.ttlMs !== 0) {
            let expires = clock() + Math.max(0, Math.min(1e4, Number(options.ttlMs) || 1e4));
            try {
              const json = JSON.parse(value), rows = Array.isArray(json.data) ? json.data : [json.data];
              for (const row of rows) if (Number.isFinite(row?.kuroContentApproval?.checkedAt)) expires = Math.min(expires, row.kuroContentApproval.checkedAt + 3e4);
            } catch {
            }
            cache.set(key, { value, expires });
            while (cache.size > 240) cache.delete(cache.keys().next().value);
          }
          return value;
        } catch (error) {
          if (timedOut) {
            error.status = 503;
            error.retryAt = clock() + 3e4;
          }
          if (error.retryAt) {
            failure = error;
            onBackoff(error.retryAt);
          }
          throw error;
        } finally {
          clearTimeout(timer);
          options.signal?.removeEventListener("abort", abort);
          inflight.delete(key);
        }
      })();
      if (method === "GET") inflight.set(key, task);
      return task;
    }
    return { ...original, requestText, requestJson: async (url, options) => applies(url) ? JSON.parse(await requestText(url, options)) : original.requestJson(url, options), clearHttpCache: () => {
      cache.clear();
      original.clearHttpCache?.();
    } };
  }

  // client/catalogue-core.mjs
  var completeManifest = (manifest, local = false) => manifest?.verified === true && Array.isArray(manifest.pages) && manifest.pages.length > 0 && (local ? manifest.validation === "device" : manifest.validation === "complete-chapter" && manifest.validatedPages === manifest.pages.length && manifest.pageCount === manifest.pages.length);
  var readinessFresh = (value) => !!value && Date.now() - value.checkedAt < 12e4 && value.expiresAt > Date.now();
  var temporaryFailure = (error) => !!error.retryAt || [408, 425, 429].includes(error.status) || error.status >= 500 || ["AbortError", "TimeoutError"].includes(error.name) || /timed out|timeout|fetch|network/i.test(error.message);
  async function jsonBody(response) {
    let value;
    try {
      value = await response.json();
    } catch {
    }
    if (value && typeof value === "object" && !Array.isArray(value)) return value;
    if (!response.ok) return {};
    const error = new Error("Source returned invalid JSON. Retry later.");
    error.status = 502;
    throw error;
  }
  function createCatalogueCore(providers) {
    providers = providers.map(policyProvider);
    const registry = { providers }, subscribers = /* @__PURE__ */ new Set(), readiness = /* @__PURE__ */ new Map(), checks = /* @__PURE__ */ new Map(), manifests = /* @__PURE__ */ new Map(), snapshots = /* @__PURE__ */ new Map(), listingProgress = /* @__PURE__ */ new Map(), sourceRetryAt = /* @__PURE__ */ new Map();
    let epoch = 0, manager, store, activeChapter;
    let runtimeEligible = new Set(providers.filter((p) => p.contentPolicy.state === "eligible" && p.available !== false).map((p) => p.id));
    const local = typeof window !== "undefined" ? createLocalRuntime() : null;
    const safety = createContentRuntime(local), admitted = (row) => row?.sourceId === "local" ? local?.books.some((b) => b.id === row.id) : !!safety.current(row?.sourceId, row?.id);
    async function request(id, action, params = {}) {
      if (action === "pages") {
        for (let attempt = 0; attempt < 260; attempt++) {
          const value = await requestOnce(id, action, params);
          if (completeManifest(value)) {
            manifests.set(params.id, value);
            while (manifests.size > 64) manifests.delete(manifests.keys().next().value);
            emitCredits();
            return value;
          }
          if (value?.pending !== true || value.verified !== false || value.pages?.length || value.stage !== "preparing" && (!Number.isInteger(value.pageCount) || value.pageCount < 1 || value.validatedPages >= value.pageCount)) throw new Error("The complete chapter could not be verified.");
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
        throw new Error("Chapter verification is still pending. Retry shortly.");
      }
      return requestOnce(id, action, params);
    }
    async function requestOnce(id, action, params = {}) {
      if ((sourceRetryAt.get(id) || 0) > Date.now()) {
        const error = new Error("Source rate limit reached. Retry later.");
        error.status = 429;
        error.retryAt = sourceRetryAt.get(id);
        throw error;
      }
      const query = new URLSearchParams();
      for (const [name, value] of Object.entries(params)) if (value !== void 0) query.set(name, typeof value === "object" ? JSON.stringify(value) : String(value));
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 25e3);
      try {
        const response = await fetch("/api/catalogue/provider/" + id + "/" + action + "?" + query, { credentials: "same-origin", headers: { Accept: "application/json" }, signal: controller.signal });
        const data = await jsonBody(response);
        if (!response.ok) {
          const error = new Error(data.error || "Provider unavailable. Retry later.");
          error.status = response.status;
          if (response.status === 429 || response.status === 503) {
            error.retryAt = Math.max(sourceRetryAt.get(id) || 0, retryDate(response.headers?.get("Retry-After")));
            sourceRetryAt.set(id, error.retryAt);
          }
          throw error;
        }
        if (action === "pages" && data.result?.contentApproval?.version !== CONTENT_POLICY_VERSION) throw new Error(CONTENT_MESSAGE);
        return data.result;
      } catch (error) {
        if (error.name === "AbortError") {
          const failure = new Error("Provider request timed out. Retry later.");
          failure.status = 503;
          failure.retryAt = Date.now() + 3e4;
          throw failure;
        }
        throw error;
      } finally {
        clearTimeout(timer);
      }
    }
    const emitCredits = () => {
      if (typeof window !== "undefined" && activeChapter && manifests.has(activeChapter)) window.dispatchEvent(new CustomEvent("kuro:active-chapter-manifest", { detail: manifests.get(activeChapter) }));
    };
    function notify() {
      epoch++;
      readiness.clear();
      listingProgress.clear();
      for (const fn of subscribers) fn();
      listing.resume();
      if (typeof window !== "undefined") window.dispatchEvent(new Event("kuro:catalogue-updated"));
    }
    const cached = (id) => {
      const value = readiness.get(id);
      return readinessFresh(value) ? value : void 0;
    };
    const olderSnapshot = (id, at, revision) => {
      const previous = snapshots.get(id);
      return previous && (revision < previous.revision || revision === previous.revision && at < previous.at);
    };
    function rememberSnapshot(id, at, ready, revision = 0) {
      const previous = snapshots.get(id);
      if (!Number.isFinite(at) || at > Date.now() + 5e3 || !Number.isSafeInteger(revision) || revision < 0 || previous && (revision < previous.revision || revision === previous.revision && (at < previous.at || at === previous.at && (ready || !previous.ready)))) return false;
      snapshots.delete(id);
      snapshots.set(id, { at, ready, revision });
      while (snapshots.size > 2400) snapshots.delete(snapshots.keys().next().value);
      return true;
    }
    async function check(manga) {
      const hit = cached(manga.id);
      if (hit) {
        if (hit.ready) try {
          await safety.verify(manga);
        } catch {
          return { ready: false, checkedAt: Date.now(), expiresAt: Date.now() + 12e4, error: CONTENT_MESSAGE };
        }
        if (cached(manga.id) === hit) return hit;
      }
      const started = epoch, key = started + ":" + manga.id;
      if (checks.has(key)) return checks.get(key).promise;
      const record = { id: manga.id, invalidated: false, promise: null };
      const task = (async () => {
        let ready = false, error, observedAt, inventoryRevision = 0, expiresAt = Date.now() + 12e4;
        try {
          await safety.verify(manga);
          const adapter = manager.require(manga.sourceId);
          if (adapter.capabilities.readable !== false && !manga.catalogueOnly && !manga.publisherUrl) {
            if (manga.sourceId === "mangadex") try {
              const response = await fetch("/api/catalogue/readable/check?" + new URLSearchParams({ provider: manga.sourceId, id: manga.id }), { credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(15e3) }), proof = await response.json();
              if (response.ok) {
                observedAt = proof.asOf;
                inventoryRevision = proof.inventoryRevision || 0;
              }
              ready = response.ok && proof.ready === true && proof.validation === "complete-chapter" && proof.validatedPages > 0 && proof.validatedPages === proof.pageCount && proof.expiresAt > Date.now();
              if (ready) {
                expiresAt = Math.min(Date.now() + 12e4, proof.expiresAt);
                observedAt = proof.asOf;
                inventoryRevision = proof.inventoryRevision || 0;
              }
            } catch {
            }
            if (!ready) {
              const chapters = await adapter.getChapterList(manga.id), cost = (chapter) => Number.isInteger(chapter.pages) && chapter.pages > 0 ? chapter.pages : Infinity;
              for (const chapter of [...chapters].sort((a, b) => cost(a) - cost(b)).slice(0, 10)) {
                try {
                  const manifest = await adapter.getChapterPages(chapter.id);
                  ready = completeManifest(manifest, manga.sourceId === "local");
                  if (ready) {
                    expiresAt = Math.min(Date.now() + 12e4, manifest.expiresAt || Date.now() + 12e4);
                    observedAt = manifest.readabilityAsOf;
                    inventoryRevision = manifest.inventoryRevision || 0;
                    break;
                  }
                } catch (e) {
                  error = e.message;
                }
              }
            }
          }
          if (ready) await safety.verify(manga, void 0, true);
        } catch (e) {
          ready = false;
          error = e.message;
        }
        if (started !== epoch || record.invalidated) return { ready: false, checkedAt: 0, obsolete: true };
        const snapshotAt = Number.isFinite(observedAt) ? observedAt : Date.now();
        if (olderSnapshot(manga.id, snapshotAt, inventoryRevision)) return { ready: false, checkedAt: 0, obsolete: true };
        rememberSnapshot(manga.id, snapshotAt, ready, inventoryRevision);
        const result = { ready: ready && expiresAt > Date.now(), checkedAt: Date.now(), expiresAt, error };
        readiness.set(manga.id, result);
        while (readiness.size > 2e3) readiness.delete(readiness.keys().next().value);
        core.lastCheck = { ...result, id: manga.id };
        safety.changed();
        if (ready && typeof window !== "undefined") window.dispatchEvent(new Event("kuro:readable-updated"));
        return result;
      })();
      record.promise = task;
      checks.set(key, record);
      task.finally(() => {
        if (checks.get(key) === record) checks.delete(key);
      });
      return task;
    }
    async function checkListing(manga) {
      const hit = cached(manga.id);
      if (hit) {
        if (hit.ready) try {
          await safety.verify(manga);
        } catch {
          return { ready: false, checkedAt: Date.now(), expiresAt: Date.now() + 12e4, error: CONTENT_MESSAGE };
        }
        if (cached(manga.id) === hit) return hit;
      }
      if (manga.sourceId !== "mangadex") return check(manga);
      if ((sourceRetryAt.get(manga.sourceId) || 0) > Date.now()) return { pending: true, retryAt: sourceRetryAt.get(manga.sourceId) };
      const started = epoch, key = "listing:" + started + ":" + manga.id;
      if (checks.has(key)) return checks.get(key).promise;
      let progress = listingProgress.get(manga.id);
      if (!progress || progress.epoch !== started || progress.expiresAt <= Date.now()) progress = { epoch: started, expiresAt: Date.now() + 3e5, index: 0, attempts: 0 };
      if (progress.retryAt > Date.now()) return { pending: true, retryAt: progress.retryAt };
      const record = { id: manga.id, invalidated: false, promise: null }, obsolete = () => started !== epoch || record.invalidated;
      const task = (async () => {
        let ready = false, error;
        try {
          await safety.verify(manga);
          if (!progress.chapters) {
            const response = await fetch("/api/catalogue/readable/check?" + new URLSearchParams({ provider: manga.sourceId, id: manga.id }), { credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(15e3) }), proof = await jsonBody(response);
            if (!response.ok) {
              const failure = new Error(proof.error || "Source check is unavailable.");
              failure.status = response.status;
              if (response.status === 429 || response.status === 503) {
                failure.retryAt = Math.max(sourceRetryAt.get(manga.sourceId) || 0, retryDate(response.headers?.get("Retry-After")));
                sourceRetryAt.set(manga.sourceId, failure.retryAt);
              }
              throw failure;
            }
            progress.observedAt = proof.asOf;
            progress.inventoryRevision = proof.inventoryRevision || 0;
            ready = proof.ready === true && proof.validation === "complete-chapter" && proof.validatedPages > 0 && proof.validatedPages === proof.pageCount && proof.expiresAt > Date.now();
            if (ready) progress.proof = proof;
            else {
              const chapters = await manager.require(manga.sourceId).getChapterList(manga.id), cost = (chapter) => Number.isInteger(chapter.pages) && chapter.pages > 0 ? chapter.pages : Infinity;
              progress.chapters = [...chapters].sort((a, b) => cost(a) - cost(b)).slice(0, 10);
              if (progress.chapters.length) {
                if (obsolete()) return { obsolete: true };
                listingProgress.set(manga.id, progress);
                while (listingProgress.size > 2e3) listingProgress.delete(listingProgress.keys().next().value);
              }
            }
          }
          if (!ready && progress.chapters && progress.index < progress.chapters.length) {
            const chapter = progress.chapters[progress.index];
            let value;
            try {
              value = await requestOnce("mangadex", "pages", { id: chapter.id });
              if (completeManifest(value)) {
                checkedManifest(value, chapter.id, location.origin);
                if (value.contentApproval?.mangaId !== manga.id) throw new Error("Chapter does not belong to this title.");
                ready = true;
                progress.proof = { expiresAt: value.expiresAt, asOf: value.readabilityAsOf, inventoryRevision: value.inventoryRevision || 0 };
                manifests.set(chapter.id, value);
                while (manifests.size > 64) manifests.delete(manifests.keys().next().value);
                emitCredits();
              } else if (value?.chapterId === chapter.id && value.pending === true && value.verified === false && !value.pages?.length && (value.stage === "preparing" || Number.isInteger(value.pageCount) && value.pageCount > 0 && Number.isInteger(value.validatedPages) && value.validatedPages >= 0 && value.validatedPages < value.pageCount)) {
                if (++progress.attempts >= 260) throw new Error("Chapter verification did not complete.");
                if (obsolete()) return { obsolete: true };
                listingProgress.set(manga.id, progress);
                return { pending: true };
              } else throw new Error("The complete chapter could not be verified.");
            } catch (failure) {
              if (temporaryFailure(failure)) throw failure;
              error = failure.message;
              progress.index++;
              progress.attempts = 0;
              if (progress.index < progress.chapters.length) {
                if (obsolete()) return { obsolete: true };
                listingProgress.set(manga.id, progress);
                return { pending: true };
              }
            }
          }
          if (ready) await safety.verify(manga, void 0, true);
        } catch (failure) {
          error = failure.message;
          if (obsolete()) return { obsolete: true };
          if (temporaryFailure(failure) || (sourceRetryAt.get(manga.sourceId) || 0) > Date.now()) {
            progress.retryAt = Math.max(sourceRetryAt.get(manga.sourceId) || 0, failure.retryAt || Date.now() + 3e4);
            listingProgress.set(manga.id, progress);
            sourceRetryAt.set(manga.sourceId, Math.max(sourceRetryAt.get(manga.sourceId) || 0, progress.retryAt));
            return { pending: true, retryAt: progress.retryAt, error };
          }
          ready = false;
        }
        if (obsolete()) return { obsolete: true };
        listingProgress.delete(manga.id);
        const observation = progress.proof || { asOf: progress.observedAt, inventoryRevision: progress.inventoryRevision }, at = Number.isFinite(observation.asOf) ? observation.asOf : Date.now(), revision = observation.inventoryRevision || 0;
        if (olderSnapshot(manga.id, at, revision)) return { obsolete: true };
        rememberSnapshot(manga.id, at, ready, revision);
        const result = { ready: ready && observation.expiresAt > Date.now(), checkedAt: Date.now(), expiresAt: ready ? Math.min(Date.now() + 12e4, observation.expiresAt) : Date.now() + 12e4, error };
        readiness.set(manga.id, result);
        while (readiness.size > 2e3) readiness.delete(readiness.keys().next().value);
        core.lastCheck = { ...result, id: manga.id };
        safety.changed();
        if (result.ready && typeof window !== "undefined") window.dispatchEvent(new Event("kuro:readable-updated"));
        return result;
      })();
      record.promise = task;
      checks.set(key, record);
      task.finally(() => {
        if (checks.get(key) === record) checks.delete(key);
      });
      return task;
    }
    const listing = createListingQueue({ step: checkListing, isVisible: () => typeof document === "undefined" || !document.hidden });
    function preferences(currentRegistry = core.registry) {
      if (!store || !manager) return;
      const old = store.getState().sourcePreferences, next = { ...old };
      let changed = false;
      currentRegistry = { ...currentRegistry, providers: currentRegistry.providers.map(policyProvider) };
      core.registry = currentRegistry;
      const eligible = new Set(currentRegistry.providers.filter((p) => p.contentPolicy.state === "eligible" && p.available !== false).map((p) => p.id));
      if ([...eligible].sort().join("|") !== [...runtimeEligible].sort().join("|")) changed = true;
      runtimeEligible = eligible;
      for (const p of currentRegistry.providers) {
        const previous = next[p.id];
        if (previous?.selectionVersion === 1) continue;
        next[p.id] = { ...previous, enabled: p.contentPolicy.state === "eligible" && p.available !== false && (typeof previous?.enabled === "boolean" ? previous.enabled : true), selectionVersion: 1, language: previous?.language || p.language || "en", readingMode: previous?.readingMode || (p.id === "guya" ? "RTL" : void 0) };
        changed = true;
      }
      if (manager.get("local") && next.local?.selectionVersion !== 1) {
        next.local = { ...next.local, enabled: typeof next.local?.enabled === "boolean" ? next.local.enabled : true, selectionVersion: 1, language: next.local?.language || "en" };
        changed = true;
      }
      if (changed) store.setState({ sourcePreferences: next });
    }
    async function checkChapter(manga, chapter) {
      await safety.verify(manga, chapter, true);
      const manifest = await manager.require(manga.sourceId).getChapterPages(chapter);
      if (!completeManifest(manifest, manga.sourceId === "local")) throw new Error("The complete chapter could not be verified.");
      const expiresAt = Math.min(Date.now() + 12e4, manifest.expiresAt || Date.now() + 12e4);
      if (expiresAt <= Date.now()) throw new Error("Chapter proof expired. Retry.");
      const at = Number.isFinite(manifest.readabilityAsOf) ? manifest.readabilityAsOf : Date.now(), revision = manifest.inventoryRevision || 0;
      if (olderSnapshot(manga.id, at, revision)) throw new Error("Chapter verification changed. Retry.");
      rememberSnapshot(manga.id, at, true, revision);
      readiness.set(manga.id, { ready: true, checkedAt: Date.now(), expiresAt });
      return manifest;
    }
    function initialize(id, api, require2) {
      if (id === 861) return createCatalogueHttp(api, (url) => require2(862).resolveFetchUrl(url), { getRetryAt: () => sourceRetryAt.get("mangadex") || 0, onBackoff: (until) => sourceRetryAt.set("mangadex", Math.max(sourceRetryAt.get("mangadex") || 0, until)) });
      if (id === 1597) return { ...api, useDiscovery: progressiveDiscovery(require2) };
      if ([1700, 1703, 1697].includes(id)) return emailAuthExtension(id, api, require2);
      if (id === 789) {
        manager = api.sourceManager;
        installAdapters(manager, registry, { request, origin: location.origin });
        if (local) manager.register(local.adapter);
        for (const adapter of manager.all()) {
          if (adapter.id === "local") continue;
          if (providerContentPolicy({ id: adapter.id }).state !== "eligible") {
            adapter.capabilities = { ...adapter.capabilities, readable: false, search: false, popular: false, latest: false, trending: false };
            adapter.getBaseUrl = () => "";
            for (const name of ["search", "getPopular", "getLatestUpdates", "getTrending"]) adapter[name] = async () => [];
            adapter.searchPage = async () => ({ items: [], notice: CONTENT_MESSAGE });
            for (const name of ["getMangaDetails", "getChapterList", "getChapterPages"]) adapter[name] = async () => {
              throw new Error(CONTENT_MESSAGE);
            };
            continue;
          }
          for (const name of ["search", "searchPage", "getPopular", "getLatestUpdates", "getTrending"]) {
            const original = adapter[name];
            if (!original) continue;
            adapter[name] = async (...args) => {
              const value = await original.apply(adapter, args), rows = Array.isArray(value) ? value : value.items || [], safe = [];
              for (const row of rows) {
                if (row.sourceId !== adapter.id) continue;
                let approved = safety.current(row.sourceId, row.id) || safety.remember(row);
                if (!approved) try {
                  approved = await safety.verify(row);
                } catch {
                  continue;
                }
                safe.push({ ...row, ...approved.manga });
              }
              return Array.isArray(value) ? safe : { ...value, items: safe };
            };
          }
          adapter.getMangaDetails = async (identity) => (await safety.verify({ id: identity, sourceId: adapter.id }, void 0, true)).manga;
          const chapters = adapter.getChapterList;
          adapter.getChapterList = async (identity) => {
            await safety.verify({ id: identity, sourceId: adapter.id });
            return chapters.call(adapter, identity);
          };
        }
        const enabled = manager.enabled;
        manager.enabled = (ids) => enabled.call(manager, ids.filter((id2) => id2 === "local" || runtimeEligible.has(id2)));
        manager.getMangaDetails = async (manga) => (await safety.verify(manga, void 0, true)).manga;
      }
      if (id === 1249) {
        if (local) local.connect(api.useLibraryStore, require2);
        return { ...api, useLibraryStore: safety.wrapStore(require2(15), api.useLibraryStore, "library") };
      }
      if (id === 1602 && local) {
        const history = api.useHistoryStore, original = history.getState().record, progress = history.getState().updateProgress;
        history.setState({
          record: (row) => {
            if (row.sourceId !== "local") return original(row);
            if (local.mayRecord(row.mangaId)) {
              local.mergeHistory(history);
              original(local.normalizeHistory(row));
            }
          },
          updateProgress: (id2, patch) => {
            const book = String(id2).match(/^(local-[a-f0-9]{64})-chapter-1$/)?.[1];
            if (!book) return progress(id2, patch);
            if (local.mayRecord(book)) {
              local.mergeHistory(history);
              progress(id2, patch);
            }
          }
        });
        return { ...api, useHistoryStore: safety.wrapStore(require2(15), history, "history") };
      }
      if (id === 1660 && local) return { ...api, LibraryScreen: libraryExtension(require2(15), api.LibraryScreen, local) };
      if (id === 1536) return { ...api, PosterArtwork: artworkExtension(require2(15), api.PosterArtwork, require2(282).default, require2(862).resolveImageSource) };
      if (id === 1706) installIdentity(() => api, [...providers.filter((p) => p.available && p.adapter !== "legacy").map((p) => p.id), "local"]);
      if (id === 1705 || id === 1722) return { ...api, default: safety.route(require2(15), require2, id === 1722) };
      if (id === 862) {
        const original = api.resolveFetchUrl;
        api.resolveFetchUrl = (value, headers) => {
          try {
            const url = new URL(value);
            if (url.origin === "https://api.mangadex.org" && !url.username && !url.password) return location.origin + "/api/catalogue/mangadex?path=" + encodeURIComponent(url.pathname + url.search);
          } catch {
          }
          try {
            const url = new URL(value, location.origin);
            if (url.origin === location.origin || url.protocol === "blob:" && local?.ownsUrl(value)) return value;
          } catch {
          }
          return location.origin + "/api/catalogue/blocked";
        };
        api.resolveImageSource = safety.resolveImage;
      }
      if (id === 873) {
        const safeUrl = (builder) => (...args) => {
          const url = new URL(builder(...args));
          url.searchParams.delete("contentRating[]");
          url.searchParams.set("contentRating[]", "safe");
          return url.href;
        };
        return { ...api, RATINGS: ["safe"], buildListUrl: safeUrl(api.buildListUrl), buildFeedUrl: safeUrl(api.buildFeedUrl) };
      }
      if (id === 784) {
        store = api.useSettingsStore;
        preferences();
        store.persist?.onFinishHydration?.(() => preferences());
        const originalReset = store.getState().resetToDefaults;
        const known = (id2) => core.registry.providers.some((p) => p.id === id2) || id2 === "local" && manager.get(id2);
        store.setState({ setSourceEnabled: (id2, value) => {
          if (!known(id2)) return;
          const sourcePreferences = store.getState().sourcePreferences;
          store.setState({ sourcePreferences: { ...sourcePreferences, [id2]: { ...sourcePreferences[id2], enabled: !!value, selectionVersion: 1 } } });
        }, setAllSourcesEnabled: (value) => {
          const sourcePreferences = store.getState().sourcePreferences;
          store.setState({ sourcePreferences: Object.fromEntries(Object.entries(sourcePreferences).map(([id2, p]) => [id2, { ...p, enabled: known(id2) && !!value, selectionVersion: 1 }])) });
        }, resetToDefaults: () => {
          originalReset();
          store.setState({ sourcePreferences: {} });
          preferences(core.registry);
        } });
        const activeIds = (state) => Object.keys(state.sourcePreferences).filter((id2) => state.sourcePreferences[id2]?.enabled && manager.get(id2) && (id2 === "local" || runtimeEligible.has(id2))).sort();
        let previous = store.getState().sourcePreferences, previousActive = JSON.stringify(activeIds(store.getState()));
        store.subscribe((state) => {
          if (state.sourcePreferences === previous) return;
          previous = state.sourcePreferences;
          preferences(core.registry);
          const active = JSON.stringify(activeIds(store.getState()));
          if (active !== previousActive) {
            previousActive = active;
            notify();
          }
        });
        return { ...api, selectEnabledSourceIds: activeIds };
      }
      if (id === 790) api.uniqueChapters = uniqueChapters;
      if (id === 794) api.groupEditions = (items) => groupSeries(items, true);
      if (id === 870) api.mergePages = (pages) => [...new Map(pages.flatMap((page) => page.items).filter(admitted).map((row) => [row.id, row])).values()];
      if (id === 791) api.mergeSearchResults = (query, lists) => groupSeries(lists.flat()).map((g) => ({ ...g.primary, editions: g.editions, relevance: Math.max(...[g.primary.title, ...g.primary.altTitles || []].map((title) => api.relevanceScore(query, title))) })).sort((a, b) => b.relevance - a.relevance);
      if (id === 1342) api.homeSections = (popular, latest, excluded = []) => {
        popular = popular.filter(admitted);
        latest = latest.filter(admitted);
        const groups = groupSeries([...popular, ...latest, ...excluded]), map = /* @__PURE__ */ new Map();
        groups.forEach((g, i) => g.editions.forEach((row) => map.set(row.id, i)));
        const used = new Set(excluded.map((row) => map.get(row.id)));
        const take = (rows, count) => {
          const result = [];
          for (const row of rows) {
            const index = map.get(row.id);
            if (used.has(index)) continue;
            used.add(index);
            result.push(row);
            if (result.length === count) break;
          }
          return result;
        };
        return { featured: take(popular, 5), updates: take(latest, 6), popular: take(popular, 16), moreUpdates: take(latest, 16) };
      };
      if (id === 875) {
        const original = api.mapManga;
        api.mapManga = (raw, ...args) => {
          if (!classifyMangaDex(raw).allowed) throw new Error(CONTENT_MESSAGE);
          const row = original(raw, ...args), mal = String(raw.attributes?.links?.mal || "");
          if (/^\d+$/.test(mal)) row.identityKeys = [.../* @__PURE__ */ new Set([...row.identityKeys || [], "mal:" + mal])];
          row.coverUrl = location.origin + "/api/catalogue/cover?provider=mangadex&id=" + row.id;
          row.contentApproval = raw.kuroContentApproval;
          const approved = safety.remember(row), proof = raw.kuroReadability, now = Date.now();
          const valid = !!approved && proof?.ready === true && proof.mangaId === row.id && /^mangadex:[0-9a-f-]{36}$/i.test(proof.chapterId || "") && proof.version === "complete-chapter-1" && proof.policyVersion === CONTENT_POLICY_VERSION && proof.validation === "complete-chapter" && Number.isInteger(proof.validatedPages) && proof.validatedPages > 0 && proof.validatedPages <= 500 && proof.validatedPages === proof.pageCount && Number.isFinite(proof.checkedAt) && proof.checkedAt <= now + 5e3 && Number.isFinite(proof.expiresAt) && proof.expiresAt > now && proof.expiresAt <= proof.checkedAt + 216e5;
          if (Object.hasOwn(raw, "kuroReadability") && rememberSnapshot(row.id, raw.kuroReadabilityAsOf, valid, raw.kuroReadabilityRevision || 0)) {
            readiness.delete(row.id);
            listingProgress.delete(row.id);
            for (const [key, record] of checks) if (record.id === row.id) {
              record.invalidated = true;
              checks.delete(key);
            }
            if (valid) {
              readiness.set(row.id, { ready: true, checkedAt: now, expiresAt: Math.min(now + 12e4, proof.expiresAt) });
              while (readiness.size > 2e3) readiness.delete(readiness.keys().next().value);
            }
          }
          return row;
        };
      }
      if (id === 1389) {
        api.checkReadability = check;
        api.cachedReadability = cached;
        api.forgetReadability = (key) => readiness.delete(key);
      }
      if (id === 1388) {
        const React = require2(15), router = require2(11);
        api.useReadyCollection = function(items, active) {
          active = true;
          const [revision, setRevision] = React.useState(0), [retry, setRetry] = React.useState(0), [paused, setPaused] = React.useState(false);
          const ageRevision = React.useSyncExternalStore(safety.subscribe, safety.getSnapshot);
          React.useEffect(() => {
            const expires = items.map((row) => cached(row.id)).filter(readinessFresh).map((value) => Math.min(value.expiresAt, value.checkedAt + 12e4));
            if (!expires.length) return;
            const timer = setTimeout(() => {
              setRetry((x) => x + 1);
              setRevision((x) => x + 1);
            }, Math.max(1, Math.min(...expires) - Date.now() + 1));
            return () => clearTimeout(timer);
          }, [items, revision, ageRevision]);
          router.useFocusEffect(React.useCallback(() => {
            if (!active || paused || document.hidden) return;
            const listener = () => {
              setRetry((x) => x + 1);
              setRevision((x) => x + 1);
            };
            subscribers.add(listener);
            const queue = items.filter((row) => {
              const value = cached(row.id);
              return !(value && (!value.ready || admitted(row)));
            });
            const stop = listing.watch(queue, () => setRevision((x) => x + 1));
            return () => {
              stop();
              subscribers.delete(listener);
            };
          }, [active, retry, items, paused, ageRevision]));
          const result = React.useMemo(() => {
            const ready = [];
            let pending = 0, unavailable = 0;
            for (const row of items) {
              const value = cached(row.id);
              if (!readinessFresh(value) || value.ready && !admitted(row)) pending++;
              else if (value.ready) ready.push(row);
              else unavailable++;
            }
            return { items: groupSeries(ready, true).map((g) => g.primary), pending, unavailable };
          }, [active, items, revision, safety.getSnapshot()]);
          return { ...result, paused, setPaused, retry: () => {
            for (const row of items) readiness.delete(row.id);
            setPaused(false);
            setRetry((x) => x + 1);
            setRevision((x) => x + 1);
          } };
        };
      }
      if (id === 1595) {
        const original = api.useChapterPages;
        api.useChapterPages = function(chapter) {
          const query = original(chapter);
          if (activeChapter !== chapter) {
            activeChapter = chapter;
            queueMicrotask(() => window.dispatchEvent(new CustomEvent("kuro:active-chapter-changed", { detail: chapter })));
          }
          if (query.data?.verified) {
            manifests.set(chapter, query.data);
            queueMicrotask(emitCredits);
          }
          return query;
        };
      }
    }
    const core = { registry, initialize, local, safety, notify, resume: () => {
      listing.resume();
      for (const fn of subscribers) fn(false);
    }, preferences, check, checkListing, checkChapter, cached, replayCredits: emitCredits, get manager() {
      return manager;
    }, get store() {
      return store;
    }, get epoch() {
      return epoch;
    }, lastCheck: null };
    safety.configureReadability(check, cached, checkChapter);
    return core;
  }
  function installBootstrap(core) {
    let define;
    const ids = /* @__PURE__ */ new Set([789, 784, 1706, 790, 794, 870, 791, 1342, 875, 1389, 1388, 1595, 1597, 861, 862, 1249, 1660, 1536, 1602, 1705, 1722, 873, 1700, 1703, 1697]);
    Object.defineProperty(window, "__d", { configurable: true, get: () => define, set(original) {
      define = function(factory, id, dependencies, ...rest) {
        if (!ids.has(id)) return original(factory, id, dependencies, ...rest);
        const wrapped2 = function(global, require2, importDefault, importAll, module, exports, map) {
          let manager, all;
          if (id === 784) {
            manager = require2(789).sourceManager;
            all = manager.all;
            manager.all = () => all.call(manager).filter((p) => core.registry.providers.every((x) => x.id !== p.id || x.adapter === "legacy"));
          }
          try {
            factory.apply(this, arguments);
          } finally {
            if (all) manager.all = all;
          }
          const replacement = core.initialize(id, module.exports, require2);
          if (replacement) module.exports = replacement;
        };
        return original(wrapped2, id, dependencies, ...rest);
      };
    } });
  }
  if (typeof window !== "undefined") {
    const core = createCatalogueCore(define_KURO_BOOTSTRAP_PROVIDERS_default);
    window.KuroCatalogueCore = core;
    installBootstrap(core);
  }
})();
