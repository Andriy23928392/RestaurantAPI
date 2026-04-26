using Microsoft.EntityFrameworkCore;
using RestaurantAPI.Models;

namespace RestaurantAPI.Data
{
    public class RestaurantDbContext : DbContext
    {
        public RestaurantDbContext(DbContextOptions<RestaurantDbContext> options) : base(options)
        {
        }


        public DbSet<Dish> Dishes { get; set; }
        public DbSet<Reservation> Reservations { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Dish>().HasData(
                new Dish { Id = 1, Name = "Стейк Рибай", Description = "Мармурова яловичина з розмарином", Price = 450.00m, Calories = 650, ImageUrl = "/images/steak.jpg", IsAvailable = true },
                new Dish { Id = 2, Name = "Салат Цезар", Description = "Класичний салат з куркою", Price = 180.50m, Calories = 320, ImageUrl = "/images/caesar.jpg", IsAvailable = true },
                new Dish { Id = 3, Name = "Тірамісу", Description = "Ніжний італійський десерт", Price = 120.00m, Calories = 450, ImageUrl = "/images/tiramisu.jpg", IsAvailable = true }
            );
        }
    }
}