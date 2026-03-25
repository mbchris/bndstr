export const useFormatDate = () => {
  const { dateLocale } = useI18n();

  const formatDate = (date: string | number | Date) => {
    if (!date) return '';
    const d = new Date(date);
    const locale = dateLocale.value;
    const datePart = d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
    const weekdayPart = d.toLocaleDateString(locale, { weekday: 'long' });
    return `${datePart} (${weekdayPart})`;
  };

  const formatTime = (date: string | number | Date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString(dateLocale.value, { hour: '2-digit', minute: '2-digit' });
  };

  return {
    formatDate,
    formatTime
  };
};
