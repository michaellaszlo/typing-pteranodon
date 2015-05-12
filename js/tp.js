var TypingPteranodon = {
  layout: {
    container: { left: 50, top: 50 },
    chute: { width: 400, height: 500 },
    typing: { width: 300, height: 50 }
  },
  font: {
    face: 'sans-serif',
    size: { pixels: 30 },
  },
  dictionary: dictionary17870,
  update: {}
};

TypingPteranodon.makeLevel = function () {
  var g = TypingPteranodon,
      dictionary = g.dictionary,
      level = {},
      words = level.words = [],
      numWords = level.numWords = 25;
  for (var i = 0; i < numWords; ++i) {
    var index = Math.floor(Math.random() * dictionary.length);
    words.push(dictionary[index]);
  }
  return level;
};

TypingPteranodon.nextWord = function () {
  var g = TypingPteranodon,
      level = g.level,
      canvas = g.canvas,
      context = g.context,
      word = g.word,
      wordIndex = ++g.wordIndex;
  if (wordIndex == level.numWords) {
    g.stop();
  }
  word.text = level.words[wordIndex]; 
  word.width = Math.ceil(context.chute[0].measureText(word.text).width);

  // Measure the height of the word.
  context.stage.clearRect(0, 0, canvas.stage.width, canvas.stage.height);
  context.stage.fillText(word.text, 0, g.font.base.top);
  var testWidth = word.width,
      testHeight = canvas.stage.height,
      testData = context.stage.getImageData(0, 0, testWidth, testHeight).data;
  for (var i = 3; ; i += 4) {  // Seek forward for a non-transparent pixel.
    if (testData[i] != 0) {
      var x = (i-3)/4,
          c = x % testWidth;
      word.firstRow = (x-c) / testWidth;
      break;
    }
  }
  for (var i = 4*testWidth*testHeight - 1; ; i -= 4) {  // Seek backward.
    if (testData[i] != 0) {
      var x = (i-3)/4,
          c = x % testWidth;
      word.lastRow = (x-c) / testWidth;
      break;
    }
  }
  word.height = word.lastRow - word.firstRow + 1;

  word.baseX = Math.floor((g.layout.chute.width - word.width) / 2);
  word.y = 0;
};

TypingPteranodon.play = function () {
  var g = TypingPteranodon,
      level = g.level = g.makeLevel(),
      word = g.word = {};
  word.speed = 0.8;
  g.wordIndex = -1;
  g.nextWord();
  g.ticks = 0;
  g.playing = true;
  window.requestAnimationFrame(g.update.chute);
}

TypingPteranodon.stop = function () {
  var g = TypingPteranodon;
  g.playing = false;
};

TypingPteranodon.update.chute = function () {
  var g = TypingPteranodon;
  if (!g.playing) {
    return;
  }
  var word = g.word,
      currIndex = g.chute.index,
      nextIndex = (currIndex == 0 ? 1 : 0),
      chuteCanvas = g.canvas.chute[nextIndex],
      context = g.context,
      chuteContext = context.chute[nextIndex];
  g.ticks += 1;
  var sway = 3*Math.sin(word.y/10);
  word.x = word.baseX - sway;
  var centerX = word.x + word.width/2,
      centerY = word.y - word.height/2,
      angle = sway / 75;
  chuteContext.clearRect(0, 0, chuteCanvas.width, chuteCanvas.height);
  chuteContext.translate(centerX, centerY);
  chuteContext.rotate(angle);
  chuteContext.translate(-centerX, -centerY);
  chuteContext.drawImage(g.canvas.stage,
      0, word.firstRow, word.width, word.height,
      word.x, word.y, word.width, word.height);
  chuteContext.setTransform(1, 0, 0, 1, 0, 0);
  word.y += word.speed;
  if (word.y >= g.finishY) {
    g.nextWord();
  }
  chuteCanvas.visibility = 'visible';
  g.canvas.chute[currIndex].visibility = 'hidden';
  g.chute.index = nextIndex;
  window.requestAnimationFrame(g.update.chute);
};

TypingPteranodon.update.typing = function () {
  var g = TypingPteranodon,
      word = g.word,
      attempt = g.input.value,
      typingCanvas = g.canvas.typing,
      typingContext = g.context.typing;
  typingContext.clearRect(0, 0, typingCanvas.width, typingCanvas.height),
  typingContext.fillText(attempt, g.font.base.left, g.font.base.top);
  return;
  for (var i = 0; i < word.text.length && i < attempt.length; ++i) {
    var c = word.text.charAt(i),
        d = attempt.charAt(i);
  }
};

TypingPteranodon.make = function (tag, options) {
  var element = document.createElement(tag);
  if (options !== undefined) {
    if (options.id !== undefined) {
      element.id = options.id;
    }
    if (options.class !== undefined) {
      element.className = options.class;
    }
    if (options.in !== undefined) {
      options.in.appendChild(element);
    }
  }
  return element;
};

TypingPteranodon.load = function () {
  var g = TypingPteranodon,
      wrapper = document.getElementById('wrapper'),
      container = g.make('div', { id: 'gameContainer', in: wrapper }),
      canvas = g.canvas = {
        stage: g.make('canvas', { in: wrapper }),
        chute: [ g.make('canvas', { id: 'chute', in: container }),
                  g.make('canvas', { id: 'chute', in: container }) ],
        typing: g.make('canvas', { id: 'typingDisplay', in: wrapper })
      },
      context = g.context = {
        stage: canvas.stage.getContext('2d'),
        chute: [ canvas.chute[0].getContext('2d'),
                 canvas.chute[1].getContext('2d') ],
        typing: canvas.typing.getContext('2d')
      },
      input = g.input = g.make('input', { id: 'typingInput', in: wrapper }),
      layout = g.layout;
  canvas.chute[1].width = canvas.chute[0].width = g.layout.chute.width;
  canvas.chute[1].height = canvas.chute[0].height = g.layout.chute.height;
  canvas.stage.width = canvas.typing.width = g.layout.chute.width;
  canvas.stage.height = canvas.typing.height = 2 * g.font.size.pixels;
  container.style.width = g.layout.chute.width + 'px';
  container.style.height = g.layout.chute.height + 'px';
  container.style.left = g.layout.container.left + 'px';
  input.style.left = container.style.left = canvas.typing.style.left =
      layout.container.left + 'px';
  input.style.top = canvas.typing.style.top =
      layout.container.top + layout.chute.height + 'px';
  canvas.stage.style.position = 'fixed';
  canvas.stage.style.top = layout.chute.top + 'px';
  canvas.stage.style.left = layout.container.left + layout.chute.width +
      5 + 'px';
  canvas.stage.style.border = '1px dotted #ddd';

  var font = g.font.size.pixels + 'px ' + g.font.face;
  context.stage.font = context.chute[1].font = context.chute[0].font =
      context.typing.font = font;
  g.font.base = {
    left: Math.floor(g.font.size.pixels/2),
    top: g.font.size.pixels +
      Math.floor((g.layout.typing.height - g.font.size.pixels)/2)
  };

  input.oninput = g.update.typing;
  input.onblur = function () {
    canvas.typing.className = '';
  };
  function refocus() {
    window.setTimeout(function () {
      canvas.typing.className = 'focused';
      input.focus();
    }, 20);
  }
  canvas.chute[1].onmousedown = canvas.chute[0].onmousedown =
      canvas.typing.onmousedown = refocus;
  refocus();
  g.chute = { index: 0 };
  g.canvas.chute[1].style.display = 'none';

  g.finishY = layout.chute.height;
  g.play();
};

window.onload = TypingPteranodon.load;
