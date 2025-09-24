document.addEventListener('DOMContentLoaded', () => {
    let state = {
        students: [],
        changes: {},
        currentDisplayDate: new Date(),
        editingStudentId: null,
        reportText: ''
    };
    let pendingChange = null;

    const studentListEl = document.getElementById('student-list');
    const studentForm = document.getElementById('student-form');
    const calendarGridEl = document.getElementById('calendar-grid');
    const currentWeekDisplayEl = document.getElementById('current-week-display');
    const changeForm = document.getElementById('change-form');
    const reportOutputEl = document.getElementById('report-output');
    // ▼▼▼ 追記 ▼▼▼
    const moveConfirmView = document.getElementById('move-confirm-view');
    const moveSourceOptions = document.getElementById('move-source-options');
    const confirmMoveBtn = document.getElementById('confirm-move-btn');
    const cancelMoveBtn = document.getElementById('cancel-move-btn');

    function render() {
        renderStudentList();
        renderStudentForm();
        renderCalendar();
        renderChangeForm();
        renderReport();
    }
    // ... renderStudentList, renderStudentForm, renderCalendar などの描画関数は変更なし ...
    function renderStudentList() {
        studentListEl.innerHTML = '';
        if (state.students.length === 0) { studentListEl.innerHTML = '<p>生徒が登録されていません。</p>'; return; }
        state.students.forEach(student => {
            const item = document.createElement('div');
            item.className = 'student-item';
            item.innerHTML = `<span><strong>${student.name}</strong> (${getDayOfWeekJP(student.dayOfWeek)} ${student.startTime}-${student.endTime})</span><div class="actions"><button class="edit-btn" data-id="${student.id}">編集</button><button class="delete-btn" data-id="${student.id}">削除</button></div>`;
            studentListEl.appendChild(item);
        });
    }
    function renderStudentForm() {
        const student = state.students.find(s => s.id === state.editingStudentId);
        studentForm.elements.id.value = student ? student.id : '';
        studentForm.elements.name.value = student ? student.name : '';
        studentForm.elements.dayOfWeek.value = student ? student.dayOfWeek : '1';
        studentForm.elements.startTime.value = student ? student.startTime : '19:00';
        studentForm.elements.endTime.value = student ? student.endTime : '20:00';
    }
    function renderCalendar() {
        calendarGridEl.innerHTML = '';
        const todayString = formatDate(new Date());
        const startOfWeek = new Date(state.currentDisplayDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        currentWeekDisplayEl.textContent = `${formatDate(startOfWeek)} 〜 ${formatDate(endOfWeek)}`;
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(date.getDate() + i);
            const dayOfWeek = date.getDay();
            const dateString = formatDate(date);
            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell';
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            if (dayOfWeek === 0) dayHeader.classList.add('is-sunday');
            if (dayOfWeek === 6) dayHeader.classList.add('is-saturday');
            const dateNumberSpan = document.createElement('span');
            dateNumberSpan.className = 'date-number';
            dateNumberSpan.textContent = date.getDate();
            if (dateString === todayString) { dateNumberSpan.classList.add('is-today'); }
            dayHeader.appendChild(dateNumberSpan);
            dayHeader.append(`(${getDayOfWeekJP(dayOfWeek)})`);
            dayCell.appendChild(dayHeader);
            const appointments = (state.changes[dateString] || state.students.filter(s => s.dayOfWeek == dayOfWeek)).sort((a, b) => a.startTime.localeCompare(b.startTime));
            appointments.forEach(appt => {
                const appointmentEl = document.createElement('div');
                appointmentEl.className = 'appointment';
                appointmentEl.dataset.name = appt.name;
                appointmentEl.dataset.date = dateString;
                appointmentEl.textContent = `${appt.startTime}-${appt.endTime} ${appt.name}`;
                dayCell.appendChild(appointmentEl);
            });
            calendarGridEl.appendChild(dayCell);
        }
    }
    function renderChangeForm() {
        const select = changeForm.elements.name;
        select.innerHTML = '';
        state.students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.name;
            option.textContent = student.name;
            select.appendChild(option);
        });
    }
    function renderReport() { reportOutputEl.value = state.reportText; }

    // ... studentForm, panel-click などのリスナーは変更なし ...
    document.getElementById('student-management-panel').addEventListener('click', e => { if (e.target.matches('.edit-btn')) { state.editingStudentId = Number(e.target.dataset.id); render(); } if (e.target.matches('.delete-btn')) { const studentId = Number(e.target.dataset.id); if (confirm('この生徒を削除しますか？')) { state.students = state.students.filter(s => s.id !== studentId); saveAndRender(); } } });
    studentForm.addEventListener('submit', e => { e.preventDefault(); const formData = new FormData(studentForm); const studentData = { id: Number(formData.get('id')) || Date.now(), name: formData.get('name'), dayOfWeek: formData.get('dayOfWeek'), startTime: formData.get('startTime'), endTime: formData.get('endTime') }; const existingIndex = state.students.findIndex(s => s.id === studentData.id); if (existingIndex > -1) { state.students[existingIndex] = studentData; } else { state.students.push(studentData); } state.students.sort((a, b) => { if (a.dayOfWeek !== b.dayOfWeek) { return a.dayOfWeek - b.dayOfWeek; } return a.startTime.localeCompare(b.startTime); }); state.editingStudentId = null; saveAndRender(); });
    studentForm.addEventListener('reset', e => { state.editingStudentId = null; render(); });
    document.getElementById('schedule-panel').addEventListener('click', e => { if (e.target.matches('#prev-week-btn')) { state.currentDisplayDate.setDate(state.currentDisplayDate.getDate() - 7); render(); } if (e.target.matches('#next-week-btn')) { state.currentDisplayDate.setDate(state.currentDisplayDate.getDate() + 7); render(); } if (e.target.matches('#back-to-today-btn')) { state.currentDisplayDate = new Date(); render(); } if (e.target.matches('#copy-report-btn')) { if (!state.reportText) return; navigator.clipboard.writeText(state.reportText).then(() => { alert('報告文をコピーしました！'); }); } if (e.target.matches('#reset-report-btn')) { if (confirm('報告用テキストをリセットしますか？')) { state.reportText = ''; saveAndRender(); } } });

    // ▼▼▼ 「特訓日時の変更」フォームの処理を変更 ▼▼▼
    changeForm.addEventListener('submit', e => {
        e.preventDefault();
        const formData = new FormData(changeForm);
        const name = formData.get('name');
        const student = state.students.find(s => s.name === name);
        if (!student) return;

        pendingChange = {
            name: name,
            newDate: formData.get('date'),
            newStartTime: formData.get('startTime'),
            newEndTime: formData.get('endTime')
        };
        
        // 移動元の候補を生成して確認画面を表示
        moveSourceOptions.innerHTML = '';
        let today = new Date();
        today.setHours(0, 0, 0, 0);
        let count = 0;
        let searchDate = new Date(today);

        while (count < 4) {
            if (searchDate.getDay() == student.dayOfWeek) {
                const dateString = formatDate(searchDate);
                const optionHtml = `<label><input type="radio" name="source-date" value="${dateString}" ${count === 0 ? 'checked' : ''}> ${dateString} (${getDayOfWeekJP(searchDate.getDay())}) の予定</label>`;
                moveSourceOptions.innerHTML += optionHtml;
                count++;
            }
            searchDate.setDate(searchDate.getDate() + 1);
        }
        moveSourceOptions.innerHTML += `<label><input type="radio" name="source-date" value="add-only"> 元の予定は消さず、新しい予定を追加するだけ</label>`;
        
        // フォームを非表示にし、確認画面を表示
        changeForm.classList.add('hidden');
        moveConfirmView.classList.remove('hidden');
    });
    
    // ▼▼▼ 追記: 確認画面のボタンのイベントリスナー ▼▼▼
    cancelMoveBtn.addEventListener('click', () => {
        changeForm.classList.remove('hidden');
        moveConfirmView.classList.add('hidden');
        pendingChange = null;
    });

    confirmMoveBtn.addEventListener('click', () => {
        const selectedSourceDate = moveSourceOptions.querySelector('input[name="source-date"]:checked').value;

        // 1. 新しい予定を追加
        if (!state.changes[pendingChange.newDate]) {
            state.changes[pendingChange.newDate] = [];
        }
        state.changes[pendingChange.newDate] = state.changes[pendingChange.newDate].filter(appt => appt.name !== pendingChange.name);
        state.changes[pendingChange.newDate].push({
            name: pendingChange.name,
            startTime: pendingChange.newStartTime,
            endTime: pendingChange.newEndTime
        });
        
        // 2. 移動元の予定を消去
        if (selectedSourceDate !== 'add-only') {
            const studentToCancel = state.students.find(s => s.name === pendingChange.name);
            if (!state.changes[selectedSourceDate]) {
                const date = new Date(`${selectedSourceDate}T00:00:00`);
                state.changes[selectedSourceDate] = state.students.filter(s => s.dayOfWeek == date.getDay() && s.name !== studentToCancel.name);
            } else {
                state.changes[selectedSourceDate] = state.changes[selectedSourceDate].filter(appt => appt.name !== studentToCancel.name);
            }
        }
        
        updateReport(pendingChange.name, pendingChange.newDate, pendingChange.newStartTime, pendingChange.newEndTime);
        saveAndRender();
        
        // 画面を元に戻す
        changeForm.classList.remove('hidden');
        moveConfirmView.classList.add('hidden');
        pendingChange = null;
    });


    // ... contextmenu, updateReport, saveAndRender, loadStateなどのヘルパー関数は変更なし ...
    calendarGridEl.addEventListener('contextmenu', e => { e.preventDefault(); const appointmentEl = e.target.closest('.appointment'); if (!appointmentEl) return; const studentName = appointmentEl.dataset.name; const dateString = appointmentEl.dataset.date; if (confirm(`${dateString} の ${studentName} の予定を消去しますか？`)) { if (state.changes[dateString]) { state.changes[dateString] = state.changes[dateString].filter(appt => appt.name !== studentName); } else { const date = new Date(`${dateString}T00:00:00`); const dayOfWeek = date.getDay(); const remainingAppointments = state.students.filter(student => { return student.dayOfWeek == dayOfWeek && student.name !== studentName; }); state.changes[dateString] = remainingAppointments; } saveAndRender(); } });
    function updateReport(name, date, startTime, endTime) { if (state.reportText === '') { state.reportText = '次回予定変更'; } const changeDate = new Date(`${date}T00:00:00`); const dayJP = getDayOfWeekJP(changeDate.getDay()); const newEntry = `\n${changeDate.getMonth() + 1}/${changeDate.getDate()}(${dayJP}) ${startTime}-${endTime} ${name}`; state.reportText += newEntry; }
    function saveAndRender() { localStorage.setItem('scheduleAppState', JSON.stringify(state)); render(); }
    function loadState() { const savedState = localStorage.getItem('scheduleAppState'); if (savedState) { let parsedState = JSON.parse(savedState); parsedState.currentDisplayDate = new Date(parsedState.currentDisplayDate); const migrateData = (item) => { if (item && item.startTime && !item.endTime) { const [hourStr, minuteStr] = item.startTime.split(':'); const hour = parseInt(hourStr, 10); const endHour = (hour + 1) % 24; item.endTime = `${String(endHour).padStart(2, '0')}:${minuteStr}`; } }; if(parsedState.students) parsedState.students.forEach(migrateData); if(parsedState.changes) Object.values(parsedState.changes).forEach(day => day.forEach(migrateData)); state = parsedState; } }
    function formatDate(date) { const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0'); return `${y}-${m}-${d}`; }
    function getDayOfWeekJP(dayIndex) { return ['日', '月', '火', '水', '木', '金', '土'][dayIndex]; }

    loadState();
    render();
});