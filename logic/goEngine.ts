
import { Intersection, Player, Point, RuleSet, DetailedScores } from '../types';

export const createEmptyBoard = (size: number): Intersection[][] => 
  Array.from({ length: size }, () => Array(size).fill(null));

export const getBoardString = (board: Intersection[][]): string => 
  board.map(row => row.map(cell => cell || '.').join('')).join('');

export const getNeighborsFixed = (p: Point, size: number): Point[] => {
  const neighbors: Point[] = [];
  if (p.x > 0) neighbors.push({ x: p.x - 1, y: p.y });
  if (p.x < size - 1) neighbors.push({ x: p.x + 1, y: p.y });
  if (p.y > 0) neighbors.push({ x: p.x, y: p.y - 1 });
  if (p.y < size - 1) neighbors.push({ x: p.x, y: p.y + 1 });
  return neighbors;
};

export const findGroup = (board: Intersection[][], p: Point): { group: Point[], color: Player } | null => {
  const size = board.length;
  if (p.y < 0 || p.y >= size || p.x < 0 || p.x >= size) return null;
  
  const color = board[p.y][p.x];
  if (!color) return null;

  const group: Point[] = [];
  const visited = new Set<string>();
  const stack: Point[] = [p];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const key = `${current.x},${current.y}`;
    if (visited.has(key)) continue;
    
    if (board[current.y][current.x] === color) {
      visited.add(key);
      group.push(current);
      stack.push(...getNeighborsFixed(current, size));
    }
  }

  return { group, color };
};

export const getLiberties = (board: Intersection[][], group: Point[]): Set<string> => {
  const size = board.length;
  const liberties = new Set<string>();
  group.forEach(p => {
    getNeighborsFixed(p, size).forEach(n => {
      if (board[n.y][n.x] === null) {
        liberties.add(`${n.x},${n.y}`);
      }
    });
  });
  return liberties;
};

export const getAllGroups = (board: Intersection[][]): { group: Point[], color: Player }[] => {
  const size = board.length;
  const visited = new Set<string>();
  const result: { group: Point[], color: Player }[] = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const color = board[y][x];
      const key = `${x},${y}`;
      if (color && !visited.has(key)) {
        const groupInfo = findGroup(board, { x, y });
        if (groupInfo) {
          result.push(groupInfo);
          groupInfo.group.forEach(p => visited.add(`${p.x},${p.y}`));
        }
      }
    }
  }
  return result;
};

export const getAtariPoints = (board: Intersection[][]): Set<string> => {
  const groups = getAllGroups(board);
  const atariPoints = new Set<string>();
  groups.forEach(g => {
    const liberties = getLiberties(board, g.group);
    if (liberties.size === 1) {
      atariPoints.add(liberties.values().next().value);
    }
  });
  return atariPoints;
};

/**
 * Checks for a "True Eye". 
 * A space is a true eye if opponent cannot capture it or reduce it.
 * Account for enclosed territories (controlledPointsSet) in diagonal checks.
 */
export const isTrueEye = (board: Intersection[][], p: Point, color: Player, controlledPointsSet: Set<string> = new Set()): boolean => {
  const size = board.length;
  if (board[p.y][p.x] !== null) return false;

  const neighbors = getNeighborsFixed(p, size);
  if (neighbors.length === 0) return false;

  // Orthogonal neighbors must all be the same color
  for (const n of neighbors) {
    if (board[n.y][n.x] !== color) return false;
  }

  // Diagonal support check (3/4 for center, 2/2 for edge, 1/1 for corner)
  const diagonalCoords = [
    { x: p.x - 1, y: p.y - 1 },
    { x: p.x + 1, y: p.y - 1 },
    { x: p.x - 1, y: p.y + 1 },
    { x: p.x + 1, y: p.y + 1 },
  ];

  let totalDiagonals = 0;
  let controlled = 0;

  for (const d of diagonalCoords) {
    if (d.x >= 0 && d.x < size && d.y >= 0 && d.y < size) {
      totalDiagonals++;
      const key = `${d.x},${d.y}`;
      // Controlled if occupied by color or if it's an enclosed point of the same color
      if (board[d.y][d.x] === color || controlledPointsSet.has(key)) {
        controlled++;
      }
    }
  }

  if (totalDiagonals === 4) return controlled >= 3;
  if (totalDiagonals === 2) return controlled === 2;
  if (totalDiagonals === 1) return controlled === 1;
  return false;
};

