const config = {
  // chose html5-canvas vs CanvasGL. 
  type: Phaser.AUTO,
  //width - height
  width: 1366,
  height: 768,
  //background color of canvas
  backgroundColor: 0x225566, //hexadecimal color code

  scale: {
    autoCenter: Phaser.Scale.CENTER_BOTH, // rescale with aspect ratio
    mode: Phaser.Scale.FIT,               // vertical and horizontal center
  },
  // default scene objects properties
  scene: {
    preload: onPreload,     // load assetes before start the game
    create: onCreate,       // create game object before start game
    update: onUpdate,       // update game object in game
  },
  // physics engine
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 800 }, // set gravity
      // debug: true,              // debug mode
    },
  },
};


const game = new Phaser.Game(config);
let scene, keyboard;
let star;
let platforms, stars, bombs, player;
const activateDoubleJump = true;
let canJump = false;
let skor, skorText;
let gameOverImage, winImage;
let isGameOver = false, isGameWin = false;
let mobileInput1, mobileInput2, mobileInput3;
let isLeftDown = false, isRightDown = false, isUpDown = false;
let btnLeft, btnRight, btnUp;


function onPreload() {
  const baseURL = './assets/images/traveller/';
  this.load.spritesheet('idl', baseURL + 'idl.png',
    { frameWidth: 64, frameHeight: 64 });

  this.load.spritesheet('jumpDown', baseURL + 'jumpDown.png',
    { frameWidth: 64, frameHeight: 64 });

  this.load.spritesheet('jumpUp', baseURL + 'jumpUp.png',
    { frameWidth: 64, frameHeight: 64 });

  this.load.spritesheet('run', baseURL + 'run.png',
    { frameWidth: 64, frameHeight: 64 });

  this.load.spritesheet('explosion', baseURL + 'explosion.png',
    { frameWidth: 256, frameHeight: 256 });

  this.load.image('platform', baseURL + 'platform.png');
  this.load.image('star', baseURL + 'star.png');
  this.load.image('win', baseURL + 'win.png');
  this.load.image('sky', baseURL + 'sky3.png');
  this.load.image('bomb', baseURL + 'bomb.png');
  this.load.image('gameOver', baseURL + 'gameOver.png');
  this.load.image('button', baseURL + 'button.png');

}


function onCreate() {
  scene = this;
  scene.input.addPointer(4);
  // set background image
  this.add.image(0, 0, 'sky').setOrigin(0, 0);
  gameOverImage = this.add.image(0, 0, 'gameOver').setOrigin(0, 0);
  gameOverImage.setVisible(false);
  winImage = this.add.image(game.canvas.width / 2, game.canvas.height / 2, 'win').setOrigin(0.5, 0.5).setScale(1.5);
  winImage.setVisible(false);
  winImage.setDepth(10);
  star = this.add.image(1300, 50, 'star').setScale(0.07);
  skor = 0;


  const style = {
    font: "50px Arial",
    fill: "#224499",
    // fontStyle: 'bold',
    wordWrap: true,
    wordWrapWidth: star.width,
    align: "center",
    // backgroundColor: "#ffff00"
  };

  skorText = this.add.text(star.x - 5, star.y + 5, "0", style);
  skorText.setFontStyle('bold')
  skorText.setOrigin(0.5, 0.5);

  // skorText.setTextBounds(1300, 50, 50, 50);

  platforms = this.physics.add.staticGroup();
  platforms.create(400, 568, 'platform').setScale(2).refreshBody();
  platforms.create(1000, 700, 'platform').setScale(2).refreshBody();
  platforms.create(1000, 200, 'platform').setScale(2).refreshBody();
  player = this.physics.add.sprite(400, 400, 'idl').setScale(2);
  // player.body.setOffset(14, 5);
  // player.body.width = 80;
  // player.body.height = 123;
  // gerçek boyutlarının yarısı oranında arttırmak yeterli oluyor nedense
  player.setSize(21, 60);
  player.setOffset(23, 5);
  player.setCollideWorldBounds();
  // player.setBounce(0.3);


  // animations
  //character
  this.anims.create({
    key: 'idl',
    frames: this.anims.generateFrameNumbers('idl', { start: 0, end: 7 }),
    frameRate: 10,
    repeat: -1,

  });

  this.anims.create({
    key: 'run',
    frames: this.anims.generateFrameNumbers('run', { start: 0, end: 5 }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: 'jumpUpx',
    frames: this.anims.generateFrameNumbers('jumpUp', { start: 0, end: 1 }),
    frameRate: 1,
    repeat: -1,
  });
  //bomb
  this.anims.create({
    key: 'explosion',
    frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 63 }),
    frameRate: 20,
    repeat: 0,
  });




  stars = this.physics.add.group({
    key: 'star',
    repeat: 10,
    setXY: { x: 10, y: 0, stepX: 120 },
    setScale: { x: 0.03, y: 0.03 },

  });
  // stars.create(200, 50, 'star').setScale(.03);

  bombs = this.physics.add.group();
  this.physics.add.collider(bombs, platforms);
  sendBomb(bombs);
  this.physics.add.collider(player, bombs, bombCollisionHandler);



  this.physics.add.collider(player, platforms);
  this.physics.add.collider(platforms, stars);
  stars.children.iterate(function (star) {
    // console.log(star);
    star.setCollideWorldBounds();
    // star.setBounce(.4);
    star.setBounceY(Phaser.Math.FloatBetween(0.3, 0.7));
  });
  // this.physics.add.overlap(player, stars, handleOverlap);
  this.physics.add.overlap(player, stars, collectStar);
  keyboard = this.input.keyboard.createCursorKeys();
  addButtons(this); // add mobile control buttons
}

