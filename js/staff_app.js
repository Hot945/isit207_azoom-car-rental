(function () {
    const ADMIN_SESSION_KEY = 'azoom_staff_admin_session';
    const STORAGE_BOOKINGS = 'azoom_account_bookings_v1';
    const STORAGE_USERS = 'azoom_users';
    const STORAGE_CURRENT_USER = 'azoom_current_user';
    const STORAGE_FEEDBACKS = 'azoom_customer_feedbacks_v1';

    const DEFAULT_FEEDBACKS = [];

    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getInitials(name) {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }

    function getCustomerDisplay(b) {
        const email = b.userEmail || 'customer@azoom.sg';
        let name = b.userName || '';
        if (!name) {
            try {
                const users = JSON.parse(localStorage.getItem(STORAGE_USERS) || '[]');
                const found = users.find(u =>
                    (u.email && u.email.toLowerCase() === email.toLowerCase()) ||
                    (b.userId && u.id === b.userId)
                );
                if (found && found.name) name = found.name;
            } catch (e) {}
        }
        if (!name) {
            try {
                const cur = JSON.parse(localStorage.getItem(STORAGE_CURRENT_USER) || 'null');
                if (cur && cur.email && cur.email.toLowerCase() === email.toLowerCase() && cur.name) {
                    name = cur.name;
                }
            } catch (e) {}
        }
        return name ? `<strong>${email}</strong> (${name})` : `<strong>${email}</strong>`;
    }

    const DEFAULT_ADMIN = {
        username: 'admin',
        password: 'admin123'
    };

    const loginScreen = document.getElementById('md-login-screen');
    const workspaceScreen = document.getElementById('md-workspace-screen');
    const loginForm = document.getElementById('md-login-form');
    const userInput = document.getElementById('md-admin-user');
    const passInput = document.getElementById('md-admin-pass');
    const fieldUser = document.getElementById('md-field-user');
    const fieldPass = document.getElementById('md-field-pass');
    const errorBanner = document.getElementById('md-login-error');
    const pwdToggle = document.getElementById('md-pwd-toggle');
    const pwdEyeIcon = document.getElementById('md-pwd-eye-icon');
    const logoutBtn = document.getElementById('md-logout-btn');

    const drawerToggle = document.getElementById('md-drawer-toggle');
    const drawerBackdrop = document.getElementById('md-drawer-backdrop');
    const navDrawer = document.getElementById('md-nav-drawer');
    const drawerItems = document.querySelectorAll('[data-nav-module]');
    const drawerResCount = document.getElementById('drawer-res-count');
    const drawerFbCount = document.getElementById('drawer-fb-count');

    const sidebarGroupReservation = document.getElementById('md-sidebar-group-reservation');
    const sidebarGroupFeedback = document.getElementById('md-sidebar-group-feedback');

    const navButtons = document.querySelectorAll('[data-staff-tab]');
    const countInProgress = document.getElementById('count-in-progress');
    const countPending = document.getElementById('count-pending');
    const countCompleted = document.getElementById('count-completed');

    const feedbackNavButtons = document.querySelectorAll('[data-feedback-tab]');
    const countFbUnread = document.getElementById('count-fb-unread');
    const countFbRead = document.getElementById('count-fb-read');

    const sectionTitle = document.getElementById('md-section-title');
    const sectionDesc = document.getElementById('md-section-desc');
    const bookingsContainer = document.getElementById('md-bookings-container');
    const feedbacksContainer = document.getElementById('md-feedbacks-container');
    const snackbar = document.getElementById('md-snackbar');

    let currentModule = 'reservation';
    let currentTab = 'in_progress';
    let currentFeedbackTab = 'unread';
    let snackbarTimer = null;

    const TAB_META = {
        in_progress: {
            title: 'In Progress',
            desc: 'Self-service reservations (Reserved) and vehicles currently out on rental (Picked Up).'
        },
        pending: {
            title: 'Pending',
            desc: 'Returned vehicles awaiting staff inspection, and inspected vehicles with unpaid damage penalties.'
        },
        completed: {
            title: 'Completed',
            desc: 'Inspected rentals with all rental fees and any damage penalties fully settled.'
        }
    };

    function showSnackbar(msg) {
        if (!snackbar) return;
        snackbar.textContent = msg;
        snackbar.classList.add('show');
        if (snackbarTimer) clearTimeout(snackbarTimer);
        snackbarTimer = setTimeout(() => {
            snackbar.classList.remove('show');
        }, 3000);
    }

    function openDrawer() {
        if (navDrawer) {
            navDrawer.classList.add('is-open');
            navDrawer.setAttribute('aria-hidden', 'false');
        }
        if (drawerBackdrop) {
            drawerBackdrop.classList.add('is-open');
            drawerBackdrop.setAttribute('aria-hidden', 'false');
        }
    }

    function closeDrawer() {
        if (navDrawer) {
            navDrawer.classList.remove('is-open');
            navDrawer.setAttribute('aria-hidden', 'true');
        }
        if (drawerBackdrop) {
            drawerBackdrop.classList.remove('is-open');
            drawerBackdrop.setAttribute('aria-hidden', 'true');
        }
    }

    function getAllBookings() {
        try {
            const raw = localStorage.getItem(STORAGE_BOOKINGS);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function saveAllBookings(list) {
        try {
            localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(list));
        } catch (e) {
            console.warn('Failed to save bookings', e);
        }
    }

    function categorizeBookings(all) {
        const inProgress = [];
        const pending = [];
        const completed = [];

        all.forEach(b => {
            if (b.status === 'completed') {
                completed.push(b);
            } else if (b.status === 'returned' || b.status === 'penalty_pending') {
                pending.push(b);
            } else {
                inProgress.push(b);
            }
        });

        return { inProgress, pending, completed };
    }

    function getAllFeedbacks() {
        try {
            const raw = localStorage.getItem(STORAGE_FEEDBACKS);
            if (raw === null) {
                return [];
            }
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                const cleaned = parsed.filter(item => item && item.id && !String(item.id).startsWith('fb_seed_'));
                if (cleaned.length !== parsed.length) {
                    saveAllFeedbacks(cleaned);
                }
                return cleaned;
            }
            return [];
        } catch (e) {
            return [];
        }
    }

    function saveAllFeedbacks(list) {
        try {
            localStorage.setItem(STORAGE_FEEDBACKS, JSON.stringify(list));
        } catch (e) {
            console.warn('Failed to save feedbacks', e);
        }
    }

    function categorizeFeedbacks(all) {
        const unread = [];
        const read = [];

        all.forEach(f => {
            if (f.status === 'read') {
                read.push(f);
            } else {
                unread.push(f);
            }
        });

        return { unread, read };
    }

    function getStatusChipHTML(b) {
        if (b.status === 'upcoming' || !b.status) {
            return '<span class="md-chip chip-reserved">Reserved</span>';
        }
        if (b.status === 'rented') {
            return '<span class="md-chip chip-inuse">Picked Up</span>';
        }
        if (b.status === 'returned') {
            return '<span class="md-chip chip-inspect">Pending Inspection</span>';
        }
        if (b.status === 'penalty_pending') {
            return '<span class="md-chip chip-penalty">Payment Due</span>';
        }
        return '<span class="md-chip chip-completed">Completed</span>';
    }

    function buildStaffCardFooter(b) {
        const customerInfoHTML = `<div class="md-booking-meta"><span class="md-ref-label">Customer:</span><span class="md-customer-info">${getCustomerDisplay(b)}</span></div>`;

        if (b.status === 'returned') {
            return `
                <div class="md-booking-footer">
                    ${customerInfoHTML}
                    <div class="md-inspect-form" data-inspect-box="${b.id}">
                        <div class="md-inspect-controls">
                            <select class="md-select" data-inspect-type="${b.id}">
                                <option value="clear">No Damages Found (Clear &rarr; Complete)</option>
                                <option value="damage">Damages Found (Issue Penalty Bill)</option>
                            </select>
                            <select class="md-select" data-inspect-note="${b.id}" style="display: none;">
                                <option value="Exterior Bumper Scratch" data-default-fee="80">Exterior Bumper Scratch</option>
                                <option value="Body Dent / Deep Scratch" data-default-fee="150">Body Dent / Deep Scratch</option>
                                <option value="Wheel Rim Scuff / Curb Rash" data-default-fee="100">Wheel Rim Scuff / Curb Rash</option>
                                <option value="Windshield Chip / Crack" data-default-fee="200">Windshield Chip / Crack</option>
                                <option value="Interior Stain / Upholstery" data-default-fee="120">Interior Stain / Upholstery</option>
                                <option value="Charging Cable / Port Damage" data-default-fee="180">Charging Cable / Port Damage</option>
                                <option value="Other Vehicle Damage" data-default-fee="100">Other Vehicle Damage</option>
                            </select>
                            <input type="text" class="md-text-input" data-inspect-custom="${b.id}" placeholder="Specify damage details..." style="display: none;">
                            <input type="number" class="md-number-input" data-inspect-fee="${b.id}" placeholder="Penalty S$" min="1" step="1" value="80" style="display: none;">
                        </div>
                        <button type="button" class="md-btn-action" data-staff-action="submit-inspection" data-id="${b.id}">Complete Inspection</button>
                    </div>
                </div>
            `;
        }

        if (b.status === 'penalty_pending') {
            return `
                <div class="md-booking-footer">
                    ${customerInfoHTML}
                    <span class="md-footer-note">
                        Inspection: <strong>${b.inspectionLabel || 'Vehicle Damage'}</strong> &middot; Penalty Due: <strong>S$${b.damageFee || 0}</strong>
                    </span>
                </div>
            `;
        }

        if (b.status === 'completed') {
            const dmg = b.damageFee || 0;
            const finalPaid = b.finalTotal || b.totalPrice;
            return `
                <div class="md-booking-footer">
                    ${customerInfoHTML}
                    <span class="md-footer-note">
                        Inspection: <strong>${b.inspectionLabel || 'No Damages Found'}</strong> &middot;
                        Penalty Paid: <strong>S$${dmg}</strong> &middot;
                        Total Settled: <strong>S$${finalPaid}</strong>
                    </span>
                </div>
            `;
        }

        return `
            <div class="md-booking-footer">
                ${customerInfoHTML}
            </div>
        `;
    }

    function buildStaffCardHTML(b) {
        const displayTotal = b.finalTotal || (b.totalPrice + (b.damageFee || 0));
        const subNote = b.damageFee
            ? `Base S$${b.totalPrice} + Penalty S$${b.damageFee}`
            : `S$${b.dailyPrice} / day · ${b.days} ${b.days === 1 ? 'Day' : 'Days'}`;

        return `
            <article class="md-booking-card" data-booking-id="${b.id}">
                <div class="md-booking-topbar">
                    <div class="md-booking-meta">
                        <span class="md-ref-label">Booking Ref:</span>
                        <span class="md-ref-code">${b.ref}</span>
                    </div>
                    ${getStatusChipHTML(b)}
                </div>

                <div class="md-booking-body">
                    <div class="md-car-col">
                        <div class="md-car-thumb">
                            <img src="${b.image || 'images/cars/BYD-Atto_3-2023-HD-c6d412e81c7fb2f19f29fc71c801a09828a964d3f.jpg'}" alt="${b.model}">
                        </div>
                        <div class="md-car-info">
                            <h4>${b.model}</h4>
                            <p>${b.type || 'EV'} &middot; ${b.seats || '5 seats'} &middot; ${b.battery || '60.0 kWh'}</p>
                        </div>
                    </div>

                    <div class="md-route-col">
                        <div class="md-route-item">
                            <span class="md-route-tag">Pickup Branch</span>
                            <strong class="md-route-loc">${b.pickupLocName}</strong>
                            <span class="md-route-date">${b.pickupDate} &middot; ${b.pickupTime}</span>
                        </div>
                        <div class="md-route-item">
                            <span class="md-route-tag">Return Car Park</span>
                            <strong class="md-route-loc">${b.returnLocName}</strong>
                            <span class="md-route-date">${b.returnDate} &middot; ${b.returnTime}</span>
                        </div>
                    </div>

                    <div class="md-price-col">
                        <span class="md-price-main">S$${displayTotal}</span>
                        <span class="md-price-sub">${subNote}</span>
                    </div>
                </div>

                ${buildStaffCardFooter(b)}
            </article>
        `;
    }

    function buildFeedbackCardHTML(f) {
        const displayName = f.fullName || `${f.firstName || ''} ${f.lastName || ''}`.trim() || 'Anonymous Customer';
        const initials = getInitials(displayName);
        const email = f.email || '';
        const phone = f.phone || '';
        const subject = f.subject || 'Customer Feedback / Support';
        const message = f.message || '';
        const time = f.createdAt || '';

        const contactLinks = [];
        if (email) {
            contactLinks.push(`<a href="mailto:${encodeURIComponent(email)}" class="md-fb-contact-link">${escapeHTML(email)}</a>`);
        }
        if (phone) {
            contactLinks.push(`<a href="tel:${encodeURIComponent(phone)}" class="md-fb-contact-link">${escapeHTML(phone)}</a>`);
        }
        const contactHTML = contactLinks.join('<span class="md-fb-dot">&middot;</span>');

        const isUnread = f.status !== 'read';
        const actionBtnHTML = isUnread
            ? `<button type="button" class="md-btn-mark-read" data-fb-action="mark-read" data-id="${escapeHTML(f.id)}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Mark as Read</span></button>`
            : `<button type="button" class="md-btn-delete-fb" data-fb-action="delete-fb" data-id="${escapeHTML(f.id)}"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg><span>Delete</span></button>`;

        return `
            <article class="md-fb-card" data-feedback-id="${escapeHTML(f.id)}">
                <div class="md-fb-card-top">
                    <span class="md-fb-type-pill">${escapeHTML(subject)}</span>
                    <div class="md-fb-time-row">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>${escapeHTML(time)}</span>
                    </div>
                </div>

                <div class="md-fb-user-row">
                    <div class="md-fb-user-avatar">${escapeHTML(initials)}</div>
                    <div class="md-fb-user-details">
                        <strong class="md-fb-user-name">${escapeHTML(displayName)}</strong>
                        <div class="md-fb-user-contact">
                            ${contactHTML}
                        </div>
                    </div>
                </div>

                <div class="md-fb-content-box">
                    <p class="md-fb-message">${escapeHTML(message)}</p>
                </div>

                <div class="md-fb-actions">
                    ${actionBtnHTML}
                </div>
            </article>
        `;
    }

    function renderStaffPortal() {
        const allBookings = getAllBookings();
        const { inProgress, pending, completed } = categorizeBookings(allBookings);

        if (countInProgress) countInProgress.textContent = inProgress.length;
        if (countPending) countPending.textContent = pending.length;
        if (countCompleted) countCompleted.textContent = completed.length;
        if (drawerResCount) drawerResCount.textContent = allBookings.length;

        const allFeedbacks = getAllFeedbacks();
        const { unread, read } = categorizeFeedbacks(allFeedbacks);

        if (countFbUnread) countFbUnread.textContent = unread.length;
        if (countFbRead) countFbRead.textContent = read.length;
        if (drawerFbCount) {
            drawerFbCount.textContent = unread.length;
            drawerFbCount.classList.toggle('count-highlight', unread.length > 0);
        }

        if (currentModule === 'reservation') {
            if (sidebarGroupReservation) sidebarGroupReservation.style.display = 'block';
            if (sidebarGroupFeedback) sidebarGroupFeedback.style.display = 'none';
            if (bookingsContainer) bookingsContainer.style.display = 'grid';
            if (feedbacksContainer) feedbacksContainer.style.display = 'none';

            let activeList = inProgress;
            if (currentTab === 'pending') activeList = pending;
            if (currentTab === 'completed') activeList = completed;

            if (bookingsContainer) {
                if (activeList.length === 0) {
                    bookingsContainer.innerHTML = '<div class="md-empty-card"><h3>No bookings</h3></div>';
                } else {
                    bookingsContainer.innerHTML = activeList.map(buildStaffCardHTML).join('');
                }
            }
        } else {
            if (sidebarGroupReservation) sidebarGroupReservation.style.display = 'none';
            if (sidebarGroupFeedback) sidebarGroupFeedback.style.display = 'block';
            if (bookingsContainer) bookingsContainer.style.display = 'none';
            if (feedbacksContainer) feedbacksContainer.style.display = 'flex';

            let activeFeedbacks = unread;
            if (currentFeedbackTab === 'read') activeFeedbacks = read;

            if (feedbacksContainer) {
                if (activeFeedbacks.length === 0) {
                    const emptyMsg = currentFeedbackTab === 'unread'
                        ? 'No unread feedback'
                        : 'No read feedback';
                    feedbacksContainer.innerHTML = `<div class="md-empty-card"><h3>${emptyMsg}</h3></div>`;
                } else {
                    feedbacksContainer.innerHTML = activeFeedbacks.map(buildFeedbackCardHTML).join('');
                }
            }
        }
    }

    function switchModule(mod) {
        currentModule = mod;
        drawerItems.forEach(item => {
            const isMatch = item.dataset.navModule === mod;
            item.classList.toggle('active', isMatch);
        });
        renderStaffPortal();
    }

    function switchStaffTab(tab) {
        currentTab = tab;
        navButtons.forEach(btn => {
            const isMatch = btn.dataset.staffTab === tab;
            btn.classList.toggle('active', isMatch);
            btn.setAttribute('aria-selected', String(isMatch));
        });
        renderStaffPortal();
    }

    function switchFeedbackTab(tab) {
        currentFeedbackTab = tab;
        feedbackNavButtons.forEach(btn => {
            const isMatch = btn.dataset.feedbackTab === tab;
            btn.classList.toggle('active', isMatch);
            btn.setAttribute('aria-selected', String(isMatch));
        });
        renderStaffPortal();
    }

    function toggleDrawer() {
        if (navDrawer && navDrawer.classList.contains('is-open')) {
            closeDrawer();
        } else {
            openDrawer();
        }
    }

    if (drawerToggle) {
        drawerToggle.addEventListener('click', toggleDrawer);
    }
    if (drawerBackdrop) {
        drawerBackdrop.addEventListener('click', closeDrawer);
    }

    drawerItems.forEach(item => {
        item.addEventListener('click', () => {
            const mod = item.dataset.navModule;
            switchModule(mod);
            closeDrawer();
        });
    });

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            switchStaffTab(btn.dataset.staffTab);
        });
    });

    feedbackNavButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            switchFeedbackTab(btn.dataset.feedbackTab);
        });
    });

    if (bookingsContainer) {
        bookingsContainer.addEventListener('change', (e) => {
            const selectEl = e.target.closest('[data-inspect-type]');
            if (selectEl) {
                const id = selectEl.dataset.inspectType;
                const isDamage = selectEl.value === 'damage';
                const noteSelect = bookingsContainer.querySelector(`[data-inspect-note="${id}"]`);
                const customInput = bookingsContainer.querySelector(`[data-inspect-custom="${id}"]`);
                const feeInput = bookingsContainer.querySelector(`[data-inspect-fee="${id}"]`);
                const submitBtn = bookingsContainer.querySelector(`[data-staff-action="submit-inspection"][data-id="${id}"]`);

                if (noteSelect) noteSelect.style.display = isDamage ? 'inline-block' : 'none';
                if (customInput) customInput.style.display = (isDamage && noteSelect && noteSelect.value === 'Other Vehicle Damage') ? 'inline-block' : 'none';
                if (feeInput) feeInput.style.display = isDamage ? 'inline-block' : 'none';
                if (submitBtn) {
                    submitBtn.textContent = isDamage ? 'Issue Penalty Bill' : 'Complete Inspection';
                }
                return;
            }

            const noteSelect = e.target.closest('[data-inspect-note]');
            if (noteSelect) {
                const id = noteSelect.dataset.inspectNote;
                const feeInput = bookingsContainer.querySelector(`[data-inspect-fee="${id}"]`);
                const customInput = bookingsContainer.querySelector(`[data-inspect-custom="${id}"]`);
                const selectedOpt = noteSelect.selectedOptions && noteSelect.selectedOptions[0];
                if (selectedOpt && selectedOpt.dataset.defaultFee && feeInput) {
                    feeInput.value = selectedOpt.dataset.defaultFee;
                }
                if (customInput) {
                    const isCustom = noteSelect.value === 'Other Vehicle Damage';
                    customInput.style.display = isCustom ? 'inline-block' : 'none';
                    if (isCustom) customInput.focus();
                }
            }
        });

        bookingsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-staff-action="submit-inspection"]');
            if (!btn) return;
            const id = btn.dataset.id;
            const all = getAllBookings();
            const target = all.find(item => item.id === id);
            if (!target) return;

            const typeSel = bookingsContainer.querySelector(`[data-inspect-type="${id}"]`);
            const noteSel = bookingsContainer.querySelector(`[data-inspect-note="${id}"]`);
            const customInp = bookingsContainer.querySelector(`[data-inspect-custom="${id}"]`);
            const feeInp = bookingsContainer.querySelector(`[data-inspect-fee="${id}"]`);
            const isDamage = typeSel && typeSel.value === 'damage';

            if (!isDamage) {
                target.damageFee = 0;
                target.inspectionLabel = 'No Damages Found (Checked by Staff)';
                target.finalTotal = target.totalPrice;
                target.status = 'completed';
                saveAllBookings(all);
                renderStaffPortal();
                showSnackbar(`Inspection passed with no damages! Booking ${target.ref} moved to Completed.`);
            } else {
                const feeVal = Math.max(1, parseInt(feeInp ? feeInp.value : '80', 10) || 80);
                let noteVal = noteSel ? noteSel.value : 'Exterior Bumper Scratch';
                if (noteVal === 'Other Vehicle Damage' && customInp && customInp.value.trim()) {
                    noteVal = customInp.value.trim();
                }
                target.damageFee = feeVal;
                target.inspectionLabel = noteVal;
                target.finalTotal = target.totalPrice + feeVal;
                target.status = 'penalty_pending';
                saveAllBookings(all);
                renderStaffPortal();
                showSnackbar(`Penalty of S${feeVal} (${noteVal}) issued for ${target.ref}. Awaiting customer payment.`);
            }
        });
    }

    if (feedbacksContainer) {
        feedbacksContainer.addEventListener('click', (e) => {
            const markBtn = e.target.closest('[data-fb-action="mark-read"]');
            if (markBtn) {
                const id = markBtn.dataset.id;
                const feedbacks = getAllFeedbacks();
                const target = feedbacks.find(item => item.id === id);
                if (target) {
                    target.status = 'read';
                    saveAllFeedbacks(feedbacks);
                    renderStaffPortal();
                    showSnackbar('Feedback marked as read.');
                }
                return;
            }

            const deleteBtn = e.target.closest('[data-fb-action="delete-fb"]');
            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                let feedbacks = getAllFeedbacks();
                const initialLen = feedbacks.length;
                feedbacks = feedbacks.filter(item => item.id !== id);
                if (feedbacks.length < initialLen) {
                    saveAllFeedbacks(feedbacks);
                    renderStaffPortal();
                    showSnackbar('Feedback deleted.');
                }
            }
        });
    }

    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_BOOKINGS || e.key === STORAGE_FEEDBACKS) {
            renderStaffPortal();
        }
    });

    function updateView() {
        const isLogged = sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
        if (isLogged) {
            loginScreen.style.display = 'none';
            workspaceScreen.style.display = 'flex';
            renderStaffPortal();
        } else {
            loginScreen.style.display = 'flex';
            workspaceScreen.style.display = 'none';
        }
    }

    function clearErrors() {
        fieldUser.classList.remove('has-error');
        fieldPass.classList.remove('has-error');
        errorBanner.classList.remove('is-visible');
    }

    userInput.addEventListener('input', clearErrors);
    passInput.addEventListener('input', clearErrors);

    pwdToggle.addEventListener('click', () => {
        const isPwd = passInput.type === 'password';
        passInput.type = isPwd ? 'text' : 'password';
        if (pwdEyeIcon) {
            pwdEyeIcon.src = isPwd ? 'images/eye.svg' : 'images/eye-closed.svg';
        }
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors();

        const u = userInput.value.trim();
        const p = passInput.value;

        if (u === DEFAULT_ADMIN.username && p === DEFAULT_ADMIN.password) {
            sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
            loginForm.reset();
            passInput.type = 'password';
            if (pwdEyeIcon) pwdEyeIcon.src = 'images/eye-closed.svg';
            updateView();
        } else {
            fieldUser.classList.add('has-error');
            fieldPass.classList.add('has-error');
            errorBanner.classList.add('is-visible');
        }
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        updateView();
    });

    updateView();
})();
