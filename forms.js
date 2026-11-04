// forms.js — the /repair and /swap forms, and the "today" row on the shop pages.
// Each form writes a WhatsApp message and opens it; nothing is sent to our server.
(function () {
    'use strict';

    const WA = 'https://wa.me/2349056467027?text=';
    const $ = (id) => document.getElementById(id);
    const checked = (form, name) =>
        [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((i) => i.value);
    const val = (id) => ($(id)?.value || '').trim();

    // window.open must run synchronously inside the submit/click handler, or popup
    // blockers swallow it. Fall back to same-tab navigation if it is blocked anyway.
    function openWhatsApp(source, text) {
        if (window.infonetWA) window.infonetWA(source, text);
        const url = WA + encodeURIComponent(text);
        const w = window.open(url, '_blank', 'noopener');
        if (!w) window.location.href = url;
    }

    /* ------------------------------------------------------------ repair quote */
    const repair = $('repairForm');
    if (repair) {
        const shops = JSON.parse(repair.dataset.shops || '{}');
        const shopNote = $('rqShopNote');
        const shopInput = (v) => repair.querySelector(`input[name="shop"][value="${v}"]`);

        const sync = () => {
            const device = checked(repair, 'device')[0];
            repair.querySelectorAll('[data-faults-for]').forEach((g) => {
                const on = g.dataset.faultsFor === device;
                g.hidden = !on;
                // a hidden group's ticks must not leak into the message
                if (!on) g.querySelectorAll('input').forEach((i) => { i.checked = false; });
            });
            const ok = shops[device] || ['Choba'];
            const garrison = shopInput('Garrison');
            garrison.disabled = !ok.includes('Garrison');
            if (garrison.disabled && garrison.checked) shopInput('Choba').checked = true;
            shopNote.textContent = garrison.disabled
                ? `${device === 'Phone' ? 'Phone' : 'Desktop'} repairs are done at our Choba Junction shop.`
                : 'Both shops repair these — pick the one closer to you.';
            $('rqTimeNote').classList.toggle('hidden', device !== 'Inverter or UPS');
        };
        repair.addEventListener('change', (e) => {
            if (e.target.name === 'device') sync();
            if (e.target.name === 'fault') $('rqFaultError').classList.add('hidden');
        });
        sync();

        repair.addEventListener('submit', (e) => {
            e.preventDefault();
            const device = checked(repair, 'device')[0];
            const faults = checked(repair, 'fault');
            if (!faults.length) {
                $('rqFaultError').classList.remove('hidden');
                repair.querySelector(`[data-faults-for="${device}"] input`)?.focus();
                return;
            }
            const shop = checked(repair, 'shop')[0] === 'Garrison'
                ? 'Garrison (6 Aguma St)' : 'Choba Junction (Shop 59, Everyday Supermarket Plaza)';
            const model = val('rqModel');
            const lines = [
                'Hello Infonet, I would like a repair quote.',
                '',
                `Device: ${device}${model ? ` — ${model}` : ''}`,
                `Problem: ${faults.join(', ')}`,
            ];
            if (val('rqDetails')) lines.push(`Details: ${val('rqDetails')}`);
            lines.push(`Shop: ${shop}`);
            if (val('rqName')) lines.push(`Name: ${val('rqName')}`);
            openWhatsApp('repair-form', lines.join('\n'));
        });
    }

    /* ------------------------------------------------------------------ swap */
    const swap = $('swapForm');
    if (swap) {
        const fill = () => {
            const list = $('swModels');
            const recs = window.InfonetPhones?.records;
            if (!list || !recs || list.options.length) return;
            list.innerHTML = recs.map((r) => `<option value="${r.name.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">`).join('');
        };
        // phones.js is deferred too and runs first (it is listed first), but be safe.
        if (window.InfonetPhones) fill(); else window.addEventListener('load', fill);

        const sync = () => {
            const phoneish = ['Phone', 'Tablet'].includes(checked(swap, 'have')[0]);
            swap.querySelectorAll('[data-phone-only]').forEach((el) => { el.hidden = !phoneish; });
        };
        swap.addEventListener('change', (e) => { if (e.target.name === 'have') sync(); });
        sync();

        swap.addEventListener('input', (e) => {
            if (e.target.id === 'swModel') $('swModelError').classList.add('hidden');
            if (e.target.id === 'swWant') $('swWantError').classList.add('hidden');
        });

        swap.addEventListener('submit', (e) => {
            e.preventDefault();
            const model = val('swModel'), want = val('swWant');
            if (!model) { $('swModelError').classList.remove('hidden'); $('swModel').focus(); return; }
            if (!want) { $('swWantError').classList.remove('hidden'); $('swWant').focus(); return; }
            const have = checked(swap, 'have')[0];
            const storage = val('swStorage');
            const lines = [
                'Hello Infonet, I would like to swap my device.',
                '',
                `I have: ${have} — ${model}${storage ? `, ${storage}` : ''}`,
                `Condition: ${checked(swap, 'cond')[0] || 'Not sure'}`,
            ];
            if (['Phone', 'Tablet'].includes(have) && val('swBattery')) lines.push(`Battery health: ${val('swBattery')}`);
            const extras = checked(swap, 'extras');
            lines.push(`Comes with: ${extras.length ? extras.join(' and ') : 'Device only'}`);
            lines.push('', `I want: ${want}`);
            lines.push(`Shop: ${checked(swap, 'swshop')[0] === 'Garrison' ? 'Garrison (6 Aguma St)' : 'Choba Junction (Shop 59, Everyday Supermarket Plaza)'}`);
            if (val('swName')) lines.push(`Name: ${val('swName')}`);
            lines.push('', 'What can you offer for mine?');
            openWhatsApp('swap-form', lines.join('\n'));
        });
    }

    /* ------------------------------------------- shop pages: highlight today */
    // The table lists Monday first; getDay() counts from Sunday. Africa/Lagos has no DST,
    // and the visitor is almost always in it, so local time is good enough.
    const today = (new Date().getDay() + 6) % 7;
    document.querySelectorAll(`tr[data-day="${today}"]`).forEach((tr) => {
        tr.classList.add('bg-white', 'font-semibold');
        tr.firstElementChild.insertAdjacentHTML('beforeend',
            ' <span class="ml-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">Today</span>');
    });
})();
