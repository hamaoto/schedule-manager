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
                <span><strong>${student.name}</strong> (${getDayOfWeekJP(student.dayOfWeek)} ${student.startTime})</span>
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
            dayHeader.textContent = `${date.getDate()}(${getDayOfWeekJP(dayOfWeek)})`;
            dayCell.appendChild(dayHeader);
            
            const appointments = state.changes[dateString] || state.students.filter(s => s.dayOfWeek == dayOfWeek);
            appointments.forEach(appt => {
                const appointmentEl = document.createElement('div');
                appointmentEl.className = 'appointment';
                // ▼▼▼ ここから変更 ▼▼▼
                // 右クリックで情報を取得できるよう、data属性を付与
                appointmentEl.dataset.name = appt.name;
                appointmentEl.dataset.date = dateString;
                // ▲▲▲ ここまで変更 ▲▲▲
                appointmentEl.textContent = `${appt.startTime} ${appt.name}`;
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
    
    // ▼▼▼ ここから追記 ▼▼▼
    // カレンダーの右クリックイベント
    calendarGridEl.addEventListener('contextmenu', e => {
        e.preventDefault(); // デフォルトの右クリックメニューをキャンセル
        
        const appointmentEl = e.target.closest('.appointment');
        if (!appointmentEl) return; // 予定以外の場所なら何もしない

        const studentName = appointmentEl.dataset.name;
        const dateString = appointmentEl.dataset.date;

        if (confirm(`${dateString} の ${studentName} の予定を消去しますか？`)) {
            // その日に「変更」がすでにある場合
            if (state.changes[dateString]) {
                state.changes[dateString] = state.changes[dateString].filter(
                    appt => appt.name !== studentName
                );
            } else {
            // 「変更」がなく、デフォルトの予定だった場合
                const date = new Date(`${dateString}T00:00:00`);
                const dayOfWeek = date.getDay();
                // その曜日のデフォルト予定から、クリックされた生徒を除外したリストを作成
                const remainingAppointments = state.students.filter(student => {
                    return student.dayOfWeek == dayOfWeek && student.name !== studentName;
                });
                // 「変更」として保存することで、デフォルトの予定を上書き
                state.changes[dateString] = remainingAppointments;
            }
            saveAndRender();
        }
    });
    // ▲▲▲ ここまで追記 ▲▲▲

    function updateReport(name, date, time) {
        if (!state.reportText.startsWith('「次回予定変更')) {
            state.reportText = '「次回予定変更';
        }
        const changeDate = new Date(`${date}T00:00:00`);
        const dayJP = getDayOfWeekJP(changeDate.getDay());
        const endHour = parseInt(time.split(':')[0]) + 1;
        const endTime = `${String(endHour).padStart(2, '0')}:${time.split(':')[1]}`;
        const newEntry = ` ${changeDate.getMonth() + 1}/${changeDate.getDate()}(${dayJP}) ${time}-${endTime} ${name}`;
        state.reportText = state.reportText.replace('」', '') + newEntry + '」';
    }
    
    // ======== 5. ヘルパー関数と初期化 ========
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