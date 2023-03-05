// Utils
const getIntBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Typewriter 'class'
const TypeWriter = function(element = null) {
  this.el = element;
  this.delay = 0;
  this.lastFrame = null;
  this.delta = null;
  this.accumulator = 0;
  this.eventQueue = [];
  this.fullText = null;
  this.currCharacterIndex = 0;
  this.isTyping = false;
  this.isDeleting = false;
  this.deleteCounter = 0;
  this.isPaused = false;
  // prepend a node to edit so it doesnt affect otehr nodes eg: cursors
  this.el.prepend(document.createTextNode(''));
}

TypeWriter.prototype.typeText = function(text) {
  if (typeof text !== 'string') {
    throw new Error('typeText has to be a string.');
  }
  this.eventQueue.unshift({
    method: 'DO_TYPE_TEXT', 
    data: text
  });
  return this;
}

TypeWriter.prototype.addDelay = function (ms) {
  if (!Number.isInteger(ms)) {
    throw new Error('addDelay has to be an integer');
  }
  this.eventQueue.unshift({
    method: 'DO_ADD_DELAY',
    data: ms
  })
  return this;
}

TypeWriter.prototype.deleteChars = function (count) {
  if (!Number.isInteger(count)) {
    throw new Error('deleteChars has to be an integer');
  }
  this.eventQueue.unshift({
    method: 'DO_DELETE_CHARS',
    data: count
  })
  return this;
}

TypeWriter.prototype.start = function() {
  this.lastFrame = performance.now();
  this.loop()
}

TypeWriter.prototype.loop = function() {
  this.now = performance.now();
  this.delta = this.now - this.lastFrame;
  this.lastFrame = this.now;
  this.accumulator += this.delta;
  this.raf = requestAnimationFrame(TypeWriter.prototype.loop.bind(this))

  if (this.isPaused === true) {
    return;
  }
  
  if (this.accumulator < this.delay) {
    return;
  }
  // Reset delay
  else {
    this.accumulator = 0;
    this.delay = 0;
  }

  // Typing animation
  if (this.isTyping || this.isDeleting) {
    if (this.isDeleting) {
      this.deleteCounter -= 1;
      this.currCharacterIndex -= 1;
    }
    else {
      this.isTyping = true;
      this.currCharacterIndex += 1;
    }

    const currText = this.fullText.substring(0, this.currCharacterIndex);
    if (this.isDeleting) {
      this.fullText = this.fullText.slice(0, this.fullText.length - 1);
    }
    
    this.el.childNodes[0].textContent = currText;
    this.delay += (this.isDeleting ?  getIntBetween(60, 100) : getIntBetween(80, 180));
    
    // Checking if isDeleting to cover an edge case where deleting the full string because fullText and currText == '' so it would never pass this.
    if (currText === this.fullText && this.isDeleting === false) {
      this.isTyping = false;
      return;
    }
    
    // Finished deleting, so skip typing animation next loop
    if (currText === '' || this.deleteCounter === 0) {
      this.isDeleting = false;
      this.deleteCounter = 0;
    }

    return;
  }

  // Event handling
  const currMethod = this.eventQueue.pop();
  if (!currMethod) {
    return cancelAnimationFrame(this.raf);
  }
  switch (currMethod.method) {
    case 'DO_TYPE_TEXT':
      if (this.fullText === null) {
        this.fullText = currMethod.data;
      } else {
        this.fullText += currMethod.data;
      }
      this.isTyping = true;
      break;
    case 'DO_ADD_DELAY':
      this.delay += currMethod.data;
      break;
    case 'DO_DELETE_CHARS':
      this.isDeleting = true;
      this.deleteCounter = currMethod.data;
      break;
    default:
      throw new Error('unknown method event.');
  }
}