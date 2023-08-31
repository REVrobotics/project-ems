import { FieldControlPacket } from '../FieldControl.js';

const RED_BLINKIN_CHANNEL = 0;
const BLUE_BLINKIN_CHANNEL = 1;
const AUDIENCE_BLINKIN_CHANNEL = 2;

export const LED_COLOR_BLACK = 1995;
export const LED_COLOR_YELLOW = 1845;
export const LED_COLOR_WHITE = 1965;
export const LED_COLOR_PURPLE = 1955;
export const LED_COLOR_GREEN = 1885;
export const LED_COLOR_RED = 1805;
export const LED_COLOR_RAINBOW = 1275;
export const LED_COLOR_FIRE = 1215;
export const LED_COLOR_1_HB_SLOW = 1515;
export const LED_COLOR_1_HB_MED = 1525;
export const LED_COLOR_1_HB_FAST = 1535;
export const LED_COLOR_2_HB_SLOW = 1615;
export const LED_COLOR_2_HB_MED = 1625;
export const LED_COLOR_2_HB_FAST = 1635;

export const LED_COLOR_PINK = 1785;
export const LED_COLOR_DARK_RED = 1795;
export const LED_COLOR_RED_ORANGE = 1815;
export const LED_COLOR_ORANGE = 1825;
export const LED_COLOR_GOLD = 1835;
export const LED_COLOR_LAWN_GREEN = 1855;
export const LED_COLOR_LIME = 1865;
export const LED_COLOR_DARK_GREEN = 1875;
export const LED_COLOR_BLUE_GREEN = 1895;
export const LED_COLOR_AQUA = 1905;
export const LED_COLOR_SKY_BLUE = 1915;
export const LED_COLOR_DARK_BLUE = 1925;
export const LED_COLOR_BLUE = 1935;
export const LED_COLOR_BLUE_VIOLET = 1945;
export const LED_COLOR_VIOLET = 1955;
export const LED_COLOR_GRAY = 1975;
export const LED_COLOR_DARK_GRAY = 1985;

export const setLEDPattern = (pulseWidth: number): FieldControlPacket => {
  const packet = LED_EMPTY;
  packet.messages[0].parameters.pulsewidth = pulseWidth;
  packet.messages[1].parameters.pulsewidth = pulseWidth;
  packet.messages[2].parameters.pulsewidth = pulseWidth;
  return packet;
};

export const LED_PRESTART: FieldControlPacket = {
  messages: [
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: RED_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_YELLOW
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: BLUE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_YELLOW
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: AUDIENCE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_YELLOW
      }
    }
  ]
};
export const LED_ALLCLEAR: FieldControlPacket = {
  messages: [
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: RED_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_GREEN
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: BLUE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_GREEN
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: AUDIENCE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_GREEN
      }
    }
  ]
};
export const LED_FIELDFAULT: FieldControlPacket = {
  messages: [
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: RED_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_RED
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: BLUE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_RED
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: AUDIENCE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_RED
      }
    }
  ]
};
export const LED_IDLE: FieldControlPacket = {
  messages: [
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: RED_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_RAINBOW
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: BLUE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_RAINBOW
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: AUDIENCE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_RAINBOW
      }
    }
  ]
};
export const LED_COUNTDOWN: FieldControlPacket = {
  messages: [
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: RED_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_PURPLE
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: BLUE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_PURPLE
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: AUDIENCE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_PURPLE
      }
    }
  ]
};
export const LED_DISABLE: FieldControlPacket = {
  messages: [
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: RED_BLINKIN_CHANNEL,
        pulsewidth: 1995
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: BLUE_BLINKIN_CHANNEL,
        pulsewidth: 1995
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: AUDIENCE_BLINKIN_CHANNEL,
        pulsewidth: 1995
      }
    }
  ]
};

export const LED_CARBON: FieldControlPacket = {
  messages: [
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: RED_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_WHITE
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: BLUE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_WHITE
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: AUDIENCE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_WHITE
      }
    }
  ]
};

export const LED_COOPERTITION: FieldControlPacket = {
  messages: [
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: RED_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_PURPLE
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: BLUE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_PURPLE
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: AUDIENCE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_PURPLE
      }
    }
  ]
};
export const LED_COLOR1_HB_SLOW: FieldControlPacket = {
  messages: [
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: RED_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_1_HB_SLOW
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: BLUE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_1_HB_SLOW
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: AUDIENCE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_1_HB_SLOW
      }
    }
  ]
};
export const LED_COLOR2_HB_SLOW: FieldControlPacket = {
  messages: [
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: RED_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_2_HB_SLOW
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: BLUE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_2_HB_SLOW
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: AUDIENCE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_2_HB_SLOW
      }
    }
  ]
};
export const LED_COLOR1_HB_MED: FieldControlPacket = {
  messages: [
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: RED_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_1_HB_MED
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: BLUE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_1_HB_MED
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: AUDIENCE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_1_HB_MED
      }
    }
  ]
};
export const LED_COLOR2_HB_MED: FieldControlPacket = {
  messages: [
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: RED_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_2_HB_MED
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: BLUE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_2_HB_MED
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: AUDIENCE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_2_HB_MED
      }
    }
  ]
};
export const LED_COLOR1_HB_FAST: FieldControlPacket = {
  messages: [
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: RED_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_1_HB_FAST
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: BLUE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_1_HB_FAST
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: AUDIENCE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_1_HB_FAST
      }
    }
  ]
};
export const LED_COLOR2_HB_FAST: FieldControlPacket = {
  messages: [
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: RED_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_2_HB_FAST
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: BLUE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_2_HB_FAST
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: AUDIENCE_BLINKIN_CHANNEL,
        pulsewidth: LED_COLOR_2_HB_FAST
      }
    }
  ]
};
export const LED_EMPTY: FieldControlPacket = {
  messages: [
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: RED_BLINKIN_CHANNEL
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: BLUE_BLINKIN_CHANNEL
      }
    },
    {
      hub: 0,
      function: 'servo',
      parameters: {
        port: AUDIENCE_BLINKIN_CHANNEL
      }
    }
  ]
};
