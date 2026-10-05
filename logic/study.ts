import {SenseiLesson, parseSenseiBoard} from '../data/senseiLessons';
import {createEmptyBoard} from './goEngine';

export function resumeBeat(lesson: SenseiLesson, saved: unknown): number {
  if (typeof saved !== 'number' || !Number.isFinite(saved) || saved < 0 || saved >= lesson.beats.length - 1) return 0;
  return Math.floor(saved);
}

export function lessonBoard(lesson: SenseiLesson, index: number) {
  const size = lesson.boardSize || 9;
  const board = createEmptyBoard(size);
  for (const {p,c} of parseSenseiBoard(lesson.beats[index]?.board || [])) {
    if (p.x < size && p.y < size) board[p.y][p.x] = c;
  }
  return board;
}
