import React, { useRef, useEffect, useState } from 'react'
import { Card, Button, Typography, Space, Alert, message, Segmented } from 'antd'
import { RocketOutlined, TrophyOutlined, PlayCircleOutlined, PauseCircleOutlined, RedoOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

// 游戏主逻辑接口与结构
interface PlayerTank {
  x: number
  y: number
  size: number
  speed: number
  angle: number
  hp: number
  maxHp: number
  lastShotTime: number
  shootCooldown: number
  superModeTime: number // 暴走模式剩余时间(ms)
}

interface EnemyTank {
  id: number
  x: number
  y: number
  size: number
  speed: number
  angle: number
  hp: number
  maxHp: number
  lastShotTime: number
  shootCooldown: number
  direction: 'up' | 'down' | 'left' | 'right'
  lastDirChangeTime: number
  dirChangeInterval: number
}

interface Bullet {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  isPlayer: boolean
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  life: number
  maxLife: number
}

interface FloatText {
  x: number
  y: number
  text: string
  alpha: number
  life: number
}

interface DropItem {
  x: number
  y: number
  size: number
  type: 'heal' | 'super' // heal: 回血龙蛋, super: 暴走星星
}

const TankGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // React 状态控制菜单层展示
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover'>('idle')
  const [score, setScore] = useState(0)
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal')
  const [playerMaxHp, setPlayerMaxHp] = useState(3)
  const [playerHp, setPlayerHp] = useState(3)

  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('nailong_tank_high_score_normal') || localStorage.getItem('nailong_tank_high_score') || '0', 10)
  })

  // 物理与循环变量
  const stateRef = useRef({
    gameState: 'idle' as 'idle' | 'playing' | 'paused' | 'gameover',
    difficulty: 'normal' as 'easy' | 'normal' | 'hard',
    score: 0,
    player: {
      x: 300,
      y: 200,
      size: 20,
      speed: 4, // 玩家基础移速提升至 4，使其更灵敏轻盈
      angle: 0,
      hp: 3,
      maxHp: 3,
      lastShotTime: 0,
      shootCooldown: 350,
      superModeTime: 0,
    } as PlayerTank,
    bullets: [] as Bullet[],
    enemies: [] as EnemyTank[],
    particles: [] as Particle[],
    floatTexts: [] as FloatText[],
    dropItems: [] as DropItem[],
    keys: {} as { [key: string]: boolean },
    canvasWidth: 600,
    canvasHeight: 400,
    enemySpawnTimer: 0,
    enemySpawnInterval: 2500,
    nextEnemyId: 1,
    screenShake: 0,
    lastTime: 0,
  })

  // 按键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']
      if (keys.includes(e.code)) {
        e.preventDefault()
      }
      stateRef.current.keys[e.code] = true
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.code] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // 核心游戏主循环
  useEffect(() => {
    let animationId: number

    const updateAndRender = (time: number) => {
      const state = stateRef.current
      const dt = time - state.lastTime
      state.lastTime = time

      if (state.gameState === 'playing') {
        updateGame(dt)
      }

      renderGame()
      animationId = requestAnimationFrame(updateAndRender)
    }

    animationId = requestAnimationFrame(updateAndRender)
    return () => cancelAnimationFrame(animationId)
  }, [])

  // 监听 React 状态更新物理层状态
  useEffect(() => {
    stateRef.current.gameState = gameState
  }, [gameState])

  // 处理难度切换，同步高分
  const handleDifficultyChange = (value: string) => {
    const diff = value as 'easy' | 'normal' | 'hard'
    setDifficulty(diff)
    const key = `nailong_tank_high_score_${diff}`
    const storedScore = localStorage.getItem(key)

    if (storedScore !== null) {
      setHighScore(parseInt(storedScore, 10))
    } else if (diff === 'normal') {
      const legacyScore = localStorage.getItem('nailong_tank_high_score')
      setHighScore(legacyScore ? parseInt(legacyScore, 10) : 0)
    } else {
      setHighScore(0)
    }
  }

  // 开始新游戏
  const handleStartGame = () => {
    const state = stateRef.current
    state.score = 0
    state.difficulty = difficulty

    const maxHp = difficulty === 'easy' ? 5 : 3
    state.player = {
      x: 300,
      y: 200,
      size: 20,
      speed: 4, //Snappy speed
      angle: -Math.PI / 2, // 默认初始朝上
      hp: maxHp,
      maxHp: maxHp,
      lastShotTime: 0,
      shootCooldown: 350,
      superModeTime: 0,
    }
    state.bullets = []
    state.enemies = []
    state.particles = []
    state.floatTexts = []
    state.dropItems = []
    state.enemySpawnTimer = 0
    state.enemySpawnInterval = difficulty === 'easy' ? 3500 : (difficulty === 'hard' ? 1500 : 2500)
    state.screenShake = 0
    state.lastTime = performance.now()

    setScore(0)
    setPlayerHp(maxHp)
    setPlayerMaxHp(maxHp)
    setGameState('playing')
  }

  // 暂停/继续切换
  const handleTogglePause = () => {
    if (gameState === 'playing') {
      setGameState('paused')
    } else if (gameState === 'paused') {
      stateRef.current.lastTime = performance.now()
      setGameState('playing')
    }
  }

  // 保存最高分
  const saveHighScore = () => {
    const state = stateRef.current
    const key = `nailong_tank_high_score_${state.difficulty}`
    let currentHighScore = parseInt(localStorage.getItem(key) || '0', 10)

    if (state.difficulty === 'normal' && !localStorage.getItem(key)) {
      const legacyScore = parseInt(localStorage.getItem('nailong_tank_high_score') || '0', 10)
      currentHighScore = Math.max(currentHighScore, legacyScore)
    }

    if (state.score > currentHighScore) {
      setHighScore(state.score)
      localStorage.setItem(key, String(state.score))
      if (state.difficulty === 'normal') {
        localStorage.setItem('nailong_tank_high_score', String(state.score))
      }
    }
  }

  // 物理引擎逻辑更新
  const updateGame = (dt: number) => {
    const state = stateRef.current
    const player = state.player
    const keys = state.keys

    // 屏幕阻尼衰减
    if (state.screenShake > 0) {
      state.screenShake -= 0.1 * (dt / 16.6)
    }

    // 暴走状态计时
    if (player.superModeTime > 0) {
      player.superModeTime -= dt
    }

    // 玩家移动控制 — 实现严格的坦克大战上下左右四方向操作，消除斜向行走的笨重滞后感
    let moveDir: 'up' | 'down' | 'left' | 'right' | null = null

    if (keys['KeyW'] || keys['ArrowUp']) moveDir = 'up'
    else if (keys['KeyS'] || keys['ArrowDown']) moveDir = 'down'
    else if (keys['KeyA'] || keys['ArrowLeft']) moveDir = 'left'
    else if (keys['KeyD'] || keys['ArrowRight']) moveDir = 'right'

    if (moveDir) {
      if (moveDir === 'up') {
        player.y -= player.speed
        player.angle = -Math.PI / 2
      } else if (moveDir === 'down') {
        player.y += player.speed
        player.angle = Math.PI / 2
      } else if (moveDir === 'left') {
        player.x -= player.speed
        player.angle = Math.PI
      } else if (moveDir === 'right') {
        player.x += player.speed
        player.angle = 0
      }

      player.x = Math.max(player.size, Math.min(state.canvasWidth - player.size, player.x))
      player.y = Math.max(player.size, Math.min(state.canvasHeight - player.size, player.y))
    }

    // 玩家射击控制
    const now = performance.now()
    const activeCooldown = player.superModeTime > 0 ? player.shootCooldown / 2 : player.shootCooldown
    if (keys['Space'] && now - player.lastShotTime > activeCooldown) {
      player.lastShotTime = now

      if (player.superModeTime > 0) {
        const baseAngle = player.angle
        const angles = [baseAngle - 0.25, baseAngle, baseAngle + 0.25]
        angles.forEach((ang) => {
          state.bullets.push({
            x: player.x + Math.cos(baseAngle) * (player.size + 10),
            y: player.y + Math.sin(baseAngle) * (player.size + 10),
            vx: Math.cos(ang) * 6,
            vy: Math.sin(ang) * 6,
            size: 4,
            isPlayer: true,
          })
        })
      } else {
        state.bullets.push({
          x: player.x + Math.cos(player.angle) * (player.size + 10),
          y: player.y + Math.sin(player.angle) * (player.size + 10),
          vx: Math.cos(player.angle) * 6,
          vy: Math.sin(player.angle) * 6,
          size: 4,
          isPlayer: true,
        })
      }
    }

    // 根据不同难度，设置敌人参数
    let enemySpawnMinInterval = 1200
    let speedRange = { min: 1.0, max: 1.5 }
    let shootCooldownRange = { min: 2000, max: 3500 }
    let pursueProbability = 0.5 // 转向时追踪玩家的几率

    if (state.difficulty === 'easy') {
      enemySpawnMinInterval = 1800
      speedRange = { min: 0.7, max: 1.0 }
      shootCooldownRange = { min: 3000, max: 5000 }
      pursueProbability = 0.3
    } else if (state.difficulty === 'hard') {
      enemySpawnMinInterval = 800
      speedRange = { min: 1.4, max: 1.9 }
      shootCooldownRange = { min: 1200, max: 2200 }
      pursueProbability = 0.8
    }

    // 敌人生成逻辑
    state.enemySpawnTimer += dt
    const initialInterval = state.difficulty === 'easy' ? 3500 : (state.difficulty === 'hard' ? 1500 : 2500)
    if (state.enemySpawnTimer > state.enemySpawnInterval) {
      state.enemySpawnTimer = 0

      state.enemySpawnInterval = Math.max(
        enemySpawnMinInterval,
        initialInterval - Math.floor(state.score / 800) * 200
      )

      let ex = 0
      let ey = 0
      const side = Math.floor(Math.random() * 4)
      const margin = 20

      if (side === 0) {
        ex = Math.random() * state.canvasWidth
        ey = -margin
      } else if (side === 1) {
        ex = state.canvasWidth + margin
        ey = Math.random() * state.canvasHeight
      } else if (side === 2) {
        ex = Math.random() * state.canvasWidth
        ey = state.canvasHeight + margin
      } else {
        ex = -margin
        ey = Math.random() * state.canvasHeight
      }

      state.enemies.push({
        id: state.nextEnemyId++,
        x: ex,
        y: ey,
        size: 18,
        speed: speedRange.min + Math.random() * (speedRange.max - speedRange.min),
        angle: Math.PI / 2, // 默认先朝下
        hp: 1,
        maxHp: 1,
        lastShotTime: now,
        shootCooldown: shootCooldownRange.min + Math.random() * (shootCooldownRange.max - shootCooldownRange.min),
        direction: 'down',
        lastDirChangeTime: now,
        dirChangeInterval: 1000 + Math.random() * 1500, // 每隔 1.0 - 2.5 秒改变一次方向
      })
    }

    // 敌方移动与射击控制 — 改造成经典红白机坦克大战的行列对齐式移动，避免“全向斜角追踪玩家”的过强追踪
    state.enemies.forEach((enemy) => {
      const timeSinceChange = now - enemy.lastDirChangeTime
      let hitBorder = false

      // 预判边界碰撞，撞墙强制转弯
      if (enemy.direction === 'up' && enemy.y - enemy.size <= 2) hitBorder = true
      else if (enemy.direction === 'down' && enemy.y + enemy.size >= state.canvasHeight - 2) hitBorder = true
      else if (enemy.direction === 'left' && enemy.x - enemy.size <= 2) hitBorder = true
      else if (enemy.direction === 'right' && enemy.x + enemy.size >= state.canvasWidth - 2) hitBorder = true

      // 到达改变方向周期 或 撞到边缘时，重置并选择新的卡点轴方向
      if (timeSinceChange > enemy.dirChangeInterval || hitBorder) {
        enemy.lastDirChangeTime = now
        enemy.dirChangeInterval = 1000 + Math.random() * 1500

        const dx = player.x - enemy.x
        const dy = player.y - enemy.y

        // 决策概率：一定几率追踪玩家所在的行列，否则选择随机方向徘徊，给玩家躲闪和背身突袭的空档
        const decideToPursue = Math.random() < pursueProbability

        if (decideToPursue) {
          // 比较 x 和 y 方向的绝对差距，挑选更大的偏角方向进行转弯对齐
          if (Math.abs(dx) > Math.abs(dy)) {
            enemy.direction = dx > 0 ? 'right' : 'left'
          } else {
            enemy.direction = dy > 0 ? 'down' : 'up'
          }
        } else {
          // 纯粹的经典坦克大战随机漫游转向
          const dirs: ('up' | 'down' | 'left' | 'right')[] = ['up', 'down', 'left', 'right']
          enemy.direction = dirs[Math.floor(Math.random() * 4)]
        }
      }

      // 严格按照横平竖直的正交网络格子坐标前行，更新旋转角度
      if (enemy.direction === 'up') {
        enemy.y -= enemy.speed
        enemy.angle = -Math.PI / 2
      } else if (enemy.direction === 'down') {
        enemy.y += enemy.speed
        enemy.angle = Math.PI / 2
      } else if (enemy.direction === 'left') {
        enemy.x -= enemy.speed
        enemy.angle = Math.PI
      } else if (enemy.direction === 'right') {
        enemy.x += enemy.speed
        enemy.angle = 0
      }

      // 敌方边缘纠正，防止出界
      enemy.x = Math.max(enemy.size, Math.min(state.canvasWidth - enemy.size, enemy.x))
      enemy.y = Math.max(enemy.size, Math.min(state.canvasHeight - enemy.size, enemy.y))

      // 敌方自动开火逻辑优化 — 只有当行（或列）与玩家在通道上基本对齐（误差35px内）且正面面向玩家时，才发射子弹
      const xDiff = Math.abs(player.x - enemy.x)
      const yDiff = Math.abs(player.y - enemy.y)
      let isFacingPlayer = false

      if (enemy.direction === 'up' && player.y < enemy.y && xDiff < 35) isFacingPlayer = true
      else if (enemy.direction === 'down' && player.y > enemy.y && xDiff < 35) isFacingPlayer = true
      else if (enemy.direction === 'left' && player.x < enemy.x && yDiff < 35) isFacingPlayer = true
      else if (enemy.direction === 'right' && player.x > enemy.x && yDiff < 35) isFacingPlayer = true

      if (isFacingPlayer && now - enemy.lastShotTime > enemy.shootCooldown) {
        enemy.lastShotTime = now
        state.bullets.push({
          // 发射子弹位置随当前炮管方向微调
          x: enemy.x + Math.cos(enemy.angle) * (enemy.size + 8),
          y: enemy.y + Math.sin(enemy.angle) * (enemy.size + 8),
          vx: Math.cos(enemy.angle) * 4.2, // 还原正向子弹物理方向速度
          vy: Math.sin(enemy.angle) * 4.2,
          size: 4.5,
          isPlayer: false,
        })
      }
    })

    // 子弹移动
    state.bullets = state.bullets.filter((bullet) => {
      bullet.x += bullet.vx
      bullet.y += bullet.vy
      return (
        bullet.x >= -10 &&
        bullet.x <= state.canvasWidth + 10 &&
        bullet.y >= -10 &&
        bullet.y <= state.canvasHeight + 10
      )
    })

    // 碰撞检测：子弹击中坦克
    state.bullets = state.bullets.filter((bullet) => {
      let bulletRetained = true

      if (bullet.isPlayer) {
        state.enemies.forEach((enemy) => {
          if (!bulletRetained) return
          const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y)
          if (dist < enemy.size + bullet.size) {
            enemy.hp -= 1
            bulletRetained = false

            if (enemy.hp <= 0) {
              state.score += 100
              setScore(state.score)

              // 生成道具 (20% 几率)
              if (Math.random() < 0.20) {
                const itemType = Math.random() < 0.65 ? 'heal' : 'super'
                state.dropItems.push({
                  x: enemy.x,
                  y: enemy.y,
                  size: 12,
                  type: itemType,
                })
              }

              state.floatTexts.push({
                x: enemy.x,
                y: enemy.y - 10,
                text: '+100',
                alpha: 1.0,
                life: 600,
              })

              const particleColors = ['#ff9829', '#ffd6b3', '#fffcf0']
              for (let i = 0; i < 15; i++) {
                const pAngle = Math.random() * Math.PI * 2
                const pSpeed = 1 + Math.random() * 3
                state.particles.push({
                  x: enemy.x,
                  y: enemy.y,
                  vx: Math.cos(pAngle) * pSpeed,
                  vy: Math.sin(pAngle) * pSpeed,
                  size: 2 + Math.random() * 3,
                  color: particleColors[Math.floor(Math.random() * particleColors.length)],
                  alpha: 1.0,
                  life: 0,
                  maxLife: 400 + Math.random() * 300,
                })
              }
            }
          }
        })
      } else {
        const dist = Math.hypot(bullet.x - player.x, bullet.y - player.y)
        if (dist < player.size + bullet.size) {
          player.hp -= 1
          setPlayerHp(player.hp)
          bulletRetained = false
          state.screenShake = 4.0

          for (let i = 0; i < 8; i++) {
            const pAngle = Math.random() * Math.PI * 2
            const pSpeed = 0.5 + Math.random() * 2
            state.particles.push({
              x: player.x,
              y: player.y,
              vx: Math.cos(pAngle) * pSpeed,
              vy: Math.sin(pAngle) * pSpeed,
              size: 2 + Math.random() * 2,
              color: '#ff6270',
              alpha: 1.0,
              life: 0,
              maxLife: 300 + Math.random() * 200,
            })
          }

          state.floatTexts.push({
            x: player.x,
            y: player.y - 12,
            text: 'HP -1',
            alpha: 1.0,
            life: 600,
          })

          if (player.hp <= 0) {
            setGameState('gameover')
            saveHighScore()
          }
        }
      }

      return bulletRetained
    })

    // 碰撞检测：捡起道具
    state.dropItems = state.dropItems.filter((item) => {
      const dist = Math.hypot(item.x - player.x, item.y - player.y)
      const collides = dist < player.size + item.size

      if (collides) {
        if (item.type === 'heal') {
          player.hp = Math.min(player.maxHp, player.hp + 1)
          setPlayerHp(player.hp)
          state.floatTexts.push({
            x: player.x,
            y: player.y - 12,
            text: 'HP +1 🥚',
            alpha: 1.0,
            life: 800,
          })
          message.success('捡到龙蛋，生命值 +1！🥚')
        } else {
          player.superModeTime = 6000
          state.floatTexts.push({
            x: player.x,
            y: player.y - 12,
            text: '暴走 🌟',
            alpha: 1.0,
            life: 1000,
          })
          message.warning('暴走星星！触发三向散射火力！⭐')
        }

        for (let i = 0; i < 10; i++) {
          const pAngle = Math.random() * Math.PI * 2
          const pSpeed = 1 + Math.random() * 2
          state.particles.push({
            x: item.x,
            y: item.y,
            vx: Math.cos(pAngle) * pSpeed,
            vy: Math.sin(pAngle) * pSpeed,
            size: 3,
            color: item.type === 'heal' ? '#6ed13d' : '#ffcd29',
            alpha: 1.0,
            life: 0,
            maxLife: 400,
          })
        }
      }

      return !collides
    })

    // 坦克车身直接冲撞检测
    state.enemies = state.enemies.filter((enemy) => {
      const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y)
      if (dist < player.size + enemy.size) {
        player.hp -= 1
        setPlayerHp(player.hp)
        state.screenShake = 3.5

        for (let i = 0; i < 12; i++) {
          const pAngle = Math.random() * Math.PI * 2
          const pSpeed = 1 + Math.random() * 2
          state.particles.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(pAngle) * pSpeed,
            vy: Math.sin(pAngle) * pSpeed,
            size: 2,
            color: '#ff6270',
            alpha: 1.0,
            life: 0,
            maxLife: 400,
          })
        }

        if (player.hp <= 0) {
          setGameState('gameover')
          saveHighScore()
        }
        return false
      }
      return true
    })

    // 更新爆炸粒子
    state.particles = state.particles.filter((p) => {
      p.x += p.vx
      p.y += p.vy
      p.life += dt
      p.alpha = Math.max(0, 1.0 - p.life / p.maxLife)
      return p.life < p.maxLife
    })

    // 更新浮动加分文字
    state.floatTexts = state.floatTexts.filter((t) => {
      t.y -= 0.5 * (dt / 16.6)
      t.life -= dt
      t.alpha = Math.max(0, t.life / 600)
      return t.life > 0
    })
  }

  // 绘图核心渲染逻辑
  const renderGame = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const state = stateRef.current

    ctx.save()
    ctx.clearRect(0, 0, state.canvasWidth, state.canvasHeight)

    if (state.screenShake > 0) {
      const dx = (Math.random() - 0.5) * state.screenShake * 2
      const dy = (Math.random() - 0.5) * state.screenShake * 2
      ctx.translate(dx, dy)
    }

    // 1. 绘制背景网格
    ctx.fillStyle = '#fffdfa'
    ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight)

    ctx.strokeStyle = '#fff2e6'
    ctx.lineWidth = 1
    const gridSize = 40
    for (let x = 0; x < state.canvasWidth; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, state.canvasHeight)
      ctx.stroke()
    }
    for (let y = 0; y < state.canvasHeight; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(state.canvasWidth, y)
      ctx.stroke()
    }

    // 2. 绘制掉落的道具
    state.dropItems.forEach((item) => {
      ctx.save()
      ctx.translate(item.x, item.y)
      if (item.type === 'heal') {
        ctx.fillStyle = '#f6ffed'
        ctx.strokeStyle = '#6ed13d'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.ellipse(0, 0, item.size * 0.8, item.size, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = '#6ed13d'
        ctx.beginPath()
        ctx.arc(-2, -3, 2, 0, Math.PI * 2)
        ctx.arc(3, 2, 1.5, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillStyle = '#ffcd29'
        ctx.beginPath()
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(Math.cos(((18 + i * 72) * Math.PI) / 180) * item.size, -Math.sin(((18 + i * 72) * Math.PI) / 180) * item.size)
          ctx.lineTo(Math.cos(((54 + i * 72) * Math.PI) / 180) * (item.size * 0.4), -Math.sin(((54 + i * 72) * Math.PI) / 180) * (item.size * 0.4))
        }
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()
    })

    // 3. 绘制玩家坦克
    if (gameState !== 'gameover') {
      const player = state.player
      ctx.save()
      ctx.translate(player.x, player.y)
      ctx.rotate(player.angle)

      if (player.superModeTime > 0) {
        ctx.strokeStyle = 'rgba(255, 205, 41, 0.4)'
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.arc(0, 0, player.size + 4, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.fillStyle = '#604c46'
      ctx.beginPath()
      ctx.roundRect(-player.size * 0.9, -player.size * 1.1, player.size * 1.8, player.size * 0.4, 4)
      ctx.roundRect(-player.size * 0.9, player.size * 0.7, player.size * 1.8, player.size * 0.4, 4)
      ctx.fill()

      ctx.fillStyle = '#ff9829'
      ctx.beginPath()
      ctx.roundRect(-player.size, -player.size * 0.8, player.size * 2, player.size * 1.6, 6)
      ctx.fill()

      ctx.fillStyle = '#ffcd29'
      ctx.beginPath()
      ctx.arc(player.size * 0.1, 0, player.size * 0.75, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#ff9829'
      ctx.beginPath()
      ctx.arc(-player.size * 0.2, -player.size * 0.4, 4, 0, Math.PI * 2)
      ctx.arc(-player.size * 0.2, player.size * 0.4, 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(player.size * 0.3, -player.size * 0.2, 5, 0, Math.PI * 2)
      ctx.arc(player.size * 0.3, player.size * 0.2, 5, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(player.size * 0.38, -player.size * 0.2, 2.5, 0, Math.PI * 2)
      ctx.arc(player.size * 0.38, player.size * 0.2, 2.5, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#ff6270'
      ctx.beginPath()
      ctx.roundRect(player.size * 0.4, -4, player.size * 0.8, 8, 2)
      ctx.fill()

      ctx.restore()
    }

    // 4. 绘制敌方坦克
    state.enemies.forEach((enemy) => {
      ctx.save()
      ctx.translate(enemy.x, enemy.y)
      ctx.rotate(enemy.angle)

      ctx.fillStyle = '#3a2d28'
      ctx.beginPath()
      ctx.roundRect(-enemy.size * 0.9, -enemy.size * 1.1, enemy.size * 1.8, enemy.size * 0.4, 4)
      ctx.roundRect(-enemy.size * 0.9, enemy.size * 0.7, enemy.size * 1.8, enemy.size * 0.4, 4)
      ctx.fill()

      ctx.fillStyle = '#604c46'
      ctx.beginPath()
      ctx.roundRect(-enemy.size, -enemy.size * 0.8, enemy.size * 2, enemy.size * 1.6, 6)
      ctx.fill()

      ctx.fillStyle = '#4a362f'
      ctx.beginPath()
      ctx.arc(0, 0, enemy.size * 0.65, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#ff6270'
      ctx.beginPath()
      ctx.arc(enemy.size * 0.2, -enemy.size * 0.2, 3, 0, Math.PI * 2)
      ctx.arc(enemy.size * 0.2, enemy.size * 0.2, 3, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#3a2d28'
      ctx.beginPath()
      ctx.roundRect(enemy.size * 0.3, -3, enemy.size * 0.9, 6, 2)
      ctx.fill()

      ctx.restore()
    })

    // 5. 绘制子弹
    state.bullets.forEach((bullet) => {
      ctx.save()
      ctx.translate(bullet.x, bullet.y)
      ctx.fillStyle = bullet.isPlayer ? '#ffcd29' : '#ff6270'
      ctx.beginPath()
      ctx.arc(0, 0, bullet.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

    // 6. 绘制粒子
    state.particles.forEach((p) => {
      ctx.save()
      ctx.globalAlpha = p.alpha
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

    // 7. 绘制浮动文字
    state.floatTexts.forEach((t) => {
      ctx.save()
      ctx.globalAlpha = t.alpha
      ctx.fillStyle = t.text.includes('+') ? '#ff9829' : '#ff6270'
      ctx.font = 'bold 15px Courier New, monospace'
      ctx.fillText(t.text, t.x, t.y)
      ctx.restore()
    })

    ctx.restore()
  }

  // 动态生命指示器
  const renderEggLife = () => {
    const eggs = []
    for (let i = 0; i < playerMaxHp; i++) {
      eggs.push(
        <span key={i} style={{ fontSize: 24, filter: i < playerHp ? 'none' : 'grayscale(100%)', opacity: i < playerHp ? 1.0 : 0.25, transition: 'all 0.3s ease' }}>
          🥚
        </span>
      )
    }
    return eggs
  }

  return (
    <div style={{ maxWidth: 850, margin: '0 auto' }}>
      <Card
        title={
          <span style={{ fontWeight: 700, color: '#4a362f', display: 'flex', alignItems: 'center', gap: 8 }}>
            <RocketOutlined /> 奶龙坦克大战小游戏
          </span>
        }
        className="nailong-card"
        style={{ borderRadius: 16 }}
      >
        <div style={{ marginBottom: 16 }}>
          <Alert
            message="坦克大战操作说明"
            description="使用 W, A, S, D 键（或键盘方向键）控制呆萌的奶龙坦克进行移动避让，按下 Space 键（空格）进行开火射击！击毁敌人有概率掉落龙蛋（回血）或能量星星（暴走多发子弹）。"
            type="info"
            showIcon
            style={{
              borderRadius: 12,
              backgroundColor: '#fffdf4',
              borderColor: '#ffe8cc',
              borderWidth: '1.5px',
            }}
          />
        </div>

        {/* 顶部统计信息与血量指示器 */}
        <div
          style={{
            background: '#fffdfa',
            padding: '12px 24px',
            borderRadius: 12,
            border: '1.5px solid #ffe8cc',
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#4a362f',
          }}
        >
          {/* 血条 */}
          <div>
            <span style={{ fontSize: 13, color: '#88746a', fontWeight: 600, marginRight: 8 }}>奶龙战力蛋:</span>
            {renderEggLife()}
          </div>

          {/* 分数 */}
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            <span>当前积分: </span>
            <span style={{ color: '#ff9829', fontFamily: 'Courier New, monospace', fontSize: 20 }}>{score}</span>
          </div>

          {/* 最高分 */}
          <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrophyOutlined style={{ color: '#ffcd29' }} />
            <span>最高分 ({difficulty === 'easy' ? '简单' : difficulty === 'hard' ? '困难' : '普通'}): </span>
            <span style={{ color: '#4a362f', fontFamily: 'Courier New, monospace', fontSize: 16 }}>{highScore}</span>
          </div>
        </div>

        {/* 游戏面板核心图 */}
        <div style={{ position: 'relative', width: 600, height: 400, margin: '0 auto', borderRadius: 16, overflow: 'hidden', border: '2px solid #ffe8cc', boxShadow: '0 4px 12px rgba(255,152,41,0.05)' }}>

          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            style={{ display: 'block', background: '#fffdfa' }}
          />

          {/* 1. idle 状态层 */}
          {gameState === 'idle' && (
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(253, 249, 244, 0.9)', backdropFilter: 'blur(4px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontSize: 72, marginBottom: 12 }} className="animate-wiggle">🦖</span>
              <Title level={3} style={{ color: '#4a362f', fontWeight: 800, margin: '0 0 16px 0' }}>奶龙大战恐龙大亨</Title>

              {/* 增加难度段选控制器 */}
              <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 700, color: '#4a362f', fontSize: 14 }}>游戏难度:</span>
                <Segmented
                  value={difficulty}
                  onChange={(value) => handleDifficultyChange(value)}
                  options={[
                    { label: '简单', value: 'easy' },
                    { label: '普通', value: 'normal' },
                    { label: '困难', value: 'hard' }
                  ]}
                  style={{
                    background: '#fff2e6',
                    padding: '2px',
                    borderRadius: 8,
                    border: '1px solid #ffe8cc'
                  }}
                />
              </div>

              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={handleStartGame}
                style={{
                  borderRadius: 24, height: 48, padding: '0 32px', fontSize: 16, fontWeight: 700,
                  background: '#ff9829', borderColor: '#ff9829', boxShadow: '0 4px 12px rgba(255, 152, 41, 0.2)'
                }}
              >
                开始游戏
              </Button>
            </div>
          )}

          {/* 2. paused 状态层 */}
          {gameState === 'paused' && (
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(74, 54, 47, 0.4)', backdropFilter: 'blur(3px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <Title level={2} style={{ color: '#ffffff', fontWeight: 800, margin: '0 0 20px 0' }}>游戏已暂停</Title>
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={handleTogglePause}
                style={{
                  borderRadius: 24, height: 48, padding: '0 32px', fontSize: 16, fontWeight: 700,
                  background: '#ff9829', borderColor: '#ff9829'
                }}
              >
                继续游戏
              </Button>
            </div>
          )}

          {/* 3. gameover 状态层 */}
          {gameState === 'gameover' && (
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(253, 249, 244, 0.95)', backdropFilter: 'blur(4px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontSize: 72, marginBottom: 12 }}>💥</span>
              <Title level={2} style={{ color: '#ff6270', fontWeight: 800, margin: '0 0 10px 0' }}>游戏结束 🦖</Title>
              <Text style={{ fontSize: 16, fontWeight: 600, color: '#4a362f', marginBottom: 24 }}>
                您本次拿到了 <span style={{ color: '#ff9829', fontSize: 24, fontFamily: 'Courier New, monospace', fontWeight: 800 }}>{score}</span> 分！
              </Text>
              <Button
                type="primary"
                size="large"
                icon={<RedoOutlined />}
                onClick={handleStartGame}
                style={{
                  borderRadius: 24, height: 48, padding: '0 32px', fontSize: 16, fontWeight: 700,
                  background: '#ff9829', borderColor: '#ff9829', boxShadow: '0 4px 12px rgba(255, 152, 41, 0.2)'
                }}
              >
                重新开始
              </Button>
            </div>
          )}
        </div>

        {/* 底部按钮控制板 */}
        {gameState !== 'idle' && gameState !== 'gameover' && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Space>
              <Button
                icon={gameState === 'paused' ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                onClick={handleTogglePause}
                style={{ borderRadius: 16, fontWeight: 600, borderColor: '#ff9829', color: '#ff9829' }}
              >
                {gameState === 'paused' ? '恢复游戏' : '暂停游戏'}
              </Button>
              <Button
                icon={<RedoOutlined />}
                onClick={handleStartGame}
                style={{ borderRadius: 16, fontWeight: 600 }}
              >
                重新开始
              </Button>
            </Space>
          </div>
        )}
      </Card>
    </div>
  )
}

export default TankGame