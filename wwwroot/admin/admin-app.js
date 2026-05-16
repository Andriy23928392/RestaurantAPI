document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('menu-tbody');

    async function init() {
        try {
            const response = await fetch('/api/menu');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const dishes = await response.json();
            renderTable(dishes);

            // Викликаємо завантаження бронювань після меню
            await loadReservations();
            
        } catch (error) {
            console.error('Помилка завантаження даних:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="error-message">
                        Не вдалося завантажити меню. Перевір консоль.
                    </td>
                </tr>
            `;
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
                        method: 'PUT'
                    });

                    if (!response.ok) {
                        throw new Error('Помилка сервера');
                    }

                    if (isNowAvailable) {
                        statusLabel.textContent = 'В меню';
                        statusLabel.className = 'status-label status-active';
                    } else {
                        statusLabel.textContent = 'В стоп-листі';
                        statusLabel.className = 'status-label status-inactive';
                    }
                } catch (error) {
                    alert('Не вдалося змінити статус в базі даних. Сервер не відповідає.');
                    checkbox.checked = !isNowAvailable; 
                }
            });
        });
    }

    // НОВА ФУНКЦІЯ: Завантаження бронювань
    async function loadReservations() {
        const tbody = document.getElementById('reservations-tbody');
        if (!tbody) return; // Захист, якщо таблиці ще немає в HTML
        
        try {
            const response = await fetch('/api/reservations');
            if (!response.ok) throw new Error('Помилка сервера');
            
            const reservations = await response.json();
            
            // Сортуємо: найновіші бронювання будуть зверху
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

    init(); 
});