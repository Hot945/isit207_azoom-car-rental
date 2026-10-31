const navbar = document.querySelector('.navbar');
function updateNavbarScroll() {
    const rawHash = window.location.hash.replace('#', '').trim() || 'home';
    const currentHash = document.getElementById(`page-${rawHash}`) ? rawHash : 'home';
    if (currentHash !== 'home') {
        navbar.classList.add('scrolled');
    } else {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
}

window.addEventListener('scroll', updateNavbarScroll);
const pageViews = document.querySelectorAll('.page-view');
const navBtns = document.querySelectorAll('.nav-btn');

let cardTransitionState = null;

function runCardFlightAnimation(targetCard, startRect, isForward) {
    if (!targetCard || !startRect) return;

    const endRect = targetCard.getBoundingClientRect();
    const deltaX = startRect.left - endRect.left;
    const deltaY = startRect.top - endRect.top;

    targetCard.style.transformOrigin = 'center center';
    targetCard.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
    targetCard.style.transition = 'none';
    targetCard.classList.add('search-card-flying');

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            targetCard.style.transition = 'transform 0.48s cubic-bezier(0.16, 1, 0.3, 1)';
            targetCard.style.transform = 'translate3d(0, 0, 0)';

            const onTransitionEnd = (e) => {
                if (e.propertyName !== 'transform') return;
                targetCard.removeEventListener('transitionend', onTransitionEnd);
                targetCard.style.transform = '';
                targetCard.style.transition = '';
                targetCard.classList.remove('search-card-flying');
            };
            targetCard.addEventListener('transitionend', onTransitionEnd);

            setTimeout(() => {
                targetCard.style.transform = '';
                targetCard.style.transition = '';
                targetCard.classList.remove('search-card-flying');
            }, 550);
        });
    });
}

function getEvsHeroHeight() {
    const evsHero = document.querySelector('.evs-hero');
    if (!evsHero) return 342;
    if (evsHero.offsetHeight > 0) {
        return evsHero.offsetHeight;
    }
    const evsPage = document.getElementById('page-evs');
    if (!evsPage) return 342;
    const prevDisplay = evsPage.style.display;
    const prevVis = evsPage.style.visibility;
    const prevPos = evsPage.style.position;
    evsPage.style.visibility = 'hidden';
    evsPage.style.position = 'absolute';
    evsPage.style.display = 'block';
    const h = evsHero.offsetHeight;
    evsPage.style.display = prevDisplay;
    evsPage.style.visibility = prevVis;
    evsPage.style.position = prevPos;
    return h || 342;
}

function syncLocationsHeroHeight() {
    const locHero = document.querySelector('.locations-hero');
    if (!locHero) return;
    const targetHeight = getEvsHeroHeight();
    if (targetHeight > 0) {
        locHero.style.minHeight = targetHeight + 'px';
        locHero.style.boxSizing = 'border-box';
    }
}
window.addEventListener('resize', syncLocationsHeroHeight);

function navigateTo(targetPage) {
    const targetSection = document.getElementById(`page-${targetPage}`);
    const validPage = targetSection ? targetPage : 'home';
    if (targetPage && !targetSection && window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    const searchHeaderEl = document.querySelector('#page-search .search-page-header');
    const reserveHeaderEl = document.getElementById('reserve-yellow-header');
    if (searchHeaderEl && reserveHeaderEl && searchHeaderEl.offsetHeight > 0) {
        reserveHeaderEl.style.height = searchHeaderEl.offsetHeight + 'px';
    }

    syncLocationsHeroHeight();

    const wasOnReserve = document.getElementById('page-reserve')?.classList.contains('active');

    pageViews.forEach(view => {
        view.classList.remove('active');
        view.classList.remove('page-search-transition-in');
        view.classList.remove('page-search-from-reserve');
        view.classList.remove('page-home-transition-in');
    });
    const activeSection = document.getElementById(`page-${validPage}`);
    if (activeSection) {
        activeSection.classList.add('active');
        if (wasOnReserve && validPage === 'search') {
            activeSection.classList.add('page-search-from-reserve');
        }
    }
    navBtns.forEach(btn => {
        if (btn.dataset.target === validPage) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    window.scrollTo({ top: 0, behavior: 'instant' });
    updateNavbarScroll();

    const openModal = document.querySelector('.ev-modal-overlay.active');
    if (openModal) {
        openModal.classList.remove('active');
        openModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    }

    if (cardTransitionState) {
        const { type, startRect } = cardTransitionState;
        cardTransitionState = null;

        if (type === 'home-to-search' && validPage === 'search') {
            const pageSearch = document.getElementById('page-search');
            if (pageSearch) pageSearch.classList.add('page-search-transition-in');

            const searchCard = document.querySelector('.search-widget-card');
            runCardFlightAnimation(searchCard, startRect, true);
        } else if (type === 'search-to-home' && validPage === 'home') {
            const pageHome = document.getElementById('page-home');
            if (pageHome) pageHome.classList.add('page-home-transition-in');

            const homeCard = document.querySelector('.reservation-card');
            runCardFlightAnimation(homeCard, startRect, false);
        }
    }
}
function handleHashChange() {
    const rawHash = window.location.hash.replace('#', '').trim();
    navigateTo(rawHash || 'home');
}
window.addEventListener('hashchange', handleHashChange);
window.addEventListener('DOMContentLoaded', handleHashChange);
document.addEventListener('click', (e) => {
    const targetBtn = e.target.closest('[data-target]');
    if (targetBtn) {
        const targetPage = targetBtn.dataset.target;
        if (window.location.hash === `#${targetPage}` || (!window.location.hash && targetPage === 'home')) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.location.hash = targetPage;
        }
    }
    if (e.target.closest('.logo') || e.target.closest('.footer-logo')) {
        window.location.hash = 'home';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

const contactForm = document.getElementById('about-contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const firstName = (document.getElementById('contact-first-name')?.value || '').trim();
        const lastName = (document.getElementById('contact-last-name')?.value || '').trim();
        const phone = (document.getElementById('contact-phone')?.value || '').trim();
        const email = (document.getElementById('contact-email')?.value || '').trim();
        const subjectEl = document.getElementById('contact-subject');
        const subjectVal = subjectEl ? subjectEl.value : '';
        const subjectText = subjectEl && subjectEl.selectedIndex >= 0 && subjectEl.options[subjectEl.selectedIndex] ? subjectEl.options[subjectEl.selectedIndex].text : subjectVal;
        const message = (document.getElementById('contact-message')?.value || '').trim();

        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

        const newFeedback = {
            id: 'fb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            firstName: firstName,
            lastName: lastName,
            fullName: `${firstName} ${lastName}`.trim() || 'Anonymous Customer',
            phone: phone,
            email: email,
            subjectCode: subjectVal,
            subject: subjectText || 'Customer Feedback / Support',
            message: message,
            createdAt: timeStr,
            timestamp: Date.now(),
            status: 'unread'
        };

        try {
            const raw = localStorage.getItem('azoom_customer_feedbacks_v1');
            let list = [];
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) list = parsed;
            }
            list.unshift(newFeedback);
            localStorage.setItem('azoom_customer_feedbacks_v1', JSON.stringify(list));
        } catch (err) {}

        contactForm.reset();
        if (typeof window.showTopToast === 'function') {
            window.showTopToast('Message sent!', 'success');
        }
    });
}

(function initEVFilter() {
    const evsFilterTrigger = document.getElementById('ev-filter-trigger');
    const searchFilterTrigger = document.getElementById('search-filter-trigger');
    const filterModal = document.getElementById('ev-filter-modal');
    const filterClose = document.getElementById('ev-filter-close');
    const filterReset = document.getElementById('ev-filter-reset');
    const filterApply = document.getElementById('ev-filter-apply');
    const priceSlider = document.getElementById('filter-price-slider');
    const priceTooltip = document.getElementById('filter-price-tooltip');

    const evsFilterCountText = document.querySelector('#page-evs .ev-filter-count');
    const searchAvailableCount = document.getElementById('search-available-count');
    const evsEmptyState = document.getElementById('ev-empty-state');
    const searchEmptyState = document.getElementById('search-filter-empty-state');
    const evsEmptyResetBtn = document.getElementById('ev-empty-reset-btn');
    const searchEmptyResetBtn = document.getElementById('search-empty-reset-btn');

    if (!filterModal) return;

    let hideTooltipTimer = null;

    const DEFAULT_FILTERS = {
        type: 'all',
        brand: 'all',
        seats: 'all',
        maxPrice: 188
    };

    let evsAppliedFilters = { ...DEFAULT_FILTERS };
    let searchAppliedFilters = { ...DEFAULT_FILTERS };
    let draftFilters = { ...DEFAULT_FILTERS };
    let currentContext = 'evs';

    function getContextCards() {
        if (currentContext === 'search') {
            return Array.from(document.querySelectorAll('#search-fleet-grid .ev-card'));
        }
        return Array.from(document.querySelectorAll('#page-evs .ev-card'));
    }

    function getMatchingCount(filters) {
        const cards = getContextCards();
        const sourceCards = cards.length > 0 ? cards : Array.from(document.querySelectorAll('#page-evs .ev-card'));
        return sourceCards.filter(card => {
            const matchesType = filters.type === 'all' || card.dataset.type === filters.type;
            const matchesBrand = filters.brand === 'all' || card.dataset.brand === filters.brand;
            const matchesSeats = filters.seats === 'all' || card.dataset.seats === filters.seats;
            const matchesPrice = Number(card.dataset.price) <= filters.maxPrice;
            return matchesType && matchesBrand && matchesSeats && matchesPrice;
        }).length;
    }

    function updatePriceTooltip(val) {
        if (!priceTooltip || !priceSlider) return;
        const min = Number(priceSlider.min) || 88;
        const max = Number(priceSlider.max) || 188;
        const num = Number(val);
        const ratio = Math.max(0, Math.min(1, (num - min) / (max - min)));

        if (num >= max) {
            priceTooltip.textContent = 'Up to S$188 / day (All)';
        } else {
            priceTooltip.textContent = `Up to S$${num} / day`;
        }

        const sliderWidth = priceSlider.offsetWidth || 480;
        const tooltipWidth = priceTooltip.offsetWidth || 140;

        const thumbRadius = 11;
        const thumbCenterPx = thumbRadius + ratio * (sliderWidth - 2 * thumbRadius);

        let tooltipLeftPx = thumbCenterPx - tooltipWidth / 2;
        if (tooltipLeftPx < 0) {
            tooltipLeftPx = 0;
        } else if (tooltipLeftPx + tooltipWidth > sliderWidth) {
            tooltipLeftPx = sliderWidth - tooltipWidth;
        }

        priceTooltip.style.left = `${tooltipLeftPx}px`;
    }

    function showPriceTooltip() {
        if (!priceTooltip) return;
        if (hideTooltipTimer) {
            clearTimeout(hideTooltipTimer);
            hideTooltipTimer = null;
        }
        priceTooltip.classList.add('is-visible');
        updatePriceTooltip(priceSlider.value);
    }

    function hidePriceTooltip(immediate = false) {
        if (!priceTooltip) return;
        if (hideTooltipTimer) {
            clearTimeout(hideTooltipTimer);
            hideTooltipTimer = null;
        }
        if (immediate) {
            priceTooltip.classList.remove('is-visible');
            return;
        }
        hideTooltipTimer = setTimeout(() => {
            priceTooltip.classList.remove('is-visible');
            hideTooltipTimer = null;
        }, 280);
    }

    function updateApplyButton() {
        if (!filterApply) return;
        const count = getMatchingCount(draftFilters);
        if (count === 0) {
            filterApply.textContent = 'No Matches (0)';
        } else if (count === 1) {
            filterApply.textContent = 'Show 1 Vehicle';
        } else {
            filterApply.textContent = `Show ${count} Vehicles`;
        }
    }

    function syncModalUI(filters) {
        const chipGroups = filterModal.querySelectorAll('.filter-chips');
        chipGroups.forEach(group => {
            const category = group.dataset.filterCategory;
            const chips = group.querySelectorAll('.filter-chip');
            chips.forEach(chip => {
                if (chip.dataset.filterVal === String(filters[category])) {
                    chip.classList.add('active');
                } else {
                    chip.classList.remove('active');
                }
            });
        });

        if (priceSlider) {
            priceSlider.value = filters.maxPrice;
            updatePriceTooltip(filters.maxPrice);
        }

        updateApplyButton();
    }

    function openModal(context = 'evs') {
        currentContext = context;
        if (currentContext === 'search') {
            draftFilters = { ...searchAppliedFilters };
        } else {
            draftFilters = { ...evsAppliedFilters };
        }
        syncModalUI(draftFilters);

        filterModal.classList.add('active');
        filterModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');

        if (filterClose) filterClose.focus();
    }

    function closeModal() {
        hidePriceTooltip(true);
        filterModal.classList.remove('active');
        filterModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    }

    function applyFilters() {
        const cards = getContextCards();
        let visibleCount = 0;

        cards.forEach(card => {
            const matchesType = draftFilters.type === 'all' || card.dataset.type === draftFilters.type;
            const matchesBrand = draftFilters.brand === 'all' || card.dataset.brand === draftFilters.brand;
            const matchesSeats = draftFilters.seats === 'all' || card.dataset.seats === draftFilters.seats;
            const matchesPrice = Number(card.dataset.price) <= draftFilters.maxPrice;

            if (matchesType && matchesBrand && matchesSeats && matchesPrice) {
                card.classList.remove('is-hidden');
                card.classList.remove('animate-in');
                void card.offsetWidth;
                card.classList.add('animate-in');
                visibleCount++;
            } else {
                card.classList.add('is-hidden');
                card.classList.remove('animate-in');
            }
        });

        const isDefault = draftFilters.type === 'all' &&
                          draftFilters.brand === 'all' &&
                          draftFilters.seats === 'all' &&
                          draftFilters.maxPrice >= 188;

        if (currentContext === 'search') {
            searchAppliedFilters = { ...draftFilters };

            if (searchAvailableCount) {
                searchAvailableCount.textContent = visibleCount;
            }

            if (searchFilterTrigger) {
                if (isDefault) searchFilterTrigger.classList.remove('is-filtered');
                else searchFilterTrigger.classList.add('is-filtered');
            }

            if (searchEmptyState) {
                searchEmptyState.style.display = visibleCount === 0 ? 'flex' : 'none';
            }
        } else {
            evsAppliedFilters = { ...draftFilters };

            if (evsFilterCountText) {
                evsFilterCountText.textContent = isDefault ? 'All EVs' : `Showing ${visibleCount} of ${cards.length} EVs`;
            }

            if (evsFilterTrigger) {
                if (isDefault) evsFilterTrigger.classList.remove('is-filtered');
                else evsFilterTrigger.classList.add('is-filtered');
            }

            if (evsEmptyState) {
                evsEmptyState.style.display = visibleCount === 0 ? 'flex' : 'none';
            }
        }

        closeModal();
    }

    function resetAllFilters() {
        draftFilters = { ...DEFAULT_FILTERS };
        syncModalUI(draftFilters);
    }

    window.resetSearchFleetFilters = function() {
        searchAppliedFilters = { ...DEFAULT_FILTERS };
        const cards = Array.from(document.querySelectorAll('#search-fleet-grid .ev-card'));
        cards.forEach(card => {
            card.classList.remove('is-hidden');
            card.classList.remove('animate-in');
        });
        if (searchAvailableCount) searchAvailableCount.textContent = cards.length || 9;
        if (searchFilterTrigger) searchFilterTrigger.classList.remove('is-filtered');
        if (searchEmptyState) searchEmptyState.style.display = 'none';
        if (typeof window.resetSearchFleetSort === 'function') {
            window.resetSearchFleetSort();
        }
    };

    if (evsFilterTrigger) {
        evsFilterTrigger.addEventListener('click', () => openModal('evs'));
    }
    if (searchFilterTrigger) {
        searchFilterTrigger.addEventListener('click', () => openModal('search'));
    }

    if (filterClose) filterClose.addEventListener('click', closeModal);
    if (filterReset) filterReset.addEventListener('click', resetAllFilters);
    if (filterApply) filterApply.addEventListener('click', applyFilters);

    filterModal.addEventListener('click', (e) => {
        if (e.target === filterModal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && filterModal.classList.contains('active')) {
            closeModal();
        }
    });

    filterModal.addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (!chip) return;

        const group = chip.closest('.filter-chips');
        if (!group) return;

        const category = group.dataset.filterCategory;
        const val = chip.dataset.filterVal;

        draftFilters[category] = val;

        group.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        updateApplyButton();
    });

    if (priceSlider) {
        priceSlider.addEventListener('input', (e) => {
            const val = Number(e.target.value);
            draftFilters.maxPrice = val;
            showPriceTooltip();
            updatePriceTooltip(val);
            updateApplyButton();
        });

        priceSlider.addEventListener('pointerdown', showPriceTooltip);
        priceSlider.addEventListener('mousedown', showPriceTooltip);
        priceSlider.addEventListener('touchstart', showPriceTooltip, { passive: true });

        priceSlider.addEventListener('pointerup', () => hidePriceTooltip());
        priceSlider.addEventListener('mouseup', () => hidePriceTooltip());
        priceSlider.addEventListener('touchend', () => hidePriceTooltip());
        priceSlider.addEventListener('pointercancel', () => hidePriceTooltip());
        priceSlider.addEventListener('blur', () => hidePriceTooltip(true));
    }

    window.addEventListener('pointerup', () => {
        if (priceTooltip && priceTooltip.classList.contains('is-visible')) {
            hidePriceTooltip();
        }
    });
    window.addEventListener('mouseup', () => {
        if (priceTooltip && priceTooltip.classList.contains('is-visible')) {
            hidePriceTooltip();
        }
    });

    if (evsEmptyResetBtn) {
        evsEmptyResetBtn.addEventListener('click', () => {
            currentContext = 'evs';
            draftFilters = { ...DEFAULT_FILTERS };
            applyFilters();
        });
    }

    if (searchEmptyResetBtn) {
        searchEmptyResetBtn.addEventListener('click', () => {
            currentContext = 'search';
            draftFilters = { ...DEFAULT_FILTERS };
            applyFilters();
        });
    }

    window.addEventListener('hashchange', closeModal);
})();

(function initDatePickers() {
    function getTodayString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function setupDatePickerPair(pickupDateInput, returnDateInput) {
        if (!pickupDateInput || !returnDateInput) return;

        function updateMinDates() {
            const today = getTodayString();
            pickupDateInput.min = today;

            const currentPickup = pickupDateInput.value;
            const effectiveMinReturn = (currentPickup && currentPickup >= today) ? currentPickup : today;
            returnDateInput.min = effectiveMinReturn;

            if (pickupDateInput.value && pickupDateInput.value < today) {
                pickupDateInput.value = today;
            }
            if (returnDateInput.value && returnDateInput.value < effectiveMinReturn) {
                returnDateInput.value = effectiveMinReturn;
            }
        }

        updateMinDates();

        pickupDateInput.addEventListener('focus', updateMinDates);
        returnDateInput.addEventListener('focus', updateMinDates);

        pickupDateInput.addEventListener('change', updateMinDates);
        pickupDateInput.addEventListener('blur', updateMinDates);

        returnDateInput.addEventListener('change', updateMinDates);
        returnDateInput.addEventListener('blur', updateMinDates);

        [pickupDateInput, returnDateInput].forEach(input => {
            input.addEventListener('pointerdown', () => {
                input.classList.add('is-focused');
                input.focus();
            });
            input.addEventListener('focus', () => {
                input.classList.add('is-focused');
            });
            input.addEventListener('blur', () => {
                input.classList.remove('is-focused');
            });
            input.addEventListener('change', () => {
                input.classList.remove('is-focused');
            });
        });
    }

    setupDatePickerPair(
        document.getElementById('pickup-date'),
        document.getElementById('return-date')
    );

    setupDatePickerPair(
        document.getElementById('search-pickup-date'),
        document.getElementById('search-return-date')
    );

    document.addEventListener('pointerdown', (e) => {
        ['pickup-date', 'return-date', 'search-pickup-date', 'search-return-date'].forEach(id => {
            const el = document.getElementById(id);
            if (el && !e.target.closest(`#${id}`)) {
                el.classList.remove('is-focused');
            }
        });
    });
})();

