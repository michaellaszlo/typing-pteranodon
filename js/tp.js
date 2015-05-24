var TypingPteranodon = {
  layout: {
    chute: { width: 400, height: 500, left: 50, top: 40 },
    typing: { width: 300, height: 50 },
    status: { left: 50 }
  },
  font: {
    face: 'sans-serif',
    size: { pixels: 30 },
    color: { target: '#222', correct: '#92a4b6' }
  },
  game: {
    speed: { initial: 24, increment: 12 },
    delay: { level: 900, word: 300 }
  },
  status: {
    numRecent: 8
  },
  dictionary: dictionary17870,
  update: {},
  debug: {
    active: { game: true, event: false },
    message: function (flag, s) {
      if (TypingPteranodon.debug.active[flag]) {
        console.log(s);
      }
    }
  }
};

TypingPteranodon.makeLevel = function (levelIndex) {
  var g = TypingPteranodon,
      dictionary = g.dictionary,
      level = {},
      words = level.words = [],
      numWords = level.numWords = 2*levelIndex + 3;
  for (var i = 0; i < numWords; ++i) {
    var pos = Math.floor(Math.random() * dictionary.length);
    words.push(dictionary[pos]);
  }
  return level;
};

TypingPteranodon.nextLevel = function () {
  var g = TypingPteranodon;
  ++g.levelIndex;
  g.level = g.makeLevel(g.levelIndex);
  g.word.speed += g.game.speed.increment;
  g.wordIndex = -1;
  if (g.levelIndex == 0) {
    g.nextWord();
  } else {
    window.setTimeout(g.nextWord, g.game.delay.level);
  }
};

TypingPteranodon.nextWord = function () {
  var g = TypingPteranodon,
      canvas = g.canvas,
      context = g.context,
      word = g.word,
      level = g.level,
      levelIndex = g.levelIndex,
      numWords = level.numWords,
      wordIndex = ++g.wordIndex;
  g.status.current.innerHTML = g.makeRunString(
      { wordIndex: wordIndex, numWords: numWords, levelIndex: levelIndex });
  if (wordIndex == level.numWords) {
    g.update.chute();
    g.nextLevel();
    return;
  }
  word.text = level.words[wordIndex]; 
  word.width = Math.ceil(context.chute[0].measureText(word.text).width);

  // Render the word.
  context.stage.fillStyle = g.font.color.target;
  context.stage.clearRect(0, 0, canvas.stage.width, canvas.stage.height);
  context.stage.fillText(word.text, 0, g.font.base.top);
  // Measure the height of the word.
  var testWidth = word.width,
      testHeight = canvas.stage.height,
      testData = context.stage.getImageData(0, 0, testWidth, testHeight).data;
  for (var i = 3; ; i += 4) {  // Seek forward for a non-transparent pixel.
    if (testData[i] !== 0) {
      var x = (i-3)/4,
          c = x % testWidth;
      word.firstRow = (x-c) / testWidth;
      break;
    }
  }
  for (var i = 4*testWidth*testHeight - 1; ; i -= 4) {  // Seek backward.
    if (testData[i] !== 0) {
      var x = (i-3)/4,
          c = x % testWidth;
      word.lastRow = (x-c) / testWidth;
      break;
    }
  }
  word.height = word.lastRow - word.firstRow + 1;

  var target = g.make('canvas'),
      targetContext = target.getContext('2d'),
      width = word.width,
      height = word.height;
  target.width = width;
  target.height = height;
  targetContext.drawImage(canvas.stage,
      0, word.firstRow, width, height,
      0, 0, width, height);
  word.canvas = [target];
  context.stage.fillStyle = g.font.color.correct;
  for (var length = 1; length <= word.text.length; ++length) {
    var prefix = g.make('canvas'),
        prefixContext = prefix.getContext('2d');
    prefix.width = width;
    prefix.height = height;
    context.stage.clearRect(0, word.firstRow, width, height);
    context.stage.fillText(word.text.substring(0, length), 0, g.font.base.top);
    prefixContext.drawImage(canvas.stage,
        0, word.firstRow, width, height,
        0, 0, width, height);
    var result = g.overpaint(targetContext, prefixContext, width, height);
    word.canvas.push(result);
  }
  g.prefixLength = 0;

  word.baseX = Math.floor((g.layout.chute.width - word.width) / 2);
  word.y = 0;
};

TypingPteranodon.overpaint = function (baseContext, overContext,
      width, height) {
  var g = TypingPteranodon,
      baseImage = baseContext.getImageData(0, 0, width, height),
      baseData = baseImage.data,
      overImage = overContext.getImageData(0, 0, width, height),
      overData = overImage.data;
  for (var i = 4*width*height - 1; i != -1; i -= 4) {
    if (overData[i] !== 0) {
      baseData[i-3] = overData[i-3];
      baseData[i-2] = overData[i-2];
      baseData[i-1] = overData[i-1];
      baseData[i] = overData[i];
    }
  }
  var result = g.make('canvas');
  result.width = width;
  result.height = height;
  result.getContext('2d').putImageData(baseImage, 0, 0);
  return result;
};

