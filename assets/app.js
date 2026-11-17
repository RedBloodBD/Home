import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, where, limit, serverTimestamp, deleteDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyAS3YcOfksaFu1qi5DzIdaYxdeeMJK54pM",
  authDomain: "redbloodbd-81bf1.firebaseapp.com",
  projectId: "redbloodbd-81bf1",
  storageBucket: "redbloodbd-81bf1.firebasestorage.app",
  messagingSenderId: "319402248755",
  appId: "1:319402248755:web:da9ed4bc952e8a0ac63146",
  measurementId: "G-0MTZFNH1J4"
};
const app = initializeApp(firebaseConfig), auth = getAuth(app), db = getFirestore(app);
isSupported().then(ok => { if (ok) getAnalytics(app); }).catch(()=>{});
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const bloods = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];
const divisions = ["ঢাকা","চট্টগ্রাম","রাজশাহী","খুলনা","বরিশাল","সিলেট","রংপুর","ময়মনসিংহ"];
const optionHTML = (a, first) => `<option value="">${first}</option>` + a.map(x=>`<option value="${x}">${x}</option>`).join("");
$$(".blood-options").forEach(x=>x.innerHTML=optionHTML(bloods,"রক্তের গ্রুপ নির্বাচন"));
$$(".division-options").forEach(x=>x.innerHTML=optionHTML(divisions,"বিভাগ নির্বাচন"));
$("#filterBlood").innerHTML=optionHTML(bloods,"সব গ্রুপ");
$("#filterDivision").innerHTML=optionHTML(divisions,"সব বিভাগ");
$("#year").textContent = new Date().getFullYear();
let user=null, profile=null;
const toast = msg => { const t=$("#toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),3500); };
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const errorText = e => ({ "auth/email-already-in-use":"এই ইমেইলে অ্যাকাউন্ট আছে।","auth/invalid-credential":"ইমেইল বা পাসওয়ার্ড সঠিক নয়।","auth/weak-password":"পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।","auth/popup-closed-by-user":"Google Login বাতিল হয়েছে।","permission-denied":"Firestore Rules অনুমতি দেয়নি।" }[e.code] || e.message || "সমস্যা হয়েছে।");
function show(id){ $$(".view").forEach(v=>v.classList.toggle("active",v.id===id)); $$("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===id)); $("nav").classList.remove("open"); window.scrollTo({top:0,behavior:"smooth"}); if(id==="donors") loadDonors(); if(id==="requests") loadRequests(); if(id==="dashboard") loadDashboard(); if(id==="admin") loadAdmin(); }
document.addEventListener("click",e=>{const b=e.target.closest("[data-view]"); if(b) show(b.dataset.view);});
$("#hamb").onclick=()=>$("nav").classList.toggle("open");
$("#loginBtn").onclick=()=>show("login"); $("#registerBtn").onclick=()=>show("register");
$("#logoutBtn").onclick=()=>signOut(auth).then(()=>toast("লগআউট হয়েছে")).catch(e=>toast(errorText(e)));
onAuthStateChanged(auth, async u=>{
  user=u; profile=null;
  if(u){ try{const s=await getDoc(doc(db,"users",u.uid)); if(s.exists()) profile=s.data();}catch(e){console.error(e);} }
  if(u && profile?.accountStatus==="suspended"){toast("আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত। Admin-এর সাথে যোগাযোগ করুন।");await signOut(auth);return;}
  $("#userLabel").textContent=u?(profile?.name||u.email):"";
  $("#loginBtn").hidden=!!u; $("#registerBtn").hidden=!!u; $("#logoutBtn").hidden=!u;
  $("#adminNav").hidden=profile?.role!=="admin";
});
const formData = f=>Object.fromEntries(new FormData(f).entries());
async function saveGoogleUser(cred){
  const ref=doc(db,"users",cred.user.uid), snap=await getDoc(ref);
  if(!snap.exists()){
    await setDoc(ref,{name:cred.user.displayName||"নতুন ব্যবহারকারী",email:cred.user.email||"",phone:"",bloodGroup:"",division:"",district:"",upazila:"",address:"",photoURL:cred.user.photoURL||"",lastDonation:"",available:false,publicContact:false,role:"member",createdAt:serverTimestamp(),needsDonorProfile:true});
  }
}
async function googleLogin(){
  try{const cred=await signInWithPopup(auth,new GoogleAuthProvider()); await saveGoogleUser(cred); toast("Google Login সফল। Donor হতে Dashboard থেকে প্রোফাইল সম্পূর্ণ করুন।"); show("dashboard");}
  catch(e){toast(errorText(e));}
}
$("#googleLogin").onclick=googleLogin; $("#googleRegister").onclick=googleLogin;
$("#registerForm").addEventListener("submit",async e=>{
  e.preventDefault(); const f=e.currentTarget,d=formData(f);
  if(!f.publicContact.checked){toast("Donor Directory-তে ফোন নম্বর দেখানোর সম্মতি প্রয়োজন।");return;}
  try{
    const cred=await createUserWithEmailAndPassword(auth,d.email,d.password);
    const p={name:d.name,email:d.email,phone:d.phone,bloodGroup:d.bloodGroup,division:d.division,district:d.district,upazila:d.upazila,address:d.address||"",photoURL:d.photoURL||"",lastDonation:d.lastDonation||"",available:f.available.checked,publicContact:true,role:"donor",createdAt:serverTimestamp()};
    await setDoc(doc(db,"users",cred.user.uid),p);
    await setDoc(doc(db,"donorDirectory",cred.user.uid),{uid:cred.user.uid,name:p.name,phone:p.phone,bloodGroup:p.bloodGroup,division:p.division,district:p.district,upazila:p.upazila,photoURL:p.photoURL,available:p.available,lastDonation:p.lastDonation,publicContact:true,updatedAt:serverTimestamp()});
    f.reset(); toast("নিবন্ধন সফল! Donor Profile সক্রিয় হয়েছে।"); show("dashboard");
  }catch(err){toast(errorText(err));}
});
$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();const d=formData(e.currentTarget);try{await signInWithEmailAndPassword(auth,d.email,d.password);toast("লগইন সফল");show("dashboard");}catch(err){toast(errorText(err));}});
$("#requestForm").addEventListener("submit",async e=>{
  e.preventDefault(); if(!user){toast("আবেদন করতে আগে Login করুন");show("login");return;}
  const d=formData(e.currentTarget);
  try{await addDoc(collection(db,"bloodRequests"),{patientName:d.patientName,contact:d.contact,bloodGroup:d.bloodGroup,bags:Number(d.bags),division:d.division,district:d.district,upazila:d.upazila,hospital:d.hospital,requiredDate:d.requiredDate,details:d.details||"",status:"active",publicContact:true,createdBy:user.uid,createdAt:serverTimestamp()});e.currentTarget.reset();toast("রক্তের আবেদন জমা হয়েছে");show("requests");}
  catch(err){toast(errorText(err));}
});
async function loadDonors(){
 const out=$("#donorResults");out.innerHTML='<div class="empty">লোড হচ্ছে…</div>';
 try{
  const snap=await getDocs(query(collection(db,"donorDirectory"),where("publicContact","==",true),limit(300)));
  let a=snap.docs.map(d=>d.data()).filter(d=>d.available===true);
  const bg=$("#filterBlood").value, div=$("#filterDivision").value, dist=$("#filterDistrict").value.trim().toLowerCase(), up=$("#filterUpazila").value.trim().toLowerCase();
  a=a.filter(d=>(!bg||d.bloodGroup===bg)&&(!div||d.division===div)&&(!dist||(d.district||"").toLowerCase().includes(dist))&&(!up||(d.upazila||"").toLowerCase().includes(up)));
  out.innerHTML=a.length?a.map(d=>`<article class="donor-card"><div class="donor-top"><div class="avatar">${esc((d.name||"D").slice(0,1))}</div><div><h3>${esc(d.name)}</h3><span class="muted">${esc(d.upazila)}, ${esc(d.district)}</span></div><span class="blood">${esc(d.bloodGroup)}</span></div><p class="muted">${esc(d.division)} বিভাগ</p><a class="btn" href="tel:${esc(d.phone)}">কল করুন · ${esc(d.phone)}</a></article>`).join(""):'<div class="empty">এই ফিল্টারে কোনো উপলব্ধ Donor পাওয়া যায়নি।</div>';
 }catch(e){out.innerHTML='<div class="empty">Donor list পাওয়া যায়নি। Firestore Rules পরীক্ষা করুন।</div>';console.error(e);}
}
$("#searchDonors").onclick=loadDonors;
async function loadRequests(){
 const out=$("#requestResults");out.innerHTML='<div class="empty">লোড হচ্ছে…</div>';
 if(!user){out.innerHTML='<div class="empty">আবেদন দেখতে Login করুন।</div>';return;}
 try{const snap=await getDocs(query(collection(db,"bloodRequests"),where("status","==","active"),limit(100)));const a=snap.docs.map(d=>d.data()).sort((x,y)=>(y.createdAt?.seconds||0)-(x.createdAt?.seconds||0));
 out.innerHTML=a.length?a.map(d=>`<article class="request-card"><div><span class="pill">রক্ত প্রয়োজন</span><h3>${esc(d.patientName)} · ${esc(d.hospital)}</h3><p class="muted">${esc(d.upazila)}, ${esc(d.district)}, ${esc(d.division)} · ${esc(d.requiredDate)}</p><p class="muted">যোগাযোগ: ${esc(d.contact)} · ${esc(d.bags)} ব্যাগ</p></div><span class="blood">${esc(d.bloodGroup)}</span></article>`).join(""):'<div class="empty">কোনো সক্রিয় আবেদন নেই।</div>';
 }catch(e){out.innerHTML='<div class="empty">Request লোড হয়নি। Firestore Rules পরীক্ষা করুন।</div>';console.error(e);}
}
async function loadDashboard(){
 const box=$("#dashboardContent"); if(!user){box.innerHTML='<div class="empty">ড্যাশবোর্ড দেখতে Login করুন।</div>';return;}
 try{
  const s=await getDoc(doc(db,"users",user.uid));if(!s.exists()){box.innerHTML='<div class="empty">Profile পাওয়া যায়নি।</div>';return;}const p=s.data();
  box.innerHTML=`<div class="donor-top"><div class="avatar">${esc((p.name||"U").slice(0,1))}</div><div><h2>${esc(p.name||"ব্যবহারকারী")}</h2><span class="muted">${esc(p.email)}</span></div><span class="blood">${esc(p.bloodGroup||"প্রোফাইল অসম্পূর্ণ")}</span></div><div class="profile-grid"><p><b>ফোন:</b> ${esc(p.phone||"যোগ করা হয়নি")}</p><p><b>এলাকা:</b> ${esc(p.upazila||"—")}, ${esc(p.district||"—")}</p><p><b>বিভাগ:</b> ${esc(p.division||"—")}</p><p><b>Donor Status:</b> ${p.available?"Available":"Unavailable"}</p><p><b>Account:</b> ${esc(p.role||"member")}</p></div><form id="profileForm" class="form-grid"><label>নাম<input name="name" value="${esc(p.name||"")}" required></label><label>মোবাইল<input name="phone" value="${esc(p.phone||"")}" required></label><label>রক্তের গ্রুপ<select name="bloodGroup" class="blood-options" required>${optionHTML(bloods,"রক্তের গ্রুপ নির্বাচন")}</select></label><label>বিভাগ<select name="division" class="division-options" required>${optionHTML(divisions,"বিভাগ নির্বাচন")}</select></label><label>জেলা<input name="district" value="${esc(p.district||"")}" required></label><label>উপজেলা<input name="upazila" value="${esc(p.upazila||"")}" required></label><label>শেষ রক্তদানের তারিখ<input type="date" name="lastDonation" value="${esc(p.lastDonation||"")}"></label><label class="check"><input type="checkbox" name="available" ${p.available?"checked":""}> আমি রক্তদানে উপলব্ধ</label><label class="check full"><input type="checkbox" name="publicContact" ${p.publicContact?"checked":""}> Donor Search-এ আমার ফোন নম্বর প্রকাশে সম্মতি</label><button class="btn full">প্রোফাইল সংরক্ষণ</button></form>`;
  const f=$("#profileForm");f.elements.bloodGroup.value=p.bloodGroup||"";f.elements.division.value=p.division||"";
  f.onsubmit=async ev=>{ev.preventDefault();const d=formData(f), publicContact=f.publicContact.checked, available=f.available.checked;try{
    const update={name:d.name,phone:d.phone,bloodGroup:d.bloodGroup,division:d.division,district:d.district,upazila:d.upazila,lastDonation:d.lastDonation||"",available,publicContact,role:p.role||"member"};
    await updateDoc(doc(db,"users",user.uid),update);
    if(publicContact && update.bloodGroup){await setDoc(doc(db,"donorDirectory",user.uid),{uid:user.uid,name:update.name,phone:update.phone,bloodGroup:update.bloodGroup,division:update.division,district:update.district,upazila:update.upazila,photoURL:p.photoURL||"",available,lastDonation:update.lastDonation,publicContact:true,updatedAt:serverTimestamp()});}
    else {try{await updateDoc(doc(db,"donorDirectory",user.uid),{publicContact:false,available:false,updatedAt:serverTimestamp()});}catch{}}
    toast("Profile আপডেট হয়েছে");loadDashboard();
  }catch(err){toast(errorText(err));}};
 }catch(e){box.innerHTML='<div class="empty">Account information load করা যায়নি। Rules পরীক্ষা করুন।</div>';console.error(e);}
}
let adminUsersCache=[], adminRequestsCache=[];
async function loadAdmin(){
 const box=$("#adminContent");
 if(!user||profile?.role!=="admin"){box.innerHTML='<div class="empty">Admin permission প্রয়োজন।</div>';return;}
 box.innerHTML='<div class="empty">অ্যাডমিন ডেটা লোড হচ্ছে…</div>';
 try{
  const [us,rs,ds]=await Promise.all([
   getDocs(query(collection(db,"users"),limit(500))),
   getDocs(query(collection(db,"bloodRequests"),limit(500))),
   getDocs(query(collection(db,"donorDirectory"),limit(500)))
  ]);
  adminUsersCache=us.docs.map(x=>({id:x.id,...x.data()}));
  adminRequestsCache=rs.docs.map(x=>({id:x.id,...x.data()}));
  const donors=ds.docs.map(x=>({id:x.id,...x.data()}));
  const activeReq=adminRequestsCache.filter(x=>x.status==="active").length;
  const divisionsCount={}; donors.forEach(d=>{if(d.division)divisionsCount[d.division]=(divisionsCount[d.division]||0)+1;});
  box.innerHTML=`
   <div class="stats admin-stats">
    <div><b>${adminUsersCache.length}</b><span>মোট Users</span></div>
    <div><b>${donors.length}</b><span>নিবন্ধিত Donors</span></div>
    <div><b>${adminUsersCache.filter(x=>x.available).length}</b><span>Available Donors</span></div>
    <div><b>${activeReq}</b><span>Active Requests</span></div>
   </div>
   <div class="admin-tabs">
    <button class="btn" data-admin-tab="overview">Overview</button>
    <button class="btn outline" data-admin-tab="users">Donor & User Management</button>
    <button class="btn outline" data-admin-tab="requests">Blood Requests</button>
    <button class="btn outline" data-admin-tab="locations">Location Reports</button>
   </div>
   <div id="adminTabContent"></div>`;
  $$("[data-admin-tab]").forEach(btn=>btn.onclick=()=>{ $$("#adminContent [data-admin-tab]").forEach(x=>x.classList.add("outline"));btn.classList.remove("outline");renderAdminTab(btn.dataset.adminTab,divisionsCount);});
  renderAdminTab("overview",divisionsCount);
 }catch(e){box.innerHTML='<div class="empty">Admin data পাওয়া যায়নি। Firestore Rules পরীক্ষা করুন।</div>';console.error(e);}
}
function renderAdminTab(tab,divisionCounts={}){
 const out=$("#adminTabContent"); if(!out)return;
 if(tab==="overview"){
  const groups={};adminUsersCache.forEach(u=>{if(u.bloodGroup)groups[u.bloodGroup]=(groups[u.bloodGroup]||0)+1;});
  out.innerHTML=`<h3>Dashboard Overview</h3><div class="profile-grid"><p><b>মোট অ্যাকাউন্ট:</b> ${adminUsersCache.length}</p><p><b>Donor:</b> ${adminUsersCache.filter(x=>x.role==="donor").length}</p><p><b>Admin:</b> ${adminUsersCache.filter(x=>x.role==="admin").length}</p><p><b>Moderator:</b> ${adminUsersCache.filter(x=>x.role==="moderator").length}</p><p><b>মোট আবেদন:</b> ${adminRequestsCache.length}</p><p><b>Fulfilled:</b> ${adminRequestsCache.filter(x=>x.status==="fulfilled").length}</p></div><h3>Blood Group Distribution</h3><div class="profile-grid">${Object.entries(groups).map(([k,v])=>`<p><b>${esc(k)}:</b> ${v}</p>`).join("")||"তথ্য নেই"}</div>`;
 }else if(tab==="users"){
  out.innerHTML=`<h3>Donor & User Management</h3><input id="adminUserSearch" placeholder="নাম, ইমেইল, ফোন, জেলা দিয়ে খুঁজুন"><div id="adminUsersList"></div>`;
  const draw=()=>{const q=$("#adminUserSearch").value.toLowerCase();const list=adminUsersCache.filter(u=>[u.name,u.email,u.phone,u.district,u.bloodGroup].some(v=>String(v||"").toLowerCase().includes(q)));$("#adminUsersList").innerHTML=list.map(u=>`<article class="request-card"><div><b>${esc(u.name||"নাম নেই")}</b><p class="muted">${esc(u.email||"")} · ${esc(u.phone||"")} · ${esc(u.bloodGroup||"")} · ${esc(u.district||"")}</p><small>UID: ${esc(u.id)} | Role: ${esc(u.role||"member")} | ${u.available?"Available":"Unavailable"}</small></div><div class="admin-actions"><select data-role="${esc(u.id)}"><option value="member" ${u.role==="member"?"selected":""}>Member</option><option value="donor" ${u.role==="donor"?"selected":""}>Donor</option><option value="moderator" ${u.role==="moderator"?"selected":""}>Moderator</option><option value="admin" ${u.role==="admin"?"selected":""}>Admin</option></select><button class="btn outline" data-toggle="${esc(u.id)}">${u.accountStatus==="suspended"?"সক্রিয় করুন":"Suspend"}</button><button class="btn danger" data-delete="${esc(u.id)}">Delete</button></div></article>`).join("")||'<div class="empty">কোনো User পাওয়া যায়নি।</div>';
   $$("[data-role]").forEach(s=>s.onchange=async()=>{if(s.dataset.role===user.uid){toast("নিজের role পরিবর্তন করা যাবে না");s.value="admin";return;}try{await updateDoc(doc(db,"users",s.dataset.role),{role:s.value});toast("Role আপডেট হয়েছে");loadAdmin();}catch(e){toast(errorText(e));}});
   $$("[data-toggle]").forEach(btn=>btn.onclick=async()=>{try{const u=adminUsersCache.find(x=>x.id===btn.dataset.toggle);await updateDoc(doc(db,"users",u.id),{accountStatus:u.accountStatus==="suspended"?"active":"suspended"});toast("Account status আপডেট হয়েছে");loadAdmin();}catch(e){toast(errorText(e));}});
   $$("[data-delete]").forEach(btn=>btn.onclick=async()=>{const id=btn.dataset.delete;if(id===user.uid){toast("নিজের account delete করা যাবে না");return;}if(!confirm("এই user-এর Firestore profile ও donor listing মুছে ফেলবেন? Firebase Authentication account আলাদাভাবে মুছতে হবে।"))return;try{await deleteDoc(doc(db,"users",id));await deleteDoc(doc(db,"donorDirectory",id));toast("Firestore profile মুছে ফেলা হয়েছে");loadAdmin();}catch(e){toast(errorText(e));}});
  };$("#adminUserSearch").oninput=draw;draw();
 }else if(tab==="requests"){
  out.innerHTML=`<h3>Blood Request Management</h3><input id="adminReqSearch" placeholder="রোগী, হাসপাতাল, জেলা দিয়ে খুঁজুন"><div id="adminRequestsList"></div>`;
  const draw=()=>{const q=$("#adminReqSearch").value.toLowerCase();const list=adminRequestsCache.filter(r=>[r.patientName,r.hospital,r.district,r.bloodGroup,r.contact].some(v=>String(v||"").toLowerCase().includes(q)));$("#adminRequestsList").innerHTML=list.map(r=>`<article class="request-card"><div><b>${esc(r.patientName)}</b><p class="muted">${esc(r.bloodGroup)} · ${esc(r.hospital)} · ${esc(r.district)} · ${esc(r.contact)}</p><small>${esc(r.requiredDate||"")} · আবেদনকারী: ${esc(r.createdBy||"")}</small></div><div class="admin-actions"><select data-req="${esc(r.id)}"><option value="active" ${r.status==="active"?"selected":""}>Active</option><option value="fulfilled" ${r.status==="fulfilled"?"selected":""}>Fulfilled</option><option value="cancelled" ${r.status==="cancelled"?"selected":""}>Cancelled</option></select><button class="btn danger" data-reqdelete="${esc(r.id)}">Delete</button></div></article>`).join("")||'<div class="empty">কোনো আবেদন পাওয়া যায়নি।</div>';
   $$("[data-req]").forEach(s=>s.onchange=async()=>{try{await updateDoc(doc(db,"bloodRequests",s.dataset.req),{status:s.value});toast("Request status আপডেট হয়েছে");loadAdmin();}catch(e){toast(errorText(e));}});
   $$("[data-reqdelete]").forEach(btn=>btn.onclick=async()=>{if(!confirm("এই আবেদনটি স্থায়ীভাবে মুছবেন?"))return;try{await deleteDoc(doc(db,"bloodRequests",btn.dataset.reqdelete));toast("আবেদন মুছে ফেলা হয়েছে");loadAdmin();}catch(e){toast(errorText(e));}});
  };$("#adminReqSearch").oninput=draw;draw();
 }else if(tab==="locations"){
  const pairs=Object.entries(divisionCounts).sort((a,b)=>b[1]-a[1]);
  out.innerHTML=`<h3>Division-wise Donor Report</h3>${pairs.map(([k,v])=>`<div class="request-card"><b>${esc(k)}</b><span class="pill">${v} Donors</span></div>`).join("")||'<div class="empty">লোকেশন ডেটা নেই।</div>'}<p class="muted">এই রিপোর্ট Donor Directory-তে থাকা প্রকাশ-সম্মতিপ্রাপ্ত প্রোফাইলের ভিত্তিতে।</p>`;
 }
}

async function stats(){try{const [d,r]=await Promise.all([getDocs(query(collection(db,"donorDirectory"),limit(500))),getDocs(query(collection(db,"bloodRequests"),where("status","==","active"),limit(500)))]);$("#statDonors").textContent=d.size+"+";$("#statRequests").textContent=r.size+"+";}catch{}}
stats();
window.addEventListener("hashchange",()=>{const id=location.hash.slice(1);if($("#"+id)?.classList.contains("view"))show(id);});
