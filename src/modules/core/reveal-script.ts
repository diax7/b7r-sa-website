/**
 * Scroll reveal for the whole site (BRD 3.7 as amended, ADR-055), as one inline script at the
 * end of the body so it runs after the DOM is parsed and before hydration. Every element
 * with `data-reveal` (every `Section` by default, see `components/shared/section.tsx`) and
 * every child of a `data-reveal-stagger` group is armed: an element already in view is
 * marked visible at once and never hidden (the first paint, the LCP and the fold are never
 * touched); an element below the fold is hidden and fades up 12 px once it enters. Elements
 * added later (client navigation, lazy islands) are picked up by a MutationObserver. Nothing
 * runs under reduced motion or without IntersectionObserver, and the CSS hides nothing on
 * its own, so content is always there without JavaScript.
 */
export const REVEAL_SCRIPT = `(function(){
if(matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-visible');e.target.classList.remove('is-hidden');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:0});
function arm(root){
var q=root.querySelectorAll?root:document;
q.querySelectorAll('[data-reveal-stagger]').forEach(function(g){Array.prototype.forEach.call(g.children,function(c,i){c.style.setProperty('--i',i);if(!c.hasAttribute('data-reveal'))c.setAttribute('data-reveal','')})});
q.querySelectorAll('[data-reveal]:not(.is-armed)').forEach(function(el){
el.classList.add('is-armed');
var r=el.getBoundingClientRect();
if(r.top<innerHeight*0.92&&r.bottom>0){el.classList.add('is-visible');return}
el.classList.add('is-hidden');io.observe(el)})}
arm(document);
new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1)arm(n)})})}).observe(document.body,{childList:true,subtree:true});
})();`;
