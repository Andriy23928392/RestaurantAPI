using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantAPI.Data;
using RestaurantAPI.Models;

namespace RestaurantAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReservationsController : ControllerBase
    {
        private readonly RestaurantDbContext _context;
        private readonly IConfiguration _configuration;

        public ReservationsController(RestaurantDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Reservation>>> GetReservations()
        {
            return await _context.Reservations.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult> CreateReservation([FromBody] ReservationRequest payload)
        {
            var reservation = new Reservation
            {
                ClientName = payload.ClientName,
                Phone = payload.Phone,
                BookingDate = payload.BookingDate,
                GuestsCount = payload.GuestsCount
            };

            _context.Reservations.Add(reservation);
            await _context.SaveChangesAsync();

            var uniqueDishes = await _context.Dishes
                .Where(d => payload.DishIds.Contains(d.Id))
                .ToListAsync();

            var orderedDishes = payload.DishIds
                .Select(id => uniqueDishes.FirstOrDefault(d => d.Id == id))
                .Where(d => d != null)
                .ToList();

            _ = SendTelegramNotification(reservation, orderedDishes!);

            return Ok(new { message = "Столик успішно заброньовано!", data = reservation });
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReservation(int id)
        {
            var reservation = await _context.Reservations.FindAsync(id);
            if (reservation == null)
            {
                return NotFound(new { message = "Бронювання не знайдено" });
            }

            _context.Reservations.Remove(reservation);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Бронювання успішно видалено!" });
        }

        private async Task SendTelegramNotification(Reservation res, List<Dish> dishes)
        {
            try
            {
                var botToken = _configuration["TelegramBot:Token"];
                var chatId = _configuration["TelegramBot:ChatId"];

                if (string.IsNullOrEmpty(botToken) || string.IsNullOrEmpty(chatId)) return;

                string dishesText = dishes.Any()
                    ? string.Join(", ", dishes.Select(d => d.Name))
                    : "Тільки столик (без попереднього замовлення)";

                decimal totalSum = dishes.Sum(d => d.Price);
                string sumText = dishes.Any() ? $"\n💰 <b>Сума:</b> {totalSum} грн" : "";

                string message = $"🔔 <b>НОВА БРОНЬ!</b>\n\n" +
                                 $"👤 Ім'я: {res.ClientName}\n" +
                                 $"📞 Телефон: {res.Phone}\n" +
                                 $"📅 Дата: {res.BookingDate:dd.MM.yyyy HH:mm}\n" +
                                 $"👥 Гостей: {res.GuestsCount} осіб\n\n" +
                                 $"🍽 <b>Замовлення:</b>\n{dishesText}{sumText}";

                using var httpClient = new HttpClient();
                var url = $"https://api.telegram.org/bot{botToken}/sendMessage?chat_id={chatId}&text={Uri.EscapeDataString(message)}&parse_mode=HTML";

                await httpClient.GetAsync(url);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Помилка відправки в Telegram: {ex.Message}");
            }
        }
    }

    public class ReservationRequest
    {
        public string ClientName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public DateTime BookingDate { get; set; }
        public int GuestsCount { get; set; }
        public List<int> DishIds { get; set; } = new(); 
    }
}