TypingPteranodon.startGame = function () {
  var g = TypingPteranodon;
  g.levelIndex = -1;
  g.word = { speed: g.game.speed.initial - g.game.speed.increment };
  g.playing = true;
  g.nextLevel();
  g.resume();
  g.startTime = performance.now();
  g.frames = 0;
};

TypingPteranodon.resume = function () {
  var g = TypingPteranodon;
  g.debug.message('event', 'resuming');
  g.chuteClicked = false;
  g.chute.className = '';
  g.input.focus();
  g.active = true;
  g.previousTime = undefined;
  g.cycle();
};

TypingPteranodon.pause = function () {
  var g = TypingPteranodon;
  g.debug.message('event', 'pausing');
  g.active = false;
  g.chute.className = 'paused';
};

// makeRunString takes a run, which is an internal representation of
// the player's progress in a game, and generates an external representation
// suitable for display.
TypingPteranodon.makeRunString = function (run) {
  var levelIndex = run.levelIndex,
      wordIndex = run.wordIndex,
      numWords = run.numWords,
      parts = [];
  if (levelIndex == -1) {
    return '';
  }
  parts.push('<span class="run">');
  parts.push('<span class="level">'+(levelIndex+1)+'</span>');
  parts.push('<span class="words completed">');
  for (var i = 0; i < wordIndex; ++i) {
    parts.push('&#x25cf;');
  }
  parts.push('</span>');  // End completed words.
  parts.push('<span class="words remaining">');
  for (var i = wordIndex; i < numWords; ++i) {
    parts.push('&#x25cb;');
  }
  parts.push('</span>');  // End remaining words.
  parts.push('</span>');  // End run string.
  var result = parts.join('');
  return result;
};

TypingPteranodon.finishGame = function () {
  var g = TypingPteranodon;
  g.active = false;
  g.playing = false;
  var run = { wordIndex: g.wordIndex, numWords: g.level.numWords,
              levelIndex: g.levelIndex },
      history = JSON.parse(localStorage.getItem('history')),
      recent = history.recent,
      best = history.best,
      status = g.status;
  if (run.levelIndex > best.levelIndex ||
      (run.levelIndex == best.levelIndex && run.wordIndex > best.wordIndex)) {
    history.best = run;
  }
  status.best.innerHTML = g.makeRunString(best);
  // Store latest results.
  if (recent.unshift(run) > g.status.numRecent) {
    recent.pop();
  }
  status.best.innerHTML = g.makeRunString(history.best);
  var parts = [];
  for (var i = 0; i < status.numRecent && i < history.recent.length; ++i) {
      parts.push(g.makeRunString(history.recent[i])+'<br />');
  }
  status.recent.innerHTML = parts.join('');
  localStorage.setItem('history', JSON.stringify(history));
};

TypingPteranodon.cycle = function (time) {
  var g = TypingPteranodon;
  if (!g.active) {
    return;
  }
  if (time !== undefined) {
    g.update.chute(time);
  }
  window.requestAnimationFrame(g.cycle);
};

TypingPteranodon.update.chute = function (time) {
  var g = TypingPteranodon,
      timespan = (g.previousTime === undefined ? 0 : time - g.previousTime);
  g.previousTime = time;
  g.frames += 1;
  var word = g.word,
      currIndex = g.chute.index,
      nextIndex = (currIndex === 0 ? 1 : 0),
      chuteCanvas = g.canvas.chute[nextIndex],
      context = g.context,
      chuteContext = context.chute[nextIndex];
  var sway = 15*Math.sin(time/500);
  word.x = word.baseX - sway;
  var centerX = word.x + word.width/2,
      centerY = word.y - word.height/2,
      angle = sway / 175;
  chuteContext.clearRect(0, 0, chuteCanvas.width, chuteCanvas.height);
  chuteContext.translate(centerX, centerY);
  chuteContext.rotate(angle);
  chuteContext.translate(-centerX, -centerY);
  chuteContext.drawImage(word.canvas[g.prefixLength], word.x, word.y);
  chuteContext.setTransform(1, 0, 0, 1, 0, 0);
  word.y += timespan/1000 * g.word.speed;
  if (word.y >= g.finishY) {
    g.debug.message('game',
        'incomplete: "'+g.input.value+'", target: "'+word.text+'"');
    g.chute.className = 'failed';
    g.finishGame();
  }
  chuteCanvas.style.visibility = 'visible';
  g.canvas.chute[currIndex].style.visibility = 'hidden';
  g.chute.index = nextIndex;
};

TypingPteranodon.update.typing = function () {
  var g = TypingPteranodon;
  if (!g.active) {
    return;
  }
  var target = g.word.text,
      attempt = g.input.value;
  if (attempt.length > target.length) {
    g.debug.message('game', 'program error: input overflow');
    g.pause();
    return;
  }
  for (var i = 0; i < attempt.length; ++i) {
    if (attempt.charAt(i) != target.charAt(i)) {
      g.debug.message('game', 'typo: "'+attempt+'", target: "'+target+'"');
      g.chute.className = 'failed';
      g.finishGame();
      return;
    }
  }
  g.prefixLength += 1;
  if (g.prefixLength == target.length) {
    g.input.value = '';
    window.setTimeout(g.nextWord, g.game.delay.word);
  }
};

