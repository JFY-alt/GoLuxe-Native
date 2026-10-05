
import { GameState, Point, Player, Intersection, AiDifficulty } from '../types';
import {
    checkCaptures,
    isSelfCapture,
    getBoardString,
    getLiberties,
    findGroup,
    getNeighborsFixed,
    isTrueEye,
    calculateScores,
    guessDeadStones,
    isKoViolation
} from './goEngine';

const getOpponent = (player: Player): Player => player === 'black' ? 'white' : 'black';

const getDistance = (p1: Point, p2: Point): number => {
    return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
};

// --- Heuristic Evaluation (Used for < Master and as Priors for Master) ---

const getInfluenceScore = (p: Point, size: number): number => {
    const dX = Math.min(p.x, size - 1 - p.x);
    const dY = Math.min(p.y, size - 1 - p.y);
    const dist = Math.min(dX, dY);

    if (size === 9) {
        if (p.x === 4 && p.y === 4) return 8;
        if (dist === 2) return 10;
        if (dist === 1) return 4;
        if (dist === 0) return 1;
        return 6;
    }
    if (dist === 2) return 10;
    if (dist === 3) return 9;
    if (dist === 1) return 3;
    return 5;
};

// Helper to check validity internally without React state deps (Original Slow Version)
const isValidMove = (gameState: GameState, p: Point, player: Player): boolean => {
    const { board, history } = gameState;
    if (board[p.y][p.x]) return false;
    if (isSelfCapture(board, p, player)) return false;
    const tempBoard = board.map(row => [...row]);
    tempBoard[p.y][p.x] = player;
    const { newBoard } = checkCaptures(tempBoard, p, player);
    const boardStr = getBoardString(newBoard);
    if (isKoViolation(boardStr, history, gameState.ruleset)) return false;
    return true;
};

// --- Optimized MCTS Engine (1D Array) ---

const BLACK = 1;
const WHITE = 2;
const EMPTY = 0;

class FastState {
    size: number;
    board: Int8Array; // 0=Empty, 1=Black, 2=White
    turn: number; // 1 or 2
    ko: number; // Index of Ko point, -1 if none
    passes: number;
    captures: { 1: number, 2: number };
    komi: number; // Komi for White

    // Pre-allocated neighbor lookups for performance
    static neighborCache: Int32Array[] | null = null;

    constructor(size: number) {
        this.size = size;
        this.board = new Int8Array(size * size);
        this.turn = BLACK;
        this.ko = -1;
        this.passes = 0;
        this.captures = { 1: 0, 2: 0 };
        this.komi = 7.5;

        if (!FastState.neighborCache || FastState.neighborCache.length !== size * size) {
            FastState.initCache(size);
        }
    }

    static initCache(size: number) {
        FastState.neighborCache = new Array(size * size);
        for (let i = 0; i < size * size; i++) {
            const x = i % size;
            const y = Math.floor(i / size);
            const n: number[] = [];
            if (x > 0) n.push(i - 1);
            if (x < size - 1) n.push(i + 1);
            if (y > 0) n.push(i - size);
            if (y < size - 1) n.push(i + size);
            FastState.neighborCache[i] = new Int32Array(n);
        }
    }

    clone(): FastState {
        const s = new FastState(this.size);
        s.board.set(this.board);
        s.turn = this.turn;
        s.ko = this.ko;
        s.passes = this.passes;
        s.captures = { 1: this.captures[1], 2: this.captures[2] };
        s.komi = this.komi;
        return s;
    }

    getOpponent(p: number): number {
        return p === BLACK ? WHITE : BLACK;
    }

    // Fast capture check using 1D array floodfill
    // Returns number of stones captured
    checkCaptures(moveIdx: number, color: number): number {
        const opp = this.getOpponent(color);
        let captured = 0;
        const neighbors = FastState.neighborCache![moveIdx];

        // Check neighbors for enemy groups with 0 liberties
        for (let i = 0; i < neighbors.length; i++) {
            const nIdx = neighbors[i];
            if (this.board[nIdx] === opp) {
                // Check if this group is dead
                if (!this.hasLiberties(nIdx, opp)) {
                    // Capture it
                    captured += this.removeGroup(nIdx, opp);
                }
            }
        }
        return captured;
    }

