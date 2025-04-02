let seconds;
let minutes;
let hours;
let timer;

function updateTimer() {
  if (seconds === 0 && minutes === 0 && hours === 0) {
    clearInterval(timer);
    alert('¡Huevito listo! ¡Sacalo rápido! \n(o se convertira en otro tipo de huevito)');
  } else {
    if (seconds === 0) {
      seconds = 59;
      if (minutes === 0) {
        minutes = 59;
        hours--;
      } else {
        minutes--;
      }
    } else {
      seconds--;
    }
  }

  document.getElementById('timer').innerText =
    (hours < 10 ? '0' : '') + hours + ':' +
    (minutes < 10 ? '0' : '') + minutes + ':' +
    (seconds < 10 ? '0' : '') + seconds;
}

function startTimer(startHours, startMinutes, startSeconds) {
  hours = startHours;
  minutes = startMinutes;
  seconds = startSeconds;
  timer = setInterval(updateTimer, 1000);
} 

function pauseTimer() {
    clearInterval(timer);
  }
  
  function resetTimer(startHours, startMinutes, startSeconds) {
    clearInterval(timer);
    hours = startHours;
    minutes = startMinutes;
    seconds = startSeconds;
    document.getElementById('timer').innerText =
      (hours < 10 ? '0' : '') + hours + ':' +
      (minutes < 10 ? '0' : '') + minutes + ':' +
      (seconds < 10 ? '0' : '') + seconds;
  }
  
  export { startTimer, pauseTimer, resetTimer };