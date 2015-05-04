var Keyboard = {};

Keyboard.keyRows = [];
Keyboard.prepKeys = function() {
	var keyRows = Keyboard.keyRows;
	function addKeyRow(description) {
		var keyRow = [], parts = description.split(/\s+/);
		for (var i = 0; i < parts.length; i++)
			keyRow.push({normal: parts[i][0], shifted: parts[i][1]});
		keyRows.push(keyRow);
	}
	addKeyRow('`~ 1! 2@ 3# 4$ 5% 6^ 7& 8* 9( 0) -_ +=');
	addKeyRow('qQ wW eE rR tT yY uU iI oO pP [{ ]} \\|');
	addKeyRow('aA sS dD fF gG hH jJ kK lL ;: \'"');
	addKeyRow('zZ xX cC vV bB nN mM ,< .> /?');
	keyRows[0].push({normal: 'Backspace', className: 'special backspace'});
	keyRows[1].unshift({normal: 'Tab', className: 'special tab'});
	keyRows[1][keyRows[1].length-1].className = 'backslash';
	keyRows[2].unshift({normal: 'Caps Lock', className: 'special capslock'});
	keyRows[2].push({normal: 'Enter', className: 'special enter'});
	keyRows[3].unshift({normal: 'Shift', className: 'special shift'});
	keyRows[3].push({normal: 'Shift', className: 'special shift'});
	keyRows.push([{className: 'special spacebar'}]);
};

Keyboard.prepBoard = function() {
	var container = document.getElementById('keyboard');
	for (var r = 0; r < Keyboard.keyRows.length; r++) {
		var keyRow = Keyboard.keyRows[r];
		var list = document.createElement('ul');
		for (var c = 0; c < keyRow.length; c++) {
			var item = document.createElement('li');
			if (keyRow[c].shifted) {
				var shifted = document.createElement('div');
				shifted.innerHTML = keyRow[c].shifted;
				shifted.className = 'shifted';
				item.appendChild(shifted);
			}
			if (keyRow[c].normal) {
				var normal = document.createElement('div');
				normal.innerHTML = keyRow[c].normal;
				normal.className = 'normal';
				item.appendChild(normal);
			}
			if (keyRow[c].className) {
				item.className = keyRow[c].className;
			}
			list.appendChild(item);
		}
		container.appendChild(list);
	}
};

Keyboard.prep = function() {
	Keyboard.prepKeys();
	Keyboard.prepBoard();
};

window.onload = Keyboard.prep;
