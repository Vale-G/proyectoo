import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

test('legacy demo saves warranty from the clicked button and survives reload', () => {
  const source=readFileSync('app.js','utf8');
  const storage=new Map<string,string>();
  let listener:(event:unknown)=>void=()=>{};
  const button={dataset:{saveStatus:'00125'},addEventListener:(_name:string,fn:typeof listener)=>listener=fn};
  const app={innerHTML:'',focus(){}};
  const document={querySelector(selector:string){
    if(selector==='#app')return app;
    if(selector==='[data-save-status]')return button;
    if(selector==='#new-status')return {value:'warranty'};
    if(selector==='#status-note')return {value:'Ingreso QA'};
    if(selector==='.modal-backdrop')return {remove(){}};
    if(selector==='#toast')return {textContent:'',classList:{add(){},remove(){}}};
    return null;
  },querySelectorAll(){return []}};
  const globals={document,window:{},localStorage:{getItem:(key:string)=>storage.get(key)??null,setItem:(key:string,value:string)=>storage.set(key,value)},setTimeout(){}};
  const context=vm.createContext(globals);vm.runInContext(source,context);vm.runInContext('bindModal()',context);listener({currentTarget:button});
  assert.equal(JSON.parse(storage.get('tecniflow-orders')!)[0].statusLabel,'En garantía');
  const reloaded=vm.createContext({...globals,window:{}});vm.runInContext(source,reloaded);
  assert.equal(vm.runInContext('orders[0].status',reloaded),'warranty');
});
