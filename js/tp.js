var TypingPteranodon = {
  width: 600,
  height: 600,
  hertz: 60,
  dictionary: dictionary17870
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

TypingPteranodon.play = function () {
  var g = TypingPteranodon,
      level = g.level,
      context = g.canvas.context,
      word = g.word = {};
  word.text = level.words[0]; 
  word.width = context.measureText(word.text).width;
  word.x = (g.width - word.width) / 2;
  word.y = g.startY;
  word.speed = (g.finishY - g.startY) / (level.sloth * g.hertz);
  g.ticks = 0;
  g.updateInterval = window.setInterval(g.update, 1000/g.hertz);
}

TypingPteranodon.stop = function () {
  var g = TypingPteranodon;
  window.clearTimeout(g.updateInterval);
}

TypingPteranodon.update = function () {
  var g = TypingPteranodon,
      context = g.canvas.context,
      word = g.word;
  context.clearRect(0, 0, g.width, g.height);
  context.fillText(word.text, word.x, word.y);
  word.y += word.speed;
  if (word.y >= g.finishY) {
    g.stop();
  }
  g.ticks += 1;
  g.stopwatch.innerHTML = Math.floor(g.ticks/60);
}

TypingPteranodon.load = function () {
  var g = TypingPteranodon,
      canvas = g.canvas = document.getElementById('mainCanvas');
  canvas.width = g.width;
  canvas.height = g.height;
  var context = canvas.context = canvas.getContext('2d');
  context.font = '30px sans-serif';
  g.startY = -15;
  g.finishY = 645;
  g.level = g.makeLevel();
  g.stopwatch = document.getElementById('stopwatch');

  var typing = g.typing = {
    input: document.getElementById('typingInput'),
    display: document.getElementById('typingDisplay')
  };

  typing.input.focus();
  typing.input.onblur = function () {
    typing.input.focus();
  }
  typing.input.onkeydown = function () {
    typing.display.innerHTML = typing.input.value;
  }

  g.play();
};

window.onload = TypingPteranodon.load;
