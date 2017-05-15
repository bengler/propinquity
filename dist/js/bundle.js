!function(t){function e(i){if(n[i])return n[i].exports;var o=n[i]={i:i,l:!1,exports:{}};return t[i].call(o.exports,o,o.exports,e),o.l=!0,o.exports}var n={};return e.m=t,e.c=n,e.i=function(t){return t},e.d=function(t,n,i){e.o(t,n)||Object.defineProperty(t,n,{configurable:!1,enumerable:!0,get:i})},e.n=function(t){var n=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(n,"a",n),n},e.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},e.p="/js",e(e.s=5)}([function(t,e){t.exports=Detector={canvas:!!window.CanvasRenderingContext2D,webgl:function(){try{var t=document.createElement("canvas");return!(!window.WebGLRenderingContext||!t.getContext("webgl")&&!t.getContext("experimental-webgl"))}catch(t){return!1}}(),workers:!!window.Worker,fileapi:window.File&&window.FileReader&&window.FileList&&window.Blob,getWebGLErrorMessage:function(){var t=document.createElement("div");return t.id="webgl-error-message",t.style.fontFamily="monospace",t.style.fontSize="13px",t.style.fontWeight="normal",t.style.textAlign="center",t.style.background="#fff",t.style.color="#000",t.style.padding="1.5em",t.style.width="400px",t.style.margin="5em auto 0",this.webgl||(t.innerHTML=window.WebGLRenderingContext?['Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />','Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'].join("\n"):['Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>','Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'].join("\n")),t},addGetWebGLMessage:function(t){var e,n,i;t=t||{},e=void 0!==t.parent?t.parent:document.body,n=void 0!==t.id?t.id:"oldie",i=Detector.getWebGLErrorMessage(),i.id=n,e.appendChild(i)}},t.exports=Detector},function(t,e){t.exports={circular:function(){function t(t){var e=t.x-a[0],r=t.y-a[1],s=Math.sqrt(e*e+r*r);if(s+=1e-9,!s||s>=o)return{x:t.x,y:t.y,z:s>=o?1:10};var u=n*(1-Math.exp(-s*i))/s*.75+.25;return{x:a[0]+e*u,y:a[1]+r*u,z:Math.min(u,10)}}function e(){return n=Math.exp(r),n=n/(n-1)*o,i=r/o,t}var n,i,o=200,r=2,a=[0,0];return t.radius=function(t){return arguments.length?(o=+t,e()):o},t.distortion=function(t){return arguments.length?(r=+t,e()):r},t.focus=function(e){return arguments.length?(a=e,t):a},e()}}},function(t,e){t.exports={en:{loading:"Please wait, loading images…",what:"What's this?",hidehidemebuttoncopy:"OK",description:'<p>This page gives you an overview of the entire collection. Artworks have been grouped by similarity. It works just like a map so you can zoom in to look at single works.</p>       <h2>What am I looking at?</h2>       <p>      We trained an algorithm to identify similarities based on attributes like style and subject. On top we built this interface to show how it groups the works. We hope this novel way of navigating the collection makes it easier to discover new works.      </p>      <p>      The project received support from <a href="http://www.kulturradet.no/english">The Arts Council Norway</a> and is a collaboration between the Section for Digital Collection Management at the National Museum, <a href="http://www.auduno.com/">Audun Mathias Øygard</a> and <a href="http://bengler.no/principalcomponents">Bengler</a>.      </p><p>      <small><a href="https://github.com/bengler/propinquity">Get the source code</a></small>      </p>      '},no:{loading:"Vennligst vent, laster bilder…",hidehidemebuttoncopy:"Greit",what:"Hva er dette?",description:'<p>Her får du utsikt over hele samlingen i ett bilde. Vi har gruppert kunst med likhetstrekk og lar deg se samlingen i fugleperspektiv. Samtidig kan du zoome inn på detaljer i enkeltverk hvis du ønsker.</p>      <h2>Hva er dette?</h2>       <p>      Vi spurte oss selv: kan vi trene opp en algoritme til å se likheter i samlingen vår og bruke det til å gi bedre oversikt?       </p><p>      Ved hjelp av maskinlæring viser vi her algoritmens organisering av bildene våre etter likheter i motiv og stil. Vi håper dere vil ha nytte av en ny innfallsvinkel til kunsten på nettsidene våre og at visningen oppfordrer til nye oppdagelsesferder i samlingene.      </p><p>      Prosjektet er støttet av <a href="">Norsk kulturråd</a> og utført av seksjon Digital Samlingsforvaltning på Nasjonalmuseet i samarbeid med <a href="http://www.auduno.com/">Audun Mathias Øygard</a> og <a href="http://bengler.no/principalcomponents">Bengler</a>.      </p><p>      <small><a href="https://github.com/bengler/propinquity">Ta en titt på kildekoden</a></small>      </p>'}}},function(t,e,n){(function(n){var i,o,r=r||function(){var t=[];return{getAll:function(){return t},removeAll:function(){t=[]},add:function(e){t.push(e)},remove:function(e){var n=t.indexOf(e);n!==-1&&t.splice(n,1)},update:function(e,n){if(0===t.length)return!1;var i=0;for(e=void 0!==e?e:r.now();i<t.length;)t[i].update(e)||n?i++:t.splice(i,1);return!0}}}();"undefined"==typeof window&&"undefined"!=typeof n?r.now=function(){var t=n.hrtime();return 1e3*t[0]+t[1]/1e6}:"undefined"!=typeof window&&void 0!==window.performance&&void 0!==window.performance.now?r.now=window.performance.now.bind(window.performance):void 0!==Date.now?r.now=Date.now:r.now=function(){return(new Date).getTime()},r.Tween=function(t){var e,n=t,i={},o={},a={},s=1e3,u=0,c=!1,l=!1,d=!1,m=0,p=null,h=r.Easing.Linear.None,f=r.Interpolation.Linear,g=[],v=null,w=!1,y=null,b=null,E=null;this.to=function(t,e){return o=t,void 0!==e&&(s=e),this},this.start=function(t){r.add(this),l=!0,w=!1,p=void 0!==t?t:r.now(),p+=m;for(var e in o){if(o[e]instanceof Array){if(0===o[e].length)continue;o[e]=[n[e]].concat(o[e])}void 0!==n[e]&&(i[e]=n[e],i[e]instanceof Array==0&&(i[e]*=1),a[e]=i[e]||0)}return this},this.stop=function(){return l?(r.remove(this),l=!1,null!==E&&E.call(n,n),this.stopChainedTweens(),this):this},this.end=function(){return this.update(p+s),this},this.stopChainedTweens=function(){for(var t=0,e=g.length;t<e;t++)g[t].stop()},this.delay=function(t){return m=t,this},this.repeat=function(t){return u=t,this},this.repeatDelay=function(t){return e=t,this},this.yoyo=function(t){return c=t,this},this.easing=function(t){return h=t,this},this.interpolation=function(t){return f=t,this},this.chain=function(){return g=arguments,this},this.onStart=function(t){return v=t,this},this.onUpdate=function(t){return y=t,this},this.onComplete=function(t){return b=t,this},this.onStop=function(t){return E=t,this},this.update=function(t){var r,l,E;if(t<p)return!0;w===!1&&(null!==v&&v.call(n,n),w=!0),l=(t-p)/s,l=l>1?1:l,E=h(l);for(r in o)if(void 0!==i[r]){var x=i[r]||0,M=o[r];M instanceof Array?n[r]=f(M,E):("string"==typeof M&&(M="+"===M.charAt(0)||"-"===M.charAt(0)?x+parseFloat(M):parseFloat(M)),"number"==typeof M&&(n[r]=x+(M-x)*E))}if(null!==y&&y.call(n,E),1===l){if(u>0){isFinite(u)&&u--;for(r in a){if("string"==typeof o[r]&&(a[r]=a[r]+parseFloat(o[r])),c){var I=a[r];a[r]=o[r],o[r]=I}i[r]=a[r]}return c&&(d=!d),p=void 0!==e?t+e:t+m,!0}null!==b&&b.call(n,n);for(var T=0,k=g.length;T<k;T++)g[T].start(p+s);return!1}return!0}},r.Easing={Linear:{None:function(t){return t}},Quadratic:{In:function(t){return t*t},Out:function(t){return t*(2-t)},InOut:function(t){return(t*=2)<1?.5*t*t:-.5*(--t*(t-2)-1)}},Cubic:{In:function(t){return t*t*t},Out:function(t){return--t*t*t+1},InOut:function(t){return(t*=2)<1?.5*t*t*t:.5*((t-=2)*t*t+2)}},Quartic:{In:function(t){return t*t*t*t},Out:function(t){return 1- --t*t*t*t},InOut:function(t){return(t*=2)<1?.5*t*t*t*t:-.5*((t-=2)*t*t*t-2)}},Quintic:{In:function(t){return t*t*t*t*t},Out:function(t){return--t*t*t*t*t+1},InOut:function(t){return(t*=2)<1?.5*t*t*t*t*t:.5*((t-=2)*t*t*t*t+2)}},Sinusoidal:{In:function(t){return 1-Math.cos(t*Math.PI/2)},Out:function(t){return Math.sin(t*Math.PI/2)},InOut:function(t){return.5*(1-Math.cos(Math.PI*t))}},Exponential:{In:function(t){return 0===t?0:Math.pow(1024,t-1)},Out:function(t){return 1===t?1:1-Math.pow(2,-10*t)},InOut:function(t){return 0===t?0:1===t?1:(t*=2)<1?.5*Math.pow(1024,t-1):.5*(-Math.pow(2,-10*(t-1))+2)}},Circular:{In:function(t){return 1-Math.sqrt(1-t*t)},Out:function(t){return Math.sqrt(1- --t*t)},InOut:function(t){return(t*=2)<1?-.5*(Math.sqrt(1-t*t)-1):.5*(Math.sqrt(1-(t-=2)*t)+1)}},Elastic:{In:function(t){return 0===t?0:1===t?1:-Math.pow(2,10*(t-1))*Math.sin(5*(t-1.1)*Math.PI)},Out:function(t){return 0===t?0:1===t?1:Math.pow(2,-10*t)*Math.sin(5*(t-.1)*Math.PI)+1},InOut:function(t){return 0===t?0:1===t?1:(t*=2,t<1?-.5*Math.pow(2,10*(t-1))*Math.sin(5*(t-1.1)*Math.PI):.5*Math.pow(2,-10*(t-1))*Math.sin(5*(t-1.1)*Math.PI)+1)}},Back:{In:function(t){var e=1.70158;return t*t*((e+1)*t-e)},Out:function(t){var e=1.70158;return--t*t*((e+1)*t+e)+1},InOut:function(t){var e=2.5949095;return(t*=2)<1?.5*(t*t*((e+1)*t-e)):.5*((t-=2)*t*((e+1)*t+e)+2)}},Bounce:{In:function(t){return 1-r.Easing.Bounce.Out(1-t)},Out:function(t){return t<1/2.75?7.5625*t*t:t<2/2.75?7.5625*(t-=1.5/2.75)*t+.75:t<2.5/2.75?7.5625*(t-=2.25/2.75)*t+.9375:7.5625*(t-=2.625/2.75)*t+.984375},InOut:function(t){return t<.5?.5*r.Easing.Bounce.In(2*t):.5*r.Easing.Bounce.Out(2*t-1)+.5}}},r.Interpolation={Linear:function(t,e){var n=t.length-1,i=n*e,o=Math.floor(i),a=r.Interpolation.Utils.Linear;return e<0?a(t[0],t[1],i):e>1?a(t[n],t[n-1],n-i):a(t[o],t[o+1>n?n:o+1],i-o)},Bezier:function(t,e){for(var n=0,i=t.length-1,o=Math.pow,a=r.Interpolation.Utils.Bernstein,s=0;s<=i;s++)n+=o(1-e,i-s)*o(e,s)*t[s]*a(i,s);return n},CatmullRom:function(t,e){var n=t.length-1,i=n*e,o=Math.floor(i),a=r.Interpolation.Utils.CatmullRom;return t[0]===t[n]?(e<0&&(o=Math.floor(i=n*(1+e))),a(t[(o-1+n)%n],t[o],t[(o+1)%n],t[(o+2)%n],i-o)):e<0?t[0]-(a(t[0],t[0],t[1],t[1],-i)-t[0]):e>1?t[n]-(a(t[n],t[n],t[n-1],t[n-1],i-n)-t[n]):a(t[o?o-1:0],t[o],t[n<o+1?n:o+1],t[n<o+2?n:o+2],i-o)},Utils:{Linear:function(t,e,n){return(e-t)*n+t},Bernstein:function(t,e){var n=r.Interpolation.Utils.Factorial;return n(t)/n(e)/n(t-e)},Factorial:function(){var t=[1];return function(e){var n=1;if(t[e])return t[e];for(var i=e;i>1;i--)n*=i;return t[e]=n,n}}(),CatmullRom:function(t,e,n,i,o){var r=.5*(n-t),a=.5*(i-e),s=o*o,u=o*s;return(2*e-2*n+r+a)*u+(-3*e+3*n-2*r-a)*s+r*o+e}}},function(n){i=[],o=function(){return r}.apply(e,i),!(void 0!==o&&(t.exports=o))}(this)}).call(e,n(4))},function(t,e){function n(){throw new Error("setTimeout has not been defined")}function i(){throw new Error("clearTimeout has not been defined")}function o(t){if(l===setTimeout)return setTimeout(t,0);if((l===n||!l)&&setTimeout)return l=setTimeout,setTimeout(t,0);try{return l(t,0)}catch(e){try{return l.call(null,t,0)}catch(e){return l.call(this,t,0)}}}function r(t){if(d===clearTimeout)return clearTimeout(t);if((d===i||!d)&&clearTimeout)return d=clearTimeout,clearTimeout(t);try{return d(t)}catch(e){try{return d.call(null,t)}catch(e){return d.call(this,t)}}}function a(){f&&p&&(f=!1,p.length?h=p.concat(h):g=-1,h.length&&s())}function s(){if(!f){var t=o(a);f=!0;for(var e=h.length;e;){for(p=h,h=[];++g<e;)p&&p[g].run();g=-1,e=h.length}p=null,f=!1,r(t)}}function u(t,e){this.fun=t,this.array=e}function c(){}var l,d,m=t.exports={};!function(){try{l="function"==typeof setTimeout?setTimeout:n}catch(t){l=n}try{d="function"==typeof clearTimeout?clearTimeout:i}catch(t){d=i}}();var p,h=[],f=!1,g=-1;m.nextTick=function(t){var e=new Array(arguments.length-1);if(arguments.length>1)for(var n=1;n<arguments.length;n++)e[n-1]=arguments[n];h.push(new u(t,e)),1!==h.length||f||o(s)},u.prototype.run=function(){this.fun.apply(null,this.array)},m.title="browser",m.browser=!0,m.env={},m.argv=[],m.version="",m.versions={},m.on=c,m.addListener=c,m.once=c,m.off=c,m.removeListener=c,m.removeAllListeners=c,m.emit=c,m.binding=function(t){throw new Error("process.binding is not supported")},m.cwd=function(){return"/"},m.chdir=function(t){throw new Error("process.chdir is not supported")},m.umask=function(){return 0}},function(t,e,n){function i(){H=document.getElementById("container"),Detector.webgl?(R=new THREE.WebGLRenderer({antialias:!1,alpha:!0,logarithmicDepthBuffer:!0}),R.context.getSupportedExtensions(),ct="jpg"):(R=new THREE.CanvasRenderer({antialias:!1,alpha:!0}),ct="jpg",vt=!0,mosaics=canvas_mosaics),R.setClearColor(2236962),R.setPixelRatio(window.devicePixelRatio),R.setSize(window.innerWidth,window.innerHeight),H.appendChild(R.domElement);for(var t=0;t<mosaics.length;t++)F+=mosaics[t].tiles;var e=collection.map(function(t){return t.embedding_x}),n=collection.map(function(t){return t.embedding_y});e.sort(function(t,e){return t-e}),n.sort(function(t,e){return t-e});var i=Math.floor(.01*F),o=Math.floor(.99*F);nt=1.1*(e[o]-e[i]),it=1.1*(n[o]-n[i]),ht=e[F-1],pt=e[0],maxY=n[F-1],minY=n[0],P=Math.sqrt(Math.PI*Math.pow((nt+it)/4,2)/F);var r=10*P;ut=S.circular().radius(r).distortion(gt);var s=ft,u=Math.exp(s)/(Math.exp(s)-1)*r;st=(u*(1-Math.exp(-.001*s/r))/.001*.75+.25)*mt;var c=T(nt,it),l=window.innerWidth/window.innerHeight,d=P/Math.tan(.5*c*Math.PI/180);d=l>1?d:d/l,rt=mt+.564*d,at=st+2.336*d,_=new THREE.PerspectiveCamera(c,window.innerWidth/window.innerHeight,10,3500),_.position.z=2e3,z=new THREE.Scene,void 0!==I(Et.id)&&(wt=I(Et.id),dt=new THREE.Vector3(collection[wt].embedding_x,collection[wt].embedding_y,mt+2)),W=new THREE.Geometry;for(var t=0;t<F;t++){var m=collection[t].image_width*collection[t].image_height,p=P/Math.sqrt(m);collection[t].draw_width=collection[t].image_width*p,collection[t].draw_height=collection[t].image_height*p;var h=new THREE.PlaneGeometry(collection[t].draw_width,collection[t].draw_height),g=new THREE.Mesh(h);g.position.x=collection[t].embedding_x,g.position.y=collection[t].embedding_y,wt==t?g.position.z=mt+2.1:g.position.z=mt+1e-4*t,g.updateMatrix(),W.merge(g.geometry,g.matrix)}var v=function(){for(var t=[],e=0,n=0;n<D;n++){for(var i=mosaics[n].mosaicWidth,o=mosaics[n].tileSize,r=mosaics[n].pixelWidth,a=0;a<mosaics[n].tiles;a++){var s=a%i*o/r,u=Math.floor(a/i)*o/r,c=s+o/r,l=u+o/r;vt&&(u=1-u,l=1-l);var d=[new THREE.Vector2(s,u),new THREE.Vector2(s,l),new THREE.Vector2(c,l),new THREE.Vector2(c,u)];W.faceVertexUvs[0][2*e]=[d[0],d[1],d[3]],W.faceVertexUvs[0][2*e+1]=[d[1],d[2],d[3]],W.faces[2*e].materialIndex=n,W.faces[2*e+1].materialIndex=n,e+=1}t[n]=new THREE.MeshBasicMaterial({map:y[n],overdraw:!0})}t[D]=new THREE.MeshBasicMaterial({overdraw:!0});var m=new THREE.MultiMaterial(t);if(W=(new THREE.BufferGeometry).fromGeometry(W),void 0!==I(Et.id)){var p=new THREE.MeshBasicMaterial({color:16777198,transparent:!0,opacity:.3,overdraw:!0}),h=new THREE.CircleGeometry(1*Math.sqrt(1*P*P),32);lt=new THREE.Mesh(h,p),lt.position.set(dt.x,dt.y,dt.z),z.add(lt)}j=new THREE.Mesh(W,m),z.add(j),document.getElementById("message").style.display="none",f()},w=0;D=mosaics.length;var y=[];X=new bt.jpg,G=new bt[ct];for(var t=0;t<D;t++){var b=G.load(ot+mosaics[t].image[ct],function(t){t.flipY=!1,w+=1,w==D&&v()});y[t]=b}B=new THREE.Raycaster,Y=new THREE.Vector2,O=new THREE.TrackballControls(_),O.minDistance=rt,O.maxDistance=2200,O.noRotate=!0,O.noMouseZoom=!0,O.panSpeed=.5,O.staticMoving=!0,O.enabled=!1,O.maxPanX=ht,O.minPanX=pt,O.maxPanY=maxY,O.minPanY=minY,O.unprojectZ=mt,window.addEventListener("resize",a,!1)}function o(t){Y.x=t.clientX/window.innerWidth*2-1,Y.y=2*-(t.clientY/window.innerHeight)+1,C=[Y.x,Y.y]}function r(t){$=!1;var e=t.clientX/window.innerWidth*2-1,n=2*-(t.clientY/window.innerHeight)+1,i=C[0],o=C[1],r=Math.sqrt((e-i)*(e-i)+(n-o)*(n-o));if(q>=0&&r<.01){var a=collection[q].identifier,s="http://samling.nasjonalmuseet.no/no/object/"+a.replace("&","_");window.open(s,"_blank")}}function a(){_.fov=T(nt,it),_.aspect=window.innerWidth/window.innerHeight,_.updateProjectionMatrix(),R.setSize(window.innerWidth,window.innerHeight),O.handleResize()}function s(t){N=-1}function u(t){if(t.preventDefault(),!$){if(tt&&(tt=!1,O.unprojectZ=st,O.minDistance=at),O.ismousedown)return void(N=-1);Y.x=t.clientX/window.innerWidth*2-1,Y.y=2*-(t.clientY/window.innerHeight)+1,l(Y),N==-1&&c(Y)}}function c(t){var e=new THREE.Vector3;e.set(t.x,t.y,1),e.unproject(_);var n=e.sub(_.position).normalize(),i=(st-_.position.z)/n.z;if(t=_.position.clone().add(n.multiplyScalar(i)),gt<ft-.1){gt+=(ft-gt)/20;var o=10*P;ut=S.circular().radius(o).distortion(gt)}ut.focus([t.x,t.y]);for(var r=0;r<collection.length;r++){var a=collection[r].embedding_x,s=collection[r].embedding_y,u=ut({x:a,y:s}),c=collection[r].draw_width/2,l=collection[r].draw_height/2,d=c+.7*(u.z-1)*c,m=l+.7*(u.z-1)*l,p=u.x,h=u.y;if(wt==r)var f=u.z*mt+2.1;else var f=u.z*mt+1e-4*r;W.attributes.position.setXYZ(6*r,p-d,h+m,f),W.attributes.position.setXYZ(6*r+1,p-d,h-m,f),W.attributes.position.setXYZ(6*r+2,p+d,h+m,f),W.attributes.position.setXYZ(6*r+3,p-d,h-m,f),W.attributes.position.setXYZ(6*r+4,p+d,h-m,f),W.attributes.position.setXYZ(6*r+5,p+d,h+m,f)}if(W.attributes.position.needsUpdate=!0,wt>=0){var u=ut({x:dt.x,y:dt.y}),c=P/2,d=c+.7*(u.z-1)*c;lt.scale.x=d/c,lt.scale.y=d/c,lt.position.x=u.x,lt.position.y=u.y,lt.position.z=u.z*mt+2}}function l(t){var e=new THREE.Vector3(t.x,t.y,0),n=e.length();N=n>Q&&n<K?e:-1}function d(t){tt||(tt=!0,O.minDistance=rt,O.unprojectZ=mt)}function m(t){et=!0}function p(t){t.preventDefault(),Y.x=t.changedTouches[0].pageX/window.innerWidth*2-1,Y.y=2*-(t.changedTouches[0].pageY/window.innerHeight)+1;var e=q;if(!et&&(g(),q>=0)){var n=collection[q].identifier,i="http://samling.nasjonalmuseet.no/no/object/"+n.replace("&","_");q!=e||$||window.open(i,"_blank");var o=collection[q];document.getElementById("imageinfo").innerHTML="<p><strong>"+o.artist+", <a href='"+i+"' target='_blank'><em>"+o.title+"</em></a></strong>. "+o.yearstring+"</p>"}$&&($=!1),et=!1}function h(t){if(t.preventDefault(),t.stopPropagation(),q>=0){var e=collection[q].identifier,n="http://samling.nasjonalmuseet.no/no/object/"+e.replace("&","_");window.open(n,"_blank")}}function f(){if(!$&&N!=-1&&!O.ismousedown){var t=N.clone(),e=(Math.min(t.length(),K)-Q)/(K-Q),n=_.position.z/2200,i=1*Math.sin(e*Math.PI)*n;t.x*=i,t.y*=i;var o=O.target.x+N.x,r=O.target.y+N.y;N.x<0&&o<pt&&(t.x=0),N.x>0&&o>ht&&(t.x=0),N.y<0&&r<minY&&(t.y=0),N.y>0&&r>maxY&&(t.y=0),_.position.addVectors(_.position,t),O.target.addVectors(O.target,t);var a={x:N.x,y:N.y};c(a)}requestAnimationFrame(f),O.update(),v(),U.update()}function g(){B.setFromCamera(Y,_);var t=B.intersectObject(j);if(t.length>0){var e=Math.floor(t[0].face.a/6);if(q==-1){var n=collection[e];if(document.getElementById("imageinfo").innerHTML="<p><strong>"+n.artist+", <em>"+n.title+"</em></strong>. "+n.yearstring+"</p>",document.getElementById("imageinfo").style.display="block",document.getElementById("container").setAttribute("class","clickable"),q=e,tt){for(var i=0;i<6;i++)W.attributes.position.setZ(6*q+i,W.attributes.position.getZ(6*q+i)+2);W.attributes.position.needsUpdate=!0}setTimeout(function(){q==e&&w(e)},100)}else if(e!=q){var n=collection[e];if(document.getElementById("imageinfo").innerHTML="<p><strong>"+n.artist+", <em>"+n.title+"</em></strong>. "+n.yearstring+"</p>",y(q),tt){for(var i=0;i<6;i++)W.attributes.position.setZ(6*q+i,W.attributes.position.getZ(6*q+i)-2),W.attributes.position.setZ(6*e+i,W.attributes.position.getZ(6*e+i)+2);W.attributes.position.needsUpdate=!0}q=e,setTimeout(function(){q==e&&w(e)},100)}}else if(q!=-1){if(tt){for(var i=0;i<6;i++)W.attributes.position.setZ(6*q+i,W.attributes.position.getZ(6*q+i)-2);W.attributes.position.needsUpdate=!0}y(q),q=-1,document.getElementById("imageinfo").style.display="none",document.getElementById("container").setAttribute("class","")}}function v(){if(tt||g(),R.render(z,_),J){if(R.domElement.addEventListener("mousemove",u,!1),document.addEventListener("wheel",b,!1),document.addEventListener("touchstart",d,!1),R.domElement.addEventListener("touchmove",m,!1),document.addEventListener("touchcancel",p,!1),R.domElement.addEventListener("touchend",p,!1),document.addEventListener("mouseout",s,!1),R.domElement.addEventListener("mousedown",o,!1),R.domElement.addEventListener("mouseup",r,!1),document.getElementById("imageinfo").addEventListener("touchend",h,!1),document.getElementById("ui_zoom_in").addEventListener("click",E,!1),document.getElementById("ui_zoom_in").addEventListener("touchend",E,!1),document.getElementById("ui_zoom_out").addEventListener("click",x,!1),document.getElementById("ui_zoom_out").addEventListener("touchend",x,!1),document.getElementById("ui_reset").addEventListener("click",M,!1),document.getElementById("ui_reset").addEventListener("touchend",M,!1),O.enabled=!0,localStorage.setItem("propinquity","true"),void 0!==Et.id){var t=I(Et.id),e=[collection[t].embedding_x,collection[t].embedding_y];void 0!==e&&(xt(e),$=!0)}J=!1}}function w(t){var e=""+collection[t].sequence_id;"0000".substring(0,4-e.length)+e,V=X.load("https://mm.dimu.org/image/"+collection[t].image_id+"?dimension=400x400",function(e){if(q==t){j.material.materials[D].map=e,j.material.materials[D].needsUpdate=!0,j.material.needsUpdate=!0,j.geometry.attributes.uv.setXY(6*t,0,1),j.geometry.attributes.uv.setXY(6*t+1,0,0),j.geometry.attributes.uv.setXY(6*t+2,1,1),j.geometry.attributes.uv.setXY(6*t+3,0,0),j.geometry.attributes.uv.setXY(6*t+4,1,0),j.geometry.attributes.uv.setXY(6*t+5,1,1),j.geometry.attributes.uv.needsUpdate=!0;var n=Math.floor(t/mosaics[0].tiles);j.geometry.clearGroups();for(var i=0,o=0;o<D;o++){if(o==n){var r=t-i;j.geometry.addGroup(6*i,6*r,o),j.geometry.addGroup(6*t,6,D),j.geometry.addGroup(6*(i+r+1),6*(mosaics[o].tiles-r-1),o)}else j.geometry.addGroup(6*i,6*mosaics[o].tiles,o);i+=mosaics[o].tiles}j.geometry.groupsNeedUpdate=!0}})}function y(t){highResImageIndex=-1;var e=Math.floor(t/mosaics[0].tiles),n=t%mosaics[0].tiles,i=mosaics[e].mosaicWidth,o=mosaics[e].tileSize,r=mosaics[e].pixelWidth,a=n%i*o/r,s=Math.floor(n/i)*o/r,u=a+o/r,c=s+o/r;vt&&(s=1-s,c=1-c),j.geometry.clearGroups();for(var l=0,n=0;n<mosaics.length;n++)j.geometry.addGroup(6*l,6*mosaics[n].tiles,n),l+=mosaics[n].tiles;j.geometry.groupsNeedUpdate=!0,j.geometry.attributes.uv.setXY(6*t,a,s),j.geometry.attributes.uv.setXY(6*t+1,a,c),j.geometry.attributes.uv.setXY(6*t+2,u,s),j.geometry.attributes.uv.setXY(6*t+3,a,c),j.geometry.attributes.uv.setXY(6*t+4,u,c),j.geometry.attributes.uv.setXY(6*t+5,u,s),j.geometry.attributes.uv.needsUpdate=!0,V&&V.dispose()}function b(t){var e=.02,n=t.clientX/window.innerWidth*2-1,i=2*-(t.clientY/window.innerHeight)+1,o=new THREE.Vector3(n,i,1);o.unproject(_),o.sub(_.position);var r=o.setLength(_.position.length()*e);t.deltaY<0||t.detail<0?(r.z+_.position.z<O.minDistance&&(r.z=O.minDistance-_.position.z),r.z<0&&(_.position.addVectors(_.position,r),r.z=0,O.target.addVectors(O.target,r))):(_.position.z-r.z>O.maxDistance&&(r.z=_.position.z-O.maxDistance),r.z<0&&(_.position.subVectors(_.position,r),r.z=0,O.target.subVectors(O.target,r)))}function E(t){t.preventDefault(),t.stopPropagation(),O.zoomIn()}function x(t){t.preventDefault(),t.stopPropagation(),O.zoomOut()}function M(t){t.preventDefault(),t.stopPropagation(),O.reset()}function I(t){for(var e=0;e<collection.length;e++)if(collection[e].identifier==t)return e}function T(t,e){var n=2e3,i=window.innerWidth/window.innerHeight,o=2*Math.atan(1.1*t/i/(2*n))*(180/Math.PI),r=2*Math.atan(1.1*e/(2*n))*(180/Math.PI),a=o>r?o:r;return a}function k(t,e){var n=document.createElement("script");n.src=t,n.onload=e,document.body.appendChild(n)}function L(){var t=document.getElementById("moreinfocontainer");t.style.display="block",t.classList.add("showing")}var H,_,z,R,B,Y,O,j,W,P,C,D,G,X,V,U=n(3),S=n(1),Z=(n(0),n(2)),A="http://vycdn.nasjonalmuseet.no",q=-1,F=0,N=-1,Q=.55,K=.99,J=!0,$=!1,tt=!0,et=!1;THREE.ImageUtils.crossOrigin="";var nt,it,ot,rt,at,st,ut,ct,lt,dt,mt=20,pt=minY=1/0,ht=maxY=-(1/0),ft=5,gt=1e-4,vt=!1,wt=-1,yt="en",bt={s3tc:THREE.DDSLoader,pvrtc:THREE.PVRLoader,jpg:THREE.TextureLoader},Et=function(t){if(""==t)return{};for(var e={},n=0;n<t.length;++n){var i=t[n].split("=",2);1==i.length?e[i[0]]="":e[i[0]]=decodeURIComponent(i[1].replace(/\+/g," "))}return e}(window.location.search.substr(1).split("&")),xt=function(t){var e=_.position.clone();e.factor=0;var n=new U.Tween(e).to({x:t[0],y:t[1],z:320,factor:1},1500).onUpdate(function(){_.position.x=this.x,_.position.y=this.y,_.position.z=this.z,O.target=new THREE.Vector3(this.x,this.y,0)}).onComplete(function(){$=!1,Y.x=0,Y.y=0,g()});n.easing(U.Easing.Exponential.InOut),n.delay(200),n.start()};ot=void 0!==Et.collection?A+"/data/"+Et.collection+"/":A+"/data/painting_subject/",k(ot+"collection.js",i),preferredLanguage=navigator.languages?navigator.languages[0]:navigator.language||navigator.userLanguage,"no"!=Et.lang&&"nb_NO"!=preferredLanguage&&"nn_NO"!=preferredLanguage||(yt="no"),document.getElementById("messagecontent").innerHTML=Z[yt].loading,document.getElementById("moreinfo").innerHTML=Z[yt].description,document.getElementById("moreinfolink").innerHTML=Z[yt].what,document.getElementById("hidemebutton").innerHTML=Z[yt].hidehidemebuttoncopy,void 0==localStorage.getItem("propinquity")&&L(),document.getElementById("moreinfolink").addEventListener("click",function(t){L()}),document.getElementById("hidemebutton").addEventListener("click",function(t){var e=document.getElementById("moreinfocontainer");e.style.display="none",e.classList.remove("showing")})}]);