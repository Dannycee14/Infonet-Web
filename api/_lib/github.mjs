/* Commit files to the site's GitHub repo. Vercel deploys main on every commit, so a save
   from /admin is live about a minute later. Needs GITHUB_TOKEN: a fine-grained token for
   Dannycee14/Infonet-Web only, with Contents: Read and write. GITHUB_API_URL is for tests. */

const API = process.env.GITHUB_API_URL || 'https://api.github.com';
export const REPO = process.env.GITHUB_REPO || 'Dannycee14/Infonet-Web';
const BRANCH = process.env.GITHUB_BRANCH || 'main';

export const githubReady = () => Boolean(process.env.GITHUB_TOKEN);

async function gh(path, opts = {}) {
    const r = await fetch(`${API}/repos/${REPO}${path}`, {
        ...opts,
        headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'infonet-admin', ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
        },
    });
    if (!r.ok) {
        const t = await r.text().catch(() => '');
        const e = new Error(`github ${r.status}: ${t.slice(0, 160)}`); e.status = r.status; throw e;
    }
    return r.status === 204 ? null : r.json();
}

// Read a text file at the tip of main.
export async function readFile(path) {
    const f = await gh(`/contents/${encodeURI(path)}?ref=${BRANCH}`);
    if (f.content) return Buffer.from(f.content, 'base64').toString('utf8');
    const blob = await gh(`/git/blobs/${f.sha}`);       // files over 1 MB come back empty
    return Buffer.from(blob.content, 'base64').toString('utf8');
}

// Upload binary content ahead of the commit; returns the blob sha to reference later.
export async function uploadBlob(base64) {
    const b = await gh('/git/blobs', { method: 'POST', body: JSON.stringify({ content: base64, encoding: 'base64' }) });
    return b.sha;
}

/* One commit with every change. files: [{ path, content } | { path, sha } | { path, delete: true }].
   build(readFile) is called fresh on each attempt, so a concurrent commit is never overwritten. */
export async function commit(message, build) {
    for (let attempt = 0; attempt < 3; attempt++) {
        const ref = await gh(`/git/ref/heads/${BRANCH}`);
        const head = await gh(`/git/commits/${ref.object.sha}`);
        const files = await build();
        const tree = files.map((f) => f.delete
            ? { path: f.path, mode: '100644', type: 'blob', sha: null }
            : f.sha ? { path: f.path, mode: '100644', type: 'blob', sha: f.sha }
                : { path: f.path, mode: '100644', type: 'blob', content: f.content });
        const t = await gh('/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: head.tree.sha, tree }) });
        const c = await gh('/git/commits', { method: 'POST', body: JSON.stringify({
            message: typeof message === 'function' ? message() : message, tree: t.sha, parents: [ref.object.sha],
        }) });
        try {
            await gh(`/git/refs/heads/${BRANCH}`, { method: 'PATCH', body: JSON.stringify({ sha: c.sha, force: false }) });
            return c.sha;
        } catch (e) {
            if (e.status !== 422 || attempt === 2) throw e;   // someone pushed meanwhile: rebuild on the new tip
        }
    }
}
