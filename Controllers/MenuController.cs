using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantAPI.Data;
using RestaurantAPI.Models;

namespace RestaurantAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MenuController : ControllerBase
    {
        private readonly RestaurantDbContext _context;


        public MenuController(RestaurantDbContext context)
        {
            _context = context;
        }


        [HttpGet]
        public async Task<ActionResult<IEnumerable<Dish>>> GetMenu()
        {
            return await _context.Dishes.ToListAsync();
        }


        [HttpPut("{id}/toggle")]
        public async Task<IActionResult> ToggleDishStatus(int id)
        {

            var dish = await _context.Dishes.FindAsync(id);
            if (dish == null)
            {
                return NotFound("Страву не знайдено");
            }


            dish.IsAvailable = !dish.IsAvailable;

   
            await _context.SaveChangesAsync();

            return Ok(new { message = "Статус страви успішно змінено", currentStatus = dish.IsAvailable });
        }
    }
}