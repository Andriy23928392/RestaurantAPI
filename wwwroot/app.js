document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
    setupReservationForm();
    setupTheme();
    setupSearch();
});

let allDishes = [];
let cart = [];
let currentDiscount = 0;

function setupTheme() {
    const toggleBtn = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
        toggleBtn.textContent = '☀️';
    }

    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        let theme = 'light';
        if (document.body.classList.contains('dark-theme')) {
            theme = 'dark';
            toggleBtn.textContent = '☀️';
        } else {
            toggleBtn.textContent = '🌙';
        }
        localStorage.setItem('theme', theme);
    });
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        const filtered = allDishes.filter(dish => 
            dish.name.toLowerCase().includes(query) || 
            dish.category.toLowerCase().includes(query)
        );
        
        renderMenu(filtered, false); 
    });
}

function goToCheckout() {
    if (cart.length === 0) {
        alert('Ваш кошик порожній! Додайте страву для бронювання.');
        return;
    }
    document.getElementById('view-menu').classList.add('hidden');
    document.getElementById('view-checkout').classList.remove('hidden');
    window.scrollTo(0, 0); 
}

function goToMenu() {
    document.getElementById('view-checkout').classList.add('hidden');
    document.getElementById('view-menu').classList.remove('hidden');
    window.scrollTo(0, 0);
}

async function loadMenu() {
    try {
        const response = await fetch('/api/menu');
        if (!response.ok) throw new Error('Помилка сервера');
        allDishes = await response.json();
        
        renderMenu(allDishes, true); 
    } catch (error) {
        document.getElementById('menu-grid').innerHTML = '<p style="color: red;">Помилка завантаження меню.</p>';
    }
}

function renderMenu(dishes, buildSidebar = false) {
    const grid = document.getElementById('menu-grid');
    const sidebar = document.getElementById('category-sidebar');
    
    grid.innerHTML = ''; 
    if (buildSidebar && sidebar) sidebar.innerHTML = '';

    if (dishes.length === 0) {
        grid.innerHTML = '<p class="loading">Нічого не знайдено 🔍</p>';
        return;
    }

    const categories = dishes.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});

    for (const categoryName in categories) {
        const categoryId = `cat-${categoryName.replace(/\s+/g, '-')}`;

        if (buildSidebar && sidebar) {
            const link = document.createElement('a');
            link.href = `#${categoryId}`;
            link.className = 'sidebar-link';
            link.textContent = categoryName;
            sidebar.appendChild(link);
        }

        const sectionTitle = document.createElement('h2');
        sectionTitle.className = 'category-title';
        sectionTitle.id = categoryId;
        sectionTitle.textContent = categoryName;
        grid.appendChild(sectionTitle);

        const categoryGrid = document.createElement('div');
        categoryGrid.className = 'category-grid';

        categories[categoryName].forEach(item => {
            const card = document.createElement('div');
            card.className = `menu-card ${item.isAvailable ? '' : 'out-of-stock'}`;
            const bgImage = item.imageUrl ? `url('${item.imageUrl}')` : 'none';
            const clickAction = item.isAvailable ? `onclick="showDishDetails(${item.id})"` : '';
            
            const safeName = item.name.replace(/'/g, "\\'");
            const buttonHtml = item.isAvailable 
                ? `<button class="btn-primary btn-sm" onclick="addToCart(${item.id}, '${safeName}', ${item.price})">Додати</button>`
                : `<button class="btn-disabled btn-sm" disabled>Немає в наявності</button>`;
            
            card.innerHTML = `
                <div class="card-image" style="background-image: ${bgImage}" ${clickAction}></div> 
                <div class="card-content"> 
                    <h3>${item.name}</h3>
                    <p class="price">${item.price.toFixed(2)} грн</p>
                    ${buttonHtml}
                </div>
            `;
            categoryGrid.appendChild(card);
        });
        grid.appendChild(categoryGrid);
    }
}

function addToCart(id, name, price) {
    cart.push({ id, name, price });
    renderCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
    if (cart.length === 0 && !document.getElementById('view-checkout').classList.contains('hidden')) {
        alert('Кошик спорожнів. Повертаємось до меню!');
        goToMenu();
    }
}

