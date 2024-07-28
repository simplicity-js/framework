module.exports = {
  parseTimestamp,
};


function parseTimestamp(timestamp) {
  let hour;
  const result = {};

  // Get hours from milliseconds
  const hours = timestamp / (60 * 60 * 1000);

  hour = Math.floor(hours);

  // Get remainder from hours and convert to minutes
  const minutes = (hours - hour) * 60;
  const minute = Math.floor(minutes);

  // Get remainder from minutes and convert to seconds
  const seconds = (minutes - minute) * 60;
  const second = Math.floor(seconds);

  if(hour > 24) {
    result.days = Math.floor(hour / 24);
    hour = hour % 24;
  }

  if(hour) {
    result.hours = hour;
  }

  if(minute) {
    result.minutes = minute;
  }

  if(second) {
    result.seconds = second;
  }

  return result;
}