    hasLiberties(startIdx: number, color: number): boolean {
        const stack = [startIdx];
        const visited = new Set<number>(); // Could optimize with Int8Array marker but Set is okay for small groups
        visited.add(startIdx);

        let ptr = 0;
        while (ptr < stack.length) {
            const curr = stack[ptr++];
            const neighbors = FastState.neighborCache![curr];
            for (let i = 0; i < neighbors.length; i++) {
                const n = neighbors[i];
                const val = this.board[n];
                if (val === EMPTY) return true; // Found liberty
                if (val === color && !visited.has(n)) {
                    visited.add(n);
                    stack.push(n);
                }
            }
        }
        return false;
    }

    removeGroup(startIdx: number, color: number): number {
        const stack = [startIdx];
        this.board[startIdx] = EMPTY; // Optimistic removal
        let count = 1;

        let ptr = 0;
        while (ptr < stack.length) {
            const curr = stack[ptr++];
            const neighbors = FastState.neighborCache![curr];
            for (let i = 0; i < neighbors.length; i++) {
                const n = neighbors[i];
                if (this.board[n] === color) {
                    this.board[n] = EMPTY;
                    count++;
                    stack.push(n);
                }
            }
        }
        return count;
    }

    isSuicide(moveIdx: number, color: number): boolean {
        // Temporarily play
        this.board[moveIdx] = color;
        const hasLib = this.hasLiberties(moveIdx, color);

        // Check if we captured anything (which makes it legal)
        let captures = false;
        if (!hasLib) {
             const opp = this.getOpponent(color);
             const neighbors = FastState.neighborCache![moveIdx];
             for(let i=0; i<neighbors.length; i++) {
                 if(this.board[neighbors[i]] === opp && !this.hasLiberties(neighbors[i], opp)) {
                     captures = true;
                     break;
                 }
             }
        }

        this.board[moveIdx] = EMPTY; // Revert
        return !hasLib && !captures;
    }

    play(moveIdx: number): boolean {
        if (moveIdx === -1) { // Pass
            this.turn = this.getOpponent(this.turn);
            this.passes++;
            this.ko = -1;
            return true;
        }

        if (this.board[moveIdx] !== EMPTY) return false;
        if (moveIdx === this.ko) return false;

        // Suicide check
        if (this.isSuicide(moveIdx, this.turn)) return false;

        this.board[moveIdx] = this.turn;
        const captured = this.checkCaptures(moveIdx, this.turn);

        // Update captures
        this.captures[this.turn] += captured;

        // Derive ko: if exactly one stone was captured and the capturing stone
        // is now in atari (exactly 1 liberty), that's a ko — the opponent
        // cannot immediately recapture at that liberty point.
        this.ko = -1;
        if (captured === 1) {
          const libs = this.getLibertyIndices(moveIdx, this.turn);
          if (libs.length === 1) {
            this.ko = libs[0];
          }
        }

        this.turn = this.getOpponent(this.turn);
        this.passes = 0;
        return true;
    }

    // Get liberty indices for the group containing idx
    private getLibertyIndices(idx: number, color: number): number[] {
        const visited = new Set<number>();
        const libs = new Set<number>();
        const stack = [idx];
        while (stack.length > 0) {
          const cur = stack.pop()!;
          if (visited.has(cur) || this.board[cur] !== color) continue;
          visited.add(cur);
          const neighbors = FastState.neighborCache![cur];
          for (let i = 0; i < neighbors.length; i++) {
            const n = neighbors[i];
            if (this.board[n] === 0) libs.add(n);
            else if (this.board[n] === color && !visited.has(n)) stack.push(n);
          }
        }
        return Array.from(libs);
    }
}

// --- MCTS Node with PUCT ---

class MCTSNode {
    state: FastState;
    parent: MCTSNode | null;
    children: MCTSNode[];
    move: number; // Index, -1 for pass
    wins: number;
    visits: number;
    prior: number; // From heuristic

