        // 🔑 REALTIME FIREBASE CONFIGURATION
        const firebaseConfig = {
            apiKey: "AIzaSyCaNCOEIQlA5u2KiBPDbSGlJItpoLLLfYg",
            authDomain: "asif-911bf.firebaseapp.com",
            databaseURL: "https://asif-911bf-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "asif-911bf",
            storageBucket: "asif-911bf.firebasestorage.app",
            messagingSenderId: "671825009883",
            appId: "1:671825009883:web:2fb39d37d9aefe3ab940fe",
            measurementId: "G-17SGVWYH32"
        };

        let db = null;
        let auth = null;
        let currentUser = null;
        let dbRef = null;
        let isFirebaseConfigured = false;

        if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
            try {
                firebase.initializeApp(firebaseConfig);
                db = firebase.database();
                auth = firebase.auth();
                isFirebaseConfigured = true;
            } catch(e) {
                console.error("Firebase init failed: ", e);
            }
        }

        // DOM Elements
        const dateInput = document.getElementById('appDate');
        const monthInput = document.getElementById('summaryMonth');
        const themeToggleBtn = document.getElementById('themeToggle');
        const themeToggleIcon = document.getElementById('themeToggleIcon');

        // Auth Elements
        const authContainer = document.getElementById('authContainer');
        const appContainer = document.getElementById('appContainer');
        const authForm = document.getElementById('authForm');
        const authTitle = document.getElementById('authTitle');
        const authSubmitBtn = document.getElementById('authSubmitBtn');
        const toggleAuthMode = document.getElementById('toggleAuthMode');
        const authError = document.getElementById('authError');
        const userEmailDisplay = document.getElementById('userEmailDisplay');
        const logoutBtn = document.getElementById('logoutBtn');

        // Forms
        const salesForm = document.getElementById('salesForm');
        const expenseForm = document.getElementById('expenseForm');
        const monthlyExpenseForm = document.getElementById('monthlyExpenseForm');
        const mokamForm = document.getElementById('mokamForm');
        const tulaKroyForm = document.getElementById('tulaKroyForm');
        const shimulTulaForm = document.getElementById('shimulTulaForm');

        let editStates = {
            sales: null, expenses: null, monthlyExpenses: null, mokam: null, tulaKroy: null, shimulTula: null
        };

        // Dark Mode
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            themeToggleIcon.textContent = '☀️';
        } else {
            document.documentElement.classList.remove('dark');
            themeToggleIcon.textContent = '🌙';
        }

        themeToggleBtn.addEventListener('click', () => {
            if (document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
                themeToggleIcon.textContent = '🌙';
            } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                themeToggleIcon.textContent = '☀️';
            }
        });

        const today = new Date();
        dateInput.value = today.toISOString().split('T')[0];
        monthInput.value = today.toISOString().slice(0, 7);

        let storeData = {};

        // 🔐 AUTHENTICATION LOGIC & STATE HANDLING
        let isSignUpMode = false;

        toggleAuthMode.addEventListener('click', () => {
            isSignUpMode = !isSignUpMode;
            authError.classList.add('hidden');
            authForm.reset();
            if (isSignUpMode) {
                authTitle.textContent = "নতুন অ্যাকাউন্ট তৈরি করুন";
                authSubmitBtn.textContent = "রেজিস্ট্রেশন";
                toggleAuthMode.textContent = "ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন";
            } else {
                authTitle.textContent = "লগইন করুন";
                authSubmitBtn.textContent = "লগইন";
                toggleAuthMode.textContent = "নতুন অ্যাকাউন্ট তৈরি করুন";
            }
        });

        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('authEmail').value.trim();
            const password = document.getElementById('authPassword').value;
            authError.classList.add('hidden');

            if (!isFirebaseConfigured) return;

            if (isSignUpMode) {
                auth.createUserWithEmailAndPassword(email, password)
                    .catch(err => {
                        authError.textContent = "ভুল ইমেইল/পাসওয়ার্ড অথবা অ্যাকাউন্ট ইতিমধ্যে বিদ্যমান।";
                        authError.classList.remove('hidden');
                    });
            } else {
                auth.signInWithEmailAndPassword(email, password)
                    .catch(err => {
                        authError.textContent = "ভুল ইমেইল অথবা পাসওয়ার্ড দেওয়া হয়েছে।";
                        authError.classList.remove('hidden');
                    });
            }
        });

        logoutBtn.addEventListener('click', () => {
            if (auth) auth.signOut();
        });

        if (isFirebaseConfigured) {
            auth.onAuthStateChanged((user) => {
                if (user) {
                    currentUser = user;
                    authContainer.classList.add('hidden');
                    appContainer.classList.remove('hidden');
                    userEmailDisplay.textContent = user.email;
                    userEmailDisplay.classList.remove('hidden');

                    const statusEl = document.getElementById('syncStatus');
                    statusEl.textContent = "☁️ ক্লাউড সিঙ্ক লাইভ";
                    statusEl.className = "text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400";

                    dbRef = db.ref('users/' + user.uid + '/beddingData');

                    dbRef.on('value', (snapshot) => {
                        const cloudData = snapshot.val();
                        if (cloudData && typeof cloudData === 'object') {
                            storeData = cloudData;
                            localStorage.setItem('asifBeddingData_' + user.uid, JSON.stringify(storeData));
                            updateUI();
                        } else {
                            storeData = JSON.parse(localStorage.getItem('asifBeddingData_' + user.uid)) || {};
                            updateUI();
                        }
                    });
                } else {
                    currentUser = null;
                    storeData = {};
                    if (dbRef) dbRef.off();
                    authContainer.classList.remove('hidden');
                    appContainer.classList.add('hidden');
                    userEmailDisplay.classList.add('hidden');
                    authForm.reset();
                }
            });
        } else {
            // Local Storage only bootstrap if Firebase is unavailable
            authContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');
            userEmailDisplay.classList.add('hidden');
            logoutBtn.classList.add('hidden');
            storeData = JSON.parse(localStorage.getItem('asifBeddingData_local')) || {};
            updateUI();
        }

        function getSelectedDateData() {
            const date = dateInput.value;
            if (!storeData[date]) storeData[date] = {};
            const keys = ['sales', 'expenses', 'monthlyExpenses', 'mokam', 'tulaKroy', 'shimulTula'];
            keys.forEach(key => {
                if (!storeData[date][key]) storeData[date][key] = [];
            });
            return storeData[date];
        }

        function saveData() {
            const trackingId = currentUser ? currentUser.uid : 'local';
            localStorage.setItem('asifBeddingData_' + trackingId, JSON.stringify(storeData));
            if (isFirebaseConfigured && dbRef && currentUser) {
                dbRef.set(storeData).catch(err => console.error("Firebase Sync Error:", err));
            }
            updateUI();
        }

        function escapeHtml(text) {
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function renderSection(items, bodyId, totalId) {
            const body = document.getElementById(bodyId);
            if (!body) return 0;
            body.innerHTML = '';
            let total = 0;
            let totalMunafa = 0;

            if (!items) items = [];
            let htmlContent = '';

            items.forEach((item, index) => {
                const amount = parseFloat(item.amount) || 0;
                total += amount;

                let munafaTd = '';
                if (bodyId === 'salesTableBody') {
                    const munafa = parseFloat(item.munafa) || 0;
                    totalMunafa += munafa;
                    munafaTd = `<td class="p-2.5 text-right font-semibold text-slate-900 dark:text-slate-100">৳${munafa.toLocaleString('bn-BD')}</td>`;
                }

                htmlContent += `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td class="p-2.5 truncate max-w-[150px] font-medium text-slate-700 dark:text-slate-300" title="${escapeHtml(item.desc)}">${escapeHtml(item.desc)}</td>
                        <td class="p-2.5 text-right font-semibold text-slate-900 dark:text-slate-100">৳${amount.toLocaleString('bn-BD')}</td>
                        ${munafaTd}
                        <td class="p-2.5 text-center flex justify-center gap-2">
                            <button onclick="editItem('${bodyId}', ${index})" class="text-blue-500 hover:text-blue-700 dark:text-blue-400 cursor-pointer text-xs" title="এডিট">✏️</button>
                            <button onclick="deleteItem('${bodyId}', ${index})" class="text-rose-500 hover:text-rose-700 dark:text-rose-400 cursor-pointer text-xs" title="ডিলিট">🗑️</button>
                        </td>
                    </tr>
                `;
            });
            body.innerHTML = htmlContent;
            document.getElementById(totalId).textContent = total.toLocaleString('bn-BD');
            return totalMunafa;
        }

        function updateReportsSummary() {
            const targetMonth = monthInput.value;
            if (!targetMonth) return;

            const parts = targetMonth.split('-');
            if (parts.length !== 2) return;
            const targetYear = parts[0];

            const monthsBn = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
            const monthIdx = parseInt(parts[1], 10) - 1;
            if (monthIdx < 0 || monthIdx > 11) return;

            const monthLabelName = monthsBn[monthIdx] + " " + parseInt(parts[0], 10).toLocaleString('bn-BD', {useGrouping:false});
            document.getElementById('monthlyLabel').textContent = monthLabelName + " (মাস)";

            const yearLabelName = parseInt(targetYear, 10).toLocaleString('bn-BD', {useGrouping:false});
            document.getElementById('yearlyLabel').textContent = yearLabelName + " (বছর)";

            let mSales = 0, mExpenses = 0, mMonthlyExp = 0, mMokam = 0, mTula = 0, mShimul = 0, mMunafa = 0;
            let ySales = 0, yExpenses = 0, yMonthlyExp = 0, yMokam = 0, yTula = 0, yShimul = 0, yMunafa = 0;

            Object.keys(storeData).forEach(dateKey => {
                if (dateKey.startsWith(targetMonth)) {
                    const dayData = storeData[dateKey] || {};
                    if (dayData.sales) dayData.sales.forEach(i => {
                        mSales += (parseFloat(i.amount) || 0);
                        mMunafa += (parseFloat(i.munafa) || 0);
                    });
                    if (dayData.expenses) dayData.expenses.forEach(i => mExpenses += (parseFloat(i.amount) || 0));
                    if (dayData.monthlyExpenses) dayData.monthlyExpenses.forEach(i => mMonthlyExp += (parseFloat(i.amount) || 0));
                    if (dayData.mokam) dayData.mokam.forEach(i => mMokam += (parseFloat(i.amount) || 0));
                    if (dayData.tulaKroy) dayData.tulaKroy.forEach(i => mTula += (parseFloat(i.amount) || 0));
                    if (dayData.shimulTula) dayData.shimulTula.forEach(i => mShimul += (parseFloat(i.amount) || 0));
                }

                if (dateKey.startsWith(targetYear)) {
                    const dayData = storeData[dateKey] || {};
                    if (dayData.sales) dayData.sales.forEach(i => {
                        ySales += (parseFloat(i.amount) || 0);
                        yMunafa += (parseFloat(i.munafa) || 0);
                    });
                    if (dayData.expenses) dayData.expenses.forEach(i => yExpenses += (parseFloat(i.amount) || 0));
                    if (dayData.monthlyExpenses) dayData.monthlyExpenses.forEach(i => yMonthlyExp += (parseFloat(i.amount) || 0));
                    if (dayData.mokam) dayData.mokam.forEach(i => yMokam += (parseFloat(i.amount) || 0));
                    if (dayData.tulaKroy) dayData.tulaKroy.forEach(i => yTula += (parseFloat(i.amount) || 0));
                    if (dayData.shimulTula) dayData.shimulTula.forEach(i => yShimul += (parseFloat(i.amount) || 0));
                }
            });

            document.getElementById('mTotalSales').textContent = mSales.toLocaleString('bn-BD');
            document.getElementById('mTotalMunafa').textContent = mMunafa.toLocaleString('bn-BD');
            document.getElementById('mTotalExpenses').textContent = mExpenses.toLocaleString('bn-BD');
            document.getElementById('mTotalMonthlyExpenses').textContent = mMonthlyExp.toLocaleString('bn-BD');
            document.getElementById('mTotalMokam').textContent = mMokam.toLocaleString('bn-BD');
            document.getElementById('mTotalTulaKroy').textContent = mTula.toLocaleString('bn-BD');
            document.getElementById('mTotalShimulTula').textContent = mShimul.toLocaleString('bn-BD');

            document.getElementById('yTotalSales').textContent = ySales.toLocaleString('bn-BD');
            document.getElementById('yTotalMunafa').textContent = yMunafa.toLocaleString('bn-BD');
            document.getElementById('yTotalExpenses').textContent = yExpenses.toLocaleString('bn-BD');
            document.getElementById('yTotalMonthlyExpenses').textContent = yMonthlyExp.toLocaleString('bn-BD');
            document.getElementById('yTotalMokam').textContent = yMokam.toLocaleString('bn-BD');
            document.getElementById('yTotalTulaKroy').textContent = yTula.toLocaleString('bn-BD');
            document.getElementById('yTotalShimulTula').textContent = yShimul.toLocaleString('bn-BD');
        }

        function updateUI() {
            const data = getSelectedDateData();
            const todayMunafa = renderSection(data.sales, 'salesTableBody', 'totalSales');
            document.getElementById('totalMunafa').textContent = todayMunafa.toLocaleString('bn-BD');
            renderSection(data.expenses, 'expenseTableBody', 'totalExpenses');
            renderSection(data.monthlyExpenses, 'monthlyExpenseTableBody', 'totalMonthlyExpenses');
            renderSection(data.mokam, 'mokamTableBody', 'totalMokam');
            renderSection(data.tulaKroy, 'tulaKroyTableBody', 'totalTulaKroy');
            renderSection(data.shimulTula, 'shimulTulaTableBody', 'totalShimulTula');
            updateReportsSummary();
        }

        window.exportData = function() {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storeData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            const fileName = "ferdous_bedding_backup_" + new Date().toISOString().split('T')[0] + ".json";
            downloadAnchorNode.setAttribute("download", fileName);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }

        window.importData = function(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (typeof importedData === 'object' && importedData !== null) {
                        if (confirm("আপনি কি নতুন ব্যাকআপ ফাইলটি রিস্টোর করতে চান?")) {
                            storeData = { ...storeData, ...importedData };
                            saveData();
                            alert("ডাটা সফলভাবে রিস্টোর ও সিঙ্ক করা হয়েছে!");
                        }
                    } else {
                        alert("ভুল ফাইল ফরম্যাট!");
                    }
                } catch (err) {
                    alert("ফাইলটি পড়তে সমস্যা হয়েছে।");
                }
                event.target.value = ''; // Reset input to allow re-selecting the same file
            };
            reader.readAsText(file);
        }

        const keyMap = {
            'salesTableBody': 'sales', 'expenseTableBody': 'expenses', 'monthlyExpenseTableBody': 'monthlyExpenses',
            'mokamTableBody': 'mokam', 'tulaKroyTableBody': 'tulaKroy', 'shimulTulaTableBody': 'shimulTula'
        };

        const formInputMap = {
            'sales': { desc: 'saleDesc', amount: 'saleAmount', munafa: 'saleMunafa', btn: 'salesSubmitBtn' },
            'expenses': { desc: 'expenseDesc', amount: 'expenseAmount', btn: 'expenseSubmitBtn' },
            'monthlyExpenses': { desc: 'monthlyExpenseDesc', amount: 'monthlyExpenseAmount', btn: 'monthlyExpenseSubmitBtn' },
            'mokam': { desc: 'mokamDesc', amount: 'mokamAmount', btn: 'mokamSubmitBtn' },
            'tulaKroy': { desc: 'tulaKroyDesc', amount: 'tulaKroyAmount', btn: 'tulaKroySubmitBtn' },
            'shimulTula': { desc: 'shimulTulaDesc', amount: 'shimulTulaAmount', btn: 'shimulTulaSubmitBtn' }
        };

        function setupFormListener(form, dataKey) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const mapping = formInputMap[dataKey];
                const desc = document.getElementById(mapping.desc).value.trim();
                const amount = parseFloat(document.getElementById(mapping.amount).value);

                let munafa = 0;
                if (mapping.munafa) {
                    munafa = parseFloat(document.getElementById(mapping.munafa).value);
                    if (isNaN(munafa) || munafa < 0) {
                        alert("দয়া করে সঠিক মুনাফা লিখুন।");
                        return;
                    }
                }

                if (!desc || isNaN(amount) || amount < 0) {
                    alert("দয়া করে সঠিক বিবরণ এবং অংক (টাকা) লিখুন।");
                    return;
                }

                const sectionData = getSelectedDateData()[dataKey];
                const itemData = { desc, amount };
                if (mapping.munafa) {
                    itemData.munafa = munafa;
                }

                if (editStates[dataKey] !== null) {
                    sectionData[editStates[dataKey]] = itemData;
                    editStates[dataKey] = null;
                    const btn = document.getElementById(mapping.btn);
                    btn.textContent = '+';
                    btn.className = "col-span-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-xl text-xs md:text-sm transition-colors cursor-pointer flex items-center justify-center";
                } else {
                    sectionData.push(itemData);
                }

                form.reset();
                saveData();
            });
        }

        setupFormListener(salesForm, 'sales');
        setupFormListener(expenseForm, 'expenses');
        setupFormListener(monthlyExpenseForm, 'monthlyExpenses');
        setupFormListener(mokamForm, 'mokam');
        setupFormListener(tulaKroyForm, 'tulaKroy');
        setupFormListener(shimulTulaForm, 'shimulTula');

        window.editItem = function(bodyId, index) {
            const dataKey = keyMap[bodyId];
            const mapping = formInputMap[dataKey];
            const sectionData = getSelectedDateData()[dataKey];
            if (!sectionData || !sectionData[index]) return;

            const item = sectionData[index];
            document.getElementById(mapping.desc).value = item.desc;
            document.getElementById(mapping.amount).value = item.amount;
            if (mapping.munafa) {
                document.getElementById(mapping.munafa).value = item.munafa || 0;
            }

            editStates[dataKey] = index;

            const btn = document.getElementById(mapping.btn);
            btn.textContent = '✓';
            btn.className = "col-span-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs md:text-sm transition-colors cursor-pointer flex items-center justify-center";
            document.getElementById(mapping.desc).focus();
        }

        window.deleteItem = function(bodyId, index) {
            if (!confirm("আপনি কি নিশ্চিতভাবে মুছে ফেলতে চান?")) return;
            const dataKey = keyMap[bodyId];
            if (dataKey) {
                const sectionData = getSelectedDateData()[dataKey];
                sectionData.splice(index, 1);

                if (editStates[dataKey] === index) {
                    editStates[dataKey] = null;
                    const mapping = formInputMap[dataKey];
                    const btn = document.getElementById(mapping.btn);
                    btn.textContent = '+';
                    btn.className = "col-span-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-xl text-xs md:text-sm transition-colors cursor-pointer flex items-center justify-center";
                    if (btn.form) btn.form.reset();
                } else if (editStates[dataKey] > index) {
                    editStates[dataKey]--;
                }
                saveData();
            }
        }

        dateInput.addEventListener('change', () => {
            Object.keys(editStates).forEach(key => editStates[key] = null);
            Object.values(formInputMap).forEach(mapping => {
                const btn = document.getElementById(mapping.btn);
                btn.textContent = '+';
                btn.className = "col-span-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-xl text-xs md:text-sm transition-colors cursor-pointer flex items-center justify-center";
                if (btn.form) btn.form.reset();
            });
            updateUI();
        });

        monthInput.addEventListener('change', () => {
            updateReportsSummary();
        });


if (typeof module !== 'undefined' && module.exports) {
    module.exports = { updateReportsSummary };
}

if (typeof window !== 'undefined') {
    window.updateReportsSummary = updateReportsSummary;
    window.getStoreData = function() { return storeData; };
    window.setStoreData = function(data) { storeData = data; };
}
