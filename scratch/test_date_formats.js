const formatLocalTime = (isoString) => {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      console.log(`Failed to parse: ${isoString}`);
      return 'Invalid Date';
    }
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  } catch (e) {
    console.error(e);
    return 'Error';
  }
};

const s1 = "2026-07-10 06:11:09+00";
const s2 = "2026-07-10T06:11:09+00:00";
const s3 = "2026-07-10T06:11:09.000Z";

console.log(`s1: ${formatLocalTime(s1)}`);
console.log(`s2: ${formatLocalTime(s2)}`);
console.log(`s3: ${formatLocalTime(s3)}`);