/**
 * Finds all groups and eye points part of an immortal enclosure.
 * A structural enclosure connects stones via shared territories, correctly
 * recognizing life in non-strictly-adjacent groups.
 */
const getImmortalComponents = (board: Intersection[][]): { points: Set<string>, eyes: Set<string> } => {
  const immortalPoints = new Set<string>();
  const immortalEyes = new Set<string>();
  const size = board.length;

  (['black', 'white'] as Player[]).forEach(color => {
    const stones: Point[] = [];
    const stoneToIdx = new Map<string, number>();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board[y][x] === color) {
          stoneToIdx.set(`${x},${y}`, stones.length);
          stones.push({ x, y });
        }
      }
    }
    if (stones.length === 0) return;

    // 1. Partition empty intersections into contiguous regions
    const globalVisited = new Set<string>();
    const regions: { points: Point[], neighbors: Set<string>, id: string }[] = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const key = `${x},${y}`;
        if (board[y][x] === null && !globalVisited.has(key)) {
          const regionPoints: Point[] = [];
          const neighbors = new Set<string>();
          const stack: Point[] = [{ x, y }];
          const regionVisited = new Set<string>();
          while (stack.length > 0) {
            const curr = stack.pop()!;
            const k = `${curr.x},${curr.y}`;
            if (regionVisited.has(k)) continue;
            regionVisited.add(k);
            globalVisited.add(k);
            regionPoints.push(curr);
            getNeighborsFixed(curr, size).forEach(n => {
              if (board[n.y][n.x] === null) stack.push(n);
              else neighbors.add(`${n.x},${n.y}`);
            });
          }
          regions.push({ points: regionPoints, neighbors, id: `reg-${x}-${y}` });
        }
      }
    }

    // 2. Filter for regions completely surrounded by 'color'
    const controlledRegions = regions.filter(r => {
      if (r.neighbors.size === 0) return false;
      for (const nKey of r.neighbors) {
        const [nx, ny] = nKey.split(',').map(Number);
        if (board[ny][nx] !== color) return false;
      }
      return true;
    });

    const controlledPointsSet = new Set<string>();
    controlledRegions.forEach(r => r.points.forEach(p => controlledPointsSet.add(`${p.x},${p.y}`)));

    // 3. Define valid eye units (True eyes or enclosed territories)
    const eyeUnits = controlledRegions.filter(r => {
      if (r.points.length === 1) return isTrueEye(board, r.points[0], color, controlledPointsSet);
      return true; 
    });

    if (eyeUnits.length < 2) return;

    // 4. Build Structural Connectivity Graph
    const adj = Array.from({ length: stones.length }, () => new Set<number>());
    
    // a) Orthogonal adjacency
    stones.forEach((s, i) => {
      getNeighborsFixed(s, size).forEach(n => {
        const ni = stoneToIdx.get(`${n.x},${n.y}`);
        if (ni !== undefined) {
          adj[i].add(ni);
          adj[ni].add(i);
        }
      });
    });

    // b) Territorial adjacency (links diagonal or loose stones enclosing same space)
    controlledRegions.forEach(r => {
      const borderingIndices: number[] = [];
      r.neighbors.forEach(nKey => {
        const idx = stoneToIdx.get(nKey);
        if (idx !== undefined) borderingIndices.push(idx);
      });
      if (borderingIndices.length > 1) {
        const first = borderingIndices[0];
        for (let j = 1; j < borderingIndices.length; j++) {
          adj[first].add(borderingIndices[j]);
          adj[borderingIndices[j]].add(first);
        }
      }
    });

    // 5. Detect structural stone components
    const stoneInComponent = new Int32Array(stones.length).fill(-1);
    let compId = 0;
    for (let i = 0; i < stones.length; i++) {
      if (stoneInComponent[i] === -1) {
        const stack = [i];
        stoneInComponent[i] = compId;
        while (stack.length > 0) {
          const curr = stack.pop()!;
          adj[curr].forEach(next => {
            if (stoneInComponent[next] === -1) {
              stoneInComponent[next] = compId;
              stack.push(next);
            }
          });
        }
        compId++;
      }
    }

    // 6. Map components to bordering eye units
    const componentToEyes = Array.from({ length: compId }, () => new Set<string>());
    eyeUnits.forEach(u => {
      u.neighbors.forEach(nKey => {
        const sIdx = stoneToIdx.get(nKey);
        if (sIdx !== undefined) {
          componentToEyes[stoneInComponent[sIdx]].add(u.id);
        }
      });
    });

    // 7. Mark as Immortal if bordering 2+ eye units
    for (let c = 0; c < compId; c++) {
      if (componentToEyes[c].size >= 2) {
        stones.forEach((s, i) => {
          if (stoneInComponent[i] === c) immortalPoints.add(`${s.x},${s.y}`);
        });
        componentToEyes[c].forEach(uId => {
          const unit = eyeUnits.find(u => u.id === uId);
          unit?.points.forEach(p => immortalEyes.add(`${p.x},${p.y}`));
        });
      }
    }
  });

  return { points: immortalPoints, eyes: immortalEyes };
};

