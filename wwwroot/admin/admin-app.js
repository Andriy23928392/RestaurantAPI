document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('menu-tbody');
    const loginOverlay = document.getElementById('login-overlay');
    
    const tabMenu = document.getElementById('tab-menu');
    const tabRes = document.getElementById('tab-reservations');
    const secMenu = document.getElementById('section-menu');
    const secRes = document.getElementById('section-reservations');

    let jwtToken = sessionStorage.getItem('chefToken');
    let reservationsData = []; 

    if (jwtToken) {
        loginOverlay.classList.add('hidden');
        init();
    }

    document.getElementById('login-btn').addEventListener('click', async () => {
        const password = document.getElementById('chef-password').value;
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: password })
            });

            if (res.ok) {
                const data = await res.json();
                jwtToken = data.token || data.Token || data.value; 
                
                if (!jwtToken) {
                    alert('❌ Помилка: Сервер не передав токен авторизації.');
                    return;
                }

                sessionStorage.setItem('chefToken', jwtToken); 
                loginOverlay.classList.add('hidden');
                init();
            } else {
                document.getElementById('login-error').style.display = 'block';
            }
        } catch (e) {
            alert('Помилка з\'єднання з сервером');
        }
    });

    tabMenu.onclick = () => {
        tabMenu.classList.add('active');
        tabRes.classList.remove('active');
        secMenu.classList.remove('hidden');
        secRes.classList.add('hidden');
    };

    tabRes.onclick = () => {
        tabRes.classList.add('active');
        tabMenu.classList.remove('active');
        secRes.classList.remove('hidden');
        secMenu.classList.add('hidden');
    };

    async function init() {
        try {
            await loadMenuData();
            await loadReservations();
            setupExportHandler();
        } catch (error) {
            console.error(error);
        }
    }

    async function loadMenuData() {
        const response = await fetch('/api/menu');
        if (!response.ok) return;
        const dishes = await response.json();
        renderTable(dishes);
    }

    function renderTable(dishes) {
        tableBody.innerHTML = ''; 
        dishes.forEach(dish => {
            const row = document.createElement('tr');
            const statusText = dish.isAvailable ? 'В меню' : 'В стоп-листі';
            const statusClass = dish.isAvailable ? 'status-active' : 'status-inactive';
            const isChecked = dish.isAvailable ? 'checked' : '';

            row.innerHTML = `
                <td><img src="${dish.imageUrl}" class="dish-img"></td>
                <td>
                    <div class="dish-name">${dish.name} <span style="font-size:0.75rem; color:#bb86fc; background:#222; padding:2px 6px; border-radius:10px;">${dish.category}</span></div>
                    <div class="dish-desc">${dish.description}</div>
                </td>
                <td>${dish.price.toFixed(2)}</td>
                <td>${dish.calories}</td>
                <td>
                    <div class="status-wrapper">
                        <label class="switch">
                            <input type="checkbox" class="toggle-availability" data-id="${dish.id}" ${isChecked}>
                            <span class="slider"></span>
                        </label>
                        <span class="status-label ${statusClass}" id="status-text-${dish.id}">${statusText}</span>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        attachToggleListeners();
    }

    function setupExportHandler() {
        document.getElementById('export-excel-btn').onclick = () => {
            if (reservationsData.length === 0) return alert('Немає даних!');
            let csvContent = "Ім'я Клієнта;Телефон;Дата та Час;Кількість Гостей\n";
            reservationsData.forEach(res => {
                const date = new Date(res.bookingDate).toLocaleString('uk-UA');
                csvContent += `${res.clientName};${res.phone};${date};${res.guestsCount} осіб\n`;
            });
            const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const tempLink = document.createElement('a');
            tempLink.href = url;
            tempLink.setAttribute('download', `Звіт_${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
        };
    }

    function attachToggleListeners() {
        const toggles = document.querySelectorAll('.toggle-availability');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', async (event) => { 
                const checkbox = event.target;
                const dishId = checkbox.getAttribute('data-id');
                const isNowAvailable = checkbox.checked;
                const statusLabel = document.getElementById(`status-text-${dishId}`);

                try {
                    const response = await fetch(`/api/menu/${dishId}/toggle`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${jwtToken}` }
                    });

                    if (!response.ok) throw new Error('Помилка сервера');
                    if (isNowAvailable) {
                        statusLabel.textContent = 'В меню';
                        statusLabel.className = 'status-label status-active';
                    } else {
                        statusLabel.textContent = 'В стоп-листі';
                        statusLabel.className = 'status-label status-inactive';
                    }
                } catch (error) {
                    checkbox.checked = !isNowAvailable; 
                }
            });
        });
    }

    async function loadReservations() {
        const tbody = document.getElementById('reservations-tbody');
        if (!tbody) return; 
        try {
            const response = await fetch('/api/reservations');
            if (!response.ok) return;
            
            reservationsData = await response.json(); 
            
            const totalBookings = reservationsData.length;
            const totalGuests = reservationsData.reduce((sum, res) => sum + res.guestsCount, 0);
            const avgGuests = totalBookings > 0 ? (totalGuests / totalBookings).toFixed(1) : 0;

            document.getElementById('stat-bookings').textContent = totalBookings;
            document.getElementById('stat-guests').textContent = totalGuests;
            document.getElementById('stat-avg').textContent = `${avgGuests} ос.`;

            reservationsData.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
            tbody.innerHTML = '';
            reservationsData.forEach(res => {
                const row = document.createElement('tr');
                const date = new Date(res.bookingDate).toLocaleString('uk-UA');
                row.innerHTML = `
                    <td><strong>${res.clientName}</strong></td>
                    <td>${res.phone}</td>
                    <td>${date}</td>
                    <td><span class="user-badge">${res.guestsCount} осіб</span></td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {}
    }
});