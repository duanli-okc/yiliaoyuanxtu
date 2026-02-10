/**
 * 新门诊医生工作站 - JavaScript 交互逻辑
 * 完整版本 - 包含所有功能模块
 */

// ============================================
// 全局状态管理
// ============================================

const state = {
    currentPatient: null,
    selectedPatient: null,
    scanMode: false,
    pinnedSidebars: {
        left: true,
        right: true
    },
    selectedDrugs: [],
    selectedLabTests: [],
    selectedExams: [],
    selectedTreatments: [],
    selectedMaterials: [],
    tcmHerbs: [
        { name: '黄芪', dosage: 15 },
        { name: '党参', dosage: 10 }
    ],
    currentDiagnosis: null
};

// 模拟数据
const mockData = {
    drugs: [
        { id: 1, name: '布洛芬缓释胶囊', spec: '0.3g×24粒/盒', price: 15.60, category: 'analgesic', stock: 500 },
        { id: 2, name: '复方氨酚烷胺胶囊', spec: '12粒/板', price: 8.40, category: 'analgesic', stock: 320 },
        { id: 3, name: '阿莫西林胶囊', spec: '0.25g×24粒/盒', price: 12.80, category: 'antibiotic', stock: 280 },
        { id: 4, name: '头孢克肟分散片', spec: '0.1g×6片/板', price: 28.00, category: 'antibiotic', stock: 150 },
        { id: 5, name: '苯磺酸氨氯地平片', spec: '5mg×14片/盒', price: 32.50, category: 'cardiovascular', stock: 200 },
        { id: 6, name: '奥美拉唑肠溶胶囊', spec: '20mg×14粒/盒', price: 25.80, category: 'digestive', stock: 180 },
        { id: 7, name: '氯雷他定片', spec: '10mg×6片/盒', price: 18.50, category: 'common', stock: 420 },
        { id: 8, name: '蒙脱石散', spec: '3g×10袋/盒', price: 22.00, category: 'digestive', stock: 350 }
    ],
    patients: [
        { id: '1000', name: '陈明辉', gender: 'male', age: 38, phone: '13800138000', idNumber: '330102198801121234' },
        { id: '1001', name: '王建国', gender: 'male', age: 45, phone: '13900139001' },
        { id: '1002', name: '李美玲', gender: 'female', age: 32, phone: '13700137002' },
        { id: '1003', name: '张伟', gender: 'male', age: 28, phone: '13600136003' },
        { id: '1004', name: '赵晓燕', gender: 'female', age: 55, phone: '13500135004' },
        { id: '1005', name: '刘德华', gender: 'male', age: 62, phone: '13400134005' }
    ]
};

// ============================================
// 页面初始化
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupKeyboardShortcuts();
    initializeSelectors();
});

function initializeApp() {
    // 设置当前日期
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
    
    // 初始化当前就诊病人
    state.currentPatient = mockData.patients[0];
    
    // 更新待诊人数显示
    updateWaitingCount();
    
    // 更新时间显示
    updateDateTime();
    setInterval(updateDateTime, 60000);
}

function updateDateTime() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    // 可以在界面上显示
}

function setupEventListeners() {
    // 搜索框
    const searchInput = document.getElementById('patientSearch');
    if (searchInput) {
        searchInput.addEventListener('input', handlePatientSearch);
    }
    
    // 点击页面其他区域关闭下拉菜单
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
            closeAllDropdowns();
        }
        // 关闭药品建议列表
        if (!e.target.closest('.add-drug-row')) {
            closeDrugSuggestions();
        }
    });
    
    // 弹窗关闭
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
    
    // 药品搜索
    const drugSearchInput = document.querySelector('.drug-search-input');
    if (drugSearchInput) {
        drugSearchInput.addEventListener('input', handleDrugSearch);
        drugSearchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const firstSuggestion = document.querySelector('.suggestion-item');
                if (firstSuggestion) {
                    firstSuggestion.click();
                }
            }
        });
    }
    
    // 检验检查选择器checkbox事件
    document.querySelectorAll('#labSelectorModal .item-checkbox input').forEach(cb => {
        cb.addEventListener('change', updateLabSelection);
    });
    
    document.querySelectorAll('#examSelectorModal .item-checkbox input').forEach(cb => {
        cb.addEventListener('change', updateExamSelection);
    });
    
    document.querySelectorAll('#treatmentSelectorModal .item-checkbox input').forEach(cb => {
        cb.addEventListener('change', updateTreatmentSelection);
    });
}

function initializeSelectors() {
    // 初始化检验选择器计数
    updateLabSelection();
    updateExamSelection();
    updateTreatmentSelection();
}

// ============================================
// 键盘快捷键
// ============================================

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl + S: 发送医嘱 / 完成接诊
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            sendOrders();
        }
        
        // Ctrl + P: 打印
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            showPrintModal();
        }
        
        // Ctrl + D: 新增处方
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            addNewPrescription();
        }
        
        // Ctrl + Q: 调出成套方案
        if (e.ctrlKey && e.key === 'q') {
            e.preventDefault();
            showPackagePlan();
        }
        
        // Ctrl + E: 复制医嘱
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            copyOrders();
        }
        
        // Ctrl + 1/2/3: 方案范围选择
        if (e.ctrlKey && e.key === '1') {
            e.preventDefault();
            setScope('self');
        }
        if (e.ctrlKey && e.key === '2') {
            e.preventDefault();
            setScope('dept');
        }
        if (e.ctrlKey && e.key === '3') {
            e.preventDefault();
            setScope('all');
        }
        
        // Ctrl + A: 成套全选
        if (e.ctrlKey && e.key === 'a') {
            const packageModal = document.getElementById('packageModal');
            if (packageModal.classList.contains('active')) {
                e.preventDefault();
                selectAllPackages();
            }
        }
        
        // Ctrl + R: 成套全清
        if (e.ctrlKey && e.key === 'r') {
            const packageModal = document.getElementById('packageModal');
            if (packageModal.classList.contains('active')) {
                e.preventDefault();
                clearAllPackages();
            }
        }
        
        // F1: 帮助
        if (e.key === 'F1') {
            e.preventDefault();
            showHelp();
        }
        
        // F11: 全屏
        if (e.key === 'F11') {
            e.preventDefault();
            toggleFullscreen();
        }
        
        // ESC: 关闭弹窗
        if (e.key === 'Escape') {
            closeActiveModal();
            closeAllDropdowns();
        }
        
        // Delete: 删除医嘱或诊断
        if (e.key === 'Delete') {
            const focused = document.activeElement;
            if (focused && focused.closest('.diagnosis-item')) {
                const deleteBtn = focused.closest('.diagnosis-item').querySelector('.icon-btn.danger');
                if (deleteBtn) deleteBtn.click();
            }
        }
        
        // 下箭头: 通用新增项目
        if (e.key === 'ArrowDown' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
            const focused = document.activeElement;
            if (focused && focused.classList.contains('diagnosis-input')) {
                e.preventDefault();
                addDiagnosis();
            }
        }
    });
}

// ============================================
// 病人列表操作
// ============================================

