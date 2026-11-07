export interface BoardPreferences {
 coordinates:boolean; moveNumbers:boolean; liberties:boolean; atari:boolean; lifeStatus:boolean;
 darkTheme:'espresso'|'classic'|'midnight'; lightTheme:'washi'|'maple'|'riverstone';
}
export const DEFAULT_BOARD_PREFERENCES:BoardPreferences={coordinates:false,moveNumbers:false,liberties:true,atari:true,lifeStatus:true,darkTheme:'classic',lightTheme:'washi'};
export function parseBoardPreferences(value:unknown):BoardPreferences {
 const result={...DEFAULT_BOARD_PREFERENCES};
 if(!value||typeof value!=='object'||Array.isArray(value))return result;
 const record=value as Record<string,unknown>;
 for(const key of ['coordinates','moveNumbers','liberties','atari','lifeStatus'] as const)if(typeof record[key]==='boolean')result[key]=record[key];
 if(['espresso','classic','midnight'].includes(String(record.darkTheme)))result.darkTheme=record.darkTheme as BoardPreferences['darkTheme'];
 if(['washi','maple','riverstone'].includes(String(record.lightTheme)))result.lightTheme=record.lightTheme as BoardPreferences['lightTheme'];
 return result;
}
