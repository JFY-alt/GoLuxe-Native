import type {GameState,Point} from '../types';
/** Traditional 19x19 sets; small boards use explicitly selected app conventions. */
export function fixedHandicapPoints(size:number,count:number):Point[] {
 const low=size===9?2:3,high=size-1-low,mid=(size-1)/2;
 const max=size===9?5:9;
 if(![9,13,19].includes(size)||!Number.isInteger(count)||count<2||count>max)throw new Error('Unsupported fixed handicap layout');
 const corners=[{x:high,y:low},{x:low,y:high},{x:high,y:high},{x:low,y:low}];
 if(count<=4)return corners.slice(0,count);
 const center={x:mid,y:mid};
 if(count===5)return [...corners,center];
 const sides=[{x:high,y:mid},{x:low,y:mid}];
 if(count===6)return [...corners,...sides];
 if(count===7)return [...corners,...sides,center];
 const vertical=[{x:mid,y:low},{x:mid,y:high}];
 return count===8?[...corners,...sides,...vertical]:[...corners,...sides,...vertical,center];
}
export function remainingFixedHandicapPoints(position:GameState):Point[] {
 if(!position.handicapPlacementsLeft)return [];
 const placed=position.board.flat().filter(c=>c==='black').length;
 return fixedHandicapPoints(position.board.length,placed+position.handicapPlacementsLeft).filter(p=>!position.board[p.y][p.x]);
}