function handleOverlap(player, star) {
  star.destroy();
  skor++;
  skorText.text = skor;
}


function onUpdate() {
  if (isGameOver) return;
  // checkMobileButtons();
  const isPlayerOnFloor = (player.body.touching.down || player.body.onFloor());

  if ((keyboard.up.isDown || isUpDown) && isPlayerOnFloor) {
    player.setVelocityY(-600);
    player.anims.play('jumpUpx', true);
    scene.time.addEvent({
      delay: 400,
      callback: function () { canJump = true; },
    });

  } else if ((keyboard.up.isDown || isUpDown) && canJump) {
    player.setVelocityY(-600);
    player.anims.play('jumpUpx', true);
    canJump = false;
  } else if (keyboard.down.isDown) {
    player.setVelocityY(600);
  }

  else if ((keyboard.left.isDown || isLeftDown) && isPlayerOnFloor) {
    player.setVelocityX(-200);
    player.setFlipX(true);
    player.anims.play('run', true);
  } else if ((keyboard.right.isDown || isRightDown) && isPlayerOnFloor) {
    player.setVelocityX(200);
    player.setFlipX(false);
    player.anims.play('run', true);
  } else if (isPlayerOnFloor) {
    player.setVelocityX(0);
    player.anims.play('idl', true);
  }

  if (skor === 60) {
    isGameWin = true;
    this.physics.pause();
    winImage.setVisible(true);
  }



}

function sendBomb(bombs, x = 16) {
  const bomb = bombs.create(x, 16, 'bomb').setScale(.3);
  bomb.setBounce(1);
  bomb.setCollideWorldBounds(true);
  bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
  bomb.allowGrawity = false;

}

function bombCollisionHandler(player, bomb) {
  scene.physics.pause();
  player.setTint(0xff0000);
  bomb.setScale(5);
  bomb.anims.play('explosion', true);
  player.anims.play('idl', true);
  isGameOver = true;
  scene.time.addEvent({
    delay: 2000,
    callback: function () { gameOverImage.setVisible(true); }
  });
}

function collectStar(player, star) {
  star.disableBody(true, true);
  skor += 1;
  skorText.text = skor;

  if (stars.countActive(true) === 0) {
    stars.children.iterate(function (star) {
      star.enableBody(true, star.x, 0, true, true);
    });

    const x = (player.x > scene.game.canvas.width / 2) ?
      Phaser.Math.Between(0, scene.game.canvas.width / 2) :
      Phaser.Math.Between(scene.game.canvas.width / 2, scene.game.canvas.width);

    sendBomb(bombs, x);
  }

}
document.addEventListener('keyup', function (e) {
  if ((isGameOver || isGameWin) && e.code === 'Space') {
    console.log("restart......");
    game.scene.stop('default');
    isGameOver = false;
    isGameWin = false;
    game.scene.start('default');

  }
  console.log(e);
});


function addButtons(scene) {
  // width: 1366,
  // height: 768,
  //image yerine sprite yapmamızın sebebi getBounds() u çalıştırabilmemiz
  btnRight = scene.add.sprite(1290, 700, 'button')
    .setAlpha(.3);

  btnLeft = scene.add.sprite(1125, 700, 'button')
    .setRotation(180 * Math.PI / 180)
    .setAlpha(.3);
  btnUp = scene.add.sprite(80, 700, 'button')
    .setAlpha(.3)
    .setRotation(-90 * Math.PI / 180);


  btnUp.setInteractive().on('pointerdown', function (pointer, localX, localY, event) {
    isUpDown = true;
  });
  btnUp.setInteractive().on('pointerup', function (pointer, localX, localY, event) {
    isUpDown = false;
  });



  btnLeft.setInteractive().on('pointerdown', function (pointer, localX, localY, event) {
    isLeftDown = true;
  });
  btnLeft.setInteractive().on('pointerup', function (pointer, localX, localY, event) {
    isLeftDown = false;
  });


  btnRight.setInteractive().on('pointerdown', function (pointer, localX, localY, event) {
    isRightDown = true;
  });
  btnRight.setInteractive().on('pointerup', function (pointer, localX, localY, event) {
    isRightDown = false;
  });


}