export const getImmortalEyePoints = (board: Intersection[][]): Set<string> => {
  return getImmortalComponents(board).eyes;
};

export const getImmortalPoints = (board: Intersection[][]): Set<string> => {
  return getImmortalComponents(board).points;
};

export const countEyes = (board: Intersection[][], group: Point[], color: Player): number => {
    const liberties = getLiberties(board, group);
    let count = 0;
    for (const libStr of liberties) {
        const [lx, ly] = libStr.split(',').map(Number);
        if (isTrueEye(board, { x: lx, y: ly }, color)) {
            count++;
        }
    }
    return count;
};

export const isInsideEnemyTerritory = (board: Intersection[][], group: Point[], color: Player): boolean => {
    const size = board.length;
    const opponent = color === 'black' ? 'white' : 'black';
    
    const tempBoard = board.map(row => [...row]);
    group.forEach(p => { tempBoard[p.y][p.x] = null; });
    
    const p = group[0];
    const visited = new Set<string>();
    const stack: Point[] = [p];
    const borderingColors = new Set<Player>();
    const edgePointsTouched = new Set<string>();
    
    while(stack.length > 0) {
        const curr = stack.pop()!;
        const key = `${curr.x},${curr.y}`;
        if (visited.has(key)) continue;
        visited.add(key);

        if (curr.x === 0 || curr.x === size - 1 || curr.y === 0 || curr.y === size - 1) {
            edgePointsTouched.add(key);
        }
        
        const neighbors = getNeighborsFixed(curr, size);
        for(const n of neighbors) {
            const occ = tempBoard[n.y][n.x];
            if (occ === null) {
                stack.push(n);
            } else {
                borderingColors.add(occ);
            }
        }
    }
    
    const totalEdgeIntersections = (size * 4) - 4;
    
    if (borderingColors.size === 1 && borderingColors.has(opponent)) {
        if (edgePointsTouched.size > totalEdgeIntersections * 0.4) {
            return false;
        }
        return true;
    }
    
    return false;
};

export const guessDeadStones = (board: Intersection[][]): Set<string> => {
    let deadStones = new Set<string>();
    const immortalPoints = getImmortalPoints(board);

    let changed = true;
    while (changed) {
        changed = false;
        // Create a virtual board where already-marked dead stones are replaced with empty space
        const virtualBoard = board.map((row, y) => 
            row.map((cell, x) => deadStones.has(`${x},${y}`) ? null : cell)
        );

        const groups = getAllGroups(virtualBoard);
        for (const g of groups) {
            const firstKey = `${g.group[0].x},${g.group[0].y}`;
            if (immortalPoints.has(firstKey)) continue;
            if (deadStones.has(firstKey)) continue;

            const eyes = countEyes(virtualBoard, g.group, g.color);

            let isDead = false;
            
            // Refinement: Stones remaining in Atari are NOT automatically marked as dead.
            // They are considered safe by default in the auto-scoring guess unless they are 
            // enclosed within enemy territory with insufficient eyes.
            
            // 1. Surrounded/Eye Check
            if (eyes < 2) {
                if (isInsideEnemyTerritory(virtualBoard, g.group, g.color)) {
                    isDead = true;
                }
            }

            if (isDead) {
                g.group.forEach(p => {
                    const key = `${p.x},${p.y}`;
                    if (!deadStones.has(key)) {
                        deadStones.add(key);
                        changed = true;
                    }
                });
            }
        }
    }

    return deadStones;
};

