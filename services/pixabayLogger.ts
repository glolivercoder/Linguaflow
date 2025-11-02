interface PixabayLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: Record<string, unknown>;
}

const pixabayLogs: PixabayLogEntry[] = [];

const formatEntry = (entry: PixabayLogEntry): string => {
  const detailString = entry.details ? ` ${JSON.stringify(entry.details)}` : '';
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${detailString}`;
};

export const addPixabayLog = (level: PixabayLogEntry['level'], message: string, details?: Record<string, unknown>) => {
  const entry: PixabayLogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    details,
  };
  pixabayLogs.push(entry);
};

export const getPixabayLogs = (): string => {
  if (pixabayLogs.length === 0) {
    return 'No Pixabay logs recorded.';
  }
  return pixabayLogs.map(formatEntry).join('\n');
};

export const clearPixabayLogs = () => {
  pixabayLogs.length = 0;
};

export const downloadPixabayLogs = () => {
  try {
    const content = getPixabayLogs();
    console.log('[PixabayLogger] Preparing download. Content length:', content.length);
    
    // Create blob with explicit text/plain type
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    console.log('[PixabayLogger] Blob created. Size:', blob.size, 'bytes');
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'PIXABAY_logs.txt';
    anchor.style.display = 'none';
    
    // Trigger download
    document.body.appendChild(anchor);
    console.log('[PixabayLogger] Triggering download...');
    anchor.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      console.log('[PixabayLogger] Download cleanup completed');
    }, 100);
    
    alert(`Download iniciado: PIXABAY_logs.txt (${blob.size} bytes)\nVerifique sua pasta de Downloads.`);
  } catch (error) {
    console.error('[PixabayLogger] Download failed:', error);
    alert('Erro ao baixar logs. Verifique o console para detalhes.');
  }
};
