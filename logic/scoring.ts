/** Compensation is independent from prisoner/area counting. A handicap tie-break is explicit. */
export function signedCompensation(handicap:boolean,direction:'standard'|'reverse'|'none',value:number):number {
 if(handicap)return .5;
 if(direction==='none')return 0;
 const magnitude=Number.isFinite(value)?Math.max(0,value):0;
 return direction==='reverse'?-magnitude:magnitude;
}
