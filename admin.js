// admin.js — infonet.ng/admin. Plain JavaScript, no libraries.
// Screens: loader → sign in (fingerprint · password · Google) → Authenticator code → dashboard.
(function () {
    'use strict';
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    const app = $('#app');
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const naira = (n) => `₦${Number(n || 0).toLocaleString('en-NG')}`;
    const num = (n) => Number(n || 0).toLocaleString('en-NG');
    const params = new URLSearchParams(location.search);
    let STATUS = {}, STOCK = null, STATS = null, SEC = null, TAB = 'home', liveTimer = 0;

    /* ----------------------------------------------------------------- theme */
    const setTheme = (t) => { document.documentElement.dataset.theme = t; try { localStorage.setItem('infonet.admin.theme', t); } catch {} };
    try { setTheme(localStorage.getItem('infonet.admin.theme') || 'dark'); } catch {}
    $('#themeBtn').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));

    /* ------------------------------------------------------------------- api */
    async function api(action, body) {
        const opts = { credentials: 'same-origin', headers: { 'X-Infonet-Admin': '1' } };
        if (body !== undefined) { opts.method = 'POST'; opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
        let j;
        try { const r = await fetch(`/api/admin?action=${action}`, opts); j = await r.json(); } catch { j = { ok: false, error: 'No connection. Check your internet and try again.' }; }
        if (!j.ok && j.signedOut && action !== 'status') { toast('You were signed out.', true); boot(); }
        return j;
    }
    function toast(text, bad) {
        $('.toast')?.remove();
        const t = document.createElement('div');
        t.className = `toast${bad ? ' bad' : ''}`; t.setAttribute('role', 'status'); t.textContent = text;
        document.body.append(t); setTimeout(() => t.remove(), 5200);
    }

    /* -------------------------------------------------------------- icons */
    const I = {
        lock: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><circle cx="12" cy="15.5" r="1.2"/></svg>',
        eye: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
        eyeOff: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.2 3.9M6.4 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
        arrow: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
        finger: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 5.8A8 8 0 0 1 20 11.5c0 1.6-.2 3.2-.6 4.7"/><path d="M4.3 9.2A8 8 0 0 0 4 11.5c0 2.4-.6 4.3-1.5 5.8"/><path d="M8.6 18.7c1.3-2 2-4.4 2-7.2a1.4 1.4 0 0 1 2.8 0c0 3.4-.8 6.4-2.3 8.9"/><path d="M7.2 11.5a4.8 4.8 0 0 1 9.6 0c0 2.9-.5 5.4-1.5 7.6"/><path d="M14.9 21c.4-.7.7-1.4 1-2.2"/></svg>',
        google: '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>',
        plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
        dots: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>',
        check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
        bell: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
        laptop: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="10" rx="1.5"/><path d="M2 18.5h20"/></svg>',
        globe: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/></svg>',
        chart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
        shield: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 5 6v6c0 4.4 3 7.9 7 9 4-1.1 7-4.6 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
        wa: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Z" opacity=".9"/></svg>',
    };
    const MARK = '<img src="/assets/img/infonet-mark.webp" alt="Infonet" width="54" height="54">';

    /* ------------------------------------------- logo trace loader (vanilla port) */
    // Port of claude/LogoTraceLoader.tsx: a segment travels the traced outline, then the
    // filled mark fades in. Same TRACE_PATH and FILL_PATHS as the React component.
    const TRACE = 'M9.67 205.75c2.4-3.73 2.47-3.85 3.91-7.44c1.42-3.53 2.44-4.950 7.08-9.88c5.28-5.61 6.49-7.07 7.47-9.05c2.24-4.48 2.11-7.38-.88-20.38c-2.4-10.45-2.42-11.17-.35-16.75c.63-1.72 1.75-5.43 2.48-8.25c2.67-10.28 5.65-19.2 8.81-26.38c1.96-4.44 7.27-15.01 9.67-19.24c4.06-7.16 11.71-17.97 18.42-26c3.52-4.22 12.98-13.9 17.57-17.99c25.22-22.45 57.88-37.68 91.15-42.52c14.72-2.13 32.6-2.47 46.5-.87c12.26 1.41 24.24 4.05 35.62 7.85c15.51 5.17 27.48 11.1 40.26 19.95c12.88 8.92 15.13 11.27 34.4 36.08c13.11 16.86 43.91 57.9 74.35 99.08c5.22 7.06 12.3 16.63 15.72 21.25c6.53 8.82 20.61 27.96 37.65 51.17c5.56 7.56 13.53 18.41 17.72 24.12c8.57 11.67 47.74 65.26 55.28 75.62c2.7 3.72 9.29 12.77 14.66 20.13c17.51 24 72.06 99.11 88.34 121.63c8.75 12.1 20.35 28.13 25.77 35.62c5.43 7.49 12.22 16.89 15.1 20.88c9.04 12.53 15.38 21.29 26.25 36.24c5.8 7.98 13.56 18.67 17.26 23.76c17.21 23.72 23.82 32.81 36.7 50.5c7.44 10.2 7.71 10.49 12.41 13c2.68 1.42 4.38 2.97 6.76 6.12c.89 1.17 2.49 3.19 3.57 4.5c1.08 1.31 2.8 3.63 3.82 5.15c4.09 6.14 8.14 8.36 14.61 8.01c3.28-.18 6.03-.87 8.66-2.16c2.67-1.31 4.24-3.01 6.16-6.66c1.19-2.25 1.87-3.18 3.76-5.13c3.45-3.58 4.31-5.53 4.55-10.33c.07-1.38.24-50.37.38-108.88c.31-136.57.66-250.4 1.01-334.16c.18-41.82.2-66.7.05-66.96c-.27-.49-1.02.4-5.06 6c-10.35 14.32-21.35 29.26-32.6 44.24c-6.56 8.74-25.9 34.31-30.25 40c-21.79 28.48-44.76 58.21-68.66 88.88c-31.2 40.04-40.09 51.41-40.63 51.970l-.58.6l-.81-.93c-.87-.99-1.71-2.07-14.75-18.92c-18.53-23.93-72.17-93.79-84.46-109.97c-1.72-2.27-4.23-5.57-5.58-7.34c-1.34-1.77-2.44-3.33-2.44-3.46c0-.27-.11-.12 9.6-12.7c15.37-19.91 81.76-105.42 102.28-131.75c4.55-5.84 12.82-16.47 18.38-23.62c18.8-24.21 20.92-26.71 27.37-32.15c9.57-8.09 26.16-18.3 38.75-23.86c17.71-7.81 35.04-11.94 57.7-13.74c5.64-.45 30.93-.53 37.74-.12c8.09.49 17.01 1.78 26.74 3.89c32.1 6.93 61.79 22.04 85.94 43.75c3.89 3.49 11.83 11.53 15.16 15.35c15.57 17.84 26.66 37.68 33.85 60.55c1.57 5.01 4.58 16.81 6.09 23.95c1.95 9.14 2.6 13.85 3.33 24.12c.42 5.94.44 17.69.41 231.77l-.03 225.51l-.65 2.39c-1.68 6.15-4.44 13.25-7.8 20.09c-3.07 6.25-5.1 9.31-8.61 13.01c-3.33 3.51-4.52 5.25-6.09 8.99c-.77 1.8-1.64 3.35-2.54 4.5c-3.5 4.47-5.19 7.32-5.88 9.87c-.53 1.98-.38 4.6.49 8.63c2.36 10.81 3.17 14.31 4.07 17.5c1.5 5.31 1.76 6.76 1.78 9.62c.01 2.6-.01 2.67-1.4 6.31c-.77 2.03-1.7 4.9-2.07 6.38c-3.64 14.77-7.95 26.56-14.38 39.31c-13.59 26.98-34.84 50.89-60.11 67.63c-25.39 16.83-52.64 26.3-83.74 29.13c-4.83.44-18.42.58-24.26.26c-29.71-1.63-57.43-10.21-81.24-25.15c-6.96-4.37-11.14-7.58-15.38-11.85c-3.95-3.97-6.02-6.5-13.62-16.64c-6.25-8.36-8.71-11.68-27.42-37c-4.47-6.06-10.58-14.32-13.58-18.38c-6.95-9.38-19.37-26.19-26.51-35.88c-12-16.29-31.07-42.13-36.24-49.12c-3.01-4.06-8.41-11.37-12-16.25c-3.6-4.88-9.58-12.98-13.28-18c-3.71-5.02-10.95-14.84-16.11-21.83c-5.15-6.99-16.27-22.07-24.72-33.5c-8.44-11.44-19.91-26.98-25.48-34.54c-5.58-7.57-16.33-22.14-23.89-32.38c-24.69-33.45-40.23-54.53-55.4-75.12c-8.2-11.14-20.35-27.62-27-36.63c-16.14-21.85-22.39-30.33-28.22-38.25c-5.6-7.62-25.79-35.2-30.65-41.88c-1.81-2.47-6.49-8.88-10.41-14.24c-13.19-18.04-32.81-44.9-42.63-58.38c-5.36-7.36-12.05-16.52-14.87-20.38c-2.82-3.85-6.63-9.08-8.47-11.62c-1.84-2.54-4.19-5.48-5.23-6.51c-1.62-1.62-2.38-2.14-5.22-3.6c-2.01-1.03-3.73-2.11-4.37-2.73c-.58-.57-2.06-2.55-3.28-4.41c-2.38-3.62-9.01-12.84-11.48-15.97c-.82-1.05-2.71-3.1-4.19-4.57c-2.11-2.09-3.08-2.86-4.52-3.57c-4.57-2.24-8.2-1.6-12.89 2.3c-1.13.94-3.22 2.4-4.64 3.24c-5.08 3.02-6.93 6.27-6.61 11.57c.16 2.79.86 4.55 2.77 7.03c2.29 2.98 2.65 3.67 2.66 5.04c0 1.46-.34 2.14-2.37 4.81c-2.4 3.14-3.04 5.29-3.25 10.86c-.07 1.73-.18 29.07-.25 60.76c-.08 31.69-.25 89.86-.38 129.25c-.75 216-.92 306.01-.56 305.99c.1-.01 2.1-2.67 4.43-5.91c18.53-25.71 44.11-59.76 78.9-104.99c13.99-18.19 39.78-51.46 53.08-68.47c4.95-6.32 11.54-14.76 14.66-18.74c3.11-3.99 7.53-9.65 9.82-12.57c2.29-2.93 4.75-6.08 5.46-7c3.66-4.77 9.23-11.77 9.6-12.07c.51-.43-.49-1.61 9.15 10.78c10.6 13.63 15.49 19.94 42.94 55.48c37.73 48.86 51.67 67.11 54.59 71.48l1.41 2.1l-.95 1.15c-.93 1.13-10.42 13.3-16.19 20.77c-1.64 2.13-7.42 9.56-12.84 16.5c-10.67 13.67-19.7 25.27-49.24 63.25c-10.54 13.54-23.59 30.31-29 37.25c-5.42 6.94-13.57 17.41-18.13 23.25c-24.03 30.83-27.72 35.54-29.4 37.5c-.73.86-1.92 1.81-3.14 2.54c-2.77 1.63-8.86 4.83-12.83 6.73c-3.59 1.71-7.45 3.71-13.19 6.82c-16.58 8.98-37.95 16.03-58.7 19.38c-14.12 2.27-23.97 2.81-41.74 2.27c-14.36-.44-32.51-3.64-48.17-8.5c-26.03-8.07-49.3-21.28-69.59-39.51c-3.42-3.08-10.94-10.64-14.15-14.23c-20.38-22.83-34.75-52.39-39.48-81.25c-.56-3.37-1.39-8.09-1.86-10.5c-.99-5.04-1.93-11.38-2.54-17.12c-.39-3.73-.43-19.86-.52-234.5l-.1-230.5l.9-5.38c2.17-12.92 4.04-18.38 8.8-25.75z';
    const FILLS = [
        'M187.15.44c-56.84 4.57-107.44 35.84-137.55 84.96c-3.74 6.13-10.66 19.97-13.24 26.57c-2.67 6.8-5.06 14.4-6.89 21.64c-1.63 6.45-2.98 13.13-2.74 13.37c.08.08 3.62-1.83 7.88-4.22c9.5-5.37 24.46-12.85 32.3-16.19c20.08-8.51 35.75-12.53 51.23-13.09c22.95-.79 41.88 7.08 58.39 24.35c3.9 4.1 9.39 10.86 10.7 13.2c1.71 3.03 132.54 182.5 178.32 244.55c163.57 221.8 282.5 382.98 315.04 426.81c7.64 10.35 13.36 16.31 20.09 21.05c38.9 27.44 91.56 36.71 140.49 24.7c48.13-11.86 89.26-43.68 113.24-87.59c8.24-15.12 14.36-31.94 17.78-48.85c.6-3.06 1.08-5.57 1.04-5.61c-.04-.04-3.74 1.99-8.24 4.5c-27.28 15.31-50.51 24.5-71 28.04c-4.41.76-6.6.92-15.11.92c-8.87 0-10.46-.12-14.52-.92c-15.59-3.18-27.65-9.78-39.58-21.76c-4.69-4.69-10.86-12.05-12.13-14.48c-.28-.51-28.44-39.46-62.61-86.51c-34.21-47.06-68.7-94.59-76.65-105.65c-163.650-226.41-304.26-417.86-346.58-471.76c-12.13-15.43-15.59-19.37-20.8-23.43c-5.18-4.05-15.24-10.86-20.21-13.64c-20.61-11.69-45.31-19.01-70.76-21c-5.89-.44-22-.44-27.89.04z',
        'M792.96.44c-32.9 2.23-57.08 9.9-83.06 26.41c-8.47 5.41-14.08 9.63-19.77 14.88c-3.22 2.98-7.31 7.99-24.54 30.15c-96.62 124.22-129.11 166.15-129.15 166.62c-.04.44 104.13 136.04 107.16 139.5l1.03 1.16l18.3-23.39c70.4-89.98 124.78-161.22 153.06-200.64c3.22-4.49 6.05-8.23 6.28-8.31c.28-.08.32 9.58.16 30.82c-.12 17.07-.55 136.32-.91 265.08c-.6 219.53-.6 234.29 0 237.07c1.27 5.69 4.65 11.02 9.35 14.88c19.92 16.19 49.16 21.6 79.95 14.72c13.24-2.95 27.64-9.87 43.87-21.09c10.46-7.23 25.38-20 30.63-26.17c4.06-4.77 10.58-18.81 13.41-28.84l1.07-3.82l.12-222.75c.08-151.39 0-225.53-.32-231.38c-.68-14.56-1.51-19.61-6.4-39.9c-4.5-18.61-11.54-35.4-21.36-50.99c-10.74-17.03-25.66-33.22-42.25-45.83c-26.89-20.52-58.75-33.25-93.71-37.47c-5.89-.71-9.75-.87-22.44-.95c-8.43-.08-17.62.04-20.48.24z',
        'M103.62 151.95c-14.2 1.43-25.42 4.45-36.64 9.9c-16.78 8.16-32.25 18.58-46.34 31.27c-6.12 5.49-11.97 13.16-14.87 19.45c-1.79 3.86-3.46 10.22-4.78 18.14l-.99 6.12l0 228.6c0 151.2.12 230.31.4 233.69c.59 7.28 1.47 13.81 2.82 20.25c.6 3.06 1.43 7.64 1.75 10.14c1.59 11.5 7.28 29.36 13.33 41.89c8.23 17.06 18.53 31.78 31.82 45.39c31.62 32.49 73.83 52.06 120.72 55.96c7.04.56 24.66.56 31.43 0c28.6-2.46 54.89-10.38 78.56-23.59c2.11-1.15 5.49-2.9 7.55-3.85c7.56-3.54 15.92-8.08 17.07-9.31c.68-.72 13.88-17.58 29.35-37.47c83.74-107.56 126.38-162.37 126.85-162.89c.4-.52-7.59-11.1-53.42-70.41c-29.63-38.38-54.01-69.84-54.17-69.88c-.12-.04-.96.87-1.83 1.98c-.84 1.16-10.9 13.97-22.28 28.52c-64 81.75-115.43 149.01-143.39 187.59l-8.95 12.33l-.12-2.98c-.16-3.18.43-222.27 1.15-419.49c.44-130.75.68-119.89-2.43-126.17c-1.95-3.94-4.69-7.04-9.07-10.19c-10.62-7.63-22.43-12.21-37.27-14.43c-4.77-.72-21.16-1.08-26.25-.56z',
    ];
    function loaderSvg(px) {
        return `<svg role="status" aria-label="Loading" width="${px}" height="${px * 0.874}" viewBox="-30 -30 1060 934" class="ltl">
            <style>@keyframes ltl{to{stroke-dashoffset:-1}}@keyframes ltlin{from{opacity:0}to{opacity:1}}
            .ltl .run{animation:ltl 1.4s linear infinite}.ltl.done .run,.ltl.done .trk{opacity:0;transition:opacity .4s}
            .ltl .fill{opacity:0}.ltl.done .fill{animation:ltlin .4s ease-out both}
            @media (prefers-reduced-motion:reduce){.ltl .run,.ltl .trk{display:none}.ltl .fill{opacity:1}}</style>
            <path class="trk" d="${TRACE}" fill="none" stroke="currentColor" stroke-width="12" opacity=".18"/>
            <path class="run" d="${TRACE}" fill="none" stroke="currentColor" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray=".16 .84"/>
            <g class="fill">${FILLS.map((d) => `<path d="${d}" fill="currentColor" fill-rule="evenodd"/>`).join('')}</g></svg>`;
    }
    $$('[data-loader]').forEach((el) => { el.innerHTML = loaderSvg(Number(el.dataset.loader)); });
    const resolveLoader = () => new Promise((r) => { $('.ltl')?.classList.add('done'); setTimeout(r, 480); });

    /* ============================================================ sign in */
    const b64uToBuf = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0)).buffer;
    const bufToB64u = (b) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const passkeysSupported = () => Boolean(window.PublicKeyCredential && navigator.credentials?.get);

    function authShell(inner) {
        stopLive(); document.body.classList.remove('in-app');
        app.innerHTML = `<div class="center"><section class="glass auth">${inner}
            <p class="foot">Infonet · Sales · Repairs · Swaps</p></section></div>`;
    }

    function showLogin(error) {
        const fp = STATUS.passkeys && passkeysSupported();
        authShell(`
            <div class="tile">${MARK}</div>
            <h1>Welcome back</h1>
            <p class="sub">Sign in to manage Infonet</p>
            ${fp ? `<button class="btn btn-white" id="fpBtn" type="button" style="margin-bottom:6px">${I.finger} Use fingerprint or face</button>
            <div class="or">or use your password</div>` : ''}
            <form id="pwForm" autocomplete="on">
                <input type="text" name="username" value="admin" autocomplete="username" hidden>
                <div class="field">${I.lock}
                    <label class="sr" for="pw">Password</label>
                    <input id="pw" type="password" name="password" placeholder="Password" autocomplete="current-password" required ${fp ? '' : 'autofocus'}>
                    <button class="eye" type="button" id="eyeBtn" aria-label="Show password">${I.eye}</button>
                </div>
                <div class="row">
                    <label class="check"><input type="checkbox" id="remember" checked> Remember me</label>
                    <a href="#" id="forgot">Forgot password?</a>
                </div>
                <button class="btn btn-primary" type="submit" id="pwBtn">Login <span class="go">${I.arrow}</span></button>
            </form>
            ${STATUS.ready?.google ? `<div class="or">or continue with</div>
            <div class="alt"><a class="btn btn-ghost" id="gBtn" href="/api/admin?action=google">${I.google} Sign in with Google</a></div>` : ''}
            <p class="msg bad" id="msg" role="alert">${esc(error || '')}</p>`);
        const msg = $('#msg');
        $('#eyeBtn').addEventListener('click', () => {
            const pw = $('#pw'), show = pw.type === 'password';
            pw.type = show ? 'text' : 'password';
            $('#eyeBtn').innerHTML = show ? I.eyeOff : I.eye;
            $('#eyeBtn').setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        });
        $('#forgot').addEventListener('click', (e) => {
            e.preventDefault();
            msg.className = 'msg'; msg.textContent = 'Change ADMIN_PASSWORD in Vercel → infonet-web → Settings → Environment Variables, then redeploy.';
        });
        $('#gBtn')?.addEventListener('click', (e) => { e.currentTarget.href = `/api/admin?action=google&remember=${$('#remember').checked ? 1 : 0}`; });
        $('#pwForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = $('#pwBtn'); btn.disabled = true; msg.className = 'msg bad'; msg.textContent = '';
            const j = await api('login-password', { password: $('#pw').value, remember: $('#remember').checked });
            btn.disabled = false;
            if (!j.ok) { msg.textContent = j.error; $('#pw').select(); return; }
            if (j.next === 'totp') showTotp(); else showSetup();
        });
        $('#fpBtn')?.addEventListener('click', () => passkeyLogin(msg));
        // Offer the fingerprint straight away on phones that support it.
        if (fp && matchMedia('(pointer:coarse)').matches && !error) setTimeout(() => passkeyLogin(msg, true), 350);
    }

    async function passkeyLogin(msg, quiet) {
        const o = await api('passkey-options', {});
        if (!o.ok) { if (!quiet) { msg.className = 'msg bad'; msg.textContent = o.error; } return; }
        const pk = o.publicKey;
        pk.challenge = b64uToBuf(pk.challenge);
        pk.allowCredentials = pk.allowCredentials.map((c) => ({ ...c, id: b64uToBuf(c.id) }));
        let cred;
        try { cred = await navigator.credentials.get({ publicKey: pk }); } catch { if (!quiet) { msg.className = 'msg bad'; msg.textContent = 'Fingerprint sign-in was cancelled.'; } return; }
        const j = await api('login-passkey', { remember: $('#remember')?.checked ?? true, credential: {
            id: cred.id, clientDataJSON: bufToB64u(cred.response.clientDataJSON),
            authenticatorData: bufToB64u(cred.response.authenticatorData), signature: bufToB64u(cred.response.signature),
        } });
        if (!j.ok) { msg.className = 'msg bad'; msg.textContent = j.error; return; }
        enter();
    }

    function showTotp() {
        authShell(`
            <div class="tile">${I.shield.replace('width="20" height="20"', 'width="46" height="46"')}</div>
            <h1>Two-step check</h1>
            <p class="sub">Code from Google Authenticator</p>
            <form id="tForm">
                <div class="field"><label class="sr" for="code">6-digit code</label>
                    <input id="code" class="code-in" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="\\d{6}" placeholder="••••••" required autofocus></div>
                <button class="btn btn-primary" type="submit" id="tBtn">Verify <span class="go">${I.arrow}</span></button>
            </form>
            <p style="margin:16px 0 0;font-size:14px"><a href="#" id="useRc">Lost your phone? Use a recovery code</a></p>
            <p style="margin:8px 0 0;font-size:14px"><a href="/admin">Start again</a></p>
            <p class="msg bad" id="msg" role="alert"></p>`);
        const code = $('#code'), msg = $('#msg');
        let rc = false;
        $('#useRc').addEventListener('click', (e) => {
            e.preventDefault(); rc = !rc;
            code.value = ''; code.maxLength = rc ? 11 : 6; code.inputMode = rc ? 'text' : 'numeric';
            code.pattern = rc ? '[A-Za-z2-7]{5}-?[A-Za-z2-7]{5}' : '\\d{6}'; code.placeholder = rc ? 'XXXXX-XXXXX' : '••••••';
            code.classList.toggle('code-in', !rc); e.currentTarget.textContent = rc ? 'Use the Authenticator code' : 'Lost your phone? Use a recovery code'; code.focus();
        });
        const go = async () => {
            $('#tBtn').disabled = true; msg.textContent = '';
            const j = await api('login-totp', { code: code.value.trim() });
            $('#tBtn').disabled = false;
            if (!j.ok) { msg.textContent = j.error; code.select(); return; }
            if (j.usedRecovery) toast('Recovery code used. Make new ones in Security.');
            enter();
        };
        code.addEventListener('input', () => { if (!rc) { code.value = code.value.replace(/\D/g, ''); if (code.value.length === 6) go(); } });
        $('#tForm').addEventListener('submit', (e) => { e.preventDefault(); go(); });
    }

    async function showSetup() {
        authShell(`<div class="tile">${MARK}</div><h1>Set up two-step sign-in</h1>
            <p class="sub">One time · about a minute</p><div id="setupBody"><p class="empty">Preparing…</p></div>`);
        const j = await api('totp-begin', {});
        if (!j.ok) { $('#setupBody').innerHTML = `<p class="msg bad">${esc(j.error)}</p>`; return; }
        $('#setupBody').innerHTML = `
            <ol class="steps">
                <li>Install <b>Google Authenticator</b> on your phone.</li>
                <li>Tap <b>+</b> → <b>Scan a QR code</b>, and scan this:</li>
            </ol>
            <div class="qr">${window.qrSvg ? window.qrSvg(j.uri, 196) : ''}</div>
            <p style="font-size:13px;color:var(--muted);margin:12px 0 6px">Can't scan? Choose <b>Enter a setup key</b> and type:</p>
            <div class="key">${esc(j.secret.replace(/(.{4})/g, '$1 ').trim())}</div>
            <ol class="steps" start="3" style="margin-top:16px"><li>Type the 6-digit code it shows:</li></ol>
            <form id="sForm"><div class="field"><input id="code" class="code-in" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" required></div>
            <button class="btn btn-primary" id="sBtn">Turn on <span class="go">${I.arrow}</span></button></form>
            <p class="msg bad" id="msg" role="alert"></p>`;
        $('#sForm').addEventListener('submit', async (e) => {
            e.preventDefault(); $('#sBtn').disabled = true;
            const r = await api('totp-confirm', { code: $('#code').value.trim() });
            $('#sBtn').disabled = false;
            if (!r.ok) { $('#msg').textContent = r.error; return; }
            showRecovery(r.recoveryCodes, true);
        });
    }

    function showRecovery(codes, thenFingerprint) {
        authShell(`<div class="tile">${I.shield.replace('width="20" height="20"', 'width="46" height="46"')}</div>
            <h1>Save your recovery codes</h1>
            <p class="sub">Each works once · keep them safe</p>
            <p style="color:var(--muted);font-size:14px;margin:0">If you lose your phone, one of these gets you in instead of the Authenticator code. They are shown <b>only now</b>.</p>
            <div class="codes">${codes.map((c) => `<span>${esc(c)}</span>`).join('')}</div>
            <div class="alt"><button class="btn btn-ghost" id="dl" type="button">Download as a file</button>
            <button class="btn btn-primary" id="done" type="button">I've saved them <span class="go">${I.arrow}</span></button></div>`);
        $('#dl').addEventListener('click', () => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([`Infonet Admin recovery codes (${new Date().toLocaleDateString()})\nEach works once.\n\n${codes.join('\n')}\n`], { type: 'text/plain' }));
            a.download = 'infonet-admin-recovery-codes.txt'; a.click();
        });
        $('#done').addEventListener('click', () => (thenFingerprint && passkeysSupported() ? offerFingerprint() : enter()));
    }

    function offerFingerprint() {
        authShell(`<div class="tile">${I.finger.replace('width="22" height="22"', 'width="46" height="46"')}</div>
            <h1>Sign in with your fingerprint?</h1>
            <p class="sub">Phone or laptop · optional</p>
            <p style="color:var(--muted);font-size:14px;margin:0 0 18px">Next time, touch the sensor (or use face unlock) instead of typing the password and a code. Do this on each device you use.</p>
            <div class="alt"><button class="btn btn-primary" id="addFp" type="button">Add this device <span class="go">${I.arrow}</span></button>
            <button class="btn btn-ghost" id="skip" type="button">Not now</button></div><p class="msg" id="msg"></p>`);
        $('#skip').addEventListener('click', enter);
        $('#addFp').addEventListener('click', async () => { if (await addPasskey($('#msg'))) enter(); });
    }

    function deviceName() {
        const ua = navigator.userAgent;
        if (/iPhone/.test(ua)) return 'iPhone';
        if (/iPad/.test(ua)) return 'iPad';
        if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Android phone' : 'Android tablet';
        if (/Windows/.test(ua)) return 'Windows laptop';
        if (/Mac/.test(ua)) return 'Mac';
        return 'This device';
    }

    async function addPasskey(msg) {
        const o = await api('passkey-reg-options', {});
        if (!o.ok) { msg.className = 'msg bad'; msg.textContent = o.error; return false; }
        const pk = o.publicKey;
        pk.challenge = b64uToBuf(pk.challenge); pk.user.id = b64uToBuf(pk.user.id);
        pk.excludeCredentials = pk.excludeCredentials.map((c) => ({ ...c, id: b64uToBuf(c.id) }));
        let cred;
        try { cred = await navigator.credentials.create({ publicKey: pk }); } catch (e) {
            msg.className = 'msg bad';
            msg.textContent = e.name === 'InvalidStateError' ? 'This device is already set up.' : 'Cancelled, or this device has no fingerprint or face unlock set up.';
            return false;
        }
        const j = await api('passkey-register', { name: deviceName(), credential: {
            id: cred.id, clientDataJSON: bufToB64u(cred.response.clientDataJSON),
            attestationObject: bufToB64u(cred.response.attestationObject), transports: cred.response.getTransports?.() || [],
        } });
        if (!j.ok) { msg.className = 'msg bad'; msg.textContent = j.error; return false; }
        toast(`Fingerprint sign-in added for ${j.passkey.name}.`);
        return true;
    }

    /* ============================================================ dashboard */
    async function enter() {
        history.replaceState(null, '', '/admin');
        app.innerHTML = `<div class="loader-wrap"><div><span data-loader="96"></span><p>Opening dashboard</p></div></div>`;
        $$('[data-loader]').forEach((el) => { el.innerHTML = loaderSvg(96); });
        const [st, sk, se] = await Promise.all([api('stats', {}), api('stock-get', {}), api('security', {})]);
        STATS = st.ok ? st : null; STOCK = sk.ok ? sk.stock : null; SEC = se.ok ? se : null;
        if (!sk.ok) toast(sk.error, true);
        await resolveLoader();
        renderShell();
    }

    const initials = 'DO';
    function renderShell() {
        document.body.classList.add('in-app');
        app.innerHTML = `
        <div class="frame-wrap"><div class="frame glass">
            <header class="fbar">
                <a class="brand" href="/admin" aria-label="Infonet Admin"><img src="/assets/img/infonet-mark.webp" alt="" width="30" height="30"></a>
                <nav class="pills" role="tablist">
                    ${[['home', 'Home'], ['analytics', 'Analytics'], ['stock', 'Stock'], ['security', 'Security']].map(([k, l]) =>
                        `<button role="tab" data-tab="${k}" aria-selected="${k === TAB}">${l}</button>`).join('')}
                </nav>
                <div class="fright">
                    <button class="iconbtn" id="bell" aria-label="Setup checklist">${I.bell}<i class="dot" id="bellDot" hidden></i></button>
                    <div class="who"><button class="avatar" id="who" aria-haspopup="menu" aria-label="Account">${initials}</button>
                        <div class="menu glass" id="whoMenu" hidden>
                            <a href="/" target="_blank" rel="noopener">View infonet.ng</a>
                            <button type="button" data-tab-go="security">Security settings</button>
                            <button type="button" id="logout">Sign out</button>
                        </div></div>
                </div>
            </header>
            <div class="fbody">
                <aside class="side glass" id="side"></aside>
                <section class="main" id="main"></section>
            </div>
        </div><aside class="floater glass" id="floater" aria-label="Setup checklist"></aside></div>`;
        $$('[data-tab]').forEach((b) => b.addEventListener('click', () => go(b.dataset.tab)));
        $('#who').addEventListener('click', () => { $('#whoMenu').hidden = !$('#whoMenu').hidden; });
        document.addEventListener('click', (e) => { if (!e.target.closest('.who')) $('#whoMenu') && ($('#whoMenu').hidden = true); });
        $('[data-tab-go]').addEventListener('click', () => { $('#whoMenu').hidden = true; go('security'); });
        $('#logout').addEventListener('click', async () => { await api('logout', {}); location.href = '/admin'; });
        $('#bell').addEventListener('click', () => $('#floater').classList.toggle('open'));
        renderSide(); renderFloater(); go(TAB); startLive();
    }

    function go(tab) {
        TAB = tab;
        $$('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
        ({ home: renderHome, analytics: renderAnalytics, stock: renderStock, security: renderSecurity })[tab]();
        $('#main').scrollTop = 0;
    }

    /* -------------------------------------------------------------- sidebar */
    function renderSide() {
        const list = STOCK?.products || [];
        const inStock = list.filter((p) => p.status !== 'sold').length;
        const act = (STATS?.activity || []).slice(0, 4);
        $('#side').innerHTML = `
            <div class="sh"><h3>Stock <span class="count">${list.length}</span></h3>
                <div><button class="iconbtn sm" id="sideAdd" aria-label="Add product">${I.plus}</button></div></div>
            <ul class="tasks">${list.slice(0, 6).map((p) => `
                <li><button type="button" data-edit="${esc(p.slug)}">
                    <span class="box${p.status === 'sold' ? '' : ' on'}">${p.status === 'sold' ? '' : I.check}</span>
                    <span class="tt">${esc(p.name)}</span>${p.status === 'sold' ? '<span class="pill-s">Sold</span>' : ''}</button></li>`).join('') || '<li class="empty" style="padding:6px 2px">No products yet.</li>'}
            </ul>
            <p class="mini">${inStock} in stock · ${list.length - inStock} sold</p>
            <div class="sh" style="margin-top:18px"><h3>Recent activity</h3></div>
            <ul class="acts">${act.map((a) => `<li><span class="ai">${a.kind === 'stock' ? I.laptop : I.shield}</span>
                <span><span class="tt">${esc(a.what)}</span><span class="mini">${ago(a.at)}</span></span></li>`).join('') || '<li class="empty">Nothing yet.</li>'}</ul>
            <div class="sh" style="margin-top:18px"><h3>Quick access</h3></div>
            <div class="quick">
                <button type="button" id="qAdd">${I.plus}<span>Add</span></button>
                <a href="/products" target="_blank" rel="noopener">${I.globe}<span>Site</span></a>
                <button type="button" data-q="analytics">${I.chart}<span>Stats</span></button>
            </div>`;
        $('#sideAdd').addEventListener('click', () => editProduct(null));
        $('#qAdd').addEventListener('click', () => editProduct(null));
        $('[data-q]').addEventListener('click', () => go('analytics'));
        $$('[data-edit]', $('#side')).forEach((b) => b.addEventListener('click', () => editProduct(b.dataset.edit)));
    }

    function ago(iso) {
        const s = Math.max(0, (Date.now() - new Date(iso)) / 1000);
        if (s < 60) return 'just now';
        if (s < 3600) return `${Math.round(s / 60)} minutes ago`;
        if (s < 86400) return `${Math.round(s / 3600)} hours ago`;
        return `${Math.round(s / 86400)} days ago`;
    }

    /* ------------------------------------------------------ setup checklist */
    function renderFloater() {
        const r = STATUS.ready || {};
        const items = [
            ['Google Authenticator', Boolean(SEC?.totp), 'On', 'Security'],
            ['Fingerprint sign-in', Boolean(SEC?.passkeys?.length), `${SEC?.passkeys?.length || 0} device(s)`, 'Add a device in Security'],
            ['Sign in with Google', Boolean(r.google), 'Connected', 'Needs GOOGLE_CLIENT_ID in Vercel'],
            ['Saving to the website', Boolean(r.github), 'Connected', 'Needs GITHUB_TOKEN in Vercel'],
            ['Visitor counter', Boolean(STATS?.configured), 'Counting', 'Needs the Redis store'],
        ];
        const todo = items.filter((i) => !i[1]).length;
        $('#bellDot').hidden = todo === 0;
        const html = `<div class="sh"><h3>Setup checklist</h3><span class="count">${items.length - todo}/${items.length}</span></div>
            <ul class="pend">${items.map(([t, ok, yes, no]) => `<li class="${ok ? 'ok' : ''}"><span><span class="tt">${t}</span><span class="mini">${ok ? yes : no}</span></span>
                <span class="tick">${ok ? I.check : '!'}</span></li>`).join('')}</ul>`;
        $('#floater').innerHTML = html;
        const inline = $('#checkCard'); if (inline) inline.innerHTML = html;
    }

    /* ----------------------------------------------------------------- charts */
    function area(values, { h = 120, labels = [], grid = false, max } = {}) {
        const w = 600, n = values.length, top = max || Math.max(1, ...values) * 1.15, padB = labels.length ? 22 : 4, padL = grid ? 30 : 0;
        const X = (i) => padL + (n === 1 ? 0 : (i * (w - padL)) / (n - 1)), Y = (v) => 6 + (h - padB - 6) * (1 - v / top);
        const pts = values.map((v, i) => [X(i), Y(v)]);
        let d = `M${pts[0][0]} ${pts[0][1]}`;
        for (let i = 1; i < n; i++) {           // Catmull-Rom → Bézier, for a soft line
            const p0 = pts[i - 2] || pts[i - 1], p1 = pts[i - 1], p2 = pts[i], p3 = pts[i + 1] || p2;
            const lo = h - padB, cy = (y) => Math.min(lo, Math.max(6, y));   // never dip below zero
            d += `C${p1[0] + (p2[0] - p0[0]) / 6} ${cy(p1[1] + (p2[1] - p0[1]) / 6)} ${p2[0] - (p3[0] - p1[0]) / 6} ${cy(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]} ${p2[1]}`;
        }
        const id = `g${Math.random().toString(36).slice(2, 7)}`;
        const gl = grid ? [0, .25, .5, .75, 1].map((f) => { const v = Math.round(top / 1.15 * f); return `<line x1="${padL}" x2="${w}" y1="${Y(v)}" y2="${Y(v)}" class="gl"/><text x="0" y="${Y(v) + 4}" class="ax">${v}</text>`; }).join('') : '';
        const lb = labels.map((l, i) => (l ? `<text x="${X(i)}" y="${h - 4}" class="ax" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${esc(l)}</text>` : '')).join('');
        return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="spark" role="img" aria-label="Chart">
            <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c93ff" stop-opacity=".45"/><stop offset="1" stop-color="#7c93ff" stop-opacity="0"/></linearGradient></defs>
            ${gl}<path d="${d}L${X(n - 1)} ${h - padB}L${X(0)} ${h - padB}Z" fill="url(#${id})"/>
            <path d="${d}" fill="none" stroke="#a9b6ff" stroke-width="2.2" vector-effect="non-scaling-stroke"/>${lb}</svg>`;
    }
    function bars(values, labels) {
        const w = 300, h = 110, n = values.length, top = Math.max(1, ...values), bw = (w / n) * 0.46;
        return `<svg viewBox="0 0 ${w} ${h}" class="spark" role="img" aria-label="Chart">${values.map((v, i) => {
            const bh = Math.max(4, (h - 26) * (v / top)), x = (i + 0.5) * (w / n) - bw / 2;
            return `<rect x="${x}" y="${h - 20 - bh}" width="${bw}" height="${bh}" rx="5" class="${i === n - 1 ? 'barhi' : 'bar'}"><title>${esc(labels[i])}: ${v}</title></rect>
                <text x="${x + bw / 2}" y="${h - 4}" class="ax" text-anchor="middle">${esc(labels[i])}</text>`;
        }).join('')}</svg>`;
    }
    function ring(pct) {
        const r = 40, c = 2 * Math.PI * r;
        return `<svg viewBox="0 0 110 110" class="ring" role="img" aria-label="${pct}%"><circle cx="55" cy="55" r="${r}" class="rb"/>
            <circle cx="55" cy="55" r="${r}" class="rf" stroke-dasharray="${(c * pct) / 100} ${c}" transform="rotate(-90 55 55)"/>
            <text x="55" y="61" text-anchor="middle" class="rt">${pct}%</text></svg>`;
    }
    const dow = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short' });
    const dm = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    /* ------------------------------------------------------------------- home */
    function notConfigured() {
        return `<div class="note"><b>The visitor counter isn't connected yet.</b> In Vercel → infonet-web → Storage, add <b>Upstash for Redis</b> (free) and connect it to this project. Numbers start the moment it's on.</div>`;
    }

    function renderHome() {
        const s = STATS;
        const main = $('#main');
        if (!s?.configured) { main.innerHTML = `<div class="mh"><h2>Overview</h2>${newBtn()}</div>${notConfigured()}<article class="card glass" id="checkCard" style="margin-top:14px;max-width:420px"></article>`; bindNew(); renderFloater(); return; }
        const d7 = s.days.slice(-7), d30 = s.days;
        const dev = s.devices.total, devT = (dev.mobile || 0) + (dev.tablet || 0) + (dev.desktop || 0);
        const mobPct = devT ? Math.round(((dev.mobile || 0) + (dev.tablet || 0)) / devT * 100) : 0;
        const conv = s.total.visitors ? Math.min(100, Math.round((s.total.whatsapp / s.total.visitors) * 100)) : 0;
        const inStock = (STOCK?.products || []).filter((p) => p.status !== 'sold');
        main.innerHTML = `
            <div class="mh"><h2>Overview</h2>${newBtn()}</div>
            <div class="cards3">
                <article class="card glass"><div class="ch"><span><span class="live-dot"></span>On the site now</span>${I.dots}</div>
                    <div class="big" id="liveNum">${num(s.live)}</div>
                    ${area(d7.map((x) => x.visitors), { h: 92, labels: d7.map((x) => dow(x.day)) })}</article>
                <article class="card glass"><div class="ch"><span>Visits today</span>${I.dots}</div>
                    <div class="big">${num(s.today.visits)} <small>${num(s.today.visitors)} people</small></div>
                    ${bars(d7.map((x) => x.visits), d7.map((x) => dow(x.day)))}</article>
                <article class="card glass"><div class="ch"><span>Visitors on a phone</span>${I.dots}</div>
                    <div class="split"><div><div class="big">${mobPct}%</div><p class="mini">${num(dev.mobile || 0)} phone · ${num(dev.tablet || 0)} tablet · ${num(dev.desktop || 0)} computer</p></div>${ring(mobPct)}</div></article>
            </div>
            <div class="two-col">
                <article class="card glass wide"><div class="ch"><span>WhatsApp chats started</span><span class="sel">All time</span></div>
                    <div class="rowb"><span>${num(s.total.whatsapp)} chats from ${num(s.total.visitors)} visitors</span><b>${conv}%</b></div>
                    <div class="phases">${['Visit', 'Browse', 'WhatsApp', 'Sale'].map((p, i) => `<i class="${i < 3 ? 'on' : ''}"></i>`).join('')}</div>
                    <div class="phl"><span>Visit</span><span>Browse</span><span>WhatsApp · ${num(s.today.whatsapp)} today</span><span>In the shop</span></div>
                </article>
                <article class="card glass floatcard" id="checkCard" aria-label="Setup checklist"></article>
                <article class="card glass wide"><div class="ch"><span>Visits, last 30 days</span><span class="sel">${num(s.total.visits)} all time</span></div>
                    ${area(d30.map((x) => x.visits), { h: 200, grid: true, labels: d30.map((x, i) => (i % 5 === 0 || i === 29 ? dm(x.day) : '')) })}</article>
            </div>
            <article class="card glass" style="margin-top:14px"><div class="ch"><span>In stock now · ${inStock.length}</span><button class="btn btn-ghost btn-sm" data-go="stock">Manage stock</button></div>
                <div class="strip">${inStock.slice(0, 6).map((p) => `<a href="/${p.section}/${p.slug}" target="_blank" rel="noopener"><img src="${esc(p.photos[0] ? `${p.photos[0].base}-640.${p.photos[0].ext}` : '')}" alt=""><span>${esc(p.name)}</span><b>${naira(Math.min(...p.options.map((o) => o.price)))}</b></a>`).join('') || '<p class="empty">Nothing in stock yet.</p>'}</div></article>`;
        bindNew(); renderFloater();
        $('[data-go]')?.addEventListener('click', () => go('stock'));
    }
    const newBtn = () => `<button class="btn btn-ghost btn-sm" id="newP">${I.plus} New product</button>`;
    const bindNew = () => $('#newP')?.addEventListener('click', () => editProduct(null));

    function startLive() {
        stopLive();
        liveTimer = setInterval(async () => {
            if (document.visibilityState !== 'visible') return;
            const s = await api('stats', {});
            if (!s.ok) return;
            STATS = s;
            const el = $('#liveNum'); if (el) el.textContent = num(s.live);
        }, 15000);
    }
    function stopLive() { clearInterval(liveTimer); }

    /* -------------------------------------------------------------- analytics */
    function list(pairs, fmt = (k) => k) {
        if (!pairs?.length) return '<p class="empty">No data yet.</p>';
        const top = Math.max(...pairs.map((p) => p[1]));
        return `<ul class="bars">${pairs.map(([k, v]) => `<li><span class="t">${esc(fmt(k))}</span><span class="n">${num(v)}</span><span class="b"><i style="width:${Math.max(3, (v / top) * 100)}%"></i></span></li>`).join('')}</ul>`;
    }
    function renderAnalytics() {
        const s = STATS, main = $('#main');
        if (!s?.configured) { main.innerHTML = `<div class="mh"><h2>Analytics</h2></div>${notConfigured()}`; return; }
        const devs = (o) => Object.entries(o || {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => [{ mobile: 'Phone', tablet: 'Tablet', desktop: 'Computer' }[k] || k, v]);
        main.innerHTML = `
            <div class="mh"><h2>Analytics</h2><span class="mini">Counting since ${esc(s.since ? dm(s.since) : 'today')} · refreshes every 15 s</span></div>
            <div class="kgrid">
                ${[['On the site now', s.live], ['Visits today', s.today.visits], ['Visitors today', s.today.visitors], ['WhatsApp today', s.today.whatsapp],
                   ['Total visits', s.total.visits], ['Total visitors', s.total.visitors], ['Total WhatsApp chats', s.total.whatsapp]].map(([k, v]) =>
                   `<article class="card glass kp"><span class="mini">${k}</span><b>${num(v)}</b></article>`).join('')}
            </div>
            <article class="card glass" style="margin-top:14px"><div class="ch"><span>Visits and visitors, last 30 days</span></div>
                ${area(s.days.map((x) => x.visits), { h: 220, grid: true, labels: s.days.map((x, i) => (i % 5 === 0 || i === 29 ? dm(x.day) : '')) })}</article>
            <div class="two-col">
                <article class="card glass"><div class="ch"><span>Top pages · today</span></div>${list(s.pages.today)}</article>
                <article class="card glass"><div class="ch"><span>Top pages · all time</span></div>${list(s.pages.total)}</article>
                <article class="card glass"><div class="ch"><span>Where visitors came from · all time</span></div>${list(s.sources.total)}</article>
                <article class="card glass"><div class="ch"><span>Devices · all time</span></div>${list(devs(s.devices.total))}</article>
                <article class="card glass"><div class="ch"><span>WhatsApp chats started from</span></div>${list(s.whatsappFrom, (k) => k.replace(/^\//, '/ ').replace(/[#:]/, ' · '))}</article>
            </div>
            <p class="mini" style="margin-top:14px">"On the site now" counts visitors whose page sent a heartbeat in the last 75 seconds. Bots and your own admin visits are not counted. For deeper reports, open <a href="https://vercel.com/infonet-computers/infonet-web/analytics" target="_blank" rel="noopener">Vercel Analytics</a>.</p>`;
    }

    /* ------------------------------------------------------------------ stock */
    function renderStock() {
        const main = $('#main');
        if (!STOCK) { main.innerHTML = `<div class="mh"><h2>Stock</h2></div><div class="note"><b>Saving to the website isn't connected yet.</b> Add GITHUB_TOKEN in Vercel (see the Setup checklist).</div>`; return; }
        main.innerHTML = `<div class="mh"><h2>Stock</h2>${newBtn()}</div>
            <p class="mini" style="margin:-6px 0 14px">Each product gets its own page and appears on /products. Changes go live about a minute after you save.</p>
            <div class="list">${STOCK.products.map((p) => `
                <article class="item glass">
                    <img src="${esc(p.photos[0] ? `${p.photos[0].base}-640.${p.photos[0].ext}` : '')}" alt="">
                    <div><div class="nm">${esc(p.name)} <span class="badge ${p.status === 'sold' ? 'sold' : 'in'}">${p.status === 'sold' ? 'Sold' : 'In stock'}</span></div>
                        <div class="meta">${esc(p.condition)} · ${p.options.map((o) => `${esc(o.label)} ${naira(o.price)}`).join(' · ')}</div>
                        <div class="meta">Updated ${esc(p.updated || '')} · <a href="/${p.section}/${p.slug}" target="_blank" rel="noopener">View page</a></div></div>
                    <div class="acts">
                        <button class="btn btn-ghost btn-sm" data-edit="${esc(p.slug)}">Edit</button>
                        <button class="btn btn-ghost btn-sm" data-sold="${esc(p.slug)}">${p.status === 'sold' ? 'Back in stock' : 'Mark sold'}</button>
                    </div>
                </article>`).join('') || '<p class="empty">No products yet. Add your first one.</p>'}</div>`;
        bindNew();
        $$('[data-edit]', main).forEach((b) => b.addEventListener('click', () => editProduct(b.dataset.edit)));
        $$('[data-sold]', main).forEach((b) => b.addEventListener('click', async () => {
            const p = STOCK.products.find((x) => x.slug === b.dataset.sold);
            b.disabled = true;
            const next = { ...p, status: p.status === 'sold' ? 'in_stock' : 'sold' };
            const j = await api('stock-save', { product: next, originalSlug: p.slug, blobs: {} });
            b.disabled = false;
            if (!j.ok) return toast(j.error, true);
            Object.assign(p, next);
            toast(next.status === 'sold' ? `${p.name} marked sold. Its page stays up and says so.` : `${p.name} is back in stock.`);
            renderStock(); renderSide();
        }));
    }

    const SPEC_TEMPLATE = ['Model', 'Condition', 'Processor', 'Memory', 'Storage', 'Screen', 'Operating system', 'Keyboard', 'Charging', 'Ports', 'In the box', 'Warranty'];

    function editProduct(slug) {
        const old = slug ? STOCK?.products.find((p) => p.slug === slug) : null;
        if (!STOCK) return toast('Saving to the website is not connected yet.', true);
        const p = old ? JSON.parse(JSON.stringify(old)) : {
            name: '', brand: '', section: 'laptops', condition: 'Direct UK', status: 'in_stock', summary: '', subcategory: 'Notebook Laptops',
            photos: [], option_label: 'RAM', options: [{ label: '8GB', price: '' }], highlights: [],
            specs: SPEC_TEMPLATE.map((k) => [k, k === 'Warranty' ? '30 days' : k === 'In the box' ? 'Original charger' : k === 'Condition' ? 'Direct UK' : '']),
            in_box: 'Original charger', warranty: '30 days', shops: 'Garrison or Choba Junction',
        };
        const blobs = {};
        go('stock');
        const main = $('#main');
        main.innerHTML = `<div class="mh"><h2>${old ? `Edit ${esc(old.name)}` : 'New product'}</h2>
            <button class="btn btn-ghost btn-sm" id="back" type="button">← Back to stock</button></div>
            <form class="form" id="pf" novalidate>
                <section class="card glass"><div class="ch"><span>Photos</span><span class="mini">The first is the cover. Square or portrait works best.</span></div>
                    <div class="photos" id="photos"></div></section>
                <section class="card glass">
                    <div class="cols">
                        <label><span>Name</span><input name="name" required maxlength="90" placeholder="HP EliteBook 840 G6" value="${esc(p.name)}"></label>
                        <label><span>Brand</span><input name="brand" maxlength="40" placeholder="HP" value="${esc(p.brand)}"></label>
                        <label><span>Condition</span><input name="condition" list="conds" maxlength="40" value="${esc(p.condition)}">
                            <datalist id="conds"><option>Direct UK</option><option>UK-used</option><option>Brand new</option><option>Refurbished</option></datalist></label>
                        <label><span>Status</span><select name="status"><option value="in_stock"${p.status !== 'sold' ? ' selected' : ''}>In stock</option><option value="sold"${p.status === 'sold' ? ' selected' : ''}>Sold</option></select></label>
                    </div>
                    <label style="display:block;margin-top:14px"><span>One-line summary</span><textarea name="summary" maxlength="300" placeholder="A slim, all-metal 14&quot; business laptop that…">${esc(p.summary)}</textarea></label>
                </section>
                <section class="card glass"><div class="ch"><span>Prices</span><label class="mini" style="display:flex;gap:8px;align-items:center">Options are for
                    <input name="option_label" value="${esc(p.option_label)}" maxlength="20" style="width:110px;min-height:36px;padding:6px 10px"></label></div>
                    <div id="opts"></div><button type="button" class="btn btn-ghost btn-sm" id="addOpt">${I.plus} Add an option</button></section>
                <section class="card glass"><div class="ch"><span>Key features</span><span class="mini">One per line — shown as ticks on the page</span></div>
                    <textarea name="highlights" placeholder="Intel Core i5, 8th Gen&#10;256GB SSD&#10;Backlit keyboard">${esc(p.highlights.join('\n'))}</textarea></section>
                <section class="card glass"><div class="ch"><span>Full specs</span><span class="mini">Leave a row empty to hide it</span></div>
                    <div id="specs"></div><button type="button" class="btn btn-ghost btn-sm" id="addSpec">${I.plus} Add a row</button></section>
                <section class="card glass"><div class="cols">
                    <label><span>In the box</span><input name="in_box" maxlength="120" value="${esc(p.in_box)}"></label>
                    <label><span>Warranty</span><input name="warranty" maxlength="40" value="${esc(p.warranty)}"></label>
                    <label><span>Where to test it</span><select name="shops">${['Garrison or Choba Junction', 'Choba Junction', 'Garrison'].map((s) => `<option${p.shops === s ? ' selected' : ''}>${s}</option>`).join('')}</select></label>
                </div></section>
                <div class="bar">
                    ${old ? '<button type="button" class="btn btn-danger" id="del">Delete</button>' : ''}
                    <button type="submit" class="btn btn-primary" id="save" style="width:auto;padding:0 56px 0 26px">${old ? 'Save changes' : 'Publish product'} <span class="go">${I.arrow}</span></button>
                </div>
            </form>`;
        $('#back').addEventListener('click', () => go('stock'));

        /* photos */
        const ph = $('#photos');
        const drawPhotos = () => {
            ph.innerHTML = p.photos.map((x, i) => `<figure class="ph">${i === 0 ? '<span class="first">Cover</span>' : ''}
                <img src="${esc(x.preview || `${x.base}-640.${x.ext}`)}" alt="">
                ${x.busy ? `<div class="busy">${esc(x.busy)}</div>` : `<div class="ctl"><button type="button" data-mv="${i}:-1" aria-label="Move left">‹</button>
                <button type="button" data-rm="${i}" aria-label="Remove">✕</button><button type="button" data-mv="${i}:1" aria-label="Move right">›</button></div>`}</figure>`).join('')
                + `<label class="drop" id="drop"><input type="file" accept="image/*" multiple hidden id="file">${I.plus}<br>Add photos<br><span class="mini">or drop them here</span></label>`;
            $$('[data-mv]', ph).forEach((b) => b.addEventListener('click', () => {
                const [i, d] = b.dataset.mv.split(':').map(Number), j = i + d;
                if (j < 0 || j >= p.photos.length) return;
                [p.photos[i], p.photos[j]] = [p.photos[j], p.photos[i]]; drawPhotos();
            }));
            $$('[data-rm]', ph).forEach((b) => b.addEventListener('click', () => { p.photos.splice(Number(b.dataset.rm), 1); drawPhotos(); }));
            $('#file').addEventListener('change', (e) => addFiles([...e.target.files]));
            const drop = $('#drop');
            ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('on'); }));
            ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('on'); }));
            drop.addEventListener('drop', (e) => addFiles([...e.dataTransfer.files].filter((f) => f.type.startsWith('image/'))));
        };
        const addFiles = async (files) => {
            for (const f of files.slice(0, 12 - p.photos.length)) {
                const entry = { preview: URL.createObjectURL(f), busy: 'Preparing…', alt: '' };
                p.photos.push(entry); drawPhotos();
                try {
                    const out = await resize(f);
                    entry.busy = 'Uploading…'; drawPhotos();
                    const j = await api('photo-upload', { slug: $('#pf').name.value || 'product', ext: out.ext, w640: out.w640, w1080: out.w1080 });
                    if (!j.ok) throw new Error(j.error);
                    Object.assign(entry, j.photo); Object.assign(blobs, j.blobs); delete entry.busy;
                } catch (e) { p.photos.splice(p.photos.indexOf(entry), 1); toast(e.message || 'That photo could not be added.', true); }
                drawPhotos();
            }
        };
        drawPhotos();

        /* options + specs */
        const drawOpts = () => {
            $('#opts').innerHTML = p.options.map((o, i) => `<div class="optrow"><input placeholder="e.g. 8GB" value="${esc(o.label)}" data-o="${i}:label" maxlength="30">
                <input placeholder="Price, e.g. 375000" inputmode="numeric" value="${esc(o.price)}" data-o="${i}:price"><button type="button" class="x" data-ro="${i}" aria-label="Remove option">✕</button></div>`).join('');
            $$('[data-o]').forEach((el) => el.addEventListener('input', () => { const [i, k] = el.dataset.o.split(':'); p.options[i][k] = el.value; }));
            $$('[data-ro]').forEach((b) => b.addEventListener('click', () => { p.options.splice(Number(b.dataset.ro), 1); drawOpts(); }));
        };
        const drawSpecs = () => {
            $('#specs').innerHTML = p.specs.map((s, i) => `<div class="specrow"><input placeholder="e.g. Processor" value="${esc(s[0])}" data-s="${i}:0" maxlength="40">
                <input placeholder="${esc(s[0] ? `${s[0]}…` : 'Value')}" value="${esc(s[1])}" data-s="${i}:1" maxlength="200"><button type="button" class="x" data-rs="${i}" aria-label="Remove row">✕</button></div>`).join('');
            $$('[data-s]').forEach((el) => el.addEventListener('input', () => { const [i, k] = el.dataset.s.split(':'); p.specs[i][k] = el.value; }));
            $$('[data-rs]').forEach((b) => b.addEventListener('click', () => { p.specs.splice(Number(b.dataset.rs), 1); drawSpecs(); }));
        };
        drawOpts(); drawSpecs();
        $('#addOpt').addEventListener('click', () => { p.options.push({ label: '', price: '' }); drawOpts(); });
        $('#addSpec').addEventListener('click', () => { p.specs.push(['', '']); drawSpecs(); });

        /* save / delete */
        $('#pf').addEventListener('submit', async (e) => {
            e.preventDefault();
            if (p.photos.some((x) => x.busy)) return toast('Wait for the photos to finish uploading.', true);
            const f = e.currentTarget;
            const out = {
                ...p, name: f.name.value, brand: f.brand.value, condition: f.condition.value, status: f.status.value,
                summary: f.summary.value, option_label: f.option_label.value, in_box: f.in_box.value, warranty: f.warranty.value, shops: f.shops.value,
                highlights: f.highlights.value.split('\n').map((s) => s.trim()).filter(Boolean),
                photos: p.photos.map(({ base, ext }, i) => ({ base, ext, alt: `${f.name.value} — photo ${i + 1}` })),
            };
            const btn = $('#save'); btn.disabled = true; btn.firstChild.textContent = 'Saving… ';
            const j = await api('stock-save', { product: out, originalSlug: old?.slug, blobs });
            btn.disabled = false; btn.firstChild.textContent = old ? 'Save changes ' : 'Publish product ';
            if (!j.ok) return toast(j.error, true);
            const sk = await api('stock-get', {}); if (sk.ok) STOCK = sk.stock;
            toast(`Saved. Live at infonet.ng${j.url} in about a minute.`);
            renderSide(); go('stock');
        });
        $('#del')?.addEventListener('click', async () => {
            if (!confirm(`Delete ${old.name}? Its page goes too. To keep the page up, mark it sold instead.`)) return;
            const j = await api('stock-save', { delete: old.slug });
            if (!j.ok) return toast(j.error, true);
            STOCK.products = STOCK.products.filter((x) => x.slug !== old.slug);
            toast(`${old.name} removed.`); renderSide(); go('stock');
        });
    }

    // Centre-crop to 4:5, then 640 and 1080 wide. WebP where the browser can encode it
    // (Chrome, Edge, Android); iPhone Safari falls back to JPEG.
    async function resize(file) {
        const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('That file is not a photo we can read.')); i.src = URL.createObjectURL(file); });
        const ratio = 4 / 5, iw = img.naturalWidth, ih = img.naturalHeight;
        let sw = iw, sh = iw / ratio; if (sh > ih) { sh = ih; sw = ih * ratio; }
        const sx = (iw - sw) / 2, sy = (ih - sh) / 2;
        const enc = async (w) => {
            const c = document.createElement('canvas'); c.width = w; c.height = Math.round(w / ratio);
            const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
            let blob = await new Promise((r) => c.toBlob(r, 'image/webp', 0.8));
            let ext = 'webp';
            if (!blob || blob.type !== 'image/webp') { blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.84)); ext = 'jpg'; }
            const b64 = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1]); fr.readAsDataURL(blob); });
            return { b64, ext };
        };
        const a = await enc(640), b = await enc(1080);
        return { ext: a.ext === 'webp' && b.ext === 'webp' ? 'webp' : 'jpg', w640: a.ext === b.ext ? a.b64 : (await enc(640)).b64, w1080: b.b64 };
    }

    /* --------------------------------------------------------------- security */
    async function renderSecurity() {
        const main = $('#main');
        const se = await api('security', {}); if (se.ok) SEC = se;
        const r = STATUS.ready || {};
        main.innerHTML = `<div class="mh"><h2>Security</h2></div>
            <div class="two-col">
                <article class="card glass"><div class="ch"><span>Google Authenticator</span><span class="badge ${SEC?.totp ? 'in' : 'sold'}">${SEC?.totp ? 'On' : 'Off'}</span></div>
                    <p class="mini">Asked for after your password or Google sign-in. Recovery codes left: <b>${SEC?.recoveryLeft ?? 0}</b> of 8.</p>
                    <div class="btnrow"><button class="btn btn-ghost btn-sm" id="newRc">Make new recovery codes</button></div></article>
                <article class="card glass"><div class="ch"><span>Fingerprint &amp; face sign-in</span><span class="badge ${SEC?.passkeys?.length ? 'in' : 'sold'}">${SEC?.passkeys?.length || 0} device(s)</span></div>
                    <ul class="pk">${(SEC?.passkeys || []).map((k) => `<li><span><b>${esc(k.name)}</b><span class="mini">Added ${esc(dm(k.created.slice(0, 10)))}${k.lastUsed ? ` · last used ${ago(k.lastUsed)}` : ''}</span></span>
                        <button class="btn btn-danger btn-sm" data-rmpk="${esc(k.id)}">Remove</button></li>`).join('') || '<li class="empty">None yet.</li>'}</ul>
                    <div class="btnrow">${passkeysSupported() ? '<button class="btn btn-ghost btn-sm" id="addPk">Add this device</button>' : '<span class="mini">This browser cannot use fingerprint sign-in.</span>'}</div>
                    <p class="msg" id="pkMsg"></p></article>
                <article class="card glass"><div class="ch"><span>Sign in with Google</span><span class="badge ${r.google ? 'in' : 'sold'}">${r.google ? 'Connected' : 'Not set up'}</span></div>
                    <p class="mini">${r.google ? 'Only the Google account in ADMIN_GOOGLE_EMAIL can sign in. The Authenticator code is still asked for after it.' : 'Needs GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and ADMIN_GOOGLE_EMAIL in Vercel.'}</p></article>
                <article class="card glass"><div class="ch"><span>Devices signed in</span></div>
                    <p class="mini">Lost a phone or laptop that was signed in? This signs out every device, this one included.</p>
                    <div class="btnrow"><button class="btn btn-danger btn-sm" id="outAll">Sign out everywhere</button></div></article>
            </div>`;
        $('#addPk')?.addEventListener('click', async () => { if (await addPasskey($('#pkMsg'))) { renderSecurity(); renderFloater(); } });
        $$('[data-rmpk]').forEach((b) => b.addEventListener('click', async () => {
            if (!confirm('Remove fingerprint sign-in for this device?')) return;
            await api('passkey-remove', { id: b.dataset.rmpk }); renderSecurity(); renderFloater();
        }));
        $('#newRc').addEventListener('click', async () => {
            const code = prompt('Enter a current Google Authenticator code:');
            if (!code) return;
            const j = await api('recovery-new', { code: code.trim() });
            if (!j.ok) return toast(j.error, true);
            showRecovery(j.recoveryCodes, false);
        });
        $('#outAll').addEventListener('click', async () => {
            if (!confirm('Sign out on every device?')) return;
            await api('logout-all', {}); location.href = '/admin';
        });
    }

    /* ------------------------------------------------------------------- boot */
    async function boot() {
        const j = await api('status');
        STATUS = j.ok ? j : { ready: {} };
        await resolveLoader();
        const err = params.get('error'), step = params.get('step');
        if (!STATUS.ready?.password) return authShell(`<div class="tile">${MARK}</div><h1>Admin is not switched on</h1>
            <p class="sub">One setting in Vercel</p><p style="color:var(--muted);font-size:14px">Add <b>ADMIN_PASSWORD</b> (10+ characters) in Vercel → infonet-web → Settings → Environment Variables, and connect the <b>Upstash for Redis</b> store. Then redeploy.</p>`);
        if (!STATUS.ready?.redis) return authShell(`<div class="tile">${MARK}</div><h1>One more step</h1><p class="sub">Connect the Redis store</p>
            <p style="color:var(--muted);font-size:14px">The sign-in codes and visitor counter are kept in a small Redis store. In Vercel → infonet-web → Storage, add <b>Upstash for Redis</b> and connect it, then redeploy.</p>`);
        if (STATUS.signedIn) return enter();
        if (STATUS.setupOnly || step === 'setup') return showSetup();
        if (step === 'totp') return showTotp();
        showLogin(err ? (err === 'google-not-set-up' ? 'Google sign-in is not set up yet.' : err) : '');
    }
    boot();
})();
