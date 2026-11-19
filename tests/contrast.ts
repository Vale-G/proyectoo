import assert from 'node:assert/strict';
import type {Page} from '@playwright/test';
/** Computed browser colours, including inherited surfaces. Detects the original white-on-white chips. */
export async function assertControlContrast(page:Page){
 const results=await page.locator('.filters a,.searchbar input,.searchbar button,.intake-progress button,.wizard-controls .button,.repair-tabs a,.order-actions>.button,.status-form input,.status-form select,.status-form textarea,.form-feedback').evaluateAll(new Function("elements", String.raw`
  const rgb=(value)=>value.match(/[\d.]+/g)?.map(Number)??[];
  const lum=(channels)=>channels.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  return elements.filter(el=>el.getClientRects().length>0).map(el=>{const style=getComputedStyle(el);let parent=el;let bg=[];while(parent){const c=rgb(getComputedStyle(parent).backgroundColor);if(c.length>=3&&(c.length<4||c[3]===1)){bg=c;break;}parent=parent.parentElement;}const fg=lum(rgb(style.color)),back=lum(bg);return {text:(el.textContent||el.getAttribute('aria-label')||el.tagName).slice(0,70),ratio:(Math.max(fg,back)+.05)/(Math.min(fg,back)+.05)};});
 `) as (elements:Element[])=>Array<{text:string;ratio:number}>);
 assert.ok(results.length>0);for(const result of results)assert.ok(result.ratio>=4.5,`${result.text}: contrast ${result.ratio.toFixed(2)} < 4.5`);
}
