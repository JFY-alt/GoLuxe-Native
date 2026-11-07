import type {SenseiBeat} from './senseiLessons';
const initial=['.........','.........','.........','.........','...X.X...','.........','.........','.........','.........'];
const peep=initial.map((r,y)=>y===5?'....O....':r);
const connected=peep.map((r,y)=>y===4?'...XXX...':r);
const ignored=peep.map((r,y)=>y===8?'........X':r);
export const PROBING_BEATS:SenseiBeat[]=[
 {title:'Probing',mood:'happy',board:initial,button:'Try a peep',text:'A **probe** is a move played to learn how the opponent will respond. It is only useful if the answers affect your plan. Here Black has two separate chains with a one-point gap. White can test whether Black will connect.'},
 {title:'The Probe',mood:'happy',board:initial,studentColor:'white',unmarked:true,choices:[{x:4,y:5,correct:true}],text:'White to play. Play immediately below the gap to **peep**: threaten to enter the connecting point on the next move.',feedback:'White’s peep threatens the gap above. It does not capture or cut yet. Black can connect, counterattack, or play elsewhere; the right reply depends on the rest of the game.'},
 {title:'A Connecting Answer',mood:'happy',board:connected,button:'Compare playing elsewhere',text:'In this possible reply, Black plays at the gap. The three Black stones now form **one chain**. White has learned that this route is connected. The probe’s value depends on what White gained from inducing that connection; peeping without a useful plan may simply help the opponent.'},
 {title:'An Answer Elsewhere',mood:'happy',board:ignored,button:'Enter the gap',text:'Alternative branch: Black plays in the lower-right corner instead of connecting. This is a legal choice, not automatically a mistake. White can now enter the gap, but must read whether the cut is useful and safe.'},
 {title:'Enter the Gap',mood:'happy',board:ignored,studentColor:'white',unmarked:true,choices:[{x:4,y:4,correct:true}],text:'White to play. Connect to the peeping stone and occupy the gap between Black’s two chains.',feedback:'White has a connected two-stone chain with **four liberties**. Black’s original stones remain two separate chains. This demonstrates a real cut through the connection route, but does not prove that either Black chain is dead or that White has won the game.'},
];
