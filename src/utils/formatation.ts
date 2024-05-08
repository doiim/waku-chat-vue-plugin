export const formatTimestamp = (timestamp: number) => {
    const now = new Date();
    const messageDate = new Date(timestamp);

    if (now.toDateString() === messageDate.toDateString()) return (new Date(timestamp)).toLocaleTimeString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (yesterday.toDateString() === messageDate.toDateString()) return 'Yesterday';

    const seconds = Math.floor((now.getTime() - timestamp) / 1000);

    if (seconds < (86400 * 7)) return `${Math.floor(seconds / 86400)} day${seconds < 86400 * 2 ? '' : 's'} ago`;
    if (seconds < (86400 * 30)) return `${Math.floor(seconds / (86400 * 7))} week${seconds < (86400 * 7) * 2 ? '' : 's'} ago`;
    if (seconds < (86400 * 365)) return `${Math.floor(seconds / (86400 * 30))} month${seconds < (86400 * 30) * 2 ? '' : 's'} ago`;

    return `${Math.floor(seconds / (86400 * 365))} year${seconds < (86400 * 365) * 2 ? '' : 's'} ago`;
}