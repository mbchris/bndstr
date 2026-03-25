export const useIcalExport = () => {
    const exportEventToIcal = (event: {
      id: number;
      type: string;
      title?: string;
      startTime: number;
      endTime: number;
      description?: string | null;
      tentative?: boolean;
    }, siteUrl: string) => {
      // Format date for iCal (YYYYMMDDTHHMMSSZ) strictly in UTC
      const formatDate = (timestamp: number) => {
        const d = new Date(timestamp);
        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };
  
      const dtStamp = formatDate(Date.now());
      const dtStart = formatDate(event.startTime);
      const dtEnd = formatDate(event.endTime);
      
      const summary = event.title || event.type + (event.tentative ? ' (Tentative)' : '');
      const description = event.description || '';
      
      // Escape special characters for iCal
      const escapeIcsText = (str: string) => {
        return str.replace(/\\/g, '\\\\')
                  .replace(/;/g, '\\;')
                  .replace(/,/g, '\\,')
                  .replace(/\n/g, '\\n');
      };
  
      const icalContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//bndstr//NONSGML v1.0//EN',
        'BEGIN:VEVENT',
        `UID:${event.id}@${new URL(siteUrl).hostname}`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${escapeIcsText(summary)}`,
        `DESCRIPTION:${escapeIcsText(description)}`,
        event.tentative ? 'STATUS:TENTATIVE' : 'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');
  
      if (import.meta.client) {
          const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `${summary.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
    };
  
    return { exportEventToIcal };
  };
  
