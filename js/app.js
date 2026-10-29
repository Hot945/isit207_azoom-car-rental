// 1. 导航栏滚动变色逻辑
const navbar = document.querySelector('.navbar');
// 1. 导航栏状态控制（首页根据滚动动态透明/变色，其他页面始终保持实体）
function updateNavbarScroll() {
    const rawHash = window.location.hash.replace('#', '').trim() || 'home';
    const currentHash = document.getElementById(`page-${rawHash}`) ? rawHash : 'home';
    if (currentHash !== 'home') {
        // 非首页：永远锁定实体奶油底色
        navbar.classList.add('scrolled');
    } else {
        // 首页：只有向下滚动超过 50px 才变色，顶部保持通透半透明
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
}

window.addEventListener('scroll', updateNavbarScroll);
// 2. 页面无缝路由切换逻辑
const pageViews = document.querySelectorAll('.page-view');
const navBtns = document.querySelectorAll('.nav-btn');

// 全局页面切换卡片飞行过渡状态
let cardTransitionState = null;

function runCardFlightAnimation(targetCard, startRect, isForward) {
    if (!targetCard || !startRect) return;

    // 获取目标卡片在当前视口顶部的基准位置
    const endRect = targetCard.getBoundingClientRect();
    const deltaX = startRect.left - endRect.left;
    const deltaY = startRect.top - endRect.top;

    // 倒置变换：先将目标卡片偏移到起点所在的位置
    targetCard.style.transformOrigin = 'center center';
    targetCard.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
    targetCard.style.transition = 'none';
    targetCard.classList.add('search-card-flying');

    // 双帧等待，确保浏览器布局引擎应用了初始偏移后，触发平滑飞行动画
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

            // 超时保底清理，防止偶发事件丢失
            setTimeout(() => {
                targetCard.style.transform = '';
                targetCard.style.transition = '';
                targetCard.classList.remove('search-card-flying');
            }, 550);
        });
    });
}

function navigateTo(targetPage) {
    // 如果目标页面不存在，默认回到 home 并修正地址栏残余的无效 hash
    const targetSection = document.getElementById(`page-${targetPage}`);
    const validPage = targetSection ? targetPage : 'home';
    if (targetPage && !targetSection && window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    // 记录搜索页黄色顶栏精确像素高度，确保切换至预约页时黄色区域高度 100% 一致
    const searchHeaderEl = document.querySelector('#page-search .search-page-header');
    const reserveHeaderEl = document.getElementById('reserve-yellow-header');
    if (searchHeaderEl && reserveHeaderEl && searchHeaderEl.offsetHeight > 0) {
        reserveHeaderEl.style.height = searchHeaderEl.offsetHeight + 'px';
    }

    const wasOnReserve = document.getElementById('page-reserve')?.classList.contains('active');

    // 切换页面展示
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
    // 切换导航栏高亮状态
    navBtns.forEach(btn => {
        if (btn.dataset.target === validPage) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    // 切换页面后将视口平滑复位到顶部，并校准导航栏背景状态
    window.scrollTo({ top: 0, behavior: 'instant' });
    updateNavbarScroll();

    // 切换页面时若弹窗处于打开状态，自动平稳关闭
    const openModal = document.querySelector('.ev-modal-overlay.active');
    if (openModal) {
        openModal.classList.remove('active');
        openModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    }

    // 处理卡片跨页面飞行与内容渐变过渡
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
// 监听 URL Hash 变化（例如从 #about 变回 #home，或用户点击浏览器前进/后退箭头）
function handleHashChange() {
    const rawHash = window.location.hash.replace('#', '').trim();
    navigateTo(rawHash || 'home');
}
window.addEventListener('hashchange', handleHashChange);
// 页面首次打开时，根据 URL 中的 Hash 决定显示哪一页
window.addEventListener('DOMContentLoaded', handleHashChange);
// 监听所有带有 data-target 属性的按钮点击（包括导航栏按钮、Logo）
document.addEventListener('click', (e) => {
    const targetBtn = e.target.closest('[data-target]');
    if (targetBtn) {
        const targetPage = targetBtn.dataset.target;
        // 如果点击的是当前已经在看的页面，直接回滚到顶部
        if (window.location.hash === `#${targetPage}` || (!window.location.hash && targetPage === 'home')) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // 变更 hash，会天然触发上面的 hashchange 监听器
            window.location.hash = targetPage;
        }
    }
    // 点击左上角 Logo 默认回首页
    if (e.target.closest('.logo')) {
        window.location.hash = 'home';
    }
});



// 3. 关于我们页面联络留言表单提交交互
const contactForm = document.getElementById('about-contact-form');
const toastMsg = document.getElementById('form-toast-msg');
if (contactForm && toastMsg) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        toastMsg.classList.add('show');
        contactForm.reset();
        setTimeout(() => {
            toastMsg.classList.remove('show');
        }, 5000);
    });
}

