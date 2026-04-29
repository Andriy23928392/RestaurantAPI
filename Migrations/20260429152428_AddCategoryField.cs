using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Dishes",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Dishes",
                keyColumn: "Id",
                keyValue: 1,
                column: "Category",
                value: "Основне");

            migrationBuilder.UpdateData(
                table: "Dishes",
                keyColumn: "Id",
                keyValue: 2,
                column: "Category",
                value: "Основне");

            migrationBuilder.UpdateData(
                table: "Dishes",
                keyColumn: "Id",
                keyValue: 3,
                column: "Category",
                value: "Основне");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "Dishes");
        }
    }
}
