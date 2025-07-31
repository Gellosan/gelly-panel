let twitchUserId = null;
let selectedColor = 'blue';
let blobColor = null;

window.Twitch.ext.onAuthorized(function(auth) {
  twitchUserId = auth.userId;
  connectWebSocket();
});

function connectWebSocket() {
  const socket = new WebSocket('wss://gelly-server.onrender.com/?user=' + twitchUserId);
  socket.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'update') updateUI(msg.state);
    else if (msg.type === 'leaderboard') {
      const list = document.getElementById('leaderboard-list');
      list.innerHTML = '';
      msg.entries.forEach(entry => {
        const li = document.createElement('li');
        li.innerText = `${entry.user}: ${entry.mood} mood`;
        list.appendChild(li);
      });
    }
  });
}

function updateUI(state) {
  document.getElementById('energy').innerText = state.energy;
  document.getElementById('mood').innerText = state.mood;
  document.getElementById('cleanliness').innerText = state.cleanliness;

  const gellyImage = document.getElementById('gelly-image');
  const stage = state.stage || 'egg';     // egg, blob, gelly
  const color = state.color || 'blue';    // fallback

  if (stage === 'egg') {
    gellyImage.src = 'assets/egg.png';
  } else if (stage === 'blob') {
    gellyImage.src = `assets/blob-${color}.png`;
  } else if (stage === 'gelly') {
    gellyImage.src = `assets/gelly-${color}.png`;
  }
}


function showMessage(msg) {
  const el = document.getElementById('message');
  el.innerText = msg;
  setTimeout(() => el.innerText = '', 3000);
}

function showHelp() {
  const box = document.getElementById('help-box');
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

function interact(action) {
  if (!twitchUserId) return showMessage("User not authenticated.");
  fetch('https://gelly-server.onrender.com/interact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, user: twitchUserId })
  })
  .then(res => res.json())
  .then(data => {
    if (!data.success) showMessage(data.message);
  });
}

function changeColor(color) {
  selectedColor = color;
  interact('color:' + color);
}
function interact(action) {
  fetch('https://gelly-server.onrender.com/v1/interact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user: twitchUserId, action })
  })
  .then(res => res.json())
  .then(data => {
    if (!data.success) showMessage(data.message);
  })
  .catch(() => showMessage('Network error'));
}
function showHelp() {
  const helpBox = document.getElementById('help-box');
  helpBox.style.display = helpBox.style.display === 'none' ? 'block' : 'none';
}

function showMessage(msg) {
  const msgBox = document.getElementById('message');
  msgBox.innerText = msg;
  setTimeout(() => { msgBox.innerText = ''; }, 3000);
}
