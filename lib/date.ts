export function formatDateUTCEnUS(input: string | number | Date): string {
  const date = new Date(input);
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${fmt.format(date)} UTC`;
  } catch {
    // Fallback that is still stable and UTC-based
    const iso = date.toISOString();
    return `${iso.slice(0, 16).replace('T', ' ')} UTC`;
  }
}

