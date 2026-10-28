// 1. 导航栏滚动变色逻辑
const navbar = document.querySelector('.navbar');
// 1. 导航栏状态控制（首页根据滚动动态透明/变色，其他页面始终保持实体）
function updateNavbarScroll() {
    const currentHash = window.location.hash.replace('#', '').trim() || 'home';
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
    // 如果目标页面不存在，默认回到 home
    const targetSection = document.getElementById(`page-${targetPage}`);
    const validPage = targetSection ? targetPage : 'home';

    // 切换页面展示
    pageViews.forEach(view => {
        view.classList.remove('active');
        view.classList.remove('page-search-transition-in');
        view.classList.remove('page-home-transition-in');
    });
    const activeSection = document.getElementById(`page-${validPage}`);
    if (activeSection) {
        activeSection.classList.add('active');
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

    // 页面初次加载时检查
    const initialHash = window.location.hash.replace('#', '').trim();
    if (initialHash === 'search') {
        showEmptyState();
    }
})();