(function initSearchPage() {
    const homeSearchBtn = document.getElementById('home-search-btn');
    const searchForm = document.getElementById('search-page-form');
    const searchPageBtn = document.getElementById('search-page-submit-btn');

    const homePickupLocation = document.getElementById('pickup-location');
    const homeReturnLocation = document.getElementById('return-location');
    const homePickupDate = document.getElementById('pickup-date');
    const homeReturnDate = document.getElementById('return-date');

    const searchPickupLocation = document.getElementById('search-pickup-location');
    const searchReturnLocation = document.getElementById('search-return-location');
    const searchPickupDate = document.getElementById('search-pickup-date');
    const searchReturnDate = document.getElementById('search-return-date');

    const searchEmptyState = document.getElementById('search-empty-state');
    const searchLoadingState = document.getElementById('search-loading-state');
    const searchResultsContent = document.getElementById('search-results-content');
    const searchResultsSummary = document.getElementById('search-results-summary');
    const searchFleetGrid = document.getElementById('search-fleet-grid');

    let hasActiveSearch = false;
    let searchTimer = null;

    function populateSearchFleet() {
        if (!searchFleetGrid) return;
        const sourceFleet = document.querySelector('#page-evs .ev-fleet-container');
        if (sourceFleet && searchFleetGrid.children.length === 0) {
            const sourceCards = Array.from(sourceFleet.querySelectorAll('.ev-card')).sort((a, b) => {
                const idxA = parseInt(a.dataset.defaultIndex, 10);
                const idxB = parseInt(b.dataset.defaultIndex, 10);
                if (!isNaN(idxA) && !isNaN(idxB)) return idxA - idxB;
                return 0;
            });
            sourceCards.forEach((card, idx) => {
                const clone = card.cloneNode(true);
                clone.style.display = '';
                clone.dataset.defaultIndex = card.dataset.defaultIndex !== undefined ? card.dataset.defaultIndex : idx;
                if (!clone.dataset.name) {
                    const titleEl = clone.querySelector('.ev-card-title');
                    clone.dataset.name = titleEl ? titleEl.textContent.trim() : '';
                }
                searchFleetGrid.appendChild(clone);
            });
        }
    }

    function updateSearchSummary(pickupVal, returnVal, pickupDateVal, returnDateVal) {
        if (!searchResultsSummary) return;

        const locationNames = {
            'alexandra': 'Alexandra Main Branch',
            'airport': 'Changi Airport Branch',
            'orchard': 'Orchard Car Park',
            'jurong': 'Jurong East Car Park',
            'woodlands': 'Woodlands Car Park'
        };

        const pickupName = locationNames[pickupVal] || 'Singapore';
        let summaryText = `Showing 9 all-electric vehicles available for pickup at ${pickupName}`;

        if (pickupDateVal && returnDateVal) {
            summaryText += ` (${pickupDateVal} → ${returnDateVal})`;
        } else if (pickupDateVal) {
            summaryText += ` (from ${pickupDateVal})`;
        }

        searchResultsSummary.textContent = summaryText;
    }

    function showEmptyState() {
        hasActiveSearch = false;
        if (searchTimer) clearTimeout(searchTimer);
        if (searchLoadingState) searchLoadingState.style.display = 'none';
        if (searchResultsContent) searchResultsContent.style.display = 'none';
        if (searchEmptyState) searchEmptyState.style.display = 'flex';
    }

    function executeSearchWithLoading() {
        hasActiveSearch = true;
        populateSearchFleet();
        if (typeof window.resetSearchFleetFilters === 'function') {
            window.resetSearchFleetFilters();
        }

        if (searchTimer) clearTimeout(searchTimer);

        if (searchEmptyState) searchEmptyState.style.display = 'none';
        if (searchResultsContent) searchResultsContent.style.display = 'none';

        if (searchLoadingState) {
            searchLoadingState.style.display = 'block';
        }

        searchTimer = setTimeout(() => {
            if (searchLoadingState) searchLoadingState.style.display = 'none';
            if (searchResultsContent) {
                searchResultsContent.style.display = 'block';
            }
            updateSearchSummary(
                searchPickupLocation ? searchPickupLocation.value : '',
                searchReturnLocation ? searchReturnLocation.value : '',
                searchPickupDate ? searchPickupDate.value : '',
                searchReturnDate ? searchReturnDate.value : ''
            );
        }, 850);
    }

    function validateSearchInputs(prefix = '') {
        const pLocEl = document.getElementById(prefix ? `${prefix}-pickup-location` : 'pickup-location');
        const rLocEl = document.getElementById(prefix ? `${prefix}-return-location` : 'return-location');
        const pDateEl = document.getElementById(prefix ? `${prefix}-pickup-date` : 'pickup-date');
        const rDateEl = document.getElementById(prefix ? `${prefix}-return-date` : 'return-date');

        const fields = [
            { el: pLocEl, val: pLocEl ? pLocEl.value.trim() : '' },
            { el: rLocEl, val: rLocEl ? rLocEl.value.trim() : '' },
            { el: pDateEl, val: pDateEl ? pDateEl.value.trim() : '' },
            { el: rDateEl, val: rDateEl ? rDateEl.value.trim() : '' }
        ];

        let isValid = true;
        let firstInvalidEl = null;

        fields.forEach(field => {
            if (!field.el) return;
            const parent = field.el.closest('.widget-field');
            if (!field.val) {
                isValid = false;
                field.el.classList.add('input-error');
                if (parent) {
                    parent.classList.remove('shake');
                    void parent.offsetWidth;
                    parent.classList.add('shake');
                }
                if (!firstInvalidEl) firstInvalidEl = field.el;
            } else {
                field.el.classList.remove('input-error');
                if (parent) parent.classList.remove('shake');
            }
        });

        if (isValid && pDateEl && rDateEl && pDateEl.value && rDateEl.value) {
            if (rDateEl.value < pDateEl.value) {
                isValid = false;
                rDateEl.classList.add('input-error');
                const parent = rDateEl.closest('.widget-field');
                if (parent) {
                    parent.classList.remove('shake');
                    void parent.offsetWidth;
                    parent.classList.add('shake');
                }
                if (!firstInvalidEl) firstInvalidEl = rDateEl;
            }
        }

        if (firstInvalidEl) {
            firstInvalidEl.focus();
        }

        return isValid;
    }

    function bindClearValidationListeners(prefix = '') {
        const ids = [
            prefix ? `${prefix}-pickup-location` : 'pickup-location',
            prefix ? `${prefix}-return-location` : 'return-location',
            prefix ? `${prefix}-pickup-date` : 'pickup-date',
            prefix ? `${prefix}-return-date` : 'return-date'
        ];

        ids.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const handleInput = () => {
                if (el.value.trim()) {
                    el.classList.remove('input-error');
                    const parent = el.closest('.widget-field');
                    if (parent) parent.classList.remove('shake');
                }
            };
            el.addEventListener('change', handleInput);
            el.addEventListener('input', handleInput);
        });
    }

    bindClearValidationListeners('');
    bindClearValidationListeners('search');

    function clearValidationErrors(prefix = '') {
        const ids = [
            prefix ? `${prefix}-pickup-location` : 'pickup-location',
            prefix ? `${prefix}-return-location` : 'return-location',
            prefix ? `${prefix}-pickup-date` : 'pickup-date',
            prefix ? `${prefix}-return-date` : 'return-date'
        ];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.classList.remove('input-error');
            const parent = el.closest('.widget-field');
            if (parent) parent.classList.remove('shake');
        });
    }

    if (homeSearchBtn) {
        homeSearchBtn.addEventListener('click', (e) => {
            e.preventDefault();

            const pLoc = homePickupLocation ? homePickupLocation.value.trim() : '';
            const rLoc = homeReturnLocation ? homeReturnLocation.value.trim() : '';
            const pDate = homePickupDate ? homePickupDate.value.trim() : '';
            const rDate = homeReturnDate ? homeReturnDate.value.trim() : '';

            if (searchPickupLocation) searchPickupLocation.value = pLoc;
            if (searchReturnLocation) searchReturnLocation.value = rLoc;
            if (searchPickupDate) searchPickupDate.value = pDate;
            if (searchReturnDate) searchReturnDate.value = rDate;

            if (searchPickupLocation && pLoc) searchPickupLocation.dispatchEvent(new Event('change'));
            if (searchReturnLocation && rLoc) searchReturnLocation.dispatchEvent(new Event('change'));
            if (searchPickupDate && pDate) searchPickupDate.dispatchEvent(new Event('change'));
            if (searchReturnDate && rDate) searchReturnDate.dispatchEvent(new Event('change'));

            clearValidationErrors('');
            clearValidationErrors('search');

            const isComplete = Boolean(pLoc && rLoc && pDate && rDate && rDate >= pDate);

            const homeCard = document.querySelector('.reservation-card');
            if (homeCard) {
                cardTransitionState = {
                    type: 'home-to-search',
                    startRect: homeCard.getBoundingClientRect()
                };
            }

            if (isComplete) {
                executeSearchWithLoading();
            } else {
                showEmptyState();
            }

            if (window.location.hash === '#search') {
                navigateTo('search');
            } else {
                window.location.hash = 'search';
            }
        });
    }

    function handleSearchPageSubmit() {
        const isSearchValid = validateSearchInputs('search');
        if (!isSearchValid) {
            showEmptyState();
            return;
        }

        executeSearchWithLoading();
    }

    if (searchPageBtn) {
        searchPageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleSearchPageSubmit();
        });
    }

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSearchPageSubmit();
        });
    }

    const searchBackBtn = document.getElementById('search-back-btn');
    if (searchBackBtn) {
        searchBackBtn.addEventListener('click', (e) => {
            e.preventDefault();

            const searchCard = document.querySelector('.search-widget-card');
            if (searchCard) {
                cardTransitionState = {
                    type: 'search-to-home',
                    startRect: searchCard.getBoundingClientRect()
                };
            }

            if (homePickupLocation && searchPickupLocation) homePickupLocation.value = searchPickupLocation.value;
            if (homeReturnLocation && searchReturnLocation) homeReturnLocation.value = searchReturnLocation.value;
            if (homePickupDate && searchPickupDate) homePickupDate.value = searchPickupDate.value;
            if (homeReturnDate && searchReturnDate) homeReturnDate.value = searchReturnDate.value;

            if (homePickupLocation) homePickupLocation.dispatchEvent(new Event('change'));
            if (homeReturnLocation) homeReturnLocation.dispatchEvent(new Event('change'));
            if (homePickupDate) homePickupDate.dispatchEvent(new Event('change'));
            if (homeReturnDate) homeReturnDate.dispatchEvent(new Event('change'));

            if (window.location.hash === '#home' || !window.location.hash) {
                navigateTo('home');
            } else {
                window.location.hash = 'home';
            }
        });
    }

    window.addEventListener('hashchange', () => {
        const currentHash = window.location.hash.replace('#', '').trim();
        if (currentHash === 'search') {
            if (!hasActiveSearch) {
                showEmptyState();
            }
        }
    });

    function createFleetSorter({ priceBtnId, nameBtnId, getContainer }) {
        const sortPriceBtn = document.getElementById(priceBtnId);
        const sortNameBtn = document.getElementById(nameBtnId);
        if (!sortPriceBtn || !sortNameBtn) return null;

        let currentSort = {
            type: 'none',
            direction: 'asc'
        };

        function ensureCardsMetadata(container) {
            const cards = Array.from(container.querySelectorAll('.ev-card'));
            cards.forEach((card, idx) => {
                if (card.dataset.defaultIndex === undefined) {
                    card.dataset.defaultIndex = idx;
                }
                if (!card.dataset.name) {
                    const titleEl = card.querySelector('.ev-card-title');
                    card.dataset.name = titleEl ? titleEl.textContent.trim() : '';
                }
            });
            return cards;
        }

        function updateSortUI() {
            sortPriceBtn.classList.remove('is-active', 'is-asc', 'is-desc');
            sortPriceBtn.title = 'Sort by Price: Low to High';
            sortPriceBtn.setAttribute('aria-label', 'Sort by Price: Low to High');

            sortNameBtn.classList.remove('is-active', 'is-asc', 'is-desc');
            sortNameBtn.title = 'Sort by Name: A to Z';
            sortNameBtn.setAttribute('aria-label', 'Sort by Name: A to Z');

            if (currentSort.type === 'price') {
                sortPriceBtn.classList.add('is-active');
                if (currentSort.direction === 'asc') {
                    sortPriceBtn.classList.add('is-asc');
                    sortPriceBtn.title = 'Price: Low to High (Click to sort High to Low)';
                    sortPriceBtn.setAttribute('aria-label', 'Price: Low to High. Click to sort High to Low');
                } else {
                    sortPriceBtn.classList.add('is-desc');
                    sortPriceBtn.title = 'Price: High to Low (Click to reset sort)';
                    sortPriceBtn.setAttribute('aria-label', 'Price: High to Low. Click to reset sort');
                }
            } else if (currentSort.type === 'name') {
                sortNameBtn.classList.add('is-active');
                if (currentSort.direction === 'asc') {
                    sortNameBtn.classList.add('is-asc');
                    sortNameBtn.title = 'Name: A to Z (Click to sort Z to A)';
                    sortNameBtn.setAttribute('aria-label', 'Name: A to Z. Click to sort Z to A');
                } else {
                    sortNameBtn.classList.add('is-desc');
                    sortNameBtn.title = 'Name: Z to A (Click to reset sort)';
                    sortNameBtn.setAttribute('aria-label', 'Name: Z to A. Click to reset sort');
                }
            }
        }

        function executeSort() {
            const container = getContainer();
            if (!container) return;
            const currentCards = ensureCardsMetadata(container);
            if (currentCards.length === 0) return;

            currentCards.sort((a, b) => {
                if (currentSort.type === 'price') {
                    const priceA = parseFloat(a.dataset.price) || 0;
                    const priceB = parseFloat(b.dataset.price) || 0;
                    return currentSort.direction === 'asc' ? priceA - priceB : priceB - priceA;
                } else if (currentSort.type === 'name') {
                    const nameA = a.dataset.name || '';
                    const nameB = b.dataset.name || '';
                    return currentSort.direction === 'asc'
                        ? nameA.localeCompare(nameB, undefined, { sensitivity: 'base' })
                        : nameB.localeCompare(nameA, undefined, { sensitivity: 'base' });
                } else {
                    const idxA = parseInt(a.dataset.defaultIndex, 10) || 0;
                    const idxB = parseInt(b.dataset.defaultIndex, 10) || 0;
                    return idxA - idxB;
                }
            });

            currentCards.forEach(card => {
                container.appendChild(card);
                if (!card.classList.contains('is-hidden')) {
                    card.classList.remove('is-reordered');
                    void card.offsetWidth;
                    card.classList.add('is-reordered');
                }
            });

            updateSortUI();
        }

        function handleSortClick(type) {
            if (currentSort.type === type) {
                if (currentSort.direction === 'asc') {
                    currentSort.direction = 'desc';
                } else {
                    currentSort.type = 'none';
                    currentSort.direction = 'asc';
                }
            } else {
                currentSort.type = type;
                currentSort.direction = 'asc';
            }
            executeSort();
        }

        function resetSort() {
            currentSort.type = 'none';
            currentSort.direction = 'asc';
            updateSortUI();
            const container = getContainer();
            if (container) {
                const currentCards = ensureCardsMetadata(container);
                currentCards.sort((a, b) => {
                    const idxA = parseInt(a.dataset.defaultIndex, 10) || 0;
                    const idxB = parseInt(b.dataset.defaultIndex, 10) || 0;
                    return idxA - idxB;
                });
                currentCards.forEach(card => container.appendChild(card));
            }
        }

        sortPriceBtn.addEventListener('click', () => handleSortClick('price'));
        sortNameBtn.addEventListener('click', () => handleSortClick('name'));

        const initialContainer = getContainer();
        if (initialContainer) ensureCardsMetadata(initialContainer);

        return {
            executeSort,
            resetSort,
            handleSortClick,
            getSortState: () => ({ ...currentSort })
        };
    }

    const evsSortController = createFleetSorter({
        priceBtnId: 'ev-sort-price',
        nameBtnId: 'ev-sort-name',
        getContainer: () => document.querySelector('#page-evs .ev-fleet-container')
    });

    const searchSortController = createFleetSorter({
        priceBtnId: 'search-sort-price',
        nameBtnId: 'search-sort-name',
        getContainer: () => document.getElementById('search-fleet-grid')
    });

    window.resetSearchFleetSort = function() {
        if (searchSortController) searchSortController.resetSort();
    };

    (function initAuthModule() {
        const STORAGE_USERS = 'azoom_users';
        const STORAGE_CURRENT_USER = 'azoom_current_user';

        const DEFAULT_DEMO_USERS = [
            {
                id: 'demo-user-1',
                name: 'Alex Tan',
                email: 'demo@azoom.sg',
                password: 'password123',
                createdAt: new Date().toISOString()
            }
        ];

        function getUsers() {
            try {
                const stored = localStorage.getItem(STORAGE_USERS);
                if (!stored) {
                    localStorage.setItem(STORAGE_USERS, JSON.stringify(DEFAULT_DEMO_USERS));
                    return DEFAULT_DEMO_USERS;
                }
                const parsed = JSON.parse(stored);
                return Array.isArray(parsed) ? parsed : DEFAULT_DEMO_USERS;
            } catch (e) {
                return DEFAULT_DEMO_USERS;
            }
        }

        function saveUsers(users) {
            try {
                localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
            } catch (e) {
                console.warn('Failed to save users to localStorage', e);
            }
        }

        function getCurrentUser() {
            try {
                const stored = localStorage.getItem(STORAGE_CURRENT_USER);
                return stored ? JSON.parse(stored) : null;
            } catch (e) {
                return null;
            }
        }

        function setCurrentUser(user) {
            try {
                if (user) {
                    localStorage.setItem(STORAGE_CURRENT_USER, JSON.stringify({
                        id: user.id,
                        firstName: user.firstName || (user.name || '').split(' ')[0],
                        lastName: user.lastName || (user.name || '').split(' ').slice(1).join(' '),
                        name: user.name,
                        email: user.email
                    }));
                } else {
                    localStorage.removeItem(STORAGE_CURRENT_USER);
                }
            } catch (e) {
                console.warn('Failed to set current user', e);
            }
            updateNavAuthUI();
        }

        const authBtn = document.getElementById('auth-btn');
        const authBtnText = document.getElementById('auth-btn-text');
        const authDropdown = document.getElementById('auth-user-dropdown');
        const dropdownUserName = document.getElementById('dropdown-user-name');
        const dropdownUserEmail = document.getElementById('dropdown-user-email');
        const authLogoutBtn = document.getElementById('auth-logout-btn');

        const authModal = document.getElementById('auth-modal');
        const authModalClose = document.getElementById('auth-modal-close');
        const authTabLogin = document.getElementById('auth-tab-login');
        const authTabRegister = document.getElementById('auth-tab-register');
        const authPanelLogin = document.getElementById('auth-panel-login');
        const authPanelRegister = document.getElementById('auth-panel-register');

        const loginForm = document.getElementById('auth-login-form');
        const loginEmailInput = document.getElementById('login-email');
        const loginPasswordInput = document.getElementById('login-password');
        const loginFeedback = document.getElementById('login-feedback');
        const switchToRegister = document.getElementById('switch-to-register');

        const registerForm = document.getElementById('auth-register-form');
        const registerFirstNameInput = document.getElementById('register-firstname');
        const registerLastNameInput = document.getElementById('register-lastname');
        const registerEmailInput = document.getElementById('register-email');
        const registerPasswordInput = document.getElementById('register-password');
        const registerConfirmInput = document.getElementById('register-confirm-password');
        const registerFeedback = document.getElementById('register-feedback');
        const switchToLogin = document.getElementById('switch-to-login');
        const authTopToast = document.getElementById('auth-top-toast');
        const authTopToastText = document.getElementById('auth-top-toast-text');
        let toastTimer = null;

        function showTopToast(message, type = 'success') {
            if (!authTopToast) return;
            if (authTopToastText && message) {
                authTopToastText.textContent = message;
            }
            const iconBox = authTopToast.querySelector('.auth-top-toast-icon');
            if (type === 'warning') {
                authTopToast.classList.add('toast-warning');
                if (iconBox) {
                    iconBox.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
                }
            } else {
                authTopToast.classList.remove('toast-warning');
                if (iconBox) {
                    iconBox.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                }
            }
            if (toastTimer) clearTimeout(toastTimer);
            authTopToast.classList.add('show');
            authTopToast.setAttribute('aria-hidden', 'false');
            toastTimer = setTimeout(() => {
                authTopToast.classList.remove('show');
                authTopToast.setAttribute('aria-hidden', 'true');
            }, 3200);
        }
        window.showTopToast = showTopToast;

        function updateNavAuthUI() {
            const user = getCurrentUser();
            if (user) {
                const firstName = user.firstName || (user.name || 'User').split(' ')[0];
                if (authBtnText) authBtnText.textContent = `Hi, ${firstName}`;
                if (dropdownUserName) dropdownUserName.textContent = user.name || 'User';
                if (dropdownUserEmail) dropdownUserEmail.textContent = user.email || '';
                if (authBtn) {
                    authBtn.classList.add('is-logged-in');
                    authBtn.title = `Logged in as ${user.name} (${user.email}). Click to manage.`;
                }
            } else {
                if (authBtnText) authBtnText.textContent = 'Login / Register';
                if (authDropdown) authDropdown.style.display = 'none';
                if (authBtn) {
                    authBtn.classList.remove('is-logged-in');
                    authBtn.title = 'Account Login or Registration';
                }
            }
        }

        function openModal(tab = 'login') {
            if (!authModal) return;
            switchTab(tab);
            authModal.classList.add('active');
            authModal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
            if (tab === 'login' && loginEmailInput) {
                setTimeout(() => loginEmailInput.focus(), 60);
            } else if (tab === 'register' && registerFirstNameInput) {
                setTimeout(() => registerFirstNameInput.focus(), 60);
            }
        }

        function resetPasswordVisibility() {
            document.querySelectorAll('.auth-pwd-toggle').forEach(btn => {
                const targetId = btn.dataset.pwdTarget;
                const targetInput = document.getElementById(targetId);
                if (targetInput) targetInput.type = 'password';
                const iconImg = btn.querySelector('.pwd-eye-icon');
                if (iconImg) iconImg.src = 'images/eye-closed.svg';
                btn.setAttribute('aria-label', 'Show password');
            });
        }

        function closeModal() {
            if (!authModal) return;
            authModal.classList.remove('active');
            authModal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
            clearFormErrors();
            resetPasswordVisibility();
        }

        function switchTab(tab) {
            clearFormErrors();
            if (tab === 'register') {
                if (authTabRegister) {
                    authTabRegister.classList.add('active');
                    authTabRegister.setAttribute('aria-selected', 'true');
                }
                if (authTabLogin) {
                    authTabLogin.classList.remove('active');
                    authTabLogin.setAttribute('aria-selected', 'false');
                }
                if (authPanelRegister) authPanelRegister.style.display = 'block';
                if (authPanelLogin) authPanelLogin.style.display = 'none';
            } else {
                if (authTabLogin) {
                    authTabLogin.classList.add('active');
                    authTabLogin.setAttribute('aria-selected', 'true');
                }
                if (authTabRegister) {
                    authTabRegister.classList.remove('active');
                    authTabRegister.setAttribute('aria-selected', 'false');
                }
                if (authPanelLogin) authPanelLogin.style.display = 'block';
                if (authPanelRegister) authPanelRegister.style.display = 'none';
            }
        }

        function clearFormErrors() {
            document.querySelectorAll('.auth-field').forEach(field => {
                field.classList.remove('has-error');
            });
            document.querySelectorAll('.auth-input').forEach(input => {
                input.classList.remove('input-error');
            });
            if (loginFeedback) {
                loginFeedback.style.display = 'none';
                loginFeedback.className = 'auth-feedback';
                loginFeedback.textContent = '';
            }
            if (registerFeedback) {
                registerFeedback.style.display = 'none';
                registerFeedback.className = 'auth-feedback';
                registerFeedback.textContent = '';
            }
        }

        function setFieldError(fieldId, errorMsg) {
            const field = document.getElementById(fieldId);
            if (!field) return;
            field.classList.add('has-error');
            const input = field.querySelector('.auth-input');
            if (input) input.classList.add('input-error');
            const errSpan = field.querySelector('.auth-field-error');
            if (errSpan) errSpan.textContent = errorMsg;
        }

        function clearSingleFieldError(fieldId) {
            const field = document.getElementById(fieldId);
            if (!field) return;
            field.classList.remove('has-error');
            const input = field.querySelector('.auth-input');
            if (input) input.classList.remove('input-error');
            const errSpan = field.querySelector('.auth-field-error');
            if (errSpan) errSpan.textContent = '';
        }

        [
            { id: 'field-login-email', input: loginEmailInput },
            { id: 'field-login-password', input: loginPasswordInput },
            { id: 'field-register-firstname', input: registerFirstNameInput },
            { id: 'field-register-lastname', input: registerLastNameInput },
            { id: 'field-register-email', input: registerEmailInput },
            { id: 'field-register-password', input: registerPasswordInput },
            { id: 'field-register-confirm', input: registerConfirmInput }
        ].forEach(item => {
            if (item.input) {
                item.input.addEventListener('input', () => clearSingleFieldError(item.id));
            }
        });

        document.querySelectorAll('.auth-pwd-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const targetId = btn.dataset.pwdTarget;
                const targetInput = document.getElementById(targetId);
                if (!targetInput) return;
                const isPassword = targetInput.type === 'password';
                targetInput.type = isPassword ? 'text' : 'password';
                const iconImg = btn.querySelector('.pwd-eye-icon');
                if (iconImg) {
                    iconImg.src = isPassword ? 'images/eye.svg' : 'images/eye-closed.svg';
                }
                btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
            });
        });

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                clearFormErrors();

                const email = (loginEmailInput.value || '').trim();
                const password = loginPasswordInput.value || '';

                let hasError = false;
                if (!email) {
                    setFieldError('field-login-email', 'Please enter your email address.');
                    hasError = true;
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    setFieldError('field-login-email', 'Please enter a valid email address.');
                    hasError = true;
                }

                if (!password) {
                    setFieldError('field-login-password', 'Please enter your password.');
                    hasError = true;
                }

                if (hasError) return;

                const users = getUsers();
                const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && (u.password === password || (email.toLowerCase() === 'demo@azoom.sg' && (password === '123456' || password === 'password123'))));

                if (!user) {
                    if (loginFeedback) {
                        loginFeedback.className = 'auth-feedback error';
                        loginFeedback.textContent = 'Incorrect email or password. Please try again.';
                        loginFeedback.style.display = 'block';
                    }
                    return;
                }

                setCurrentUser(user);
                closeModal();
                loginForm.reset();
                const firstName = user.firstName || (user.name || 'User').split(' ')[0];
                showTopToast(`Welcome back, ${firstName}! You are now logged in.`, 'success');
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                clearFormErrors();

                const firstName = (registerFirstNameInput.value || '').trim();
                const lastName = (registerLastNameInput.value || '').trim();
                const name = `${firstName} ${lastName}`.trim();
                const email = (registerEmailInput.value || '').trim();
                const password = registerPasswordInput.value || '';
                const confirmPassword = registerConfirmInput.value || '';

                let hasError = false;
                if (!firstName) {
                    setFieldError('field-register-firstname', 'Please enter your first name.');
                    hasError = true;
                }
                if (!lastName) {
                    setFieldError('field-register-lastname', 'Please enter your last name.');
                    hasError = true;
                }

                if (!email) {
                    setFieldError('field-register-email', 'Please enter your email address.');
                    hasError = true;
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    setFieldError('field-register-email', 'Please enter a valid email address.');
                    hasError = true;
                }

                if (!password) {
                    setFieldError('field-register-password', 'Please enter a password.');
                    hasError = true;
                } else if (password.length < 6) {
                    setFieldError('field-register-password', 'Password must be at least 6 characters.');
                    hasError = true;
                }

                if (!confirmPassword) {
                    setFieldError('field-register-confirm', 'Please re-enter your password.');
                    hasError = true;
                } else if (password !== confirmPassword) {
                    setFieldError('field-register-confirm', 'Passwords do not match.');
                    hasError = true;
                }

                if (hasError) return;

                const users = getUsers();
                if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                    setFieldError('field-register-email', 'This email is already registered.');
                    return;
                }

                const newUser = {
                    id: 'user-' + Date.now(),
                    firstName: firstName,
                    lastName: lastName,
                    name: name,
                    email: email,
                    password: password,
                    createdAt: new Date().toISOString()
                };

                users.push(newUser);
                saveUsers(users);

                registerForm.reset();
                switchTab('login');
                showTopToast('Registration successful! Please log in to your account.');
                if (loginEmailInput) {
                    setTimeout(() => loginEmailInput.focus(), 60);
                }
            });
        }

        if (authTabLogin) authTabLogin.addEventListener('click', () => switchTab('login'));
        if (authTabRegister) authTabRegister.addEventListener('click', () => switchTab('register'));
        if (switchToRegister) switchToRegister.addEventListener('click', () => switchTab('register'));
        if (switchToLogin) switchToLogin.addEventListener('click', () => switchTab('login'));

        if (authBtn) {
            authBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const user = getCurrentUser();
                if (user) {
                    if (authDropdown) {
                        const isVisible = authDropdown.style.display === 'block';
                        authDropdown.style.display = isVisible ? 'none' : 'block';
                        authBtn.setAttribute('aria-expanded', !isVisible);
                    }
                } else {
                    openModal('login');
                }
            });
        }

        if (authLogoutBtn) {
            authLogoutBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                setCurrentUser(null);
                if (authDropdown) authDropdown.style.display = 'none';
            });
        }

        document.addEventListener('click', (e) => {
            if (authDropdown && authDropdown.style.display === 'block') {
                if (!authDropdown.contains(e.target) && e.target !== authBtn && !authBtn.contains(e.target)) {
                    authDropdown.style.display = 'none';
                    if (authBtn) authBtn.setAttribute('aria-expanded', 'false');
                }
            }
        });

        if (authModalClose) authModalClose.addEventListener('click', closeModal);
        if (authModal) {
            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) closeModal();
            });
        }

        const STORAGE_BOOKINGS = 'azoom_account_bookings_v1';
        const viewBookingBtn = document.getElementById('view-booking-btn');
        const searchViewBookingBtn = document.getElementById('search-view-booking-btn');
        const bookingModal = document.getElementById('booking-modal');
        const bookingModalClose = document.getElementById('booking-modal-close');
        const bookingTabUpcoming = document.getElementById('booking-tab-upcoming');
        const bookingTabPast = document.getElementById('booking-tab-past');
        const bookingPanelUpcoming = document.getElementById('booking-panel-upcoming');
        const bookingPanelPast = document.getElementById('booking-panel-past');

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

        function getBookingsForCurrentUser() {
            const user = getCurrentUser();
            if (!user) return [];
            const emailLower = (user.email || '').toLowerCase();
            return getAllBookings().filter(b =>
                (b.userEmail && b.userEmail.toLowerCase() === emailLower) ||
                (b.userId && b.userId === user.id)
            );
        }

        function addBookingForCurrentUser(bookingData) {
            const all = getAllBookings();
            all.unshift(bookingData);
            saveAllBookings(all);
        }

        function formatDisplayDate(isoDate) {
            if (!isoDate) return '';
            const parts = isoDate.split('-');
            if (parts.length !== 3) return isoDate;
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const mIdx = parseInt(parts[1], 10) - 1;
            return `${parts[2]} ${months[mIdx] || parts[1]} ${parts[0]}`;
        }

        function formatDisplayTime(hhmm) {
            if (!hhmm) return '';
            const [hStr, mStr] = hhmm.split(':');
            const h = parseInt(hStr, 10);
            if (isNaN(h)) return hhmm;
            const period = h < 12 ? 'AM' : 'PM';
            const h12 = h % 12 === 0 ? 12 : h % 12;
            return `${String(h12).padStart(2, '0')}:${mStr || '00'} ${period}`;
        }

        const bookingPanelDetails = document.getElementById('booking-panel-details');
        const bookingModalWorkspace = bookingModal ? bookingModal.querySelector('.booking-modal-workspace') : null;
        let lastActiveBookingTab = 'upcoming';
        let activeDetailBookingId = null;

        function getStatusMeta(status) {
            if (status === 'completed') {
                return { statusClass: 'status-completed', statusLabel: 'Completed' };
            }
            if (status === 'rented') {
                return { statusClass: 'status-inuse', statusLabel: 'Picked Up' };
            }
            if (status === 'returned') {
                return { statusClass: 'status-inspect', statusLabel: 'Pending Inspection' };
            }
            if (status === 'penalty_pending') {
                return { statusClass: 'status-penalty', statusLabel: 'Payment Due' };
            }
            return { statusClass: 'status-confirmed', statusLabel: 'Reserved' };
        }

        function buildBookingCardHTML(b) {
            const isCompleted = b.status === 'completed';
            const { statusClass, statusLabel } = getStatusMeta(b.status);
            const durText = `${b.days} ${b.days === 1 ? 'Day' : 'Days'}`;
            const pDateFormatted = `${formatDisplayDate(b.pickupDate)} · ${formatDisplayTime(b.pickupTime)}`;
            const rDateFormatted = `${formatDisplayDate(b.returnDate)} · ${formatDisplayTime(b.returnTime)}`;
            const displayTotal = b.finalTotal || b.totalPrice;

            return `
                <div class="booking-item-card ${isCompleted ? 'past-card' : ''}" data-booking-card-id="${b.id}">
                    <div class="booking-item-topbar">
                        <div class="booking-ref-group">
                            <span class="booking-ref-label">Booking Ref:</span>
                            <span class="booking-ref-code">${b.ref}</span>
                        </div>
                        <span class="booking-status-badge ${statusClass}">${statusLabel}</span>
                    </div>

                    <div class="booking-item-main">
                        <div class="booking-car-col">
                            <div class="booking-car-thumb">
                                <img src="${b.image || 'images/cars/BYD-Atto_3-2023-HD-c6d412e81c7fb2f19f29fc71c801a09828a964d3f.jpg?v=4'}" alt="${b.model}">
                            </div>
                            <div class="booking-car-meta">
                                <h4>${b.model}</h4>
                                <p>${b.type || 'EV'} &middot; ${b.seats || '5 seats'} &middot; ${b.battery || '60.0 kWh'}</p>
                            </div>
                        </div>

                        <div class="booking-route-col">
                            <div class="booking-route-point">
                                <span class="route-point-tag">Pickup</span>
                                <strong class="route-point-loc">${b.pickupLocName}</strong>
                                <span class="route-point-date">${pDateFormatted}</span>
                            </div>
                            <div class="booking-route-point">
                                <span class="route-point-tag">Return</span>
                                <strong class="route-point-loc">${b.returnLocName}</strong>
                                <span class="route-point-date">${rDateFormatted}</span>
                            </div>
                        </div>

                        <div class="booking-price-col">
                            <span class="booking-duration-tag">${durText}</span>
                            <span class="booking-total-price">S$${displayTotal}</span>
                        </div>
                    </div>

                    <div class="booking-item-footer">
                        <button type="button" class="booking-view-details-btn" data-booking-action="view-details" data-booking-id="${b.id}">View Details</button>
                    </div>
                </div>
            `;
        }

        function renderBookingDetailsView(bookingId) {
            const b = getAllBookings().find(item => item.id === bookingId);
            if (!b || !bookingPanelDetails) return;
            activeDetailBookingId = bookingId;

            const { statusClass, statusLabel } = getStatusMeta(b.status);
            const pDateFormatted = `${formatDisplayDate(b.pickupDate)} · ${formatDisplayTime(b.pickupTime)}`;
            const rDateFormatted = `${formatDisplayDate(b.returnDate)} · ${formatDisplayTime(b.returnTime)}`;
            const cardLast4 = b.cardLast4 || '4242';

            let rightCardHTML = '';
            if (b.status === 'upcoming' || !b.status) {
                rightCardHTML = `
                    <div class="bdetail-card">
                        <h4 class="bdetail-card-title">Reserved &mdash; Pick Up Vehicle at Branch</h4>
                        <p class="bdetail-stage-desc">
                            Your electric vehicle is reserved at <strong>${b.pickupLocName}</strong>. Present your booking reference (<strong>${b.ref}</strong>) at the AZoom counter to pick up your car.
                        </p>
                        <div class="bdetail-bill-box">
                            <div class="bdetail-bill-row">
                                <span>Rental Paid (S$${b.dailyPrice} &times; ${b.days} ${b.days === 1 ? 'day' : 'days'})</span>
                                <strong>S$${b.totalPrice}</strong>
                            </div>
                            <div class="bdetail-bill-row">
                                <span>Credit Card</span>
                                <strong>&bull;&bull;&bull;&bull; ${cardLast4}</strong>
                            </div>
                        </div>
                        <div class="bdetail-actions">
                            <button type="button" class="booking-action-btn btn-outline" data-booking-action="cancel" data-booking-id="${b.id}">Cancel Booking</button>
                            <button type="button" class="booking-action-btn btn-solid" data-booking-action="pickup" data-booking-id="${b.id}">Pick Up Car</button>
                        </div>
                    </div>
                `;
            } else if (b.status === 'rented') {
                rightCardHTML = `
                    <div class="bdetail-card">
                        <h4 class="bdetail-card-title">In Use &mdash; Return Vehicle at Designated Car Park</h4>
                        <p class="bdetail-stage-desc">
                            When your trip ends, park the vehicle at <strong>${b.returnLocName}</strong> and click <strong>Return Car</strong> below. An AZoom staff member will then inspect the vehicle.
                        </p>
                        <div class="bdetail-bill-box">
                            <div class="bdetail-bill-row">
                                <span>Rental Paid (S$${b.dailyPrice} &times; ${b.days} ${b.days === 1 ? 'day' : 'days'})</span>
                                <strong>S$${b.totalPrice}</strong>
                            </div>
                            <div class="bdetail-bill-row">
                                <span>Designated Return Location</span>
                                <strong>${b.returnLocName}</strong>
                            </div>
                        </div>
                        <div class="bdetail-actions">
                            <button type="button" class="booking-action-btn btn-solid" data-booking-action="return-car" data-booking-id="${b.id}">Return Car</button>
                        </div>
                    </div>
                `;
            } else if (b.status === 'returned') {
                rightCardHTML = `
                    <div class="bdetail-card">
                        <h4 class="bdetail-card-title">Pending &mdash; Awaiting Staff Inspection</h4>
                        <p class="bdetail-stage-desc">
                            Vehicle has been returned at <strong>${b.returnLocName}</strong>. Please wait while AZoom staff inspects the vehicle condition in the Staff Management Portal.
                        </p>
                        <div class="bdetail-bill-box">
                            <div class="bdetail-bill-row">
                                <span>Base Rental Paid</span>
                                <strong>S$${b.totalPrice}</strong>
                            </div>
                            <div class="bdetail-bill-row">
                                <span>Inspection Status</span>
                                <strong>Pending Staff Review</strong>
                            </div>
                        </div>
                    </div>
                `;
            } else if (b.status === 'penalty_pending') {
                const damageFee = b.damageFee || 0;
                rightCardHTML = `
                    <div class="bdetail-card">
                        <h4 class="bdetail-card-title">Pending &mdash; Damage Penalty Settlement Required</h4>
                        <p class="bdetail-stage-desc">
                            AZoom staff completed the inspection at <strong>${b.returnLocName}</strong> and recorded: <strong>${b.inspectionLabel || 'Vehicle Damage'}</strong>. Please settle the penalty fee below to complete your booking.
                        </p>
                        <div class="bdetail-bill-box">
                            <div class="bdetail-bill-row">
                                <span>Base Rental (Already Paid)</span>
                                <strong>S$${b.totalPrice}</strong>
                            </div>
                            <div class="bdetail-bill-row">
                                <span>Staff Inspection Findings</span>
                                <strong>${b.inspectionLabel || 'Vehicle Damage'}</strong>
                            </div>
                            <div class="bdetail-bill-row">
                                <span>Unpaid Damage Penalty</span>
                                <strong style="color: #B91C1C;">+S$${damageFee}</strong>
                            </div>
                            <div class="bdetail-bill-row">
                                <span>Charge to Credit Card</span>
                                <strong>&bull;&bull;&bull;&bull; ${cardLast4}</strong>
                            </div>
                            <div class="bdetail-bill-divider"></div>
                            <div class="bdetail-bill-row bdetail-bill-total">
                                <span>Amount Due Now</span>
                                <strong>S$${damageFee}</strong>
                            </div>
                        </div>
                        <div class="bdetail-actions">
                            <button type="button" class="booking-action-btn btn-solid" data-booking-action="pay-penalty" data-booking-id="${b.id}">Pay Penalty (S$${damageFee})</button>
                        </div>
                    </div>
                `;
            } else {
                const damageFee = b.damageFee || 0;
                const finalTotal = b.finalTotal || b.totalPrice;
                const inspectionLabel = b.inspectionLabel || 'No Damages Found';
                rightCardHTML = `
                    <div class="bdetail-card">
                        <h4 class="bdetail-card-title">Completed &mdash; Final Bill &amp; Inspection Receipt</h4>
                        <p class="bdetail-stage-desc">
                            Vehicle returned at <strong>${b.returnLocName}</strong> and inspected by AZoom staff. All amounts have been settled via credit card.
                        </p>
                        <div class="bdetail-bill-box">
                            <div class="bdetail-bill-row">
                                <span>Staff Inspection Result</span>
                                <strong>${inspectionLabel}</strong>
                            </div>
                            <div class="bdetail-bill-row">
                                <span>Rental Cost (S$${b.dailyPrice} &times; ${b.days} ${b.days === 1 ? 'day' : 'days'})</span>
                                <strong>S$${b.totalPrice}</strong>
                            </div>
                            <div class="bdetail-bill-row">
                                <span>Damage / Penalty Fee</span>
                                <strong>S$${damageFee}</strong>
                            </div>
                            <div class="bdetail-bill-row">
                                <span>Paid by Credit Card</span>
                                <strong>&bull;&bull;&bull;&bull; ${cardLast4}</strong>
                            </div>
                            <div class="bdetail-bill-divider"></div>
                            <div class="bdetail-bill-row bdetail-bill-total">
                                <span>Total Paid</span>
                                <strong>S$${finalTotal}</strong>
                            </div>
                        </div>
                        <div class="bdetail-actions">
                            <button type="button" class="booking-action-btn btn-danger" data-booking-action="delete" data-booking-id="${b.id}">Delete</button>
                        </div>
                    </div>
                `;
            }

            bookingPanelDetails.innerHTML = `
                <div class="bdetail-topbar">
                    <button type="button" class="bdetail-back-btn" data-booking-action="back-to-list">
                        <span>&larr; Back</span>
                    </button>
                    <div class="bdetail-ref-meta">
                        <span class="booking-ref-label">Booking Ref:</span>
                        <span class="booking-ref-code">${b.ref}</span>
                        <span class="booking-status-badge ${statusClass}">${statusLabel}</span>
                    </div>
                </div>

                <div class="bdetail-grid">
                    <div class="bdetail-card">
                        <h4 class="bdetail-card-title">Vehicle &amp; Itinerary</h4>
                        <div class="bdetail-car-header">
                            <div class="bdetail-car-thumb">
                                <img src="${b.image || 'images/cars/BYD-Atto_3-2023-HD-c6d412e81c7fb2f19f29fc71c801a09828a964d3f.jpg?v=4'}" alt="${b.model}">
                            </div>
                            <div class="bdetail-car-info">
                                <h4>${b.model}</h4>
                                <p>${b.type || 'EV'} &middot; ${b.seats || '5 seats'} &middot; ${b.battery || '60.0 kWh'}</p>
                                <span class="bdetail-car-rate">S$${b.dailyPrice} / day &middot; ${b.days} ${b.days === 1 ? 'Day' : 'Days'}</span>
                            </div>
                        </div>

                        <div class="bdetail-route-list">
                            <div class="bdetail-route-item">
                                <span class="route-point-tag">Pickup Branch</span>
                                <strong class="route-point-loc">${b.pickupLocName}</strong>
                                <span class="route-point-date">${pDateFormatted}</span>
                            </div>
                            <div class="bdetail-route-item">
                                <span class="route-point-tag">Designated Return Location</span>
                                <strong class="route-point-loc">${b.returnLocName}</strong>
                                <span class="route-point-date">${rDateFormatted}</span>
                            </div>
                        </div>
                    </div>

                    ${rightCardHTML}
                </div>
            `;

            const isCompleted = b.status === 'completed';
            if (bookingTabUpcoming) {
                bookingTabUpcoming.classList.toggle('active', !isCompleted);
                bookingTabUpcoming.setAttribute('aria-selected', String(!isCompleted));
            }
            if (bookingTabPast) {
                bookingTabPast.classList.toggle('active', isCompleted);
                bookingTabPast.setAttribute('aria-selected', String(isCompleted));
            }
            if (bookingPanelUpcoming) bookingPanelUpcoming.style.display = 'none';
            if (bookingPanelPast) bookingPanelPast.style.display = 'none';
            bookingPanelDetails.style.display = 'block';
        }

        function renderPenaltyPaymentView(bookingId) {
            const b = getAllBookings().find(item => item.id === bookingId);
            if (!b || !bookingPanelDetails) return;
            const damageFee = b.damageFee || 0;
            const curUser = getCurrentUser();
            const allUsers = getUsers();
            const uDb = (curUser && allUsers.find(u => u.id === curUser.id)) || curUser;
            const savedCards = getUserSavedCards(uDb);

            let penaltyMode = savedCards.length > 0 ? 'saved' : 'new';
            let penaltySelectedCard = savedCards.length > 0 ? savedCards[0] : null;
            let isPenaltyVerified = savedCards.length > 0;
            let isPenaltyNewCardVerified = false;
            let penaltyCardLast4 = penaltySelectedCard ? penaltySelectedCard.cardLast4 : '';
            let isVerifyingNewCard = false;

            const pDateFormatted = `${formatDisplayDate(b.pickupDate)} · ${formatDisplayTime(b.pickupTime)}`;
            const rDateFormatted = `${formatDisplayDate(b.returnDate)} · ${formatDisplayTime(b.returnTime)}`;

            const savedCardsHtml = savedCards.map((c, idx) => {
                const cardId = c.id || ('card_' + c.cardLast4);
                const isSelected = penaltySelectedCard && ((penaltySelectedCard.id || ('card_' + penaltySelectedCard.cardLast4)) === cardId);
                const brandName = getBrandDisplayName(c.brand);
                const logoSrc = getBrandLogoSrc(c.brand);
                const isDefault = idx === 0;
                return `
                    <div class="gateway-saved-card-item ${isSelected ? 'is-selected' : ''}" data-penalty-card-id="${cardId}" role="radio" aria-checked="${isSelected}">
                        <div class="saved-card-radio-circle" aria-hidden="true"></div>
                        <div class="saved-card-item-logo-box">
                            <img src="${logoSrc}" alt="${brandName}" class="saved-card-item-logo">
                        </div>
                        <div class="saved-card-main-col">
                            <div class="saved-card-header-line">
                                <span class="saved-card-num-text">${brandName} &bull;&bull;&bull;&bull; ${c.cardLast4}</span>
                                ${isDefault ? '<span class="saved-card-default-badge">Default</span>' : ''}
                            </div>
                            <div class="saved-card-sub-line">${c.cardName || (curUser ? curUser.name : '') || 'Cardholder'} &middot; Exp ${c.cardExpiry || '12/28'}</div>
                        </div>
                    </div>
                `;
            }).join('');

            bookingPanelDetails.innerHTML = `
                <div class="bdetail-topbar">
                    <button type="button" class="bdetail-back-btn" data-penalty-action="back-to-details">
                        <span>&larr; Back to Details</span>
                    </button>
                    <div class="bdetail-ref-meta">
                        <span class="booking-ref-label">Booking Ref:</span>
                        <span class="booking-ref-code">${b.ref}</span>
                        <span class="booking-status-badge status-penalty">Payment Due</span>
                    </div>
                </div>

                <div class="reserve-payment-split penalty-payment-split">
                    <div class="reserve-card payment-bill-card">
                        <div class="reserve-card-topbar">
                            <span class="reserve-card-tag">PENALTY BILLING SUMMARY</span>
                        </div>
                        <div class="payment-bill-body">
                            <div class="payment-bill-hero">
                                <span class="payment-bill-hero-label">Amount Due Now</span>
                                <strong class="payment-bill-hero-amount" id="penalty-hero-amount">S${damageFee}</strong>
                            </div>

                            <div class="payment-bill-list">
                                <div class="payment-bill-row">
                                    <div class="payment-bill-item-main">
                                        <strong>${b.model}</strong>
                                        <span>${pDateFormatted} &rarr; ${rDateFormatted}</span>
                                    </div>
                                </div>

                                <div class="payment-bill-divider"></div>

                                <div class="payment-bill-row">
                                    <span>Base Rental (${b.days} ${b.days === 1 ? 'day' : 'days'})</span>
                                    <span class="cost-free-tag" style="background:#ECFDF5; color:#065F46;">Paid S${b.totalPrice}</span>
                                </div>
                                <div class="payment-bill-row">
                                    <span>Inspection Finding</span>
                                    <strong>${b.inspectionLabel || 'Vehicle Damage'}</strong>
                                </div>
                                <div class="payment-bill-row">
                                    <span>Damage Penalty Fee</span>
                                    <strong style="color: #B91C1C;">+S${damageFee}</strong>
                                </div>

                                <div class="payment-bill-divider"></div>

                                <div class="payment-bill-row payment-bill-total-row">
                                    <span>Total Due Now</span>
                                    <strong id="penalty-bill-total-bottom">S${damageFee}</strong>
                                </div>
                            </div>

                            <div class="payment-bill-actions">
                                <button type="button" class="payment-back-btn" data-penalty-action="back-to-details">
                                    <span>Back</span>
                                </button>
                                <button type="button" id="penalty-make-payment-btn" class="reserve-confirm-btn bill-pay-btn ${isPenaltyVerified ? '' : 'is-unverified'}">
                                    <span class="bill-pay-dots" aria-hidden="true"><span></span><span></span><span></span></span>
                                    <span id="penalty-make-payment-text">Pay S${damageFee}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="reserve-payment-method-shell">
                        <div class="gateway-mode-tabs" role="tablist" aria-label="Payment Mode Selection">
                            <button type="button" class="gateway-mode-tab ${penaltyMode === 'saved' ? 'is-active' : ''}" id="penalty-tab-saved" role="tab" aria-selected="${penaltyMode === 'saved'}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15" aria-hidden="true">
                                    <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                                    <line x1="2" y1="10" x2="22" y2="10"></line>
                                </svg>
                                <span>Saved Cards</span>
                            </button>
                            <button type="button" class="gateway-mode-tab ${penaltyMode === 'new' ? 'is-active' : ''}" id="penalty-tab-new" role="tab" aria-selected="${penaltyMode === 'new'}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15" aria-hidden="true">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                <span>New Card</span>
                            </button>
                        </div>

                        <div class="gateway-saved-shell" id="penalty-saved-shell" style="display: ${penaltyMode === 'saved' ? 'block' : 'none'};">
                            <div class="gateway-saved-topbar">
                                <div class="gateway-saved-header-left">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true">
                                        <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                                        <line x1="2" y1="10" x2="22" y2="10"></line>
                                    </svg>
                                    <span>Saved Cards</span>
                                </div>
                                <span class="gateway-saved-count-pill" id="penalty-saved-count-pill">${savedCards.length} ${savedCards.length === 1 ? 'card' : 'cards'}</span>
                            </div>

                            <div class="gateway-saved-body">
                                <div class="gateway-saved-cards-list" id="penalty-saved-cards-list" style="display: ${savedCards.length > 0 ? 'flex' : 'none'};">
                                    ${savedCardsHtml}
                                </div>

                                <div class="gateway-saved-empty" id="penalty-saved-empty" style="display: ${savedCards.length === 0 ? 'flex' : 'none'};">
                                    <div class="gateway-saved-empty-icon" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="28" height="28">
                                            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                                            <line x1="2" y1="10" x2="22" y2="10"></line>
                                        </svg>
                                    </div>
                                    <div class="gateway-saved-empty-title">No Saved Cards</div>
                                    <p class="gateway-saved-empty-desc">You don't have any saved cards in your account yet. Switch to New Card to enter your payment details.</p>
                                    <button type="button" class="gateway-switch-new-btn" id="penalty-switch-new-btn">
                                        <span>Enter a New Card</span>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="14" height="14" aria-hidden="true">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="gateway-module-shell" id="penalty-module-shell" style="display: ${penaltyMode === 'new' ? 'block' : 'none'};">
                            <div class="gateway-module-topbar">
                                <div class="gateway-lock-title">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15" aria-hidden="true">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                    <span>Card Verification</span>
                                </div>
                                <div class="gateway-card-brands" id="penalty-card-brands" aria-label="Accepted Cards: Visa, Mastercard, American Express, Discover, JCB">
                                    <span class="gateway-brand-logo-box" data-card-brand="visa"><img src="images/logos/visa.svg" alt="Visa" class="gateway-brand-logo"></span>
                                    <span class="gateway-brand-logo-box" data-card-brand="mastercard"><img src="images/logos/mastercard.svg" alt="Mastercard" class="gateway-brand-logo"></span>
                                    <span class="gateway-brand-logo-box" data-card-brand="amex"><img src="images/logos/americanexpress.svg" alt="American Express" class="gateway-brand-logo"></span>
                                    <span class="gateway-brand-logo-box" data-card-brand="discover"><img src="images/logos/discover.svg" alt="Discover" class="gateway-brand-logo"></span>
                                    <span class="gateway-brand-logo-box" data-card-brand="jcb"><img src="images/logos/jcb.svg" alt="JCB" class="gateway-brand-logo"></span>
                                </div>
                            </div>

                            <div class="gateway-module-body">
                                <form id="penalty-payment-form" class="reserve-payment-form" onsubmit="return false;" novalidate>
                                    <div class="payment-field" id="field-penalty-card-name">
                                        <label for="penalty-card-name" class="gateway-field-label">Cardholder Name</label>
                                        <input type="text" id="penalty-card-name" class="payment-input gateway-input" placeholder="Name on card" autocomplete="cc-name" required>
                                        <span class="reserve-field-error" id="penalty-name-error"></span>
                                    </div>

                                    <div class="payment-field" id="field-penalty-card-number">
                                        <label for="penalty-card-number" class="gateway-field-label">Card Number</label>
                                        <div class="payment-card-input-wrap">
                                            <input type="text" id="penalty-card-number" class="payment-input gateway-input" placeholder="0000 0000 0000 0000" inputmode="numeric" maxlength="19" autocomplete="cc-number" required>
                                            <img src="images/credit-card.svg" alt="" class="payment-input-card-icon">
                                        </div>
                                        <span class="reserve-field-error" id="penalty-number-error"></span>
                                    </div>

                                    <div class="payment-row-grid">
                                        <div class="payment-field" id="field-penalty-card-expiry">
                                            <label for="penalty-card-expiry" class="gateway-field-label">Expiry Date</label>
                                            <input type="text" id="penalty-card-expiry" class="payment-input gateway-input" placeholder="MM/YY" inputmode="numeric" maxlength="5" autocomplete="cc-exp" required>
                                            <span class="reserve-field-error" id="penalty-expiry-error"></span>
                                        </div>

                                        <div class="payment-field" id="field-penalty-card-cvv">
                                            <label for="penalty-card-cvv" class="gateway-field-label">CVV / CVC</label>
                                            <input type="password" id="penalty-card-cvv" class="payment-input gateway-input" placeholder="3 digits" inputmode="numeric" maxlength="4" autocomplete="cc-csc" required>
                                            <span class="reserve-field-error" id="penalty-cvv-error"></span>
                                        </div>
                                    </div>

                                    <div class="gateway-save-check-wrap">
                                        <label class="gateway-save-checkbox-label" for="penalty-save-card-check">
                                            <input type="checkbox" id="penalty-save-card-check" class="gateway-save-checkbox" checked>
                                            <span>Save this card for next bookings</span>
                                        </label
                                    </div>

                                    <div class="gateway-verify-actions">
                                        <button type="submit" id="penalty-verify-btn" class="gateway-pay-btn">
                                            <span class="gateway-btn-spinner" aria-hidden="true"></span>
                                            <svg class="gateway-btn-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                                <polyline class="gateway-check-path" points="4 12 9 17 20 6"></polyline>
                                            </svg>
                                            <span id="penalty-verify-text">Verify</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const penaltyPayBtn = document.getElementById('penalty-make-payment-btn');
            const penaltyTabSaved = document.getElementById('penalty-tab-saved');
            const penaltyTabNew = document.getElementById('penalty-tab-new');
            const penaltySavedShell = document.getElementById('penalty-saved-shell');
            const penaltyModuleShell = document.getElementById('penalty-module-shell');
            const penaltySwitchNewBtn = document.getElementById('penalty-switch-new-btn');
            const penaltyForm = document.getElementById('penalty-payment-form');
            const penaltyNameInp = document.getElementById('penalty-card-name');
            const penaltyNumInp = document.getElementById('penalty-card-number');
            const penaltyExpInp = document.getElementById('penalty-card-expiry');
            const penaltyCvvInp = document.getElementById('penalty-card-cvv');
            const penaltySaveCheck = document.getElementById('penalty-save-card-check');
            const penaltyVerifyBtn = document.getElementById('penalty-verify-btn');
            const penaltyCardBrands = document.getElementById('penalty-card-brands');

            function setPenaltyMode(mode) {
                penaltyMode = mode;
                if (penaltyTabSaved && penaltyTabNew) {
                    penaltyTabSaved.classList.toggle('is-active', mode === 'saved');
                    penaltyTabSaved.setAttribute('aria-selected', String(mode === 'saved'));
                    penaltyTabNew.classList.toggle('is-active', mode === 'new');
                    penaltyTabNew.setAttribute('aria-selected', String(mode === 'new'));
                }
                if (penaltySavedShell && penaltyModuleShell) {
                    penaltySavedShell.style.display = mode === 'saved' ? 'block' : 'none';
                    penaltyModuleShell.style.display = mode === 'new' ? 'block' : 'none';
                }
                if (mode === 'saved') {
                    if (penaltySelectedCard) {
                        isPenaltyVerified = true;
                        if (penaltyPayBtn) penaltyPayBtn.classList.remove('is-unverified');
                    } else {
                        isPenaltyVerified = false;
                        if (penaltyPayBtn) penaltyPayBtn.classList.add('is-unverified');
                    }
                } else {
                    if (isPenaltyNewCardVerified) {
                        isPenaltyVerified = true;
                        if (penaltyPayBtn) penaltyPayBtn.classList.remove('is-unverified');
                    } else {
                        isPenaltyVerified = false;
                        if (penaltyPayBtn) penaltyPayBtn.classList.add('is-unverified');
                    }
                }
            }

            if (penaltyTabSaved) penaltyTabSaved.addEventListener('click', () => setPenaltyMode('saved'));
            if (penaltyTabNew) penaltyTabNew.addEventListener('click', () => setPenaltyMode('new'));
            if (penaltySwitchNewBtn) penaltySwitchNewBtn.addEventListener('click', () => setPenaltyMode('new'));

            const savedCardListEl = document.getElementById('penalty-saved-cards-list');
            if (savedCardListEl) {
                savedCardListEl.addEventListener('click', (e) => {
                    const item = e.target.closest('[data-penalty-card-id]');
                    if (!item) return;
                    const cardId = item.dataset.penaltyCardId;
                    penaltySelectedCard = savedCards.find(c => (c.id || ('card_' + c.cardLast4)) === cardId) || savedCards[0];
                    savedCardListEl.querySelectorAll('.gateway-saved-card-item').forEach(el => {
                        const match = el.dataset.penaltyCardId === cardId;
                        el.classList.toggle('is-selected', match);
                        el.setAttribute('aria-checked', String(match));
                    });
                    isPenaltyVerified = true;
                    penaltyCardLast4 = penaltySelectedCard.cardLast4;
                    if (penaltyPayBtn) penaltyPayBtn.classList.remove('is-unverified');
                });
            }

            function updatePenaltyBrands(brand) {
                if (!penaltyCardBrands) return;
                const boxes = penaltyCardBrands.querySelectorAll('.gateway-brand-logo-box');
                boxes.forEach(box => {
                    if (!brand) {
                        box.classList.remove('is-dimmed', 'is-matched');
                    } else if (box.dataset.cardBrand === brand.toLowerCase()) {
                        box.classList.remove('is-dimmed');
                        box.classList.add('is-matched');
                    } else {
                        box.classList.remove('is-matched');
                        box.classList.add('is-dimmed');
                    }
                });
            }

            if (penaltyNumInp) {
                penaltyNumInp.addEventListener('input', (e) => {
                    let val = e.target.value.replace(/\D/g, '').slice(0, 19);
                    const brand = detectCardBrand(val);
                    e.target.value = formatCardNumber(val, brand);
                    updatePenaltyBrands(brand);
                    isPenaltyNewCardVerified = false;
                    if (penaltyMode === 'new') {
                        isPenaltyVerified = false;
                        if (penaltyPayBtn) penaltyPayBtn.classList.add('is-unverified');
                        if (penaltyVerifyBtn) penaltyVerifyBtn.classList.remove('is-verified');
                    }
                });
            }

            if (penaltyExpInp) {
                penaltyExpInp.addEventListener('input', (e) => {
                    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    if (val.length >= 3) {
                        val = val.slice(0, 2) + '/' + val.slice(2);
                    }
                    e.target.value = val;
                    isPenaltyNewCardVerified = false;
                    if (penaltyMode === 'new') {
                        isPenaltyVerified = false;
                        if (penaltyPayBtn) penaltyPayBtn.classList.add('is-unverified');
                        if (penaltyVerifyBtn) penaltyVerifyBtn.classList.remove('is-verified');
                    }
                });
            }

            if (penaltyCvvInp) {
                penaltyCvvInp.addEventListener('input', (e) => {
                    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    isPenaltyNewCardVerified = false;
                    if (penaltyMode === 'new') {
                        isPenaltyVerified = false;
                        if (penaltyPayBtn) penaltyPayBtn.classList.add('is-unverified');
                        if (penaltyVerifyBtn) penaltyVerifyBtn.classList.remove('is-verified');
                    }
                });
            }

            if (penaltyForm) {
                penaltyForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    if (isVerifyingNewCard) return;

                    const nameVal = (penaltyNameInp ? penaltyNameInp.value : '').trim();
                    const rawDigits = (penaltyNumInp ? penaltyNumInp.value : '').replace(/\D/g, '');
                    const expVal = (penaltyExpInp ? penaltyExpInp.value : '').trim();
                    const cvvVal = (penaltyCvvInp ? penaltyCvvInp.value : '').replace(/\D/g, '');

                    ['penalty-name-error', 'penalty-number-error', 'penalty-expiry-error', 'penalty-cvv-error'].forEach(id => {
                        const err = document.getElementById(id);
                        if (err) err.textContent = '';
                    });
                    ['field-penalty-card-name', 'field-penalty-card-number', 'field-penalty-card-expiry', 'field-penalty-card-cvv'].forEach(id => {
                        const f = document.getElementById(id);
                        if (f) f.classList.remove('has-error');
                    });

                    let isValid = true;
                    if (!nameVal) {
                        const err = document.getElementById('penalty-name-error');
                        const f = document.getElementById('field-penalty-card-name');
                        if (err) err.textContent = 'Please enter cardholder name.';
                        if (f) f.classList.add('has-error');
                        isValid = false;
                    }

                    const detectedBrand = detectCardBrand(rawDigits);
                    const reqDigits = (detectedBrand === 'amex') ? 15 : 16;
                    if (rawDigits.length < reqDigits) {
                        const err = document.getElementById('penalty-number-error');
                        const f = document.getElementById('field-penalty-card-number');
                        if (err) err.textContent = `Please enter a valid ${reqDigits}-digit card number.`;
                        if (f) f.classList.add('has-error');
                        isValid = false;
                    }

                    if (!/^\d{2}\/\d{2}$/.test(expVal)) {
                        const err = document.getElementById('penalty-expiry-error');
                        const f = document.getElementById('field-penalty-card-expiry');
                        if (err) err.textContent = 'Enter valid MM/YY.';
                        if (f) f.classList.add('has-error');
                        isValid = false;
                    } else {
                        const [mm] = expVal.split('/').map(Number);
                        if (mm < 1 || mm > 12) {
                            const err = document.getElementById('penalty-expiry-error');
                            const f = document.getElementById('field-penalty-card-expiry');
                            if (err) err.textContent = 'Month must be 01-12.';
                            if (f) f.classList.add('has-error');
                            isValid = false;
                        }
                    }

                    const reqCvv = (detectedBrand === 'amex') ? 4 : 3;
                    if (cvvVal.length < reqCvv) {
                        const err = document.getElementById('penalty-cvv-error');
                        const f = document.getElementById('field-penalty-card-cvv');
                        if (err) err.textContent = `Enter ${reqCvv} digits.`;
                        if (f) f.classList.add('has-error');
                        isValid = false;
                    }

                    if (!isValid) return;

                    isVerifyingNewCard = true;
                    penaltyVerifyBtn.classList.add('is-verifying');
                    penaltyVerifyBtn.disabled = true;

                    setTimeout(() => {
                        isVerifyingNewCard = false;
                        penaltyVerifyBtn.classList.remove('is-verifying');
                        penaltyVerifyBtn.classList.add('is-verified');
                        penaltyVerifyBtn.disabled = false;
                        isPenaltyNewCardVerified = true;
                        isPenaltyVerified = true;
                        penaltyCardLast4 = rawDigits.slice(-4);
                        if (penaltyPayBtn) penaltyPayBtn.classList.remove('is-unverified');
                    }, 700);
                });
            }

            if (penaltyPayBtn) {
                penaltyPayBtn.addEventListener('click', () => {
                    if (!isPenaltyVerified) {
                        showTopToast('Please select or verify your credit card first.', 'warning');
                        return;
                    }

                    if (penaltyMode === 'new' && penaltySaveCheck && penaltySaveCheck.checked && curUser) {
                        try {
                            const holderName = (penaltyNameInp ? penaltyNameInp.value : '').trim();
                            const rawDigits = (penaltyNumInp ? penaltyNumInp.value : '').replace(/\D/g, '');
                            const expVal = (penaltyExpInp ? penaltyExpInp.value : '').trim();
                            const detectedBrand = detectCardBrand(rawDigits);
                            const last4 = rawDigits.slice(-4);

                            const allUsersList = getUsers();
                            const uInDb = allUsersList.find(u => u.id === curUser.id) || curUser;
                            const existingCards = getUserSavedCards(uInDb);
                            const existIdx = existingCards.findIndex(c => c.cardLast4 === last4 && (c.brand || '').toLowerCase() === (detectedBrand || '').toLowerCase());
                            let targetSavedCard = null;
                            if (existIdx >= 0) {
                                const [existing] = existingCards.splice(existIdx, 1);
                                existingCards.unshift(existing);
                                targetSavedCard = existing;
                            } else if (rawDigits.length >= 15) {
                                const newCardData = {
                                    id: 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                                    cardName: holderName || curUser.name || 'Cardholder',
                                    cardLast4: last4,
                                    cardNumberFormatted: formatCardNumber(rawDigits, detectedBrand),
                                    cardExpiry: expVal,
                                    brand: (detectedBrand || 'visa').toUpperCase(),
                                    createdAt: Date.now()
                                };
                                existingCards.unshift(newCardData);
                                targetSavedCard = newCardData;
                            }
                            if (targetSavedCard) {
                                uInDb.savedCards = existingCards;
                                uInDb.savedCard = targetSavedCard;
                                saveUsers(allUsersList);
                                curUser.savedCards = existingCards;
                                curUser.savedCard = targetSavedCard;
                                setCurrentUser(curUser);
                                if (typeof renderSavedCardUI === 'function') renderSavedCardUI();
                                if (typeof renderPaymentSavedCardsUI === 'function') renderPaymentSavedCardsUI();
                            }
                        } catch (e) {}
                    }

                    penaltyPayBtn.classList.add('is-paying');
                    penaltyPayBtn.disabled = true;

                    setTimeout(() => {
                        const allB = getAllBookings();
                        const targetB = allB.find(item => item.id === bookingId);
                        if (targetB) {
                            targetB.damageFeePaid = true;
                            targetB.status = 'completed';
                            targetB.finalTotal = targetB.totalPrice + damageFee;
                            if (penaltyCardLast4) targetB.cardLast4 = penaltyCardLast4;
                            saveAllBookings(allB);
                        }
                        renderUserBookings();
                        lastActiveBookingTab = 'past';
                        renderBookingDetailsView(bookingId);
                        showTopToast(`Penalty fee (S${damageFee}) paid! Booking completed.`, 'success');
                    }, 700);
                });
            }

            bookingPanelDetails.querySelectorAll('[data-penalty-action="back-to-details"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    renderBookingDetailsView(bookingId);
                });
            });
        }

        function renderUserBookings() {
            const userBookings = getBookingsForCurrentUser();
            const upcomingList = userBookings.filter(b => b.status !== 'completed');
            const pastList = userBookings.filter(b => b.status === 'completed');

            if (bookingPanelUpcoming) {
                if (upcomingList.length === 0) {
                    bookingPanelUpcoming.innerHTML = `
                        <div class="booking-empty-state">
                            <img src="images/car.svg" alt="" class="booking-empty-icon">
                            <h4 class="booking-empty-title">No bookings in progress</h4>
                            <p class="booking-empty-desc">You don't have any active reservations under this account yet.</p>
                        </div>
                    `;
                } else {
                    bookingPanelUpcoming.innerHTML = upcomingList.map(buildBookingCardHTML).join('');
                }
            }

            if (bookingPanelPast) {
                if (pastList.length === 0) {
                    bookingPanelPast.innerHTML = `
                        <div class="booking-empty-state">
                            <img src="images/car.svg" alt="" class="booking-empty-icon">
                            <h4 class="booking-empty-title">No completed bookings</h4>
                            <p class="booking-empty-desc">Your completed rental history will appear here.</p>
                        </div>
                    `;
                } else {
                    bookingPanelPast.innerHTML = pastList.map(buildBookingCardHTML).join('');
                }
            }
        }

        if (bookingModal) {
            bookingModal.addEventListener('click', (e) => {
                const actionBtn = e.target.closest('[data-booking-action]');
                if (!actionBtn) return;
                const action = actionBtn.dataset.bookingAction;
                const bookingId = actionBtn.dataset.bookingId;

                if (action === 'back-to-list') {
                    switchBookingTab(lastActiveBookingTab);
                    return;
                }

                if (!bookingId) return;

                if (action === 'view-details') {
                    renderBookingDetailsView(bookingId);
                } else if (action === 'cancel') {
                    const updated = getAllBookings().filter(b => b.id !== bookingId);
                    saveAllBookings(updated);
                    renderUserBookings();
                    switchBookingTab('upcoming');
                    showTopToast('Booking has been cancelled.', 'success');
                } else if (action === 'pickup') {
                    const all = getAllBookings();
                    const target = all.find(b => b.id === bookingId);
                    if (target) {
                        target.status = 'rented';
                        saveAllBookings(all);
                        renderUserBookings();
                        renderBookingDetailsView(bookingId);
                        showTopToast(`Vehicle picked up at ${target.pickupLocName}! Status updated to Picked Up.`, 'success');
                    }
                } else if (action === 'return-car') {
                    const all = getAllBookings();
                    const target = all.find(b => b.id === bookingId);
                    if (target) {
                        target.status = 'returned';
                        saveAllBookings(all);
                        renderUserBookings();
                        renderBookingDetailsView(bookingId);
                        showTopToast(`Vehicle returned at ${target.returnLocName}! Sent to AZoom Staff for inspection.`, 'success');
                    }
                } else if (action === 'pay-penalty') {
                    renderPenaltyPaymentView(bookingId);
                } else if (action === 'delete' || action === 'delete-booking') {
                    const updated = getAllBookings().filter(b => b.id !== bookingId);
                    saveAllBookings(updated);
                    renderUserBookings();
                    switchBookingTab('past');
                    showTopToast('Booking record deleted.', 'success');
                } else if (action === 'rent-again') {
                    closeBookingModal();
                    window.location.hash = 'search';
                }
            });
        }

        function switchBookingTab(tab) {
            lastActiveBookingTab = tab === 'past' ? 'past' : 'upcoming';
            if (bookingModalWorkspace) bookingModalWorkspace.classList.remove('is-details-mode');
            if (bookingPanelDetails) bookingPanelDetails.style.display = 'none';

            if (tab === 'past') {
                if (bookingTabPast) {
                    bookingTabPast.classList.add('active');
                    bookingTabPast.setAttribute('aria-selected', 'true');
                }
                if (bookingTabUpcoming) {
                    bookingTabUpcoming.classList.remove('active');
                    bookingTabUpcoming.setAttribute('aria-selected', 'false');
                }
                if (bookingPanelPast) bookingPanelPast.style.display = 'block';
                if (bookingPanelUpcoming) bookingPanelUpcoming.style.display = 'none';
            } else {
                if (bookingTabUpcoming) {
                    bookingTabUpcoming.classList.add('active');
                    bookingTabUpcoming.setAttribute('aria-selected', 'true');
                }
                if (bookingTabPast) {
                    bookingTabPast.classList.remove('active');
                    bookingTabPast.setAttribute('aria-selected', 'false');
                }
                if (bookingPanelUpcoming) bookingPanelUpcoming.style.display = 'block';
                if (bookingPanelPast) bookingPanelPast.style.display = 'none';
            }
        }

        function openBookingModal() {
            if (!bookingModal) return;
            renderUserBookings();
            switchBookingTab('upcoming');
            bookingModal.classList.add('active');
            bookingModal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
        }

        function closeBookingModal() {
            if (!bookingModal) return;
            bookingModal.classList.remove('active');
            bookingModal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
        }

        function handleViewBookingClick(e) {
            if (e) e.preventDefault();
            const user = getCurrentUser();
            if (!user) {
                openModal('login');
                showTopToast('Please log in first to view or edit your booking.', 'warning');
            } else {
                openBookingModal();
            }
        }

        window.addEventListener('storage', (e) => {
            if (e.key === STORAGE_BOOKINGS) {
                renderUserBookings();
                if (activeDetailBookingId && bookingPanelDetails && bookingPanelDetails.style.display === 'block') {
                    renderBookingDetailsView(activeDetailBookingId);
                }
            }
        });

        if (viewBookingBtn) viewBookingBtn.addEventListener('click', handleViewBookingClick);
        if (searchViewBookingBtn) searchViewBookingBtn.addEventListener('click', handleViewBookingClick);
        if (bookingTabUpcoming) bookingTabUpcoming.addEventListener('click', () => switchBookingTab('upcoming'));
        if (bookingTabPast) bookingTabPast.addEventListener('click', () => switchBookingTab('past'));
        if (bookingModalClose) bookingModalClose.addEventListener('click', closeBookingModal);
        if (bookingModal) {
            bookingModal.addEventListener('click', (e) => {
                if (e.target === bookingModal) closeBookingModal();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (authModal && authModal.classList.contains('active')) closeModal();
                if (bookingModal && bookingModal.classList.contains('active')) closeBookingModal();
            }
        });

        const dropdownManageAccountBtn = document.getElementById('dropdown-manage-account-btn');
        const dropdownManageBookingsBtn = document.getElementById('dropdown-manage-bookings-btn');

        const accountModal = document.getElementById('account-modal');
        const accountModalClose = document.getElementById('account-modal-close');

        const accountNavButtons = {
            personal: document.getElementById('account-nav-personal'),
            security: document.getElementById('account-nav-security'),
            payment: document.getElementById('account-nav-payment'),
            delete: document.getElementById('account-nav-delete')
        };

        const accountPanels = {
            personal: document.getElementById('account-panel-personal'),
            security: document.getElementById('account-panel-security'),
            payment: document.getElementById('account-panel-payment'),
            delete: document.getElementById('account-panel-delete')
        };

        const accPersonalForm = document.getElementById('acc-personal-form');
        const accFirstNameInput = document.getElementById('acc-firstname');
        const accLastNameInput = document.getElementById('acc-lastname');
        const accEmailInput = document.getElementById('acc-email');
        const accPersonalFeedback = document.getElementById('acc-personal-feedback');

        const accSecurityForm = document.getElementById('acc-security-form');
        const accCurrPasswordInput = document.getElementById('acc-curr-password');
        const accNewPasswordInput = document.getElementById('acc-new-password');
        const accConfirmPasswordInput = document.getElementById('acc-confirm-password');
        const accSecurityFeedback = document.getElementById('acc-security-feedback');

        const accCardEmptyView = document.getElementById('acc-card-empty-view');
        const accAddCardOpenBtn = document.getElementById('acc-add-card-open-btn');
        const accCardDisplayBox = document.getElementById('acc-card-display-box');

        const accAddCardView = document.getElementById('acc-add-card-view');
        const accCancelAddCardBtn = document.getElementById('acc-cancel-add-card-btn');
        const accGatewayModuleShell = document.getElementById('acc-gateway-module-shell');
        const accPaymentForm = document.getElementById('acc-payment-form');
        const accCardNameInput = document.getElementById('acc-card-name');
        const accCardNumberInput = document.getElementById('acc-card-number');
        const accCardBrandIcon = document.getElementById('acc-card-brand-icon');
        const accCardExpiryInput = document.getElementById('acc-card-expiry');
        const accCardCvvInput = document.getElementById('acc-card-cvv');
        const accVerifyCardBtn = document.getElementById('acc-verify-card-btn');
        const accVerifyCardText = document.getElementById('acc-verify-card-text');

        const accDeleteForm = document.getElementById('acc-delete-form');
        const accDeleteConfirmInput = document.getElementById('acc-delete-confirm-input');
        const accDeleteFeedback = document.getElementById('acc-delete-feedback');

        let activeAccountTab = 'personal';
        let accVerifyTimer = null;

        function clearAccountErrors() {
            document.querySelectorAll('.account-field').forEach(f => f.classList.remove('has-error'));
            document.querySelectorAll('.account-input').forEach(i => i.classList.remove('input-error'));
            document.querySelectorAll('.payment-field').forEach(f => f.classList.remove('has-error'));
            document.querySelectorAll('.reserve-field-error').forEach(e => {
                e.textContent = '';
                e.style.display = 'none';
            });
            if (accPersonalFeedback) {
                accPersonalFeedback.style.display = 'none';
                accPersonalFeedback.className = 'account-feedback';
                accPersonalFeedback.textContent = '';
            }
            if (accSecurityFeedback) {
                accSecurityFeedback.style.display = 'none';
                accSecurityFeedback.className = 'account-feedback';
                accSecurityFeedback.textContent = '';
            }
            if (accDeleteFeedback) {
                accDeleteFeedback.style.display = 'none';
                accDeleteFeedback.className = 'account-feedback';
                accDeleteFeedback.textContent = '';
            }
        }

        function setAccError(fieldId, errorId, message) {
            const field = document.getElementById(fieldId);
            const errSpan = document.getElementById(errorId);
            if (field) {
                field.classList.add('has-error');
                const input = field.querySelector('.account-input') || field.querySelector('.gateway-input');
                if (input) input.classList.add('input-error');
            }
            if (errSpan) {
                errSpan.textContent = message;
                errSpan.style.display = 'block';
            }
        }

        function setAccFeedback(el, message, type = 'success') {
            if (!el) return;
            el.className = 'account-feedback ' + type;
            el.textContent = message;
            el.style.display = 'block';
        }

        function formatCardNumber(rawDigits, brand) {
            if (brand === 'amex') {
                const d = rawDigits.slice(0, 15);
                const p1 = d.slice(0, 4);
                const p2 = d.slice(4, 10);
                const p3 = d.slice(10, 15);
                return [p1, p2, p3].filter(Boolean).join(' ');
            }
            const d = rawDigits.slice(0, 16);
            const groups = d.match(/.{1,4}/g);
            return groups ? groups.join(' ') : d;
        }

        function updateAccCardBrandLogos(brand) {
            const boxes = document.querySelectorAll('#acc-gateway-card-brands .gateway-brand-logo-box');
            boxes.forEach(box => {
                box.classList.remove('is-dimmed', 'is-matched');
                if (brand) {
                    if (box.dataset.cardBrand === brand) {
                        box.classList.add('is-matched');
                    } else {
                        box.classList.add('is-dimmed');
                    }
                }
            });

            if (accCardCvvInput) {
                if (brand === 'amex') {
                    accCardCvvInput.placeholder = '4 digits';
                    accCardCvvInput.maxLength = 4;
                } else {
                    accCardCvvInput.placeholder = '3 digits';
                    accCardCvvInput.maxLength = 3;
                }
            }
        }

        function resetAddCardForm() {
            if (accVerifyTimer) {
                clearTimeout(accVerifyTimer);
                accVerifyTimer = null;
            }
            if (accPaymentForm) accPaymentForm.reset();
            if (accGatewayModuleShell) accGatewayModuleShell.classList.remove('is-verified');
            if (accVerifyCardBtn) {
                accVerifyCardBtn.classList.remove('is-verifying', 'is-verified');
                accVerifyCardBtn.disabled = false;
            }
            if (accVerifyCardText) accVerifyCardText.textContent = 'Verify';
            if (accCardBrandIcon) accCardBrandIcon.src = 'images/credit-card.svg';
            updateAccCardBrandLogos(null);
            clearAccountErrors();
        }

        function getBrandDisplayName(brand) {
            const b = (brand || '').toLowerCase();
            if (b === 'visa') return 'Visa';
            if (b === 'mastercard') return 'Mastercard';
            if (b === 'amex') return 'American Express';
            if (b === 'discover') return 'Discover';
            if (b === 'jcb') return 'JCB';
            return 'Card';
        }

        function getBrandLogoSrc(brand) {
            const b = (brand || '').toLowerCase();
            if (b === 'visa') return 'images/logos/visa.svg';
            if (b === 'mastercard') return 'images/logos/mastercard.svg';
            if (b === 'amex') return 'images/logos/americanexpress.svg';
            if (b === 'discover') return 'images/logos/discover.svg';
            if (b === 'jcb') return 'images/logos/jcb.svg';
            return 'images/credit-card.svg';
        }

        function getUserSavedCards(user) {
            if (!user) return [];
            let list = [];
            if (Array.isArray(user.savedCards)) {
                list = [...user.savedCards];
            } else if (user.savedCard && user.savedCard.cardLast4) {
                list = [user.savedCard];
            }
            let modified = false;
            list = list.map((c, idx) => {
                if (!c.id) {
                    c.id = 'card_' + (c.cardLast4 || idx) + '_' + Math.random().toString(36).substr(2, 6);
                    modified = true;
                }
                return c;
            });
            if (modified) {
                user.savedCards = list;
            }
            return list;
        }

        function renderSavedCardUI() {
            const user = getCurrentUser();
            if (!user) return;
            const users = getUsers();
            const userInDb = users.find(u => u.id === user.id) || user;

            if (accAddCardView) accAddCardView.style.display = 'none';

            const cards = getUserSavedCards(userInDb);
            const cardsListEl = document.getElementById('acc-saved-cards-list');

            if (cards.length > 0) {
                if (cardsListEl) {
                    cardsListEl.innerHTML = cards.map((c, idx) => {
                        const brandName = getBrandDisplayName(c.brand);
                        const logoSrc = getBrandLogoSrc(c.brand);
                        const cardId = c.id || ('card_' + c.cardLast4);
                        const isDefault = idx === 0;
                        return '<div class="saved-card-bar" data-card-id="' + cardId + '">' +
                            '<div class="saved-card-info-group">' +
                                '<div class="saved-card-logo-wrap">' +
                                    '<img src="' + logoSrc + '" alt="' + brandName + '" class="saved-card-brand-img">' +
                                '</div>' +
                                '<div class="saved-card-main-col">' +
                                    '<div class="saved-card-header-line">' +
                                        '<span class="saved-card-num-text">' + brandName + ' &bull;&bull;&bull;&bull; ' + c.cardLast4 + '</span>' +
                                        (isDefault ? '<span class="saved-card-default-badge">DEFAULT</span>' : '') +
                                    '</div>' +
                                    '<div class="saved-card-sub-line">' + (c.cardName || userInDb.name || 'Cardholder') + ' &middot; Exp ' + (c.cardExpiry || '10/30') + '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div class="saved-card-actions-col">' +
                                (!isDefault ? '<button type="button" class="account-card-default-btn" data-action="set-default" data-card-id="' + cardId + '">Set as Default</button>' : '') +
                                '<button type="button" class="account-card-del-btn" data-action="delete-card" data-card-id="' + cardId + '" aria-label="Delete card" title="Delete card">' +
                                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                                        '<polyline points="3 6 5 6 21 6"></polyline>' +
                                        '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>' +
                                        '<line x1="10" y1="11" x2="10" y2="17"></line>' +
                                        '<line x1="14" y1="11" x2="14" y2="17"></line>' +
                                    '</svg>' +
                                '</button>' +
                            '</div>' +
                        '</div>';
                    }).join('');
                }

                if (accCardDisplayBox) accCardDisplayBox.style.display = 'block';
                if (accCardEmptyView) accCardEmptyView.style.display = 'none';
            } else {
                if (cardsListEl) cardsListEl.innerHTML = '';
                if (accCardDisplayBox) accCardDisplayBox.style.display = 'none';
                if (accCardEmptyView) accCardEmptyView.style.display = 'block';
            }
        }

        function showAddCardGateway() {
            resetAddCardForm();
            if (accCardEmptyView) accCardEmptyView.style.display = 'none';
            if (accCardDisplayBox) accCardDisplayBox.style.display = 'none';
            if (accAddCardView) accAddCardView.style.display = 'block';
            if (accCardNameInput) {
                setTimeout(() => accCardNameInput.focus(), 60);
            }
        }

        function switchAccountTab(tabKey) {
            clearAccountErrors();
            activeAccountTab = tabKey;

            Object.keys(accountNavButtons).forEach(key => {
                const btn = accountNavButtons[key];
                if (!btn) return;
                const isTarget = key === tabKey;
                btn.classList.toggle('active', isTarget);
                btn.setAttribute('aria-selected', isTarget);
            });

            Object.keys(accountPanels).forEach(key => {
                const panel = accountPanels[key];
                if (!panel) return;
                panel.style.display = key === tabKey ? 'block' : 'none';
            });

            const user = getCurrentUser();
            if (!user) return;
            const users = getUsers();
            const userInDb = users.find(u => u.id === user.id) || user;

            if (tabKey === 'personal') {
                if (accFirstNameInput) accFirstNameInput.value = userInDb.firstName || (userInDb.name || '').split(' ')[0] || '';
                if (accLastNameInput) accLastNameInput.value = userInDb.lastName || (userInDb.name || '').split(' ').slice(1).join(' ') || '';
                if (accEmailInput) accEmailInput.value = userInDb.email || '';
            } else if (tabKey === 'payment') {
                renderSavedCardUI();
            } else if (tabKey === 'delete') {
                if (accDeleteConfirmInput) accDeleteConfirmInput.value = '';
            }
        }

        function openAccountModal(initialTab = 'personal') {
            const user = getCurrentUser();
            if (!user) {
                openModal('login');
                showTopToast('Please log in first to manage your account.', 'warning');
                return;
            }
            if (authDropdown) authDropdown.style.display = 'none';
            switchAccountTab(initialTab);
            if (accountModal) {
                accountModal.classList.add('active');
                accountModal.setAttribute('aria-hidden', 'false');
                document.body.classList.add('modal-open');
            }
        }

        function closeAccountModal() {
            if (!accountModal) return;
            accountModal.classList.remove('active');
            accountModal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
            clearAccountErrors();
        }

        if (dropdownManageAccountBtn) {
            dropdownManageAccountBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openAccountModal('personal');
            });
        }

        if (dropdownManageBookingsBtn) {
            dropdownManageBookingsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (authDropdown) authDropdown.style.display = 'none';
                openBookingModal();
            });
        }

        Object.keys(accountNavButtons).forEach(key => {
            const btn = accountNavButtons[key];
            if (btn) {
                btn.addEventListener('click', () => switchAccountTab(key));
            }
        });

        if (accountModalClose) accountModalClose.addEventListener('click', closeAccountModal);
        if (accountModal) {
            accountModal.addEventListener('click', (e) => {
                if (e.target === accountModal) closeAccountModal();
            });
        }

        if (accPersonalForm) {
            accPersonalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                clearAccountErrors();
                const user = getCurrentUser();
                if (!user) return;

                const firstName = (accFirstNameInput.value || '').trim();
                const lastName = (accLastNameInput.value || '').trim();
                const email = (accEmailInput.value || '').trim();

                let hasErr = false;
                if (!firstName) {
                    setAccError('field-acc-firstname', 'acc-firstname-error', 'Please enter your first name.');
                    hasErr = true;
                }
                if (!lastName) {
                    setAccError('field-acc-lastname', 'acc-lastname-error', 'Please enter your last name.');
                    hasErr = true;
                }
                if (!email) {
                    setAccError('field-acc-email', 'acc-email-error', 'Please enter your email address.');
                    hasErr = true;
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    setAccError('field-acc-email', 'acc-email-error', 'Please enter a valid email address.');
                    hasErr = true;
                }

                if (hasErr) return;

                const users = getUsers();
                const userInDb = users.find(u => u.id === user.id);
                if (!userInDb) return;

                const oldEmail = (userInDb.email || '').toLowerCase();
                const newEmailLower = email.toLowerCase();

                if (oldEmail !== newEmailLower) {
                    if (users.some(u => u.id !== user.id && (u.email || '').toLowerCase() === newEmailLower)) {
                        setAccError('field-acc-email', 'acc-email-error', 'This email is already in use by another account.');
                        return;
                    }
                }

                const newFullName = `${firstName} ${lastName}`.trim();
                userInDb.firstName = firstName;
                userInDb.lastName = lastName;
                userInDb.name = newFullName;
                userInDb.email = email;
                saveUsers(users);

                const updatedUser = {
                    id: user.id,
                    firstName: firstName,
                    lastName: lastName,
                    name: newFullName,
                    email: email,
                    savedCard: userInDb.savedCard,
                    savedCards: userInDb.savedCards
                };
                setCurrentUser(updatedUser);

                if (oldEmail !== newEmailLower) {
                    const allBookings = getAllBookings();
                    let count = 0;
                    allBookings.forEach(b => {
                        if ((b.userEmail || '').toLowerCase() === oldEmail) {
                            b.userEmail = email;
                            b.userName = newFullName;
                            count++;
                        }
                    });
                    if (count > 0) {
                        saveAllBookings(allBookings);
                    }
                }

                setAccFeedback(accPersonalFeedback, 'Personal information updated successfully.', 'success');
                showTopToast('Personal information updated successfully.');
            });
        }

        if (accSecurityForm) {
            accSecurityForm.addEventListener('submit', (e) => {
                e.preventDefault();
                clearAccountErrors();
                const user = getCurrentUser();
                if (!user) return;

                const currPass = accCurrPasswordInput.value || '';
                const newPass = accNewPasswordInput.value || '';
                const confirmPass = accConfirmPasswordInput.value || '';

                const users = getUsers();
                const userInDb = users.find(u => u.id === user.id);
                if (!userInDb) return;

                let hasErr = false;
                if (!currPass) {
                    setAccError('field-acc-currpass', 'acc-currpass-error', 'Please enter your current password.');
                    hasErr = true;
                } else if (userInDb.password !== currPass) {
                    setAccError('field-acc-currpass', 'acc-currpass-error', 'Current password is incorrect.');
                    hasErr = true;
                }

                if (!newPass) {
                    setAccError('field-acc-newpass', 'acc-newpass-error', 'Please enter a new password.');
                    hasErr = true;
                } else if (newPass.length < 6) {
                    setAccError('field-acc-newpass', 'acc-newpass-error', 'New password must be at least 6 characters.');
                    hasErr = true;
                } else if (newPass === currPass) {
                    setAccError('field-acc-newpass', 'acc-newpass-error', 'New password must be different from current password.');
                    hasErr = true;
                }

                if (!confirmPass) {
                    setAccError('field-acc-confirmpass', 'acc-confirmpass-error', 'Please confirm your new password.');
                    hasErr = true;
                } else if (newPass !== confirmPass) {
                    setAccError('field-acc-confirmpass', 'acc-confirmpass-error', 'Passwords do not match.');
                    hasErr = true;
                }

                if (hasErr) return;

                userInDb.password = newPass;
                saveUsers(users);

                accSecurityForm.reset();
                setAccFeedback(accSecurityFeedback, 'Password updated successfully.', 'success');
                showTopToast('Password updated successfully.');
            });
        }

        if (accAddCardOpenBtn) {
            accAddCardOpenBtn.addEventListener('click', showAddCardGateway);
        }

        if (accCancelAddCardBtn) {
            accCancelAddCardBtn.addEventListener('click', () => {
                renderSavedCardUI();
            });
        }

        if (accCardNumberInput) {
            accCardNumberInput.addEventListener('input', () => {
                let rawDigits = accCardNumberInput.value.replace(/\D/g, '');
                const brand = detectCardBrand(rawDigits);
                updateAccCardBrandLogos(brand);

                if (brand === 'amex') {
                    rawDigits = rawDigits.slice(0, 15);
                    const p1 = rawDigits.slice(0, 4);
                    const p2 = rawDigits.slice(4, 10);
                    const p3 = rawDigits.slice(10, 15);
                    accCardNumberInput.value = [p1, p2, p3].filter(Boolean).join(' ');
                } else {
                    rawDigits = rawDigits.slice(0, 16);
                    const groups = rawDigits.match(/.{1,4}/g);
                    accCardNumberInput.value = groups ? groups.join(' ') : '';
                }

                if (accCardBrandIcon) {
                    if (brand === 'visa') accCardBrandIcon.src = 'images/logos/visa.svg';
                    else if (brand === 'mastercard') accCardBrandIcon.src = 'images/logos/mastercard.svg';
                    else if (brand === 'amex') accCardBrandIcon.src = 'images/logos/americanexpress.svg';
                    else if (brand === 'discover') accCardBrandIcon.src = 'images/logos/discover.svg';
                    else if (brand === 'jcb') accCardBrandIcon.src = 'images/logos/jcb.svg';
                    else accCardBrandIcon.src = 'images/credit-card.svg';
                }

                const field = document.getElementById('field-acc-cardnumber');
                if (field) field.classList.remove('has-error');
                accCardNumberInput.classList.remove('input-error');
            });
        }

        if (accCardExpiryInput) {
            accCardExpiryInput.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                if (v.length >= 3) {
                    v = v.slice(0, 2) + '/' + v.slice(2);
                }
                e.target.value = v;
            });
        }

        if (accCardCvvInput) {
            accCardCvvInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
            });
        }

        const accAddMoreCardBtn = document.getElementById('acc-add-more-card-btn');
        if (accAddMoreCardBtn) {
            accAddMoreCardBtn.addEventListener('click', () => {
                showAddCardGateway();
            });
        }

        const accSavedCardsListEl = document.getElementById('acc-saved-cards-list');
        if (accSavedCardsListEl) {
            accSavedCardsListEl.addEventListener('click', (e) => {
                const delBtn = e.target.closest('[data-action="delete-card"]');
                const defaultBtn = e.target.closest('[data-action="set-default"]');

                if (delBtn) {
                    const targetCardId = delBtn.getAttribute('data-card-id');
                    if (!targetCardId) return;

                    const user = getCurrentUser();
                    if (!user) return;
                    const users = getUsers();
                    const userInDb = users.find(u => u.id === user.id) || user;

                    let cards = getUserSavedCards(userInDb).filter(c => (c.id || ('card_' + c.cardLast4)) !== targetCardId);
                    userInDb.savedCards = cards;
                    userInDb.savedCard = cards.length > 0 ? cards[0] : null;
                    saveUsers(users);

                    user.savedCards = cards;
                    user.savedCard = cards.length > 0 ? cards[0] : null;
                    setCurrentUser(user);

                    renderSavedCardUI();
                    if (typeof renderPaymentSavedCardsUI === 'function') {
                        renderPaymentSavedCardsUI();
                    }
                    showTopToast('Saved card deleted.');
                    return;
                }

                if (defaultBtn) {
                    const targetCardId = defaultBtn.getAttribute('data-card-id');
                    if (!targetCardId) return;

                    const user = getCurrentUser();
                    if (!user) return;
                    const users = getUsers();
                    const userInDb = users.find(u => u.id === user.id) || user;

                    let cards = getUserSavedCards(userInDb);
                    const targetIdx = cards.findIndex(c => (c.id || ('card_' + c.cardLast4)) === targetCardId);
                    if (targetIdx <= 0) return;

                    const [targetCard] = cards.splice(targetIdx, 1);
                    cards.unshift(targetCard);

                    userInDb.savedCards = cards;
                    userInDb.savedCard = cards[0];
                    saveUsers(users);

                    user.savedCards = cards;
                    user.savedCard = cards[0];
                    setCurrentUser(user);

                    renderSavedCardUI();
                    if (typeof renderPaymentSavedCardsUI === 'function') {
                        selectedSavedCardId = cards[0].id || ('card_' + cards[0].cardLast4);
                        renderPaymentSavedCardsUI();
                    }
                    const bName = getBrandDisplayName(targetCard.brand);
                    showTopToast('Set ' + bName + ' •••• ' + targetCard.cardLast4 + ' as default card.', 'success');
                }
            });
        }

        if (accPaymentForm) {
            accPaymentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                clearAccountErrors();
                const user = getCurrentUser();
                if (!user) return;

                const cardName = (accCardNameInput.value || '').trim();
                const rawCard = (accCardNumberInput.value || '').replace(/\s/g, '');
                const expiryVal = (accCardExpiryInput.value || '').trim();
                const cvvVal = (accCardCvvInput.value || '').trim();

                let hasErr = false;
                if (!cardName) {
                    setAccError('field-acc-cardname', 'acc-cardname-error', 'Please enter cardholder name.');
                    hasErr = true;
                }

                const brand = detectCardBrand(rawCard);
                const expectedLen = brand === 'amex' ? 15 : 16;
                if (!brand) {
                    setAccError('field-acc-cardnumber', 'acc-cardnumber-error', 'Unrecognized card network. We accept Visa, Mastercard, Amex, Discover, and JCB.');
                    hasErr = true;
                } else if (rawCard.length !== expectedLen) {
                    setAccError('field-acc-cardnumber', 'acc-cardnumber-error', `Please enter a valid ${expectedLen}-digit card number.`);
                    hasErr = true;
                }

                if (!/^\d{2}\/\d{2}$/.test(expiryVal)) {
                    setAccError('field-acc-cardexpiry', 'acc-cardexpiry-error', 'Enter valid MM/YY.');
                    hasErr = true;
                } else {
                    const [mmStr, yyStr] = expiryVal.split('/');
                    const expM = parseInt(mmStr, 10);
                    const expY = 2000 + parseInt(yyStr, 10);
                    const now = new Date();
                    if (expM < 1 || expM > 12 || expY < now.getFullYear() || (expY === now.getFullYear() && expM < (now.getMonth() + 1))) {
                        setAccError('field-acc-cardexpiry', 'acc-cardexpiry-error', 'This card has expired.');
                        hasErr = true;
                    }
                }

                const expectedCvvLen = brand === 'amex' ? 4 : 3;
                if (!cvvVal || cvvVal.length !== expectedCvvLen) {
                    setAccError('field-acc-cardcvv', 'acc-cardcvv-error', `Enter valid ${expectedCvvLen}-digit CVV.`);
                    hasErr = true;
                }

                if (hasErr) return;

                if (accVerifyCardBtn) {
                    accVerifyCardBtn.classList.add('is-verifying');
                    accVerifyCardBtn.disabled = true;
                }

                accVerifyTimer = setTimeout(() => {
                    try {
                        const last4 = rawCard.slice(-4);
                        const newCardId = 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
                        const savedCardData = {
                            id: newCardId,
                            cardName: cardName,
                            cardLast4: last4,
                            cardNumberFormatted: formatCardNumber(rawCard, brand),
                            cardExpiry: expiryVal,
                            brand: (brand || 'visa').toUpperCase(),
                            createdAt: Date.now()
                        };

                        const users = getUsers();
                        const userInDb = users.find(u => u.id === user.id) || user;
                        let existingCards = getUserSavedCards(userInDb);
                        existingCards.unshift(savedCardData);

                        userInDb.savedCards = existingCards;
                        userInDb.savedCard = savedCardData;
                        saveUsers(users);

                        user.savedCards = existingCards;
                        user.savedCard = savedCardData;
                        setCurrentUser(user);
                        selectedSavedCardId = savedCardData.id;

                        if (accGatewayModuleShell) accGatewayModuleShell.classList.add('is-verified');
                        if (accVerifyCardBtn) {
                            accVerifyCardBtn.classList.remove('is-verifying');
                            accVerifyCardBtn.classList.add('is-verified');
                        }
                        if (accVerifyCardText) accVerifyCardText.textContent = 'Verified!';

                        setTimeout(() => {
                            renderSavedCardUI();
                            if (typeof renderPaymentSavedCardsUI === 'function') {
                                renderPaymentSavedCardsUI();
                            }
                            showTopToast('Card verified and added to your account!');
                        }, 500);
                    } catch (err) {
                        console.error('Error saving verified card:', err);
                        if (accVerifyCardBtn) {
                            accVerifyCardBtn.classList.remove('is-verifying');
                            accVerifyCardBtn.disabled = false;
                        }
                        if (accVerifyCardText) accVerifyCardText.textContent = 'Verify';
                        setAccError('field-acc-cardnumber', 'acc-cardnumber-error', 'Failed to save card. Please try again.');
                    }
                }, 750);
            });
        }

        if (accDeleteForm) {
            accDeleteForm.addEventListener('submit', (e) => {
                e.preventDefault();
                clearAccountErrors();
                const user = getCurrentUser();
                if (!user) return;

                const confirmText = (accDeleteConfirmInput.value || '').trim().toUpperCase();
                if (confirmText !== 'DELETE') {
                    setAccError('field-acc-delete-confirm', 'acc-delete-error', 'Please type DELETE exactly to confirm deletion.');
                    return;
                }

                const userEmail = (user.email || '').toLowerCase();

                let users = getUsers().filter(u => u.id !== user.id && (u.email || '').toLowerCase() !== userEmail);
                saveUsers(users);

                let allBookings = getAllBookings().filter(b => (b.userEmail || '').toLowerCase() !== userEmail);
                saveAllBookings(allBookings);

                setCurrentUser(null);

                closeAccountModal();
                if (authDropdown) authDropdown.style.display = 'none';

                showTopToast('Account and all associated bookings have been permanently deleted.', 'warning');
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (accountModal && accountModal.classList.contains('active')) closeAccountModal();
            }
        });

        getUsers();
        updateNavAuthUI();

        const STORAGE_DRAFT_RESERVE = 'azoom_reservation_draft';
        const LOCATION_LABELS = {
            'alexandra': 'Alexandra Main Branch',
            'airport': 'Changi Airport Branch',
            'orchard': 'Orchard Car Park',
            'jurong': 'Jurong East Car Park',
            'woodlands': 'Woodlands Car Park'
        };

        let currentReserveStep = 1;

        const reserveBackBtn = document.getElementById('reserve-back-btn');
        const reserveBackBtnText = document.getElementById('reserve-back-btn-text');
        const reserveWorkspace = document.getElementById('reserve-workspace');
        const reserveSummaryCol = document.getElementById('reserve-summary-col');
        const reserveActionCol = document.getElementById('reserve-action-col');

        const stepNode1 = document.getElementById('reserve-step-node-1');
        const stepNode2 = document.getElementById('reserve-step-node-2');
        const stepNode3 = document.getElementById('reserve-step-node-3');
        const stepLine1 = document.getElementById('reserve-step-line-1');
        const stepLine2 = document.getElementById('reserve-step-line-2');

        const stepPanel1 = document.getElementById('reserve-step-panel-1');
        const stepPanel2 = document.getElementById('reserve-step-panel-2');
        const stepPanel3 = document.getElementById('reserve-step-panel-3');

        const reservePickupTimeSelect = document.getElementById('reserve-pickup-time');
        const reserveReturnTimeSelect = document.getElementById('reserve-return-time');
        const reserveTimeForm = document.getElementById('reserve-time-form');

        const reservePaymentForm = document.getElementById('reserve-payment-form');
        const payCardNameInput = document.getElementById('pay-card-name');
        const payCardNumberInput = document.getElementById('pay-card-number');
        const payCardExpiryInput = document.getElementById('pay-card-expiry');
        const payCardCvvInput = document.getElementById('pay-card-cvv');
        const payEditTimeBtn = document.getElementById('pay-edit-time-btn');
        const reservePaymentBackBtn = document.getElementById('reserve-payment-back-btn');
        const payTotalAmount = document.getElementById('pay-total-amount');
        const reservePaymentSubmitBtn = document.getElementById('reserve-payment-submit-btn');
        const reservePaymentSubmitText = document.getElementById('reserve-payment-submit-text');
        const gatewayModuleShell = document.getElementById('gateway-module-shell');
        const billMakePaymentBtn = document.getElementById('bill-make-payment-btn');
        const billMakePaymentText = document.getElementById('bill-make-payment-text');

        const gatewayTabSaved = document.getElementById('gateway-tab-saved');
        const gatewayTabNew = document.getElementById('gateway-tab-new');
        const gatewaySavedShell = document.getElementById('gateway-saved-shell');
        const gatewaySavedCardsList = document.getElementById('gateway-saved-cards-list');
        const gatewaySavedEmpty = document.getElementById('gateway-saved-empty');
        const gatewaySwitchNewBtn = document.getElementById('gateway-switch-new-btn');
        const paySaveCardCheck = document.getElementById('pay-save-card-check');

        let isCardVerified = false;
        let isCardVerifying = false;
        let verifyTimer = null;
        let verifiedCardLast4 = '';
        let verifiedCardBrand = '';
        let paymentMode = 'saved';
        let selectedSavedCardId = null;
        let isNewCardVerified = false;
        let newCardLast4 = '';
        let newCardBrand = '';

        function setCardVerifiedState(verified, last4 = '', brand = '') {
            if (verifyTimer) {
                clearTimeout(verifyTimer);
                verifyTimer = null;
            }
            isCardVerifying = false;
            isCardVerified = verified;
            verifiedCardLast4 = last4;
            verifiedCardBrand = brand;

            if (reservePaymentSubmitBtn) {
                reservePaymentSubmitBtn.classList.remove('is-verifying');
            }

            if (verified) {
                if (gatewayModuleShell) gatewayModuleShell.classList.add('is-verified');
                if (paymentMode === 'new') {
                    if (reservePaymentSubmitBtn) {
                        reservePaymentSubmitBtn.classList.add('is-verified');
                        reservePaymentSubmitBtn.disabled = true;
                    }
                    if (reservePaymentSubmitText) reservePaymentSubmitText.textContent = 'Verified';
                }
                if (billMakePaymentBtn) billMakePaymentBtn.classList.remove('is-unverified');
            } else {
                if (gatewayModuleShell) gatewayModuleShell.classList.remove('is-verified');
                if (reservePaymentSubmitBtn) {
                    reservePaymentSubmitBtn.classList.remove('is-verified');
                    reservePaymentSubmitBtn.disabled = false;
                }
                if (reservePaymentSubmitText) reservePaymentSubmitText.textContent = 'Verify';
                if (billMakePaymentBtn) billMakePaymentBtn.classList.add('is-unverified');
            }
        }

        function setPaymentMode(mode) {
            paymentMode = mode;
            clearPaymentErrors();

            if (gatewayTabSaved && gatewayTabNew) {
                gatewayTabSaved.classList.toggle('is-active', mode === 'saved');
                gatewayTabSaved.setAttribute('aria-selected', mode === 'saved');
                gatewayTabNew.classList.toggle('is-active', mode === 'new');
                gatewayTabNew.setAttribute('aria-selected', mode === 'new');
            }

            if (gatewaySavedShell && gatewayModuleShell) {
                gatewaySavedShell.style.display = mode === 'saved' ? 'block' : 'none';
                gatewayModuleShell.style.display = mode === 'new' ? 'block' : 'none';
            }

            if (mode === 'saved') {
                const curUser = getCurrentUser();
                const allUsers = getUsers();
                const uDb = (curUser && allUsers.find(u => u.id === curUser.id)) || curUser;
                const cards = getUserSavedCards(uDb);
                if (cards.length > 0) {
                    const selCard = cards.find(c => (c.id || ('card_' + c.cardLast4)) === selectedSavedCardId) || cards[0];
                    if (selCard) {
                        selectedSavedCardId = selCard.id || ('card_' + selCard.cardLast4);
                        setCardVerifiedState(true, selCard.cardLast4, selCard.brand);
                    }
                } else {
                    setCardVerifiedState(false);
                }
            } else {
                if (isNewCardVerified) {
                    setCardVerifiedState(true, newCardLast4, newCardBrand);
                } else {
                    setCardVerifiedState(false);
                }
                const rawDigits = (payCardNumberInput ? payCardNumberInput.value : '').replace(/\D/g, '');
                const brand = detectCardBrand(rawDigits);
                updateCardBrandLogos(brand);
            }
        }

        function renderPaymentSavedCardsUI() {
            const curUser = getCurrentUser();
            if (!curUser) return;
            const allUsers = getUsers();
            const uDb = allUsers.find(u => u.id === curUser.id) || curUser;
            const cards = getUserSavedCards(uDb);

            const countPill = document.getElementById('gateway-saved-count-pill');
            if (countPill) {
                countPill.textContent = cards.length === 1 ? '1 card' : (cards.length + ' cards');
            }

            if (cards.length > 0) {
                if (!selectedSavedCardId || !cards.some(c => (c.id || ('card_' + c.cardLast4)) === selectedSavedCardId)) {
                    selectedSavedCardId = cards[0].id || ('card_' + cards[0].cardLast4);
                }

                if (gatewaySavedCardsList) {
                    gatewaySavedCardsList.innerHTML = cards.map((c, idx) => {
                        const cardId = c.id || ('card_' + c.cardLast4);
                        const isSelected = cardId === selectedSavedCardId;
                        const brandName = getBrandDisplayName(c.brand);
                        const logoSrc = getBrandLogoSrc(c.brand);
                        const isDefault = idx === 0;
                        return '<div class="gateway-saved-card-item ' + (isSelected ? 'is-selected' : '') + '" data-card-id="' + cardId + '" role="radio" aria-checked="' + isSelected + '">' +
                            '<div class="saved-card-radio-circle" aria-hidden="true"></div>' +
                            '<div class="saved-card-item-logo-box">' +
                                '<img src="' + logoSrc + '" alt="' + brandName + '" class="saved-card-item-logo">' +
                            '</div>' +
                            '<div class="saved-card-main-col">' +
                                '<div class="saved-card-header-line">' +
                                    '<span class="saved-card-num-text">' + brandName + ' &bull;&bull;&bull;&bull; ' + c.cardLast4 + '</span>' +
                                    (isDefault ? '<span class="saved-card-default-badge">Default</span>' : '') +
                                '</div>' +
                                '<div class="saved-card-sub-line">' + (c.cardName || curUser.name || 'Cardholder') + ' &middot; Exp ' + (c.cardExpiry || '12/28') + '</div>' +
                            '</div>' +
                        '</div>';
                    }).join('');
                }

                if (gatewaySavedEmpty) gatewaySavedEmpty.style.display = 'none';

                const selCard = cards.find(c => (c.id || ('card_' + c.cardLast4)) === selectedSavedCardId) || cards[0];
                if (selCard && paymentMode === 'saved') {
                    setCardVerifiedState(true, selCard.cardLast4, selCard.brand);
                }
            } else {
                selectedSavedCardId = null;
                if (gatewaySavedCardsList) gatewaySavedCardsList.innerHTML = '';
                if (gatewaySavedEmpty) gatewaySavedEmpty.style.display = 'flex';
                if (paymentMode === 'saved') {
                    setCardVerifiedState(false);
                }
            }
        }

        const completedBookingRef = document.getElementById('completed-booking-ref');
        const completedCarName = document.getElementById('completed-car-name');
        const completedPickupInfo = document.getElementById('completed-pickup-info');
        const completedReturnInfo = document.getElementById('completed-return-info');
        const completedCardInfo = document.getElementById('completed-card-info');
        const completedTotalPaid = document.getElementById('completed-total-paid');
        const completedViewBookingsBtn = document.getElementById('completed-view-bookings-btn');
        const completedHomeBtn = document.getElementById('completed-home-btn');

        function setReserveStep(step) {
            currentReserveStep = step;

            [stepNode1, stepNode2, stepNode3].forEach(node => {
                if (!node) return;
                node.classList.remove('is-active', 'is-completed', 'is-clickable');
            });
            [stepLine1, stepLine2].forEach(line => {
                if (!line) return;
                line.classList.remove('is-filled');
            });

            if (step === 1) {
                if (stepNode1) stepNode1.classList.add('is-active');
                if (reserveBackBtn) reserveBackBtn.classList.remove('is-hidden-step3');
                if (reserveBackBtnText) reserveBackBtnText.textContent = 'Back to Vehicle Selection';
                if (reserveWorkspace) reserveWorkspace.classList.remove('is-step-completed', 'is-step-payment');
                if (reserveSummaryCol) reserveSummaryCol.style.display = '';
                if (reserveActionCol) reserveActionCol.style.display = '';
                if (stepPanel1) stepPanel1.style.display = 'block';
                if (stepPanel2) stepPanel2.style.display = 'none';
                if (stepPanel3) stepPanel3.style.display = 'none';
            } else if (step === 2) {
                if (stepNode1) {
                    stepNode1.classList.add('is-completed', 'is-clickable');
                }
                if (stepLine1) stepLine1.classList.add('is-filled');
                if (stepNode2) stepNode2.classList.add('is-active');

                if (reserveBackBtn) reserveBackBtn.classList.remove('is-hidden-step3');
                if (reserveBackBtnText) reserveBackBtnText.textContent = 'Back to Confirm Time';
                if (reserveWorkspace) {
                    reserveWorkspace.classList.remove('is-step-completed');
                    reserveWorkspace.classList.add('is-step-payment');
                }
                if (reserveSummaryCol) reserveSummaryCol.style.display = 'none';
                if (reserveActionCol) reserveActionCol.style.display = '';
                if (stepPanel1) stepPanel1.style.display = 'none';
                if (stepPanel2) stepPanel2.style.display = 'grid';
                if (stepPanel3) stepPanel3.style.display = 'none';
                const curUser = getCurrentUser();
                const allUsers = getUsers();
                const uDb = (curUser && allUsers.find(u => u.id === curUser.id)) || curUser;
                const userCards = getUserSavedCards(uDb);
                if (payCardNameInput && curUser && !payCardNameInput.value) {
                    payCardNameInput.value = curUser.name || '';
                }
                isNewCardVerified = false;
                newCardLast4 = '';
                newCardBrand = '';
                if (userCards.length > 0) {
                    renderPaymentSavedCardsUI();
                    setPaymentMode('saved');
                } else {
                    renderPaymentSavedCardsUI();
                    setPaymentMode('new');
                }

                const draft = getActiveDraft();
                if (draft) {
                    const pTime = reservePickupTimeSelect ? reservePickupTimeSelect.value : (draft.pickupTime || '');
                    const rTime = reserveReturnTimeSelect ? reserveReturnTimeSelect.value : (draft.returnTime || '');
                    const days = draft.days || 1;
                    if (payTotalAmount) payTotalAmount.textContent = `S$${draft.totalPrice}`;
                    if (billMakePaymentText) billMakePaymentText.textContent = `Make Payment`;
                    const billCarName = document.getElementById('pay-bill-car-name');
                    const billSchedule = document.getElementById('pay-bill-schedule');
                    const billCalc = document.getElementById('pay-bill-calc');
                    const billSub = document.getElementById('pay-bill-subtotal');
                    const billTotalBottom = document.getElementById('pay-bill-total-bottom');
                    if (billCarName) billCarName.textContent = draft.model || 'Electric Vehicle';
                    if (billSchedule) billSchedule.innerHTML = `${draft.pickupDate} ${pTime} &rarr; ${draft.returnDate} ${rTime}`;
                    if (billCalc) billCalc.innerHTML = `S$${draft.dailyPrice} &times; ${days} ${days === 1 ? 'day' : 'days'}`;
                    if (billSub) billSub.textContent = `S$${draft.totalPrice}`;
                    if (billTotalBottom) billTotalBottom.textContent = `S$${draft.totalPrice}`;
                }
            } else if (step === 3) {
                if (stepNode1) stepNode1.classList.add('is-completed');
                if (stepLine1) stepLine1.classList.add('is-filled');
                if (stepNode2) stepNode2.classList.add('is-completed');
                if (stepLine2) stepLine2.classList.add('is-filled');
                if (stepNode3) stepNode3.classList.add('is-completed', 'is-active');

                if (reserveBackBtn) reserveBackBtn.classList.add('is-hidden-step3');
                if (reserveWorkspace) {
                    reserveWorkspace.classList.remove('is-step-payment');
                    reserveWorkspace.classList.add('is-step-completed');
                }
                if (reserveSummaryCol) reserveSummaryCol.style.display = 'none';
                if (reserveActionCol) reserveActionCol.style.display = 'none';
                if (stepPanel1) stepPanel1.style.display = 'none';
                if (stepPanel2) stepPanel2.style.display = 'none';
                if (stepPanel3) stepPanel3.style.display = 'block';
            }
        }

        if (stepNode1) {
            stepNode1.addEventListener('click', () => {
                if (currentReserveStep === 2) {
                    setReserveStep(1);
                }
            });
        }

        function populateHalfHourOptions(selectEl, placeholderText) {
            if (!selectEl) return;
            selectEl.innerHTML = '';
            const defaultOpt = document.createElement('option');
            defaultOpt.value = '';
            defaultOpt.disabled = true;
            defaultOpt.selected = true;
            defaultOpt.hidden = true;
            defaultOpt.textContent = placeholderText;
            selectEl.appendChild(defaultOpt);

            for (let h = 0; h < 24; h++) {
                for (let m of [0, 30]) {
                    const hh = String(h).padStart(2, '0');
                    const mm = String(m).padStart(2, '0');
                    const val = `${hh}:${mm}`;
                    const period = h < 12 ? 'AM' : 'PM';
                    const displayHour = h % 12 === 0 ? 12 : h % 12;
                    const opt = document.createElement('option');
                    opt.value = val;
                    opt.textContent = `${val} (${displayHour}:${mm} ${period})`;
                    selectEl.appendChild(opt);
                }
            }
        }

        populateHalfHourOptions(reservePickupTimeSelect, 'Select');
        populateHalfHourOptions(reserveReturnTimeSelect, 'Select');

        function clearReserveTimeErrors() {
            ['field-reserve-pickup-time', 'field-reserve-return-time'].forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (!field) return;
                field.classList.remove('has-error');
                const sel = field.querySelector('.reserve-time-select');
                if (sel) sel.classList.remove('input-error');
                const err = field.querySelector('.reserve-field-error');
                if (err) err.textContent = '';
            });
        }

        function setReserveTimeError(fieldId, msg) {
            const field = document.getElementById(fieldId);
            if (!field) return;
            field.classList.add('has-error');
            const sel = field.querySelector('.reserve-time-select');
            if (sel) sel.classList.add('input-error');
            const err = field.querySelector('.reserve-field-error');
            if (err) err.textContent = msg;
        }

        function clearPaymentErrors() {
            ['field-pay-name', 'field-pay-number', 'field-pay-expiry', 'field-pay-cvv'].forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (!field) return;
                field.classList.remove('has-error');
                const inp = field.querySelector('.payment-input');
                if (inp) inp.classList.remove('input-error');
                const err = field.querySelector('.reserve-field-error');
                if (err) err.textContent = '';
            });
        }

        function setPaymentError(fieldId, msg) {
            const field = document.getElementById(fieldId);
            if (!field) return;
            field.classList.add('has-error');
            const inp = field.querySelector('.payment-input');
            if (inp) inp.classList.add('input-error');
            const err = field.querySelector('.reserve-field-error');
            if (err) err.textContent = msg;
        }

        function detectCardBrand(digits) {
            if (!digits) return null;
            if (/^4/.test(digits)) return 'visa';
            if (/^3[47]/.test(digits)) return 'amex';
            if (/^35/.test(digits)) return 'jcb';
            if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(digits)) return 'mastercard';
            if (/^(6011|65|64[4-9])/.test(digits)) return 'discover';
            return null;
        }

        function updateCardBrandLogos(brand) {
            const boxes = document.querySelectorAll('#gateway-card-brands .gateway-brand-logo-box');
            boxes.forEach(box => {
                box.classList.remove('is-dimmed', 'is-matched');
                if (brand) {
                    if (box.dataset.cardBrand === brand) {
                        box.classList.add('is-matched');
                    } else {
                        box.classList.add('is-dimmed');
                    }
                }
            });

            if (payCardCvvInput) {
                if (brand === 'amex') {
                    payCardCvvInput.placeholder = '4 digits';
                    payCardCvvInput.maxLength = 4;
                } else {
                    payCardCvvInput.placeholder = '3 digits';
                    payCardCvvInput.maxLength = 3;
                    if (payCardCvvInput.value.length > 3) {
                        payCardCvvInput.value = payCardCvvInput.value.slice(0, 3);
                    }
                }
            }
        }

        if (payCardNumberInput) {
            payCardNumberInput.addEventListener('input', () => {
                let rawDigits = payCardNumberInput.value.replace(/\D/g, '');
                const brand = detectCardBrand(rawDigits);
                updateCardBrandLogos(brand);

                if (brand === 'amex') {
                    rawDigits = rawDigits.slice(0, 15);
                    const p1 = rawDigits.slice(0, 4);
                    const p2 = rawDigits.slice(4, 10);
                    const p3 = rawDigits.slice(10, 15);
                    payCardNumberInput.value = [p1, p2, p3].filter(Boolean).join(' ');
                } else {
                    rawDigits = rawDigits.slice(0, 16);
                    const groups = rawDigits.match(/.{1,4}/g);
                    payCardNumberInput.value = groups ? groups.join(' ') : '';
                }

                isNewCardVerified = false;
                newCardLast4 = '';
                newCardBrand = '';
                if (isCardVerified || isCardVerifying) setCardVerifiedState(false);
                const field = document.getElementById('field-pay-number');
                if (field) field.classList.remove('has-error');
                payCardNumberInput.classList.remove('input-error');
            });
        }

        function validateExpiryInstant() {
            if (!payCardExpiryInput) return;
            const field = document.getElementById('field-pay-expiry');
            const err = document.getElementById('pay-expiry-error');
            const digits = payCardExpiryInput.value.replace(/\D/g, '').slice(0, 4);

            if (field) field.classList.remove('has-error');
            payCardExpiryInput.classList.remove('input-error');
            if (err) err.textContent = '';

            if (digits.length >= 2) {
                const expMonth = parseInt(digits.slice(0, 2), 10);
                if (expMonth < 1 || expMonth > 12) {
                    setPaymentError('field-pay-expiry', 'Enter a valid month (01–12).');
                    return;
                }
                if (digits.length === 4) {
                    const expYear = 2000 + parseInt(digits.slice(2, 4), 10);
                    const now = new Date();
                    const curYear = now.getFullYear();
                    const curMonth = now.getMonth() + 1;
                    if (expYear < curYear || (expYear === curYear && expMonth < curMonth)) {
                        setPaymentError('field-pay-expiry', 'This card has expired.');
                    }
                }
            }
        }

        if (payCardExpiryInput) {
            payCardExpiryInput.addEventListener('input', () => {
                if (isCardVerified || isCardVerifying) setCardVerifiedState(false);
                const digits = payCardExpiryInput.value.replace(/\D/g, '').slice(0, 4);
                if (digits.length >= 3) {
                    payCardExpiryInput.value = digits.slice(0, 2) + '/' + digits.slice(2);
                } else {
                    payCardExpiryInput.value = digits;
                }
                validateExpiryInstant();
            });
        }

        if (payCardCvvInput) {
            payCardCvvInput.addEventListener('input', () => {
                if (isCardVerified || isCardVerifying) setCardVerifiedState(false);
                payCardCvvInput.value = payCardCvvInput.value.replace(/\D/g, '').slice(0, 4);
                const field = document.getElementById('field-pay-cvv');
                if (field) field.classList.remove('has-error');
                payCardCvvInput.classList.remove('input-error');
            });
        }

        if (payCardNameInput) {
            payCardNameInput.addEventListener('input', () => {
                if (isCardVerified || isCardVerifying) setCardVerifiedState(false);
                const field = document.getElementById('field-pay-name');
                if (field) field.classList.remove('has-error');
                payCardNameInput.classList.remove('input-error');
            });
        }

        if (gatewaySavedCardsList) {
            gatewaySavedCardsList.addEventListener('click', (e) => {
                const item = e.target.closest('.gateway-saved-card-item');
                if (!item) return;
                const targetId = item.dataset.cardId;
                if (!targetId) return;

                selectedSavedCardId = targetId;
                gatewaySavedCardsList.querySelectorAll('.gateway-saved-card-item').forEach(el => {
                    const isMatch = el.dataset.cardId === targetId;
                    el.classList.toggle('is-selected', isMatch);
                    el.setAttribute('aria-checked', isMatch);
                });

                const curUser = getCurrentUser();
                const allUsers = getUsers();
                const uDb = (curUser && allUsers.find(u => u.id === curUser.id)) || curUser;
                const cards = getUserSavedCards(uDb);
                const cardObj = cards.find(c => (c.id || ('card_' + c.cardLast4)) === targetId);
                if (cardObj && paymentMode === 'saved') {
                    setCardVerifiedState(true, cardObj.cardLast4, cardObj.brand);
                }
            });
        }

        if (gatewayTabSaved) {
            gatewayTabSaved.addEventListener('click', () => setPaymentMode('saved'));
        }
        if (gatewayTabNew) {
            gatewayTabNew.addEventListener('click', () => setPaymentMode('new'));
        }
        if (gatewaySwitchNewBtn) {
            gatewaySwitchNewBtn.addEventListener('click', () => setPaymentMode('new'));
        }

        function getActiveDraft() {
            try {
                const raw = sessionStorage.getItem(STORAGE_DRAFT_RESERVE) || localStorage.getItem(STORAGE_DRAFT_RESERVE);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && typeof parsed === 'object') return parsed;
                }
            } catch (e) {}

            const imgEl = document.getElementById('reserve-car-img');
            const logoEl = document.getElementById('reserve-car-logo');
            const nameEl = document.getElementById('reserve-car-name');
            const rateEl = document.getElementById('reserve-car-rate');
            const pLocEl = document.getElementById('reserve-locked-pickup-loc');
            const rLocEl = document.getElementById('reserve-locked-return-loc');
            const pDateEl = document.getElementById('reserve-locked-pickup-date');
            const rDateEl = document.getElementById('reserve-locked-return-date');

            const dailyPrice = rateEl ? (parseInt(rateEl.textContent.replace(/\D/g, ''), 10) || 108) : 108;
            const pickupDate = (pDateEl && pDateEl.textContent.trim()) || '2026-10-28';
            const returnDate = (rDateEl && rDateEl.textContent.trim()) || '2026-10-29';
            const d1 = new Date(pickupDate + 'T00:00:00');
            const d2 = new Date(returnDate + 'T00:00:00');
            const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
            const days = Math.max(1, (isNaN(diffDays) ? 0 : diffDays) + 1);

            return {
                model: (nameEl && nameEl.textContent.trim()) || 'BYD Atto 3',
                dailyPrice,
                image: imgEl ? imgEl.getAttribute('src') : 'images/cars/BYD-Atto_3-2023-HD-c6d412e81c7fb2f19f29fc71c801a09828a964d3f.jpg?v=4',
                brandLogo: logoEl ? logoEl.getAttribute('src') : 'images/logos/byd-seeklogo.svg?v=6',
                type: 'EV',
                transmission: 'Automatic',
                seats: '5 seats',
                battery: '60.0 kWh',
                pickupLocCode: 'alexandra',
                pickupLocName: (pLocEl && pLocEl.textContent.trim()) || 'Alexandra Main Branch',
                returnLocCode: 'airport',
                returnLocName: (rLocEl && rLocEl.textContent.trim()) || 'Changi Airport Branch',
                pickupDate,
                returnDate,
                pickupTime: reservePickupTimeSelect ? reservePickupTimeSelect.value : '10:00',
                returnTime: reserveReturnTimeSelect ? reserveReturnTimeSelect.value : '10:00',
                days,
                totalPrice: days * dailyPrice
            };
        }

        function saveActiveDraft(draft) {
            try {
                const str = JSON.stringify(draft);
                sessionStorage.setItem(STORAGE_DRAFT_RESERVE, str);
                localStorage.setItem(STORAGE_DRAFT_RESERVE, str);
            } catch (e) {}
        }

        function getLocationIconSrc(loc) {
            const str = (loc || '').toLowerCase();
            if (str.includes('car park') || str === 'orchard' || str === 'jurong' || str === 'woodlands') {
                return 'images/square-parking.svg';
            }
            return 'images/warehouse.svg';
        }

        function isAlexandraPickup(draft) {
            if (!draft) return false;
            const code = String(draft.pickupLocCode || '').toLowerCase();
            const name = String(draft.pickupLocName || '').toLowerCase();
            return code === 'alexandra' || name.includes('alexandra');
        }

        function renderReservePage(draft) {
            if (!draft) return;
            const imgEl = document.getElementById('reserve-car-img');
            const logoEl = document.getElementById('reserve-car-logo');
            const nameEl = document.getElementById('reserve-car-name');
            const rateEl = document.getElementById('reserve-car-rate');

            if (imgEl && draft.image) imgEl.src = draft.image;
            if (logoEl && draft.brandLogo) logoEl.src = draft.brandLogo;
            if (nameEl) nameEl.textContent = draft.model || 'Electric Vehicle';
            if (rateEl) rateEl.textContent = `S$${draft.dailyPrice} / day`;

            const pLocEl = document.getElementById('reserve-locked-pickup-loc');
            const rLocEl = document.getElementById('reserve-locked-return-loc');
            const pLocIcon = document.getElementById('reserve-locked-pickup-icon');
            const rLocIcon = document.getElementById('reserve-locked-return-icon');
            const pDateEl = document.getElementById('reserve-locked-pickup-date');
            const rDateEl = document.getElementById('reserve-locked-return-date');
            const durBadge = document.getElementById('reserve-duration-badge');

            if (pLocEl) pLocEl.textContent = draft.pickupLocName;
            if (rLocEl) rLocEl.textContent = draft.returnLocName;
            if (pLocIcon) pLocIcon.src = getLocationIconSrc(draft.pickupLocCode || draft.pickupLocName);
            if (rLocIcon) rLocIcon.src = getLocationIconSrc(draft.returnLocCode || draft.returnLocName);
            if (pDateEl) pDateEl.textContent = draft.pickupDate;
            if (rDateEl) rDateEl.textContent = draft.returnDate;

            const d1 = new Date(draft.pickupDate + 'T00:00:00');
            const d2 = new Date(draft.returnDate + 'T00:00:00');
            const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
            const days = Math.max(1, diffDays + 1);
            const totalPrice = days * draft.dailyPrice;
            draft.days = days;
            draft.totalPrice = totalPrice;

            if (durBadge) {
                durBadge.textContent = `${days} ${days === 1 ? 'Day' : 'Days'}`;
            }

            const costCalc = document.getElementById('reserve-cost-calc');
            const costSub = document.getElementById('reserve-cost-subtotal');
            const costTotal = document.getElementById('reserve-cost-total');
            if (costCalc) costCalc.innerHTML = `S$${draft.dailyPrice} &times; ${days} ${days === 1 ? 'day' : 'days'}`;
            if (costSub) costSub.textContent = `S$${totalPrice}`;
            if (costTotal) costTotal.textContent = `S${totalPrice}`;

            const isAlexPickup = isAlexandraPickup(draft);
            const branchHoursPill = document.getElementById('reserve-branch-hours-pill');
            if (branchHoursPill) {
                branchHoursPill.style.display = isAlexPickup ? 'inline-flex' : 'none';
            }

            if (isAlexPickup && draft.pickupTime && (draft.pickupTime < '08:00' || draft.pickupTime > '21:00')) {
                draft.pickupTime = '';
            }

            if (reservePickupTimeSelect) reservePickupTimeSelect.value = draft.pickupTime || '';
            if (reserveReturnTimeSelect) reserveReturnTimeSelect.value = draft.returnTime || '';
            syncSameDayTimeOptions();
            clearReserveTimeErrors();
            clearPaymentErrors();
            if (reservePaymentForm) reservePaymentForm.reset();
            updateCardBrandLogos(null);
            setCardVerifiedState(false);
            setReserveStep(1);
        }

        function getTodayDateAndTime() {
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const hh = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            return {
                todayStr: `${yyyy}-${mm}-${dd}`,
                currentHHMM: `${hh}:${min}`
            };
        }

        function syncSameDayTimeOptions() {
            const draft = getActiveDraft();
            const { todayStr, currentHHMM } = getTodayDateAndTime();
            const isSameDay = Boolean(draft && draft.pickupDate && draft.returnDate && draft.pickupDate === draft.returnDate);
            const isPickupToday = Boolean(draft && draft.pickupDate === todayStr);
            const isReturnToday = Boolean(draft && draft.returnDate === todayStr);
            const isAlexPickup = isAlexandraPickup(draft);

            const pTime = reservePickupTimeSelect ? reservePickupTimeSelect.value : '';
            const rTime = reserveReturnTimeSelect ? reserveReturnTimeSelect.value : '';

            if (reservePickupTimeSelect) {
                Array.from(reservePickupTimeSelect.options).forEach(opt => {
                    if (!opt.value) return;
                    const isPastToday = isPickupToday && opt.value <= currentHHMM;
                    const isInvalidSameDay = isSameDay && (opt.value === '23:30' || (rTime && opt.value >= rTime));
                    const isOutsideBranchHours = isAlexPickup && (opt.value < '08:00' || opt.value > '21:00');
                    opt.disabled = Boolean(isPastToday || isInvalidSameDay || isOutsideBranchHours);
                });
                if (reservePickupTimeSelect.selectedOptions && reservePickupTimeSelect.selectedOptions[0] && reservePickupTimeSelect.selectedOptions[0].disabled) {
                    reservePickupTimeSelect.value = '';
                }
            }

            if (reserveReturnTimeSelect) {
                Array.from(reserveReturnTimeSelect.options).forEach(opt => {
                    if (!opt.value) return;
                    const isPastToday = isReturnToday && opt.value <= currentHHMM;
                    const isInvalidSameDay = isSameDay && (opt.value === '00:00' || (pTime && opt.value <= pTime));
                    opt.disabled = Boolean(isPastToday || isInvalidSameDay);
                });
                if (reserveReturnTimeSelect.selectedOptions && reserveReturnTimeSelect.selectedOptions[0] && reserveReturnTimeSelect.selectedOptions[0].disabled) {
                    reserveReturnTimeSelect.value = '';
                }
            }
        }

        function validateReserveTimes() {
            clearReserveTimeErrors();
            syncSameDayTimeOptions();
            const draft = getActiveDraft();
            const { todayStr, currentHHMM } = getTodayDateAndTime();
            const isAlexPickup = isAlexandraPickup(draft);
            const pTime = reservePickupTimeSelect ? reservePickupTimeSelect.value : '';
            const rTime = reserveReturnTimeSelect ? reserveReturnTimeSelect.value : '';

            let isValid = true;
            if (!pTime) {
                setReserveTimeError('field-reserve-pickup-time', 'Please select a pickup time.');
                isValid = false;
            } else if (draft && draft.pickupDate === todayStr && pTime <= currentHHMM) {
                setReserveTimeError('field-reserve-pickup-time', 'Selected pickup time has already passed today.');
                isValid = false;
            } else if (isAlexPickup && (pTime < '08:00' || pTime > '21:00')) {
                setReserveTimeError('field-reserve-pickup-time', 'Alexandra Main Branch counter is open 08:00 – 21:00 for pickup.');
                isValid = false;
            }

            if (!rTime) {
                setReserveTimeError('field-reserve-return-time', 'Please select a return time.');
                isValid = false;
            } else if (draft && draft.returnDate === todayStr && rTime <= currentHHMM) {
                setReserveTimeError('field-reserve-return-time', 'Selected return time has already passed today.');
                isValid = false;
            }

            if (pTime && rTime && draft && draft.pickupDate === draft.returnDate) {
                if (rTime < pTime) {
                    setReserveTimeError('field-reserve-return-time', 'Return time cannot be earlier than pickup time on the same day.');
                    isValid = false;
                } else if (rTime === pTime) {
                    setReserveTimeError('field-reserve-return-time', 'Return time must be at least 30 minutes after pickup time on the same day.');
                    isValid = false;
                }
            }
            return isValid;
        }

        if (reservePickupTimeSelect) {
            reservePickupTimeSelect.addEventListener('focus', syncSameDayTimeOptions);
            reservePickupTimeSelect.addEventListener('change', () => {
                clearReserveTimeErrors();
                syncSameDayTimeOptions();
            });
        }

        if (reserveReturnTimeSelect) {
            reserveReturnTimeSelect.addEventListener('focus', syncSameDayTimeOptions);
            reserveReturnTimeSelect.addEventListener('change', () => {
                clearReserveTimeErrors();
                syncSameDayTimeOptions();
            });
        }

        document.addEventListener('click', (e) => {
            const rentBtn = e.target.closest('.ev-card-btn');
            if (!rentBtn) return;
            e.preventDefault();

            const user = getCurrentUser();
            if (!user) {
                openModal('login');
                showTopToast('Please log in first to proceed with your reservation.', 'warning');
                return;
            }

            const sPLoc = document.getElementById('search-pickup-location');
            const sRLoc = document.getElementById('search-return-location');
            const sPDate = document.getElementById('search-pickup-date');
            const sRDate = document.getElementById('search-return-date');

            const hPLoc = document.getElementById('pickup-location');
            const hRLoc = document.getElementById('return-location');
            const hPDate = document.getElementById('pickup-date');
            const hRDate = document.getElementById('return-date');

            const pLoc = (sPLoc && sPLoc.value) || (hPLoc && hPLoc.value) || '';
            const rLoc = (sRLoc && sRLoc.value) || (hRLoc && hRLoc.value) || '';
            const pDate = (sPDate && sPDate.value) || (hPDate && hPDate.value) || '';
            const rDate = (sRDate && sRDate.value) || (hRDate && hRDate.value) || '';

            if (!pLoc || !rLoc || !pDate || !rDate || rDate < pDate) {
                window.location.hash = 'search';
                showTopToast('Please select your pickup & return locations and dates first.', 'warning');
                return;
            }

            const card = rentBtn.closest('.ev-card');
            if (!card) return;

            const model = rentBtn.dataset.model || (card.querySelector('.ev-card-title') ? card.querySelector('.ev-card-title').textContent.trim() : 'EV');
            const dailyPrice = parseInt(card.dataset.price, 10) || 108;
            const imgEl = card.querySelector('.ev-real-image');
            const logoEl = card.querySelector('.ev-card-brand-logo');
            const specItems = card.querySelectorAll('.ev-spec-text');

            const d1 = new Date(pDate + 'T00:00:00');
            const d2 = new Date(rDate + 'T00:00:00');
            const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
            const days = Math.max(1, diffDays + 1);

            const draft = {
                model,
                dailyPrice,
                image: imgEl ? imgEl.getAttribute('src') : '',
                brandLogo: logoEl ? logoEl.getAttribute('src') : '',
                type: specItems[0] ? specItems[0].textContent.trim() : 'EV',
                transmission: specItems[1] ? specItems[1].textContent.trim() : 'Automatic',
                seats: specItems[2] ? specItems[2].textContent.trim() : '5 seats',
                battery: specItems[3] ? specItems[3].textContent.trim() : '60.0 kWh',
                pickupLocCode: pLoc,
                pickupLocName: LOCATION_LABELS[pLoc] || pLoc,
                returnLocCode: rLoc,
                returnLocName: LOCATION_LABELS[rLoc] || rLoc,
                pickupDate: pDate,
                returnDate: rDate,
                days,
                totalPrice: days * dailyPrice
            };

            saveActiveDraft(draft);
            renderReservePage(draft);
            window.location.hash = 'reserve';
        });

        if (reserveBackBtn) {
            reserveBackBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (currentReserveStep === 3) return;
                if (currentReserveStep === 2) {
                    setReserveStep(1);
                } else {
                    window.location.hash = 'search';
                }
            });
        }

        if (reservePaymentBackBtn) {
            reservePaymentBackBtn.addEventListener('click', () => {
                if (currentReserveStep === 2) setReserveStep(1);
            });
        }
        if (payEditTimeBtn) {
            payEditTimeBtn.addEventListener('click', () => {
                if (currentReserveStep === 2) setReserveStep(1);
            });
        }

        if (reserveTimeForm) {
            reserveTimeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (!validateReserveTimes()) return;

                const draft = getActiveDraft();
                if (draft) {
                    draft.pickupTime = reservePickupTimeSelect.value;
                    draft.returnTime = reserveReturnTimeSelect.value;
                    saveActiveDraft(draft);
                }
                setReserveStep(2);
            });
        }

        if (reservePaymentForm) {
            reservePaymentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (isCardVerified || isCardVerifying) return;
                clearPaymentErrors();

                const holderName = (payCardNameInput ? payCardNameInput.value : '').trim();
                const rawCardDigits = (payCardNumberInput ? payCardNumberInput.value : '').replace(/\D/g, '');
                const expiryVal = (payCardExpiryInput ? payCardExpiryInput.value : '').trim();
                const cvvDigits = (payCardCvvInput ? payCardCvvInput.value : '').replace(/\D/g, '');

                let isValid = true;
                if (!holderName) {
                    setPaymentError('field-pay-name', 'Please enter the cardholder name.');
                    isValid = false;
                }
                const detectedBrand = detectCardBrand(rawCardDigits);
                const expectedLen = detectedBrand === 'amex' ? 15 : 16;
                if (!detectedBrand) {
                    setPaymentError('field-pay-number', 'Unsupported card network. Use Visa, Mastercard, Amex, Discover, or JCB.');
                    isValid = false;
                } else if (rawCardDigits.length !== expectedLen) {
                    setPaymentError('field-pay-number', `Please enter a valid ${expectedLen}-digit card number.`);
                    isValid = false;
                }
                if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryVal)) {
                    setPaymentError('field-pay-expiry', 'Enter a valid expiry (MM/YY).');
                    isValid = false;
                } else {
                    const [mmStr, yyStr] = expiryVal.split('/');
                    const expMonth = parseInt(mmStr, 10);
                    const expYear = 2000 + parseInt(yyStr, 10);
                    const now = new Date();
                    const curYear = now.getFullYear();
                    const curMonth = now.getMonth() + 1;
                    if (expYear < curYear || (expYear === curYear && expMonth < curMonth)) {
                        setPaymentError('field-pay-expiry', 'This card has expired.');
                        isValid = false;
                    }
                }
                const expectedCvvLen = detectedBrand === 'amex' ? 4 : 3;
                if (cvvDigits.length !== expectedCvvLen) {
                    setPaymentError('field-pay-cvv', `Enter a valid ${expectedCvvLen}-digit CVV.`);
                    isValid = false;
                }

                if (!isValid) return;

                const cardLast4 = rawCardDigits.slice(-4);
                isCardVerifying = true;
                if (reservePaymentSubmitBtn) {
                    reservePaymentSubmitBtn.classList.add('is-verifying');
                    reservePaymentSubmitBtn.disabled = true;
                }
                verifyTimer = setTimeout(() => {
                    isNewCardVerified = true;
                    newCardLast4 = cardLast4;
                    newCardBrand = detectedBrand;
                    setCardVerifiedState(true, cardLast4, detectedBrand);
                }, 750);
            });
        }

        const paymentProcessingOverlay = document.getElementById('payment-processing-overlay');
        let isProcessingPayment = false;

        if (billMakePaymentBtn) {
            billMakePaymentBtn.addEventListener('click', () => {
                if (isProcessingPayment) return;
                if (!isCardVerified) {
                    showTopToast('Please verify your credit card first.', 'warning');
                    if (paymentMode === 'saved') {
                        if (paySavedCardCvv) paySavedCardCvv.focus();
                    } else {
                        if (payCardNameInput && !payCardNameInput.value.trim()) {
                            payCardNameInput.focus();
                        } else if (payCardNumberInput) {
                            payCardNumberInput.focus();
                        }
                    }
                    return;
                }

                const user = getCurrentUser();
                if (!user) {
                    openModal('login');
                    showTopToast('Please log in first to complete your payment.', 'warning');
                    return;
                }
                const draft = getActiveDraft();
                if (!draft) return;

                if (paymentMode === 'new' && paySaveCardCheck && paySaveCardCheck.checked && user) {
                    try {
                        const holderName = (payCardNameInput ? payCardNameInput.value : '').trim();
                        const rawDigits = (payCardNumberInput ? payCardNumberInput.value : '').replace(/\D/g, '');
                        const expVal = (payCardExpiryInput ? payCardExpiryInput.value : '').trim();
                        const detectedBrand = detectCardBrand(rawDigits);
                        const cardLast4 = rawDigits.slice(-4);

                        const allUsers = getUsers();
                        const uInDb = allUsers.find(u => u.id === user.id) || user;
                        const existingCards = getUserSavedCards(uInDb);
                        const existIdx = existingCards.findIndex(c => c.cardLast4 === cardLast4 && (c.brand || '').toLowerCase() === (detectedBrand || '').toLowerCase());
                        let targetSavedCard = null;
                        if (existIdx >= 0) {
                            const [existing] = existingCards.splice(existIdx, 1);
                            existingCards.unshift(existing);
                            targetSavedCard = existing;
                        } else if (rawDigits.length >= 15) {
                            const newCardData = {
                                id: 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                                cardName: holderName || user.name || 'Cardholder',
                                cardLast4: cardLast4,
                                cardNumberFormatted: formatCardNumber(rawDigits, detectedBrand),
                                cardExpiry: expVal,
                                brand: (detectedBrand || 'visa').toUpperCase(),
                                createdAt: Date.now()
                            };
                            existingCards.unshift(newCardData);
                            targetSavedCard = newCardData;
                        }
                        if (targetSavedCard) {
                            uInDb.savedCards = existingCards;
                            uInDb.savedCard = targetSavedCard;
                            saveUsers(allUsers);
                            user.savedCards = existingCards;
                            user.savedCard = targetSavedCard;
                            setCurrentUser(user);
                            selectedSavedCardId = targetSavedCard.id;
                            if (typeof renderSavedCardUI === 'function') renderSavedCardUI();
                            if (typeof renderPaymentSavedCardsUI === 'function') renderPaymentSavedCardsUI();
                        }
                    } catch (e) {}
                }

                isProcessingPayment = true;

                billMakePaymentBtn.classList.add('is-paying');
                billMakePaymentBtn.disabled = true;
                if (reservePaymentBackBtn) reservePaymentBackBtn.disabled = true;

                setTimeout(() => {
                    if (paymentProcessingOverlay) {
                        paymentProcessingOverlay.classList.add('active');
                        paymentProcessingOverlay.setAttribute('aria-hidden', 'false');
                    }

                    setTimeout(() => {
                        const bookingRef = '#AZ-' + Math.floor(10000 + Math.random() * 90000);
                        const cardLast4 = verifiedCardLast4 || '4242';
                        const pTime = draft.pickupTime || (reservePickupTimeSelect ? reservePickupTimeSelect.value : '10:00');
                        const rTime = draft.returnTime || (reserveReturnTimeSelect ? reserveReturnTimeSelect.value : '10:00');

                        const newBooking = {
                            id: 'bk-' + Date.now(),
                            ref: bookingRef,
                            userId: user.id,
                            userName: user.name,
                            userEmail: user.email,
                            status: 'upcoming',
                            model: draft.model,
                            dailyPrice: draft.dailyPrice,
                            image: draft.image,
                            brandLogo: draft.brandLogo,
                            type: draft.type,
                            transmission: draft.transmission,
                            seats: draft.seats,
                            battery: draft.battery,
                            pickupLocCode: draft.pickupLocCode,
                            pickupLocName: draft.pickupLocName,
                            returnLocCode: draft.returnLocCode,
                            returnLocName: draft.returnLocName,
                            pickupDate: draft.pickupDate,
                            returnDate: draft.returnDate,
                            pickupTime: pTime,
                            returnTime: rTime,
                            days: draft.days,
                            totalPrice: draft.totalPrice,
                            cardLast4: cardLast4,
                            createdAt: new Date().toISOString()
                        };

                        addBookingForCurrentUser(newBooking);

                        if (completedBookingRef) completedBookingRef.textContent = bookingRef;
                        if (completedCarName) completedCarName.textContent = newBooking.model;
                        if (completedPickupInfo) completedPickupInfo.textContent = `${newBooking.pickupLocName} · ${newBooking.pickupDate} ${pTime}`;
                        if (completedReturnInfo) completedReturnInfo.textContent = `${newBooking.returnLocName} · ${newBooking.returnDate} ${rTime}`;
                        if (completedCardInfo) completedCardInfo.textContent = `Card ending in •••• ${cardLast4}`;
                        if (completedTotalPaid) completedTotalPaid.textContent = `S$${newBooking.totalPrice}`;

                        if (paymentProcessingOverlay) {
                            paymentProcessingOverlay.classList.remove('active');
                            paymentProcessingOverlay.setAttribute('aria-hidden', 'true');
                        }
                        billMakePaymentBtn.classList.remove('is-paying');
                        billMakePaymentBtn.disabled = false;
                        if (reservePaymentBackBtn) reservePaymentBackBtn.disabled = false;
                        isProcessingPayment = false;

                        setReserveStep(3);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        showTopToast(`Payment completed! Booking ${bookingRef} has been saved to your account.`, 'success');
                    }, 1150);
                }, 700);
            });
        }

        if (completedViewBookingsBtn) {
            completedViewBookingsBtn.addEventListener('click', () => {
                openBookingModal();
            });
        }
        if (completedHomeBtn) {
            completedHomeBtn.addEventListener('click', () => {
                window.location.hash = 'home';
            });
        }

        const initDraft = getActiveDraft();
        if (initDraft) {
            renderReservePage(initDraft);
        }
    })();

    (function initVehicleDetailsModal() {
        const modal = document.getElementById('ev-details-modal');
        const contentBox = document.getElementById('ev-details-content');
        const closeBtn = document.getElementById('ev-details-close');
        if (!modal || !contentBox) return;

        const EV_VEHICLE_DETAILS = {
            'BYD Atto 3': {
                model: 'BYD Atto 3',
                brand: 'BYD',
                brandLogo: 'images/logos/byd-seeklogo.svg?v=6',
                image: 'images/cars/BYD-Atto_3-2023-HD-c6d412e81c7fb2f19f29fc71c801a09828a964d3f.jpg?v=4',
                type: 'Compact SUV',
                dailyPrice: 108,
                tagline: 'Dynamic Electric Crossover',
                overview: 'The BYD Atto 3 blends energetic athletic styling with BYD’s industry-leading ultra-safe Blade Battery architecture. Crafted for modern urban living in Singapore, it features an expansive panoramic sunroof, an intelligent 12.8-inch rotating touchscreen, and responsive driver assistance for effortless journeys across the island.',
                specs: [
                    { name: 'Body Type', val: 'Compact Electric SUV' },
                    { name: 'Seating Capacity', val: '5 Adults' },
                    { name: 'Driving Range (WLTP)', val: '420 km' },
                    { name: 'Battery Capacity', val: '60.5 kWh (Blade LFP)' },
                    { name: 'Acceleration (0–100 km/h)', val: '7.3 seconds' },
                    { name: 'Fast Charging (DC)', val: '29 min (30% to 80%)' },
                    { name: 'Drivetrain & Motor', val: 'Front-Wheel Drive (150 kW / 201 hp)' },
                    { name: 'Luggage / Trunk Capacity', val: '440 L (Expandable to 1,340 L)' },
                    { name: 'Transmission', val: 'Single-Speed Automatic' }
                ]
            },
            'Tesla Model 3': {
                model: 'Tesla Model 3',
                brand: 'Tesla',
                brandLogo: 'images/logos/tesla.svg?v=2',
                image: 'images/cars/Tesla-Model_3-2018-Front_Three-Quarter.669d31aa.jpg?v=2',
                type: 'Premium Sedan',
                dailyPrice: 138,
                tagline: 'Benchmark Electric Sport Sedan',
                overview: 'Renowned for its minimalist luxury and class-leading software ecosystem, the Tesla Model 3 delivers whisper-quiet acceleration and supreme aerodynamic efficiency. Enjoy full glass roof panoramas, seamless Supercharging access across Singapore, and responsive autopilot driver assistance on every trip.',
                specs: [
                    { name: 'Body Type', val: 'Premium Electric Sedan' },
                    { name: 'Seating Capacity', val: '5 Adults' },
                    { name: 'Driving Range (WLTP)', val: '491 km' },
                    { name: 'Battery Capacity', val: '60.0 kWh (LFP Pack)' },
                    { name: 'Acceleration (0–100 km/h)', val: '6.1 seconds' },
                    { name: 'Fast Charging (DC)', val: '15 min (Supercharger: up to 275 km)' },
                    { name: 'Drivetrain & Motor', val: 'Rear-Wheel Drive (208 kW / 279 hp)' },
                    { name: 'Luggage / Trunk Capacity', val: '594 L (Rear Trunk + Front Frunk)' },
                    { name: 'Transmission', val: 'Single-Speed Automatic' }
                ]
            },
            'BYD Dolphin': {
                model: 'BYD Dolphin',
                brand: 'BYD',
                brandLogo: 'images/logos/byd-seeklogo.svg?v=6',
                image: 'images/cars/BYD-Dolphin-2024-HD-f6bb09f91c7f1266a9e34d3b3cecb14c4556f7d42.jpg?v=4',
                type: 'Urban Hatchback',
                dailyPrice: 88,
                tagline: 'Agile & Efficient City Hatchback',
                overview: 'Compact outside yet surprisingly roomy inside, the BYD Dolphin is the quintessential Singapore city runabout. It offers ultra-easy parking in tight multi-storey carparks, nimble turning radius, and whisper-quiet electric drive paired with remarkable daily energy efficiency.',
                specs: [
                    { name: 'Body Type', val: 'Urban Electric Hatchback' },
                    { name: 'Seating Capacity', val: '5 Adults' },
                    { name: 'Driving Range (WLTP)', val: '340 km' },
                    { name: 'Battery Capacity', val: '44.9 kWh (Blade LFP)' },
                    { name: 'Acceleration (0–100 km/h)', val: '10.5 seconds' },
                    { name: 'Fast Charging (DC)', val: '29 min (30% to 80%)' },
                    { name: 'Drivetrain & Motor', val: 'Front-Wheel Drive (70 kW / 94 hp)' },
                    { name: 'Luggage / Trunk Capacity', val: '345 L (Expandable to 1,310 L)' },
                    { name: 'Transmission', val: 'Single-Speed Automatic' }
                ]
            },
            'Hyundai Ioniq 5': {
                model: 'Hyundai Ioniq 5',
                brand: 'Hyundai',
                brandLogo: 'images/logos/hyundai.svg?v=2',
                image: 'images/cars/Hyundai-Ioniq_5-2022-HD-f85146b11c7f96772e83d82bd50100b71d44c0d42.jpg?v=4',
                type: 'Crossover SUV',
                dailyPrice: 118,
                tagline: 'Futuristic 800V Retro-Pixel EV',
                overview: 'With its futuristic retro-pixel lighting and lounge-like modular cabin, the Hyundai Ioniq 5 is a modern design icon. Powered by an advanced 800-volt electrical architecture, it charges faster than almost any competitor while delivering couch-level comfort across Marina Bay and Singapore expressways.',
                specs: [
                    { name: 'Body Type', val: 'Crossover Electric SUV' },
                    { name: 'Seating Capacity', val: '5 Adults' },
                    { name: 'Driving Range (WLTP)', val: '430 km' },
                    { name: 'Battery Capacity', val: '72.6 kWh (High-Voltage Pack)' },
                    { name: 'Acceleration (0–100 km/h)', val: '7.4 seconds' },
                    { name: 'Fast Charging (DC)', val: '18 min (800V Ultra-Fast 10% to 80%)' },
                    { name: 'Drivetrain & Motor', val: 'Rear-Wheel Drive (160 kW / 215 hp)' },
                    { name: 'Luggage / Trunk Capacity', val: '527 L (Expandable to 1,587 L + Frunk)' },
                    { name: 'Transmission', val: 'Single-Speed Automatic' }
                ]
            },
            'Tesla Model Y': {
                model: 'Tesla Model Y',
                brand: 'Tesla',
                brandLogo: 'images/logos/tesla.svg?v=2',
                image: 'images/cars/Tesla-Model_Y-2025-HD-523e3c931c7f5d0a4f418b05a89600ac1ce5d0d44.jpg?v=4',
                type: 'Mid-Size SUV',
                dailyPrice: 158,
                tagline: 'Maximum Utility & Cutting-Edge Tech',
                overview: 'The world’s best-selling electric crossover offers cavernous interior cargo space, an elevated commanding seating position, and blistering instant torque. Perfect for family outings, shopping trips, or luggage-heavy airport runs with 5-star safety ratings across the board.',
                specs: [
                    { name: 'Body Type', val: 'Mid-Size Electric SUV' },
                    { name: 'Seating Capacity', val: '5 Adults' },
                    { name: 'Driving Range (WLTP)', val: '455 km' },
                    { name: 'Battery Capacity', val: '75.0 kWh (High-Density Pack)' },
                    { name: 'Acceleration (0–100 km/h)', val: '5.0 seconds' },
                    { name: 'Fast Charging (DC)', val: '15 min (Supercharger: up to 260 km)' },
                    { name: 'Drivetrain & Motor', val: 'Rear-Wheel Drive (220 kW / 295 hp)' },
                    { name: 'Luggage / Trunk Capacity', val: '854 L (Rear Trunk + 117 L Frunk)' },
                    { name: 'Transmission', val: 'Single-Speed Automatic' }
                ]
            },
            'BYD Seal': {
                model: 'BYD Seal',
                brand: 'BYD',
                brandLogo: 'images/logos/byd-seeklogo.svg?v=6',
                image: 'images/cars/BYD-Seal-2024-HD-00ff09881c7f376045ab7597d957e100f5eb9fd47.jpg?v=4',
                type: 'Performance Sedan',
                dailyPrice: 128,
                tagline: 'Ocean Aesthetics Electric Fastback',
                overview: 'Inspired by ocean aesthetics and equipped with revolutionary Cell-to-Body (CTB) battery integration, the BYD Seal delivers razor-sharp sports sedan handling paired with executive luxury. Its heads-up display, Dynaudio 12-speaker audio, and aerodynamic silhouette command attention.',
                specs: [
                    { name: 'Body Type', val: 'Performance Electric Fastback' },
                    { name: 'Seating Capacity', val: '5 Adults' },
                    { name: 'Driving Range (WLTP)', val: '570 km' },
                    { name: 'Battery Capacity', val: '82.5 kWh (Blade CTB Pack)' },
                    { name: 'Acceleration (0–100 km/h)', val: '5.9 seconds' },
                    { name: 'Fast Charging (DC)', val: '26 min (30% to 80%)' },
                    { name: 'Drivetrain & Motor', val: 'Rear-Wheel Drive (230 kW / 308 hp)' },
                    { name: 'Luggage / Trunk Capacity', val: '400 L (Rear Trunk + 53 L Frunk)' },
                    { name: 'Transmission', val: 'Single-Speed Automatic' }
                ]
            },
            'Polestar 2': {
                model: 'Polestar 2',
                brand: 'Polestar',
                brandLogo: 'images/logos/polestar.svg?v=2',
                image: 'images/cars/Polestar-2-2020-HD-c03bca271c7f8e347b951d849a45802675023dd47.jpg?v=4',
                type: 'Fastback Sedan',
                dailyPrice: 148,
                tagline: 'Scandinavian Electric Performance',
                overview: 'Designed in Gothenburg, the Polestar 2 embodies avant-garde Nordic minimalism and driver-centric agility. Native Google Android Automotive brings built-in Google Maps navigation and Assistant voice commands directly to the dashboard, enveloped in premium eco-conscious WeaveTech upholstery.',
                specs: [
                    { name: 'Body Type', val: 'Scandinavian Fastback Sedan' },
                    { name: 'Seating Capacity', val: '5 Adults' },
                    { name: 'Driving Range (WLTP)', val: '540 km' },
                    { name: 'Battery Capacity', val: '78.0 kWh (Long Range Pack)' },
                    { name: 'Acceleration (0–100 km/h)', val: '6.2 seconds' },
                    { name: 'Fast Charging (DC)', val: '35 min (10% to 80%)' },
                    { name: 'Drivetrain & Motor', val: 'Rear-Wheel Drive (220 kW / 299 hp)' },
                    { name: 'Luggage / Trunk Capacity', val: '405 L (Expandable to 1,095 L + Frunk)' },
                    { name: 'Transmission', val: 'Single-Speed Automatic' }
                ]
            },
            'Mercedes-Benz EQB': {
                model: 'Mercedes-Benz EQB',
                brand: 'Mercedes-Benz',
                brandLogo: 'images/logos/mercedes-benz.svg?v=2',
                image: 'images/cars/Mercedes-Benz-EQB-2022-HD-3704759d1c7fcdc6a9716c21cacb91296b6934d48.jpg?v=4',
                type: '7-Seater Luxury SUV',
                dailyPrice: 188,
                tagline: 'Executive Electric Space & Comfort',
                overview: 'The Mercedes-Benz EQB combines hallmark three-pointed star prestige with generous 7-passenger flexibility. Featuring dual widescreen MBUX digital displays, 64-colour ambient mood lighting, and whisper-quiet acoustic insulation, it is the premier luxury choice for larger families and VIP transport in Singapore.',
                specs: [
                    { name: 'Body Type', val: '7-Seater Luxury Electric SUV' },
                    { name: 'Seating Capacity', val: '7 Adults (3-Row 5+2)' },
                    { name: 'Driving Range (WLTP)', val: '423 km' },
                    { name: 'Battery Capacity', val: '66.5 kWh (High-Voltage Pack)' },
                    { name: 'Acceleration (0–100 km/h)', val: '8.9 seconds' },
                    { name: 'Fast Charging (DC)', val: '32 min (10% to 80%)' },
                    { name: 'Drivetrain & Motor', val: 'Front-Wheel Drive (140 kW / 188 hp)' },
                    { name: 'Luggage / Trunk Capacity', val: '495 L (Expandable to 1,710 L)' },
                    { name: 'Transmission', val: 'Single-Speed Automatic' }
                ]
            },
            'BMW i4': {
                model: 'BMW i4',
                brand: 'BMW',
                brandLogo: 'images/logos/bmw.svg?v=2',
                image: 'images/cars/BMW-i4-2022-HD-5d92bb5b1c7fd1d8f1e1dd85b83d01944cec19d4b.jpg?v=4',
                type: 'Gran Coupé Sedan',
                dailyPrice: 178,
                tagline: 'The Ultimate Electric Driving Machine',
                overview: 'The BMW i4 translates the iconic Bavarian ultimate driving pedigree directly into the electric era. Boasting a dramatic BMW Curved Display, rear-wheel drive athletic balance, and breathtaking long-distance grand tourer refinement, it redefines the sports sedan with zero local emissions.',
                specs: [
                    { name: 'Body Type', val: 'Gran Coupé Electric Sedan' },
                    { name: 'Seating Capacity', val: '5 Adults' },
                    { name: 'Driving Range (WLTP)', val: '590 km' },
                    { name: 'Battery Capacity', val: '83.9 kWh (Slim High-Density)' },
                    { name: 'Acceleration (0–100 km/h)', val: '5.7 seconds' },
                    { name: 'Fast Charging (DC)', val: '31 min (10% to 80%)' },
                    { name: 'Drivetrain & Motor', val: 'Rear-Wheel Drive (250 kW / 335 hp)' },
                    { name: 'Luggage / Trunk Capacity', val: '470 L (Expandable to 1,290 L Gran Coupé)' },
                    { name: 'Transmission', val: 'Single-Speed Automatic' }
                ]
            }
        };

        function openDetails(modelName) {
            const data = EV_VEHICLE_DETAILS[modelName];
            if (!data) return;

            const card = document.querySelector(`.ev-card button[data-model="${modelName}"]`)?.closest('.ev-card');
            const imgSrc = card?.querySelector('.ev-real-image')?.getAttribute('src') || data.image;
            const logoSrc = card?.querySelector('.ev-card-brand-logo')?.getAttribute('src') || data.brandLogo;

            contentBox.innerHTML = `
                <div class="ev-details-layout">
                    <div class="ev-details-left">
                        <div class="ev-details-hero-wrap">
                            <img src="${imgSrc}" alt="${data.model}" class="ev-details-hero-img">
                        </div>

                        <div class="ev-details-left-body">
                            <div class="ev-details-header-meta">
                                <div class="ev-details-brand-badge">
                                    <img src="${logoSrc}" alt="${data.brand}" class="ev-details-brand-img">
                                    <span class="ev-details-type-pill">${data.type}</span>
                                </div>
                                <h2 class="ev-details-car-title">${data.model}</h2>
                                <p class="ev-details-car-tagline">${data.tagline}</p>
                            </div>

                            <div class="ev-details-price-box">
                                <span class="ev-details-price-label">Daily Rental</span>
                                <div class="ev-details-price-row">
                                    <span class="ev-details-price-from">From</span>
                                    <span class="ev-details-price-val">S$${data.dailyPrice}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="ev-details-right">
                        <div class="ev-details-section">
                            <h3 class="ev-details-section-title">About</h3>
                            <p class="ev-details-overview-text">${data.overview}</p>
                        </div>

                        <div class="ev-details-section">
                            <h4 class="ev-details-sub-title">Vehicle Specifications</h4>
                            <div class="ev-spec-table">
                                ${data.specs.map(s => `
                                    <div class="ev-spec-row">
                                        <span class="ev-spec-name">${s.name}</span>
                                        <span class="ev-spec-val">${s.val}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }

        function closeDetails() {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', closeDetails);
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeDetails();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeDetails();
            }
        });

        document.addEventListener('click', (e) => {
            const detailsBtn = e.target.closest('.ev-card-details-btn');
            if (detailsBtn) {
                e.preventDefault();
                const modelName = detailsBtn.dataset.model || detailsBtn.closest('.ev-card')?.querySelector('.ev-card-title')?.textContent?.trim();
                if (modelName) {
                    openDetails(modelName);
                }
                return;
            }

});
    })();

(function initLocationDetailsModal() {
        const modal = document.getElementById('loc-details-modal');
        const contentBox = document.getElementById('loc-details-content');
        const closeBtn = document.getElementById('loc-details-close');
        if (!modal || !contentBox) return;

        const LOCATION_DETAILS = {
            alexandra: {
                id: 'alexandra',
                name: 'Alexandra Main Branch',
                type: 'Flagship Service Branch',
                icon: 'images/warehouse.svg',
                address: '241 Alexandra Road, #01-08 AZoom Automotive Hub, Singapore 159930',
                mrt: 'Queenstown MRT (EW19) / Redhill MRT (EW18) — approx. 6 mins walk',
                hours: 'Counter: 08:00 – 21:00 Daily | 24/7 Smart Return Drop-off',
                phone: '+65 6789 2026',
                email: 'alexandra@azoom.com.sg',
                pinSub: '241 Alexandra Rd, Singapore',
                mapQuery: '241 Alexandra Rd, Singapore'
            },
            airport: {
                id: 'airport',
                name: 'Changi Airport Branch',
                type: 'Airport Transit Terminal Hub',
                icon: 'images/warehouse.svg',
                address: '65 Airport Boulevard, Changi Airport Terminal 3 (Car Park B2, Hub Bays #B2-45 to #B2-55), Singapore 819663',
                mrt: 'Changi Airport MRT (CG2) — direct connection to Terminal 3 B2',
                hours: '24/7 Round-the-Clock (24 Hours Daily)',
                phone: '+65 6789 2028',
                email: 'changi@azoom.com.sg',
                pinSub: 'Terminal 3 B2 Hub, Singapore',
                mapQuery: 'Changi Airport Terminal 3'
            },
            orchard: {
                id: 'orchard',
                name: 'Orchard Car Park',
                type: 'Automated Smart EV Hub',
                icon: 'images/square-parking.svg',
                address: '2 Orchard Turn, ION Orchard Basement 3 (EV Smart Bays #B3-12 to #B3-18), Singapore 238801',
                mrt: 'Orchard MRT (NS22 / TE14) — direct lift link to Basement 3',
                hours: '24/7 Contactless Smart Pickup & Automated Return',
                phone: '+65 6789 2026',
                email: 'support@azoom.com.sg',
                pinSub: 'ION Orchard B3, Singapore',
                mapQuery: 'ION Orchard, Singapore'
            },
            jurong: {
                id: 'jurong',
                name: 'Jurong East Car Park',
                type: 'Automated Smart EV Hub',
                icon: 'images/square-parking.svg',
                address: '3 Gateway Drive, Westgate Integrated Car Park Level 3 (Lots #03-20 to #03-26), Singapore 608532',
                mrt: 'Jurong East MRT (NS1 / EW24) — direct sheltered link to Westgate',
                hours: '24/7 Contactless Smart Pickup & Automated Return',
                phone: '+65 6789 2026',
                email: 'support@azoom.com.sg',
                pinSub: 'Westgate Level 3, Singapore',
                mapQuery: 'Westgate, Singapore'
            },
            woodlands: {
                id: 'woodlands',
                name: 'Woodlands Car Park',
                type: 'Automated Smart EV Hub',
                icon: 'images/square-parking.svg',
                address: '6 Woodlands Square, Woods Square Tower 1 (Basement 1 Car Park, Lots #B1-05 to #B1-12), Singapore 737737',
                mrt: 'Woodlands MRT (NS9 / TE2) — direct sheltered mall link',
                hours: '24/7 Contactless Smart Pickup & Automated Return',
                phone: '+65 6789 2026',
                email: 'support@azoom.com.sg',
                pinSub: 'Woods Square B1, Singapore',
                mapQuery: 'Woods Square, Singapore'
            }
        };

        function openLocationDetails(locId) {
            const loc = LOCATION_DETAILS[locId];
            if (!loc) return;

            contentBox.innerHTML = `
                <div class="loc-details-layout">
                    <div class="loc-details-left">
                        <div class="loc-details-header">
                            <h2 class="loc-details-title">
                                <img src="${loc.icon}" alt="" class="loc-details-title-icon">
                                <span>${loc.name}</span>
                            </h2>
                        </div>

                        <div class="loc-details-info-list">
                            <div class="loc-info-item">
                                <img src="images/map-pinned.svg" alt="" class="loc-info-icon">
                                <div class="loc-info-text-group">
                                    <span class="loc-info-label">Address</span>
                                    <span class="loc-info-val">${loc.address}</span>
                                </div>
                            </div>

                            <div class="loc-info-item">
                                <img src="images/navigation.svg" alt="" class="loc-info-icon">
                                <div class="loc-info-text-group">
                                    <span class="loc-info-label">Nearest MRT</span>
                                    <span class="loc-info-val">${loc.mrt}</span>
                                </div>
                            </div>

                            <div class="loc-info-item">
                                <img src="images/calendar.svg" alt="" class="loc-info-icon">
                                <div class="loc-info-text-group">
                                    <span class="loc-info-label">Operating Hours</span>
                                    <span class="loc-info-val">${loc.hours}</span>
                                </div>
                            </div>

                            <div class="loc-info-item">
                                <img src="images/phone.svg" alt="" class="loc-info-icon">
                                <div class="loc-info-text-group">
                                    <span class="loc-info-label">Contact Num</span>
                                    <a href="tel:${loc.phone.replace(/\s+/g, '')}" class="loc-info-link">${loc.phone}</a>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div class="loc-details-right">
                        <div class="loc-map-container" id="loc-map-container">
                            <iframe
                                class="loc-google-map-iframe"
                                title="${loc.name.replace(/"/g, '&quot;')} Google Maps"
                                src="https://maps.google.com/maps?q=${encodeURIComponent(loc.mapQuery || loc.address)}&t=&z=16&ie=UTF8&iwloc=&output=embed"
                                loading="lazy"
                                allowfullscreen
                                referrerpolicy="no-referrer-when-downgrade">
                            </iframe>
                        </div>
                    </div>
                </div>
            `;

            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }

        function closeLocationDetails() {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', closeLocationDetails);
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeLocationDetails();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeLocationDetails();
            }
        });

        document.addEventListener('click', (e) => {
            const locBtn = e.target.closest('.loc-details-btn');
            if (locBtn) {
                e.preventDefault();
                const locId = locBtn.dataset.location || locBtn.closest('.location-card')?.dataset?.locId;
                if (locId) {
                    openLocationDetails(locId);
                }
            }
        });
    })();

        const initialHash = window.location.hash.replace('#', '').trim();
    if (initialHash === 'search') {
        showEmptyState();
    }
})();
