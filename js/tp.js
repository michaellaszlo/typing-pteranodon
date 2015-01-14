var TypingPteranodon = {
  width: 1000,
  height: 600
};

TypingPteranodon.load = function () {
  var g = TypingPteranodon,
      canvas = g.canvas = document.getElementById('mainCanvas');
  canvas.width = g.width;
  canvas.height = g.height;
  var context = canvas.context = canvas.getContext('2d');
  context.font = '30px sans-serif';
  var words = g.words = ['ant', 'bear', 'cat', 'dog'];
  for (var i = 0; i < words.length; ++i) {
    var word = words[i];
    canvas.context.fillText(word, 200 + i*100, g.height/2);
  }
};

window.onload = TypingPteranodon.load;
