import GlassBackdrop from './GlassBackdrop';
import React from 'react';
import { Modal, StyleSheet } from 'react-native';
import { Text, View, Pressable, ScrollView, AnimatedView } from '../ui';
import { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { C, SERIF } from '../theme';
export interface DialogState { title: string; description?: string; confirmLabel?: string; confirm?: () => void; danger?: boolean; children?: React.ReactNode; noCancel?: boolean; closeOnConfirm?: boolean; }
export default function Dialog({ dialog, onClose }: { dialog: DialogState | null; onClose: () => void }) {
  return <Modal visible={!!dialog} transparent animationType="fade" onRequestClose={()=>{if(!dialog?.noCancel)onClose();}}>
    <View style={s.overlay}><Pressable accessibilityLabel="Close dialog" onPress={()=>{if(!dialog?.noCancel)onClose();}} style={StyleSheet.absoluteFill} />
      <AnimatedView entering={ZoomIn.duration(300)} exiting={ZoomOut.duration(300)} style={s.card}><GlassBackdrop/>
        <Text style={s.title}>{dialog?.title}</Text>
        <ScrollView style={{ maxHeight: 440 }}><Text style={s.desc}>{dialog?.description}</Text>{dialog?.children}</ScrollView>
        <View style={s.actions}>
          {!dialog?.noCancel && <Pressable onPress={onClose} style={s.button}><Text style={s.cancel}>{dialog?.confirm ? 'Cancel' : 'Close'}</Text></Pressable>}
          {dialog?.confirm && <Pressable onPress={() => { const fn = dialog.confirm; if(dialog.closeOnConfirm!==false)onClose(); fn?.(); }} style={[s.button, dialog.danger ? s.danger : s.confirm]}><Text style={dialog.danger ? s.dangerText : s.confirmText}>{dialog.confirmLabel || 'Confirm'}</Text></Pressable>}
        </View>
      </AnimatedView>
    </View>
  </Modal>;
}
const s = StyleSheet.create({ overlay: { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,.70)', padding:'5%' }, card: { width:'100%', maxWidth:448, backgroundColor:'transparent', borderWidth:1, borderColor:'rgba(254,243,199,.15)', borderRadius:16, padding:32, gap:12 }, title:{fontFamily:SERIF,fontSize:20,color:C.amber50,textAlign:'center'},desc:{color:'rgba(255,255,255,.60)',fontSize:14,lineHeight:22.75,fontWeight:'300',textAlign:'center'},actions:{flexDirection:'row',gap:12},button:{flex:1,paddingVertical:12,borderRadius:12,borderWidth:1,borderColor:C.white10,alignItems:'center'},cancel:{color:'rgba(255,255,255,.60)',fontSize:10,letterSpacing:1,textTransform:'uppercase'},confirm:{backgroundColor:'rgba(254,243,199,.05)',borderColor:'rgba(253,230,138,.20)'},confirmText:{color:C.amber100,fontSize:10,letterSpacing:1,fontWeight:'700',textTransform:'uppercase'},danger:{backgroundColor:'rgba(239,68,68,.10)',borderColor:'rgba(239,68,68,.20)'},dangerText:{color:'#fee2e2',fontSize:10,letterSpacing:1,fontWeight:'700',textTransform:'uppercase'} });