    constructor(state: FastState, parent: MCTSNode | null, move: number, prior: number) {
        this.state = state;
        this.parent = parent;
        this.children = [];
        this.move = move;
        this.wins = 0;
        this.visits = 0;
        this.prior = prior;
    }

    isTerminal(): boolean {
        return this.state.passes >= 2;
    }

    // PUCT Selection
    selectChild(c_puct: number): MCTSNode | null {
        let best = null;
        let bestScore = -Infinity;
        const sqrtVisits = Math.sqrt(this.visits);

        for (const child of this.children) {
            const q = child.visits > 0 ? child.wins / child.visits : 0;
            const u = c_puct * child.prior * sqrtVisits / (1 + child.visits);
            const score = q + u;

            if (score > bestScore) {
                bestScore = score;
                best = child;
            }
        }
        return best;
    }
}

// Convert GameState to FastState
const toFastState = (gs: GameState, komi: number = 7.5): FastState => {
    const size = gs.board.length;
    const fs = new FastState(size);
    for(let y=0; y<size; y++) {
        for(let x=0; x<size; x++) {
            if (gs.board[y][x] === 'black') fs.board[y * size + x] = BLACK;
            else if (gs.board[y][x] === 'white') fs.board[y * size + x] = WHITE;
        }
    }
    fs.turn = gs.turn === 'black' ? BLACK : WHITE;
    fs.passes = gs.consecutivePasses;
    fs.komi = komi;
    // Compute ko ban from history: find the empty point where playing would
    // recreate a banned position. Ko can only arise adjacent to the last move.
    if (gs.lastMove && gs.history.length >= 1) {
        const banned: Set<string> = new Set();
        if (gs.ruleset === 'japanese') {
            if (gs.history.length >= 2) banned.add(gs.history[gs.history.length - 2]);
        } else {
            gs.history.forEach(h => banned.add(h));
        }
        if (banned.size > 0) {
            const lx = gs.lastMove.x, ly = gs.lastMove.y;
            const candidates: [number, number][] = [[lx, ly]];
            if (lx > 0) candidates.push([lx-1, ly]);
            if (lx < size-1) candidates.push([lx+1, ly]);
            if (ly > 0) candidates.push([lx, ly-1]);
            if (ly < size-1) candidates.push([lx, ly+1]);
            for (const [cx, cy] of candidates) {
                if (gs.board[cy][cx] !== null) continue;
                // Simulate: play, capture, convert to string
                const test = fs.clone();
                const idx = cy * size + cx;
                // Temporarily bypass ko check to test the position
                const savedKo = test.ko;
                test.ko = -1;
                if (!test.play(idx)) { test.ko = savedKo; continue; }
                test.ko = savedKo;
                let s = '';
                for (let i = 0; i < size*size; i++) {
                    s += test.board[i] === BLACK ? 'black' : test.board[i] === WHITE ? 'white' : '.';
                }
                // getBoardString uses 'black'/'white'/'.' joined — match format
                // Actually getBoardString maps cell || '.' where cell is 'black'/'white'
                // Our s uses same format. Compare.
                if (banned.has(s)) {
                    fs.ko = idx;
                    break;
                }
            }
        }
    }
    return fs;
};

