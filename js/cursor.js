// Includes
const ws = new WebSocket('wss://server.januariopinto.com:8081');
const cursorTemplate = `<svg version="1.0" xmlns="http://www.w3.org/2000/svg" style="position: absolute;" width="32" height="32" viewBox="0 0 24 24"><path d="M3 12.1v12.3l3.8-3.6c3.2-3.2 4.4-3.7 9.1-4l5.4-.3-9.1-8.4L3-.2v12.3zm2.2-1.8c-.9 1.8-1.1 1.4-1.1-2.8.1-4.6.1-4.8 1.1-2.2.7 2 .7 3.5 0 5z"/></svg>`;

// Sate
const cursors = [];
let cursorPos = {x: 0, y: 0};
let myself = undefined;

// Events
ws.addEventListener('message', ({ data }) => {
  let parsedData = null;

  try {
    parsedData = JSON.parse(data);
  } catch (err) {
    console.error('Could not parse server socket data. Error: ', err);
    return;
  }

  if (parsedData.type === 'CLIENT_SYNC') {
    myself = parsedData.id;
    return;
  }

  for (let state of parsedData) {
    if (state.id === myself) {
      return;
    }

    if (cursors[state.id]) {
      // Store previous position to lerp;
      cursors[state.id].drawX = cursors[state.id].x;
      cursors[state.id].drawY = cursors[state.id].y;
      cursors[state.id].x = state.x;
      cursors[state.id].y = state.y;
    } else {
      // Create a new cursor
      const element = document.createElement('div');
      element.innerHTML = cursorTemplate;
      element.style.width = '32px';
      element.style.height = '32px';
      element.style.fill = `hsl(${Math.floor(Math.random() * 360)}, 100%, 50%)`;
      element.style.padding = `0px`;
      document.getElementById('cursors').appendChild(element);
      state.pixel = element;
      cursors[state.id] = state;
    }
  }
});

window.addEventListener('mousemove', (event) => {
  cursorPos = {
    x: event.x / window.innerWidth,
    y: event.y / window.innerHeight  
  }
});

const moveAnimation = (clientId) => {
  const client = cursors[clientId];
  if (!client.drawX || !client.drawY) return;

  client.drawX += (client.x - client.drawX) * 0.05;
  client.drawY += (client.y - client.drawY) * 0.05;

  client.pixel.style.transform = `translate3d(${window.innerWidth * client.drawX}px, ${window.innerHeight * client.drawY}px, 0px)`;
}

const updateClients = () => {
  for (let cursor in cursors) {
    moveAnimation(cursor);
  }

  requestAnimationFrame(updateClients)
}

// Network Loop
setInterval(() => {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(cursorPos));
  }
}, 50);

// Draw loop
updateClients();