export const hasAtLeastOneEye = (board: Intersection[][], group: Point[], color: Player): boolean => {
  const liberties = getLiberties(board, group);
  for (const libStr of liberties) {
    const [lx, ly] = libStr.split(',').map(Number);
    if (isTrueEye(board, { x: lx, y: ly }, color)) return true;
  }
  return false;
};

export const getGroupedPoints = (board: Intersection[][]): { black: Set<string>, white: Set<string> } => {
  const groups = getAllGroups(board);
  const result = { black: new Set<string>(), white: new Set<string>() };
  groups.forEach(g => {
    if (g.group.length > 1) {
      g.group.forEach(p => {
        const key = `${p.x},${p.y}`;
        if (g.color === 'black') result.black.add(key);
        else result.white.add(key);
      });
    }
  });
  return result;
};

export const getDetailedTerritoryMap = (board: Intersection[][], sekiPoints: Set<string> = new Set()): Map<string, Player> => {
  const size = board.length;
  const visited = new Set<string>();
  const territoryMap = new Map<string, Player>();

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const key = `${x},${y}`;
      if (board[y][x] === null && !visited.has(key)) {
        const region: Point[] = [];
        const stack: Point[] = [{ x, y }];
        const borderingColors = new Set<Player>();
        const regionVisited = new Set<string>();
        
        while (stack.length > 0) {
          const curr = stack.pop()!;
          const currKey = `${curr.x},${curr.y}`;
          if (regionVisited.has(currKey)) continue;
          
          regionVisited.add(currKey);
          region.push(curr);
          
          const neighbors = getNeighborsFixed(curr, size);
          for (const n of neighbors) {
            const occupant = board[n.y][n.x];
            if (occupant === null) {
              stack.push(n);
            } else {
              borderingColors.add(occupant);
            }
          }
        }
        
        region.forEach(p => visited.add(`${p.x},${p.y}`));
        
        if (borderingColors.size === 1) {
          const owner = borderingColors.values().next().value;
          region.forEach(p => {
            const rKey = `${p.x},${p.y}`;
            // Seki points are neutral — they count for neither player. Unsettled
            // groups are the players' to resolve, not the scorer's to discount.
            if (!sekiPoints.has(rKey)) {
              territoryMap.set(rKey, owner);
            }
          });
        }
      }
    }
  }

  return territoryMap;
};

export const calculateTerritory = (board: Intersection[][], sekiPoints: Set<string> = new Set()): { black: number, white: number } => {
  const tMap = getDetailedTerritoryMap(board, sekiPoints);
  let blackTerritory = 0;
  let whiteTerritory = 0;
  tMap.forEach(owner => {
    if (owner === 'black') blackTerritory++;
    else whiteTerritory++;
  });
  return { black: blackTerritory, white: whiteTerritory };
};

export const checkCaptures = (board: Intersection[][], lastMove: Point, player: Player): { newBoard: Intersection[][], captureCount: number } => {
  const size = board.length;
  const opponent = player === 'black' ? 'white' : 'black';
  let newBoard = board.map(row => [...row]);
  let totalCaptures = 0;

  const neighbors = getNeighborsFixed(lastMove, size);
  const checkedGroups = new Set<string>();

  neighbors.forEach(n => {
    if (newBoard[n.y][n.x] === opponent) {
      const groupInfo = findGroup(newBoard, n);
      if (groupInfo) {
        const groupKey = groupInfo.group.map(p => `${p.x},${p.y}`).sort().join('|');
        if (!checkedGroups.has(groupKey)) {
          checkedGroups.add(groupKey);
          const liberties = getLiberties(newBoard, groupInfo.group);
          if (liberties.size === 0) {
            totalCaptures += groupInfo.group.length;
            groupInfo.group.forEach(p => {
              newBoard[p.y][p.x] = null;
            });
          }
        }
      }
    }
  });

  return { newBoard, captureCount: totalCaptures };
};