function selectPatient(element) {
    // 移除其他选中状态
    document.querySelectorAll('.patient-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // 添加选中状态
    element.classList.add('selected');
    
    // 更新状态
    const patientId = element.dataset.id;
    state.selectedPatient = mockData.patients.find(p => p.id === patientId) || {
        id: patientId,
        name: element.querySelector('.patient-name').textContent
    };
}

function startConsultation(element) {
    if (!element) {
        element = document.querySelector('.patient-item.selected');
    }
    
    if (!element) {
        showToast('warning', '请先选择病人');
        return;
    }
    
    const patientName = element.querySelector('.patient-name').textContent;
    
    // 模拟接诊
    showToast('success', '接诊成功', `已接诊病人：${patientName}`);
    
    // 移动病人到正在就诊
    moveToCurrentList(element);
    
    // 更新病人信息栏
    updatePatientInfoBar(patientName);
}

function updatePatientInfoBar(name) {
    const nameElement = document.querySelector('.patient-name-row .name');
    if (nameElement) {
        nameElement.textContent = name;
    }
}

function startConsultationForSelected() {
    const selected = document.querySelector('.patient-item.selected');
    if (selected) {
        startConsultation(selected);
    } else {
        showToast('warning', '请先选择病人');
    }
}

function moveToCurrentList(element) {
    const currentList = document.getElementById('currentList');
    const waitingList = document.getElementById('waitingList');
    
    // 创建新的病人条目
    const newItem = element.cloneNode(true);
    newItem.classList.remove('selected');
    newItem.classList.add('active');
    newItem.querySelector('.patient-tags').innerHTML = '<span class="tag tag-consulting">就诊中</span>';
    newItem.onclick = function() { selectPatient(this); };
    
    // 移除原条目
    element.remove();
    
    // 如果有正在就诊的病人，先移回候诊
    const currentPatient = currentList.querySelector('.patient-item');
    if (currentPatient) {
        currentPatient.classList.remove('active');
        currentPatient.querySelector('.patient-tags').innerHTML = '';
        currentPatient.onclick = function() { selectPatient(this); };
        currentPatient.ondblclick = function() { startConsultation(this); };
        waitingList.prepend(currentPatient);
    }
    
    // 添加新病人到正在就诊
    currentList.innerHTML = '';
    currentList.appendChild(newItem);
    
    // 更新计数
    updateWaitingCount();
}

function callNextPatient() {
    const waitingList = document.getElementById('waitingList');
    const patients = waitingList.querySelectorAll('.patient-item');
    let nextPatient = null;
    
    // 找到第一个未呼叫的病人
    for (let patient of patients) {
        if (!patient.querySelector('.tag-called')) {
            nextPatient = patient;
            break;
        }
    }
    
    if (nextPatient) {
        const name = nextPatient.querySelector('.patient-name').textContent;
        
        // 添加已呼叫标记
        const tags = nextPatient.querySelector('.patient-tags');
        if (!tags.querySelector('.tag-called')) {
            const callTag = document.createElement('span');
            callTag.className = 'tag tag-called';
            callTag.title = '已呼叫';
            callTag.innerHTML = '<i class="fas fa-volume-up"></i>';
            tags.appendChild(callTag);
        }
        
        showToast('info', '叫号成功', `正在呼叫：${name}`);
        
        // 模拟语音播报
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`请${name}到1号诊室就诊`);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        }
    } else {
        showToast('info', '暂无候诊病人', '所有病人已呼叫');
    }
}

function updateWaitingCount() {
    const waitingList = document.getElementById('waitingList');
    const waitingCount = document.getElementById('waitingCount');
    
    if (waitingList && waitingCount) {
        const count = waitingList.querySelectorAll('.patient-item').length;
        waitingCount.textContent = count;
        
        // 更新消息红点
        const messageBtn = document.getElementById('messageBtn');
        if (messageBtn) {
            const badge = messageBtn.querySelector('.badge');
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'flex' : 'none';
            }
        }
    }
}

