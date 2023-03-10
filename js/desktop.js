// // Global
// const desktop = document.getElementById('desktop');
// Global state 
let isDraggingWindow = false;
let dragTarget = null;
let filesObj = [];

// aniomationFunctions
const openAnimation = (element, options, ms = 250) => {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      element.style.transition = `
        opacity ${ms}ms ease-in-out,
        transform ${ms}ms ease-in-out
      `;
      element.style.opacity = options.opacity;

      element.translateX = `${options.toX} - ${options.fromX} - 50%`;
      element.translateY = `${options.toY} - ${options.fromY} - 50%`;
      element.style.transform = `
        translate3d(calc(${element.translateX}), calc(${element.translateY}), 0)
        scaleX(${options.scaleX || 1})
        scaleY(${options.scaleY || 1})
      `;
    })       
    setTimeout(resolve, ms);
  })
};

// event handlers
const getFileById = (id, folder = filesObj.content) => {
  let found = false;
  for (const file of folder) {
    if (file.uid === id) {
      return file;
    }

    if (file.type === 'folder') {
      found = getFileById(id, file.content);
      if (found) {
        break;
      }
    }
  }

  return found;
}

const openFolder = async (event) => {
  // Create component
  const window = document.createElement('div');
  console.log(`searching ${event.currentTarget.id}`);
  const file = await getFileById(event.currentTarget.id);
  const fileContent = await getFileContent(file);

  window.id = `window-${file.uid}`;
  window.caller = event.target;
  window.innerHTML = `
    <div class="absolute text-gray-900 dark:text-white outline outline-2 outline-black dark:outline-white bg-white dark:bg-black" style="width: min(600px, 75%); height: auto;">
      <div class="w-full inline-flex justify-between p-6 outline outline-2 outline-black dark:outline-white hover:bg-gray-900 hover:text-white dark:hover:bg-gray-800">
        <h2 class="text-xl font-bold">${file.title ? file.title : file.name}</h2>
        <svg onClick="closeFolder('${window.id}')" class="w-5 h-5 cursor-pointer fill-current" xmlns="http://www.w3.org/2000/svg" viewbox="0 0 100 100" xml:space="preserve"><path d="m62.819 47.97 32.533-32.534a2 2 0 0 0 0-2.828L83.333.586a2.002 2.002 0 0 0-2.828 0L47.97 33.121 15.435.586c-.75-.75-2.078-.75-2.828 0L.587 12.608a2 2 0 0 0 0 2.828L33.121 47.97.587 80.504a2 2 0 0 0 0 2.828l12.02 12.021a2 2 0 0 0 2.828 0L47.97 62.818l32.535 32.535a2 2 0 0 0 2.828 0l12.02-12.021a2 2 0 0 0 0-2.828L62.819 47.97z"/></svg>
      </div>
      <div class="p-6">
        ${fileContent}
      </div>
    </div>
      `;    
  document.getElementById("app").appendChild(window);

  // //Animate
  const {top, left} = event.target.getBoundingClientRect();

  const innerDiv = window.querySelector('div');

  innerDiv.style.transformOrigin = '0 0';
  innerDiv.style.transform = 'scale(.1)';
  innerDiv.style.left = `${left}px`;
  innerDiv.style.top = `${top}px`;

  // state of starting drag pos
  innerDiv.offsetX = 0;
  innerDiv.offsetY = 0;

  innerDiv.addEventListener('mousedown', onDragStart, false);
  innerDiv.addEventListener('mouseup', onDragEnd, false);
  innerDiv.addEventListener('mousemove', onDrag, false);

  innerDiv.addEventListener('touchstart', onDragStart, false);
  innerDiv.addEventListener('touchend', onDragEnd, false);
  innerDiv.addEventListener('touchmove', onDrag, false);

  openAnimation(innerDiv, {
    opacity: '1',
    fromX: `${left}px`,
    fromY: `${top}px`,
    toX: '50vw',
    toY: '50vh'
  }, 250);
}

const closeFolder = async (windowId) => {    
  const window = document.getElementById(`${windowId}`);
  const caller = window.caller;
  const {top, left} = caller.getBoundingClientRect();
  const innerDiv = window.querySelector('div');

  innerDiv.style.transformOrigin = 'center center';

  await openAnimation(innerDiv, {
    scaleX: '0',
    scaleY: '0',
    opacity: '0',
    fromX: `${innerDiv.style.left}`,
    fromY: `${innerDiv.style.top}`,
    toX: `${left}px`,
    toY: `${top}px`
  }, 250);
  window.remove();
}

// Drag handlers
const onDragStart = (event) => {
  isDraggingWindow = true;
  dragTarget = event.currentTarget;

  if (event.type === 'touchstart') {
    dragTarget.startX = event.touches[0].clientX - dragTarget.offsetX;
    dragTarget.startY = event.touches[0].clientY - dragTarget.offsetY;        
  } else {
    dragTarget.startX = event.clientX - dragTarget.offsetX;
    dragTarget.startY = event.clientY - dragTarget.offsetY;
  }

  // reset transition so it doesn't slow down the dragging 
  dragTarget.style.transition = '';
}

const onDragEnd = (event) => {
  isDraggingWindow = false;
}

const onDrag = (event) => {
  if (isDraggingWindow) {
    event.preventDefault();

    if (event.type === 'touchmove') { 
      dragTarget.currentX = event.touches[0].clientX - dragTarget.startX;
      dragTarget.currentY = event.touches[0].clientY - dragTarget.startY;
    } else {
      dragTarget.currentX = event.clientX - dragTarget.startX;
      dragTarget.currentY = event.clientY - dragTarget.startY;
    }

    dragTarget.offsetX = dragTarget.currentX;
    dragTarget.offsetY = dragTarget.currentY;
    
    requestAnimationFrame(() => {
      dragTarget.style.transform = `translate3d(calc(${dragTarget.translateX} + ${dragTarget.currentX}px), calc(${dragTarget.translateY} + ${dragTarget.currentY}px), 0)`;
    });
  }
}

// Main
const loadData = async () => {
  let data = undefined;

  try {
    data = await (await import('../data/folders.js')).filesObj;
    
    const loopFolders = (folder) => {
      for (const file of folder) {
        file.uid = Math.random().toString(16).slice(2);
        if (file.type === 'folder') {
          loopFolders(file.content)
        }
      }
    }

    if (data.type === 'folder') {
      loopFolders(data.content);
    }
  } catch (err) {
    if (err) throw err;
  }

  return data;
}

const loadDesktop = async () => {
  // set global
  filesObj = await loadData();

  if (!filesObj) {
    throw new Error('could not load desktop data');
  }

  const desktop = document.querySelector('#desktop');
  const html = await getFileContent(filesObj);
  desktop.insertAdjacentHTML('beforeend', html);
}

const getFileContent = async (file) => {
  if (!file.type) {
    throw new Error('could not read the folder\'s file type');
  };

  if (file.type === 'text') {
    const request = await fetch(`data/pages/${file.content}`);
    const innerContent = await request.text();
    return innerContent;
  }

  if (file.type === 'folder') {
    const { icons } = await import('../data/icons.js');
    
    let html = '<div class="inline-flex flex-wrap">';
    
    for (const fileContent of file.content) {
      html += `
        <div id="${fileContent.uid}" onclick="openFolder(event)" class="flex flex-col items-center cursor-pointer">
          ${fileContent.icon ? icons[fileContent.icon] : icons[fileContent.type]}
          <span class="font-mono">${fileContent.name}</span>
        </div>
      `
    }

    html += `</div>`;

    return html;
  }
}