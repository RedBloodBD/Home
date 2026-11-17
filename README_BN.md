# Red Blood BD — Upload Guide (বাংলা)

এই ZIP-এ `index.html`, CSS, JavaScript Firebase integration এবং Firestore Security Rules রয়েছে। Vanilla JavaScript + Firebase CDN ব্যবহার করা হয়েছে; npm install/build প্রয়োজন নেই।

## Firebase সেটআপ
1. Firebase Console → Authentication → Sign-in method: Email/Password এবং Google Enable করুন।
2. Authentication → Settings → Authorized domains-এ `redbloodbd.github.io` যোগ করুন।
3. Firestore Database তৈরি করুন।
4. Firestore → Rules-এ `firestore.rules` ফাইলের সম্পূর্ণ contents paste করে Publish করুন।
5. Firebase Project settings → General → Your apps থেকে Web App config মিলিয়ে `assets/app.js`-এর config আপডেট করুন যদি প্রয়োজন হয়।

## GitHub Pages
1. ZIP Extract করুন।
2. ZIP-এর ভিতরের সব ফাইল/ফোল্ডার repository root-এ upload করুন। `index.html` root-এ থাকতে হবে।
3. Repository → Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save।
4. Website: https://redbloodbd.github.io/Home/

## Admin Account তৈরি
1. Website থেকে Email/Password দিয়ে account register করুন।
2. Firebase Console → Firestore → `users` collection → নিজের UID document খুলুন।
3. `role` field-এর value `donor` থেকে `admin` করুন (string)।
4. আবার logout/login করুন। Admin menu দেখা যাবে।
কখনোই client-side public form থেকে admin role দেবেন না।

## Google Login-এর সীমাবদ্ধতা
Google Login নতুন account-কে `member` হিসেবে তৈরি করে। Donor Directory-তে আসতে হলে Dashboard-এ donor profile details পূরণ করে phone visibility consent দিতে হবে। Google profile দিয়ে সরাসরি public donor record তৈরি হয় না।

## গুরুত্বপূর্ণ নিরাপত্তা
- Public Donor Directory-তে ফোন নম্বর কেবল explicit consent দিলে প্রকাশ হয়।
- Blood request ও contact তথ্য authenticated users-দের জন্য; আবেদন করার সময় contact প্রকাশের consent প্রয়োজন।
- `firestore.rules` publish না করে live করবেন না।
- Firebase API key browser app config-এর অংশ; এটি secret নয়। Service account key বা API secret কখনো upload করবেন না।
- Firebase free quota ও usage monitor করুন।
- Medical eligibility বা blood compatibility ওয়েবসাইট যাচাই করে না; হাসপাতাল/চিকিৎসকের নির্দেশ অনুসরণ করুন।

## এই সংস্করণে
Home, Email/Password registration/login, Google login, donor search/filter, blood request submission/list, user dashboard/profile edit, admin request status controls।
Cloudinary direct upload, push notifications, SMS OTP, CAPTCHA/anti-spam, district/upazila master-data autocomplete ও full admin user moderation এই সংস্করণে নেই; production launch-এর আগে যোগ করা উচিত।
