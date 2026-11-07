import {parseSgf,serializeSgf,RecordNode} from './sgf';
export interface SavedRecord {id:string; title:string; savedAt:number; sgf:string}
export function decodeArchive(raw:string|null):SavedRecord[] {
 if(raw===null)return [];
 let data:any;try{data=JSON.parse(raw);}catch{throw new Error('Saved record library is unreadable. Existing data has been preserved.');}
 if(data?.version!==1||!Array.isArray(data.records))throw new Error('Saved record library is unreadable. Existing data has been preserved.');
 const ids=new Set<string>();
 return data.records.map((entry:SavedRecord)=>{
  if(!entry||typeof entry.id!=='string'||!entry.id||typeof entry.title!=='string'||!entry.title||typeof entry.sgf!=='string'||!Number.isFinite(entry.savedAt)||entry.savedAt<0)throw new Error('Saved record library contains an invalid entry. Existing data has been preserved.');
  if(ids.has(entry.id))throw new Error('Saved record library contains duplicate identifiers. Existing data has been preserved.');
  ids.add(entry.id);
  return {id:entry.id,title:entry.title,savedAt:entry.savedAt,sgf:entry.sgf};
 });
}
/** Clone the record so saving cannot modify imported metadata or live comments. */
export function recordForArchive(root:RecordNode,selected:RecordNode,komi:number,result?:string,continuation=false):string {
 const copy=parseSgf(serializeSgf(root)).root;
 if(Number(copy.properties.KM?.[0]??0)!==komi)copy.properties.KM=[String(komi)];
 if(result){
  if(continuation){
   const path:number[]=[];for(let n=selected;n.parent;n=n.parent)path.push(n.parent.children.indexOf(n));
   let target=copy;for(const index of path.reverse())target=target.children[index];
   const note=`GoLuxe continuation result: ${result}`;
   if(!target.properties.C?.includes(note))target.properties.C=[...(target.properties.C||[]),note];
  }else copy.properties.RE=[result];
 }
 return serializeSgf(copy);
}

export function recordTitle(value:string):string {
 const title=value.trim();if(!title)throw new Error('Enter a name for this record.');
 if(title.length>120)throw new Error('Record names must be 120 characters or fewer.');return title;
}
export function editArchive(records:SavedRecord[],id:string,edit:{title:string}|{remove:true}):SavedRecord[] {
 if(!records.some(record=>record.id===id))throw new Error('This record is no longer in the library. Reopen Saved Records to refresh.');
 if('remove' in edit)return records.filter(record=>record.id!==id);
 const title=recordTitle(edit.title);return records.map(record=>record.id===id?{...record,title}:record);
}
