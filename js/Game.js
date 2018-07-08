var game = new Phaser.Game(600, 530, Phaser.AUTO, 'wrapper', {preload: preload, create: create}),
	graphics,
	boardCells,
	gameInfoText,
	redRooks,
	greenRooks,
	TOOL_BAR_HEIGHT = 50,
	ROW_COUNT = 8,
	COL_COUNT = 10,
	CELL_WIDTH = 60,
	CELL_HEIGHT = 60;

function preload() {
	game.load.image('greenRook', 'assets/greenRook.png');
	game.load.image('redRook', 'assets/redRook.png');
	game.load.image('doneTurnButton', 'assets/doneTurnButton.png');
}

function create() {
	initGraphics();

	initGameInfoText();

	initBoard();
	initRedRooks();
	initGreenRooks();

	drawBoard();
	drawRooks(redRooks);
	drawRooks(greenRooks);

	game.stage.backgroundColor = '#0f5681';
}

function initGraphics() {
	graphics = game.add.graphics(0, 0);
}

function initGameInfoText() {
	gameInfoText = game.add.text(
		0, 0, 'You are green and it is your turn',
		{
			fill: 'white',
			align: 'center',
			font: 'bold 20px Sylfaen',
			boundsAlignH: 'center',
			boundsAlignV: 'middle'
		});
	gameInfoText.x = game.world.centerX - gameInfoText.width / 2;
	gameInfoText.y = TOOL_BAR_HEIGHT / 2 - gameInfoText.height / 2;
}

function initBoard() {
	boardCells = [];
	for (var i = 0; i < ROW_COUNT; i++) {
		for (var j = 0; j < COL_COUNT; j++) {
			boardCells.push({
				row: i,
				column: j,
				color: (i + j) % 2 === 0 ? 0x8E5216 : 0xFFBB0B
			});
		}
	}
}

function initRedRooks() {
	redRooks = [];
	for (var i = 0; i < COL_COUNT; i++) {
		var rook = {};
		rook.column = i;
		rook.row = random(0, ROW_COUNT - 1, []);
		rook.type = 'red';
		rook.uiRook = game.add.image(0, 0, 'redRook');
		rook.uiRook.reference = rook;
		rook.uiRook.width = CELL_WIDTH;
		rook.uiRook.height = CELL_HEIGHT;
		rook.uiRook.visible = false;
		rook.animation = game.add.tween(rook.uiRook);
		rook.animation.onComplete.add(function (uiRook) {
			uiRook.reference.updateCellPosition();
		});
		rook.updateCellPosition = function () {
			this.row = getRowIndex(this.uiRook);
			this.column = getColumnIndex(this.uiRook);

			if (playerLost('green')) {
				updateGameInfoText('Game ower, you lost!');
			}
		};
		redRooks.push(rook);
	}
}

function initGreenRooks() {
	greenRooks = [];
	for (var i = 0; i < COL_COUNT; i++) {
		var rook = {};
		rook.column = i;
		rook.row = random(0, ROW_COUNT - 1, [redRooks[i].row]);
		rook.type = 'green';
		rook.uiRook = game.add.image(0, 0, 'greenRook');
		rook.uiRook.reference = rook;
		rook.uiRook.width = CELL_WIDTH;
		rook.uiRook.height = CELL_HEIGHT;
		rook.uiRook.visible = false;
		rook.uiRook.inputEnabled = true;
		rook.uiRook.width = CELL_WIDTH;
		rook.uiRook.height = CELL_HEIGHT;
		rook.uiRook.visible = false;
		rook.uiRook.input.enableDrag();
		rook.uiRook.events.onDragStop.add(dragStopRook);
		rook.animation = game.add.tween(rook.uiRook);
		rook.animation.onComplete.add(function (uiRook) {
			uiRook.reference.updateCellPosition();
		});
		rook.updateCellPosition = function () {
			this.row = getRowIndex(this.uiRook);
			this.column = getColumnIndex(this.uiRook);
		};
		greenRooks.push(rook);
	}
}

function drawBoard() {
	graphics.lineStyle(2, 0x000000, 1);
	for (var i = 0; i < boardCells.length; i++) {
		var cell = boardCells[i];
		var x = cell.column * CELL_WIDTH;
		var y = cell.row * CELL_HEIGHT + TOOL_BAR_HEIGHT;
		drawRect(x, y, CELL_WIDTH, CELL_HEIGHT, cell.color);
	}
}

function drawRooks(rooks) {
	for (var i = 0; i < rooks.length; i++) {
		drawRook(rooks[i])
	}
}

function drawRook(rook) {
	if (!rook.uiRook.visible) {
		rook.uiRook.visible = true;
	}
	rook.uiRook.x = rook.column * CELL_WIDTH;
	rook.uiRook.y = rook.row * CELL_HEIGHT + TOOL_BAR_HEIGHT;
}