TypingPteranodon.make = function (tag, options) {
  var element = document.createElement(tag);
  if (options !== undefined) {
    if (options.into !== undefined) {
      options.into.appendChild(element);
    }
    var keys = ['id', 'className', 'innerHTML'];
    for (var i = 0; i < keys.length; ++i) {
      var key = keys[i];
      if (options[key] !== undefined) {
        element[key] = options[key];
      }
    }
  }
  return element;
};

TypingPteranodon.load = function () {
  var g = TypingPteranodon,
      wrapper = g.make('div', { id: 'wrapper', into: document.body }),
      input = g.input = g.make('input', { id: 'typingInput', into: wrapper }),
      chute = g.chute = g.make('div', { id: 'gameContainer', into: wrapper }),
      canvas = g.canvas = {
        stage: g.make('canvas', { into: wrapper }),
        chute: [ g.make('canvas', { id: 'chute1', into: chute }),
                  g.make('canvas', { id: 'chute2', into: chute }) ]
      },
      context = g.context = {
        stage: canvas.stage.getContext('2d'),
        chute: [ canvas.chute[0].getContext('2d'),
                 canvas.chute[1].getContext('2d') ]
      },
      layout = g.layout;
  canvas.stage.width = layout.chute.width;
  canvas.stage.height = Math.ceil(3.5*g.font.size.pixels);
  canvas.stage.style.display = 'none';
  canvas.chute[1].width = canvas.chute[0].width = layout.chute.width;
  canvas.chute[1].height = canvas.chute[0].height = layout.chute.height;
  chute.style.width = layout.chute.width + 'px';
  chute.style.height = layout.chute.height + 'px';
  chute.style.left = layout.chute.left + 'px';
  chute.style.top = layout.chute.top + 'px';
  input.style.left = chute.style.left = layout.chute.left + 'px';
  input.style.top = layout.chute.top + 'px';
  canvas.stage.style.position = 'fixed';
  canvas.stage.style.top = layout.chute.top + 'px';
  canvas.stage.style.left = layout.chute.left + layout.chute.width + 5 + 'px';
  canvas.stage.style.border = '1px dotted #ddd';

  g.font.string = g.font.size.pixels + 'px ' + g.font.face;
  context.stage.font = context.chute[1].font = context.chute[0].font =
      g.font.string;
  g.font.base = {
    left: Math.floor(g.font.size.pixels/2),
    top: 2*g.font.size.pixels
  };
  input.oninput = g.update.typing;

  input.onblur = function () {
    g.debug.message('event', 'blur');
    if (!g.active) {
      g.debug.message('event', 'not active');
      return;
    }
    if (g.chuteClicked) {
      g.debug.message('event', 'refocusing because the chute was clicked');
      g.chuteClicked = false;
      input.focus();
      return;
    }
    g.pause();
  };

  canvas.chute[1].onmousedown = canvas.chute[0].onmousedown = function () {
    g.debug.message('event', 'chute click on '+this.id);
    if (!g.playing) {
      g.debug.message('not playing');
      return;
    }
    if (g.chuteClicked) {
      g.debug.message('event', 'a chute click is already being handled');
      return;
    }
    g.chuteClicked = true;
    if (g.active) {
      g.debug.message('event', 'already active');
      return;
    }
    window.setTimeout(function () {
      g.debug.message('event', 'queuing resume');
      g.resume();
    }, 0);
  };

  // Set up display of run results: current, best, recent.
  var status = g.status,
      container = status.container = g.make('div', { id: 'status',
          into: wrapper })
  container.style.width = layout.chute.width + 'px';
  container.style.height = layout.chute.height + 'px';
  container.style.left = layout.chute.left + layout.chute.width +
      layout.status.left + 'px';
  container.style.top = layout.chute.top + 'px';
  g.make('div', { className: 'label', into: container, innerHTML: 'current' });
  status.current = g.make('div', { className: 'display current',
      into: container });
  g.make('div', { className: 'label', into: container, innerHTML: 'best' });
  status.best = g.make('div', { className: 'display best',
      into: container });
  g.make('div', { className: 'label', into: container, innerHTML: 'recent' });
  status.recent = g.make('div', { className: 'display recent',
      into: container });

  var history = JSON.parse(localStorage.getItem('history'));
  if (!history) {
    history = {
      recent: [],
      best: { wordIndex: -1, numWords: 0, levelIndex: -1 }
    };
    localStorage.setItem('history', JSON.stringify(history));
  }
  status.best.innerHTML = g.makeRunString(history.best);
  var parts = [];
  for (var i = 0; i < g.status.numRecent && i < history.recent.length; ++i) {
      parts.push(g.makeRunString(history.recent[i])+'<br />');
  }
  status.recent.innerHTML = parts.join('');

  g.chute.index = 0;
  g.canvas.chute[1].style.visibility = 'hidden';
  g.finishY = layout.chute.height;
  g.startGame();
};

window.onload = TypingPteranodon.load;
