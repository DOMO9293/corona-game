export const PLAYER = {
  INITIAL_LIFE: 100,
  JUMP_IMPULSE: 10,
  VELOCITY: 12,
  BOOST_FACTOR: 3,
  BODY_RADIUS: 0.5,
  BODY_LINEAR_DAMPING: 0.3,
  BODY_ANGULAR_DAMPING: 0.9,
  Y_AXIS: 0.75
}

export const CORONA = {
  ORIENTATION_THRESHOLD: 0.5,
  LIFE: 5,
  Y_AXIS: 1,
  SEEK_ALERT_DURATION: 2000,
  PREATTACK_DURATION: 1000,
  ATTACK_DURATION: 200,
  UNDER_ATTACK_DURATION: 300,
  SPAWN_ANIMATION_DURATION: 3000,
  SPAWN_INTERVAL: 7000,
  BODY_RADIUS: 0.5,
  IDLE_VELOCITY: 1 / 50,
  SEEK_VELOCITY: 1 / 30,
  ATTACK_DISTANCE: 2
}

export const GAME = {
  NUMBER_OF_INIT_SPAWNS: 8,
  NUMBER_OF_MAX_SPAWNS: 30,
  INIT_ANIMATION_DURATION: 500,
}

export const COLLISION_GROUP = {
  CORONA: 1,
  TILES: 4,
  BODY: 8,
  CHEST: 16,
  BAT: 32,
}

export const MAP = {
  NUMBER_OF_BBOX: 43
}