export function formatDate(dateStr: string) {
  if (!dateStr || !dateStr.includes('.')) return dateStr;
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    if (!isNaN(date.getTime())) {
      const monthStr = date.toLocaleString('en-US', { month: 'short' });
      return `${y} ${monthStr} ${parseInt(d)}`;
    }
  }
  return dateStr;
}
