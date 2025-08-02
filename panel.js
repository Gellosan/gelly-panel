window.Twitch.ext.onAuthorized(function (auth) {
  const twitchUserId = auth.userId;
  console.log("[DEBUG] onAuthorized fired. twitchUserId:", twitchUserId);

  if (!twitchUserId) {
    console.warn("[DEBUG] No Twitch user ID detected. Buttons will not send requests.");
  }

  const SERVER_URL = "https://gelly-server.onrender.com";

  // ========================
  // FEEDBACK & ANIMATION
  // ========================
  function showTempMessage(msg, color = "#fff") {
    const el = document.getElementById("message");
    if (!el) return;
    el.innerText = msg;
    el.style.color = color;
    el.style.opacity = "1";

    setTimeout(() => {
      el.style.opacity = "0";
    }, 2500);
  }

  function animateGelly(action) {
    const gellyImage = document.getElementById("gelly-image");
    if (!gellyImage) return;
    gellyImage.classList.add(`gelly-${action}-anim`);
    setTimeout(() => {
      gellyImage.classList.remove(`gelly-${action}-anim`);
    }, 800);
  }

  // ========================
  // COOLDOWN HANDLING
  // ========================
  const cooldowns = { feed: 0, play: 0, clean: 0 };

  function setCooldown(action, seconds) {
    cooldowns[action] = seconds;
    const btn = document.getElementById(`${action}Btn`);
    if (!btn) return;

    btn.disabled = true;
    updateButtonLabel(action);

    const interval = setInterval(() => {
      cooldowns[action]--;
      if (cooldowns[action] <= 0) {
        clearInterval(interval);
        btn.disabled = false;
        updateButtonLabel(action, true);
      } else {
        updateButtonLabel(action);
      }
    }, 1000);
  }

  function updateButtonLabel(action, reset = false) {
    const btn = document.getElementById(`${action}Btn`);
    if (!btn) return;
    if (reset) {
      if (action === "feed") btn.innerText = "Feed (Cost: 1000 jellybeans)";
      else if (action === "play") btn.innerText = "Play";
      else if (action === "clean") btn.innerText = "Clean";
    } else {
      btn.innerText = `${action.charAt(0).toUpperCase() + action.slice(1)} (${cooldowns[action]}s)`;
    }
  }

  // ========================
  // WEBSOCKET
  // ========================
  function connectWebSocket() {
    if (!twitchUserId) return;
    const wsUrl = `${SERVER_URL.replace(/^http/, "ws")}/?user=${twitchUserId}`;
    console.log("[DEBUG] Connecting WebSocket:", wsUrl);

    const socket = new WebSocket(wsUrl);

    socket.addEventListener("open", () => console.log("[DEBUG] WebSocket connected"));
    socket.addEventListener("error", (err) => console.error("[DEBUG] WebSocket error", err));

    socket.addEventListener("message", (event) => {
      console.log("[DEBUG] WebSocket message received:", event.data);
      const msg = JSON.parse(event.data);
      if (msg.type === "update") updateUI(msg.state);
      else if (msg.type === "leaderboard") updateLeaderboard(msg.entries);
    });
  }

  // ========================
  // ACTION HANDLER
  // ========================
  function interact(action) {
    if (!twitchUserId) {
      return showTempMessage("User not authenticated.", "red");
    }

    console.log(`[DEBUG] Sending action to server: ${action}`);
    animateGelly(action);

    let actionText = "";
    if (action === "play") actionText = "You play with your Gelly!";
    else if (action === "feed") actionText = "You feed your Gelly!";
    else if (action === "clean") actionText = "You clean your Gelly!";
    showTempMessage(actionText, "#0f0");

    fetch(`${SERVER_URL}/v1/interact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, user: twitchUserId }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        console.log("[DEBUG] Fetch response data:", data);

        if (!data.success) {
          if (data.cooldown) {
            setCooldown(action, data.cooldown);
            showTempMessage(`Please wait ${data.cooldown}s before ${action}ing again.`, "yellow");
          } else {
            showTempMessage(data.message || "Action failed", "red");
          }
        } else {
          if (data.cooldown) setCooldown(action, data.cooldown);
        }
      })
      .catch((err) => {
        console.error("[DEBUG] Network error during interact:", err);
        showTempMessage("Network error", "red");
      });
  }

  // ========================
  // UI UPDATES
  // ========================
  function updateLeaderboard(entries) {
    const list = document.getElementById("leaderboard-list");
    if (!list) return;

    list.innerHTML = "";
    entries.slice(0, 10).forEach((entry, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="rank">#${index + 1}</span>
        <span class="name">${entry.displayName || entry.userId}</span>
        <span class="score">${entry.points} jellybeans</span>
      `;
      list.appendChild(li);
    });
  }

  function updateUI(state) {
    console.log("[DEBUG] Updating UI with state:", state);
    document.getElementById("energy").innerText = state.energy;
    document.getElementById("mood").innerText = state.mood;
    document.getElementById("cleanliness").innerText = state.cleanliness;

    const gellyImage = document.getElementById("gelly-image");
    const stage = state.stage || "egg";
    const color = state.color || "blue";

    if (stage === "egg") {
      gellyImage.src = "assets/egg.png";
    } else if (stage === "blob") {
      gellyImage.src = `assets/blob-${color}.png`;
    } else if (stage === "gelly") {
      gellyImage.src = `assets/gelly-${color}.png`;
    }
  }

  function showHelp() {
    const box = document.getElementById("help-box");
    if (box) box.style.display = box.style.display === "none" ? "block" : "none";
  }

  // ========================
  // BUTTON LISTENERS
  // ========================
  document.getElementById("feedBtn")?.addEventListener("click", () => interact("feed"));
  document.getElementById("playBtn")?.addEventListener("click", () => interact("play"));
  document.getElementById("cleanBtn")?.addEventListener("click", () => interact("clean"));
  document.getElementById("helpBtn")?.addEventListener("click", showHelp);

  connectWebSocket();
});
