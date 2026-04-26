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

        public ReservationsController(RestaurantDbContext context)
        {
            _context = context;
        }


        [HttpGet]
        public async Task<ActionResult<IEnumerable<Reservation>>> GetReservations()
        {
            return await _context.Reservations.ToListAsync();
        }
        [HttpPost]

        [HttpPost]
        public async Task<ActionResult<Reservation>> CreateReservation(Reservation reservation)
        {
            _context.Reservations.Add(reservation);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Столик успішно заброньовано!", data = reservation });
        }
    }
}