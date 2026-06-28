import { useEffect, useState } from "react";

function getTimeLeft(date) {
  const diff = new Date(date).getTime() - Date.now();
  if (diff <= 0) return "Bloqueado";

  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function CountdownTimer({ date }) {
  const [value, setValue] = useState(() => getTimeLeft(date));

  useEffect(() => {
    const interval = window.setInterval(() => setValue(getTimeLeft(date)), 30000);
    return () => window.clearInterval(interval);
  }, [date]);

  return <span className="countdown">{value}</span>;
}
