import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function backdrop() {
  const effects: (() => (() => void))[] = [], values: any[] = [], calls: any[] = [], cancelled: any[] = [];
  const react = {
    useRef: (value: any) => ({current: value}),
    useCallback: (fn: any) => fn,
    useEffect: (fn: any) => effects.push(fn),
    createElement: (type: any, props: any, ...children: any[]) => ({type, props, children}),
  };
  const exports: any = {};
  const absoluteFill = {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../components/DojoBackdrop.tsx', import.meta.url), 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React},
  }).outputText, {exports, require: (name: string) => {
    if (name === 'react') return react;
    if (name === 'react-native') return {Image: 'Image', View: 'View', StyleSheet: {absoluteFill}};
    if (name === 'react-native-reanimated') return {
      default: {View: 'AnimatedView'},
      Easing: {bezier: (...args: number[]) => args},
      useSharedValue: (value: number) => {const shared = {value}; values.push(shared); return shared;},
      useAnimatedStyle: (fn: any) => fn(),
      withTiming: (target: number, options: any) => {calls.push({target, options}); return target;},
      withDelay: (delay: number, target: number) => {calls.push({delay}); return target;},
      cancelAnimation: (value: any) => cancelled.push(value),
    };
    if (name === 'expo-linear-gradient') return {LinearGradient: 'Gradient'};
    return name;
  }});
  const tree = exports.default();
  const cleanups = effects.map(fn => fn());
  const images: any[] = [];
  const visit = (node: any) => {if (!node) return; if (node.type === 'Image') images.push(node); node.children?.forEach(visit);};
  visit(tree);
  return {images, values, calls, cancelled, cleanups};
}

for (const order of [[0, 1], [1, 0]]) {
  test(`dojo waits for both decoded images before revealing or restoring color (load order ${order})`, () => {
    const b = backdrop();
    assert.equal(b.images.length, 2);
    assert.equal(b.values[0].value, 1); // Grayscale is fully opaque initially.
    assert.equal(b.values[1].value, 0); // Neither decoded layer is exposed early.
    b.images[order[0]].props.onLoad();
    assert.equal(b.calls.length, 0);
    b.images[order[1]].props.onLoad();
    assert.equal(b.values[0].value, 0); // Eventually exposes the original color.
    assert.equal(b.values[1].value, 1);
    assert.ok(b.calls.some(c => c.delay === 1500));
    assert.ok(b.calls.some(c => c.target === 0 && c.options.duration === 3000));
    const count = b.calls.length;
    b.images[0].props.onLoad(); b.images[1].props.onLoad();
    assert.equal(b.calls.length, count); // Cache callbacks cannot restart the bloom.
    b.cleanups.forEach(fn => fn());
    assert.equal(b.cancelled.length, 2);
  });
}
