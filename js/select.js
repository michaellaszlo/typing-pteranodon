load('words.twl06.js');
var subset = [];
for (var pos = 0; pos < words.length; pos += 10) {
  subset.push('\''+words[pos]+'\'');
}
print('var words = ['+subset.join(', ')+'];');