function drawRect(x, y, w, h, color) {
	graphics.beginFill(color);
	graphics.drawRect(x, y, w, h);
	graphics.endFill();
}

function dragStopRook(uiRook) {
	var rook = uiRook.reference;
	var row = getRowIndex(uiRook);
	var column = rook.column;

	var enemyRook = null;
	if (rook.type === 'red') {
		enemyRook = greenRooks[column];
	} else {
		enemyRook = redRooks[column];
	}
	if (rook.row < enemyRook.row) {
		row = Math.min(enemyRook.row - 1, row);
	} else {
		row = Math.max(enemyRook.row + 1, row);
	}
	if (row !== rook.row) {
		moveRook(rook, row, column, false);
	} else {
		drawRook(rook);
	}
}

function moveRook(rook, row, column, withAnimation) {
	var targetX = column * CELL_WIDTH;
	var targetY = row * CELL_HEIGHT + TOOL_BAR_HEIGHT;
	if (withAnimation) {
		rook.animation.to({
			x: targetX,
			y: targetY
		}, 1000, null, false, 0, 0, false);
		rook.animation.start();
	} else {
		rook.row = row;
		rook.column = column;
		drawRook(rook);
		if (playerLost('red')) {
			updateGameInfoText('Game ower, you win!');
		} else {
			onComputerTurn();
		}
	}
}

function getColumnIndex(uiRook) {
	return Math.round(Math.max(0, uiRook.x) / CELL_WIDTH);
}

function getRowIndex(uiRook) {
	return Math.round(Math.max(0, uiRook.y - TOOL_BAR_HEIGHT) / CELL_HEIGHT);
}

function random(fromNumber, toNumber, toExclude) {
	var r = game.rnd.between(fromNumber, toNumber);
	while (toExclude.indexOf(r) !== -1) {
		r = game.rnd.between(fromNumber, toNumber);
	}
	return r;
}

function onComputerTurn() {
	var row = -1, column = -1, xor = getXor();
	// console.log(redRooks);
	// console.log(greenRooks);
	for (var i = 0; i < ROW_COUNT; i++) {
		for (var j = 0; j < COL_COUNT; j++) {
			var redRook = redRooks[j], greenRook = greenRooks[j];
			if (canRedRookMove(redRook, greenRook, i)) {
				if (row === -1 && column === -1) {
					row = i;
					column = j;
				}
				var currentXor = xor;
				// console.log('xoring:' + currentXor + ', ' + (Math.abs(greenRook.row - redRook.row) - 1));
				currentXor = currentXor ^ (Math.abs(greenRook.row - redRook.row) - 1);
				// console.log('xoring:' + currentXor + ', ' + (Math.abs(greenRook.row - i) - 1));
				currentXor = currentXor ^ (Math.abs(greenRook.row - i) - 1);
				// console.log('cell[' + i + ',' + j + '] xor: ' + xor + ', newXor:' + currentXor);
				if (currentXor === 0 && Math.abs(redRook.row - greenRook.row) > Math.abs(i - greenRook.row)) {
					row = i;
					column = j;
				}
			}
		}
	}
	// console.log(row + ' ' + column);
	moveRook(redRooks[column], row, column, true);
}

function canRedRookMove(redRook, greenRook, row) {
	if (redRook.row === row) {
		return false;
	}
	if (redRook.row < greenRook.row) {
		return row < greenRook.row;
	} else {
		return row > greenRook.row;
	}
}

function getXor() {
	var xor = 0;
	for (var i = 0; i < COL_COUNT; i++) {
		xor ^= Math.abs(redRooks[i].row - greenRooks[i].row) - 1;
	}
	return xor;
}

function playerLost(playerType) {
	for (var i = 0; i < COL_COUNT; i++) {
		var redRook = redRooks[i], greenRook = greenRooks[i];
		if (Math.abs(redRook.row - greenRook.row) > 1) {
			return false;
		}
		if (playerType === 'red') {
			if (redRook.row < greenRook.row) {
				if (redRook.row > 0) {
					return false;
				}
			} else {
				if (redRook.row + 1 < ROW_COUNT) {
					return false;
				}
			}
		} else {
			if (redRook.row < greenRook.row) {
				if (greenRook.row + 1 < ROW_COUNT) {
					return false;
				}
			} else {
				if (greenRook.row > 0) {
					return false;
				}
			}
		}
	}
	return true;
}

function updateGameInfoText(text) {
	gameInfoText.text = text;
	gameInfoText.x = game.world.centerX - gameInfoText.width / 2;
	gameInfoText.y = TOOL_BAR_HEIGHT / 2 - gameInfoText.height / 2;
}