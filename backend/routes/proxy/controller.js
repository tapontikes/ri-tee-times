const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const zlib = require('zlib');
const {promisify} = require('util');
const logger = require('../../utils/logger');
const dbClient = require('../../database/client');

const gunzip = promisify(zlib.gunzip);
const inflate = promisify(zlib.inflate);
const brotliDecompress = promisify(zlib.brotliDecompress);

async function decompress(buffer, encoding) {
    if (!encoding) return buffer;
    try {
        if (encoding.includes('br')) return await brotliDecompress(buffer);
        if (encoding.includes('gzip')) return await gunzip(buffer);
        if (encoding.includes('deflate')) return await inflate(buffer);
    } catch (_) {
    }
    return buffer;
}

const PROXY_BASE = '/api/proxy';

// Always-permitted hosts regardless of DB state
const STATIC_ALLOWED = new Set([
    'foreupsoftware.com',
    'app.foreupsoftware.com',
    'teewire.net',
]);

// Known sister-domain pairs (same platform, different TLD)
const SISTER_DOMAIN_MAP = {
    'teesnap.net': ['teesnap.com'],
    'teesnap.com': ['teesnap.net'],
};

function getSisterDomains(baseDomain) {
    return SISTER_DOMAIN_MAP[baseDomain] || [];
}

// DB-derived allowlist, cached for 5 minutes
let cachedHosts = null;
let cacheExpiry = 0;

async function isAllowedHost(host) {
    if (STATIC_ALLOWED.has(host)) return true;

    const now = Date.now();
    if (!cachedHosts || now > cacheExpiry) {
        try {
            const courses = await dbClient.getAllCourses();
            cachedHosts = new Set(
                courses
                    .map(c => {
                        try {
                            return new URL(c.booking_url).host;
                        } catch {
                            return null;
                        }
                    })
                    .filter(Boolean)
            );
            cacheExpiry = now + 5 * 60 * 1000;
        } catch (err) {
            logger.warn('Proxy allowlist: DB unavailable, using static list only:', err.message);
            cachedHosts = new Set();
            cacheExpiry = now + 30_000;
        }
    }

    if (cachedHosts.has(host)) return true;
    const baseDomain = host.split('.').slice(-2).join('.');
    const allAllowed = [...STATIC_ALLOWED, ...cachedHosts];
    // Same base domain (e.g. sub.teesnap.net when teesnap.net course is cached)
    if (allAllowed.some(h => {
        try {
            return new URL(`https://${h}`).hostname.endsWith('.' + baseDomain) || h === baseDomain;
        } catch {
            return false;
        }
    })) return true;
    // Sister domains (e.g. admin-api.teesnap.com when teesnap.net course is allowed)
    const sisters = getSisterDomains(baseDomain);
    return sisters.length > 0 && allAllowed.some(h => {
        try {
            const hn = new URL(`https://${h}`).hostname;
            return sisters.some(s => hn === s || hn.endsWith('.' + s));
        } catch {
            return false;
        }
    });
}

function rewriteUrl(url, host) {
    if (!url) return url;
    const trimmed = url.trim();
    if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('#') ||
        trimmed.startsWith('javascript:') || trimmed.startsWith('mailto:')) {
        return url;
    }
    if (trimmed.startsWith(PROXY_BASE + '/')) return trimmed;
    try {
        const abs = new URL(trimmed, `https://${host}`);
        const baseDomain = host.split('.').slice(-2).join('.');
        const sisters = getSisterDomains(baseDomain);
        if (abs.host === host || abs.host.endsWith('.' + baseDomain) || STATIC_ALLOWED.has(abs.host) ||
            sisters.some(s => abs.host === s || abs.host.endsWith('.' + s))) {
            return `${PROXY_BASE}/${abs.host}${abs.pathname}${abs.search}`;
        }
    } catch (_) {
    }
    return url;
}

