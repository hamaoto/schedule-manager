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
    
    function renderStudentList(){/*...*/}
    function renderStudentForm(){/*...*/}
    function renderCalendar(){/*...*/}
    function renderChangeForm(){/*...*/}
    function renderReport(){/*...*/}

    document.getElementById('student-management-panel').addEventListener('click', e => {/*...*/});
    studentForm.addEventListener('submit', e => {/*...*/});
    studentForm.addEventListener('reset', e => {/*...*/});
    document.getElementById('schedule-panel').addEventListener('click', e => {/*...*/});
    
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
            newEndTime: formData.get('endTime'),
            changeType: formData.get('changeType')
        };
        
        showMoveSourceOptions(student);
        changeForm.classList.add('hidden');
        moveConfirmView.classList.remove('hidden');
    });
    
    cancelMoveBtn.addEventListener('click', () => {
        changeForm.classList.remove('hidden');
        moveConfirmView.classList.add('hidden');
        pendingChange = null;
    });

    confirmMoveBtn.addEventListener('click', () => {
        const selectedSourceDate = moveConfirmView.querySelector('input[name="source-date"]:checked').value;

        if (!state.changes[pendingChange.newDate]) { state.changes[pendingChange.newDate] = []; }
        state.changes[pendingChange.newDate] = state.changes[pendingChange.newDate].filter(appt => appt.name !== pendingChange.name);
        state.changes[pendingChange.newDate].push({ name: pendingChange.name, startTime: pendingChange.newStartTime, endTime: pendingChange.newEndTime });
        
        if (selectedSourceDate !== 'add-only') {
            cancelAppointment(selectedSourceDate, pendingChange.name);
        }

        if (pendingChange.changeType === 'permanent') {
            const studentIndex = state.students.findIndex(s => s.name === pendingChange.name);
            if (studentIndex > -1) {
                const newDateObj = new Date(`${pendingChange.newDate}T00:00:00`);
                const newDayOfWeek = newDateObj.getDay();
                state.students[studentIndex].dayOfWeek = newDayOfWeek;
                state.students[studentIndex].startTime = pendingChange.newStartTime;
                state.students[studentIndex].endTime = pendingChange.newEndTime;
                state.students.sort((a, b) => {
                    if (a.dayOfWeek !== b.dayOfWeek) { return a.dayOfWeek - b.dayOfWeek; }
                    return a.startTime.localeCompare(b.startTime);
                });
            }
        }
        
        updateReport(pendingChange.name, pendingChange.newDate, pendingChange.newStartTime, pendingChange.newEndTime);
        saveAndRender();
        
        changeForm.classList.remove('hidden');
        moveConfirmView.classList.add('hidden');
        pendingChange = null;
    });

    calendarGridEl.addEventListener('contextmenu', e => {/*...*/});
    
    function cancelAppointment(dateString, studentName) {/*...*/}
    function showMoveSourceOptions(student) {/*...*/}
    function getWeekLabel(targetDate, today) {/*...*/}
    function updateReport(name, date, startTime, endTime) {/*...*/}
    function saveAndRender() {/*...*/}

    // ▼▼▼ この関数の中身を変更します ▼▼▼
    function loadState() {
        const savedState = localStorage.getItem('scheduleAppState');
        if (savedState) {
            state = JSON.parse(savedState); // 保存された生徒情報や変更履歴は読み込む

            // データの古い形式を変換する処理（マイグレーション）
            const migrateData = (item) => {
                if (item && item.startTime && !item.endTime) {
                    const [hourStr, minuteStr] = item.startTime.split(':');
                    const hour = parseInt(hourStr, 10);
                    const endHour = (hour + 1) % 24;
                    item.endTime = `${String(endHour).padStart(2, '0')}:${minuteStr}`;
                }
            };
            if(state.students) state.students.forEach(migrateData);
            if(state.changes) Object.values(state.changes).forEach(day => day.forEach(migrateData));

            // ただし、カレンダーの表示週だけは常に「今週」にリセットする
            state.currentDisplayDate = new Date();
        }
    }

    function formatDate(date) {/*...*/}
    function getDayOfWeekJP(dayIndex) {/*...*/}
    
    // --- ここから、省略していた関数の完全な中身です ---
    function renderStudentList(){studentListEl.innerHTML = ''; if (state.students.length === 0) { studentListEl.innerHTML = '<p>生徒が登録されていません。</p>'; return; } state.students.forEach(student => { const item = document.createElement('div'); item.className = 'student-item'; item.innerHTML = `<span><strong>${student.name}</strong> (${getDayOfWeekJP(student.dayOfWeek)} ${student.startTime}-${student.endTime})</span><div class="actions"><button class="edit-btn" data-id="${student.id}">編集</button><button class="delete-btn" data-id="${student.id}">削除</button></div>`; studentListEl.appendChild(item); }); }
    function renderStudentForm(){ const student = state.students.find(s => s.id === state.editingStudentId); studentForm.elements.id.value = student ? student.id : ''; studentForm.elements.name.value = student ? student.name : ''; studentForm.elements.dayOfWeek.value = student ? student.dayOfWeek : '1'; studentForm.elements.startTime.value = student ? student.startTime : '19:00'; studentForm.elements.endTime.value = student ? student.endTime : '20:00'; }
    function renderCalendar(){ calendarGridEl.innerHTML = ''; const todayString = formatDate(new Date()); const startOfWeek = new Date(state.currentDisplayDate); startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(endOfWeek.getDate() + 6); currentWeekDisplayEl.textContent = `${formatDate(startOfWeek)} 〜 ${formatDate(endOfWeek)}`; for (let i = 0; i < 7; i++) { const date = new Date(startOfWeek); date.setDate(date.getDate() + i); const dayOfWeek = date.getDay(); const dateString = formatDate(date); const dayCell = document.createElement('div'); dayCell.className = 'day-cell'; const dayHeader = document.createElement('div'); dayHeader.className = 'day-header'; if (dayOfWeek === 0) dayHeader.classList.add('is-sunday'); if (dayOfWeek === 6) dayHeader.classList.add('is-saturday'); const dateNumberSpan = document.createElement('span'); dateNumberSpan.className = 'date-number'; dateNumberSpan.textContent = date.getDate(); if (dateString === todayString) { dateNumberSpan.classList.add('is-today'); } dayHeader.appendChild(dateNumberSpan); dayHeader.append(`(${getDayOfWeekJP(dayOfWeek)})`); dayCell.appendChild(dayHeader); const appointments = (state.changes[dateString] || state.students.filter(s => s.dayOfWeek == dayOfWeek)).sort((a, b) => a.startTime.localeCompare(b.startTime)); appointments.forEach(appt => { const appointmentEl = document.createElement('div'); appointmentEl.className = 'appointment'; appointmentEl.dataset.name = appt.name; appointmentEl.dataset.date = dateString; appointmentEl.textContent = `${appt.startTime}-${appt.endTime} ${appt.name}`; dayCell.appendChild(appointmentEl); }); calendarGridEl.appendChild(dayCell); } }
    function renderChangeForm(){ const select = changeForm.elements.name; const currentlySelectedStudent = select.value; select.innerHTML = ''; state.students.forEach(student => { const option = document.createElement('option'); option.value = student.name; option.textContent = student.name; select.appendChild(option); }); if (currentlySelectedStudent) { select.value = currentlySelectedStudent; } }
    function renderReport(){ reportOutputEl.value = state.reportText; }
    document.getElementById('student-management-panel').addEventListener('click', e => { if (e.target.matches('.edit-btn')) { state.editingStudentId = Number(e.target.dataset.id); render(); } if (e.target.matches('.delete-btn')) { const studentId = Number(e.target.dataset.id); if (confirm('この生徒を削除しますか？')) { state.students = state.students.filter(s => s.id !== studentId); saveAndRender(); } } });
    studentForm.addEventListener('submit', e => { e.preventDefault(); const formData = new FormData(studentForm); const studentData = { id: Number(formData.get('id')) || Date.now(), name: formData.get('name'), dayOfWeek: formData.get('dayOfWeek'), startTime: formData.get('startTime'), endTime: formData.get('endTime') }; const existingIndex = state.students.findIndex(s => s.id === studentData.id); if (existingIndex > -1) { state.students[existingIndex] = studentData; } else { state.students.push(studentData); } state.students.sort((a, b) => { if (a.dayOfWeek !== b.dayOfWeek) { return a.dayOfWeek - b.dayOfWeek; } return a.startTime.localeCompare(b.startTime); }); state.editingStudentId = null; saveAndRender(); });
    studentForm.addEventListener('reset', e => { state.editingStudentId = null; render(); });
    document.getElementById('schedule-panel').addEventListener('click', e => { if (e.target.matches('#prev-week-btn')) { state.currentDisplayDate.setDate(state.currentDisplayDate.getDate() - 7); render(); } if (e.target.matches('#next-week-btn')) { state.currentDisplayDate.setDate(state.currentDisplayDate.getDate() + 7); render(); } if (e.target.matches('#back-to-today-btn')) { state.currentDisplayDate = new Date(); render(); } if (e.target.matches('#copy-report-btn')) { if (!state.reportText) return; navigator.clipboard.writeText(state.reportText).then(() => { alert('報告文をコピーしました！'); }); } if (e.target.matches('#reset-report-btn')) { if (confirm('報告用テキストをリセットしますか？')) { state.reportText = ''; saveAndRender(); } } });
    calendarGridEl.addEventListener('contextmenu', e => { e.preventDefault(); const appointmentEl = e.target.closest('.appointment'); if (!appointmentEl) return; const studentName = appointmentEl.dataset.name; const dateString = appointmentEl.dataset.date; if (confirm(`${dateString} の ${studentName} の予定を消去しますか？`)) { cancelAppointment(dateString, studentName); saveAndRender(); } });
    function cancelAppointment(dateString, studentName) { const date = new Date(`${dateString}T00:00:00`); const dayOfWeek = date.getDay(); const currentAppointments = state.changes[dateString] ? [...state.changes[dateString]] : state.students.filter(s => s.dayOfWeek == dayOfWeek); const updatedAppointments = currentAppointments.filter(appt => appt.name !== studentName); state.changes[dateString] = updatedAppointments; }
    function showMoveSourceOptions(student) { moveSourceOptions.innerHTML = ''; const today = new Date(); today.setHours(0, 0, 0, 0); const options = []; for (let i = 1; i < 22; i++) { let searchDate = new Date(today); searchDate.setDate(today.getDate() + i); if (searchDate.getDay() == student.dayOfWeek) { const label = getWeekLabel(searchDate, today); if (label) { options.push({ dateString: formatDate(searchDate), dayJP: getDayOfWeekJP(searchDate.getDay()), label: label }); } } } if (options.length > 0) { options.forEach((opt, index) => { const optionHtml = `<label><input type="radio" name="source-date" value="${opt.dateString}" ${index === 0 ? 'checked' : ''}> ${opt.label} ${opt.dateString} (${opt.dayJP}) の予定</label>`; moveSourceOptions.innerHTML += optionHtml; }); } moveSourceOptions.innerHTML += `<label><input type="radio" name="source-date" value="add-only" ${options.length === 0 ? 'checked' : ''}> 元の予定は消さず、新しい予定を追加するだけ</label>`; }
    function getWeekLabel(targetDate, today) { const todayDay = today.getDay(); const startOfThisWeek = new Date(today); startOfThisWeek.setDate(today.getDate() - todayDay); const startOfNextWeek = new Date(startOfThisWeek); startOfNextWeek.setDate(startOfThisWeek.getDate() + 7); const startOfWeekAfterNext = new Date(startOfNextWeek); startOfWeekAfterNext.setDate(startOfNextWeek.getDate() + 7); const startOfWeekAfterAfterNext = new Date(startOfWeekAfterNext); startOfWeekAfterAfterNext.setDate(startOfWeekAfterNext.getDate() + 7); if (targetDate >= startOfNextWeek && targetDate < startOfWeekAfterNext) { return "（来週）"; } else if (targetDate >= startOfWeekAfterNext && targetDate < startOfWeekAfterAfterNext) { return "（再来週）"; } else { return null; } }
    function updateReport(name, date, startTime, endTime) { if (state.reportText === '') { state.reportText = '次回予定変更'; } const changeDate = new Date(`${date}T00:00:00`); const dayJP = getDayOfWeekJP(changeDate.getDay()); const newEntry = `\n${changeDate.getMonth() + 1}/${changeDate.getDate()}(${dayJP}) ${startTime}-${endTime} ${name}`; state.reportText += newEntry; }
    function saveAndRender() { localStorage.setItem('scheduleAppState', JSON.stringify(state)); render(); }
    function formatDate(date) { const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0'); return `${y}-${m}-${d}`; }
    function getDayOfWeekJP(dayIndex) { return ['日', '月', '火', '水', '木', '金', '土'][dayIndex]; }

    loadState();
    render();
});