// Simulation with Heavy Playouts
const simulate = (state: FastState): number => {
    const maxMoves = state.size * state.size * 2;
    let moves = 0;
    const s = state.clone();

    while (s.passes < 2 && moves < maxMoves) {
        const neighbors = FastState.neighborCache!;

        let validMove = -1;

        // Heuristic: Try to play close to occupied stones (Fighting)
        let attempts = 0;
        while (attempts < 20) {
            const r = Math.floor(Math.random() * (s.size * s.size));
            // If empty, it's a candidate
            if (s.board[r] === EMPTY) {
                // Heuristic: Is it near a stone?
                let hasNeighborStone = false;
                const ns = neighbors[r];
                for(let i=0; i<ns.length; i++) {
                    if (s.board[ns[i]] !== EMPTY) {
                        hasNeighborStone = true;
                        break;
                    }
                }

                // Bias: Higher chance to play if near stones (80%), lower if completely isolated (20%)
                if (hasNeighborStone || Math.random() < 0.2) {
                    if (!s.isSuicide(r, s.turn) && r !== s.ko) {
                        validMove = r;
                        break;
                    }
                }
            }
            attempts++;
        }

        if (validMove !== -1) {
            s.play(validMove);
        } else {
            // Pass if can't find move
            s.play(-1);
        }
        moves++;
    }

    // Scoring (Chinese Area: stones + territory)
    let b = 0, w = 0;
    for(let i=0; i<s.size*s.size; i++) {
        if (s.board[i] === BLACK) b++;
        else if (s.board[i] === WHITE) w++;
    }
    // Add territory: flood-fill empty regions, assign to single bordering color
    const ncache = FastState.neighborCache!;
    const visited = new Uint8Array(s.size * s.size);
    for(let i=0; i<s.size*s.size; i++) {
        if (s.board[i] !== EMPTY || visited[i]) continue;
        // Flood fill this empty region
        const region: number[] = [];
        const borderColors = new Set<number>();
        const stack = [i];
        visited[i] = 1;
        while (stack.length > 0) {
            const curr = stack.pop()!;
            region.push(curr);
            const ns = ncache[curr];
            for(let j=0; j<ns.length; j++) {
                const n = ns[j];
                const v = s.board[n];
                if (v === EMPTY) {
                    if (!visited[n]) { visited[n] = 1; stack.push(n); }
                } else {
                    borderColors.add(v);
                }
            }
        }
        if (borderColors.size === 1) {
            const owner = borderColors.values().next().value;
            if (owner === BLACK) b += region.length;
            else w += region.length;
        }
    }
    w += state.komi; // Komi (from game settings)
    return b > w ? BLACK : WHITE;
};

const runOptimizedMCTS = (gameState: GameState, komi: number = 7.5): Point | 'pass' | 'resign' => {
    const size = gameState.board.length;
    const rootState = toFastState(gameState, komi);

    // Generate Priors using Heuristic
    const priors = new Float32Array(size * size).fill(0.01);
    let priorSum = 0;

    const opponent = getOpponent(gameState.turn);

    for(let y=0; y<size; y++) {
        for(let x=0; x<size; x++) {
            if (isValidMove(gameState, {x, y}, gameState.turn)) {
                let score = 10; // Base
                score += getInfluenceScore({x, y}, size);
                const neighbors = getNeighborsFixed({x, y}, size);
                const ownNeighbors = neighbors.filter(n => gameState.board[n.y][n.x] === gameState.turn).length;
                const oppNeighbors = neighbors.filter(n => gameState.board[n.y][n.x] === opponent).length;
                if (oppNeighbors > 0) score += 20;
                if (ownNeighbors > 0) score += 5;
                const idx = y * size + x;
                priors[idx] = Math.max(1, score);
                priorSum += priors[idx];
            }
        }
    }

    // Normalize Priors
    for(let i=0; i<size*size; i++) priors[i] /= priorSum;

    // Root Node
    const root = new MCTSNode(rootState, null, -1, 0);
    // Expand Root immediately
    for(let y=0; y<size; y++) {
        for(let x=0; x<size; x++) {
            const idx = y * size + x;
            if (priors[idx] > 0) {
                 const childState = rootState.clone();
                 if (childState.play(idx)) {
                     const child = new MCTSNode(childState, root, idx, priors[idx]);
                     root.children.push(child);
                 }
            }
        }
    }
    // Add pass move — but suppress it early (never pass in the opening)
    const moveCount = gameState.history?.length || 0;
    const isOpening = moveCount < size * 2;
    if (!isOpening) {
      const passChildState = rootState.clone();
      passChildState.play(-1);
      root.children.push(new MCTSNode(passChildState, root, -1, 0.05));
    }

    const startTime = Date.now();
    // Scale think time by board size: 2.5s for 9x9, more for larger boards
    const TIME_LIMIT = size <= 9 ? 2500 : size <= 13 ? 4000 : 6000;
    let iterations = 0;

    while (Date.now() - startTime < TIME_LIMIT) {
        iterations++;
        let node = root;

        // 1. Selection
        while (node.children.length > 0 && !node.isTerminal()) {
            const next = node.selectChild(1.0); // C_PUCT
            if (!next) break;
            node = next;
        }

        // 2. Expansion
        if (node.children.length === 0 && !node.isTerminal() && node.visits > 5) {
             for(let i=0; i<size*size; i++) {
                 if (node.state.board[i] === EMPTY) {
                     const cs = node.state.clone();
                     if (cs.play(i)) {
                         node.children.push(new MCTSNode(cs, node, i, 1.0));
                     }
                 }
             }
             const pcs = node.state.clone();
             pcs.play(-1);
             node.children.push(new MCTSNode(pcs, node, -1, 0.1));

             if (node.children.length > 0) {
                 node = node.children[0];
             }
        }

        // 3. Simulation
        const winner = simulate(node.state);

        // 4. Backprop
        while (node !== null) {
            node.visits++;
            const mover = node.state.getOpponent(node.state.turn);
            if (winner === mover) {
                node.wins++;
            }
            node = node.parent;
            if (!node) break;
        }
    }

    // Select Best Move (Most Visits)
    let bestNode = null;
    let maxVisits = -1;

    for (const child of root.children) {
        if (child.visits > maxVisits) {
            maxVisits = child.visits;
            bestNode = child;
        }
    }

    // Resignation: if best move win rate is very low and we're past the opening, resign
    // instead of playing out a hopeless game
    if (bestNode && bestNode.visits > 0) {
        const winRate = bestNode.wins / bestNode.visits;
        const totalMoves = gameState.history.length;
        // Only resign after move 30 (past opening) and if win rate < 5%
        if (totalMoves > 30 && winRate < 0.05) {
            return 'resign';
        }
    }

    if (bestNode && bestNode.move !== -1) {
        const y = Math.floor(bestNode.move / size);
        const x = bestNode.move % size;
        return { x, y };
    }

    return 'pass';
};


