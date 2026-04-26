using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace RestaurantAPI.Models
{
    public class Reservation : IValidatableObject
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "Ім'я є обов'язковим")]
        public string ClientName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Телефон є обов'язковим")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Дата є обов'язковою")]
        public DateTime BookingDate { get; set; }

        [Range(1, 20, ErrorMessage = "Кількість гостей має бути від 1 до 20 осіб!")]
        public int GuestsCount { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (BookingDate < DateTime.Now)
            {
                yield return new ValidationResult(
                    "Машину часу ще не винайшли! Не можна забронювати столик у минулому.",
                    new[] { nameof(BookingDate) }
                );
            }
        }
    }
}