function handlePatientSearch(e) {
    const keyword = e.target.value.toLowerCase();
    const patientItems = document.querySelectorAll('#waitingList .patient-item, #completedList .patient-item');
    
    patientItems.forEach(item => {
        const name = item.querySelector('.patient-name').textContent.toLowerCase();
        const pinyin = getPinyin(item.querySelector('.patient-name').textContent);
        
        if (name.includes(keyword) || pinyin.includes(keyword) || keyword === '') {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function toggleScanMode() {
    state.scanMode = !state.scanMode;
    const scanBtn = document.querySelector('.scan-btn');
    
    if (state.scanMode) {
        scanBtn.classList.add('active');
        showToast('info', '已开启扫描模式', '支持刷卡自动接诊');
    } else {
        scanBtn.classList.remove('active');
        showToast('info', '已关闭扫描模式');
    }
}

// ============================================
// 列表折叠与钉住
// ============================================

function toggleSection(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.fa-chevron-down');
    
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        content.style.display = '';
        if (icon) icon.style.transform = 'rotate(0)';
    } else {
        content.classList.add('collapsed');
        content.style.display = 'none';
        if (icon) icon.style.transform = 'rotate(-90deg)';
    }
}

function toggleLabCategory(header) {
    const items = header.nextElementSibling;
    const icon = header.querySelector('.fa-chevron-down');
    
    if (items.classList.contains('collapsed')) {
        items.classList.remove('collapsed');
        items.style.display = '';
        if (icon) icon.style.transform = 'rotate(0)';
    } else {
        items.classList.add('collapsed');
        items.style.display = 'none';
        if (icon) icon.style.transform = 'rotate(-90deg)';
    }
}

function togglePin(sidebarId) {
    const sidebar = document.getElementById(sidebarId);
    const pinBtn = sidebar.querySelector('.fa-thumbtack');
    
    sidebar.classList.toggle('pinned');
    state.pinnedSidebars[sidebarId === 'leftSidebar' ? 'left' : 'right'] = sidebar.classList.contains('pinned');
    
    if (pinBtn) {
        pinBtn.style.color = sidebar.classList.contains('pinned') ? 'var(--primary-color)' : '';
    }
    
    const isPinned = sidebar.classList.contains('pinned');
    showToast('info', isPinned ? '已钉住' : '已取消钉住');
}

// ============================================
// 医嘱标签页切换
// ============================================

function switchOrderTab(tabName) {
    // 更新标签按钮状态
    document.querySelectorAll('.orders-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const clickedTab = event.target.closest('.tab-btn');
    if (clickedTab) {
        clickedTab.classList.add('active');
    }
    
    // 更新内容显示
    document.querySelectorAll('.order-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const targetTab = document.getElementById(tabName + 'Tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }
}

// ============================================
// 大纲导航
// ============================================

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // 更新大纲高亮
        document.querySelectorAll('.outline-item').forEach(item => {
            item.classList.remove('active');
        });
        if (event && event.target) {
            event.target.closest('.outline-item').classList.add('active');
        }
    }
}

function scrollToOrders(tabName) {
    // 先切换到对应标签
    const tabBtn = document.querySelector(`.tab-btn[onclick*="${tabName}"]`);
    if (tabBtn) {
        tabBtn.click();
    }
    
    const tabContent = document.getElementById(tabName + 'Tab');
    if (tabContent) {
        tabContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // 更新大纲高亮
    document.querySelectorAll('.outline-item').forEach(item => {
        item.classList.remove('active');
    });
    if (event && event.target) {
        event.target.closest('.outline-item').classList.add('active');
    }
}

// ============================================
// 诊断操作
// ============================================

function addDiagnosis() {
    const diagnosisList = document.getElementById('diagnosisList');
    const count = diagnosisList.querySelectorAll('.diagnosis-item').length + 1;
    
    const newItem = document.createElement('div');
    newItem.className = 'diagnosis-item';
    newItem.dataset.index = count;
    newItem.innerHTML = `
        <span class="diagnosis-number">${count}</span>
        <div class="diagnosis-content">
            <input type="text" class="diagnosis-input" placeholder="输入诊断名称、编码或简码" oninput="searchDiagnosis(this)">
            <div class="diagnosis-meta">
                <span class="diagnosis-code"></span>
                <div class="diagnosis-date">
                    <label>发病日期：</label>
                    <input type="date" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <button class="icon-btn small" onclick="toggleSuspected(this)" title="设为疑诊">
                    <i class="fas fa-question"></i>
                </button>
            </div>
        </div>
        <button class="icon-btn small danger" onclick="removeDiagnosis(this)" title="删除诊断">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    diagnosisList.appendChild(newItem);
    newItem.querySelector('.diagnosis-input').focus();
}

function removeDiagnosis(btn) {
    const item = btn.closest('.diagnosis-item');
    
    // 检查是否已发送
    if (item.classList.contains('sent')) {
        showToast('warning', '已发送的诊断不能删除');
        return;
    }
    
    item.remove();
    
    // 重新编号
    document.querySelectorAll('.diagnosis-item').forEach((item, index) => {
        item.querySelector('.diagnosis-number').textContent = index + 1;
        item.dataset.index = index + 1;
    });
}

function toggleSuspected(btn) {
    btn.classList.toggle('active');
    const input = btn.closest('.diagnosis-content').querySelector('.diagnosis-input');
    
    if (btn.classList.contains('active')) {
        btn.style.color = 'var(--warning-color)';
        btn.style.background = 'rgba(250, 173, 20, 0.1)';
        if (input && !input.value.endsWith('(疑诊)')) {
            input.value += ' (疑诊)';
        }
        showToast('info', '已设为疑诊');
    } else {
        btn.style.color = '';
        btn.style.background = '';
        if (input) {
            input.value = input.value.replace(' (疑诊)', '');
        }
    }
}

function searchDiagnosis(input) {
    const keyword = input.value.toLowerCase();
    if (keyword.length < 2) return;
    
    // 这里可以实现诊断搜索建议
}

function showCommonDiagnosis() {
    showModal('commonDiagnosisModal');
}

function selectCommonDiagnosis(card) {
    document.querySelectorAll('.diagnosis-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    state.currentDiagnosis = {
        name: card.dataset.name,
        code: card.dataset.code
    };
}

function confirmDiagnosisSelection() {
    if (!state.currentDiagnosis) {
        showToast('warning', '请选择诊断');
        return;
    }
    
    // 添加诊断到列表
    const diagnosisList = document.getElementById('diagnosisList');
    const emptyInput = diagnosisList.querySelector('.diagnosis-input:not([value]), .diagnosis-input[value=""]');
    
    if (emptyInput) {
        emptyInput.value = state.currentDiagnosis.name;
        emptyInput.closest('.diagnosis-item').querySelector('.diagnosis-code').textContent = state.currentDiagnosis.code;
    } else {
        addDiagnosis();
        setTimeout(() => {
            const lastInput = diagnosisList.querySelector('.diagnosis-item:last-child .diagnosis-input');
            if (lastInput) {
                lastInput.value = state.currentDiagnosis.name;
                lastInput.closest('.diagnosis-item').querySelector('.diagnosis-code').textContent = state.currentDiagnosis.code;
            }
        }, 100);
    }
    
    closeModal('commonDiagnosisModal');
    showToast('success', '诊断已添加', state.currentDiagnosis.name);
    state.currentDiagnosis = null;
}

function switchDiagnosisTab(tabName) {
    document.querySelectorAll('.diagnosis-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    // 根据tab筛选诊断列表
}

function filterDiagnosisList() {
    const keyword = document.getElementById('diagnosisSearch').value.toLowerCase();
    document.querySelectorAll('.diagnosis-card').forEach(card => {
        const name = card.querySelector('.diagnosis-card-name').textContent.toLowerCase();
        const code = card.querySelector('.diagnosis-card-code').textContent.toLowerCase();
        if (name.includes(keyword) || code.includes(keyword) || keyword === '') {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// ============================================
// 处方操作
// ============================================

function handleDrugSearch(e) {
    const keyword = e.target.value.toLowerCase();
    
    if (keyword.length < 1) {
        closeDrugSuggestions();
        return;
    }
    
    const filtered = mockData.drugs.filter(d => 
        d.name.toLowerCase().includes(keyword) || 
        getPinyin(d.name).includes(keyword)
    );
    
    showDrugSuggestions(filtered);
}

function showDrugSuggestions(drugs) {
    let container = document.getElementById('drugSuggestions');
    if (!container) {
        container = document.createElement('div');
        container.id = 'drugSuggestions';
        container.className = 'drug-suggestions';
        document.querySelector('.add-drug-row').appendChild(container);
    }
    
    if (drugs.length === 0) {
        container.innerHTML = '<div class="no-result">未找到匹配药品</div>';
    } else {
        container.innerHTML = drugs.map(drug => `
            <div class="suggestion-item" onclick="selectDrug('${drug.name}', '${drug.spec}', ${drug.price})">
                <span class="drug-name">${drug.name}</span>
                <span class="drug-spec">${drug.spec}</span>
                <span class="drug-price">¥${drug.price.toFixed(2)}</span>
            </div>
        `).join('');
    }
    
    container.style.display = 'block';
}

function closeDrugSuggestions() {
    const container = document.getElementById('drugSuggestions');
    if (container) {
        container.style.display = 'none';
    }
}

function selectDrug(name, spec, price) {
    const prescriptionList = document.getElementById('prescriptionList');
    const addRow = prescriptionList.querySelector('.add-drug-row');
    
    const drugId = Date.now();
    const newItem = document.createElement('div');
    newItem.className = 'prescription-item';
    newItem.dataset.drugId = drugId;
    newItem.innerHTML = `
        <div class="drug-row">
            <button class="merge-btn" title="一并给药" onclick="toggleMerge(this)">
                <i class="fas fa-grip-lines"></i>
            </button>
            <div class="drug-name" ondblclick="showDrugInfo('${name}')">
                <span class="name">${name}</span>
                <span class="spec">${spec}</span>
            </div>
            <div class="drug-usage">
                <select class="usage-select" onchange="updateDrugInfo(this)">
                    <option>口服</option>
                    <option>外用</option>
                    <option>静脉注射</option>
                    <option>肌肉注射</option>
                    <option>皮下注射</option>
                    <option>雾化吸入</option>
                </select>
            </div>
            <div class="drug-frequency">
                <select class="frequency-select" onchange="updateDrugInfo(this)">
                    <option>QD</option>
                    <option>BID</option>
                    <option>TID</option>
                    <option>QID</option>
                    <option>Q6H</option>
                    <option>Q8H</option>
                    <option>PRN</option>
                </select>
            </div>
            <div class="drug-dosage">
                <input type="text" value="1" class="dosage-input" onchange="calculateQuantity(this)">
                <span>粒</span>
            </div>
            <div class="drug-days">
                <input type="text" value="3" class="days-input" onchange="calculateQuantity(this)">
                <span>天</span>
            </div>
            <div class="drug-quantity">
                <input type="text" value="1" class="quantity-input">
                <span>盒</span>
            </div>
            <div class="drug-price" data-unit-price="${price}">¥${price.toFixed(2)}</div>
            <button class="icon-btn small danger" onclick="removeDrug(this)" title="删除">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    prescriptionList.insertBefore(newItem, addRow);
    
    // 清空搜索框
    document.querySelector('.drug-search-input').value = '';
    closeDrugSuggestions();
    
    // 更新总金额
    updatePrescriptionTotal();
    
    // 更新标签计数
    updateTabCount('prescription');
    
    showToast('success', '药品已添加', name);
}

function toggleMerge(btn) {
    btn.classList.toggle('merged');
    if (btn.classList.contains('merged')) {
        btn.style.color = 'var(--primary-color)';
        showToast('info', '已设置一并给药');
    } else {
        btn.style.color = '';
        showToast('info', '已取消一并给药');
    }
}

function calculateQuantity(input) {
    const row = input.closest('.drug-row');
    const dosage = parseFloat(row.querySelector('.dosage-input').value) || 1;
    const days = parseFloat(row.querySelector('.days-input').value) || 1;
    const frequency = row.querySelector('.frequency-select').value;
    
    let timesPerDay = 1;
    switch(frequency) {
        case 'BID': timesPerDay = 2; break;
        case 'TID': timesPerDay = 3; break;
        case 'QID': timesPerDay = 4; break;
        case 'Q6H': timesPerDay = 4; break;
        case 'Q8H': timesPerDay = 3; break;
        default: timesPerDay = 1;
    }
    
    const totalPills = dosage * timesPerDay * days;
    // 假设每盒24粒
    const boxes = Math.ceil(totalPills / 24);
    
    row.querySelector('.quantity-input').value = boxes;
    updatePrescriptionTotal();
}

function removeDrug(btn) {
    const item = btn.closest('.prescription-item');
    
    if (item.classList.contains('sent')) {
        if (!confirm('此药品已发送，确定要作废吗？')) {
            return;
        }
        item.classList.add('voided');
        item.style.opacity = '0.5';
        item.style.textDecoration = 'line-through';
        showToast('info', '药品已作废');
    } else {
        item.remove();
        showToast('info', '药品已删除');
    }
    
    updatePrescriptionTotal();
    updateTabCount('prescription');
}

function updatePrescriptionTotal() {
    const items = document.querySelectorAll('.prescription-item:not(.voided)');
    let total = 0;
    
    items.forEach(item => {
        const priceEl = item.querySelector('.drug-price');
        const quantityEl = item.querySelector('.quantity-input');
        const unitPrice = parseFloat(priceEl.dataset.unitPrice) || 0;
        const quantity = parseFloat(quantityEl.value) || 1;
        total += unitPrice * quantity;
    });
    
    const totalEl = document.querySelector('.total-amount');
    if (totalEl) {
        totalEl.textContent = '¥' + total.toFixed(2);
    }
}

function updateTabCount(tabName) {
    const tabs = document.querySelectorAll('.orders-tabs .tab-btn');
    tabs.forEach(tab => {
        const onclick = tab.getAttribute('onclick');
        if (onclick && onclick.includes(tabName)) {
            const countSpan = tab.querySelector('.tab-count');
            if (countSpan) {
                let count = 0;
                switch(tabName) {
                    case 'prescription':
                        count = document.querySelectorAll('.prescription-item:not(.voided)').length;
                        break;
                    case 'labTest':
                        count = document.querySelectorAll('.lab-test-item').length;
                        break;
                    case 'examination':
                        count = document.querySelectorAll('#examList .exam-item').length;
                        break;
                    case 'treatment':
                        count = document.querySelectorAll('#treatmentList .treatment-item').length;
                        break;
                }
                countSpan.textContent = count;
            }
        }
    });
}

// ============================================
// 药品选择器
// ============================================

function showDrugSelector() {
    showModal('drugSelectorModal');
    state.selectedDrugs = [];
    updateSelectedDrugList();
}

function filterDrugList() {
    const keyword = document.getElementById('drugSelectorSearch').value.toLowerCase();
    document.querySelectorAll('.drug-card').forEach(card => {
        const name = card.querySelector('.drug-card-name').textContent.toLowerCase();
        if (name.includes(keyword) || keyword === '') {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function filterDrugCategory(category) {
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    document.querySelectorAll('.drug-card').forEach(card => {
        const drugData = JSON.parse(card.dataset.drug);
        if (category === 'all' || drugData.category === category) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function toggleDrugSelection(card) {
    card.classList.toggle('selected');
    const drugData = JSON.parse(card.dataset.drug);
    
    if (card.classList.contains('selected')) {
        state.selectedDrugs.push(drugData);
    } else {
        state.selectedDrugs = state.selectedDrugs.filter(d => d.name !== drugData.name);
    }
    
    updateSelectedDrugList();
}

function updateSelectedDrugList() {
    const list = document.getElementById('selectedDrugList');
    const count = document.getElementById('selectedDrugCount');
    
    if (list) {
        list.innerHTML = state.selectedDrugs.map(drug => `
            <div class="selected-item">
                <span>${drug.name}</span>
                <button class="remove-btn" onclick="removeSelectedDrug('${drug.name}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
    
    if (count) {
        count.textContent = state.selectedDrugs.length;
    }
}

function removeSelectedDrug(name) {
    state.selectedDrugs = state.selectedDrugs.filter(d => d.name !== name);
    
    // 更新卡片状态
    document.querySelectorAll('.drug-card').forEach(card => {
        const drugData = JSON.parse(card.dataset.drug);
        if (drugData.name === name) {
            card.classList.remove('selected');
        }
    });
    
    updateSelectedDrugList();
}

function clearSelectedDrugs() {
    state.selectedDrugs = [];
    document.querySelectorAll('.drug-card').forEach(card => {
        card.classList.remove('selected');
    });
    updateSelectedDrugList();
}

function confirmDrugSelection() {
    if (state.selectedDrugs.length === 0) {
        showToast('warning', '请选择药品');
        return;
    }
    
    state.selectedDrugs.forEach(drug => {
        selectDrug(drug.name, drug.spec, drug.price);
    });
    
    closeModal('drugSelectorModal');
    showToast('success', '药品已添加', `共 ${state.selectedDrugs.length} 种`);
    state.selectedDrugs = [];
}

function showCommonPrescription() {
    showToast('info', '常用处方', '功能开发中');
}

function copyPrescription() {
    showToast('success', '处方已复制');
}

function deletePrescription() {
    const unsentItems = document.querySelectorAll('.prescription-item:not(.sent)');
    if (unsentItems.length === 0) {
        showToast('info', '没有可删除的处方');
        return;
    }
    
    if (confirm(`确定要删除 ${unsentItems.length} 条未发送的处方吗？`)) {
        unsentItems.forEach(item => item.remove());
        updatePrescriptionTotal();
        updateTabCount('prescription');
        showToast('success', '处方已删除');
    }
}

function toggleUrgent() {
    const btn = event.target.closest('.icon-btn');
    btn.classList.toggle('active');
    
    if (btn.classList.contains('active')) {
        btn.style.color = 'var(--danger-color)';
        btn.style.background = 'rgba(255, 77, 79, 0.1)';
        showToast('warning', '已设为紧急医嘱');
    } else {
        btn.style.color = '';
        btn.style.background = '';
        showToast('info', '已取消紧急医嘱');
    }
}

function addNewPrescription() {
    // 聚焦到药品搜索框
    const searchInput = document.querySelector('.drug-search-input');
    if (searchInput) {
        switchOrderTab('prescription');
        searchInput.focus();
    }
    showToast('info', '新增处方', '请输入药品名称');
}

function showDrugInfo(drugName) {
    document.getElementById('drugInfoName').textContent = drugName;
    showModal('drugInfoModal');
}

// ============================================
// 检验检查操作
// ============================================

function showLabSelector() {
    showModal('labSelectorModal');
}

function updateLabSelection() {
    const checkboxes = document.querySelectorAll('#labSelectorModal .item-checkbox input:checked');
    let total = 0;
    
    checkboxes.forEach(cb => {
        total += parseFloat(cb.dataset.price) || 0;
    });
    
    document.getElementById('labSelectedCount').textContent = checkboxes.length;
    document.getElementById('labSelectedTotal').textContent = '¥' + total.toFixed(2);
}

function confirmLabSelection() {
    const checkboxes = document.querySelectorAll('#labSelectorModal .item-checkbox input:checked');
    
    if (checkboxes.length === 0) {
        showToast('warning', '请选择检验项目');
        return;
    }
    
    const labTestList = document.getElementById('labTestList');
    
    checkboxes.forEach(cb => {
        const name = cb.value;
        const price = cb.dataset.price;
        
        // 检查是否已存在
        const exists = labTestList.querySelector(`[data-name="${name}"]`);
        if (!exists) {
            const newItem = document.createElement('div');
            newItem.className = 'lab-test-item';
            newItem.dataset.name = name;
            newItem.innerHTML = `
                <div class="lab-test-row">
                    <div class="lab-test-name">
                        <i class="fas fa-vial"></i>
                        <span>${name}</span>
                    </div>
                    <div class="lab-test-price">¥${parseFloat(price).toFixed(2)}</div>
                    <div class="lab-test-status">
                        <span class="status-tag">待发送</span>
                    </div>
                    <button class="icon-btn small danger" onclick="removeLabTest(this)">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            // 移除空状态
            const emptyState = labTestList.querySelector('.empty-state');
            if (emptyState) emptyState.remove();
            
            labTestList.appendChild(newItem);
        }
        
        cb.checked = false;
    });
    
    updateLabSelection();
    closeModal('labSelectorModal');
    updateTabCount('labTest');
    showToast('success', '检验项目已添加', `共 ${checkboxes.length} 项`);
}

function showCommonLabTest() {
    showLabSelector();
}

function viewLabResult() {
    showModal('labReportModal');
}

function removeLabTest(btn) {
    const item = btn.closest('.lab-test-item');
    
    if (item.classList.contains('sent')) {
        showToast('warning', '已发送的检验不能删除');
        return;
    }
    
    item.remove();
    updateTabCount('labTest');
    showToast('info', '检验项目已删除');
}

function printLabReport() {
    showToast('info', '打印报告', '正在准备打印...');
    window.print();
}

// ============================================
// 检查操作
// ============================================

function showExamSelector() {
    showModal('examSelectorModal');
}

function updateExamSelection() {
    const checkboxes = document.querySelectorAll('#examSelectorModal .item-checkbox input:checked');
    let total = 0;
    
    checkboxes.forEach(cb => {
        total += parseFloat(cb.dataset.price) || 0;
    });
    
    document.getElementById('examSelectedCount').textContent = checkboxes.length;
    document.getElementById('examSelectedTotal').textContent = '¥' + total.toFixed(2);
    
    // 显示/隐藏详情设置
    const detailSection = document.getElementById('examDetailSection');
    if (detailSection) {
        detailSection.style.display = checkboxes.length > 0 ? 'block' : 'none';
    }
}

function confirmExamSelection() {
    const checkboxes = document.querySelectorAll('#examSelectorModal .item-checkbox input:checked');
    
    if (checkboxes.length === 0) {
        showToast('warning', '请选择检查项目');
        return;
    }
    
    const examList = document.getElementById('examList');
    const bodyPart = document.getElementById('examBodyPart').value;
    const method = document.getElementById('examMethod').value;
    const note = document.getElementById('examNote').value;
    
    // 移除空状态
    const emptyState = examList.querySelector('.empty-state');
    if (emptyState) emptyState.remove();
    
    checkboxes.forEach(cb => {
        const name = cb.value;
        const price = cb.dataset.price;
        
        const newItem = document.createElement('div');
        newItem.className = 'exam-item';
        newItem.innerHTML = `
            <div class="lab-test-row">
                <div class="lab-test-name">
                    <i class="fas fa-x-ray"></i>
                    <span>${name}</span>
                    ${bodyPart ? `<span class="exam-detail">(${bodyPart} ${method})</span>` : ''}
                </div>
                <div class="lab-test-price">¥${parseFloat(price).toFixed(2)}</div>
                <div class="lab-test-status">
                    <span class="status-tag">待发送</span>
                </div>
                <button class="icon-btn small danger" onclick="removeExam(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        examList.appendChild(newItem);
        cb.checked = false;
    });
    
    updateExamSelection();
    closeModal('examSelectorModal');
    updateTabCount('examination');
    showToast('success', '检查项目已添加');
}

function showCommonExam() {
    showExamSelector();
}

function removeExam(btn) {
    btn.closest('.exam-item').remove();
    updateTabCount('examination');
    showToast('info', '检查项目已删除');
}

// ============================================
// 处置操作
// ============================================

function showTreatmentSelector() {
    showModal('treatmentSelectorModal');
}

function updateTreatmentSelection() {
    const checkboxes = document.querySelectorAll('#treatmentSelectorModal .item-checkbox input:checked');
    document.getElementById('treatmentSelectedCount').textContent = checkboxes.length;
}

function confirmTreatmentSelection() {
    const checkboxes = document.querySelectorAll('#treatmentSelectorModal .item-checkbox input:checked');
    
    if (checkboxes.length === 0) {
        showToast('warning', '请选择处置项目');
        return;
    }
    
    const treatmentList = document.getElementById('treatmentList');
    
    // 移除空状态
    const emptyState = treatmentList.querySelector('.empty-state');
    if (emptyState) emptyState.remove();
    
    checkboxes.forEach(cb => {
        const name = cb.value;
        const price = cb.dataset.price;
        
        const newItem = document.createElement('div');
        newItem.className = 'treatment-item';
        newItem.innerHTML = `
            <div class="lab-test-row">
                <div class="lab-test-name">
                    <i class="fas fa-syringe"></i>
                    <span>${name}</span>
                </div>
                <div class="lab-test-price">¥${parseFloat(price).toFixed(2)}</div>
                <div class="lab-test-status">
                    <span class="status-tag">待发送</span>
                </div>
                <button class="icon-btn small danger" onclick="removeTreatment(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        treatmentList.appendChild(newItem);
        cb.checked = false;
    });
    
    updateTreatmentSelection();
    closeModal('treatmentSelectorModal');
    updateTabCount('treatment');
    showToast('success', '处置项目已添加');
}

function showCommonTreatment() {
    showTreatmentSelector();
}

function removeTreatment(btn) {
    btn.closest('.treatment-item').remove();
    updateTabCount('treatment');
    showToast('info', '处置项目已删除');
}

// ============================================
// 中药配方操作
// ============================================

function showTcmSelector() {
    showModal('tcmSelectorModal');
    renderTcmFormulaList();
}

function addTcmHerb(name, dosage) {
    // 检查是否已存在
    const exists = state.tcmHerbs.find(h => h.name === name);
    if (exists) {
        showToast('warning', '该药物已添加');
        return;
    }
    
    state.tcmHerbs.push({ name, dosage });
    renderTcmFormulaList();
    showToast('success', '已添加', name);
}

function removeTcmHerb(btn) {
    const item = btn.closest('.formula-item');
    const name = item.querySelector('.herb-name').textContent;
    
    state.tcmHerbs = state.tcmHerbs.filter(h => h.name !== name);
    renderTcmFormulaList();
}

function renderTcmFormulaList() {
    const list = document.getElementById('tcmFormulaList');
    if (!list) return;
    
    list.innerHTML = state.tcmHerbs.map(herb => `
        <div class="formula-item">
            <span class="herb-name">${herb.name}</span>
            <input type="number" value="${herb.dosage}" min="1" class="herb-dosage" onchange="updateHerbDosage('${herb.name}', this.value)"> g
            <button class="icon-btn small danger" onclick="removeTcmHerb(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    // 更新计数
    const countEl = document.getElementById('tcmHerbCount');
    if (countEl) countEl.textContent = state.tcmHerbs.length;
}

function updateHerbDosage(name, dosage) {
    const herb = state.tcmHerbs.find(h => h.name === name);
    if (herb) {
        herb.dosage = parseInt(dosage) || 1;
    }
}

function loadTcmTemplate() {
    // 加载预设方剂
    const templates = [
        { name: '四君子汤', herbs: [
            { name: '党参', dosage: 10 },
            { name: '白术', dosage: 10 },
            { name: '茯苓', dosage: 10 },
            { name: '甘草', dosage: 6 }
        ]},
        { name: '四物汤', herbs: [
            { name: '当归', dosage: 10 },
            { name: '川芎', dosage: 8 },
            { name: '白芍', dosage: 10 },
            { name: '熟地', dosage: 12 }
        ]}
    ];
    
    const choice = prompt('请输入方剂名称（四君子汤/四物汤）：');
    const template = templates.find(t => t.name === choice);
    
    if (template) {
        state.tcmHerbs = [...template.herbs];
        renderTcmFormulaList();
        showToast('success', '方剂已加载', template.name);
    } else {
        showToast('warning', '未找到该方剂');
    }
}

function clearTcmFormula() {
    if (confirm('确定要清空配方吗？')) {
        state.tcmHerbs = [];
        renderTcmFormulaList();
    }
}

function confirmTcmFormula() {
    if (state.tcmHerbs.length === 0) {
        showToast('warning', '请添加中药');
        return;
    }
    
    const doses = document.getElementById('tcmDoses').value;
    
    // 更新中药配方标签页
    const tcmFormula = document.getElementById('tcmFormula');
    if (tcmFormula) {
        tcmFormula.innerHTML = `
            <div class="tcm-prescription">
                <div class="tcm-header">
                    <span>中药配方 - ${doses}剂</span>
                    <button class="icon-btn small" onclick="showTcmSelector()">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
                <div class="tcm-herbs">
                    ${state.tcmHerbs.map(h => `<span class="tcm-herb">${h.name} ${h.dosage}g</span>`).join('')}
                </div>
            </div>
        `;
    }
    
    closeModal('tcmSelectorModal');
    showToast('success', '中药配方已保存', `共${state.tcmHerbs.length}味药，${doses}剂`);
    
    // 更新标签计数
    const tcmTab = document.querySelector('.tab-btn[onclick*="tcm"] .tab-count');
    if (tcmTab) tcmTab.textContent = '1';
}

function showTcmTemplate() {
    loadTcmTemplate();
}

function copyTcmFormula() {
    showToast('success', '配方已复制');
}

// ============================================
// 卫材操作
// ============================================

function showMaterialsSelector() {
    showModal('materialsSelectorModal');
}

function confirmMaterialsSelection() {
    const checkboxes = document.querySelectorAll('#materialsSelectorModal .item-checkbox input:checked');
    
    if (checkboxes.length === 0) {
        showToast('warning', '请选择卫材');
        return;
    }
    
    const materialsList = document.getElementById('materialsList');
    
    // 移除空状态
    const emptyState = materialsList.querySelector('.empty-state');
    if (emptyState) emptyState.remove();
    
    checkboxes.forEach(cb => {
        const name = cb.value;
        const price = cb.dataset.price;
        
        const newItem = document.createElement('div');
        newItem.className = 'materials-item';
        newItem.innerHTML = `
            <div class="lab-test-row">
                <div class="lab-test-name">
                    <i class="fas fa-box"></i>
                    <span>${name}</span>
                </div>
                <div class="lab-test-price">¥${parseFloat(price).toFixed(2)}</div>
                <input type="number" value="1" min="1" class="quantity-input" style="width:60px;">
                <button class="icon-btn small danger" onclick="removeMaterials(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        materialsList.appendChild(newItem);
        cb.checked = false;
    });
    
    closeModal('materialsSelectorModal');
    showToast('success', '卫材已添加');
}

function showCommonMaterials() {
    showMaterialsSelector();
}

function removeMaterials(btn) {
    btn.closest('.materials-item').remove();
    showToast('info', '卫材已删除');
}

// ============================================
// 报告插入
// ============================================

function showReportInserter(section) {
    document.getElementById('reportTargetSection').textContent = section;
    showModal('reportInserterModal');
}

function toggleReportDetail(btn) {
    const detail = btn.closest('.report-item').querySelector('.report-detail');
    const icon = btn.querySelector('i');
    
    if (detail.style.display === 'none') {
        detail.style.display = 'block';
        icon.className = 'fas fa-chevron-up';
    } else {
        detail.style.display = 'none';
        icon.className = 'fas fa-chevron-down';
    }
}

function insertSelectedReports() {
    const checkboxes = document.querySelectorAll('#reportInserterModal .report-checkbox:checked');
    
    if (checkboxes.length === 0) {
        showToast('warning', '请选择要插入的报告');
        return;
    }
    
    const targetSection = document.getElementById('reportTargetSection').textContent;
    let targetTextarea;
    
    switch(targetSection) {
        case '主诉':
            targetTextarea = document.querySelector('#chiefComplaint .form-textarea');
            break;
        case '现病史':
            targetTextarea = document.querySelector('#presentIllness .form-textarea');
            break;
        default:
            targetTextarea = document.querySelector('#chiefComplaint .form-textarea');
    }
    
    if (targetTextarea) {
        let insertText = '\n【检验结果】\n';
        checkboxes.forEach(cb => {
            const reportItem = cb.closest('.report-item');
            const title = reportItem.querySelector('.report-title').textContent;
            insertText += `${title}\n`;
            
            // 获取报告详情
            const rows = reportItem.querySelectorAll('.report-table tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    insertText += `  ${cells[0].textContent}: ${cells[1].textContent}`;
                    if (cells[2] && cells[2].textContent) {
                        insertText += ` ${cells[2].textContent}`;
                    }
                    insertText += '\n';
                }
            });
        });
        
        targetTextarea.value += insertText;
    }
    
    closeModal('reportInserterModal');
    showToast('success', '报告已插入', `共 ${checkboxes.length} 份报告`);
}

// ============================================
// 过敏史操作
// ============================================

function addAllergy() {
    showModal('allergyModal');
    // 重置表单
    document.getElementById('allergyName').value = '';
    document.getElementById('allergyReaction').value = '';
    document.getElementById('allergyTime').value = '';
    document.getElementById('allergySeverity').value = 'mild';
}

function confirmAddAllergy() {
    const name = document.getElementById('allergyName').value.trim();
    const reaction = document.getElementById('allergyReaction').value.trim();
    const severity = document.getElementById('allergySeverity').value;
    
    if (!name) {
        showToast('warning', '请输入过敏物名称');
        return;
    }
    
    const allergyContent = document.querySelector('.allergy-content');
    const addBtn = allergyContent.querySelector('.add-allergy-btn');
    
    const severityClass = severity === 'severe' ? 'danger' : (severity === 'moderate' ? 'warning' : '');
    
    const newItem = document.createElement('div');
    newItem.className = `allergy-item ${severityClass}`;
    newItem.innerHTML = `
        <span class="allergy-name">${name}</span>
        <span class="allergy-reaction">${reaction || '未知反应'}</span>
        <button class="icon-btn small danger" onclick="removeAllergy(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    allergyContent.insertBefore(newItem, addBtn);
    closeModal('allergyModal');
    showToast('success', '过敏史已添加', name);
    
    // 更新病人警示
    updateAllergyAlert(name);
}

function removeAllergy(btn) {
    if (confirm('确定要删除此过敏记录吗？')) {
        btn.closest('.allergy-item').remove();
        showToast('info', '过敏记录已删除');
    }
}

function updateAllergyAlert(name) {
    const alertsContainer = document.querySelector('.patient-alerts');
    if (alertsContainer) {
        const existingAlert = alertsContainer.querySelector('.alert-item.danger');
        if (existingAlert) {
            existingAlert.querySelector('span').textContent = `过敏：${name}`;
        }
    }
}

// ============================================
// 底部操作栏
// ============================================

function sendOrders() {
    // 收集未发送的医嘱
    const unsentPrescriptions = document.querySelectorAll('.prescription-item:not(.sent):not(.voided)');
    const unsentLabTests = document.querySelectorAll('.lab-test-item:not(.sent)');
    const unsentExams = document.querySelectorAll('.exam-item:not(.sent)');
    const unsentTreatments = document.querySelectorAll('.treatment-item:not(.sent)');
    
    const totalUnsent = unsentPrescriptions.length + unsentLabTests.length + unsentExams.length + unsentTreatments.length;
    
    if (totalUnsent === 0) {
        showToast('info', '没有需要发送的医嘱');
        return;
    }
    
    // 模拟发送
    unsentPrescriptions.forEach(item => {
        item.classList.add('sent');
        const statusTag = item.querySelector('.status-tag');
        if (statusTag) {
            statusTag.textContent = '已发送';
            statusTag.classList.add('sent');
        }
    });
    
    unsentLabTests.forEach(item => {
        item.classList.add('sent');
        const statusTag = item.querySelector('.status-tag');
        if (statusTag) {
            statusTag.textContent = '已发送';
            statusTag.classList.add('sent');
        }
    });
    
    unsentExams.forEach(item => {
        item.classList.add('sent');
        const statusTag = item.querySelector('.status-tag');
        if (statusTag) {
            statusTag.textContent = '已发送';
            statusTag.classList.add('sent');
        }
    });
    
    unsentTreatments.forEach(item => {
        item.classList.add('sent');
        const statusTag = item.querySelector('.status-tag');
        if (statusTag) {
            statusTag.textContent = '已发送';
            statusTag.classList.add('sent');
        }
    });
    
    showToast('success', '医嘱发送成功', `已发送 ${totalUnsent} 条医嘱`);
}

function completeConsultation() {
    // 检查是否有未发送的医嘱
    const totalUnsent = document.querySelectorAll('.prescription-item:not(.sent):not(.voided), .lab-test-item:not(.sent), .exam-item:not(.sent), .treatment-item:not(.sent)').length;
    
    if (totalUnsent > 0) {
        if (!confirm(`还有 ${totalUnsent} 条未发送的医嘱，是否先发送？`)) {
            return;
        }
        sendOrders();
    }
    
    showToast('success', '接诊完成', '病人已移至已诊列表');
    
    // 移动病人到已诊列表
    const currentItem = document.querySelector('#currentList .patient-item');
    if (currentItem) {
        currentItem.classList.remove('active');
        currentItem.classList.add('completed');
        currentItem.querySelector('.patient-tags').innerHTML = '<span class="tag tag-done">已完成</span>';
        
        const completedList = document.getElementById('completedList');
        completedList.prepend(currentItem);
        
        document.getElementById('currentList').innerHTML = '';
        
        // 更新计数
        const completedCount = completedList.querySelectorAll('.patient-item').length;
        const countBadge = document.querySelector('#completedList').closest('.patient-section').querySelector('.count-badge');
        if (countBadge) countBadge.textContent = completedCount;
    }
}

function signRecord() {
    if (confirm('确定要签名病历吗？签名后将无法直接修改。')) {
        showToast('success', '病历已签名');
        
        // 更新按钮状态
        const signBtn = document.querySelector('.btn-warning[onclick*="signRecord"]');
        if (signBtn) {
            signBtn.innerHTML = '<i class="fas fa-times"></i> 取消签名';
            signBtn.onclick = cancelSign;
        }
    }
}

function cancelSign() {
    if (confirm('确定要取消签名吗？')) {
        showToast('info', '签名已取消');
        
        // 恢复按钮状态
        const signBtn = document.querySelector('.btn-warning');
        if (signBtn) {
            signBtn.innerHTML = '<i class="fas fa-signature"></i> 病历签名';
            signBtn.onclick = signRecord;
        }
    }
}

function previewRecord() {
    // 更新预览内容
    updateRecordPreview();
    showModal('recordPreviewModal');
}

function updateRecordPreview() {
    // 获取当前病历数据并更新预览
    const chiefComplaint = document.querySelector('#chiefComplaint .form-textarea');
    const presentIllness = document.querySelector('#presentIllness .form-textarea');
    
    // 这里可以动态更新预览内容
}

function printPreviewContent() {
    window.print();
}

function showPrintModal() {
    showModal('printModal');
}

function printDocuments() {
    showPrintModal();
}

function previewPrintContent() {
    showToast('info', '打印预览', '正在生成预览...');
    previewRecord();
}

function confirmPrint() {
    const selectedOptions = document.querySelectorAll('#printModal .checkbox-label input:checked');
    
    if (selectedOptions.length === 0) {
        showToast('warning', '请选择要打印的单据');
        return;
    }
    
    const items = Array.from(selectedOptions).map(cb => cb.parentElement.textContent.trim());
    
    closeModal('printModal');
    showToast('info', '正在打印...', items.join('、'));
    
    setTimeout(() => {
        window.print();
    }, 500);
}

function showMedicalReference() {
    showToast('info', '诊疗参考', '功能开发中');
}

function showCriticalValues() {
    showToast('info', '危急值', '当前无危急值提醒');
}

function showPackagePlan() {
    showModal('packageModal');
}

function copyOrders() {
    showToast('success', '医嘱已复制到剪贴板', '快捷键 Ctrl+E');
}

// ============================================
// 成套方案
// ============================================

function setScope(scope) {
    document.querySelectorAll('.scope-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const targetBtn = document.querySelector(`.scope-btn[onclick*="${scope}"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
    
    // 根据范围筛选方案
    showToast('info', '范围已切换', scope === 'self' ? '本人' : (scope === 'dept' ? '本科' : '全院'));
}

function selectAllPackages() {
    document.querySelectorAll('.package-item input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
    });
    showToast('info', '已全选');
}

function clearAllPackages() {
    document.querySelectorAll('.package-item input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    showToast('info', '已全清');
}

function applyPackages() {
    const selected = document.querySelectorAll('.package-item input[type="checkbox"]:checked');
    
    if (selected.length === 0) {
        showToast('warning', '请选择方案');
        return;
    }
    
    // 获取选中的方案内容并添加相应的医嘱
    selected.forEach(cb => {
        const packageName = cb.parentElement.querySelector('.package-name').textContent;
        const detail = cb.closest('.package-item').querySelector('.package-detail').textContent;
        
        // 根据方案内容添加相应医嘱
        console.log('应用方案:', packageName, detail);
    });
    
    showToast('success', '方案已应用', `已应用 ${selected.length} 个方案`);
    closeModal('packageModal');
}

// ============================================
// 病历模板
// ============================================

function showTemplateSelector() {
    showModal('templateModal');
}

function selectTemplate(element) {
    document.querySelectorAll('.template-item').forEach(item => {
        item.classList.remove('selected');
    });
    element.classList.add('selected');
}

function applyTemplate() {
    const selected = document.querySelector('.template-item.selected');
    
    if (!selected) {
        showToast('warning', '请选择模板');
        return;
    }
    
    const templateName = selected.querySelector('.template-name').textContent;
    
    // 根据模板填充病历内容
    if (templateName.includes('急性上呼吸道感染')) {
        document.querySelector('#chiefComplaint .form-textarea').value = '发热、咳嗽3天';
        document.querySelector('#presentIllness .form-textarea').value = '患者3天前受凉后出现发热，体温最高38.5℃，伴有咳嗽、咳少量白色粘痰，流涕，无胸闷气促，无恶心呕吐。自服感冒药后症状缓解不明显，遂来就诊。';
    }
    
    showToast('success', '模板已应用', templateName);
    closeModal('templateModal');
}

function clearMedicalRecord() {
    if (confirm('确定要清除所有病历内容吗？')) {
        document.querySelectorAll('.medical-record-section .form-textarea').forEach(textarea => {
            textarea.value = '';
        });
        document.querySelectorAll('.vital-input').forEach(input => {
            input.value = '';
        });
        showToast('success', '病历内容已清除');
    }
}

// ============================================
// 病人信息操作
// ============================================

function toggleIdNumber() {
    const masked = document.querySelector('.id-number .masked');
    const btn = document.querySelector('.id-number .icon-btn i');
    
    if (masked.textContent.includes('*')) {
        masked.textContent = state.currentPatient?.idNumber || '330102198801121234';
        btn.className = 'fas fa-eye-slash';
    } else {
        const idNumber = masked.textContent;
        masked.textContent = idNumber.substring(0, 4) + '**********' + idNumber.substring(14);
        btn.className = 'fas fa-eye';
    }
}

function viewMedicalRecord() {
    showModal('medicalRecordModal');
}

function switchRecordTab(tabName) {
    document.querySelectorAll('.record-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 根据不同标签显示不同内容
    showToast('info', '切换到', tabName);
}

function showHistoryDetail(date) {
    document.getElementById('historyDetailDate').textContent = date;
    showModal('historyDetailModal');
}

function copyHistoryData() {
    showToast('success', '历史数据已复制到本次就诊');
    closeModal('historyDetailModal');
}

// ============================================
// 标记重点关注
// ============================================

function markFocusPatient() {
    showModal('markFocusModal');
}

function confirmMarkFocus() {
    const reason = document.getElementById('focusReason').value;
    const note = document.getElementById('focusNote').value;
    
    if (!reason) {
        showToast('warning', '请选择关注原因');
        return;
    }
    
    // 在当前就诊病人上添加关注标记
    const currentPatient = document.querySelector('#currentList .patient-item');
    if (currentPatient) {
        const tags = currentPatient.querySelector('.patient-tags');
        if (!tags.querySelector('.tag-focus')) {
            const focusTag = document.createElement('span');
            focusTag.className = 'tag tag-focus';
            focusTag.title = '重点关注';
            focusTag.innerHTML = '<i class="fas fa-star"></i>';
            tags.appendChild(focusTag);
        }
    }
    
    closeModal('markFocusModal');
    showToast('success', '已标记为重点关注', note || reason);
}

function showFollowedPatients() {
    showToast('info', '已关注病人列表', '功能开发中');
}

// ============================================
// 弹窗控制
// ============================================

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function closeActiveModal() {
    const activeModal = document.querySelector('.modal.active');
    if (activeModal) {
        activeModal.classList.remove('active');
    }
}

function showRegistration() {
    showModal('registrationModal');
}

function confirmRegistration() {
    const form = document.querySelector('#registrationModal .form-grid');
    const name = form.querySelector('input[type="text"]').value.trim();
    const gender = form.querySelector('select').value;
    const age = form.querySelector('input[type="number"]').value;
    
    if (!name || !gender || !age) {
        showToast('warning', '请填写完整信息');
        return;
    }
    
    showToast('success', '挂号成功', name);
    closeModal('registrationModal');
    
    // 添加新病人到候诊列表
    const waitingList = document.getElementById('waitingList');
    const newItem = document.createElement('div');
    newItem.className = 'patient-item';
    newItem.dataset.id = Date.now().toString();
    newItem.innerHTML = `
        <div class="patient-avatar ${gender === 'male' ? 'male' : 'female'}">
            <i class="fas fa-${gender === 'male' ? 'male' : 'female'}"></i>
        </div>
        <div class="patient-info-brief">
            <div class="patient-name">${name}</div>
            <div class="patient-meta">${gender === 'male' ? '男' : '女'} | ${age}岁 | ${new Date().toLocaleTimeString().slice(0, 5)}</div>
        </div>
        <div class="patient-tags"></div>
    `;
    newItem.onclick = function() { selectPatient(this); };
    newItem.ondblclick = function() { startConsultation(this); };
    
    waitingList.appendChild(newItem);
    updateWaitingCount();
    
    // 重置表单
    form.querySelectorAll('input').forEach(input => input.value = '');
    form.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
}

function showSettings() {
    showModal('settingsModal');
}

function saveSettings() {
    showToast('success', '设置已保存');
    closeModal('settingsModal');
}

function showReSignIn() {
    if (confirm('确定要重新签到吗？这将刷新页面。')) {
        window.location.href = 'login.html';
    }
}

function transferPatient() {
    showModal('transferModal');
}

function confirmTransfer() {
    const dept = document.querySelector('#transferModal select').value;
    
    if (!dept) {
        showToast('warning', '请选择转诊科室');
        return;
    }
    
    showToast('success', '转诊成功');
    closeModal('transferModal');
    
    // 移除当前就诊病人
    const currentItem = document.querySelector('#currentList .patient-item');
    if (currentItem) {
        currentItem.remove();
    }
}

// ============================================
// 下拉菜单控制
// ============================================

function toggleDropdown(btn) {
    const dropdown = btn.closest('.dropdown');
    const menu = dropdown.querySelector('.dropdown-menu');
    
    closeAllDropdowns();
    menu.classList.toggle('active');
    
    event.stopPropagation();
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('active');
    });
}

function resumeConsultation() {
    const completedList = document.getElementById('completedList');
    const firstCompleted = completedList.querySelector('.patient-item');
    
    if (firstCompleted) {
        firstCompleted.classList.remove('completed');
        startConsultation(firstCompleted);
        showToast('success', '已恢复接诊');
    } else {
        showToast('info', '没有可恢复的病人');
    }
}

function cancelConsultation() {
    if (confirm('确定要取消接诊吗？病人将回到候诊队列。')) {
        const currentItem = document.querySelector('#currentList .patient-item');
        if (currentItem) {
            currentItem.classList.remove('active');
            currentItem.querySelector('.patient-tags').innerHTML = '';
            
            const waitingList = document.getElementById('waitingList');
            waitingList.prepend(currentItem);
            
            document.getElementById('currentList').innerHTML = '';
            
            showToast('success', '已取消接诊');
            updateWaitingCount();
        }
    }
}

// ============================================
// 其他功能
// ============================================

function logout() {
    if (confirm('确定要退出登录吗？')) {
        window.location.href = 'login.html';
    }
}

function showHelp() {
    const shortcuts = `
┌─────────────────────────────────────┐
│         快捷键帮助                   │
├─────────────────────────────────────┤
│  ↓          通用新增项目             │
│  ←→↑        移动输入项               │
│  Enter      光标向后跳、确认          │
│  Ctrl+S     发送医嘱、完成接诊        │
│  Ctrl+P     打印                     │
│  Ctrl+D     新增处方                 │
│  Ctrl+Q     调出成套方案             │
│  Ctrl+E     复制医嘱                 │
│  Ctrl+1     选择本人范围             │
│  Ctrl+2     选择本科范围             │
│  Ctrl+3     选择全院范围             │
│  Ctrl+R     成套全清                 │
│  Ctrl+A     成套全选                 │
│  F1         帮助                     │
│  F11        全屏                     │
│  ESC        关闭弹窗                 │
│  Delete     删除医嘱或诊断           │
└─────────────────────────────────────┘
`;
    alert(shortcuts);
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        showToast('info', '已进入全屏模式', '按 F11 或 ESC 退出');
    } else {
        document.exitFullscreen();
    }
}

// ============================================
// Toast 提示
// ============================================

function showToast(type, title, message = '') {
    const container = document.getElementById('toastContainer');
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        warning: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="${icons[type]}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-message">${message}</div>` : ''}
        </div>
    `;
    
    container.appendChild(toast);
    
    // 3秒后自动消失
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// 工具函数
// ============================================

function getPinyin(str) {
    // 简单的拼音首字母映射
    const pinyinMap = {
        '布': 'b', '洛': 'l', '芬': 'f', '缓': 'h', '释': 's', '胶': 'j', '囊': 'n',
        '片': 'p', '对': 'd', '乙': 'y', '酰': 'x', '氨': 'a', '基': 'j', '酚': 'f',
        '阿': 'a', '莫': 'm', '西': 'x', '林': 'l', '头': 't', '孢': 'b', '克': 'k',
        '肟': 'w', '分': 'f', '散': 's', '氯': 'l', '雷': 'l', '他': 't', '定': 'd',
        '复': 'f', '方': 'f', '烷': 'w', '苯': 'b', '磺': 'h', '酸': 's', '地': 'd',
        '平': 'p', '奥': 'a', '美': 'm', '拉': 'l', '唑': 'z', '肠': 'c', '溶': 'r',
        '蒙': 'm', '脱': 't', '石': 's', '王': 'w', '建': 'j', '国': 'g', '李': 'l',
        '玲': 'l', '张': 'z', '伟': 'w', '赵': 'z', '晓': 'x', '燕': 'y', '刘': 'l',
        '德': 'd', '华': 'h', '陈': 'c', '明': 'm', '辉': 'h', '周': 'z', '小': 'x',
        '红': 'h', '吴': 'w', '强': 'q', '孙': 's', '丽': 'l'
    };
    
    return str.split('').map(char => pinyinMap[char] || '').join('');
}

// 添加药品建议样式
const suggestionStyles = document.createElement('style');
suggestionStyles.textContent = `
    .drug-suggestions {
        position: absolute;
        top: 100%;
        left: 16px;
        right: 16px;
        background: white;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        max-height: 240px;
        overflow-y: auto;
        z-index: 1000;
        display: none;
    }
    
    .suggestion-item {
        display: flex;
        align-items: center;
        padding: 10px 14px;
        cursor: pointer;
        border-bottom: 1px solid var(--border-light);
        transition: var(--transition-fast);
    }
    
    .suggestion-item:last-child {
        border-bottom: none;
    }
    
    .suggestion-item:hover {
        background: var(--bg-secondary);
    }
    
    .suggestion-item .drug-name {
        flex: 1;
        font-weight: 500;
    }
    
    .suggestion-item .drug-spec {
        color: var(--text-tertiary);
        font-size: 12px;
        margin: 0 16px;
    }
    
    .suggestion-item .drug-price {
        color: var(--danger-color);
        font-weight: 500;
    }
    
    .no-result {
        padding: 20px;
        text-align: center;
        color: var(--text-tertiary);
    }
    
    /* 中药配方已保存样式 */
    .tcm-prescription {
        padding: 16px;
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
    }
    
    .tcm-prescription .tcm-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        font-weight: 500;
    }
    
    .tcm-prescription .tcm-herbs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }
    
    .tcm-prescription .tcm-herb {
        padding: 4px 10px;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        font-size: 13px;
    }
    
    /* 检查详情样式 */
    .exam-detail {
        font-size: 12px;
        color: var(--text-tertiary);
        margin-left: 8px;
    }
`;
document.head.appendChild(suggestionStyles);