// --- Main Export ---

export const getBestMove = (gameState: GameState, difficulty: AiDifficulty, komi: number = 7.5): Point | 'pass' | 'resign' => {
    // Master: Use Optimized MCTS
    if (difficulty === 'master') {
        return runOptimizedMCTS(gameState, komi);
    }

    // --- Heuristic AI for Beginner/Intermediate/Advanced ---
    const { board, turn, lastMove, ruleset, consecutivePasses } = gameState;
    const size = board.length;
    const opponent = getOpponent(turn);

    // Board Fullness
    let occupiedCount = 0;
    for(let y=0; y<size; y++) {
        for(let x=0; x<size; x++) {
            if(board[y][x]) occupiedCount++;
        }
    }
    const fullness = occupiedCount / (size * size);
    const isLateGame = fullness > (size === 9 ? 0.45 : 0.6);
    const opponentPassed = consecutivePasses > 0;

    const validMoves: Point[] = [];
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (isValidMove(gameState, { x, y }, turn)) {
                validMoves.push({ x, y });
            }
        }
    }

    if (validMoves.length === 0) return 'pass';

    // Resignation: if significantly behind in late game, resign instead of playing out
    // a hopeless position. Only for Advanced (weaker levels don't resign — they're learning).
    if (difficulty === 'advanced' && isLateGame) {
        const deadStones = guessDeadStones(board);
        // Use actual game komi (not hardcoded) for accurate resignation decisions
        const scores = calculateScores(board, gameState.captures, komi, 0, deadStones, ruleset, new Set(), true, 0, 0, true);
        const myScore = turn === 'black' ? scores.black.total : scores.white.total;
        const oppScore = turn === 'black' ? scores.white.total : scores.black.total;
        // Resign if behind by 25+ points in late game
        if (oppScore - myScore > 25) {
            return 'resign';
        }
    }

    // Tuning Perception: Accuracy of seeing tactical moves (Captures, Atari)
    let perceptionRate = 1.0;
    let noiseRange = 0;

    if (difficulty === 'beginner') {
        perceptionRate = 0.45; // Misses 55% of *attacking* tactical opportunities; defense is always noticed (see noticesDefense)
        noiseRange = 25;
    } else if (difficulty === 'intermediate') {
        perceptionRate = 0.75;
        noiseRange = 10;
    } else if (difficulty === 'advanced') {
        perceptionRate = 0.95;
        noiseRange = 2;
    }

    let PASS_THRESHOLD = 0.5;
    if (isLateGame) PASS_THRESHOLD = 1.5;
    if (opponentPassed) PASS_THRESHOLD = ruleset === 'japanese' ? 2.0 : 0.5;

    let bestScore = -Infinity;
    let bestMoves: Point[] = [];

    for (const move of validMoves) {
        let score = 0;
        const noticesTactics = Math.random() < perceptionRate;
        // Defensive reading is never "missed": even the weakest level protects its own
        // stones and avoids filling its own eyes. Only *attacking* ideas get the
        // difficulty-based perception rate, so beginners stay tactically reliable
        // without being presented as strong.
        const noticesDefense = difficulty === 'beginner' ? true : noticesTactics;
        const tempBoard = board.map(row => [...row]);
        tempBoard[move.y][move.x] = turn;
        const { newBoard, captureCount } = checkCaptures(tempBoard, move, turn);

        // 1. Capture Bonus
        if (captureCount > 0) {
            const bonus = noticesTactics ? 10000 : 200;
            score += bonus * captureCount;
        }

        const neighbors = getNeighborsFixed(move, size);

        // 2. Puts Opponent in Atari
        if (noticesTactics) {
            let putsInAtari = false;
            neighbors.forEach(n => {
                if (newBoard[n.y][n.x] === opponent) {
                    const g = findGroup(newBoard, n);
                    if (g && getLiberties(newBoard, g.group).size === 1) {
                        putsInAtari = true;
                    }
                }
            });
            if (putsInAtari) score += 500;
        }

        // 3. Self-Safety / Self-Atari
        const myGroup = findGroup(newBoard, move);
        const myLibs = myGroup ? getLiberties(newBoard, myGroup.group).size : 0;

        if (myLibs === 1 && captureCount === 0) {
            // Even when "missing" defense, the penalty must exceed max noise
            // (Intermediate noise=10) to prevent accidental self-atari.
            if (noticesDefense) score -= 5000;
            else score -= 100;
        } else if (myLibs > 2) {
            score += 50;
        }

        // 4. Save Self from Atari
        if (myLibs > 1) {
             let savedGroup = false;
             neighbors.forEach(n => {
                 if (board[n.y][n.x] === turn) {
                     const oldGroup = findGroup(board, n);
                     if (oldGroup && getLiberties(board, oldGroup.group).size === 1) {
                         savedGroup = true;
                     }
                 }
             });
             if (savedGroup) score += noticesDefense ? 4000 : 100;
        }

        // --- Strategy ---
        const influenceFactor = Math.max(0, 1 - (fullness / 0.7));
        score += getInfluenceScore(move, size) * influenceFactor;

        if (lastMove && !isLateGame) {
            const dist = getDistance(move, lastMove);
            if (dist <= 2) score += 30;
            if (dist <= 4) score += 10;
        }

        // --- Endgame ---
        if (isTrueEye(board, move, turn)) {
            score -= noticesDefense ? 20000 : 500;
        }

        const ownNeighbors = neighbors.filter(n => board[n.y][n.x] === turn).length;
        const oppNeighbors = neighbors.filter(n => board[n.y][n.x] === opponent).length;

        if (oppNeighbors === 0 && captureCount === 0 && ownNeighbors === neighbors.length) {
            score -= noticesTactics ? 2000 : 50;
        }

        score += Math.random() * noiseRange;

        if (score > bestScore) {
            bestScore = score;
            bestMoves = [move];
        } else if (Math.abs(score - bestScore) < 0.1) {
            bestMoves.push(move);
        }
    }

    if (bestScore < PASS_THRESHOLD) return 'pass';
    if (bestMoves.length > 0) return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    return 'pass';
};
