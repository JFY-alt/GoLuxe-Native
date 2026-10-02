import { GameState, Point, Player } from '../types';
import { findGroup, getLiberties, getNeighborsFixed } from './goEngine';
export const runSekiDiagnosticOnPoint = (state: GameState, p: Point): GameState => {
      if (state.ruleset !== 'japanese' && state.ruleset !== 'chinese') return state;
      if (state.board[p.y][p.x] !== null) return state;
      const currentBoard = state.board; const size = currentBoard.length; const visited = new Set<string>(); const region: Point[] = []; const stack: Point[] = [p]; const borderingColors = new Set<Player>();
      while (stack.length > 0) { const curr = stack.pop()!; const currKey = `${curr.x},${curr.y}`; if (visited.has(currKey)) continue; visited.add(currKey); region.push(curr); for (const n of getNeighborsFixed(curr, size)) { const occupant = currentBoard[n.y][n.x]; if (occupant === null) stack.push(n); else borderingColors.add(occupant); } }
      const key = `${p.x},${p.y}`; const isSamePoint = state.virtualStone?.x === p.x && state.virtualStone?.y === p.y; const newReviewedPoints = new Set(state.reviewedPoints);
      if (borderingColors.size > 1) {
          let nextVirtualStone: { x: number, y: number, color: Player } | null = null;
          if (!isSamePoint) { nextVirtualStone = { x: p.x, y: p.y, color: 'black' }; } else if (state.virtualStone?.color === 'black') { nextVirtualStone = { x: p.x, y: p.y, color: 'white' }; } else { nextVirtualStone = null; newReviewedPoints.add(key); }
          if (nextVirtualStone && nextVirtualStone.color === 'white') { const bTestBoard = currentBoard.map(row => [...row]); bTestBoard[p.y][p.x] = 'black'; const wTestBoard = currentBoard.map(row => [...row]); wTestBoard[p.y][p.x] = 'white'; const bGroup = findGroup(bTestBoard, p); const wGroup = findGroup(wTestBoard, p); const bSelfAtari = bGroup && getLiberties(bTestBoard, bGroup.group).size === 1; const wSelfAtari = wGroup && getLiberties(wTestBoard, wGroup.group).size === 1; if (bSelfAtari && wSelfAtari) { const newSekiPoints = new Set(state.sekiPoints); const newDeadStones = new Set(state.deadStones); newReviewedPoints.add(key); const associatedGroups = new Set<string>(); region.forEach(rp => { getNeighborsFixed(rp, size).forEach(n => { if (currentBoard[n.y][n.x] !== null) { const group = findGroup(currentBoard, n); if (group) { const firstStone = `${group.group[0].x},${group.group[0].y}`; if (!associatedGroups.has(firstStone)) { associatedGroups.add(firstStone); group.group.forEach(gp => { const gKey = `${gp.x},${gp.y}`; newDeadStones.delete(gKey); newSekiPoints.add(gKey); }); } } } }); }); return { ...state, sekiPoints: newSekiPoints, deadStones: newDeadStones, virtualStone: nextVirtualStone, reviewedPoints: newReviewedPoints }; } }
          return { ...state, virtualStone: nextVirtualStone, reviewedPoints: newReviewedPoints };
      }
      return state;
  };
