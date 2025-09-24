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
            item.innerHTML = `
                <span><strong>${student.name}</strong> (${getDayOfWeekJP(student.dayOfWeek)} ${formatTimeRange(student.startTime)})</span>
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
                appointmentEl.textContent = `${formatTimeRange(appt.startTime)} ${appt.name}`;
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
        const studentData = {
            id: Number(formData.get('id')) || Date.now(),
            name: formData.get('name'),
            dayOfWeek: formData.get('dayOfWeek'),
            startTime: formData.get('startTime')
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
        const time = formData.get('time');
        
        if (!state.changes[date]) state.changes[date] = [];
        state.changes[date] = state.changes[date].filter(appt => appt.name !== name);
        state.changes[date].push({ name, startTime: time });
        
        updateReport(name, date, time);
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

    // ▼▼▼ ここから変更 ▼▼▼
    function updateReport(name, date, time) {
        // 新しい予定変更の文字列を作成
        const changeDate = new Date(`${date}T00:00:00`);
        const dayJP = getDayOfWeekJP(changeDate.getDay());
        const newEntry = `${changeDate.getMonth() + 1}/${changeDate.getDate()}(${dayJP}) ${formatTimeRange(time)} ${name}`;
        
        // レポートテキストが空ならヘッダーを追加
        if (state.reportText === '') {
            state.reportText = '次回予定変更';
        }

        // 改行(\n)を加えて新しい予定を追記
        state.reportText += `\n${newEntry}`;
    }
    // ▲▲▲ ここまで変更 ▲▲▲
    
    // ======== 5. ヘルパー関数と初期化 ========
    function formatTimeRange(startTime) {
        if (!startTime) return '';
        const [hourStr, minuteStr] = startTime.split(':');
        const hour = parseInt(hourStr, 10);
        const endHour = (hour + 1) % 24;
        const endTime = `${String(endHour).padStart(2, '0')}:${minuteStr}`;
        return `${startTime}-${endTime}`;
    }

    function saveAndRender() {
        localStorage.setItem('scheduleAppState', JSON.stringify(state));
        render();
    }

    function loadState() {
        const savedState = localStorage.getItem('scheduleAppState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            parsedState.currentDisplayDate = new Date(parsedState.currentDisplayDate);
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