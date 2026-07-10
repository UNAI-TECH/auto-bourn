const formatLocalTime = (isoString) => {
  return new Date(isoString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

const formatLocalTimeIST = (isoString) => {
  return new Date(isoString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });
};

const t1 = "2026-07-10T11:41:09+00:00"; // Kamalesh In
const t2 = "2026-07-10T15:00:52+00:00"; // Kamalesh Out
const t3 = "2026-07-10T13:16:34+00:00"; // Sadhana In
const t4 = "2026-07-10T13:33:57+00:00"; // Sadhana Out

console.log("Browser Local Time (Current Node process):");
console.log(`t1: ${formatLocalTime(t1)}`);
console.log(`t2: ${formatLocalTime(t2)}`);
console.log(`t3: ${formatLocalTime(t3)}`);
console.log(`t4: ${formatLocalTime(t4)}`);

console.log("\nForce IST Time:");
console.log(`t1: ${formatLocalTimeIST(t1)}`);
console.log(`t2: ${formatLocalTimeIST(t2)}`);
console.log(`t3: ${formatLocalTimeIST(t3)}`);
console.log(`t4: ${formatLocalTimeIST(t4)}`);