// 4. EV Fleet Filter Modal & Interactive Filtering Logic (Shared between Our EVs and Search Results)
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

    // Filter criteria state
    const DEFAULT_FILTERS = {
        type: 'all',
        brand: 'all',
        seats: 'all',
        maxPrice: 188
    };

    let evsAppliedFilters = { ...DEFAULT_FILTERS };
    let searchAppliedFilters = { ...DEFAULT_FILTERS };
    let draftFilters = { ...DEFAULT_FILTERS };
    let currentContext = 'evs'; // 'evs' or 'search'

    // Helper: get the card list for current active context
    function getContextCards() {
        if (currentContext === 'search') {
            return Array.from(document.querySelectorAll('#search-fleet-grid .ev-card'));
        }
        return Array.from(document.querySelectorAll('#page-evs .ev-card'));
    }

    // Helper: calculate matching count for any given filter criteria
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

    // Helper: update price tooltip text and position below thumb, aligning edges at bounds
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

    // Expose resetSearchFleetFilters so new searches can reset search filters
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

    // Event Listeners
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

// 5. 预订与搜索组件日期联动与范围校验 (Pickup & Return Date Constraints)
(function initDatePickers() {
    // 获取用户本地时间的 YYYY-MM-DD 格式，避免因时区偏差导致日期错误
    function getTodayString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function setupDatePickerPair(pickupDateInput, returnDateInput) {
        if (!pickupDateInput || !returnDateInput) return;

        // 动态同步并约束最小可选日期
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

    // 初始化首页日期输入对
    setupDatePickerPair(
        document.getElementById('pickup-date'),
        document.getElementById('return-date')
    );

    // 初始化独立搜索页日期输入对
    setupDatePickerPair(
        document.getElementById('search-pickup-date'),
        document.getElementById('search-return-date')
    );

    // 全局失焦监听，取消高亮边框
    document.addEventListener('pointerdown', (e) => {
        ['pickup-date', 'return-date', 'search-pickup-date', 'search-return-date'].forEach(id => {
            const el = document.getElementById(id);
            if (el && !e.target.closest(`#${id}`)) {
                el.classList.remove('is-focused');
            }
        });
    });
})();

// 6. 独立搜索结果页面逻辑 (Dedicated Search Results Page)
(function initSearchPage() {
    const homeSearchBtn = document.getElementById('home-search-btn');
    const searchForm = document.getElementById('search-page-form');
    const searchPageBtn = document.getElementById('search-page-submit-btn');

    // 首页输入项
    const homePickupLocation = document.getElementById('pickup-location');
    const homeReturnLocation = document.getElementById('return-location');
    const homePickupDate = document.getElementById('pickup-date');
    const homeReturnDate = document.getElementById('return-date');

    // 搜索页输入项
    const searchPickupLocation = document.getElementById('search-pickup-location');
    const searchReturnLocation = document.getElementById('search-return-location');
    const searchPickupDate = document.getElementById('search-pickup-date');
    const searchReturnDate = document.getElementById('search-return-date');

    // 搜索页展示容器
    const searchEmptyState = document.getElementById('search-empty-state');
    const searchLoadingState = document.getElementById('search-loading-state');
    const searchResultsContent = document.getElementById('search-results-content');
    const searchResultsSummary = document.getElementById('search-results-summary');
    const searchFleetGrid = document.getElementById('search-fleet-grid');

    let hasActiveSearch = false;
    let searchTimer = null;

    // 复制原车辆列表卡片到搜索结果区域
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
                clone.style.display = ''; // 保证可见
                clone.dataset.defaultIndex = card.dataset.defaultIndex !== undefined ? card.dataset.defaultIndex : idx;
                if (!clone.dataset.name) {
                    const titleEl = clone.querySelector('.ev-card-title');
                    clone.dataset.name = titleEl ? titleEl.textContent.trim() : '';
                }
                searchFleetGrid.appendChild(clone);
            });
        }
    }

    // 更新搜索结果摘要文字
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

    // 仅呈现空态（无假装加载）
    function showEmptyState() {
        hasActiveSearch = false;
        if (searchTimer) clearTimeout(searchTimer);
        if (searchLoadingState) searchLoadingState.style.display = 'none';
        if (searchResultsContent) searchResultsContent.style.display = 'none';
        if (searchEmptyState) searchEmptyState.style.display = 'flex';
    }

    // 执行带“假装加载”的搜索呈现（保持屏幕完全静止，不自动滑动页面）
    function executeSearchWithLoading() {
        hasActiveSearch = true;
        populateSearchFleet();
        if (typeof window.resetSearchFleetFilters === 'function') {
            window.resetSearchFleetFilters();
        }

        if (searchTimer) clearTimeout(searchTimer);

        // 隐藏空结果和当前列表
        if (searchEmptyState) searchEmptyState.style.display = 'none';
        if (searchResultsContent) searchResultsContent.style.display = 'none';

        // 显示骨架屏加载卡片（保持当前视口位置不变）
        if (searchLoadingState) {
            searchLoadingState.style.display = 'block';
        }

        // 假装加载 850ms，完成后展示实际车辆结果
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

    // 严格字段校验函数：4 项（取车点、还车点、取车日、还车日）必须全部选过，且还车日不可早于取车日
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
                    void parent.offsetWidth; // 触发回流重新执行抖动动画
                    parent.classList.add('shake');
                }
                if (!firstInvalidEl) firstInvalidEl = field.el;
            } else {
                field.el.classList.remove('input-error');
                if (parent) parent.classList.remove('shake');
            }
        });

        // 日期逻辑二次校验：还车日期必须大于等于取车日期
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

        // 自动聚焦第一个未填写项
        if (firstInvalidEl) {
            firstInvalidEl.focus();
        }

        return isValid;
    }

    // 为输入框挂载实时清除错误提示的监听
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

    // 清除指定区域的校验错误样式
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

    // 首页点击 "Find Cars"：即使未填满也允许直接进入搜索页（未填满时显示空态，填满时展示结果）
    if (homeSearchBtn) {
        homeSearchBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // 1. 提取首页当前已选输入项
            const pLoc = homePickupLocation ? homePickupLocation.value.trim() : '';
            const rLoc = homeReturnLocation ? homeReturnLocation.value.trim() : '';
            const pDate = homePickupDate ? homePickupDate.value.trim() : '';
            const rDate = homeReturnDate ? homeReturnDate.value.trim() : '';

            // 2. 将首页已选内容同步至搜索页对应输入框
            if (searchPickupLocation) searchPickupLocation.value = pLoc;
            if (searchReturnLocation) searchReturnLocation.value = rLoc;
            if (searchPickupDate) searchPickupDate.value = pDate;
            if (searchReturnDate) searchReturnDate.value = rDate;

            // 触发搜索页输入框状态更新与联动
            if (searchPickupLocation && pLoc) searchPickupLocation.dispatchEvent(new Event('change'));
            if (searchReturnLocation && rLoc) searchReturnLocation.dispatchEvent(new Event('change'));
            if (searchPickupDate && pDate) searchPickupDate.dispatchEvent(new Event('change'));
            if (searchReturnDate && rDate) searchReturnDate.dispatchEvent(new Event('change'));

            // 清理所有输入框可能存在的错误高亮，保持进入搜索页时的清爽体验
            clearValidationErrors('');
            clearValidationErrors('search');

            // 3. 校验是否 4 项均已选择且还车日期不早于取车日期
            const isComplete = Boolean(pLoc && rLoc && pDate && rDate && rDate >= pDate);

            // 4. 记录当前首页卡片在屏幕中的坐标用于 FLIP 飞行动画
            const homeCard = document.querySelector('.reservation-card');
            if (homeCard) {
                cardTransitionState = {
                    type: 'home-to-search',
                    startRect: homeCard.getBoundingClientRect()
                };
            }

            // 5. 若已全部填全，直接触发搜索与假装加载；若未填齐，则进入搜索页并展示空态
            if (isComplete) {
                executeSearchWithLoading();
            } else {
                showEmptyState();
            }

            // 6. 平滑跳转至独立搜索页面
            if (window.location.hash === '#search') {
                navigateTo('search');
            } else {
                window.location.hash = 'search';
            }
        });
    }

    // 搜索页点击 "Find Cars" / 提交搜索：严格校验 4 项必填
    function handleSearchPageSubmit() {
        // 1. 严格校验：搜索页 4 个输入框必须全部选择完毕且日期合法
        const isSearchValid = validateSearchInputs('search');
        if (!isSearchValid) {
            // 未填完整时禁止展示结果，保持空结果态并高亮抖动未填项
            showEmptyState();
            return;
        }

        // 2. 全部填写完整，执行带假装加载的搜索呈现
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

    // 搜索页点击 "Back to Home"（触发反向从上到下飞行动画）
    const searchBackBtn = document.getElementById('search-back-btn');
    if (searchBackBtn) {
        searchBackBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // 记录当前搜索页卡片在屏幕中的坐标
            const searchCard = document.querySelector('.search-widget-card');
            if (searchCard) {
                cardTransitionState = {
                    type: 'search-to-home',
                    startRect: searchCard.getBoundingClientRect()
                };
            }

            // 同步搜索页面的输入项回首页
            if (homePickupLocation && searchPickupLocation) homePickupLocation.value = searchPickupLocation.value;
            if (homeReturnLocation && searchReturnLocation) homeReturnLocation.value = searchReturnLocation.value;
            if (homePickupDate && searchPickupDate) homePickupDate.value = searchPickupDate.value;
            if (homeReturnDate && searchReturnDate) homeReturnDate.value = searchReturnDate.value;

            // 触发首页输入框联动校验
            if (homePickupLocation) homePickupLocation.dispatchEvent(new Event('change'));
            if (homeReturnLocation) homeReturnLocation.dispatchEvent(new Event('change'));
            if (homePickupDate) homePickupDate.dispatchEvent(new Event('change'));
            if (homeReturnDate) homeReturnDate.dispatchEvent(new Event('change'));

            // 跳转回首页
            if (window.location.hash === '#home' || !window.location.hash) {
                navigateTo('home');
            } else {
                window.location.hash = 'home';
            }
        });
    }

    // 监听路由变化，若用户直接在地址栏打开 #search，且未进行主动搜索，则呈现空态
    window.addEventListener('hashchange', () => {
        const currentHash = window.location.hash.replace('#', '').trim();
        if (currentHash === 'search') {
            if (!hasActiveSearch) {
                showEmptyState();
            }
        }
    });

    
    // =========================================================================
    // EV Fleet Sorting Logic (Price & Alphabetical A-Z)
    // Shared between Our EVs page and Search Results page
    // =========================================================================
    function createFleetSorter({ priceBtnId, nameBtnId, getContainer }) {
        const sortPriceBtn = document.getElementById(priceBtnId);
        const sortNameBtn = document.getElementById(nameBtnId);
        if (!sortPriceBtn || !sortNameBtn) return null;

        // Sort state: type = 'none' | 'price' | 'name', direction = 'asc' | 'desc'
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
            // Reset Price Button
            sortPriceBtn.classList.remove('is-active', 'is-asc', 'is-desc');
            sortPriceBtn.title = 'Sort by Price: Low to High';
            sortPriceBtn.setAttribute('aria-label', 'Sort by Price: Low to High');

            // Reset Name Button
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

            // Re-append in sorted order and trigger smooth visual reorder transition
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

    // Initialize sorting for Our EVs fleet
    const evsSortController = createFleetSorter({
        priceBtnId: 'ev-sort-price',
        nameBtnId: 'ev-sort-name',
        getContainer: () => document.querySelector('#page-evs .ev-fleet-container')
    });

    // Initialize sorting for Search Results fleet
    const searchSortController = createFleetSorter({
        priceBtnId: 'search-sort-price',
        nameBtnId: 'search-sort-name',
        getContainer: () => document.getElementById('search-fleet-grid')
    });

    window.resetSearchFleetSort = function() {
        if (searchSortController) searchSortController.resetSort();
    };


    // =========================================================================
    // 14. 账户模块 (Client-side Authentication via localStorage)
    // =========================================================================
    (function initAuthModule() {
        const STORAGE_USERS = 'azoom_users';
        const STORAGE_CURRENT_USER = 'azoom_current_user';

        // Pre-seeded demo user accounts
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

        // DOM Elements
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

        // Real-time input listeners to clear errors on typing
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

        // Password visibility toggles (switches between eye-closed.svg and eye.svg)
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

        // Handle Login Submission
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
                // Match case-insensitive email and password
                const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && (u.password === password || (email.toLowerCase() === 'demo@azoom.sg' && (password === '123456' || password === 'password123'))));

                if (!user) {
                    if (loginFeedback) {
                        loginFeedback.className = 'auth-feedback error';
                        loginFeedback.textContent = 'Incorrect email or password. Please try again.';
                        loginFeedback.style.display = 'block';
                    }
                    return;
                }

                // Login successful
                setCurrentUser(user);
                closeModal();
                loginForm.reset();
                const firstName = user.firstName || (user.name || 'User').split(' ')[0];
                showTopToast(`Welcome back, ${firstName}! You are now logged in.`, 'success');
            });
        }

        // Handle Register Submission
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

        // Tab and Switch Handlers
        if (authTabLogin) authTabLogin.addEventListener('click', () => switchTab('login'));
        if (authTabRegister) authTabRegister.addEventListener('click', () => switchTab('register'));
        if (switchToRegister) switchToRegister.addEventListener('click', () => switchTab('register'));
        if (switchToLogin) switchToLogin.addEventListener('click', () => switchTab('login'));

        // Navbar Auth Button Click
        if (authBtn) {
            authBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const user = getCurrentUser();
                if (user) {
                    // Toggle User Dropdown
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

        // Logout Button Click
        if (authLogoutBtn) {
            authLogoutBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                setCurrentUser(null);
                if (authDropdown) authDropdown.style.display = 'none';
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (authDropdown && authDropdown.style.display === 'block') {
                if (!authDropdown.contains(e.target) && e.target !== authBtn && !authBtn.contains(e.target)) {
                    authDropdown.style.display = 'none';
                    if (authBtn) authBtn.setAttribute('aria-expanded', 'false');
                }
            }
        });

        // Close modal handlers
        if (authModalClose) authModalClose.addEventListener('click', closeModal);
        if (authModal) {
            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) closeModal();
            });
        }

        // My Bookings Modal Elements & Logic (Account-Bound Persistent Bookings)
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

        function buildBookingCardHTML(b) {
            const isCompleted = b.status === 'completed';
            const statusClass = isCompleted ? 'status-completed' : 'status-confirmed';
            const statusLabel = isCompleted ? 'Completed' : 'In Progress';
            const durText = `${b.days} ${b.days === 1 ? 'Day' : 'Days'}`;
            const pDateFormatted = `${formatDisplayDate(b.pickupDate)} · ${formatDisplayTime(b.pickupTime)}`;
            const rDateFormatted = `${formatDisplayDate(b.returnDate)} · ${formatDisplayTime(b.returnTime)}`;

            const footerBtns = isCompleted
                ? `<button type="button" class="booking-action-btn btn-solid" data-booking-action="rent-again" data-booking-id="${b.id}">Rent Again</button>`
                : `<button type="button" class="booking-action-btn btn-outline" data-booking-action="cancel" data-booking-id="${b.id}">Cancel Booking</button>
                   <button type="button" class="booking-action-btn btn-solid" data-booking-action="complete" data-booking-id="${b.id}">Mark as Completed</button>`;

            return `
                <div class="booking-item-card ${isCompleted ? 'past-card' : ''}" data-booking-card-id="${b.id}">
                    <div class="booking-item-topbar">
                        <div class="booking-ref-group">
                            <span class="booking-ref-label">Booking Ref</span>
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
                            <span class="booking-total-price">S$${b.totalPrice}</span>
                            <span class="booking-rate-note">S$${b.dailyPrice} / day</span>
                        </div>
                    </div>

                    <div class="booking-item-footer">
                        ${footerBtns}
                    </div>
                </div>
            `;
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

        // Handle actions inside My Bookings modal (Cancel / Mark as Completed / Rent Again)
        if (bookingModal) {
            bookingModal.addEventListener('click', (e) => {
                const actionBtn = e.target.closest('[data-booking-action]');
                if (!actionBtn) return;
                const action = actionBtn.dataset.bookingAction;
                const bookingId = actionBtn.dataset.bookingId;
                if (!bookingId) return;

                if (action === 'cancel') {
                    const updated = getAllBookings().filter(b => b.id !== bookingId);
                    saveAllBookings(updated);
                    renderUserBookings();
                    showTopToast('Booking has been cancelled.', 'success');
                } else if (action === 'complete') {
                    const all = getAllBookings();
                    const target = all.find(b => b.id === bookingId);
                    if (target) {
                        target.status = 'completed';
                        saveAllBookings(all);
                        renderUserBookings();
                        switchBookingTab('past');
                        showTopToast('Booking marked as completed.', 'success');
                    }
                } else if (action === 'rent-again') {
                    closeBookingModal();
                    window.location.hash = 'search';
                }
            });
        }

        function switchBookingTab(tab) {
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

        // Initialize UI on load
        getUsers(); // ensure demo account is seeded
        updateNavAuthUI();

        // =====================================================================
        // 15. 租车预约 3 步流程 (1. Confirm Time -> 2. Make Payment -> 3. Completed)
        // =====================================================================
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

        // Payment Step Elements
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
        const gatewayChangeCardBtn = document.getElementById('gateway-change-card-btn');
        const gatewayModuleShell = document.getElementById('gateway-module-shell');
        const billCardStatusText = document.getElementById('bill-card-status-text');
        const billMakePaymentBtn = document.getElementById('bill-make-payment-btn');
        const billMakePaymentText = document.getElementById('bill-make-payment-text');

        let isCardVerified = false;
        let isCardVerifying = false;
        let verifyTimer = null;
        let verifiedCardLast4 = '';

        function setCardVerifiedState(verified, last4 = '') {
            if (verifyTimer) {
                clearTimeout(verifyTimer);
                verifyTimer = null;
            }
            isCardVerifying = false;
            isCardVerified = verified;
            verifiedCardLast4 = last4;

            if (reservePaymentSubmitBtn) {
                reservePaymentSubmitBtn.classList.remove('is-verifying');
            }

            if (verified) {
                if (gatewayModuleShell) gatewayModuleShell.classList.add('is-verified');
                if (reservePaymentSubmitBtn) {
                    reservePaymentSubmitBtn.classList.add('is-verified');
                    reservePaymentSubmitBtn.disabled = true;
                }
                if (reservePaymentSubmitText) reservePaymentSubmitText.textContent = 'Verified';
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

        // Completed Step Elements
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

            // Reset classes on stepper nodes & lines
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
                // All 3 steps completed, no going back allowed
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

        // Allow clicking Step 1 dot ONLY when on Step 2 (never on Step 3)
        if (stepNode1) {
            stepNode1.addEventListener('click', () => {
                if (currentReserveStep === 2) {
                    setReserveStep(1);
                }
            });
        }

        // Populate 30-minute interval options (00:00 to 23:30)
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

        // Detect card network from leading digits (Visa, Mastercard, Amex, Discover, JCB)
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

        // Format Card Number (Amex 4-6-5 [15 digits] vs Standard 4-4-4-4 [16 digits]), Expiry (MM/YY), and CVV in real time
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

            // Clear first
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

        function getActiveDraft() {
            try {
                const raw = sessionStorage.getItem(STORAGE_DRAFT_RESERVE) || localStorage.getItem(STORAGE_DRAFT_RESERVE);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && typeof parsed === 'object') return parsed;
                }
            } catch (e) {}

            // Fallback: reconstruct from #page-reserve DOM so getActiveDraft() is never null
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
                brandLogo: logoEl ? logoEl.getAttribute('src') : 'images/byd-seeklogo.svg?v=6',
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
            const pDateEl = document.getElementById('reserve-locked-pickup-date');
            const rDateEl = document.getElementById('reserve-locked-return-date');
            const durBadge = document.getElementById('reserve-duration-badge');

            if (pLocEl) pLocEl.textContent = draft.pickupLocName;
            if (rLocEl) rLocEl.textContent = draft.returnLocName;
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
            if (costTotal) costTotal.textContent = `S$${totalPrice}`;

            // Reset time selects & payment inputs for fresh reservation
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

        // Dynamically gray out / disable past times (if date is today) and invalid same-day times
        function syncSameDayTimeOptions() {
            const draft = getActiveDraft();
            const { todayStr, currentHHMM } = getTodayDateAndTime();
            const isSameDay = Boolean(draft && draft.pickupDate && draft.returnDate && draft.pickupDate === draft.returnDate);
            const isPickupToday = Boolean(draft && draft.pickupDate === todayStr);
            const isReturnToday = Boolean(draft && draft.returnDate === todayStr);

            const pTime = reservePickupTimeSelect ? reservePickupTimeSelect.value : '';
            const rTime = reserveReturnTimeSelect ? reserveReturnTimeSelect.value : '';

            if (reservePickupTimeSelect) {
                Array.from(reservePickupTimeSelect.options).forEach(opt => {
                    if (!opt.value) return; // keep placeholder disabled
                    const isPastToday = isPickupToday && opt.value <= currentHHMM;
                    const isInvalidSameDay = isSameDay && (opt.value === '23:30' || (rTime && opt.value >= rTime));
                    opt.disabled = Boolean(isPastToday || isInvalidSameDay);
                });
            }

            if (reserveReturnTimeSelect) {
                Array.from(reserveReturnTimeSelect.options).forEach(opt => {
                    if (!opt.value) return; // keep placeholder disabled
                    const isPastToday = isReturnToday && opt.value <= currentHHMM;
                    const isInvalidSameDay = isSameDay && (opt.value === '00:00' || (pTime && opt.value <= pTime));
                    opt.disabled = Boolean(isPastToday || isInvalidSameDay);
                });
            }
        }

        // Validate Same-Day & Today Past-Time Constraints on change & submit
        function validateReserveTimes() {
            clearReserveTimeErrors();
            syncSameDayTimeOptions();
            const draft = getActiveDraft();
            const { todayStr, currentHHMM } = getTodayDateAndTime();
            const pTime = reservePickupTimeSelect ? reservePickupTimeSelect.value : '';
            const rTime = reserveReturnTimeSelect ? reserveReturnTimeSelect.value : '';

            let isValid = true;
            if (!pTime) {
                setReserveTimeError('field-reserve-pickup-time', 'Please select a pickup time.');
                isValid = false;
            } else if (draft && draft.pickupDate === todayStr && pTime <= currentHHMM) {
                setReserveTimeError('field-reserve-pickup-time', 'Selected pickup time has already passed today.');
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

        // Delegate clicks on all ".ev-card-btn" (Rent Now buttons)
        document.addEventListener('click', (e) => {
            const rentBtn = e.target.closest('.ev-card-btn');
            if (!rentBtn) return;
            e.preventDefault();

            // 1. Check login state first
            const user = getCurrentUser();
            if (!user) {
                openModal('login');
                showTopToast('Please log in first to proceed with your reservation.', 'warning');
                return;
            }

            // 2. Check selected pickup/return location and dates
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

            // 3. Extract vehicle metadata from the clicked .ev-card
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

        // Top-left Back Button behavior depends on currentReserveStep (disabled on Step 3)
        if (reserveBackBtn) {
            reserveBackBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (currentReserveStep === 3) return; // Cannot go back from Step 3
                if (currentReserveStep === 2) {
                    setReserveStep(1);
                } else {
                    window.location.hash = 'search';
                }
            });
        }

        // Step 2 -> Step 1 Back buttons inside payment card
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

        // Step 1 Submit -> Advance to Step 2 (Make Payment)
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

        // Right Gateway Module Submit -> Verify Card Only
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
                    setCardVerifiedState(true, cardLast4);
                }, 750);
            });
        }

        // Left Billing Summary -> Standalone Make Payment Button (3-Dots -> Full-Screen Spinner -> Completed + Check Animation)
        const paymentProcessingOverlay = document.getElementById('payment-processing-overlay');
        let isProcessingPayment = false;

        if (billMakePaymentBtn) {
            billMakePaymentBtn.addEventListener('click', () => {
                if (isProcessingPayment) return;
                if (!isCardVerified) {
                    showTopToast('Please verify your credit card first.', 'warning');
                    if (payCardNameInput && !payCardNameInput.value.trim()) {
                        payCardNameInput.focus();
                    } else if (payCardNumberInput) {
                        payCardNumberInput.focus();
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

                isProcessingPayment = true;

                // Stage 1: Button shows 3 bouncing dots
                billMakePaymentBtn.classList.add('is-paying');
                billMakePaymentBtn.disabled = true;
                if (reservePaymentBackBtn) reservePaymentBackBtn.disabled = true;

                setTimeout(() => {
                    // Stage 2: Full-screen circular spinner overlay
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

                        // Write booking into current user's account
                        addBookingForCurrentUser(newBooking);

                        // Populate Step 3 Completed UI
                        if (completedBookingRef) completedBookingRef.textContent = bookingRef;
                        if (completedCarName) completedCarName.textContent = newBooking.model;
                        if (completedPickupInfo) completedPickupInfo.textContent = `${newBooking.pickupLocName} · ${newBooking.pickupDate} ${pTime}`;
                        if (completedReturnInfo) completedReturnInfo.textContent = `${newBooking.returnLocName} · ${newBooking.returnDate} ${rTime}`;
                        if (completedCardInfo) completedCardInfo.textContent = `Card ending in •••• ${cardLast4}`;
                        if (completedTotalPaid) completedTotalPaid.textContent = `S${newBooking.totalPrice}`;

                        // Hide full-screen spinner & reset button state
                        if (paymentProcessingOverlay) {
                            paymentProcessingOverlay.classList.remove('active');
                            paymentProcessingOverlay.setAttribute('aria-hidden', 'true');
                        }
                        billMakePaymentBtn.classList.remove('is-paying');
                        billMakePaymentBtn.disabled = false;
                        if (reservePaymentBackBtn) reservePaymentBackBtn.disabled = false;
                        isProcessingPayment = false;

                        // Stage 3: Advance to Step 3 (Completed) & replay checkmark draw animation
                        setReserveStep(3);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        showTopToast(`Payment completed! Booking ${bookingRef} has been saved to your account.`, 'success');
                    }, 1150);
                }, 700);
            });
        }

        // Step 3 Action Buttons
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

        // Restore draft if page is refreshed while on #reserve
        const initDraft = getActiveDraft();
        if (initDraft) {
            renderReservePage(initDraft);
        }
    })();

    // 页面初次加载时检查
    const initialHash = window.location.hash.replace('#', '').trim();
    if (initialHash === 'search') {
        showEmptyState();
    }
})();
