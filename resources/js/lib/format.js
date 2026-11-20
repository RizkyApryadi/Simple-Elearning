const dateFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

export function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : dateFormatter.format(date);
}

export function formatBytes(bytes) {
    if (bytes == null) return '';
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB'];
    let value = bytes / 1024;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }
    return `${value.toFixed(value >= 10 ? 0 : 1).replace('.', ',')} ${units[unit]}`;
}

/** Inisial untuk sampul kursus: "Dasar Laravel untuk Pemula" -> "DL" */
export function initials(title = '') {
    const words = title.split(/\s+/).filter((word) => word.length > 2 || /^[A-Z]/.test(word));
    return (words.slice(0, 2).map((word) => word[0]).join('') || title.slice(0, 2)).toUpperCase();
}

export function homeFor(user) {
    if (!user) return '/login';
    return user.role === 'admin' ? '/admin/courses' : '/courses';
}

export function moveItem(list, from, to) {
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
}
