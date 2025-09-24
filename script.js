document.addEventListener('DOMContentLoaded', () => {
    // ======== 1. アプリケーションの状態(State)管理 ========
    let state = {
        students: [],
        changes: {},
        currentDisplayDate: new Date(),
        editingStudentId: null,
        reportText: ''
    };

    // ======== 2. DOM要素の取得 ========
    const studentListEl = document.getElementById('student-list');
    const studentForm = document.getElementById('student-form');
    const calendarGridEl = document.getElementById('calendar-grid');
    const currentWeekDisplayEl = document.getElementById('current-week-display');
    const changeForm = document.getElementById('change-form');
    const reportOutputEl = document.getElementById('report-output');

    // ======== 3. レンダリング（描画）関数 ========
    function render() {
        renderStudentList();
        renderStudentForm();
        renderCalendar();
        renderChangeForm();
        renderReport();
    }

    function renderStudentList() {
        studentListEl.innerHTML = '';
        if (state.students.length === 0) {
            studentListEl.innerHTML = '<p>生徒が登録されていません。</p>';
            return;
        }
        state.students.forEach(student => {
            const item = document.createElement('div');
            item.className = 'student-item';
            // ▼▼▼ 変更点: 終了時間を表示 ▼▼▼
            item.innerHTML = `
                <span><strong>${student.name}</strong> (${getDayOfWeekJP(student.dayOfWeek)} ${student.startTime}-${student.endTime})</span>
                <div class="actions">
                    <button class="edit-btn" data-id="${student.id}">編集</button>
                    <button class="delete-btn" data-id="${student.id}">削除</button>
                </div>`;
            studentListEl.appendChild(item);
        });
    }

    function renderStudentForm() {
        const student = state.students.find(s => s.id === state.editingStudentId);
        studentForm.elements.id.value = student ? student.id : '';
        studentForm.elements.name.value = student ? student.name : '';
        studentForm.elements.dayOfWeek.value = student ? student.dayOfWeek : '1';
        studentForm.elements.startTime.value = student ? student.startTime : '19:00';
        // ▼▼▼ 変更点: 終了時間フォームの値を設定 ▼▼▼
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
            if (dateString === todayString) {
                dateNumberSpan.classList.add('is-today');
            }
            dayHeader.appendChild(dateNumberSpan);
            dayHeader.append(`(${getDayOfWeekJP(dayOfWeek)})`);
            dayCell.appendChild(dayHeader);
            
            const appointments = (state.changes[dateString] || state.students.filter(s => s.dayOfWeek == dayOfWeek))
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
            
            appointments.forEach(appt => {
                const appointmentEl = document.createElement('div');
                appointmentEl.className = 'appointment';
                appointmentEl.dataset.name = appt.name;
                appointmentEl.dataset.date = dateString;
                // ▼▼▼ 変更点: 終了時間を表示 ▼▼▼
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

    function renderReport() {
        reportOutputEl.value = state.reportText;
    }

    // ======== 4. イベントリスナーと状態変更 ========
    document.getElementById('student-management-panel').addEventListener('click', e => {
        if (e.target.matches('.edit-btn')) {
            state.editingStudentId = Number(e.target.dataset.id);
            render();
        }
        if (e.target.matches('.delete-btn')) {
            const studentId = Number(e.target.dataset.id);
            if (confirm('この生徒を削除しますか？')) {
                state.students = state.students.filter(s => s.id !== studentId);
                saveAndRender();
            }
        }
    });

    studentForm.addEventListener('submit', e => {
        e.preventDefault();
        const formData = new FormData(studentForm);
        // ▼▼▼ 変更点: 終了時間を取得して保存 ▼▼▼
        const studentData = {
            id: Number(formData.get('id')) || Date.now(),
            name: formData.get('name'),
            dayOfWeek: formData.get('dayOfWeek'),
            startTime: formData.get('startTime'),
            endTime: formData.get('endTime')
        };
        const existingIndex = state.students.findIndex(s => s.id === studentData.id);
        if (existingIndex > -1) {
            state.students[existingIndex] = studentData;
        } else {
            state.students.push(studentData);
        }

        state.students.sort((a, b) => {
            if (a.dayOfWeek !== b.dayOfWeek) {
                return a.dayOfWeek - b.dayOfWeek;
            }
            return a.startTime.localeCompare(b.startTime);
        });

        state.editingStudentId = null;
        saveAndRender();
    });

    studentForm.addEventListener('reset', e => {
        state.editingStudentId = null;
        render();
    });

    document.getElementById('schedule-panel').addEventListener('click', e => {
        if (e.target.matches('#prev-week-btn')) {
            state.currentDisplayDate.setDate(state.currentDisplayDate.getDate() - 7);
            render();
        }
        if (e.target.matches('#next-week-btn')) {
            state.currentDisplayDate.setDate(state.currentDisplayDate.getDate() + 7);
            render();
        }
        if (e.target.matches('#back-to-today-btn')) {
            state.currentDisplayDate = new Date();
            render();
        }
        if (e.target.matches('#copy-report-btn')) {
            if (!state.reportText) return;
            navigator.clipboard.writeText(state.reportText).then(() => {
                alert('報告文をコピーしました！');
            });
        }
        if (e.target.matches('#reset-report-btn')) {
            if (confirm('報告用テキストをリセットしますか？')) {
                state.reportText = '';
                saveAndRender();
            }
        }
    });

    changeForm.addEventListener('submit', e => {
        e.preventDefault();
        const formData = new FormData(changeForm);
        const name = formData.get('name');
        const date = formData.get('date');
        // ▼▼▼ 変更点: フォームからstartTimeとendTimeを取得 ▼▼▼
        const startTime = formData.get('startTime');
        const endTime = formData.get('endTime');
        
        if (!state.changes[date]) state.changes[date] = [];
        state.changes[date] = state.changes[date].filter(appt => appt.name !== name);
        state.changes[date].push({ name, startTime, endTime });
        
        // ▼▼▼ 変更点: updateReportにstartTimeとendTimeを渡す ▼▼▼
        updateReport(name, date, startTime, endTime);
        saveAndRender();
    });
    
    calendarGridEl.addEventListener('contextmenu', e => {
        e.preventDefault();
        const appointmentEl = e.target.closest('.appointment');
        if (!appointmentEl) return;
        const studentName = appointmentEl.dataset.name;
        const dateString = appointmentEl.dataset.date;
        if (confirm(`${dateString} の ${studentName} の予定を消去しますか？`)) {
            if (state.changes[dateString]) {
                state.changes[dateString] = state.changes[dateString].filter(
                    appt => appt.name !== studentName
                );
            } else {
                const date = new Date(`${dateString}T00:00:00`);
                const dayOfWeek = date.getDay();
                const remainingAppointments = state.students.filter(student => {
                    return student.dayOfWeek == dayOfWeek && student.name !== studentName;
                });
                state.changes[dateString] = remainingAppointments;
            }
            saveAndRender();
        }
    });

    // ▼▼▼ 変更点: 関数の引数を変更し、終了時間を直接使うように修正 ▼▼▼
    function updateReport(name, date, startTime, endTime) {
        if (state.reportText === '') {
            state.reportText = '次回予定変更';
        }
        const changeDate = new Date(`${date}T00:00:00`);
        const dayJP = getDayOfWeekJP(changeDate.getDay());
        const newEntry = `\n${changeDate.getMonth() + 1}/${changeDate.getDate()}(${dayJP}) ${startTime}-${endTime} ${name}`;
        state.reportText += newEntry;
    }
    
    // ======== 5. ヘルパー関数と初期化 ========
    // ▼▼▼ 変更点: 1時間で計算していたformatTimeRangeは不要なため削除 ▼▼▼

    function saveAndRender() {
        localStorage.setItem('scheduleAppState', JSON.stringify(state));
        render();
    }

    function loadState() {
        const savedState = localStorage.getItem('scheduleAppState');
        if (savedState) {
            let parsedState = JSON.parse(savedState);
            parsedState.currentDisplayDate = new Date(parsedState.currentDisplayDate);
            
            // ▼▼▼ 追記: 古いデータ形式（endTimeがない）を変換する処理 ▼▼▼
            const migrateData = (item) => {
                if (item && item.startTime && !item.endTime) {
                    const [hourStr, minuteStr] = item.startTime.split(':');
                    const hour = parseInt(hourStr, 10);
                    const endHour = (hour + 1) % 24;
                    item.endTime = `${String(endHour).padStart(2, '0')}:${minuteStr}`;
                }
            };
            parsedState.students.forEach(migrateData);
            Object.values(parsedState.changes).forEach(day => day.forEach(migrateData));
            // ▲▲▲ ここまで追記 ▲▲▲

            state = parsedState;
        }
    }

    function formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function getDayOfWeekJP(dayIndex) {
        return ['日', '月', '火', '水', '木', '金', '土'][dayIndex];
    }

    // アプリケーションの起動
    loadState();
    render();
});