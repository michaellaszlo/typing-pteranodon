var TypingPteranodon = {
  dimensions: {
    chute: { width: 400, height: 500 },
    typing: { width: 300, height: 50 }
  },
  hertz: 60,
  dictionary: dictionary17870,
  update: {}
};

TypingPteranodon.makeLevel = function () {
  var g = TypingPteranodon,
      dictionary = g.dictionary,
      level = {},
      words = level.words = [],
      numWords = level.numWords = 10;
  for (var i = 0; i < numWords; ++i) {
    var index = Math.floor(Math.random() * dictionary.length);
    words.push(dictionary[index]);
  }
  level.sloth = 5;
  return level;
};

TypingPteranodon.nextWord = function () {
  var g = TypingPteranodon,
      level = g.level,
      context = g.context,
      word = g.word,
      wordIndex = ++g.wordIndex;
  if (wordIndex == level.numWords) {
    g.stop();
  }
  word.text = level.words[wordIndex]; 
  word.width = context.chute.measureText(word.text).width;
  word.x = (g.dimensions.chute.width - word.width) / 2;
  word.y = g.startY;
};

TypingPteranodon.play = function () {
  var g = TypingPteranodon,
      level = g.level = g.makeLevel(),
      word = g.word = {};
  word.speed = (g.finishY - g.startY) / (level.sloth * g.hertz);
  g.wordIndex = -1;
  g.nextWord();
  g.ticks = 0;
  g.interval = { chute: window.setInterval(g.update.chute, 1000/g.hertz) };
}

TypingPteranodon.stop = function () {
  var g = TypingPteranodon;
  window.clearTimeout(g.interval.chute);
};

TypingPteranodon.update.chute = function () {
  var g = TypingPteranodon,
      word = g.word,
      chuteCanvas = g.canvas.chute,
      chuteContext = g.context.chute;
  g.ticks += 1;
  g.stopwatch.innerHTML = Math.floor(g.ticks/g.hertz);
  chuteContext.clearRect(0, 0, chuteCanvas.width, chuteCanvas.height);
  chuteContext.fillText(word.text, word.x, word.y);
  word.y += word.speed;
  if (word.y >= g.finishY) {
    g.nextWord();
  }
};

TypingPteranodon.update.typing = function () {
  var g = TypingPteranodon,
      word = g.word,
      attempt = g.input.value,
      typingCanvas = g.canvas.typing,
      typingContext = g.context.typing;
  typingContext.clearRect(0, 0, typingCanvas.width, typingCanvas.height),
  typingContext.fillText(attempt, 10, 35);
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
        chute: g.make('canvas', { id: 'chute', in: container }),
        typing: g.make('canvas', { id: 'typingDisplay', in: wrapper })
      },
      context = g.context = {
        chute: canvas.chute.getContext('2d'),
        typing: canvas.typing.getContext('2d')
      },
      input = g.input = g.make('input', { id: 'typingInput', in: wrapper }),
      stopwatch = g.stopwatch = g.make('div', { id: 'stopwatch', in: wrapper });
  canvas.chute.width = g.dimensions.chute.width;
  canvas.chute.height = g.dimensions.chute.height;
  canvas.typing.width = g.dimensions.typing.width;
  canvas.typing.height = g.dimensions.typing.height;
  context.chute.font = context.typing.font = '30px sans-serif';
  g.startY = -15;
  g.finishY = 645;

  input.focus();
  input.onblur = input.focus;
  input.oninput = g.update.typing;

  g.play();
};

window.onload = TypingPteranodon.load;
