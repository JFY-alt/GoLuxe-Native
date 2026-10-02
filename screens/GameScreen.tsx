import RecordControls from '../components/RecordControls';
import TimerPanel from '../components/TimerPanel';
import ScoreModal from '../components/ScoreModal';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Platform, Share, StyleSheet, useWindowDimensions } from 'react-native';
import { Pressable, ScrollView, StatusBar, Text, View, LinearGradient, AnimatedView, ThemeToggle, useTheme } from '../ui';
import { FadeIn, ZoomIn } from 'react-native-reanimated';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Board from '../components/Board';
import GearIcon from '../components/GearIcon';
import Sidebar, { BoardTheme, HandicapType, KomiDirection } from '../components/Sidebar';
import Dialog, { DialogState } from '../components/Dialog';
import { calculateScores, findGroup, getAllGroups, getBoardString, getHoshiPoints, getLiberties, guessDeadStones } from '../logic/goEngine';
import { getBestMove } from '../logic/simpleAi';
import { GameState, Player, Point, PlayerClock, TimeSettings } from '../types';
import { AiConfig, AiDifficulty } from './AiSetupMenu';
import { clockAfterMove, clockDisplay, createClock, tickClock } from '../logic/clocks';
import { emptyPosition, playMove, passMove, createRecord, appendMove, parseSgf, serializeSgf, RecordNode } from '../logic/sgf';
import { runSekiDiagnosticOnPoint } from '../logic/scoringReview';
import { C, SERIF } from '../theme';
const BOARD_SIZES = [9, 13, 19];
interface GameScreenProps { mode: 'ai' | '2p'; aiConfig: AiConfig | null; timeSettings: TimeSettings | null; onExit: () => void; }
interface Snapshot { position: GameState; node: RecordNode; }
export default function GameScreen({ mode, aiConfig: initialAI, timeSettings: initialTime, onExit }: GameScreenProps) {
  const { mode: themeMode } = useTheme();
  const { width, height } = useWindowDimensions();
  const boardPx = Math.min(width * .85, height * .52);
  const [game, setGame] = useState(() => emptyPosition(9));
  const gameRef = useRef(game); gameRef.current = game;
  const updateGame = (next: GameState) => { gameRef.current = next; setGame(next); };
  const [aiConfig, setAiConfig] = useState(initialAI);
  const [timeSettings, setTimeSettings] = useState(initialTime);
  const [gameStarted, setGameStarted] = useState(!initialTime);
  const [aiThinking, setAiThinking] = useState(false);
  const [aiRetry, setAiRetry] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [previewPoint, setPreviewPoint] = useState<Point | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showTimePanel, setShowTimePanel] = useState(false);
  const [scorePlayer,setScorePlayer]=useState<Player|null>(null);
  const [showLiberties, setShowLiberties] = useState(true);
  const [showAtariWarning, setShowAtariWarning] = useState(true);
  const [showLifeStatus, setShowLifeStatus] = useState(true);
  const [darkBoardTheme, setDarkBoardTheme] = useState<BoardTheme>('classic');
  const [lightBoardTheme, setLightBoardTheme] = useState<BoardTheme>('washi');
  const boardTheme = themeMode === 'light' ? lightBoardTheme : darkBoardTheme;
  const setBoardTheme = themeMode === 'light' ? setLightBoardTheme : setDarkBoardTheme;
  const [handicapOn, setHandicapOn] = useState(false);
  const [handicapType, setHandicapType] = useState<HandicapType>('fixed');
  const [handicapCount, setHandicapCount] = useState(1);
  const [komiDirection, setKomiDirection] = useState<KomiDirection>('standard');
  const [komiValue, setKomiValue] = useState(7.5);
  const [notice, setNotice] = useState<string | null>(null);
  const [passNotice, setPassNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanGeneration = useRef(0);
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  const [fading, setFading] = useState<{ x: number; y: number; color: Player; key: string }[]>([]);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recordRoot, setRecordRoot] = useState(() => createRecord(game,7.5));
  const [recordNode, setRecordNode] = useState<RecordNode>(recordRoot);
  const recordRef = useRef(recordNode); recordRef.current = recordNode;
  const [reviewMode, setReviewMode] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const snapshotsRef = useRef(snapshots); snapshotsRef.current = snapshots;
  const [clocks, setClocks] = useState(() => ({ black: createClock(initialTime,(initialTime?.mainTimeMinutes ?? 30)*60000), white: createClock(initialTime,(initialTime?.mainTimeMinutes ?? 30)*60000) }));
  const clocksRef = useRef(clocks); clocksRef.current = clocks;
  const lastTick = useRef(Date.now());
  const { board, turn, captures, lastMove, phase, winner, ruleset, deadStones, handicapPlacementsLeft: placementsLeft } = game;
  const boardSize = board.length;
  const maxHandicap = handicapType === 'fixed' ? Math.max(1,getHoshiPoints(boardSize).length-1) : 8;
  const signedKomi = komiDirection === 'standard' ? komiValue : komiDirection === 'reverse' ? -komiValue : .5;
  const scoreDetail = useMemo(() => calculateScores(board, captures, signedKomi >= 0 ? signedKomi : 0, signedKomi < 0 ? -signedKomi : 0, phase === 'play' ? guessDeadStones(board) : deadStones, ruleset, game.sekiPoints, true,
    timeSettings?.system === 'ing' ? ((timeSettings.ingPeriods || 0)-clocks.black.ingPeriodsLeft)*2 : 0,
    timeSettings?.system === 'ing' ? ((timeSettings.ingPeriods || 0)-clocks.white.ingPeriodsLeft)*2 : 0, phase !== 'play'), [game,signedKomi,timeSettings,clocks]);
  const showNotice = (msg: string) => { setNotice(msg); if(noticeTimer.current) clearTimeout(noticeTimer.current); noticeTimer.current=setTimeout(()=>setNotice(null),2500); };
  const finish = (win: Player | 'draw', reason: GameState['winReason']) => { updateGame({...gameRef.current,phase:'ended',winner:win,winReason:reason}); setPreviewPoint(null); setAiThinking(false); setShowResults(true); };
  const settleClock = (): boolean => {
    const current = gameRef.current;
    if(!timeSettings || !gameStarted || current.phase !== 'play') return true;
    const now=Date.now(), active=current.turn;
    const result=tickClock(clocksRef.current[active],timeSettings,Math.max(0,now-lastTick.current)); lastTick.current=now;
    const next={...clocksRef.current,[active]:result.clock}; clocksRef.current=next; setClocks(next);
    if(result.timedOut) { finish(active==='black'?'white':'black','time'); return false; }
    return true;
  };
  useEffect(()=>{
    if(!timeSettings || !gameStarted || phase!=='play') return;
    lastTick.current=Date.now(); const t=setInterval(settleClock,100); return ()=>clearInterval(t);
  },[timeSettings,gameStarted,phase]);
  useEffect(()=>()=> { scanGeneration.current++; if(noticeTimer.current) clearTimeout(noticeTimer.current); if(fadeTimer.current) clearTimeout(fadeTimer.current); },[]);
  const ongoing = phase !== 'ended' && (snapshots.length > 0 || board.some(row=>row.some(Boolean)));
  const ask = (title: string, description: string, confirm: () => void, confirmLabel='Confirm', danger=false) => { setPreviewPoint(null); setDialog({title,description,confirm,confirmLabel,danger}); };
  const handleExit = () => { setShowSidebar(false); if(ongoing) ask('Exit to Main Menu?','Your current game progress will be lost.',onExit,'Exit Game',true); else onExit(); };
  useEffect(()=> { const s=BackHandler.addEventListener('hardwareBackPress',()=> { if(dialog) setDialog(null); else if(showResults) setShowResults(false); else if(showSidebar) setShowSidebar(false); else handleExit(); return true; }); return ()=>s.remove(); },[game,dialog,showSidebar,showResults,snapshots]);
  const moveAllowed = () => gameRef.current.phase === 'play' && !isAutoScanning && (!timeSettings || gameStarted) && (!aiConfig || gameRef.current.turn === aiConfig.userColor);
  const setNode = (node: RecordNode) => { recordRef.current=node; setRecordNode(node); updateGame({...node.position, deadStones:new Set(),sekiPoints:new Set(),reviewedPoints:new Set(),virtualStone:null}); setPreviewPoint(null); setPassNotice(null); setSnapshots([]); };
  const commit = (point: Point | null, isAI=false) => {
    if(!isAI && !moveAllowed()) return;
    if(!settleClock()) return;
    const previous=gameRef.current;
    try {
      let next=point ? playMove(previous,point,handicapType==='fixed' ? getHoshiPoints(boardSize):undefined) : passMove(previous);
      const nextNode=appendMove(recordRef.current,previous,next,point);
      if(nextNode.position !== next) next={...nextNode.position};
      const historyEntry={position:previous,node:recordRef.current};
      const history=[...snapshotsRef.current,historyEntry]; snapshotsRef.current=history; setSnapshots(history);
      recordRef.current=nextNode; setRecordNode(nextNode);
      if(next.phase==='scoring') {
        next={...next,deadStones:guessDeadStones(next.board),sekiScanCompleted:false};
        setDialog({title:ruleset==='chinese'?'Chinese Area Scoring':'Japanese Territory Scoring',description:"Optionally run 'Scan Seki' first, toggle any dead stones yourself (your judgment is final), and then select 'Finalize Score' to conclude the game.",confirmLabel:'Start Scoring',confirm:()=>{},noCancel:true});
      }
      if(point) {
        const gone: typeof fading=[];
        previous.board.forEach((row,y)=>row.forEach((c,x)=> { if(c && !next.board[y][x]) gone.push({x,y,color:c,key:`${x},${y}-${Date.now()}`}); }));
        setFading(gone); if(fadeTimer.current) clearTimeout(fadeTimer.current); fadeTimer.current=setTimeout(()=>setFading([]),320);
        setPassNotice(null);
      } else setPassNotice(`${isAI?'AI':previous.turn==='black'?'Black':'White'} passed`);
      updateGame(next); setPreviewPoint(null);
      if(timeSettings && previous.handicapPlacementsLeft <= 1) {
        const pair={...clocksRef.current,[previous.turn]:clockAfterMove(clocksRef.current[previous.turn],timeSettings)}; clocksRef.current=pair; setClocks(pair);
      }
      if(ruleset==='japanese' && point && next.history.filter(h=>h===getBoardString(next.board)).length>=3) ask('No Result?','This position has repeated three times. You may declare no result or continue playing.',()=>finish('draw','no-result'),'Declare No Result');
    } catch(error) {
      if(isAI) throw error;
      setPreviewPoint(null); showIllegalMove((error as Error).message);
    }
  };
  const toggleDeadGroup = (p: Point) => {
    const group=findGroup(board,p); if(!group) return;
    const next=new Set(deadStones), dead=next.has(`${group.group[0].x},${group.group[0].y}`);
    group.group.forEach(p=>dead?next.delete(`${p.x},${p.y}`):next.add(`${p.x},${p.y}`));
    updateGame({...game,deadStones:next,virtualStone:null});
  };
  const showIllegalMove=(message:string)=>{
    const ko=message.startsWith('Ko'),fixed=message.startsWith('Fixed handicap');
    setDialog({title:ko?'Ko — one move elsewhere first':fixed?'Hoshi Violation':'Invalid Move',description:ko?(ruleset==='japanese'?'Ko: you cannot immediately recapture and repeat the previous position. Play elsewhere first — then you may capture back.':'Under Chinese rules no board position may ever repeat (positional superko). Choose a different move — even recapturing later is forbidden if it recreates an earlier position.'):fixed?'In Fixed mode, handicap stones must be placed on hoshi (star points).':message.startsWith('Suicide')?'This move would leave your stone with no breathing space.':message,confirmLabel:'Understood',confirm:()=>{},noCancel:true});
  };
  const onIntersectionPress = (p: Point) => {
    if(showSidebar || dialog || isAutoScanning) return;
    if(phase==='scoring') { if(board[p.y][p.x]) toggleDeadGroup(p); else if(!game.sekiScanCompleted)updateGame(runSekiDiagnosticOnPoint(game,p)); return; }
    if(!moveAllowed()) return;
    try { playMove(game,p,handicapType==='fixed'?getHoshiPoints(boardSize):undefined); } catch(error) { if(!board[p.y][p.x]) showIllegalMove((error as Error).message); setPreviewPoint(null); return; }
    if(previewPoint?.x===p.x && previewPoint?.y===p.y) commit(p); else setPreviewPoint(p);
  };
  const startGame = (size: number, opts?: { hOn?: boolean; hType?: HandicapType; hCount?: number; rSet?: GameState['ruleset']; reset?: boolean }) => {
    scanGeneration.current++; setIsAutoScanning(false);
    const reset=!!opts?.reset || reviewMode;
    const hOn=opts?.hOn ?? (reset?false:handicapOn), hType=opts?.hType??handicapType;
    const hCount=Math.max(1,Math.min(opts?.hCount??(reset?1:handicapCount),hType==='fixed'?getHoshiPoints(size).length-1:8));
    const rSet=opts?.rSet??(reset?'chinese':ruleset), km=hOn?.5:rSet==='chinese'?7.5:6.5;
    const next=emptyPosition(size,rSet,hOn?hCount+1:0), root=createRecord(next,km);
    setHandicapOn(hOn); setHandicapCount(hCount); setKomiDirection(hOn?'none':'standard'); setKomiValue(rSet==='chinese'?7.5:6.5);
    updateGame(next); setRecordRoot(root); recordRef.current=root; setRecordNode(root); setReviewMode(false); setShowComment(false); setSnapshots([]); snapshotsRef.current=[];
    setPreviewPoint(null); setShowResults(false); setDialog(null); setNotice(null); setPassNotice(null); setFading([]); setAiThinking(false);
    if(reviewMode) {setAiConfig(null);setTimeSettings(null);}
    const ts=reviewMode?null:timeSettings;
    const nextClocks={black:createClock(ts,(ts?.mainTimeMinutes??30)*60000),white:createClock(ts,(ts?.mainTimeMinutes??30)*60000)};
    clocksRef.current=nextClocks; setClocks(nextClocks); setGameStarted(!ts); lastTick.current=Date.now();
  };
  const changeRules = (rs: GameState['ruleset']) => { if(rs===ruleset)return; setShowSidebar(false); if(ongoing) ask('Change Ruleset?','Switching rulesets will refresh the board and reset the current game. Your progress will be lost.',()=>startGame(boardSize,{rSet:rs}),'Change Ruleset'); else startGame(boardSize,{rSet:rs}); };
  const changeSize = (size: number) => { if(size===boardSize)return; if(ongoing)ask('Change Board Size?','This will start a new game. Current progress will be lost.',()=>startGame(size),'Start New Game');else startGame(size); };
  const reset = () => { if(ongoing)ask('Refresh Board?','This will clear the board and restart the game. History and SGF settings will be lost.',()=>startGame(boardSize,{reset:true}),'Refresh');else startGame(boardSize,{reset:true}); };
  const undo = () => {
    if(timeSettings || isAutoScanning || phase!=='play')return;
    const history=snapshotsRef.current;
    if(!history.length) { if(reviewMode && recordNode.parent)setNode(recordNode.parent);return; }
    let index=history.length-1;
    if(aiConfig && game.turn===aiConfig.userColor && index>0)index--;
    const snap=history[index]; updateGame(snap.position); recordRef.current=snap.node; setRecordNode(snap.node);
    if(snap.position.handicapPlacementsLeft) { const ab:string[]=[];snap.position.board.forEach((r,y)=>r.forEach((c,x)=>{if(c==='black')ab.push(String.fromCharCode(97+x)+String.fromCharCode(97+y));}));snap.node.properties.AB=ab;snap.node.properties.HA=[String(ab.length)];snap.node.position=snap.position; }
    const h=history.slice(0,index);snapshotsRef.current=h;setSnapshots(h);setPreviewPoint(null);setPassNotice(null);setAiThinking(false);
  };
  useEffect(()=> {
    if(!aiConfig || phase!=='play' || turn===aiConfig.userColor || placementsLeft>0 || (timeSettings&&!gameStarted)) {setAiThinking(false);return;}
    let cancelled=false;
    const t=setTimeout(async()=> { if(cancelled)return;setAiThinking(true);await new Promise(r=>setTimeout(r,600));if(cancelled)return; try {
      const choice=getBestMove(gameRef.current,aiConfig.difficulty);
      if(choice==='resign')finish(aiConfig.userColor,'resign');else if(choice==='pass')commit(null,true);else{
        try{playMove(gameRef.current,choice);commit(choice,true);}catch{
          let fallback:Point|null=null;for(let y=0;y<boardSize&&!fallback;y++)for(let x=0;x<boardSize;x++){try{playMove(gameRef.current,{x,y});fallback={x,y};break;}catch{}}
          if(fallback)commit(fallback,true);else throw new Error('No legal alternative');
        }
      }
    } catch(error) {setDialog({title:'The AI failed to move',description:'Something went wrong while the AI was thinking. No move was played — your game is exactly as you left it.',confirmLabel:'Retry',noCancel:true,confirm:()=>setAiRetry(n=>n+1),children:<View style={{flexDirection:'row',gap:12}}><Pressable onPress={()=>{setDialog(null);undo();}} style={{flex:1,padding:12,borderWidth:1,borderColor:C.white10,borderRadius:12}}><Text style={{color:C.white40,textAlign:'center',textTransform:'uppercase',fontSize:10}}>Undo</Text></Pressable><Pressable onPress={()=>{setDialog(null);finish(aiConfig.userColor==='black'?'white':'black','resign');}} style={{flex:1,padding:12,borderWidth:1,borderColor:'rgba(239,68,68,.20)',borderRadius:12}}><Text style={{color:'#fee2e2',textAlign:'center',textTransform:'uppercase',fontSize:10}}>Resign</Text></Pressable></View>});} finally {setAiThinking(false);} },500);
    return ()=>{cancelled=true;clearTimeout(t);};
  },[game.board,turn,phase,aiConfig,placementsLeft,gameStarted,aiRetry]);
  const scanSeki = async () => {
    if(phase!=='scoring'||isAutoScanning)return;
    setIsAutoScanning(true);const generation=++scanGeneration.current;
    const bLibs=new Set<string>(),wLibs=new Set<string>();getAllGroups(board).forEach(g=>getLiberties(board,g.group).forEach(p=>(g.color==='black'?bLibs:wLibs).add(p)));
    for(const key of bLibs) if(wLibs.has(key)) {
      if(gameRef.current.sekiPoints.has(key)||gameRef.current.reviewedPoints.has(key))continue;
      const [x,y]=key.split(',').map(Number);
      for(let cycle=0;cycle<3;cycle++) {
        if(generation!==scanGeneration.current)return;
        updateGame(runSekiDiagnosticOnPoint(gameRef.current,{x,y}));
        await new Promise(r=>setTimeout(r,[350,450,200][cycle]));
      }
    }
    if(generation!==scanGeneration.current)return;
    updateGame({...gameRef.current,sekiScanCompleted:true,virtualStone:null});setIsAutoScanning(false);
  };
  const resume = () => {scanGeneration.current++;setIsAutoScanning(false);updateGame({...game,phase:'play',consecutivePasses:0,deadStones:new Set(),sekiPoints:new Set(),reviewedPoints:new Set(),virtualStone:null,sekiScanCompleted:false});setPassNotice(null);};
  const finalize = () => {
    const done=()=>finish(scoreDetail.black.total>scoreDetail.white.total?'black':scoreDetail.white.total>scoreDetail.black.total?'white':'draw','points');
    if(game.sekiScanCompleted)done();else ask('Finalize without seki review?',"The automatic seki scan hasn't run. Shared-liberty positions (seki) may be scored as territory. You can still correct everything by toggling stones yourself — finalize only if the board looks right to you.",done,'Finalize Anyway');
  };
  const exportSgf = async () => {
    try {
      recordRoot.properties.KM=[String(signedKomi)];recordRoot.properties.RU=[ruleset==='chinese'?'Chinese':'Japanese'];
      if(phase==='ended') {const result=game.winReason==='no-result'?'Void':winner==='draw'?'0':`${winner==='black'?'B':'W'}+${game.winReason==='resign'?'R':game.winReason==='time'?'T':Math.abs(scoreDetail.black.total-scoreDetail.white.total).toFixed(1)}`;
        if(reviewMode)recordNode.properties.C=[...(recordNode.properties.C||[]),`GoLuxe continuation result: ${result}`];else recordRoot.properties.RE=[result];}
      const text=serializeSgf(recordRoot),name=`goluxe_${boardSize}x${boardSize}_${Date.now()}.sgf`;
      if(Platform.OS==='web') {const url=URL.createObjectURL(new Blob([text],{type:'application/x-go-sgf'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
      else {const file=new File(Paths.cache,name);file.create({overwrite:true});file.write(text);if(await Sharing.isAvailableAsync())await Sharing.shareAsync(file.uri,{mimeType:'application/x-go-sgf',UTI:'public.plain-text',dialogTitle:'GoLuxe game record'});else await Share.share({message:text,title:'GoLuxe game record'});}
      setShowSidebar(false);
    } catch(e) {showNotice(`Export failed: ${(e as Error).message}`);}
  };
  const importSgf = async () => {
    try {
      const result=await DocumentPicker.getDocumentAsync({type:'*/*',copyToCacheDirectory:true});if(result.canceled || !result.assets?.length)return;
      const asset=result.assets[0];const text=Platform.OS==='web'?await (await fetch(asset.uri)).text():await new File(asset.uri).text();
      const parsed=parseSgf(text);scanGeneration.current++;setIsAutoScanning(false);setAiConfig(null);setTimeSettings(null);setGameStarted(true);setHandicapOn(false);setShowResults(false);setShowComment(false);
      setKomiValue(Math.abs(parsed.komi));setKomiDirection(parsed.komi<0?'reverse':parsed.komi===.5?'none':'standard');setRecordRoot(parsed.root);setReviewMode(true);setNode(parsed.root);setShowSidebar(false);showNotice('SGF loaded — navigate the record or play a continuation');
    } catch(e) {setDialog({title:'Could Not Import SGF',description:(e as Error).message});}
  };
  const navigateRecord = (action:'start'|'prev'|'next'|'end') => {let n=recordNode;if(action==='start')n=recordRoot;else if(action==='prev')n=n.parent||n;else if(action==='next')n=n.children[0]||n;else while(n.children.length)n=n.children[0];setNode(n);};
  const showScore = (player: Player) => setScorePlayer(player);
  const showClocks = () => { if(timeSettings)setShowTimePanel(true); };
  const actionBtn = (label:string,fn:()=>void,opts?:{disabled?:boolean;danger?:boolean}) => <Pressable onPress={fn} disabled={opts?.disabled} style={({pressed})=>[styles.actionBtn,opts?.danger&&styles.actionBtnDanger,opts?.disabled&&{opacity:.25},pressed&&{transform:[{scale:.95}]}]}><Text style={[styles.actionText,opts?.danger&&styles.actionTextDanger]}>{label}</Text></Pressable>;
  const status=phase==='ended'?'End':phase==='scoring'?'Scoring':placementsLeft?`Place Stones (${placementsLeft})`:aiConfig?aiThinking?'Thinking…':turn===aiConfig.userColor?'Your Turn':'AI Turn':'';
  const resultTitle=game.winReason==='no-result'?'No Result':winner==='draw'?'Draw':`${winner==='black'?'Black':'White'} Wins`;
  return <View style={styles.root}><StatusBar /><LinearGradient colors={['rgba(254,243,199,.05)','rgba(254,243,199,0)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
    <View style={styles.topbar}>
      <Pressable onPress={()=>{setPreviewPoint(null);setShowSidebar(v=>!v);}} style={styles.gearBtn} accessibilityLabel="Toggle Menu"><GearIcon open={showSidebar} color={themeMode==='light'?'#1c1917':'#ffffff'} /></Pressable>
      <View style={styles.sizeRow}>{BOARD_SIZES.map(s=><Pressable key={s} onPress={()=>changeSize(s)} disabled={isAutoScanning} style={styles.sizeTab}><Text style={[styles.sizeText,boardSize===s&&styles.sizeTextActive]}>{s}×{s}</Text>{boardSize===s&&<View style={styles.sizeUnderline}/>}</Pressable>)}</View>
      <View style={styles.topbarSpacer}/>
    </View>
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.titleBlock}><Text style={styles.title}>GoLuxe</Text><View style={styles.subRow}>
        <Pressable disabled={!aiConfig} onPress={()=>{if(!aiConfig)return;const ds:AiDifficulty[]=['beginner','intermediate','advanced','master'];setAiConfig({...aiConfig,difficulty:ds[(ds.indexOf(aiConfig.difficulty)+1)%4]});}}><Text style={styles.subText}>{aiConfig?`Vs AI (${aiConfig.difficulty})`:'Strategic Purity'}</Text></Pressable>
        <Text style={styles.subDot}>•</Text><Pressable onPress={()=>changeRules(ruleset==='chinese'?'japanese':'chinese')}><Text style={[styles.subText,styles.rulesText]}>{ruleset} Rules</Text></Pressable>
      </View></View>
      <View style={[styles.scoreStrip,{maxWidth:boardPx}]}>
        <Pressable onPress={()=>showScore('black')} style={[styles.scoreSide,{opacity:turn==='black'&&phase==='play'?1:themeMode==='light'?.78:.3}]}><View style={[styles.miniStone,{backgroundColor:'#000',borderColor:'rgba(255,255,255,.20)'}]}/><View><Text style={styles.scoreLabel}>Black</Text><Text style={styles.scoreValue}>{scoreDetail.black.total.toFixed(1)}</Text></View></Pressable>
        <View style={styles.scoreCenter}>{status!==''&&<Text style={styles.statusText}>{status}</Text>}{timeSettings&&phase==='play'&&<Pressable onPress={showClocks}><Text style={styles.clockText}><Text style={turn==='black'?styles.clockActive:styles.clockIdle}>{clockDisplay(clocks.black,timeSettings)}</Text><Text style={styles.clockSep}> | </Text><Text style={turn==='white'?styles.clockActive:styles.clockIdle}>{clockDisplay(clocks.white,timeSettings)}</Text></Text></Pressable>}{passNotice&&<Text style={styles.passNotice}>{passNotice}</Text>}{phase==='scoring'&&<Pressable accessibilityLabel="Scoring Help" onPress={()=>setDialog({title:ruleset==='chinese'?'Chinese Area Scoring':'Japanese Territory Scoring',description:"Optionally run 'Scan Seki' first, toggle any dead stones yourself (your judgment is final), and then select 'Finalize Score' to conclude the game.",confirmLabel:'Start Scoring',confirm:()=>{},noCancel:true})}><Text style={{color:C.amber100}}>?</Text></Pressable>}</View>
        <Pressable onPress={()=>showScore('white')} style={[styles.scoreSideRight,{opacity:turn==='white'&&phase==='play'?1:themeMode==='light'?.78:.3}]}><View style={{alignItems:'flex-end'}}><Text style={styles.scoreLabel}>White</Text><Text style={styles.scoreValue}>{scoreDetail.white.total.toFixed(1)}</Text></View><View style={[styles.miniStone,{backgroundColor:'#fff',borderColor:'rgba(0,0,0,.20)'}]}/></Pressable>
      </View>
      <View style={styles.boardPad}><Board board={board} lastMove={lastMove} previewPoint={previewPoint} onIntersectionPress={onIntersectionPress} turn={turn} boardPx={boardPx} interactive={phase!=='ended'&&!showSidebar&&!dialog&&!isAutoScanning&&(phase==='scoring'||moveAllowed())} showLiberties={showLiberties} showLifeStatus={showLifeStatus} hideAtari={!showAtariWarning} deadStones={deadStones} sekiPoints={game.sekiPoints} reviewedPoints={game.reviewedPoints} virtualStone={game.virtualStone} isScoringMode={phase==='scoring'} ruleset={ruleset} fading={fading} theme={boardTheme}/></View>
      <View style={styles.noticeBox}><Text style={styles.noticeText}>{phase==='ended'?`${resultTitle}${game.winReason==='resign'?' by resignation':game.winReason==='time'?' on time':game.winReason==='points'?` · ${scoreDetail.black.total.toFixed(1)} to ${scoreDetail.white.total.toFixed(1)}`:''}`:notice||' '}</Text></View>
      {reviewMode&&<View style={{width:boardPx,borderWidth:1,borderColor:C.white10,borderRadius:12,padding:8,gap:10,backgroundColor:'rgba(255,255,255,.03)'}}><RecordControls node={recordNode} onNode={setNode} onNav={navigateRecord} commentVisible={showComment} onComment={()=>setShowComment(v=>!v)}/>{showComment&&recordNode.properties.C&&<Text style={{color:'rgba(255,255,255,.70)',fontFamily:SERIF,fontSize:16}}>{recordNode.properties.C.join('\n')}</Text>}</View>}
      {timeSettings&&!gameStarted&&phase==='play'?<Pressable onPress={()=>{lastTick.current=Date.now();setGameStarted(true);}} style={styles.startGameBtn}><Text style={styles.startGameText}>Start Game</Text></Pressable>:phase==='play'?<View style={[styles.actionRow,{maxWidth:boardPx}]}>
        {actionBtn('Undo',undo,{disabled:(!snapshots.length&&(!reviewMode||!recordNode.parent))||!!timeSettings||aiThinking})}
        {actionBtn('Pass',()=>ask('Pass Turn?', 'Both players pass consecutively to enter scoring phase.',()=>commit(null),'Pass'),{disabled:!moveAllowed()||placementsLeft>0||aiThinking||(!reviewMode&&snapshots.length<2)})}
        {actionBtn('Resign',()=>ask('Resign Game?','This will end the game immediately. The opponent wins.',()=>finish(aiConfig?aiConfig.userColor==='black'?'white':'black':turn==='black'?'white':'black','resign'),'Resign',true),{danger:true,disabled:placementsLeft>0})}
        {actionBtn('Refresh',reset)}
      </View>:phase==='scoring'?<View style={{width:boardPx,gap:8}}><View style={styles.actionRow}>{actionBtn(isAutoScanning?'Scanning…':'Scan Seki',scanSeki,{disabled:isAutoScanning||game.sekiScanCompleted})}{actionBtn('Resume Play',resume,{disabled:isAutoScanning})}</View><Pressable onPress={finalize} disabled={isAutoScanning} style={styles.finalizeBtn}><Text style={styles.finalizeText}>Finalize Score</Text></Pressable></View>:<View style={[styles.actionRow,{maxWidth:boardPx}]}>{actionBtn('Play Again',()=>startGame(boardSize,{reset:true}))}</View>}
    </ScrollView>
    <Sidebar visible={showSidebar} onClose={()=>setShowSidebar(false)} onExitToMenu={handleExit} showLiberties={showLiberties} setShowLiberties={setShowLiberties} showAtariWarning={showAtariWarning} setShowAtariWarning={setShowAtariWarning} showLifeStatus={showLifeStatus} setShowLifeStatus={setShowLifeStatus} ruleset={ruleset} onRuleset={changeRules} handicapOn={handicapOn} onToggleHandicap={()=>{setShowSidebar(false);startGame(boardSize,{hOn:!handicapOn});}} handicapType={handicapType} onHandicapType={t=>{setHandicapType(t);startGame(boardSize,{hType:t});}} handicapCount={handicapCount} onHandicapCount={n=>{setHandicapCount(n);startGame(boardSize,{hCount:n});}} maxHandicap={maxHandicap} komiDirection={komiDirection} setKomiDirection={setKomiDirection} komiValue={komiValue} setKomiValue={setKomiValue} boardTheme={boardTheme} setBoardTheme={setBoardTheme} onExportSgf={exportSgf} onImportSgf={importSgf}/>
    <Dialog dialog={dialog} onClose={()=>setDialog(null)}/>
    {timeSettings&&<TimerPanel visible={showTimePanel} clocks={clocks} settings={timeSettings} active={turn} phase={phase} onClose={()=>setShowTimePanel(false)}/>}
    <ScoreModal scores={scoreDetail} ruleset={ruleset} player={scorePlayer} results={showResults} winner={winner} reason={game.winReason} onClose={()=>{setShowResults(false);setScorePlayer(null);}} onNewGame={()=>{setScorePlayer(null);startGame(boardSize,{reset:true});}}/>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, alignItems: 'center', paddingTop: 12, paddingBottom: 32, paddingHorizontal: 16 },
  topbar: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#0d0d0d',
    borderBottomWidth: 1,
    borderBottomColor: C.white05,
    zIndex: 310,
  },
  gearBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', opacity: 0.4, zIndex: 320 },
  topbarSpacer: { width: 48 },
  titleBlock: { alignItems: 'center', paddingVertical: 8 },
  title: { fontFamily: SERIF, fontSize: 20, fontWeight: '600', color: C.amber50, letterSpacing: -0.5 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  subText: { color: 'rgba(255,255,255,0.30)', fontSize: 8, letterSpacing: 3.5, textTransform: 'uppercase', fontWeight: '500' },
  subDot: { color: 'rgba(255,255,255,0.25)', fontSize: 9 },
  rulesText: { color: C.amber100, fontWeight: '700' },
  sizeRow: { flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' },
  sizeTab: { alignItems: 'center', paddingVertical: 4, minWidth: 56 },
  sizeText: {
    fontFamily: SERIF,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.20)',
  },
  sizeTextActive: { color: C.amber100 },
  sizeUnderline: {
    marginTop: 3,
    height: 2,
    width: '100%',
    backgroundColor: 'rgba(254,243,199,0.30)',
    shadowColor: '#fef3c7',
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  scoreStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 12,
    backgroundColor: C.white03,
    borderWidth: 1,
    borderColor: C.white05,
    borderRadius: 16,
  },
  scoreSide: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreSideRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniStone: { width: 14, height: 14, borderRadius: 7, borderWidth: 1 },
  scoreLabel: { fontSize: 10, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: 1 },
  scoreValue: { fontSize: 18, color: C.amber50, fontVariant: ['tabular-nums'] },
  scoreCenter: { alignItems: 'center', gap: 2, flex: 1, paddingHorizontal: 8 },
  statusText: { fontSize: 10, color: 'rgba(253,230,138,0.80)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
  clockText: { fontSize: 11, fontVariant: ['tabular-nums'], textAlign: 'center' },
  clockActive: { color: '#fff' },
  clockIdle: { color: 'rgba(255,255,255,0.50)' },
  clockSep: { color: 'rgba(255,255,255,0.30)' },
  passNotice: { fontSize: 8, color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase', letterSpacing: 2 },
  startGameBtn: {
    width: '100%',
    maxWidth: 420,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(16,185,129,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.30)',
    alignItems: 'center',
    marginTop: 4,
  },
  startGameText: { color: '#a7f3d0', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },

  boardPad: { padding: 2 },
  noticeBox: { height: 32, justifyContent: 'center', marginTop: 8 },
  noticeText: { color: C.amber200, fontSize: 14, textAlign: 'center' },

  actionRow: { flexDirection: 'row', gap: 8, width: '100%', maxWidth: 420, marginTop: 4 },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: C.white05,
    borderWidth: 1,
    borderColor: C.white10,
    alignItems: 'center',
  },
  actionText: {
    fontFamily: SERIF,
    color: 'rgba(255,255,255,0.70)',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  actionBtnDanger: { backgroundColor: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.20)' },
  actionTextDanger: { color: '#fecaca' },
  playAgainBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(254,243,199,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.20)',
    alignItems: 'center',
  },
  playAgainText: {
    fontFamily: SERIF,
    color: 'rgba(254,243,199,0.80)',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  finalizeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(254,243,199,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.30)',
    alignItems: 'center',
  },
  finalizeText: {
    fontFamily: SERIF,
    color: C.amber100,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.60)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: {
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: C.white10,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 420,
  },
  modalTitle: { fontFamily: SERIF, fontSize: 20, color: C.amber50, textAlign: 'center', letterSpacing: 0.5 },
  modalRules: { fontSize: 8, color: C.white20, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginTop: 4, marginBottom: 12 },
  resultRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  resultCard: { flex: 1, padding: 14, borderRadius: 16, borderWidth: 1 },
  resultCardWinner: { backgroundColor: 'rgba(254,243,199,0.03)', borderColor: 'rgba(253,230,138,0.20)' },
  resultCardLoser: { backgroundColor: 'rgba(0,0,0,0.20)', borderColor: C.white05, opacity: 0.6 },
  resultHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  resultName: { fontSize: 10, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: 2 },
  winnerBadge: {
    marginLeft: 'auto',
    fontSize: 8,
    color: '#fde68a',
    backgroundColor: 'rgba(253,230,138,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.20)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
    overflow: 'hidden',
  },
  resultLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  resultLabel: { fontSize: 11, color: 'rgba(255,255,255,0.30)' },
  resultValue: { fontSize: 11, color: C.amber100, fontVariant: ['tabular-nums'] },
  resultTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderTopWidth: 1,
    borderTopColor: C.white05,
    paddingTop: 10,
    marginTop: 6,
  },
  resultTotalLabel: { fontSize: 9, color: C.white20, textTransform: 'uppercase', fontFamily: SERIF },
  resultTotalValue: { fontSize: 24, color: C.amber50, fontVariant: ['tabular-nums'] },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  modalBtnGold: { backgroundColor: 'rgba(254,243,199,0.10)', borderColor: 'rgba(253,230,138,0.20)' },
  modalBtnGoldText: { color: C.amber100, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  modalBtnGhost: { borderColor: C.white10 },
  modalBtnGhostText: { color: C.white30, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 },
});
