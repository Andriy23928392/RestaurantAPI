using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantAPI.Data;
using RestaurantAPI.Models;

namespace RestaurantAPI.Controllers
{
    [Route("api/[controller]")] // Автоматично створює маршрут /api/reservations
    [ApiController]
    public class ReservationsController : ControllerBase
    {
        private readonly RestaurantDbContext _context;

        public ReservationsController(RestaurantDbContext context)
        {
            _context = context;
        }

        // 1. ОТРИМАТИ ВСІ БРОНЮВАННЯ (щоб ти міг перевірити, чи вони зберігаються)
        // Запит: GET /api/reservations
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Reservation>>> GetReservations()
        {
            return await _context.Reservations.ToListAsync();
        }
        [HttpPost]
        // 2. СТВОРИТИ НОВЕ БРОНЮВАННЯ (Сюди буде стукати фронтенд)
        // Запит: POST /api/reservations
        [HttpPost]
        public async Task<ActionResult<Reservation>> CreateReservation(Reservation reservation)
        {
            // Додаємо нову броню в базу
            _context.Reservations.Add(reservation);

            // Зберігаємо зміни
            await _context.SaveChangesAsync();

            // Повертаємо успішну відповідь 200 OK з повідомленням
            return Ok(new { message = "Столик успішно заброньовано!", data = reservation });
        }
    }
}