function rewriteHtml(html, host) {
    const baseDomain = host.split('.').slice(-2).join('.');
    const $ = cheerio.load(html, {decodeEntities: false});

    $('[src]').each((_, el) => {
        const v = $(el).attr('src');
        if (v) $(el).attr('src', rewriteUrl(v, host));
    });
    $('[href]').each((_, el) => {
        const v = $(el).attr('href');
        if (v) $(el).attr('href', rewriteUrl(v, host));
    });
    $('[action]').each((_, el) => {
        const v = $(el).attr('action');
        if (v) $(el).attr('action', rewriteUrl(v, host));
    });

    const sisters = getSisterDomains(baseDomain);
    const interceptor = `<script>
(function () {
  var PROXY = '${PROXY_BASE}';
  var HOST = '${host}';
  var BASE = '${baseDomain}';
  var SISTERS = ${JSON.stringify(sisters)};
  function shouldProxy(h) {
    return h === HOST || h.endsWith('.' + BASE) ||
           SISTERS.some(function(s){ return h === s || h.endsWith('.' + s); });
  }
  function rw(url) {
    if (!url) return url;
    if (url.startsWith(PROXY + '/')) return url;
    try {
      var u = new URL(url, 'https://' + HOST);
      if (shouldProxy(u.host)) return PROXY + '/' + u.host + u.pathname + u.search + u.hash;
    } catch (_) {}
    return url;
  }
  var _fetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string') input = rw(input);
    else if (input && input.url) input = new Request(rw(input.url), input);
    return _fetch.call(this, input, init);
  };
  var _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    arguments[1] = rw(String(url));
    return _open.apply(this, arguments);
  };
  // Catch dynamically-set src/href/action via setAttribute
  var _setAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    if (typeof value === 'string' && (name === 'src' || name === 'href' || name === 'action')) {
      value = rw(value);
    }
    return _setAttribute.call(this, name, value);
  };
  // Catch direct property assignments: el.href = '...', el.src = '...'
  ['href', 'src', 'action'].forEach(function(prop) {
    var proto = prop === 'action' ? HTMLFormElement.prototype : HTMLAnchorElement.prototype;
    if (prop === 'src') proto = HTMLElement.prototype;
    var desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (desc && desc.set) {
      Object.defineProperty(proto, prop, {
        set: function(v) { desc.set.call(this, typeof v === 'string' ? rw(v) : v); },
        get: desc.get,
        configurable: true,
      });
    }
  });
  // Catch SPA history navigation (pushState/replaceState with absolute paths)
  ['pushState', 'replaceState'].forEach(function(method) {
    var orig = history[method].bind(history);
    history[method] = function(state, title, url) {
      return orig(state, title, url ? rw(String(url)) : url);
    };
  });
  // Catch window.location.assign() and window.location.replace()
  try {
    var _locAssign = window.location.assign.bind(window.location);
    window.location.assign = function(url) { _locAssign(rw(String(url))); };
    var _locReplace = window.location.replace.bind(window.location);
    window.location.replace = function(url) { _locReplace(rw(String(url))); };
  } catch(e) {}
  // Catch window.location.href = '...' assignments via Location.prototype
  try {
    var _locDesc = Object.getOwnPropertyDescriptor(Location.prototype, 'href');
    if (_locDesc && _locDesc.set) {
      Object.defineProperty(Location.prototype, 'href', {
        get: _locDesc.get,
        set: function(url) { _locDesc.set.call(this, rw(String(url))); },
        configurable: true,
      });
    }
  } catch(e) {}
  // Catch form submissions where action wasn't statically rewritten
  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (!form || form.tagName !== 'FORM') return;
    var action = form.getAttribute('action') || '';
    var rewritten = rw(action);
    if (rewritten !== action) form.setAttribute('action', rewritten);
  }, true);
  // Catch anchor clicks where href was set via property (last-resort fallback)
  document.addEventListener('click', function(e) {
    var el = e.target;
    while (el && el !== document && el.tagName !== 'A') el = el.parentElement;
    if (!el || el.tagName !== 'A' || el.target === '_blank' || el.target === '_top') return;
    var raw = el.getAttribute('href');
    if (!raw || raw.charAt(0) === '#' || raw.indexOf('javascript:') === 0 || raw.indexOf('mailto:') === 0) return;
    var rewritten = rw(raw);
    if (rewritten !== raw) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = rewritten;
    }
  }, true);
})();
</script>`;

    $('head').prepend(interceptor);
    return $.html();
}

function rewriteCss(css, host) {
    return css.replace(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/g, (match, quote, url) => {
        const rw = rewriteUrl(url.trim(), host);
        return `url(${quote}${rw}${quote})`;
    });
}

function rewriteSetCookies(cookies) {
    if (!cookies) return cookies;
    const list = Array.isArray(cookies) ? cookies : [cookies];
    return list.map(c => c.replace(/;\s*domain=[^;]+/gi, '').replace(/;\s*samesite=none/gi, ''));
}

router.all('*', async (req, res) => {
    try {
        const parts = req.path.replace(/^\//, '').split('/');
        const host = parts[0];
        const rest = parts.slice(1).join('/');

        if (!host || !(await isAllowedHost(host))) {
            return res.status(403).json({error: 'Host not in proxy allowlist'});
        }

        const qs = Object.keys(req.query).length
            ? '?' + new URLSearchParams(req.query).toString()
            : '';
        const targetUrl = `https://${host}/${rest}${qs}`;

        const forwardHeaders = {...req.headers};
        delete forwardHeaders['host'];
        delete forwardHeaders['x-forwarded-for'];
        delete forwardHeaders['x-forwarded-proto'];

        const upstream = await axios({
            method: req.method,
            url: targetUrl,
            headers: {
                ...forwardHeaders,
                host,
                origin: `https://${host}`,
                referer: `https://${host}/`,
            },
            data: ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase()) ? req.body : undefined,
            responseType: 'arraybuffer',
            maxRedirects: 0,
            validateStatus: () => true,
        });

        const src = upstream.headers;
        const respHeaders = {};
        const contentEncoding = src['content-encoding'];

        for (const h of ['cache-control', 'etag', 'last-modified', 'expires', 'vary']) {
            if (src[h]) respHeaders[h] = src[h];
        }
        if (src['location']) respHeaders['location'] = rewriteUrl(src['location'], host);
        if (src['set-cookie']) respHeaders['set-cookie'] = rewriteSetCookies(src['set-cookie']);

        const contentType = src['content-type'] || '';
        const rawBuffer = Buffer.from(upstream.data);

        if (contentType.includes('text/html')) {
            const buf = await decompress(rawBuffer, contentEncoding);
            const rewritten = rewriteHtml(buf.toString('utf-8'), host);
            respHeaders['content-type'] = 'text/html; charset=utf-8';
            return res.status(upstream.status).set(respHeaders).send(rewritten);
        }

        if (contentType.includes('text/css')) {
            const buf = await decompress(rawBuffer, contentEncoding);
            const rewritten = rewriteCss(buf.toString('utf-8'), host);
            respHeaders['content-type'] = contentType;
            return res.status(upstream.status).set(respHeaders).send(rewritten);
        }

        if (contentType) respHeaders['content-type'] = contentType;
        return res.status(upstream.status).set(respHeaders).send(rawBuffer);

    } catch (err) {
        logger.error(`Proxy error: ${err.message}`);
        if (!res.headersSent) res.status(502).json({error: 'Proxy upstream error'});
    }
});

module.exports = router;
