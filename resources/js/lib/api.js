/**
 * Klien HTTP tipis untuk API Laravel (session cookie + CSRF).
 *  - Laravel menaruh cookie XSRF-TOKEN; kita kirim balik lewat header X-XSRF-TOKEN.
 *  - Semua kegagalan dilempar sebagai ApiError dengan pesan berbahasa Indonesia.
 */
export class ApiError extends Error {
    constructor(message, status = 0, errors = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.errors = errors; // { field: ['pesan', ...] } dari validasi 422
    }

    first(field) {
        return this.errors?.[field]?.[0];
    }
}

const unauthorizedHandlers = new Set();

/** Daftarkan callback yang dipanggil saat server menjawab 401 (sesi habis). */
export function onUnauthorized(handler) {
    unauthorizedHandlers.add(handler);
    return () => unauthorizedHandlers.delete(handler);
}

const GENERIC = {
    401: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
    403: 'Anda tidak memiliki akses untuk tindakan ini.',
    404: 'Data tidak ditemukan. Mungkin sudah dihapus atau belum diterbitkan.',
    413: 'Ukuran file melebihi batas yang diizinkan server.',
    419: 'Sesi Anda kedaluwarsa. Muat ulang halaman lalu coba lagi.',
    429: 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.',
};

function messageFor(status, body) {
    if (status === 422 && body?.errors) {
        const first = Object.values(body.errors)[0]?.[0];
        if (first) return first;
    }
    return GENERIC[status] ?? body?.message ?? 'Terjadi kesalahan pada server. Coba lagi beberapa saat.';
}

export function xsrfToken() {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Buka wrapper { data: ... } bawaan Laravel Resource jika bukan response pagination (meta/links).
 */
function unwrap(payload) {
    if (
        payload &&
        typeof payload === 'object' &&
        !Array.isArray(payload) &&
        'data' in payload &&
        !('meta' in payload) &&
        !('links' in payload)
    ) {
        return payload.data;
    }
    return payload;
}

async function request(method, path, { body, signal } = {}) {
    const headers = { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
    const token = xsrfToken();
    if (token) headers['X-XSRF-TOKEN'] = token;

    let payload;
    if (body instanceof FormData) {
        payload = body;
    } else if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
        payload = JSON.stringify(body);
    }

    let response;
    try {
        response = await fetch(`/api${path}`, {
            method,
            headers,
            body: payload,
            signal,
            credentials: 'same-origin',
        });
    } catch (error) {
        if (error.name === 'AbortError') throw error;
        throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi Anda.');
    }

    if (response.status === 204) return null;

    let data = null;
    try {
        data = await response.json();
    } catch {
        /* body kosong / bukan JSON */
    }

    if (!response.ok) {
        if (response.status === 401 && path !== '/me' && !path.startsWith('/login')) {
            unauthorizedHandlers.forEach((handler) => handler());
        }
        throw new ApiError(messageFor(response.status, data), response.status, data?.errors ?? {});
    }

    return unwrap(data);
}

export const api = {
    get: (path, options) => request('GET', path, options),
    post: (path, body, options) => request('POST', path, { ...options, body }),
    put: (path, body, options) => request('PUT', path, { ...options, body }),
    delete: (path, options) => request('DELETE', path, options),
};

/**
 * Unggah video dengan progress (XMLHttpRequest, karena fetch belum mendukung upload progress).
 * Mengembalikan lesson (JSON) saat sukses. Bisa dibatalkan lewat AbortSignal.
 */
export function uploadVideo(lessonId, file, { onProgress, signal } = {}) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/admin/lessons/${lessonId}/video`);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        const token = xsrfToken();
        if (token) xhr.setRequestHeader('X-XSRF-TOKEN', token);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
        };

        xhr.onload = () => {
            let data = null;
            try {
                data = JSON.parse(xhr.responseText);
            } catch {
                /* bukan JSON */
            }

            if (xhr.status >= 200 && xhr.status < 300) return resolve(unwrap(data));

            const message =
                data?.errors?.video?.[0] ??
                (xhr.status === 500 ? data?.message : null) ??
                GENERIC[xhr.status] ??
                data?.message ??
                'Unggahan gagal. Coba lagi.';
            reject(new ApiError(message, xhr.status, data?.errors ?? {}));
        };

        xhr.onerror = () => reject(new ApiError('Koneksi terputus saat mengunggah. Periksa jaringan lalu coba lagi.'));
        xhr.onabort = () => reject(Object.assign(new ApiError('Unggahan dibatalkan.'), { aborted: true }));

        if (signal) {
            if (signal.aborted) return xhr.abort();
            signal.addEventListener('abort', () => xhr.abort(), { once: true });
        }

        const form = new FormData();
        form.append('video', file);
        xhr.send(form);
    });
}