class PongGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.scoreDisplay = document.getElementById('score-display');
    this.startButton = document.getElementById('startButton');
    this.instructions = document.getElementById('instructions');

    // Game state
    this.isPlaying = false;
    this.isPaused = false;
    this.scores = { left: 0, right: 0 };
    this.lastTime = 0;
    
    // Constants
    this.PADDLE_WIDTH = 10;
    this.PADDLE_HEIGHT = 100;
    this.BALL_SIZE = 10;
    this.PADDLE_SPEED = 0.4;
    this.INITIAL_BALL_SPEED = 0.3;
    this.BALL_SPEED_INCREASE = 1.1;
    
    // Game objects
    this.ball = {
      x: 0,
      y: 0,
      velocityX: 0,
      velocityY: 0,
      speed: this.INITIAL_BALL_SPEED
    };
    
    this.paddles = {
      left: {
        x: 0,
        y: 0,
        velocity: 0
      },
      right: {
        x: 0,
        y: 0,
        velocity: 0
      }
    };

    // Bind methods
    this.start = this.start.bind(this);
    this.pause = this.pause.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
    this.resizeCanvas = this.resizeCanvas.bind(this);

    // Event listeners
    this.startButton.addEventListener('click', this.start);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.resizeCanvas);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P') this.pause();
    });

    // Initial setup
    this.resizeCanvas();
    this.resetBall();
  }

  resizeCanvas() {
    const container = document.getElementById('game-container');
    const width = container.clientWidth;
    const height = width * (9/16);
    
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Update paddle positions after resize
    this.paddles.left.x = this.PADDLE_WIDTH * 2;
    this.paddles.right.x = this.canvas.width - this.PADDLE_WIDTH * 3;
    
    if (!this.isPlaying) {
      this.resetPositions();
      this.draw();
    }
  }

  resetBall() {
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;
    this.ball.speed = this.INITIAL_BALL_SPEED;
    
    // Random initial direction
    const angle = (Math.random() * Math.PI/4) - Math.PI/8;
    const direction = Math.random() < 0.5 ? 1 : -1;
    
    this.ball.velocityX = Math.cos(angle) * this.ball.speed * direction;
    this.ball.velocityY = Math.sin(angle) * this.ball.speed;
  }

  resetPositions() {
    this.paddles.left.y = (this.canvas.height - this.PADDLE_HEIGHT) / 2;
    this.paddles.right.y = (this.canvas.height - this.PADDLE_HEIGHT) / 2;
    this.paddles.left.velocity = 0;
    this.paddles.right.velocity = 0;
    this.resetBall();
  }

  start() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.scores.left = 0;
      this.scores.right = 0;
      this.updateScore();
      this.resetPositions();
      this.startButton.style.display = 'none';
      this.instructions.style.display = 'none';
      this.lastTime = performance.now();
      requestAnimationFrame(this.gameLoop);
    }
  }

  pause() {
    if (this.isPlaying) {
      this.isPaused = !this.isPaused;
      if (!this.isPaused) {
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop);
      }
    }
  }

  handleKeyDown(e) {
    if (!this.isPlaying || this.isPaused) return;
    
    switch(e.key) {
      case 'w':
      case 'W':
        this.paddles.left.velocity = -this.PADDLE_SPEED;
        break;
      case 's':
      case 'S':
        this.paddles.left.velocity = this.PADDLE_SPEED;
        break;
      case 'ArrowUp':
        this.paddles.right.velocity = -this.PADDLE_SPEED;
        break;
      case 'ArrowDown':
        this.paddles.right.velocity = this.PADDLE_SPEED;
        break;
    }
  }

  handleKeyUp(e) {
    if (!this.isPlaying) return;
    
    switch(e.key) {
      case 'w':
      case 'W':
      case 's':
      case 'S':
        this.paddles.left.velocity = 0;
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        this.paddles.right.velocity = 0;
        break;
    }
  }

  updateScore() {
    this.scoreDisplay.textContent = `${this.scores.left} - ${this.scores.right}`;
  }

  checkWinner() {
    if (this.scores.left >= 10 || this.scores.right >= 10) {
      this.isPlaying = false;
      const winner = this.scores.left >= 10 ? 'Left' : 'Right';
      this.startButton.textContent = 'Play Again';
      this.startButton.style.display = 'block';
      this.instructions.style.display = 'block';
    }
  }

  update(deltaTime) {
    // Update paddle positions
    for (const paddle of [this.paddles.left, this.paddles.right]) {
      paddle.y += paddle.velocity * deltaTime;
      paddle.y = Math.max(0, Math.min(this.canvas.height - this.PADDLE_HEIGHT, paddle.y));
    }

    // Update ball position
    this.ball.x += this.ball.velocityX * deltaTime;
    this.ball.y += this.ball.velocityY * deltaTime;

    // Ball collision with top and bottom
    if (this.ball.y <= 0 || this.ball.y >= this.canvas.height) {
      this.ball.velocityY = -this.ball.velocityY;
    }

    // Ball collision with paddles
    const paddles = [
      { x: this.paddles.left.x, y: this.paddles.left.y },
      { x: this.paddles.right.x, y: this.paddles.right.y }
    ];

    for (const paddle of paddles) {
      if (this.ball.x >= paddle.x && this.ball.x <= paddle.x + this.PADDLE_WIDTH &&
          this.ball.y >= paddle.y && this.ball.y <= paddle.y + this.PADDLE_HEIGHT) {
        
        this.ball.velocityX = -this.ball.velocityX;
        this.ball.speed *= this.BALL_SPEED_INCREASE;
        
        // Adjust angle based on where ball hits paddle
        const hitPosition = (this.ball.y - paddle.y) / this.PADDLE_HEIGHT;
        this.ball.velocityY = (hitPosition - 0.5) * 2 * this.ball.speed;
        
        break;
      }
    }

    // Scoring
    if (this.ball.x <= 0) {
      this.scores.right++;
      this.updateScore();
      this.resetBall();
      this.checkWinner();
    } else if (this.ball.x >= this.canvas.width) {
      this.scores.left++;
      this.updateScore();
      this.resetBall();
      this.checkWinner();
    }
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw center line
    this.ctx.setLineDash([5, 15]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Draw paddles
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(this.paddles.left.x, this.paddles.left.y, 
                     this.PADDLE_WIDTH, this.PADDLE_HEIGHT);
    this.ctx.fillRect(this.paddles.right.x, this.paddles.right.y, 
                     this.PADDLE_WIDTH, this.PADDLE_HEIGHT);

    // Draw ball
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.BALL_SIZE / 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  gameLoop(currentTime) {
    if (!this.isPlaying || this.isPaused) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.draw();

    requestAnimationFrame(this.gameLoop);
  }
}

// Initialize the game
const game = new PongGame();