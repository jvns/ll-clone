const CONFIG = {
  GAME: {
    WIDTH: 41,
    HEIGHT: Math.floor(window.innerHeight / 20),
    INITIAL_SPEED: 500,
    MIN_SPEED: 300,
    SPEED_DECREASE_RATE: 0.995,
    CYCLIST_Y: Math.floor(window.innerHeight / 40),
    DOUBLE_TAP_TIME: 150, // 300ms window for double-tap
    ANIMATION_FRAMES: {
      WANDERER_WAIT: 20,
      DEATH_SEQUENCE: 15,
    },
    keyPressCount: {
      left: 0,
      right: 0,
    },
  },
  SPAWN_RATES: {
    // TTC: 0.05,
    // TTC_LANE_DEATHMACHINE: 0.8,
    // ONCOMING_DEATHMACHINE: 0.4,
    // PARKED_DEATHMACHINE: 0.2,
    // DOOR_OPENING: 0.4,
    // WANDERER: 0.9,
    // BUILDING: 0.9,
    TTC: 0.02,
    TTC_LANE_DEATHMACHINE: 0.8,
    ONCOMING_DEATHMACHINE: 0.4,
    PARKED_DEATHMACHINE: 0.2,
    DOOR_OPENING: 0.4,
    WANDERER: 0.9,
    BUILDING: 0.9,
  },
  SAFE_DISTANCE: {
    TTC: 8,
    TTC_LANE_DEATHMACHINE: 8,
    ONCOMING_DEATHMACHINE: 8,
    PARKED: 1,
    WANDERER: 3,
    BUILDING: 0,
    TTC_TO_TTC: 20,
    TTC_TO_DEATHMACHINE: 15,
    DEFAULT: 5,
  },
  TTC: {
    STOP_INTERVAL: {
      MIN: 600, // 5 seconds
      MAX: 900, // 10 seconds
    },
    STOP_DURATION: {
      MIN: 380, // 3 seconds
      MAX: 800, // 5 seconds
    },
    DIFFICULTY_LEVELS: {
      HARD: {
        STOP_INTERVAL_MIN: 6, // 5 seconds
        STOP_INTERVAL_MAX: 24, // 15 seconds
        STOP_DURATION_MIN: 2, // 2 seconds
        STOP_DURATION_MAX: 4, // 4 seconds
      },
    },
  },
  LANES: {
    ONCOMING: 1,
    DIVIDER: 7,
    TRACKS: 10,
    BIKE: 17,
    BIKE_RIGHT: 18,
    PARKED: 20,
    SIDEWALK: 28,
    BUILDINGS: 31,
  },
  KILLERLANES: {
    KILLERTRACK1: 10,
    KILLERTRACK2: 14,
  },

  ANIMATIONS: {
    DOOR_OPEN_DURATION: 100,
    DOOR_OPEN_DELAY: 25,
    DEATH_DURATION: 1500,
    SCREEN_SHAKE_DURATION: 1500,
  },

  MOVEMENT: {
    JUMP_AMOUNT: 3,
    JUMP_DELAY_DURATION: 1,
    BASE_MOVE_SPEED: 1,
    BIKE_SPEED: 0.1,
    WANDERER_SPEED: 0.5,
    LANE_CHANGE_SPEED: 2.5, // New speed just for lane changes
  },
  // SPEED: {
  //   DEFAULT: 1,
  //   WORLD: 2,
  //   MOVINGTRAFFIC: 3
  // },
  COLLISION: {
    ADJACENT_LANE_THRESHOLD: 1,
    NEARBY_ENTITY_RADIUS: 2,
    BUILDING_OVERLAP_THRESHOLD: 0.1,
  },
  SPAWNING: {
    PARKED_DEATHMACHINE_DOOR_CHANCE: 0.3,
    PARKED_DEATHMACHINE_MIN_Y: 0.2,
    PARKED_DEATHMACHINE_MAX_Y: 0.3,
    BUILDING_RESPAWN_COOLDOWN: 100,
    MIN_BUILDING_HEIGHT: -20,
  },
  PARTICLES: {
    MAX_DEATH_PARTICLES: 20,
    PARTICLE_SPREAD: 2,
    PARTICLE_SPEED: 0.5,
  },
  PROBABILITIES: {
    PARKING: 0.01,
    GAP: 0.6,
    DOOR_OPENING: 0.3,
  },
  DIMENSIONS: {
    DOOR: {
      WIDTHS: [0, 0.8, 1, 1.5, 1.8],
      HEIGHTS: [0.8, 1.8],
    },
  },
  INPUT: {
    TOUCH: {
      SENSITIVITY: 1.0,
      DRAG_THRESHOLD: 10,
      TAP_DURATION: 200,
    },
    // KEYBOARD: {
    //   REPEAT_DELAY: 200,
    //   REPEAT_RATE: 50,
    // },
  },
  DIFFICULTY: {
    LEVELS: {
      EASY: { speedMultiplier: 0.8, spawnRateMultiplier: 0.7 },
      NORMAL: { speedMultiplier: 1.0, spawnRateMultiplier: 1.0 },
      HARD: { speedMultiplier: 1.2, spawnRateMultiplier: 1.3 },
    },
  },
  AUDIO: {
    VOLUME: {
      MASTER: 1.0,
      EFFECTS: 0.8,
      MUSIC: 0.6,
    },
    EFFECTS: {
      COLLISION_DURATION: 300,
    },
  },
  TIMINGS: {
    ANIMATION_FRAME: 1000 / 60, // ~16.67ms for 60fps
    MESSAGE_DISPLAY: 1500,
    SPAWN_CHECK_INTERVAL: 100,
  },

  BOUNDARIES: {
    MIN_X: 0,
    MAX_X: 40,
    MIN_Y: -10,
    MAX_Y: null, // Set dynamically based on window height
    OFFSCREEN_BUFFER: 5,
  },

  GAMEPLAY: {
    SCORE_MULTIPLIER: 1,
    BASE_DIFFICULTY: 1.0,
    DIFFICULTY_INCREASE_RATE: 0.01,
    MAX_DIFFICULTY: 2.0,
  },
};

const DOOR_STATES = {
  CLOSED: 0,
  OPENING_1: 1,
  OPENING_2: 2,
  OPENING_3: 3,
  FULLY_OPEN: 4,
};

class DarlingType {
  static TTC = "TTC";
  static TTC_LANE_DEATHMACHINE = "TTC_LANE_DEATHMACHINE";
  static ONCOMING_DEATHMACHINE = "ONCOMING_DEATHMACHINE";
  static PARKED_DEATHMACHINE = "PARKED_DEATHMACHINE";
  static WANDERER = "WANDERER";
  static BUILDING = "BUILDING";
  static BIKE = "BIKE";
}

