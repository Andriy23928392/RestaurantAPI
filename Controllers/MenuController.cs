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
        public async Task<IActionResult> ToggleAvailability(int id)
        {
            var dish = await _context.Dishes.FindAsync(id);
            if (dish == null) return NotFound();

            dish.IsAvailable = !dish.IsAvailable;
            await _context.SaveChangesAsync();

            return Ok(dish);
        }

        [HttpPost("add")]
        public async Task<IActionResult> CreateDish([FromForm] string name, [FromForm] string description, [FromForm] string category, [FromForm] decimal price, [FromForm] int calories, IFormFile? imageFile)
        {
            string imageUrl = "/images/default.jpg";

            if (imageFile != null && imageFile.Length > 0)
            {
                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(imageFile.FileName);
                var imagesFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images");

                if (!Directory.Exists(imagesFolder)) Directory.CreateDirectory(imagesFolder);

                var filePath = Path.Combine(imagesFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await imageFile.CopyToAsync(stream);
                }

                imageUrl = "/images/" + fileName;
            }

            var dish = new Dish
            {
                Name = name,
                Description = description,
                Category = category,
                Price = price,
                Calories = calories,
                ImageUrl = imageUrl,
                IsAvailable = true
            };

            _context.Dishes.Add(dish);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Страву успішно додано!", data = dish });
        }
    }
}