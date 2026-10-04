import React,{useEffect,useMemo,useRef,useState}from'react';import{createRoot}from'react-dom/client';import{AnimatePresence,motion,useScroll,useSpring}from'framer-motion';import{ArrowLeft,ArrowRight,Check,ChevronLeft,ChevronRight,Flower2,Image,Maximize2,Menu,MessageCircle,Minus,Plus,Send,ShoppingBag,Sparkles,Star,X}from'lucide-react';import DesignStudio from './DesignStudio.jsx';
import CheckoutModal from './CheckoutModal.jsx';
import './styles.css';
const PHONE='916303627115',UPI='7993109482@axl';
const INSTAGRAM='https://www.instagram.com/party._.petals?stkn=eWlhd2t1Z2ozOHY1';
const plans=[{id:1,n:'The Intimate',p:3499,d:'For warm celebrations at home',f:['Statement backdrop','Organic balloon styling','Cake table composition','Personalised welcome sign']},{id:2,n:'The Signature',p:6499,d:'Our most-loved complete look',hot:true,f:['Concept-led stage styling','Premium balloon palette','Three-dimensional props','Cake and guest table details']},{id:3,n:'The Grand Edit',p:11999,d:'A room-transforming experience',f:['Full venue visual direction','Stage and entrance styling','Floral and lighting accents','Dedicated event coordinator']}];
const createMediaRange=(category,start,end)=>Array.from(
  {length:end-start+1},
  (_,index)=>{
    const number=start+index;
    return [`${category} Design ${index+1}`,`${category} decoration by Party Petals`,`media-${number}.webp`];
  }
);
const designs={
  birthday:[['Blush Garden','Elegant pastel birthday','birthday-blush.webp'],['Little Dreamer','Kids cloud theme','birthday-kids.webp'],['Sage Teddy','Minimal first birthday','birthday-teddy.webp'],...createMediaRange('Birthday',1,14)],
  wedding:[['Plum Vows','Luxury wedding stage','wedding-plum.webp'],['Ivory Garden','Floral engagement stage','wedding-ivory.webp'],...createMediaRange('Wedding',15,36)],
  anniversary:[...createMediaRange('Anniversary',38,58)],
  baby:[['Moonlit Welcome','Blue and gold baby shower','baby-moon.webp'],['Soft Bloom','Pastel baby welcome','baby-pastel.webp'],...createMediaRange('Baby Welcome',59,85)],
  proposal:[['After Dark','Romantic floral proposal','proposal-night.webp']]
};
const designPrices=[2499,2999,3499,3999,4499,4999,5499,5999,6499,6999,7499];
const allDesigns=Object.entries(designs).flatMap(([type,items])=>items.map(([name,style,file],index)=>({
  id:`design-${type}-${file.replace(/[^a-z0-9]/gi,'-').toLowerCase()}`,
  type,name,n:name,style,file,img:`/designs/${file}`,
  p:designPrices[(index+type.length)%designPrices.length]
})));
const chat={start:['What are you celebrating?',[['Birthday','birthday'],['Wedding','wedding'],['Baby welcome','baby'],['Anniversary','anniversary'],['Help me choose','budget']]],birthday:['What would you like next?',[['Show birthday photos','showbirthday'],['At-home package','intimate'],['Party-hall package','signature']]],wedding:['What would you like next?',[['Show wedding photos','showwedding'],['Stage package','signature'],['Full venue styling','grand']]],baby:['What would you like next?',[['Show baby photos','showbaby'],['Simple styling','intimate'],['Theme styling','signature']]],anniversary:['What would you like next?',[['Show anniversary photos','showanniversary'],['Simple styling','intimate'],['Theme styling','signature']]],budget:['Choose a starting budget.',[['Below ₹5,000','intimate'],['₹5,000 to ₹10,000','signature'],['Above ₹10,000','grand']]],intimate:['The Intimate is a good fit.',[['Add package','add1'],['View collections','packages']]],signature:['The Signature is our most-requested collection.',[['Add package','add2'],['View collections','packages']]],grand:['The Grand Edit is ideal for a high-impact event.',[['Add package','add3'],['Request custom quote','book']]],custom:['Share your date, location, theme and budget.',[['Open enquiry','book'],['WhatsApp','wa']]]};
const knowledge=[{keys:['birthday photo','birthday design','show birthday','birthday decoration'],answer:'Here are birthday designs from our portfolio. Tap a card to open the full preview.',gallery:'birthday'},{keys:['wedding photo','wedding design','show wedding'],answer:'Here are wedding and engagement styling ideas.',gallery:'wedding'},{keys:['baby shower photo','baby design','show baby'],answer:'Here are baby shower and baby welcome designs.',gallery:'baby'},{keys:['proposal photo','proposal design','show proposal'],answer:'Here are proposal and anniversary concepts.',gallery:'proposal'},{keys:['anniversary photo','anniversary design','show anniversary','anniversary decoration'],answer:'Here are anniversary decoration ideas from our portfolio.',gallery:'anniversary'},{keys:['photo','photos','gallery','designs','portfolio'],answer:'Which gallery would you like to see?',opts:[['Birthday photos','showbirthday'],['Wedding photos','showwedding'],['Anniversary photos','showanniversary'],['Baby welcome photos','showbaby'],['Proposal photos','showproposal']]},{keys:['custom design','generate','ai design','my design','imagine','beach'],answer:'Use the Design Studio to create an inspiration concept from your idea.',opts:[['Open Design Studio','studio'],['WhatsApp','wa']]},{keys:['price','cost','rate','package','how much'],answer:'Packages start at ₹3,499. The Signature at ₹6,499 is our most-requested option.',opts:chat.budget[1]},{keys:['payment','pay','phonepe','phone pe','upi','gpay'],answer:'On mobile, Continue to UPI opens an installed UPI application with the total amount.',opts:[['View collections','packages'],['WhatsApp','wa']]},{keys:['book','availability','date'],answer:'Send the event date and location through our enquiry form.',opts:[['Open enquiry','book'],['WhatsApp','wa']]},{keys:['hello','hi','hey'],answer:'Hello! Tell me your occasion, budget, venue or preferred style.',opts:chat.start[1]}];
const clean=t=>t.toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();const findReply=value=>{const q=clean(value);let best=null,score=0;knowledge.forEach(item=>{let s=0;item.keys.forEach(k=>{if(q.includes(k))s+=k.includes(' ')?5:3});if(s>score){score=s;best=item}});return best||{answer:'Ask me about photos, packages, prices, payment, booking or a custom design.',opts:[['Show photos','showbirthday'],['Help me choose','budget'],['WhatsApp','wa']]}};
const photoOk=e=>{e.currentTarget.classList.add('loaded')};const photoFail=e=>{e.currentTarget.style.display='none'};
function App(){const messagesRef=useRef(null),messagesEndRef=useRef(null);const{scrollYProgress}=useScroll();const scaleX=useSpring(scrollYProgress,{stiffness:100,damping:30});const[menu,setMenu]=useState(false),[cart,setCart]=useState([]),[drawer,setDrawer]=useState(false),[bot,setBot]=useState(false),[input,setInput]=useState(''),[typing,setTyping]=useState(false),[selected,setSelected]=useState(null),[gallery,setGallery]=useState('birthday'),[toast,setToast]=useState(''),
[checkout,setCheckout]=useState(false),
[paying,setPaying]=useState(false),
[generatedConcept,setGeneratedConcept]=useState(''),
[customer,setCustomer]=useState({
  name: '',
  countryCode: '+91',
  mobile: '',
  email: '',
  city: '',
  pincode: '',
  occasion: '',
  eventDate: '',
  venue: '',
  idea: ''
}),
[messages,setMessages]=useState([{from:'bot',text:'Welcome to Party Petals. What are you celebrating?',opts:chat.start[1]}]);const total=useMemo(()=>cart.reduce((s,x)=>s+x.p*x.q,0),[cart]);
const scrollChat=(behavior='smooth')=>{requestAnimationFrame(()=>{const box=messagesRef.current;if(box)box.scrollTo({top:box.scrollHeight,behavior});messagesEndRef.current?.scrollIntoView({behavior,block:'nearest'})})};
useEffect(()=>{if(!bot)return;const timer=setTimeout(()=>scrollChat(messages.length<=1?'auto':'smooth'),80);return()=>clearTimeout(timer)},[messages,typing,bot]);
useEffect(()=>{if(!checkout)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous}},[checkout]);
const go=id=>{document.getElementById(id)?.scrollIntoView({behavior:'smooth'});setMenu(false)};const notify=t=>{setToast(t);setTimeout(()=>setToast(''),2200)};const add=p=>{setCart(c=>c.some(x=>x.id===p.id)?c.map(x=>x.id===p.id?{...x,q:x.q+1}:x):[...c,{...p,q:1}]);setDrawer(true);notify(`${p.n} added`)};const qty=(id,n)=>setCart(c=>c.map(x=>x.id===id?{...x,q:x.q+n}:x).filter(x=>x.q));const openGallery=(d,type)=>{const found=allDesigns.find(item=>item.type===type&&item.name===d[0]);if(found){setSelected(found);setGallery(type)}};const step=n=>{if(n.startsWith('show')){const type=n.slice(4);return{from:'bot',text:`Here are ${type==='baby'?'baby shower':type} designs. Tap to preview.`,gallery:type}}if(n.startsWith('add')){const p=plans[+n.slice(3)-1];add(p);return{from:'bot',text:`${p.n} has been added to your plan.`}}if(n==='wa'){window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent('Hello Party Petals, I need help planning an event.')}`,'_blank');return{from:'bot',text:'Opening WhatsApp.'}}if(['packages','work','studio','book'].includes(n)){go(n);setBot(false);return null}return{from:'bot',text:chat[n]?.[0]||'How else can I help?',opts:chat[n]?.[1]}};const choose=(label,n)=>{setMessages(m=>[...m,{from:'user',text:label}]);setTyping(true);setTimeout(()=>{const r=step(n);if(r)setMessages(m=>[...m,r]);setTyping(false)},400)};const send = async (e) => {
  e.preventDefault();

  const v = input.trim();

  if (!v) return;

  setMessages((m) => [
    ...m,
    {
      from: 'user',
      text: v
    }
  ]);

  setInput('');
  setTyping(true);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: v
      })
    });

    const data = await response.json();

    setMessages((m) => [
      ...m,
      {
        from: 'bot',
        text: data.reply || 'Sorry, I could not generate a response.'
      }
    ]);
  } catch (error) {
    setMessages((m) => [
      ...m,
      {
        from: 'bot',
        text: 'AI service is temporarily unavailable.'
      }
    ]);
  }

  setTyping(false);
};const openCheckout = event => { event?.preventDefault(); event?.stopPropagation(); if (cart.length === 0 || total <= 0) { notify('Please add a package before continuing'); return; } setCheckout(true); setDrawer(false); };

const pay = (event, bookingReference) => {
  event.preventDefault();

  const mobile = customer.mobile.replace(/\D/g, '');
  const pincode = customer.pincode.replace(/\D/g, '');

  if (!customer.name.trim()) { notify('Please enter your full name'); return false; }
  if (mobile.length < 7) { notify('Please enter a valid mobile number'); return false; }
  if (!customer.city.trim()) { notify('Please enter the event city'); return false; }
  if (pincode.length < 4) { notify('Please enter a valid pincode'); return false; }

  const paymentParameters = new URLSearchParams({
    pa: UPI,
    pn: 'Party Petals',
    am: total.toFixed(2),
    cu: 'INR',
    tn: `Party Petals booking ${bookingReference}`,
    tr: bookingReference,
  });

  sessionStorage.setItem(
    'partyPetalsCheckout',
    JSON.stringify({ bookingReference, customer, packages: cart, total })
  );

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    notify('Opening your UPI payment application');
    setTimeout(() => {
      window.location.href = `upi://pay?${paymentParameters.toString()}`;
    }, 500);
  } else {
    notify('Use the displayed UPI ID from your phone, then submit the transaction reference');
  }

  return true;
};
return <><motion.div className="progress" style={{scaleX}}/><header><button type="button" className="logo" onClick={()=>go('home')}><Flower2/><span>PARTY PETALS<small>EVENT EXPERIENCES</small></span></button><nav className={menu?'show':''}>{[['home','Home'],['stories','Occasions'],['packages','Collections'],['work','Portfolio'],['studio','Design studio'],['book','Enquire']].map(x=><button key={x[0]} onClick={()=>go(x[0])}>{x[1]}</button>)}</nav><button type="button" className="booktop" onClick={()=>go('book')}>CHECK A DATE <ArrowRight/></button><button type="button" className="bag" onClick={()=>setDrawer(true)}><ShoppingBag/><b>{cart.reduce((s,x)=>s+x.q,0)}</b></button><button type="button" className="hamb" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button></header>
<section id="home" className="hero"><div className="heroMedia"><img src="/designs/birthday-blush.webp" onLoad={photoOk} onError={photoFail}/><div className="heroShade"/></div><motion.div className="heroText" initial={{opacity:0,y:35}} animate={{opacity:1,y:0}}><p className="kicker"><Sparkles/> BESPOKE CELEBRATIONS</p><h1>Designed to feel<br/><i>entirely yours.</i></h1><p className="lead">Immersive décor for birthdays, weddings and meaningful moments, shaped around your venue, story and budget.</p><div className="heroBtns"><button className="gold" onClick={()=>go('work')}>EXPLORE OUR WORK <ArrowRight/></button><button className="glass" onClick={()=>go('studio')}>CREATE A CONCEPT</button></div><div className="proof"><span><b>Personal</b> themes</span><span><b>Clear</b> starting prices</span><span><b>Direct</b> coordination</span></div></motion.div><div className="heroMini"><img src="/designs/proposal-night.webp" onError={photoFail}/><span>Made for your moment</span></div></section>
<div className="ticker"><div>{('BIRTHDAYS ✦ WEDDINGS ✦ BABY WELCOMES ✦ PROPOSALS ✦ ANNIVERSARIES ✦ ').repeat(3)}</div></div>
<section id="stories" className="occasions"><div><p className="kicker">01 / OCCASIONS</p><h2>Every reason<br/>to <i>celebrate.</i></h2><p className="muted">Choose an occasion to see relevant ideas, then personalise every detail.</p></div><div className="occasionGrid">{Object.entries(designs).map(([type,items],i)=><button key={type} onClick={()=>openGallery(items[0],type)}><img src={`/designs/${items[0][2]}`} onError={photoFail}/><span>0{i+1}</span><h3>{type==='baby'?'Baby welcome':type[0].toUpperCase()+type.slice(1)}</h3><small>VIEW DESIGNS <ArrowRight/></small></button>)}</div></section>
<section id="packages" className="collections"><div className="titleRow"><div><p className="kicker">02 / COLLECTIONS</p><h2>A thoughtful start.<br/><i>Your final look.</i></h2></div><p>Transparent starting prices with room to customise.</p></div><div className="plans">{plans.map((p,i)=><motion.article key={p.id} whileHover={{y:-10}} className={p.hot?'hot':''}>{p.hot&&<span className="badge"><Star/> MOST REQUESTED</span>}<small>COLLECTION 0{i+1}</small><h3>{p.n}</h3><p>{p.d}</p><strong>₹{p.p.toLocaleString('en-IN')} <em>onwards</em></strong><ul>{p.f.map(f=><li key={f}><Check/>{f}</li>)}</ul><button onClick={()=>add(p)}>ADD TO MY PLAN <Plus/></button></motion.article>)}</div></section>
<section id="work" className="portfolio"><div className="portfolioHead"><div><p className="kicker">03 / PARTY PETALS PORTFOLIO</p><h2>Real inspiration.<br/><i>Endless possibilities.</i></h2></div><p>Browse our décor designs. Open any design for a full preview or add it directly to your celebration plan.</p></div><div className="rail">{[...allDesigns,...allDesigns].map((d,i)=><motion.article whileHover={{y:-8}} key={`${d.id}-${i}`} className="designCard"><button type="button" className="designPreview" onClick={()=>{setSelected(d);setGallery(d.type)}}><div className="designImage"><img src={d.img} onLoad={photoOk} onError={photoFail}/><Image/></div><small>{d.type.toUpperCase()}</small><h3>{d.name}</h3><p>{d.style}</p><span>OPEN DESIGN <Maximize2/></span></button><div className="designBuy"><div><small>STARTING PRICE</small><strong>₹{d.p.toLocaleString('en-IN')}</strong></div><button type="button" onClick={()=>add(d)}>ADD TO PLAN <Plus/></button></div></motion.article>)}</div></section>
<DesignStudio phone={PHONE} onGenerated={setGeneratedConcept}/>
<section className="trust"><p className="kicker">WHY PARTY PETALS</p><h2>Beautiful ideas.<br/><i>Calm execution.</i></h2><div><article><b>01</b><h3>Designed around you</h3><p>No copy-paste setup. Colours, props and scale respond to your event.</p></article><article><b>02</b><h3>Clear conversation</h3><p>Share the date, venue and budget directly through WhatsApp.</p></article><article><b>03</b><h3>One complete look</h3><p>Backdrop, balloons, florals, entrance and tables are styled as one story.</p></article></div></section>
<section id="book" className="enquire"><div><p className="kicker">04 / CHECK AVAILABILITY</p><h2>Let us create<br/><i>your moment.</i></h2><p>Complete the details and continue the conversation on WhatsApp.</p></div><form onSubmit={e=>{e.preventDefault();const d=new FormData(e.currentTarget);const text=`New Party Petals enquiry\nName: ${d.get('name')}\nPhone: ${d.get('phone')}\nOccasion: ${d.get('occasion')}\nDate: ${d.get('date')}\nVenue: ${d.get('venue')}\nBudget: ${d.get('budget')}\nIdea: ${d.get('idea')}\nSelected: ${cart.map(x=>x.n).join(', ')||'None'}`;window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`,'_blank')}}><label>NAME<input name="name" required/></label><label>MOBILE<input name="phone" required/></label><label>OCCASION<select name="occasion"><option>Birthday</option><option>Wedding</option><option>Baby welcome</option><option>Proposal</option><option>Other</option></select></label><label>DATE<input name="date" type="date" required/></label><label>VENUE<input name="venue"/></label><label>BUDGET<input name="budget"/></label><label className="wide">YOUR IDEA<textarea name="idea"/></label><button className="gold wide">SEND ENQUIRY <ArrowRight/></button></form></section>
<footer><div className="logo"><Flower2/><span>PARTY PETALS<small>EVENT EXPERIENCES</small></span></div><p>Ideas in bloom. Memories in the making.</p><div><a href={`https://wa.me/${PHONE}`} target="_blank" rel="noopener noreferrer">WHATSAPP</a><a href={INSTAGRAM} target="_blank" rel="noopener noreferrer">INSTAGRAM</a><a href="#home">BACK TO TOP</a></div><small>© 2026 PARTY PETALS</small></footer>
<button className="botBtn" onClick={()=>setBot(!bot)}>{bot?<X/>:<MessageCircle/>}<span>PLAN WITH PETAL</span></button><AnimatePresence>{bot&&<motion.aside className="bot" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}}><div className="botHead"><span><Flower2/></span><div><b>PETAL CONCIERGE</b><small>Guided event planner</small></div><button onClick={()=>setBot(false)}><X/></button></div><div className="botBody"><div className="messages" ref={messagesRef}>{messages.map((m,i)=><motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className={`message ${m.from==='bot'?'assistant':'user'}`} key={i}><p>{m.text}</p>{m.gallery&&<div className="chatGallery">{designs[m.gallery].map((d,j)=><button key={j} onClick={()=>openGallery(d,m.gallery)}><div><img src={`/designs/${d[2]}`} onLoad={()=>scrollChat('smooth')} onError={photoFail}/><Image/></div><span><b>{d[0]}</b><small>{d[1]}</small></span><Maximize2/></button>)}</div>}{m.opts&&<div className="suggestions">{m.opts.map((o,j)=><button key={j} onClick={()=>choose(o[0],o[1])}>{o[0]}<ArrowRight/></button>)}</div>}</motion.div>)}{typing&&<div className="typing"><i/><i/><i/></div>}<div ref={messagesEndRef} className="messagesEnd" aria-hidden="true"/></div><form className="chatInput" onSubmit={send}><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Type your question..."/><button><Send/></button></form><small className="chatHint">Try: “show birthday photos”</small></div></motion.aside>}</AnimatePresence>
<AnimatePresence>{selected&&<><motion.div className="overlay" onClick={()=>setSelected(null)} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}/><motion.div className="viewer" initial={{opacity:0,scale:.94,x:'-50%',y:'-47%'}} animate={{opacity:1,scale:1,x:'-50%',y:'-50%'}} exit={{opacity:0,scale:.94,x:'-50%',y:'-47%'}}><button type="button" className="viewerClose" onClick={()=>setSelected(null)}><X/></button><div className="viewerImage"><img src={selected.img} alt={`${selected.name} event decoration`}/><button type="button" className="prev" onClick={()=>{const list=designs[gallery],i=list.findIndex(x=>x[0]===selected.name),d=list[(i-1+list.length)%list.length];openGallery(d,gallery)}}><ChevronLeft/></button><button type="button" className="next" onClick={()=>{const list=designs[gallery],i=list.findIndex(x=>x[0]===selected.name),d=list[(i+1)%list.length];openGallery(d,gallery)}}><ChevronRight/></button></div><div className="viewerInfo"><div><small>{gallery.toUpperCase()} DESIGN</small><h3>{selected.name}</h3><p>{selected.style}</p><strong className="viewerPrice">₹{selected.p.toLocaleString('en-IN')}</strong></div><div className="viewerActions"><button type="button" className="gold" onClick={()=>{add(selected);setSelected(null)}}>ADD TO PLAN <Plus/></button><button type="button" className="outline" onClick={()=>window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(`Hello Party Petals, I like the ${selected.name} design priced from ₹${selected.p.toLocaleString('en-IN')}. Please share availability.`)}`,'_blank','noopener,noreferrer')}>ENQUIRE <ArrowRight/></button></div></div></motion.div></>}</AnimatePresence>
<CheckoutModal
  open={checkout}
  onClose={() => {
    if (!paying) {
      setCheckout(false);
    }
  }}
  customer={customer}
  setCustomer={setCustomer}
  cart={cart}
  total={total}
  paying={paying}
  onPay={pay}
  generatedConcept={generatedConcept}
/>
<AnimatePresence>{toast&&<motion.div className="toast" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0}}><Check/>{toast}</motion.div>}</AnimatePresence><AnimatePresence>{drawer&&<><motion.div className="shade" onClick={()=>setDrawer(false)} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}/><motion.aside className="drawer" initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}}><div className="drawerHead"><div><small>YOUR SELECTION</small><h3>Celebration plan</h3></div><button onClick={()=>setDrawer(false)}><X/></button></div>{!cart.length?<div className="empty"><ShoppingBag/><h3>Your plan is empty.</h3><button className="gold" onClick={()=>{setDrawer(false);go('packages')}}>VIEW COLLECTIONS</button></div>:<><div className="items">{cart.map(x=><div className="item" key={x.id}><div><b>{x.n}</b><small>₹{x.p.toLocaleString('en-IN')}</small></div><div><button onClick={()=>qty(x.id,-1)}><Minus/></button><span>{x.q}</span><button onClick={()=>qty(x.id,1)}><Plus/></button></div></div>)}</div><div className="total"><p><span>ESTIMATED TOTAL</span><b>₹{total.toLocaleString('en-IN')}</b></p><button type="button" className="gold" onClick={openCheckout}>ADD EVENT DETAILS <ArrowRight/></button><small>Choose UPI or Pay at Venue after completing the event details.</small></div></>}</motion.aside></>}</AnimatePresence></>}
createRoot(document.getElementById('root')).render(<App/>);
