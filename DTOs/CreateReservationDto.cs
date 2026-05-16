using System.ComponentModel.DataAnnotations;

namespace RestaurantAPI.DTOs
{
    public class CreateReservationDto : IValidatableObject
    {
        [Required(ErrorMessage = "Ім'я є обов'язковим")]
        public string ClientName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Телефон є обов'язковим")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Дата є обов'язковою")]
        public DateTime BookingDate { get; set; }

        [Range(1, 20, ErrorMessage = "Кількість гостей має бути від 1 до 20 осіб!")]
        public int GuestsCount { get; set; }

        [Required(ErrorMessage = "Список страв обов'язковий")]
        public List<int> DishIds { get; set; } = new List<int>();

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (BookingDate < DateTime.Now)
            {
                yield return new ValidationResult(
                    "Машину часу ще не винайшли! Не можна забронювати столик у минулому.",
                    new[] { nameof(BookingDate) }
                );
            }

            if (DishIds == null || !DishIds.Any())
            {
                yield return new ValidationResult(
                    "Неможливо забронювати столик без замовлення страв! Додайте хоча б одну страву.",
                    new[] { nameof(DishIds) }
                );
            }
        }
    }
}