export const isSelfCapture = (board: Intersection[][], p: Point, color: Player): boolean => {
  const size = board.length;
  const tempBoard = board.map(row => [...row]);
  tempBoard[p.y][p.x] = color;
  
  const opponent = color === 'black' ? 'white' : 'black';
  const neighbors = getNeighborsFixed(p, size);
  
  for (const n of neighbors) {
    if (tempBoard[n.y][n.x] === opponent) {
      const groupInfo = findGroup(tempBoard, n);
      if (groupInfo) {
        if (getLiberties(tempBoard, groupInfo.group).size === 0) return false;
      }
    }
  }

  const groupInfo = findGroup(tempBoard, p);
  if (groupInfo && getLiberties(tempBoard, groupInfo.group).size === 0) {
    return true;
  }
  
  return false;
};

export const calculateScores = (
  board: Intersection[][], 
  captures: { black: number, white: number },
  komi: number,
  reverseKomi: number = 0,
  deadStones: Set<string> = new Set(),
  ruleset: RuleSet = 'japanese',
  sekiPoints: Set<string> = new Set(),
  includeDeadAsPrisoners: boolean = true,
  blackPenalties: number = 0,
  whitePenalties: number = 0,
  includeTerritory: boolean = true
): DetailedScores => {
  const size = board.length;
  const virtualBoard = board.map(row => [...row]);
  const extraCaptures = { black: 0, white: 0 };

  deadStones.forEach(key => {
    const [x, y] = key.split(',').map(Number);
    if (x >= 0 && x < size && y >= 0 && y < size) {
        const stone = board[y][x];
        if (stone === 'black') extraCaptures.white++;
        if (stone === 'white') extraCaptures.black++;
        virtualBoard[y][x] = null;
    }
  });

  let blackStones = 0;
  let whiteStones = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (virtualBoard[y][x] === 'black') blackStones++;
      if (virtualBoard[y][x] === 'white') whiteStones++;
    }
  }

  const territory = includeTerritory
    ? calculateTerritory(virtualBoard, ruleset === 'japanese' ? sekiPoints : new Set())
    : { black: 0, white: 0 };
  
  const finalCapturesBlack = ruleset === 'japanese' 
    ? captures.black + (includeDeadAsPrisoners ? extraCaptures.black : 0) 
    : 0;
  const finalCapturesWhite = ruleset === 'japanese' 
    ? captures.white + (includeDeadAsPrisoners ? extraCaptures.white : 0) 
    : 0;

  const blackTotal = (ruleset === 'chinese' 
    ? blackStones + territory.black + reverseKomi
    : territory.black + finalCapturesBlack + reverseKomi) - blackPenalties;

  const whiteTotal = (ruleset === 'chinese'
    ? whiteStones + territory.white + komi
    : territory.white + finalCapturesWhite + komi) - whitePenalties;

  return {
    black: {
      stones: blackStones,
      territory: territory.black,
      captures: finalCapturesBlack,
      komi: 0,
      reverseKomi: reverseKomi,
      penalties: blackPenalties,
      total: blackTotal
    },
    white: {
      stones: whiteStones,
      territory: territory.white,
      captures: finalCapturesWhite,
      komi: komi,
      reverseKomi: 0,
      penalties: whitePenalties,
      total: whiteTotal
    }
  };
};

export const getHoshiPoints = (size: number): Point[] => {
  if (size === 9) {
    return [{ x: 2, y: 2 }, { x: 6, y: 2 }, { x: 4, y: 4 }, { x: 2, y: 6 }, { x: 6, y: 6 }];
  } else if (size === 13) {
    return [{ x: 3, y: 3 }, { x: 9, y: 3 }, { x: 6, y: 3 }, { x: 3, y: 6 }, { x: 6, y: 6 }, { x: 9, y: 6 }, { x: 3, y: 9 }, { x: 9, y: 9 }, { x: 6, y: 9 }];
  } else if (size === 19) {
    return [
      { x: 3, y: 3 }, { x: 9, y: 3 }, { x: 15, y: 3 },
      { x: 3, y: 9 }, { x: 9, y: 9 }, { x: 15, y: 9 },
      { x: 3, y: 15 }, { x: 9, y: 15 }, { x: 15, y: 15 }
    ];
  }
  return [];
};
