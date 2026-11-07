import type {SenseiLesson} from './senseiLessons';

/** Original full-board ladder and supporting-stone comparison. */
export const LADDER_LESSON: SenseiLesson = {
  "id": "ladders",
  "title": "Ladders & Reading",
  "beats": [
    {
      "title": "Read the Whole Ladder",
      "mood": "happy",
      "board": [
        ".........",
        "..X......",
        ".XO......",
        ".X.......",
        ".........",
        ".........",
        ".........",
        ".........",
        "........."
      ],
      "button": "Begin",
      "text": "A **ladder** repeatedly puts a running chain in atari. Read the zigzag to its end and check nearby stones before starting. Follow this concrete example as both Black and White; glowing points guide the sequence, so this is a demonstration rather than an independent test."
    },
    {
      "title": "Black’s Atari 1",
      "mood": "excited",
      "board": [
        ".........",
        "..X......",
        ".XO......",
        ".X.......",
        ".........",
        ".........",
        ".........",
        ".........",
        "........."
      ],
      "taps": [
        {
          "x": 3,
          "y": 2
        }
      ],
      "studentColor": "black",
      "text": "White’s chain has **two liberties**. **Tap the marked point** to give atari. Check the remaining liberty before advancing."
    },
    {
      "title": "White’s Extension 1",
      "mood": "happy",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".X.......",
        ".........",
        ".........",
        ".........",
        ".........",
        "........."
      ],
      "taps": [
        {
          "x": 2,
          "y": 3
        }
      ],
      "studentColor": "white",
      "text": "White is in atari. **Tap its remaining liberty** to extend. White could instead sacrifice the chain; we are tracing the attempt to save it by running."
    },
    {
      "title": "Black’s Atari 2",
      "mood": "excited",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".XO......",
        ".........",
        ".........",
        ".........",
        ".........",
        "........."
      ],
      "taps": [
        {
          "x": 2,
          "y": 4
        }
      ],
      "studentColor": "black",
      "text": "White’s chain has **two liberties**. **Tap the marked point** to give atari. Check the remaining liberty before advancing."
    },
    {
      "title": "White’s Extension 2",
      "mood": "happy",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".XO......",
        "..X......",
        ".........",
        ".........",
        ".........",
        "........."
      ],
      "taps": [
        {
          "x": 3,
          "y": 3
        }
      ],
      "studentColor": "white",
      "text": "White is in atari. **Tap its remaining liberty** to extend. White could instead sacrifice the chain; we are tracing the attempt to save it by running."
    },
    {
      "title": "Black’s Atari 3",
      "mood": "excited",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".XOO.....",
        "..X......",
        ".........",
        ".........",
        ".........",
        "........."
      ],
      "taps": [
        {
          "x": 4,
          "y": 3
        }
      ],
      "studentColor": "black",
      "text": "White’s chain has **two liberties**. **Tap the marked point** to give atari. Check the remaining liberty before advancing."
    },
    {
      "title": "White’s Extension 3",
      "mood": "happy",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".XOOX....",
        "..X......",
        ".........",
        ".........",
        ".........",
        "........."
      ],
      "taps": [
        {
          "x": 3,
          "y": 4
        }
      ],
      "studentColor": "white",
      "text": "White is in atari. **Tap its remaining liberty** to extend. White could instead sacrifice the chain; we are tracing the attempt to save it by running."
    },
    {
      "title": "Black’s Atari 4",
      "mood": "excited",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".XOOX....",
        "..XO.....",
        ".........",
        ".........",
        ".........",
        "........."
      ],
      "taps": [
        {
          "x": 3,
          "y": 5
        }
      ],
      "studentColor": "black",
      "text": "White’s chain has **two liberties**. **Tap the marked point** to give atari. Check the remaining liberty before advancing."
    },
    {
      "title": "White’s Extension 4",
      "mood": "happy",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".XOOX....",
        "..XO.....",
        "...X.....",
        ".........",
        ".........",
        "........."
      ],
      "taps": [
        {
          "x": 4,
          "y": 4
        }
      ],
      "studentColor": "white",
      "text": "White is in atari. **Tap its remaining liberty** to extend. White could instead sacrifice the chain; we are tracing the attempt to save it by running."
    },
    {
      "title": "Black’s Atari 5",
      "mood": "excited",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".XOOX....",
        "..XOO....",
        "...X.....",
        ".........",
        ".........",
        "........."
      ],
      "taps": [
        {
          "x": 5,
          "y": 4
        }
      ],
      "studentColor": "black",
      "text": "White’s chain has **two liberties**. **Tap the marked point** to give atari. Check the remaining liberty before advancing."
    },
    {
      "title": "White’s Extension 5",
      "mood": "happy",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".XOOX....",
        "..XOOX...",
        "...X.....",
        ".........",
        ".........",
        "........."
      ],
      "taps": [
        {
          "x": 4,
          "y": 5
        }
      ],
      "studentColor": "white",
      "text": "White is in atari. **Tap its remaining liberty** to extend. White could instead sacrifice the chain; we are tracing the attempt to save it by running."
    },
    {
      "title": "Black’s Atari 6",
      "mood": "excited",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".XOOX....",
        "..XOOX...",
        "...XO....",
        ".........",
        ".........",
        "........."
      ],
      "taps": [
        {
          "x": 4,
          "y": 6
        }
      ],
      "studentColor": "black",
      "text": "White’s chain has **two liberties**. **Tap the marked point** to give atari. Check the remaining liberty before advancing."
    },
    {
      "title": "White’s Extension 6",
      "mood": "happy",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".XOOX....",
        "..XOOX...",
        "...XO....",
        "....X....",
        ".........",
        "........."
      ],
      "taps": [
        {
          "x": 5,
          "y": 5
        }
      ],
      "studentColor": "white",
      "text": "White is in atari. **Tap its remaining liberty** to extend. White could instead sacrifice the chain; we are tracing the attempt to save it by running."
    },
    {
      "title": "Black’s Atari 7",
      "mood": "excited",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".XOOX....",
        "..XOOX...",
        "...XOO...",
        "....X....",
        ".........",
        "........."
      ],
      "taps": [
        {
          "x": 6,
          "y": 5
        }
      ],
      "studentColor": "black",
      "text": "White’s chain has **two liberties**. **Tap the marked point** to give atari. Check the remaining liberty before advancing."
    },
    {
      "title": "White’s Extension 7",
      "mood": "happy",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".XOOX....",
        "..XOOX...",
        "...XOOX..",
        "....X....",
        ".........",
        "........."
      ],
      "taps": [
        {
          "x": 5,
          "y": 6
        }
      ],
      "studentColor": "white",
      "text": "White is in atari. **Tap its remaining liberty** to extend. White could instead sacrifice the chain; we are tracing the attempt to save it by running."
    },
    {
      "title": "Black’s Atari 8",
      "mood": "excited",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".XOOX....",
        "..XOOX...",
        "...XOOX..",
        "....XO...",
        ".........",
        "........."
      ],
      "taps": [
        {
          "x": 5,
          "y": 7
        }
      ],
      "studentColor": "black",
      "text": "White’s chain has **two liberties**. **Tap the marked point** to give atari. Check the remaining liberty before advancing."
    },
    {
      "title": "White’s Extension 8",
      "mood": "happy",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".XOOX....",
        "..XOOX...",
        "...XOOX..",
        "....XO...",
        ".....X...",
        "........."
      ],
      "taps": [
        {
          "x": 6,
          "y": 6
        }
      ],
      "studentColor": "white",
      "text": "White is in atari. **Tap its remaining liberty** to extend. White could instead sacrifice the chain; we are tracing the attempt to save it by running."
    },
    {
      "title": "Black’s Atari 9",
      "mood": "excited",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".XOOX....",
        "..XOOX...",
        "...XOOX..",
        "....XOO..",
        ".....X...",
        "........."
      ],
      "taps": [
        {
          "x": 7,
          "y": 6
        }
      ],
      "studentColor": "black",
      "text": "White’s chain has **two liberties**. **Tap the marked point** to give atari. Check the remaining liberty before advancing."
    },
    {
      "title": "White’s Extension 9",
      "mood": "happy",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".XOOX....",
        "..XOOX...",
        "...XOOX..",
        "....XOOX.",
        ".....X...",
        "........."
      ],
      "taps": [
        {
          "x": 6,
          "y": 7
        }
      ],
      "studentColor": "white",
      "text": "White is in atari. **Tap its remaining liberty** to extend. White could instead sacrifice the chain; we are tracing the attempt to save it by running."
    },
    {
      "title": "Black’s Atari 10",
      "mood": "excited",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".XOOX....",
        "..XOOX...",
        "...XOOX..",
        "....XOOX.",
        ".....XO..",
        "........."
      ],
      "taps": [
        {
          "x": 6,
          "y": 8
        }
      ],
      "studentColor": "black",
      "text": "White’s chain has **two liberties**. **Tap the marked point** to give atari. Check the remaining liberty before advancing."
    },
    {
      "title": "White’s Extension 10",
      "mood": "happy",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".XOOX....",
        "..XOOX...",
        "...XOOX..",
        "....XOOX.",
        ".....XO..",
        "......X.."
      ],
      "taps": [
        {
          "x": 7,
          "y": 7
        }
      ],
      "studentColor": "white",
      "text": "White is in atari. **Tap its remaining liberty** to extend. White could instead sacrifice the chain; we are tracing the attempt to save it by running."
    },
    {
      "title": "Black’s Atari 11",
      "mood": "excited",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".XOOX....",
        "..XOOX...",
        "...XOOX..",
        "....XOOX.",
        ".....XOO.",
        "......X.."
      ],
      "taps": [
        {
          "x": 8,
          "y": 7
        }
      ],
      "studentColor": "black",
      "text": "White’s chain has **two liberties**. **Tap the marked point** to give atari. Check the remaining liberty before advancing."
    },
    {
      "title": "White’s Extension 11",
      "mood": "happy",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".XOOX....",
        "..XOOX...",
        "...XOOX..",
        "....XOOX.",
        ".....XOOX",
        "......X.."
      ],
      "taps": [
        {
          "x": 7,
          "y": 8
        }
      ],
      "studentColor": "white",
      "text": "White is in atari. **Tap its remaining liberty** to extend. White could instead sacrifice the chain; we are tracing the attempt to save it by running."
    },
    {
      "title": "The Final Liberty",
      "mood": "excited",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".XOOX....",
        "..XOOX...",
        "...XOOX..",
        "....XOOX.",
        ".....XOOX",
        "......XO."
      ],
      "taps": [
        {
          "x": 8,
          "y": 8
        }
      ],
      "studentColor": "black",
      "text": "White’s chain now has **one liberty** at the corner. **Tap to capture**."
    },
    {
      "title": "Twelve Stones Captured",
      "mood": "proud",
      "board": [
        ".........",
        "..X......",
        ".X.X.....",
        ".X..X....",
        "..X..X...",
        "...X..X..",
        "....X..X.",
        ".....X..X",
        "......X.X"
      ],
      "button": "Add a ladder breaker",
      "text": "Black captured **twelve White stones**. In this position the repeated ataris reach the corner. This result belongs to this board: an extra stone along the path may change it."
    },
    {
      "title": "Spot the Breaker",
      "mood": "happy",
      "board": [
        ".........",
        "..X......",
        ".XO......",
        ".X.......",
        ".........",
        ".........",
        "......O..",
        ".........",
        "........."
      ],
      "button": "Trace the same chase",
      "text": "White now has an extra stone farther down the diagonal. Before chasing, ask whether the running chain can connect to it. A **ladder breaker** matters only if the actual sequence reaches useful support."
    },
    {
      "title": "The Chain Connects",
      "mood": "excited",
      "board": [
        ".........",
        "..X......",
        ".XOX.....",
        ".XOOX....",
        "..XOOX...",
        "...XOOX..",
        "....XOO..",
        ".........",
        "........."
      ],
      "button": "Finish",
      "text": "After the same first seven ataris and extensions, White connects to the extra stone. The chain now has **three liberties**. Black can no longer continue this same pattern of immediate ataris. This does **not** prove White alive or rule out other attacks."
    },
    {
      "title": "Read Before Chasing",
      "mood": "proud",
      "button": "Return to Study Room",
      "text": "Count liberties at every step. Check captures and supporting stones, not just the expected running move. Re-read whenever the board changes. A remembered ladder shape is a starting point for reading, not a guarantee."
    }
  ]
};
