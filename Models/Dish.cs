using System.ComponentModel.DataAnnotations;

namespace RestaurantAPI.Models
{
    public class Dish
    {

        [Key]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = "Основне";


        [Range(0.01, 100000, ErrorMessage = "Ціна не може бути нульовою або від'ємною!")]
        public decimal Price { get; set; }

        [Range(0, 5000, ErrorMessage = "Калорії не можуть бути від'ємними!")]
        public int Calories { get; set; }

        public string ImageUrl { get; set; } = string.Empty;

        public bool IsAvailable { get; set; } = true;
    }
}