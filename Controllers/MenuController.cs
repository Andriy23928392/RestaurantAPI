using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantAPI.Data;
using RestaurantAPI.DTOs;
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
        public async Task<ActionResult<IEnumerable<MenuResponseDto>>> GetMenu()
        {
            var menu = await _context.Dishes
                .Select(d => new MenuResponseDto
                {
                    Id = d.Id,
                    Name = d.Name,
                    Description = d.Description,
                    Category = d.Category,
                    Price = d.Price,
                    Calories = d.Calories,
                    ImageUrl = d.ImageUrl,
                    IsAvailable = d.IsAvailable 
                })
                .ToListAsync();

            return Ok(menu);
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
        [HttpPost]
        public async Task<ActionResult<Dish>> CreateDish(Dish dish)
        {
            _context.Dishes.Add(dish);
            await _context.SaveChangesAsync();

            return Ok(dish);
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDish(int id, Dish updatedDish)
        {
            if (id != updatedDish.Id)
            {
                return BadRequest("ID у шляху не співпадає з ID у тілі запиту!");
            }

            var existingDish = await _context.Dishes.FindAsync(id);
            if (existingDish == null)
            {
                return NotFound("Страву не знайдено");
            }

            existingDish.Name = updatedDish.Name;
            existingDish.Description = updatedDish.Description;
            existingDish.Price = updatedDish.Price;
            existingDish.Calories = updatedDish.Calories;
            existingDish.Category = updatedDish.Category;
            existingDish.ImageUrl = updatedDish.ImageUrl;
            existingDish.IsAvailable = updatedDish.IsAvailable;

            await _context.SaveChangesAsync();

            return Ok(existingDish);
        }
    }
}