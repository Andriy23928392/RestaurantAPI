document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('menu-tbody');
    const loginOverlay = document.getElementById('login-overlay');
    const loginBtn = document.getElementById('login-btn');
    const passInput = document.getElementById('chef-password');
    const errorMsg = document.getElementById('login-error');

    let jwtToken = sessionStorage.getItem('chefToken');

    if (jwtToken) {
        loginOverlay.classList.add('hidden');
        init();
    }

    loginBtn.addEventListener('click', async () => {
        const password = passInput.value;
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: password })
            });

            if (res.ok) {
                const data = await res.json();
                jwtToken = data.token;
                sessionStorage.setItem('chefToken', jwtToken); // Зберігаємо токен
                loginOverlay.classList.add('hidden');
                init();
            } else {
                errorMsg.style.display = 'block';
            }
        } catch (e) {
            alert('Помилка з\'єднання з сервером');
        }
    });

    async function init() {
        try {
            const response = await fetch('/api/menu');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const dishes = await response.json();
            renderTable(dishes);
            await loadReservations();
        } catch (error) {
            console.error('Помилка завантаження даних:', error);
            tableBody.innerHTML = `<tr><td colspan="5" class="error-message">Не вдалося завантажити меню.</td></tr>`;
        }
    }

    function renderTable(dishes) {
        tableBody.innerHTML = ''; 
        dishes.forEach(dish => {
            const row = document.createElement('tr');
            const statusText = dish.isAvailable ? 'В меню' : 'В стоп-листі';
            const statusClass = dish.isAvailable ? 'status-active' : 'status-inactive';
            const isChecked = dish.isAvailable ? 'checked' : '';

            row.innerHTML = `
                <td><img src="${dish.imageUrl}" alt="${dish.name}" class="dish-img" loading="lazy"></td>
                <td>
                    <div class="dish-name">${dish.name}</div>
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
                        <span class="status-label ${statusClass}" id="status-text-${dish.id}">
                            ${statusText}
                        </span>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
        attachToggleListeners();
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
                        headers: {
                            'Authorization': `Bearer ${jwtToken}`
                        }
                    });

                    if (response.status === 401) {
                        throw new Error('Немає доступу (Unauthorized)! Токен прострочений.');
                    }
                    if (!response.ok) throw new Error('Помилка сервера');

                    if (isNowAvailable) {
                        statusLabel.textContent = 'В меню';
                        statusLabel.className = 'status-label status-active';
                    } else {
                        statusLabel.textContent = 'В стоп-листі';
                        statusLabel.className = 'status-label status-inactive';
                    }
                } catch (error) {
                    alert(error.message);
                    checkbox.checked = !isNowAvailable; 
                    if (error.message.includes('401')) {
                        sessionStorage.removeItem('chefToken');
                        location.reload();
                    }
                }
            });
        });
    }

    async function loadReservations() {
        const tbody = document.getElementById('reservations-tbody');
        if (!tbody) return; 
        try {
            const response = await fetch('/api/reservations');
            if (!response.ok) throw new Error('Помилка сервера');
            const reservations = await response.json();
            reservations.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
            tbody.innerHTML = '';
            reservations.forEach(res => {
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
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="4" class="error-message">Не вдалося завантажити бронювання.</td></tr>`;
        }
    }
});