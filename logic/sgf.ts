import { GameState, Intersection, Player, Point, RuleSet } from '../types';
import { checkCaptures, createEmptyBoard, getBoardString, isSelfCapture, isKoViolation } from './goEngine';
export interface RecordNode {
  properties: Record<string, string[]>;
  parent: RecordNode | null;
  children: RecordNode[];
  position: GameState;
  moveNumber: number;
}
export function emptyPosition(size: number, ruleset: RuleSet = 'chinese', handicap = 0): GameState {
  const board = createEmptyBoard(size);
  return { board, turn: 'black', captures: { black: 0, white: 0 }, lastMove: null, history: [getBoardString(board)], phase: 'play', winner: null, consecutivePasses: 0, handicapPlacementsLeft: handicap, deadStones: new Set(), sekiPoints: new Set(), ruleset };
}
export const encodePoint = (p: Point) => String.fromCharCode(97 + p.x) + String.fromCharCode(97 + p.y);
const other = (p: Player): Player => p === 'black' ? 'white' : 'black';
export function playMove(state: GameState, point: Point, fixedStars?: Point[]): GameState {
  const { board, turn } = state;
  if (!board[point.y] || point.x < 0 || point.x >= board.length) throw new Error('Outside the board');
  if (board[point.y][point.x]) throw new Error('That intersection is occupied');
  if (state.handicapPlacementsLeft && fixedStars && !fixedStars.some(p => p.x === point.x && p.y === point.y)) throw new Error('Fixed handicap must be on star points');
  if (!state.handicapPlacementsLeft && isSelfCapture(board, point, turn)) throw new Error('Suicide move not allowed');
  const placed = board.map(row => [...row]); placed[point.y][point.x] = turn;
  const captured = state.handicapPlacementsLeft ? { newBoard: placed, captureCount: 0 } : checkCaptures(placed, point, turn);
  const hash = getBoardString(captured.newBoard);
  if (!state.handicapPlacementsLeft && isKoViolation(hash, state.history, state.ruleset)) throw new Error('Ko — play elsewhere first');
  return { ...state, board: captured.newBoard, captures: { ...state.captures, [turn]: state.captures[turn] + captured.captureCount }, turn: state.handicapPlacementsLeft > 1 ? 'black' : other(turn), lastMove: point, history: state.handicapPlacementsLeft ? [hash] : [...state.history, hash], handicapPlacementsLeft: Math.max(0, state.handicapPlacementsLeft - 1), consecutivePasses: 0 };
}
export function passMove(state: GameState): GameState {
  if (state.handicapPlacementsLeft) throw new Error('Finish placing handicap stones first');
  const passes = state.consecutivePasses + 1;
  return { ...state, turn: other(state.turn), lastMove: null, consecutivePasses: passes, history: [...state.history, getBoardString(state.board)], phase: passes >= 2 ? 'scoring' : 'play' };
}
export function createRecord(position: GameState, komi: number): RecordNode {
  return { parent: null, children: [], position, moveNumber: 0, properties: { GM: ['1'], FF: ['4'], CA: ['UTF-8'], AP: ['GoLuxe'], SZ: [String(position.board.length)], RU: [position.ruleset === 'chinese' ? 'Chinese' : 'Japanese'], KM: [String(komi)], DT: [new Date().toISOString().slice(0, 10)] } };
}
export function appendMove(node: RecordNode, previous: GameState, next: GameState, point: Point | null): RecordNode {
  if (previous.handicapPlacementsLeft > 0 && point) {
    const ab = node.properties.AB || []; node.properties.AB = [...ab, encodePoint(point)]; node.properties.HA = [String(node.properties.AB.length)]; node.properties.PL = [next.handicapPlacementsLeft > 0 ? 'B' : 'W']; node.position = next; return node;
  }
  const key = previous.turn === 'black' ? 'B' : 'W', value = point ? encodePoint(point) : '';
  const existing = node.children.find(n => n.properties[key]?.[0] === value);
  if (existing) return existing;
  const child = { parent: node, children: [], position: next, moveNumber: node.moveNumber + 1, properties: { [key]: [value] } };
  node.children.push(child); return child;
}
export function parseSgf(source: string): { root: RecordNode; size: number; ruleset: RuleSet; komi: number } {
  if (source.length > 2 * 1024 * 1024) throw new Error('SGF files must be under 2 MB');
  let i = 0, nodes = 0;
  type Raw = { properties: Record<string, string[]>; children: Raw[] };
  const skip = () => { while (/\s/.test(source[i] || '') && i < source.length) i++; };
  const parseTree = (depth: number): Raw => {
    if (depth > 128) throw new Error('SGF variation nesting is too deep');
    skip(); if (source[i++] !== '(') throw new Error('Invalid SGF game tree');
    let first: Raw | null = null, prev: Raw | null = null;
    skip();
    while (source[i] === ';') {
      i++; if (++nodes > 10000) throw new Error('SGF contains too many nodes');
      const raw: Raw = { properties: {}, children: [] };
      skip();
      while (/[A-Za-z]/.test(source[i] || '')) {
        let key = ''; while (/[A-Za-z]/.test(source[i] || '')) key += source[i++]; key = key.replace(/[a-z]/g, '');
        skip(); const vals: string[] = [];
        while (source[i] === '[') {
          i++; let value = '', closed = false;
          while (i < source.length) {
            const c = source[i++]; if (c === ']') { closed = true; break; }
            if (c === '\\') { const next = source[i++]; if (next === '\r' || next === '\n') { if (next === '\r' && source[i] === '\n') i++; } else if (next !== undefined) value += next; }
            else value += c;
          }
          if (!closed) throw new Error('Unclosed SGF property');
          vals.push(value); skip();
        }
        if (!key || !vals.length) throw new Error('Invalid SGF property');
        raw.properties[key] = vals;
      }
      if (prev) prev.children.push(raw); else first = raw;
      prev = raw; skip();
    }
    if (!first || !prev) throw new Error('SGF contains no positions');
    while (source[i] === '(') { prev.children.push(parseTree(depth + 1)); skip(); }
    if (source[i++] !== ')') throw new Error('Unclosed SGF tree');
    return first;
  };
  const raw = parseTree(0); skip(); if (i < source.length) throw new Error('Import one SGF game at a time');
  const size = Number(raw.properties.SZ?.[0] || 19); if (![9,13,19].includes(size)) throw new Error('Only 9×9, 13×13 and 19×19 SGF supported');
  if (raw.properties.GM && raw.properties.GM[0] !== '1') throw new Error('This record is not a Go game');
  const ruleset: RuleSet = /jap/i.test(raw.properties.RU?.[0] || '') ? 'japanese' : 'chinese';
  const komi = Number(raw.properties.KM?.[0] ?? 7.5); if (!Number.isFinite(komi)) throw new Error('Invalid komi');
  const decode = (s: string): Point => { if (!/^[a-s]{2}$/.test(s)) throw new Error('Invalid SGF coordinate'); const p = { x: s.charCodeAt(0)-97, y: s.charCodeAt(1)-97 }; if (p.x >= size || p.y >= size) throw new Error('SGF move is outside the board'); return p; };
  const expand = (s: string): Point[] => { if (!s.includes(':')) return [decode(s)]; const [a,b] = s.split(':').map(decode), out: Point[] = []; for (let y=a.y;y<=b.y;y++) for(let x=a.x;x<=b.x;x++) out.push({x,y}); return out; };
  const build = (r: Raw, parent: RecordNode | null): RecordNode => {
    let position = parent ? { ...parent.position, phase: 'play' as const } : emptyPosition(size,ruleset);
    const b = position.board.map(row => [...row]);
    for (const [key,color] of [['AB','black'],['AW','white'],['AE',null]] as const) for (const value of r.properties[key] || []) for (const p of expand(value)) b[p.y][p.x] = color;
    const setup = ['AB','AW','AE'].some(k => r.properties[k]);
    position = { ...position, board: b, history: setup ? [getBoardString(b)] : position.history };
    if (!parent && Number(r.properties.HA?.[0]) >= 2) position.turn = 'white';
    if (r.properties.PL) position.turn = r.properties.PL[0] === 'W' ? 'white' : 'black';
    if (r.properties.B && r.properties.W) throw new Error('SGF node contains two moves');
    const moveColor = r.properties.B ? 'black' : r.properties.W ? 'white' : null;
    if (moveColor) {
      position = { ...position, turn: moveColor };
      const value = r.properties[moveColor === 'black' ? 'B' : 'W'][0];
      position = !value || value === 'tt' ? passMove(position) : playMove(position,decode(value));
    }
    const node: RecordNode = { properties: r.properties, children: [], parent, position, moveNumber: (parent?.moveNumber || 0) + (moveColor ? 1 : 0) };
    return node;
  };
  const root = build(raw,null), pending: { r: Raw; n: RecordNode }[] = [{r:raw,n:root}];
  while(pending.length) { const {r,n} = pending.pop()!; for(const child of r.children) { const c=build(child,n); n.children.push(c); pending.push({r:child,n:c}); } }
  return { root, size, ruleset, komi };
}
export function serializeSgf(root: RecordNode): string {
  const esc = (s: string) => s.replace(/\\/g,'\\\\').replace(/\]/g,'\\]');
  // Iterative traversal keeps long game records off the JavaScript call stack.
  let output = ''; const stack: (RecordNode | string)[] = [')',root,'('];
  while(stack.length) { const item=stack.pop()!; if(typeof item==='string') { output+=item; continue; }
    output+=';'+Object.entries(item.properties).map(([k,vs])=>k+vs.map(v=>'['+esc(v)+']').join('')).join('');
    if(item.children.length===1) stack.push(item.children[0]);
    else for(let j=item.children.length-1;j>=0;j--) stack.push(')',item.children[j],'(');
  } return output;
}
