import type {RecordNode} from './sgf';
import type {Player} from '../types';
const columns='ABCDEFGHJKLMNOPQRST';
export function coordinateLabel(x:number,y:number,size:number):string {return `${columns[x]}${size-y}`;}
/** Surviving move stones on the selected branch; setup stones have no move number. */
export function survivingMoveNumbers(node:RecordNode):Record<string,number> {
 const path:RecordNode[]=[];for(let n:RecordNode|null=node;n;n=n.parent)path.push(n);
 const stones=new Map<string,{number:number;color:Player}>();
 for(const n of path.reverse()){
  for(const property of ['AB','AW','AE'])for(const value of n.properties[property]||[]){
   const [first,last=first]=value.split(':'),x1=first.charCodeAt(0)-97,y1=first.charCodeAt(1)-97,x2=last.charCodeAt(0)-97,y2=last.charCodeAt(1)-97;
   for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++)stones.delete(`${x},${y}`);
  }
  for(const [property,color] of [['B','black'],['W','white']] as const){
   const value=n.properties[property]?.[0];if(!value||value.length!==2)continue;
   const x=value.charCodeAt(0)-97,y=value.charCodeAt(1)-97;
   if(n.position.board[y]?.[x]===color)stones.set(`${x},${y}`,{number:n.moveNumber,color});
  }
  for(const [key,stone] of stones){const [x,y]=key.split(',').map(Number);if(n.position.board[y]?.[x]!==stone.color)stones.delete(key);}
 }
 return Object.fromEntries([...stones].map(([key,stone])=>[key,stone.number]));
}

export interface VariationGroup {parent:RecordNode;selected:RecordNode|null;children:RecordNode[]}
/** Every fork on the selected path, plus a fork immediately ahead of the selected position. */
export function variationGroups(node:RecordNode):VariationGroup[] {
 const path:RecordNode[]=[];for(let n:RecordNode|null=node;n;n=n.parent)path.push(n);
 path.reverse();const groups:VariationGroup[]=[];
 path.forEach((n,index)=>{if(n.children.length>1)groups.push({parent:n,selected:path[index+1]||null,children:n.children});});
 return groups;
}
export function continuationLabel(node:RecordNode,index:number):string {
 const prop=node.properties.B?'B':node.properties.W?'W':null;
 const value=prop?node.properties[prop]?.[0]:undefined;
 const move=prop?`${prop==='B'?'Black':'White'} ${!value||value==='tt'?'pass':coordinateLabel(value.charCodeAt(0)-97,value.charCodeAt(1)-97,node.position.board.length)}`:'Setup / annotation';
 return `${index===0?'Main continuation':`Variation ${index}`} · ${move}${node.properties.N?.[0]?` · ${node.properties.N[0]}`:''}`;
}