function renderCart() {
    const cartItemsList = document.getElementById('cart-items');
    const totalPriceSpan = document.getElementById('total-price');
    const headerCartCount = document.getElementById('header-cart-count'); 
    
    cartItemsList.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsList.innerHTML = '<li class="empty-cart">Кошик порожній</li>';
        currentDiscount = 0; 
        const promoMsg = document.getElementById('promo-message');
        if(promoMsg) promoMsg.textContent = '';
        const promoInput = document.getElementById('promo-code-input');
        if(promoInput) promoInput.value = '';
    } else {
        cart.forEach((item, index) => {
            total += item.price;
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.name}</span>
                <span>
                    <strong>${item.price.toFixed(2)} грн</strong>
                    <button class="delete-btn" onclick="removeFromCart(${index})">✖</button>
                </span>
            `;
            cartItemsList.appendChild(li);
        });
    }

    if (headerCartCount) headerCartCount.textContent = cart.length; 

    if (totalPriceSpan) {
        if (currentDiscount > 0 && total > 0) {
            const discountedTotal = total - (total * currentDiscount);
            totalPriceSpan.innerHTML = `
                <span class="old-price">${total.toFixed(2)}</span>
                <span style="color: var(--primary-color);">${discountedTotal.toFixed(2)}</span>
                <span class="discount-text">-${currentDiscount * 100}%</span>
            `;
        } else {
            totalPriceSpan.textContent = total.toFixed(2);
        }
    }
}

function setupReservationForm() {
    const dateInput = document.getElementById('bookingDate');
    const form = document.getElementById('reservation-form');
    if (!form || !dateInput) return;

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dateInput.min = now.toISOString().slice(0, 16);

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const payload = {
            clientName: document.getElementById('clientName').value,
            phone: document.getElementById('phone').value,
            bookingDate: document.getElementById('bookingDate').value,
            guestsCount: parseInt(document.getElementById('guestsCount').value),
            dishIds: cart.map(item => item.id) 
        };

        try {
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                form.reset();
                cart = []; 
                renderCart();
                alert('✅ Столик успішно заброньовано! Замовлення надіслано в телеграм кухні.');
                goToMenu();
            } else {
                alert('Помилка валідації даних.');
            }
        } catch (error) {
            alert('Сервер не відповідає.');
        }
    });
}

function showDishDetails(id) {
    const dish = allDishes.find(d => d.id === id);
    if (!dish) return;
    document.getElementById('modalImg').src = dish.imageUrl || '';
    document.getElementById('modalTitle').textContent = dish.name;
    document.getElementById('modalDesc').textContent = dish.description;
    document.getElementById('modalCalories').textContent = dish.calories > 0 ? `🔥 Калорійність: ${dish.calories} ккал` : '';
    document.getElementById('dishModal').style.display = 'block';
}

function closeModal() { document.getElementById('dishModal').style.display = 'none'; }
window.onclick = function(event) {
    const modal = document.getElementById('dishModal');
    if (event.target === modal) closeModal();
};
function applyPromo() {
    const inputField = document.getElementById('promo-code-input');
    const msgObj = document.getElementById('promo-message');
    const code = inputField.value.trim().toUpperCase();

    if (cart.length === 0) {
        msgObj.textContent = 'Спочатку додайте страви в кошик!';
        msgObj.className = 'promo-msg promo-error';
        return;
    }

    const promoCodes = {
        'KP5X': 0.10,    
    };

    if (promoCodes[code]) {
        currentDiscount = promoCodes[code];
        msgObj.textContent = `✅ Промокод застосовано! Знижка ${currentDiscount * 100}%`;
        msgObj.className = 'promo-msg promo-success';
        renderCart(); 
    } else if (code === '') {
        msgObj.textContent = 'Введіть промокод';
        msgObj.className = 'promo-msg promo-error';
    } else {
        currentDiscount = 0;
        msgObj.textContent = '❌ Такого промокоду не існує';
        msgObj.className = 'promo-msg promo-error';
        renderCart();
    }
}