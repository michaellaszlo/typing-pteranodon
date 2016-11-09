var Wordfall = (function () {
  var layout = {
        chute: { width: 400, height: 500, left: 50, top: 40 },
        fade: { height: 25 },
        typing: { width: 300, height: 50 },
        status: { left: 50 }
      },
      font = {
        face: 'sans-serif',
        size: { pixels: 30 },
        color: { target: '#222', correct: '#92a4b6' }
      },
      game = {
        speed: { initial: 24, increment: 12 },
        pause: { level: 100, word: 100 },
        level: { size: { initial: 1, increment: 1 } }
      },
      display = {
        recentMax: 10,
        show: function (s) {
          display.message.innerHTML = s;
        }
      },
      status = {
      },
      dictionary = dictionary17870,
      debug = {
        active: { game: true, event: true },
        message: function (flag, s) {
          if (debug.active[flag]) {
            console.log(s);
          }
        }
      },
      canvas, context, input, chute,
      levelIndex, level, wordIndex, word, prefixLength, nextWord;

  function makeLevel(levelIndex) {
    var level = {},
        words = level.words = [],
        size = game.level.size,
        numWords = level.numWords = size.initial + levelIndex*size.increment,
        i, pos;
    for (i = 0; i < numWords; ++i) {
      pos = Math.floor(Math.random() * dictionary.length);
      words.push(dictionary[pos]);
    }
    return level;
  }

  function nextLevel() {
    ++levelIndex;
    level = makeLevel(levelIndex);
    word.speed += game.speed.increment;
    wordIndex = -1;
    if (levelIndex == 0) {
      nextWord();
    } else {
      setTimeout(nextWord, game.pause.level);
    }
  }

  function nextWord() {
    var testWidth, testHeight, testData,
        i, x, c,
        target, targetContext, width, height,
        length, prefix, prefixContext,
        result,
        numWords = level.numWords;
    input.value = '';
    ++wordIndex;
    display.current.innerHTML = makeRunString(
        { wordIndex: wordIndex, numWords: numWords, levelIndex: levelIndex });
    if (wordIndex == level.numWords) {
      updateChute();
      nextLevel();
      return;
    }
    word.text = level.words[wordIndex]; 
    word.width = Math.ceil(context.chute[0].measureText(word.text).width);

    // Render the word.
    context.stage.fillStyle = font.color.target;
    context.stage.clearRect(0, 0, canvas.stage.width, canvas.stage.height);
    context.stage.fillText(word.text, 0, font.base.top);

    // Measure the height of the word.
    testWidth = word.width;
    testHeight = canvas.stage.height;
    testData = context.stage.getImageData(0, 0, testWidth, testHeight).data;
    for (i = 3; ; i += 4) {  // Seek forward for a non-transparent pixel.
      if (testData[i] !== 0) {
        x = (i-3)/4;
        c = x % testWidth;
        word.firstRow = (x-c) / testWidth;
        break;
      }
    }
    for (i = 4*testWidth*testHeight - 1; ; i -= 4) {  // Seek backward.
      if (testData[i] !== 0) {
        x = (i-3)/4;
        c = x % testWidth;
        word.lastRow = (x-c) / testWidth;
        break;
      }
    }
    word.height = word.lastRow - word.firstRow + 1;

    target = make('canvas');
    targetContext = target.getContext('2d');
    width = word.width;
    height = word.height;
    target.width = width;
    target.height = height;
    targetContext.drawImage(canvas.stage,
        0, word.firstRow, width, height,
        0, 0, width, height);
    word.canvas = [target];
    context.stage.fillStyle = font.color.correct;
    for (length = 1; length <= word.text.length; ++length) {
      prefix = make('canvas');
      prefixContext = prefix.getContext('2d');
      prefix.width = width;
      prefix.height = height;
      context.stage.clearRect(0, word.firstRow, width, height);
      context.stage.fillText(word.text.substring(0, length),
          0, font.base.top);
      prefixContext.drawImage(canvas.stage,
          0, word.firstRow, width, height,
          0, 0, width, height);
      result = overpaint(targetContext, prefixContext, width, height);
      word.canvas.push(result);
    }
    prefixLength = 0;

    word.baseX = Math.floor((layout.chute.width - word.width) / 2);
    word.y = -word.height;
  };

  function overpaint(baseContext, overContext, width, height) {
    var i, result,
        baseImage = baseContext.getImageData(0, 0, width, height),
        baseData = baseImage.data,
        overImage = overContext.getImageData(0, 0, width, height),
        overData = overImage.data;
    for (i = 4*width*height - 1; i != -1; i -= 4) {
      if (overData[i] !== 0) {
        baseData[i-3] = overData[i-3];
        baseData[i-2] = overData[i-2];
        baseData[i-1] = overData[i-1];
        baseData[i] = overData[i];
      }
    }
    result = make('canvas');
    result.width = width;
    result.height = height;
    result.getContext('2d').putImageData(baseImage, 0, 0);
    return result;
  }

  function startGame() {
    levelIndex = -1;
    word = { speed: game.speed.initial - game.speed.increment };
    nextLevel();
    resume();
    status.frames = 0;
  }

  function resume() {
    debug.message('event', 'resuming');
    overlayMessage();
    chute.className = '';
    status.updateTime = undefined;
    status.playing = true;
    cycle();
    input.focus();
  }

  function overlayMessage(text, fillStyle) {
    context.click.clearRect(0, 0, canvas.click.width, canvas.click.height);
    if (text === undefined) {
      return;
    }
    context.click.fillStyle = (fillStyle === undefined ? '#333' : fillStyle);
    context.click.fillText(text,
        (canvas.click.width - context.click.measureText(text).width) / 2,
        canvas.click.height / 2);
  }

  function blur() {
    var text;
    debug.message('event', 'blurring');
    chute.className = 'blurred';
    overlayMessage('Click to resume typing.');
    input.focus();
  }

  // makeRunString takes a run, which is an internal representation of
  // the player's progress in a game, and generates an external representation
  // suitable for display.
  function makeRunString(run) {
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
  }

  function finishGame() {
    var history, recent, best, run,
        parts, i;
    if (!status.playing) {
      return;
    }
    status.playing = false;
    overlayMessage('Click to try again.', '#888');
    history = JSON.parse(localStorage.getItem('history'));
    recent = history.recent;
    best = history.best;
    run = {
      wordIndex: wordIndex,
      numWords: level.numWords,
      levelIndex: levelIndex
    };
    if (levelIndex > best.levelIndex ||
        (levelIndex == levelIndex && wordIndex > best.wordIndex)) {
      history.best = run;
    }
    display.best.innerHTML = makeRunString(best);
    // Store latest results.
    if (recent.unshift(run) > display.recentMax) {
      recent.pop();
    }
    display.best.innerHTML = makeRunString(history.best);
    parts = [];
    for (i = 0; i < display.recentMax && i < history.recent.length; ++i) {
        parts.push(makeRunString(history.recent[i])+'<br>');
    }
    display.recent.innerHTML = parts.join('');
    localStorage.setItem('history', JSON.stringify(history));
  }

  function cycle(time) {
    if (!status.playing) {
      return;
    }
    if (time !== undefined) {
      updateChute(time);
    }
    requestAnimationFrame(cycle);
  }

  function updateChute(time) {
    var timespan,
        currIndex, nextIndex,
        chuteCanvas, chuteContext,
        sway, centerX, centerY, angle,
        updateTime = status.updateTime;
    timespan = (updateTime === undefined ? 0 : time - updateTime);
    status.updateTime = time;
    status.frames += 1;
    currIndex = chute.index;
    nextIndex = (currIndex === 0 ? 1 : 0);
    chuteCanvas = canvas.chute[nextIndex];
    chuteContext = context.chute[nextIndex];
    sway = 15*Math.sin(time/500);
    word.x = word.baseX - sway;
    centerX = word.x + word.width/2,
    centerY = word.y - word.height/2,
    angle = sway / 175;
    chuteContext.clearRect(0, 0, chuteCanvas.width, chuteCanvas.height);
    chuteContext.translate(centerX, centerY);
    chuteContext.rotate(angle);
    chuteContext.translate(-centerX, -centerY);
    chuteContext.drawImage(word.canvas[prefixLength], word.x, word.y);
    chuteContext.setTransform(1, 0, 0, 1, 0, 0);
    word.y += timespan/1000 * word.speed;
    if (word.y >= layout.finishY) {
      debug.message('game',
          'incomplete: "' + input.value + '", target: "' + word.text + '"');
      chute.className = 'failed';
      finishGame();
    }
    chuteCanvas.style.visibility = 'visible';
    canvas.chute[currIndex].style.visibility = 'hidden';
    chute.index = nextIndex;
  }

  function updateTyping() {
    var target, attempt,
        i;
    if (!status.playing) {
      return;
    }
    target = word.text;
    attempt = input.value;
    for (i = 0; i < attempt.length; ++i) {
      if (attempt.charAt(i) != target.charAt(i)) {
        debug.message('game',
            'typo: "' + attempt + '", target: "' + target + '"');
        chute.className = 'failed';
        finishGame();
        return;
      }
    }
    prefixLength += 1;
    if (prefixLength == target.length) {
      setTimeout(nextWord, game.pause.word);
    }
  }

  function make(tag, options) {
    var keys, i, key,
        element = document.createElement(tag);
    if (options !== undefined) {
      if (options.into !== undefined) {
        options.into.appendChild(element);
      }
      keys = ['id', 'className', 'innerHTML'];
      for (i = 0; i < keys.length; ++i) {
        key = keys[i];
        if (options[key] !== undefined) {
          element[key] = options[key];
        }
      }
    }
    return element;
  }

  function load() {
    var container,
        fadeContext, gradient,
        displayBox, history,
        wrapper = make('div', { id: 'wrapper', into: document.body });
    input = make('input', { id: 'typingInput', into: wrapper });
    chute = container = make('div', { id: 'container', into: wrapper });
    canvas = {
      stage: make('canvas', { into: wrapper }),
      chute: [ make('canvas', { className: 'chute', into: container }),
                make('canvas', { className: 'chute', into: container }) ],
      fade: make('canvas', { className: 'fade', into: container }),
      click: make('canvas', { into: container })
    };
    context = {
      stage: canvas.stage.getContext('2d'),
      chute: [ canvas.chute[0].getContext('2d'),
               canvas.chute[1].getContext('2d') ],
      click: canvas.click.getContext('2d')
    };
    canvas.chute0 = canvas.chute[0];
    canvas.chute1 = canvas.chute[1];
    [ 'stage', 'chute0', 'chute1', 'fade', 'click' ].forEach(function (name) {
      canvas[name].width = layout.chute.width;
      canvas[name].height = layout.chute.height;
    });
    canvas.stage.height = Math.ceil(3.5*font.size.pixels);
    canvas.stage.style.display = 'none';
    container.style.width = layout.chute.width + 'px';
    container.style.height = layout.chute.height + 'px';
    container.style.left = layout.chute.left + 'px';
    container.style.top = layout.chute.top + 'px';
    input.style.left = container.style.left = layout.chute.left + 'px';
    input.style.top = layout.chute.top + 'px';
    canvas.stage.style.position = 'fixed';
    canvas.stage.style.top = layout.chute.top + 'px';
    canvas.stage.style.left = layout.chute.left + layout.chute.width + 5 + 'px';
    canvas.stage.style.border = '1px dotted #ddd';

    // Decorative layer over the main canvas.
    fadeContext = canvas.fade.getContext('2d');
    gradient = fadeContext.createLinearGradient(0, 0, 0, layout.fade.height);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 255)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    fadeContext.fillStyle = gradient;
    fadeContext.fillRect(0, 0, layout.chute.width, layout.fade.height);

    font.string = font.size.pixels + 'px ' + font.face;
    context.stage.font = context.chute[1].font = context.chute[0].font =
        font.string;
    context.click.font = 1.1 * font.size.pixels + 'px ' + font.face;
    font.base = {
      left: Math.floor(font.size.pixels/2),
      top: 2*font.size.pixels
    };
    input.oninput = updateTyping;
    input.onblur = function () {
      if (!status.playing) {
        debug.message('not playing');
        return;
      }
      debug.message('event', 'blur');
      if (status.chuteClicked) {
        debug.message('event', 'refocusing because the chute was clicked');
        status.chuteClicked = false;
        input.focus();
        return;
      }
      blur();
    };
    canvas.click.onmousedown = function () {
      debug.message('event', 'chute click');
      if (status.chuteClicked) {
        debug.message('event', 'a chute click is already being handled');
        return;
      }
      status.chuteClicked = true;
      if (!status.playing) {
        debug.message('game', 'starting a new game');
        startGame();
        return;
      }
      setTimeout(function () {
        debug.message('event', 'queuing resume');
        resume();
      }, 0);
    };

    // Set up display of run results: current, best, recent.
    displayBox = make('div', { id: 'status', into: wrapper });
    displayBox.style.width = layout.chute.width + 'px';
    displayBox.style.height = layout.chute.height + 'px';
    displayBox.style.left = layout.chute.left + layout.chute.width +
        layout.status.left + 'px';
    displayBox.style.top = layout.chute.top + 'px';
    make('div', { className: 'label', into: displayBox, innerHTML: 'current' });
    display.current = make('div', { className: 'display current',
        into: displayBox });
    make('div', { className: 'label', into: displayBox, innerHTML: 'best' });
    display.best = make('div', { className: 'display best',
        into: displayBox });
    make('div', { className: 'label', into: displayBox, innerHTML: 'recent' });
    display.recent = make('div', { className: 'display recent',
        into: displayBox });
    display.message = make('div', { className: 'message', into: displayBox });

    history = JSON.parse(localStorage.getItem('history'));
    if (!history) {
      history = {
        recent: [],
        best: { wordIndex: -1, numWords: 0, levelIndex: -1 }
      };
      localStorage.setItem('history', JSON.stringify(history));
    }
    display.best.innerHTML = makeRunString(history.best);
    var parts = [];
    for (var i = 0; i < display.recentMax && i < history.recent.length; ++i) {
        parts.push(makeRunString(history.recent[i])+'<br>');
    }
    display.recent.innerHTML = parts.join('');

    chute.index = 0;
    canvas.chute[1].style.visibility = 'hidden';
    layout.finishY = layout.chute.height;
    startGame();
  }

  return {
    load: load
  };
})();

onload = Wordfall.load;
