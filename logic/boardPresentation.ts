import {Intersection,Player,Point} from '../types';
import {getAllGroups,getAtariPoints,getHoshiPoints,getImmortalEyePoints,getImmortalPoints,getLiberties,findGroup} from './goEngine';
/** The web draws five star points on 13×13; its fixed-handicap engine still exposes nine. */
export const displayHoshiPoints=(size:number):Point[]=>size===13?[{x:3,y:3},{x:9,y:3},{x:6,y:6},{x:3,y:9},{x:9,y:9}]:getHoshiPoints(size);
export function boardPresentation(board:Intersection[][],scoring:boolean,seki:Set<string>){
 const bLibs=new Set<string>(),wLibs=new Set<string>(),sekiStones=new Set<string>();
 for(const g of getAllGroups(board)){
  const libs=getLiberties(board,g.group);libs.forEach(l=>(g.color==='black'?bLibs:wLibs).add(l));
  if(scoring&&(g.group.some(p=>seki.has(`${p.x},${p.y}`))||[...libs].some(l=>seki.has(l))))g.group.forEach(p=>sekiStones.add(`${p.x},${p.y}`));
 }
 const atariBoard=board;
 return {bLibs,wLibs,sekiStones,atariBoard,atari:getAtariPoints(atariBoard),immortal:getImmortalPoints(board),eyes:getImmortalEyePoints(board)};
}
export function atariConnections(board:Intersection[][],point:Point):Point[]{
 const result:Point[]=[];for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]]){
  const x=point.x+dx,y=point.y+dy;if(x<0||y<0||x>=board.length||y>=board.length||!board[y][x])continue;
  const g=findGroup(board,{x,y});if(g){const libs=getLiberties(board,g.group);if(libs.size===1&&libs.has(`${point.x},${point.y}`))result.push({x:dx,y:dy});}
 }return result;
}
